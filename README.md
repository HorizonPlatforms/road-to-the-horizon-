# Road to Australia Life OS

This is a local browser-based Life and Travel Operating System for the Road to Australia plan. It runs from `dashboard.html`, saves automatically in your browser and keeps working without a backend, login or build step.

## Files

- `dashboard.html` - the Life OS app.
- `Road_to_Australia_Project.md` - the structured planning document built from the original master plan PDF.
- `README.md` - these instructions.

## Run The App Locally

No installation is required.

1. Open this folder:
   `C:\Users\user\Documents\road to australia 2`
2. Double-click `dashboard.html`.
3. The app opens in your browser.

You can also run it with Node.js after Node is installed:

```powershell
cd "C:\Users\user\Documents\road to australia 2"
npx serve .
```

Then open:

```text
http://localhost:3000/dashboard.html
```

## Data Preservation

The app now uses this local storage key:

```text
road-to-australia-life-os-v3
```

If older planner data exists under:

```text
road-to-australia-planner-v2
```

the app migrates it into the new Life OS format on first load. The older data is left in place as a fallback.

## Main Sections

Use the tabs near the top of the app.

- `Command` - countdown, daily check-in, priorities, task manager, readiness, money and life snapshots.
- `Travel` - route planner, city/country notes, target arrival dates, packing, documents, visas and departure checklist.
- `Budget` - pre-departure pot, travel fund, emergency fund, income, expenses, categories, phase allocations, summaries, charts and milestones.
- `TEFL` - modules, hours completed, hours remaining, study log, study streak and notes.
- `Content` - TikTok, Instagram, YouTube and Substack pipeline.
- `Writing` - poetry ideas, draft titles, writing goals, writing sessions and inspiration notes.
- `Life` - daily check-ins and trends.
- `Habits` - TEFL, exercise, walking, reading, poetry, content, travel planning, budget discipline and early bedtime.
- `Journal` - daily journal, weekly review, monthly review, travel thoughts, worries, wins and lessons.
- `Weekly Review` - automatic weekly stats plus saved review notes and next priorities.
- `Settings & Data` - central editable values for rarely changed dates, targets, balances, section labels and app preferences.

## Settings & Data

Use `Settings & Data` as the single place to edit global configuration values used across the dashboard. Normal daily entries stay inside their own sections.

It controls:

- Dashboard subtitle text.
- Theme preference.
- Section/tab names.
- Departure date.
- July trip start and end dates.
- Late August trip date.
- September conference start and end dates.
- Pre-departure starting pot.
- Travel fund target and current amount.
- Emergency fund target and current amount.
- TEFL total hours target.

Cards and summaries read from these saved settings. Relevant cards include a short note saying to edit global values in `Settings & Data` instead of adding separate edit buttons everywhere.

`Key Travel Dates` in `Settings & Data` can be added, edited, archived, unarchived or deleted. Active saved dates feed the automatic countdowns and deadline logic.

Daily data entry remains in the relevant section:

- Tasks and daily check-ins stay on `Command`.
- Expenses and income entries stay on `Budget`.
- TEFL modules and study logs stay on `TEFL`.
- Content ideas stay on `Content`.
- Writing entries stay on `Writing`.
- Habit tracking stays on `Habits`.
- Journal entries stay on `Journal`.
- Route timeline dates stay on `Travel`.

## Automatic Date Updates

The app uses JavaScript date logic to update itself every time it loads. Countdowns use the browser's local calendar date, so the dashboard rolls over with your day rather than UTC.

It tracks countdowns for:

- 15 July 2026 paid trip.
- 1 August 2026 trip return.
- 27 August 2026 paid trip.
- Early September conference.
- 15 September 2026 departure.

The Command page also detects the current phase automatically:

- June Build Phase
- July Pre-Trip Phase
- July Paid Trip Phase
- August Setup Phase
- Late August Paid Trip Phase
- September Conference Phase
- Final Countdown Phase
- Travel Phase

You can edit the key dates from `Settings & Data`.

## Daily Briefing

The Command page includes a Daily Briefing with:

- Today's date.
- Days until departure.
- Current phase.
- Top 3 recommended priorities.
- Budget status.
- TEFL status.
- Upcoming deadlines within 14 days.

Task due dates are included in the deadline list when they are incomplete and due within the next 14 days.

## Task Manager

The Command page includes a local task manager for daily planning.

You can:

- Create new tasks.
- Assign each task to a category and timeframe.
- Add an optional due date.
- Edit the title, category, timeframe, due date and completion status.
- Delete tasks.
- Mark tasks as completed or incomplete.
- View incomplete and completed tasks separately.

Task changes are saved automatically in local storage with the rest of the dashboard data.

## Readiness Scores

The app calculates smart readiness scores for:

- Departure
- TEFL
- Packing
- Admin
- Budget
- Content setup

These scores are calculated from the tasks, documents, packing, budget, TEFL and content data already inside the app.

## Daily Use

A simple daily rhythm:

1. Open the app.
2. Fill in the `Today` check-in on the Command page.
3. Add any spending for the day.
4. Update TEFL, writing or content work if you did any.
5. Check the open priorities and budget snapshot.
6. Export a backup every few days or after major edits.

After saving the daily log, the app shows `Daily log saved`. Saved daily logs persist locally and feed the life, habit and weekly review summaries.

## Budget System

The Budget page tracks:

- Pre-departure pot, starting at GBP 1,050.
- Travel fund, with a GBP 8,000 target.
- Emergency fund target and current amount.
- Income and expense entries.
- A transaction history directly below the income and expenses form, with edit and delete controls.
- Spending categories.
- Budget phase allocations for pre-departure, Europe, Budapest, Balkans/Turkey, Southeast Asia and Australia.
- Weekly and monthly summaries.
- Spending chart by category.
- Financial milestones.
- Budget pace, including safe daily spend, safe weekly spend and overspending warnings.

The remaining pre-departure money is calculated as:

```text
GBP 1,050 + income entries - expense entries
```

You can edit the starting pot in `Settings & Data` if your real number changes. The recent spending warning is based on expense entries from the last 7 days. If you resave today's check-in, the app replaces that day's automatic check-in spending entry instead of counting it twice.

Income and expense entries can be edited or deleted from the `Transaction History` list in `Budget`. Changes automatically update remaining money, totals, charts and summaries.

## TEFL Pace

The TEFL page tracks:

- Completed hours.
- Hours remaining out of 120.
- Required hours per day until departure.
- Whether the current pace is ahead, on track or behind.
- Expected hours by today, calculated from 1 June 2026 to the 15 September 2026 departure.

You can enter study sessions through modules and the study log. You can edit completed hours directly in `TEFL`, and the total TEFL target in `Settings & Data`.
TEFL modules and study log entries can be edited or deleted from the `TEFL` section.

## Timeline View

The Travel page includes a visual timeline for:

- June
- July trip
- August setup
- Late August trip
- September conference
- 15 September departure
- Europe
- Budapest
- Turkey
- Thailand
- Australia

Route stops, document items, packing items and route timeline dates can be edited or deleted from the `Travel` section. Changes update travel readiness and timeline views automatically.

## Backup And Restore

Use `Export JSON Backup` to download a backup of all app data, including `Settings & Data` values.

Use `Import JSON Backup` to restore a previous backup. Importing replaces the current browser data with the imported file after confirmation.

Export before:

- Clearing browser data.
- Changing browser.
- Moving to another laptop.
- Publishing a copy online.
- Making major edits to the dashboard.

## Dark Mode

Use the `Dark Mode` button at the top of the app. The setting is saved locally with the rest of your data.

## Recovery Protection

The app includes:

- Automatic saving after changes.
- Last-saved timestamp.
- JSON export/import.
- Versioned local storage.
- Migration from the previous planner data format.
- Reset warning that reminds you to export first.
- Last active section persistence, so refreshes reopen the section you were using.

## GitHub Pages Deployment

GitHub Pages can host the dashboard as a static site.

1. Create a GitHub repository, for example `road-to-australia`.
2. Upload:
   - `dashboard.html`
   - `Road_to_Australia_Project.md`
   - `README.md`
3. For the cleanest Pages URL, copy `dashboard.html` and name the copy `index.html`.
4. In GitHub, open the repository settings.
5. Go to `Pages`.
6. Choose:
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/root`
7. Save and wait for GitHub to publish the site.

Important: GitHub Pages does not sync planner data between devices. The app still saves to each browser's local storage. Use JSON export/import to move data around.

## Privacy Note

This planner may contain budget details, health/life notes, travel dates and personal plans. Keep it local or private if the details are sensitive.
