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

Current app version: `0.9.0`.

The dashboard includes a manifest, app icon and service worker so it can behave like an installable app when served over GitHub Pages or another local web server. The service worker caches only the static app shell files. Private dashboard data remains in local storage and, after sign-in, Supabase.

The full-screen authentication flow supports email/password login, account creation, sign out, offline mode and Supabase password reset email requests.

Visible route/itinerary numbering is calculated from the current sorted list position. Stable item IDs remain separate from display numbers, so deleting or moving a middle stop automatically renumbers the route without gaps.

Reset App Data uses a two-step confirmation, requires typing `RESET`, and prepares a timestamped JSON backup before local browser data is cleared. Signed-in Supabase cloud data is never silently deleted.

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

That local data can include travel dates, budgets, route stops, tasks, check-ins, journal entries and other planning details. It is not uploaded to GitHub Pages by this app.

Use `Export JSON Backup` to save a private backup. Keep exported backups out of public repositories.

## First-Run Setup

When the app opens without saved local data, it shows a setup screen for:

- Departure date
- Starting budget
- Travel fund target
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

- `Command` - daily briefing, countdowns, check-ins, priorities and readiness scores.
- `Travel` - route planner, travel dates, documents, packing and timeline.
- `Budget` - settings summary, income, expenses, transaction history, charts and milestones.
- `TEFL` - target hours, completed hours, modules, study log and pace tracking.
- `Content` - content ideas and pipeline tracking.
- `Writing` - writing ideas, notes and sessions.
- `Life` - daily check-ins and trends.
- `Habits` - habit tracking based on saved daily logs.
- `Journal` - journal entries and reflections.
- `Weekly Review` - weekly summaries and review notes.
- `Dates & Counters` - editable countdowns and count-up counters, with dashboard pinning.
- `Settings & Data` - rarely changed global settings, targets, dates, labels and backup tools.

Daily entries stay inside their own sections. Settings & Data is for global configuration, not everyday logging.

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
