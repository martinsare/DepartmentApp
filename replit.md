# Department Connect

A full-featured Expo (React Native) mobile app for university departments, backed by an Express API server.

## Run & Operate

- `npm run dev --workspace=@workspace/api-server` — run the API server (port 5000)
- `npm run typecheck` — full typecheck across all packages
- `npm run build` — typecheck + build all packages
- `npm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `npm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- npm workspaces, Node.js 24, TypeScript 5.9
- Mobile: Expo (React Native), expo-router
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/department-connect/` — Expo mobile app
- `artifacts/api-server/` — Express API server
- `lib/db/` — Drizzle ORM schema (source of truth for DB)
- `lib/api-spec/` — OpenAPI spec (source of truth for API contract)
- `lib/api-zod/` — generated Zod schemas from spec
- `lib/api-client-react/` — generated React Query hooks from spec

## Architecture decisions

- Migrated from pnpm to npm workspaces; see Gotchas for required install flags.
- `expo` and `react-native` are pinned in root `package.json` `devDependencies` to force them to root `node_modules` (avoids split-resolution errors with expo-router and metro).
- esbuild is overridden to `0.25.8` globally (esbuild-plugin-pino requires `<=0.25.8`).
- `@babel/traverse--for-generate-function-map` (metro-source-map npm alias) declared at root so npm materializes it.

## Product

University department mobile app — browse departments, connect with staff, manage events and notifications.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- **npm install**: always run with `NODE_OPTIONS='--max-old-space-size=4096' npm install --prefer-dedupe`. The `prefer-dedupe=true` is in `.npmrc`. Without `--prefer-dedupe`, npm crashes with `TypeError: Invalid Version:` when placing react-native@0.81.5 (arborist bug with empty version in canDedupe).
- **ENOTEMPTY retries**: Metro bundler holds node_modules files open; `npm install` may need 2–3 retries with temp-dir cleanup. Use a retry loop that checks `$?` directly (not `npm install | tail` — pipe exit code is tail's).
- **esbuild pin**: api-server must use esbuild@0.25.8 — esbuild-plugin-pino@2.3.3 requires `>=0.25.0 <=0.25.8`.
- **`dept-connect` package name**: is `department-connect` (no `@workspace/` scope) — workflow uses `npm run dev --workspace=department-connect`.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
