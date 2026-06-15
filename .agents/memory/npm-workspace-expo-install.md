---
name: npm workspace Expo install
description: How to reliably install Expo + React Native in this npm workspace; required flags, overrides, and root deps.
---

# npm workspace Expo install — required config

## The rule
Always run npm install with `NODE_OPTIONS='--max-old-space-size=4096' npm install --prefer-dedupe`.
The `prefer-dedupe=true` line in `.npmrc` makes this permanent.

**Why:** npm's arborist crashes with `TypeError: Invalid Version:` (semver.eq called with empty string in canDedupe) when placing react-native@0.81.5 without `--prefer-dedupe`. The flag short-circuits the failing `semver.eq()` call.

## ENOTEMPTY retry loop
npm gets `ENOTEMPTY` errors from running Metro bundler holding files open. Fix: run cleanup before each retry:
```js
// deep-clean all dot-prefixed temp dirs inside node_modules and its nested dirs
function clean(dir) {
  for each f in readdirSync(dir):
    if f starts with '.' and not in ['bin','.package-lock.json']: rmSync
    else: recurse into f/node_modules and @-scoped dirs
}
```
Use a retry loop with `$?` (NOT `npm install | tail` — the pipe exit code is tail's, not npm's).

## Root-level pinned deps (in root package.json devDependencies)
These MUST be at root to avoid split-resolution errors:
- `"expo": "~54.0.27"` — expo-router at root can't find `expo/config-plugins` if expo is nested
- `"react-native": "0.81.5"` — must be at root so Metro can resolve it
- `"@babel/traverse--for-generate-function-map": "npm:@babel/traverse@^7.25.3"` — metro-source-map npm alias; npm doesn't materialize it unless declared at root
- `"esbuild": "0.25.8"` in `overrides` — prevents esbuild binary version mismatch in postinstall (api-server pins 0.25.8 via esbuild-plugin-pino requirement)

## @expo/cli version
Must match what `expo@54.0.35` bundled: `"@expo/cli": "54.0.25"` in dept-connect devDeps.
If mismatched, npm nests it instead of hoisting, and `expo/bin/cli` can't find it.

## Two-stage install pitfall
DO NOT use a two-stage install (--prefer-dedupe then regular) — the second pass "removes" packages like `which` that the first pass installed. Always use a single pass with `--prefer-dedupe`.

**How to apply:** Whenever running `npm install` in this workspace, always include `--prefer-dedupe` (or rely on the `.npmrc` setting).
