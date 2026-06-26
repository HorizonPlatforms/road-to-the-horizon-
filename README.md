# Travel Life OS

A static, browser-based personal planning dashboard that can be published on GitHub Pages without exposing private planning data.

The app shell contains no real travel budget, departure date, route, tasks, trip dates or personal planning details. On first run, each user enters their own setup values, imports a backup, or loads fake demo data.

## Files

- `index.html` - the public-safe Life OS app for GitHub Pages.
- `index.html.html` - the previous local filename, kept as a matching copy for continuity.
- `manifest.webmanifest`, `icon.svg` and `sw.js` - installable app/PWA shell files.
- `Road_to_Australia_Project.md` - the original private planning document. Do not publish this unless it has been separately sanitised.
- `README.md` - these instructions.
- `.gitignore` - excludes the private planning document and exported JSON backups from new commits.

GitHub Pages serves `index.html` as the site homepage.

## App Shell

Current app version: `0.28.0`.

## Structure and planning model

The app is organised so normal editing happens close to the section that uses the data:

- Travel contains route stops and the editable phase manager.
- Budget contains a simplified money dashboard: overview, money pots, optional advanced budget periods, transactions, categories/subcategories, analytics and milestones.
- Dates & Counters contains editable counters and key travel dates.
- Journal contains the daily record for writing, mood, energy, sleep, habits, reflections and travel context.
- Habits contains the habit manager and history summaries.
- Settings is kept for app preferences, section names, About/version details, backup/import/export and reset.

Budget keeps the surface model simple: total money, travel fund, emergency fund, current budget, budget period and transactions. Pot start/end dates normally control Safe Spend. Optional advanced budget periods are available for short-term overrides, but everyday budgeting should usually happen from the pot itself. Travel and emergency funds are reserved money groups, and add/remove/transfer/correction actions are saved as transaction records so balances remain auditable. Older finance values are preserved and migrated into compatible records for existing users.

Journal and Finance are connected without duplicating spending records. Finance remains the source of truth for transactions, balances, pots, Safe Spend and analytics. Journal entries show same-day Finance transactions, can link to transaction IDs, and ask before creating a new Finance transaction from a journal spending item.

Finance reconciliation model: wallets represent top-level money, editable fund groups reserve money for custom purposes, and child pots are budgets inside those funds. Creating a new top-level fund can add new real wallet money; creating a child budget subdivides an existing fund without increasing total money. The overview warns only when parent funds exceed total money or child budgets exceed their parent fund.

The dashboard includes a manifest, app icon and service worker so it can behave like an installable app when served over GitHub Pages or another local web server. The service worker caches only the static app shell files. Private dashboard data remains in local storage and, after sign-in, Supabase.

The full-screen authentication flow supports email/password login, account creation, sign out, offline mode and Supabase password reset email requests.

Visible route/itinerary numbering is calculated from the current sorted list position. Stable item IDs remain separate from display numbers, so deleting or moving a middle stop automatically renumbers the route without gaps.

Reset App Data uses a two-step confirmation, requires typing `RESET`, and prepares a timestamped JSON backup before local browser data is cleared. Signed-in Supabase cloud data is never silently deleted.

Departure-dependent calculations use one shared departure-date helper. If no departure date exists, pace widgets show `Not set` rather than using a fallback date.

Phases and habits are editable settings. Route, budget and journal widgets read from those shared settings so changes update across the app.

## App Updates

When the app is installed as a PWA, the service worker checks for new static app files during normal loads. If a new version is available, the app shows:

```text
Update available. Refresh to get the latest version.
```

Choose `Refresh` to activate the new service worker and reload the app. The app does not auto-refresh while you are typing or editing data. If a form has unsaved edits, finish or save the edit first, then refresh.

Local storage is saved before the refresh starts. Supabase sessions are managed by Supabase Auth, so signed-in users should remain signed in after the app reloads.

## Privacy Model

GitHub Pages hosts only the static app shell: HTML, CSS and JavaScript.

Private user data is stored only in the browser's local storage under:

```text
road-to-australia-life-os-v3
```

That local data can include travel dates, budgets, route stops, tasks, journal entries and other planning details. It is not uploaded to GitHub Pages by this app.

Use `Export JSON Backup` to save a private backup. Keep exported backups out of public repositories.

## First-Run Setup

When the app opens without saved local data, it shows a setup screen for:

- Departure date
- Starting budget
- Travel pot target
- Route stops
- Key dates
- TEFL target hours
- Core tasks

Setup values are saved locally in the current browser and then used by all dashboard cards, countdowns, readiness scores, budget summaries and timelines.

## Demo Mode

The setup screen includes `Load Demo Mode`.

Demo mode loads fake sample data so visitors can explore the dashboard without entering real information. Demo data is clearly generic and can be reset or replaced with real setup data in local storage.

## Run Locally

No installation is required.

1. Open this folder:

2. Open `index.html` in a browser.

You can also serve the folder locally:

```powershell
npx serve .
```

Then open the served file in the browser.

## Main Sections

- `Command` - daily briefing, countdowns, quick journal check-in, priorities and readiness scores.
- `Travel` - route planner, phase manager, documents, packing and timeline.
- `Budget` - money overview, pots, optional advanced budget periods, transactions, categories, analytics and milestones.
- `TEFL` - target hours, completed hours, modules, study log and pace tracking.
- `Content` - content ideas and pipeline tracking.
- `Writing` - writing ideas, notes and sessions.
- `Life` - journal-based mood, energy and habit trends.
- `Habits` - habit management and journal-based habit history.
- `Journal` - daily journal hub for writing, check-ins, habits, reflections, travel context, Finance-linked daily spending and tags.
- `Weekly Review` - weekly summaries and review notes.
- `Dates & Counters` - editable countdowns, count-up counters and key travel dates, with dashboard pinning.
- `Settings` - account/sync status, backup/import/export, preferences, labels, About/version details and the protected reset flow.

Daily mood, energy and habit completion now live inside Journal entries. Settings is for app-level controls, not everyday logging.

## Backup And Restore

Use `Export JSON Backup` before:

- Clearing browser data
- Changing browser
- Moving to another laptop
- Publishing a fresh copy online
- Making major dashboard changes

Use `Import JSON Backup` to restore a private backup. Importing replaces the current browser data after confirmation.

## Publishing To GitHub Pages

1. Make sure the app file is named `index.html`.
2. Do not commit private exports, private planning documents or real-data backups.
3. Commit only the public-safe app shell and documentation.
4. Enable GitHub Pages for the repository branch/folder you want to publish.
5. Open the Pages URL and confirm the setup screen appears in a clean browser profile.

If the private planning document was already tracked by Git, remove it from the public branch/index before publishing. `.gitignore` prevents new accidental adds, but it does not rewrite existing Git history.

## Data Safety Checklist

Before publishing, search the repository for real values such as:

- Real budgets
- Real departure dates
- Real route stops
- Real trip dates
- Personal tasks or journal text
- Exported `.json` backups

The public app should start from setup or demo mode only.
