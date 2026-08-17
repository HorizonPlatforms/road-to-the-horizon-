# Travel Life OS V2

A clean static PWA foundation for Travel Life OS. It runs on GitHub Pages, saves locally by default, and can sync a single app state object to Supabase after login.

## Files

- `index.html` - app shell
- `styles.css` - responsive layout and theme
- `app.js` - state, finance logic, auth, sync and rendering
- `config.example.js` - copy to `config.js` locally or in deployment settings
- `sw.js` - static app-shell service worker
- `manifest.webmanifest` - PWA manifest

## Configuration

Copy `config.example.js` to `config.js` and fill in browser-safe publishable values:

```js
window.APP_CONFIG = {
  SUPABASE_URL: "https://your-project.supabase.co",
  SUPABASE_PUBLISHABLE_KEY: "your-publishable-key",
  GEOAPIFY_API_KEY: "optional-browser-key"
};
```

`config.js` is ignored by git. Do not put service-role keys in the browser app.

## Supabase

The app expects the existing saved-state table pattern:

- `user_id`
- `state`
- `created_at`
- `updated_at`

No database schema change is required for this V2 foundation.

## What V2 Includes

- Supabase email login/signup
- local storage fallback
- cloud load/save after login
- JSON import/export
- recursive finance pot tree
- root pot rename
- create/edit/archive/delete child pots
- transfer between pots
- add/remove actual money at root
- spending transactions
- transaction editing with reversal before applying the new transaction
- budget period and safe daily/weekly spend
- minimal editable travel checklist
- simple route notes
- simple journal entries
- mobile-first responsive layout
- PWA service worker for static app shell only

## What Is Intentionally Later

- full nearby places UI
- Open-Meteo weather widgets
- route itinerary builder
- document tracking
- advanced analytics
- automatic conflict detection

The foundation is designed so those can be added without reviving the old all-in-one codebase.
