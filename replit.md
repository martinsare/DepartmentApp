# Department Connect

A full-featured Expo (React Native) mobile app for university departments.

## Run & Operate

- `npm run dev --workspace=department-connect` — run the Expo dev server
- `npm run typecheck --workspace=department-connect` — typecheck the app
- Required env: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` — Supabase connection

## Stack

- npm workspaces, Node.js 24, TypeScript 5.9
- Mobile: Expo (React Native), expo-router
- Backend: Supabase (auth + realtime database)
- Validation: Zod

## Where things live

- `artifacts/department-connect/` — the entire Expo app
  - `app/` — expo-router screens (student/lecturer/admin role groups)
  - `components/` — shared UI components
  - `context/` — AuthContext, DataContext
  - `lib/` — supabase client, notifications, data types
  - `constants/` — colors/theme tokens
  - `hooks/` — useColors

## Architecture decisions

- Single artifact: only `artifacts/department-connect/` exists — no api-server, no mockup-sandbox, no lib/ workspace packages
- All deps hoisted to root node_modules via npm workspaces (`"workspaces": ["artifacts/*"]`)
- `expo` and `react-native` pinned as root devDependencies to prevent nesting
- esbuild overridden to `0.25.8` globally

## Product

University department mobile app — browse departments, connect with staff, manage events, class sessions, announcements, contributions, and attendance. Roles: student, lecturer, admin.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- **npm install**: always run with `NODE_OPTIONS='--max-old-space-size=4096' npm install --prefer-dedupe`. The `prefer-dedupe=true` is in `.npmrc`. Without `--prefer-dedupe`, npm crashes with `TypeError: Invalid Version:` when placing react-native@0.81.5 (arborist bug with empty version in canDedupe).
- **ENOTEMPTY retries**: Metro bundler holds node_modules files open; `npm install` may need retries with temp-dir cleanup. Check `$?` directly (not piped through `tail`).
- **dept-connect package name**: is `department-connect` (no `@workspace/` scope) — workflow uses `npm run dev --workspace=department-connect`.
- **lib/ directory**: `artifacts/department-connect/lib/` contains `demoData.ts` (types), `supabase.ts`, and `notifications.ts` — these are app-internal, not workspace packages.
