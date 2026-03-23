# Telemetry (cloud): server freshness and local cache

## What is stored locally

- Key `TELEMETRY` in `localStorage`: full telemetry JSON blob (PII-sanitized via `piiSanitizer`).
- This is a **cache**, not the only source of truth when the user is logged in with Rigobot.

## When the client calls GET `/v1/learnpack/telemetry`

1. **Bootstrap** — On `TelemetryManager.start` for agent `cloud`: GET with `include_buffer=true`, `include_steps=true`, `user_id`, `package_slug`, and `package_ids` when resolved (timeout ~3s for package id resolution, ~5s for GET).
2. **Tab visible again** — On `visibilitychange` when the document becomes visible: if `Date.now() - last_interaction_at` exceeds `TELEMETRY_VISIBILITY_REFRESH_IDLE_MS` (5 minutes), `refreshFromServerIfStale` runs the same GET and replaces local state when the server blob is newer.

## Reconciliation (MVP)

- Compare `last_interaction_at` between server and local.
- If only one side has data, use it.
- If both exist, the newer timestamp wins; tie-break: server.
- If neither: create a new blob (no `submit` on bootstrap unless source is `local`).

## When POST runs

- Normal `submit`: Breathecode batch URL + Rigobot POST (unchanged), except during `reconciling === true` (bootstrap) when submits are skipped.
- **visibility hidden**: `TelemetryManager.submit()` to flush before leaving the tab.
- **beforeunload / pagehide**: `submitTelemetryToRigobotViaBeacon()` — Rigobot only, `fetch` with `keepalive: true` (best-effort on unload).

## Multi-device QA checklist

1. Complete a step on device A; open the same course on device B (or incognito) with the same user — progress from the server should appear after bootstrap GET.
2. Close the tab abruptly — network tab or server logs should show a Rigobot POST on unload when possible.
3. Leave the tab in the background >5 minutes, complete work on another device, return — visibility handler should refresh if server is newer.
