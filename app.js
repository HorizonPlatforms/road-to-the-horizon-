const APP_VERSION = "2.0.0";
const STORAGE_KEY = "travelLifeOSState";
const SESSION_STORAGE_KEY = `${STORAGE_KEY}:session`;
const TABLE_NAME = "life_os_states";

const today = () => new Date().toISOString().slice(0, 10);
const uid = (prefix = "id") => `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
const money = (value) => `£${Number(value || 0).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const num = (value) => Math.round((Number(value) || 0) * 100) / 100;
const field = (form, name) => form.elements.namedItem(name);

let supabaseClient = null;
let currentUser = null;
let cloudReady = false;
let saveTimer = null;
let activeView = "finance";

const defaultState = () => ({
  version: APP_VERSION,
  settings: {
    rootName: "Total Money"
  },
  finance: {
    rootPotId: "root",
    pots: [
      {
        id: "root",
        parentId: null,
        role: "root",
        name: "Total Money",
        description: "Complete amount of money in the system.",
        color: "#2f6f62",
        balance: 0,
        archived: false,
        order: 0
      }
    ],
    transactions: [],
    budgetPeriods: []
  },
  travel: {
    routeNotes: "",
    checklist: []
  },
  journal: {
    entries: []
  },
  planning: {},
  metadata: {
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastSyncedAt: null
  }
});

let state = loadLocalState();

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function migrateState(input) {
  const base = defaultState();
  const next = { ...base, ...(input || {}) };
  next.settings = { ...base.settings, ...(input?.settings || {}) };
  next.finance = { ...base.finance, ...(input?.finance || {}) };
  next.travel = { ...base.travel, ...(input?.travel || {}) };
  next.journal = { ...base.journal, ...(input?.journal || {}) };
  next.planning = { ...base.planning, ...(input?.planning || {}) };
  next.metadata = { ...base.metadata, ...(input?.metadata || {}) };
  next.finance.pots = Array.isArray(next.finance.pots) ? next.finance.pots : clone(base.finance.pots);
  next.finance.transactions = Array.isArray(next.finance.transactions) ? next.finance.transactions : [];
  next.finance.budgetPeriods = Array.isArray(next.finance.budgetPeriods) ? next.finance.budgetPeriods : [];
  next.travel.checklist = Array.isArray(next.travel.checklist) ? next.travel.checklist : [];
  next.journal.entries = Array.isArray(next.journal.entries) ? next.journal.entries : [];
  if (!next.finance.pots.some((pot) => pot.id === next.finance.rootPotId)) next.finance.pots.unshift(clone(base.finance.pots[0]));
  rootPot().role = "root";
  rootPot().parentId = null;
  rootPot().archived = false;
  next.version = APP_VERSION;
  return next;
}

function loadLocalState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(SESSION_STORAGE_KEY);
    return migrateState(saved ? JSON.parse(saved) : null);
  } catch {
    return defaultState();
  }
}

function saveLocal() {
  state.metadata.updatedAt = new Date().toISOString();
  const serialized = JSON.stringify(state);
  localStorage.setItem(STORAGE_KEY, serialized);
  sessionStorage.setItem(SESSION_STORAGE_KEY, serialized);
  setSaveStatus(`Saved locally ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`);
}

function save() {
  saveLocal();
  scheduleCloudSave();
}

function setSaveStatus(text) {
  const node = document.getElementById("saveStatus");
  if (node) node.textContent = text;
}

function setAuthStatus(text) {
  document.getElementById("authStatus").textContent = text;
}

function scheduleCloudSave() {
  if (!cloudReady || !currentUser || !supabaseClient) return;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveCloud, 700);
}

async function saveCloud() {
  if (!currentUser || !supabaseClient) return;
  try {
    setSaveStatus("Saving to cloud...");
    const payload = {
      user_id: currentUser.id,
      state,
      updated_at: new Date().toISOString()
    };
    const { error } = await supabaseClient.from(TABLE_NAME).upsert(payload, { onConflict: "user_id" });
    if (error) throw error;
    state.metadata.lastSyncedAt = new Date().toISOString();
    saveLocal();
    setSaveStatus("Cloud synced");
  } catch (error) {
    setSaveStatus(`Cloud save failed: ${error.message || "unknown error"}`);
  }
}

async function loadCloud() {
  if (!currentUser || !supabaseClient) return;
  const { data, error } = await supabaseClient.from(TABLE_NAME).select("state").eq("user_id", currentUser.id).maybeSingle();
  if (error) throw error;
  if (data?.state) {
    state = migrateState(data.state);
    saveLocal();
  } else {
    await saveCloud();
  }
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.onload = resolve;
    script.onerror = () => reject(new Error("Could not load external script"));
    document.head.appendChild(script);
  });
}

async function initSupabase() {
  const config = window.APP_CONFIG || {};
  if (!config.SUPABASE_URL || !config.SUPABASE_PUBLISHABLE_KEY) {
    setAuthStatus("Supabase config not found. Offline mode is available.");
    return;
  }
  if (!window.supabase) {
    try {
      await loadScript("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2");
    } catch {
      setAuthStatus("Supabase SDK could not load. Offline mode is available.");
      return;
    }
  }
  supabaseClient = window.supabase.createClient(config.SUPABASE_URL, config.SUPABASE_PUBLISHABLE_KEY);
  supabaseClient.auth.getSession().then(async ({ data }) => {
    if (data?.session?.user) await handleSignedIn(data.session.user);
    else setAuthStatus("Ready to sign in.");
  }).catch((error) => setAuthStatus(`Session check failed: ${error.message}`));
  supabaseClient.auth.onAuthStateChange((_event, session) => {
    if (session?.user) handleSignedIn(session.user);
    else handleSignedOut();
  });
}

async function handleSignedIn(user) {
  currentUser = user;
  cloudReady = true;
  setAuthStatus(`Signed in as ${user.email}`);
  document.getElementById("authShell").hidden = true;
  document.getElementById("appShell").hidden = false;
  try {
    await loadCloud();
    render();
    setSaveStatus("Cloud loaded");
  } catch (error) {
    setSaveStatus(`Cloud load failed: ${error.message || "offline fallback active"}`);
    render();
  }
}

function handleSignedOut() {
  currentUser = null;
  cloudReady = false;
  document.getElementById("syncDetail").textContent = "Local storage is active.";
}

function rootPot() {
  return state.finance.pots.find((pot) => pot.id === state.finance.rootPotId) || state.finance.pots[0];
}

function potById(id) {
  return state.finance.pots.find((pot) => pot.id === id);
}

function childrenOf(parentId, includeArchived = false) {
  return state.finance.pots
    .filter((pot) => pot.parentId === parentId && (includeArchived || !pot.archived))
    .sort((a, b) => (a.order || 0) - (b.order || 0));
}

function potTotal(id) {
  const pot = potById(id);
  if (!pot) return 0;
  return num((pot.balance || 0) + childrenOf(id, true).reduce((sum, child) => sum + potTotal(child.id), 0));
}

function flatPots(includeArchived = false) {
  const rows = [];
  const walk = (id, depth) => {
    const pot = potById(id);
    if (!pot || (!includeArchived && pot.archived)) return;
    rows.push({ ...pot, depth, total: potTotal(id) });
    childrenOf(id, includeArchived).forEach((child) => walk(child.id, depth + 1));
  };
  walk(state.finance.rootPotId, 0);
  return rows;
}

function wouldCreateCycle(potId, parentId) {
  let current = parentId;
  while (current) {
    if (current === potId) return true;
    current = potById(current)?.parentId || null;
  }
  return false;
}

function adjustBalance(potId, delta) {
  const pot = potById(potId);
  if (!pot) throw new Error("Pot not found");
  pot.balance = num((pot.balance || 0) + delta);
}

function transactionEffects(transaction) {
  const amount = num(transaction.amount);
  if (!amount) return [];
  if (transaction.type === "root-income") return [{ potId: state.finance.rootPotId, delta: amount }];
  if (transaction.type === "root-expense") return [{ potId: state.finance.rootPotId, delta: -amount }];
  if (transaction.type === "spend") return [{ potId: transaction.potId, delta: -amount }];
  if (transaction.type === "transfer") return [
    { potId: transaction.fromPot, delta: -amount },
    { potId: transaction.toPot, delta: amount }
  ];
  return [];
}

function applyTransaction(transaction, direction = 1) {
  transactionEffects(transaction).forEach((effect) => adjustBalance(effect.potId, effect.delta * direction));
}

function addTransaction(transaction) {
  const clean = { id: uid("txn"), date: today(), note: "", ...transaction, amount: num(transaction.amount) };
  applyTransaction(clean, 1);
  state.finance.transactions.unshift(clean);
  save();
  render();
}

function updateTransaction(id, changes) {
  const index = state.finance.transactions.findIndex((item) => item.id === id);
  if (index < 0) return;
  const oldTransaction = state.finance.transactions[index];
  applyTransaction(oldTransaction, -1);
  const next = { ...oldTransaction, ...changes, amount: num(changes.amount) };
  applyTransaction(next, 1);
  state.finance.transactions[index] = next;
  save();
  render();
}

function deleteTransaction(id) {
  const index = state.finance.transactions.findIndex((item) => item.id === id);
  if (index < 0) return;
  const [transaction] = state.finance.transactions.splice(index, 1);
  applyTransaction(transaction, -1);
  save();
  render();
}

function activeBudgetPeriod() {
  const current = today();
  return state.finance.budgetPeriods.find((period) => period.startDate <= current && period.endDate >= current) || state.finance.budgetPeriods[0] || null;
}

function daysBetween(start, end) {
  const a = new Date(`${start}T00:00:00`);
  const b = new Date(`${end}T00:00:00`);
  if (Number.isNaN(+a) || Number.isNaN(+b)) return null;
  return Math.max(1, Math.ceil((b - a) / 86400000) + 1);
}

function budgetPace() {
  const period = activeBudgetPeriod();
  if (!period) return null;
  const total = potTotal(period.potId);
  const days = daysBetween(today(), period.endDate);
  if (!days) return { period, total, days: null, daily: null, weekly: null };
  return { period, total, days, daily: total / days, weekly: (total / days) * 7 };
}

function render() {
  renderNavigation();
  renderFinance();
  renderTravel();
  renderJournal();
  renderSettings();
  document.getElementById("versionText").textContent = APP_VERSION;
}

function renderNavigation() {
  document.querySelectorAll(".nav-link").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === activeView);
  });
  document.querySelectorAll(".view").forEach((view) => {
    const isActive = view.id === `${activeView}View`;
    view.classList.toggle("active", isActive);
    view.toggleAttribute("inert", !isActive);
  });
  document.getElementById("pageTitle").textContent = document.querySelector(".view.active")?.dataset.title || "Travel Life OS";
}

function renderFinance() {
  const root = rootPot();
  const pace = budgetPace();
  document.getElementById("financeSummary").innerHTML = [
    ["Total money", money(potTotal(root.id)), "Everything inside the root pot."],
    ["Root unallocated", money(root.balance), "Money not allocated to child pots."],
    ["Pots", state.finance.pots.filter((pot) => pot.id !== root.id && !pot.archived).length, "Active user-created pots."],
    ["Safe spend", pace?.daily ? `${money(pace.daily)} / day` : "Not set", pace ? `${pace.period.title || "Budget period"} ends ${pace.period.endDate}` : "Create a budget period."]
  ].map(([label, value, help]) => `<div class="metric"><span class="muted">${label}</span><strong>${value}</strong><p class="muted">${help}</p></div>`).join("");
  renderPotTree();
  renderPotSelects();
  renderTransactions();
}

function renderPotTree() {
  const list = document.getElementById("potTree");
  const rows = flatPots(true);
  list.innerHTML = rows.map((pot) => `
    <div class="row">
      <div class="row-title" style="padding-left:${pot.depth * 18}px">
        <strong>${escapeHtml(pot.name)}</strong>
        <span class="muted">${escapeHtml(pot.description || (pot.role === "root" ? "Root pot" : "Pot"))}</span>
        ${pot.archived ? '<span class="pill">Archived</span>' : ""}
      </div>
      <span>${money(pot.balance)}</span>
      <span>${money(pot.total)}</span>
      <span>${pot.parentId ? escapeHtml(potById(pot.parentId)?.name || "Missing parent") : "Root"}</span>
      <div class="actions">
        <button class="secondary small" type="button" data-pot-edit="${pot.id}">Edit</button>
        ${pot.role === "root" ? "" : `<button class="secondary small" type="button" data-pot-child="${pot.id}">Child</button><button class="danger small" type="button" data-pot-delete="${pot.id}">${pot.archived ? "Delete" : "Archive"}</button>`}
      </div>
    </div>
  `).join("") || '<div class="empty">No pots yet.</div>';
}

function renderPotSelects() {
  const options = flatPots().map((pot) => `<option value="${pot.id}">${"&nbsp;".repeat(pot.depth * 2)}${escapeHtml(pot.name)} (${money(pot.total)})</option>`).join("");
  document.querySelectorAll("[data-pot-select]").forEach((select) => { select.innerHTML = options; });
  document.querySelectorAll("[data-parent-select]").forEach((select) => {
    const editingId = document.querySelector("#potForm [name='id']").value;
    select.innerHTML = flatPots().filter((pot) => pot.id !== editingId && !wouldCreateCycle(editingId, pot.id)).map((pot) => `<option value="${pot.id}">${"&nbsp;".repeat(pot.depth * 2)}${escapeHtml(pot.name)}</option>`).join("");
  });
}

function renderTransactions() {
  const list = document.getElementById("transactionList");
  list.innerHTML = state.finance.transactions.map((txn) => `
    <div class="row">
      <div class="row-title"><strong>${escapeHtml(transactionLabel(txn))}</strong><span class="muted">${escapeHtml(txn.note || "No note")}</span></div>
      <span>${escapeHtml(txn.date || "")}</span>
      <span>${money(txn.amount)}</span>
      <span>${escapeHtml(transactionPotLabel(txn))}</span>
      <div class="actions">
        <button class="secondary small" type="button" data-txn-edit="${txn.id}">Edit</button>
        <button class="danger small" type="button" data-txn-delete="${txn.id}">Delete</button>
      </div>
    </div>
  `).join("") || '<div class="empty">No transactions yet.</div>';
}

function transactionLabel(txn) {
  return ({ "root-income": "Added money", "root-expense": "Removed money", transfer: "Transfer", spend: "Spending" })[txn.type] || "Transaction";
}

function transactionPotLabel(txn) {
  if (txn.type === "transfer") return `${potById(txn.fromPot)?.name || "Unknown"} to ${potById(txn.toPot)?.name || "Unknown"}`;
  return potById(txn.potId || state.finance.rootPotId)?.name || rootPot().name;
}

function renderTravel() {
  document.querySelector("#travelNotesForm [name='routeNotes']").value = state.travel.routeNotes || "";
  const list = document.getElementById("checklistList");
  list.innerHTML = state.travel.checklist.map((task) => `
    <div class="row two">
      <label class="row-title"><input type="checkbox" data-task-toggle="${task.id}" ${task.done ? "checked" : ""}> <strong>${escapeHtml(task.title)}</strong><span class="muted">${task.dueDate || "No due date"}</span></label>
      <div class="actions">
        <button class="secondary small" type="button" data-task-edit="${task.id}">Edit</button>
        <button class="danger small" type="button" data-task-delete="${task.id}">Delete</button>
      </div>
    </div>
  `).join("") || '<div class="empty">No preparation tasks yet.</div>';
}

function renderJournal() {
  const form = document.getElementById("journalForm");
  if (!field(form, "date").value) field(form, "date").value = today();
  const list = document.getElementById("journalList");
  list.innerHTML = state.journal.entries.map((entry) => `
    <div class="row two">
      <div class="row-title"><strong>${escapeHtml(entry.title || entry.date)}</strong><span class="muted">${escapeHtml([entry.date, (entry.tags || []).join(", ")].filter(Boolean).join(" - "))}</span></div>
      <div class="actions">
        <button class="secondary small" type="button" data-entry-edit="${entry.id}">Edit</button>
        <button class="danger small" type="button" data-entry-delete="${entry.id}">Delete</button>
      </div>
    </div>
  `).join("") || '<div class="empty">No journal entries yet.</div>';
}

function renderSettings() {
  document.getElementById("syncDetail").textContent = currentUser ? `Signed in as ${currentUser.email}. Cloud sync is active.` : "Local storage is active. Sign in to sync with Supabase.";
}

function openPotDialog(potId = null, parentId = state.finance.rootPotId) {
  const pot = potId ? potById(potId) : null;
  const form = document.getElementById("potForm");
  field(form, "id").value = pot?.id || "";
  field(form, "name").value = pot?.name || "";
  field(form, "description").value = pot?.description || "";
  field(form, "color").value = pot?.color || "#3f7d6d";
  renderPotSelects();
  field(form, "parentId").value = pot?.parentId || parentId;
  document.getElementById("potDialogTitle").textContent = pot ? "Edit pot" : "Create pot";
  document.getElementById("potDialog").showModal();
}

function openTransactionDialog(id) {
  const txn = state.finance.transactions.find((item) => item.id === id);
  if (!txn) return;
  const form = document.getElementById("transactionEditForm");
  field(form, "id").value = txn.id;
  field(form, "type").value = txn.type;
  field(form, "fromPot").value = txn.fromPot || state.finance.rootPotId;
  field(form, "toPot").value = txn.toPot || state.finance.rootPotId;
  field(form, "potId").value = txn.potId || state.finance.rootPotId;
  field(form, "amount").value = txn.amount;
  field(form, "date").value = txn.date || today();
  field(form, "note").value = txn.note || "";
  document.getElementById("transactionDialog").showModal();
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);
}

function setupEvents() {
  document.querySelectorAll(".nav-link").forEach((button) => button.addEventListener("click", () => {
    activeView = button.dataset.view;
    renderNavigation();
    window.scrollTo({ top: 0, behavior: "auto" });
  }));

  document.getElementById("loginTab").addEventListener("click", () => {
    document.getElementById("loginTab").classList.add("active");
    document.getElementById("signupTab").classList.remove("active");
    document.getElementById("authSubmit").textContent = "Login";
  });
  document.getElementById("signupTab").addEventListener("click", () => {
    document.getElementById("signupTab").classList.add("active");
    document.getElementById("loginTab").classList.remove("active");
    document.getElementById("authSubmit").textContent = "Create account";
  });
  document.getElementById("offlineBtn").addEventListener("click", () => {
    document.getElementById("authShell").hidden = true;
    document.getElementById("appShell").hidden = false;
    render();
  });
  document.getElementById("authForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!supabaseClient) return setAuthStatus("Supabase is not configured. Continue offline or add config.js.");
    const email = document.getElementById("authEmail").value.trim();
    const password = document.getElementById("authPassword").value;
    const creating = document.getElementById("signupTab").classList.contains("active");
    setAuthStatus(creating ? "Creating account..." : "Signing in...");
    const method = creating ? "signUp" : "signInWithPassword";
    const { error } = await supabaseClient.auth[method]({ email, password });
    if (error) setAuthStatus(`${creating ? "Sign up" : "Sign in"} failed: ${error.message}`);
  });
  document.getElementById("signOutBtn").addEventListener("click", async () => {
    if (supabaseClient) await supabaseClient.auth.signOut();
    currentUser = null;
    cloudReady = false;
    document.getElementById("appShell").hidden = true;
    document.getElementById("authShell").hidden = false;
    setAuthStatus("Signed out.");
  });

  document.getElementById("newChildPotFromRootBtn").addEventListener("click", () => openPotDialog(null, state.finance.rootPotId));
  document.getElementById("editRootBtn").addEventListener("click", () => openPotDialog(state.finance.rootPotId));
  document.body.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.matches("[data-close-dialog]")) target.closest("dialog")?.close();
    if (target.dataset.potEdit) openPotDialog(target.dataset.potEdit);
    if (target.dataset.potChild) openPotDialog(null, target.dataset.potChild);
    if (target.dataset.potDelete) archiveOrDeletePot(target.dataset.potDelete);
    if (target.dataset.txnEdit) openTransactionDialog(target.dataset.txnEdit);
    if (target.dataset.txnDelete && confirm("Delete this transaction? Its balance effect will be reversed.")) deleteTransaction(target.dataset.txnDelete);
    if (target.dataset.taskDelete) {
      state.travel.checklist = state.travel.checklist.filter((task) => task.id !== target.dataset.taskDelete);
      save();
      render();
    }
    if (target.dataset.taskEdit) editTask(target.dataset.taskEdit);
    if (target.dataset.entryEdit) editEntry(target.dataset.entryEdit);
    if (target.dataset.entryDelete && confirm("Delete this journal entry?")) {
      state.journal.entries = state.journal.entries.filter((entry) => entry.id !== target.dataset.entryDelete);
      save();
      render();
    }
  });
  document.body.addEventListener("change", (event) => {
    const target = event.target;
    if (target instanceof HTMLInputElement && target.dataset.taskToggle) {
      const task = state.travel.checklist.find((item) => item.id === target.dataset.taskToggle);
      if (task) task.done = target.checked;
      save();
      render();
    }
  });

  document.getElementById("potForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const id = field(form, "id").value || uid("pot");
    const existing = potById(id);
    const parentId = id === state.finance.rootPotId ? null : field(form, "parentId").value;
    if (parentId && wouldCreateCycle(id, parentId)) return alert("That parent would create a loop.");
    if (existing) Object.assign(existing, { name: field(form, "name").value.trim(), description: field(form, "description").value.trim(), color: field(form, "color").value, parentId });
    else state.finance.pots.push({ id, parentId, role: "pot", name: field(form, "name").value.trim(), description: field(form, "description").value.trim(), color: field(form, "color").value, balance: 0, archived: false, order: Date.now() });
    document.getElementById("potDialog").close();
    save();
    render();
  });

  document.getElementById("moneyForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    addTransaction({ type: data.type, amount: data.amount, date: data.date || today(), note: data.note, potId: state.finance.rootPotId });
    event.currentTarget.reset();
  });
  document.getElementById("transferForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    if (data.fromPot === data.toPot) return alert("Choose two different pots.");
    addTransaction({ type: "transfer", fromPot: data.fromPot, toPot: data.toPot, amount: data.amount, date: today(), note: data.note });
    event.currentTarget.reset();
  });
  document.getElementById("spendForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    addTransaction({ type: "spend", potId: data.potId, amount: data.amount, date: data.date || today(), note: data.note });
    event.currentTarget.reset();
  });
  document.getElementById("periodForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    state.finance.budgetPeriods = [{ id: uid("period"), title: data.title || "Current budget", potId: data.potId, startDate: data.startDate || today(), endDate: data.endDate || today() }];
    save();
    render();
  });
  document.getElementById("transactionEditForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    updateTransaction(data.id, data);
    document.getElementById("transactionDialog").close();
  });

  document.getElementById("travelNotesForm").addEventListener("submit", (event) => {
    event.preventDefault();
    state.travel.routeNotes = field(event.currentTarget, "routeNotes").value;
    save();
    render();
  });
  document.getElementById("checklistForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    state.travel.checklist.push({ id: uid("task"), title: data.title.trim(), dueDate: data.dueDate, done: false, order: Date.now() });
    event.currentTarget.reset();
    save();
    render();
  });
  document.getElementById("journalForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const entry = { id: field(form, "id").value || uid("entry"), date: field(form, "date").value, title: field(form, "title").value.trim(), body: field(form, "body").value, tags: field(form, "tags").value.split(",").map((tag) => tag.trim()).filter(Boolean) };
    const index = state.journal.entries.findIndex((item) => item.id === entry.id);
    if (index >= 0) state.journal.entries[index] = entry;
    else state.journal.entries.unshift(entry);
    form.reset();
    field(form, "date").value = today();
    save();
    render();
  });

  document.getElementById("exportBtn").addEventListener("click", exportJson);
  document.getElementById("importBtn").addEventListener("click", () => document.getElementById("importFile").click());
  document.getElementById("importFile").addEventListener("change", importJson);
  document.getElementById("saveCloudBtn").addEventListener("click", saveCloud);
}

function archiveOrDeletePot(id) {
  const pot = potById(id);
  if (!pot || pot.role === "root") return;
  if (!pot.archived) {
    pot.archived = true;
  } else if (confirm("Permanently delete this archived pot? Its balance must be zero and it must have no children.")) {
    if (potTotal(id) !== 0 || childrenOf(id, true).length) return alert("Empty this pot and remove child pots before deleting.");
    state.finance.pots = state.finance.pots.filter((item) => item.id !== id);
  }
  save();
  render();
}

function editTask(id) {
  const task = state.travel.checklist.find((item) => item.id === id);
  if (!task) return;
  const title = prompt("Task name", task.title);
  if (!title) return;
  task.title = title.trim();
  const dueDate = prompt("Due date YYYY-MM-DD, blank for none", task.dueDate || "");
  task.dueDate = dueDate || "";
  save();
  render();
}

function editEntry(id) {
  const entry = state.journal.entries.find((item) => item.id === id);
  if (!entry) return;
  const form = document.getElementById("journalForm");
  field(form, "id").value = entry.id;
  field(form, "date").value = entry.date;
  field(form, "title").value = entry.title || "";
  field(form, "body").value = entry.body || "";
  field(form, "tags").value = (entry.tags || []).join(", ");
  activeView = "journal";
  renderNavigation();
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

function exportJson() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `travel-life-os-v2-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function importJson(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    state = migrateState(JSON.parse(await file.text()));
    save();
    render();
  } catch {
    alert("Import failed. Check that the file is valid JSON.");
  } finally {
    event.target.value = "";
  }
}

async function loadRuntimeConfig() {
  try {
    const response = await fetch("./config.js", { cache: "no-store" });
    if (!response.ok) return;
    const script = await response.text();
    Function(script)();
  } catch {
    window.APP_CONFIG = window.APP_CONFIG || {};
  }
}

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js").catch(() => {});
}

setupEvents();
render();
loadRuntimeConfig().finally(initSupabase);
