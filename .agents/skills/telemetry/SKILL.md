---
name: telemetry-ide
description: >
  Complete knowledge of the telemetry system in the LearnPack IDE (ide/).
  Use this skill whenever working on any telemetry-related task in this repo:
  new tracking features, event bug fixes, changes to local/server reconciliation,
  data schema modifications, Rigobot integration, engagement/frustration metrics,
  or any question about how telemetry data flows. Also applies for onboarding
  new developers to this module.
---

# Telemetry in the LearnPack IDE

## General architecture

The IDE is the **central telemetry agent**: it accumulates all events, stores them
locally in `localStorage`, and syncs them with Rigobot. The CLI acts as a local
storage bridge for `os`/`vscode` agents.

```
User (action)
    │
    ▼
store.tsx / components
    │  register events via registerTelemetryEvent()
    ▼
TelemetryManager (singleton)       ← src/managers/telemetry.ts
    │  accumulates in .current (in memory)
    ├─ save() → localStorage["TELEMETRY"]   (cloud agent)
    ├─ save() → POST /telemetry             (os/vscode agents)
    └─ submit() → POST Rigobot + Breathecode
```

## Main file

**`src/managers/telemetry.ts`** — contains almost all the logic:
- `TelemetryManager` class (singleton): `start()`, `save()`, `submit()`, `registerStepEvent()`, `reconcileTelemetry()`
- TypeScript types: `ITelemetryJSONSchema`, `TStep`, `TCompilationAttempt`, etc.
- Bootstrap functions, server fetch, base64 encoding

## Event types

| Event | Registered in | Trigger |
|-------|--------------|---------|
| `compile` | `store.tsx:520,538` | Compilation result via socket |
| `test` | `store.tsx:480,424` | Test result via socket |
| `ai_interaction` | `Agent.tsx:618`, `NewAgent.tsx:544` | AI completes response |
| `open_step` | `store.tsx:1061`, `store.tsx:2647` | User navigates to a step |
| `quiz_submission` | `QuizRenderer.tsx:228`, `Markdowner.tsx:1239`, `OpenQuestion.tsx:250` | User submits quiz |

## How to register a new event

1. Call `TelemetryManager.registerStepEvent(eventType, data)` from the component/store
2. The event is appended to the corresponding array in `TelemetryManager.current.steps[n]`
3. `save()` is called automatically after each registration
4. Add the new type to `TStep` (see `references/schema.md`)

For compilation/test events, data must be base64-encoded:
```typescript
// telemetry.ts:386-391
const encode = (s: string) => btoa(encodeURIComponent(s))
```

## Lifecycle and submission triggers

**Bootstrap** (on IDE startup):
1. Resolve `package_id` from slug — 5s timeout
2. `GET ${RIGOBOT_HOST}/v1/learnpack/telemetry?include_buffer=true` — 5s timeout
3. Load from `localStorage`
4. Reconcile (see Reconciliation section)
5. If source is `"local"`, submit immediately

**Automatic submissions** (`submit()` → Rigobot + Breathecode):
- Test completes with `exit_code === 0` — `store.tsx:1164`
- Quiz submitted — `store.tsx:1197`
- Step opened — `store.tsx:1240`
- Tab hidden — `store.tsx:2611`
- Page closed — beacon with `keepalive: true` — `store.tsx:2621`

**Server refresh:**
- On tab focus if idle > 5 minutes (`TELEMETRY_VISIBILITY_REFRESH_IDLE_MS`)

## Local ↔ server reconciliation

Function: `reconcileTelemetry()` — `telemetry.ts:214-314`

Strategy: **"most recent `last_interaction_at` wins"**

| Scenario | Result |
|----------|--------|
| Server only | Use server data |
| Local only | Use local + auto-submit to server |
| Both have data | Most recent wins; tie → server |
| Neither | Create new blob with UUID |

## Local storage

- **Cloud**: `localStorage["TELEMETRY"]` — PII sanitized (FERPA): `fullname → "[REDACTED]"`, email removed
- **OS/VSCode**: `POST http://localhost:PORT/telemetry` → saved to `${configPath}/telemetry.json` in the CLI

## External APIs

See `references/apis.md` for full endpoints, headers, and payloads.

## Data schema

See `references/schema.md` for the complete TypeScript types with all fields.

## Key files

See `references/key-files.md` for the full file map with relevant line numbers.

## Privacy

- `fullname` → `"[REDACTED]"` in localStorage (`src/utils/piiSanitizer.ts:85-88`)
- Email is **never** sent in telemetry (explicit comment at `telemetry.ts:767`)
- `user.email`, `user.first_name`, `user.last_name`, `user.github` removed from localStorage
- No explicit opt-out mechanism; without a Rigobot token, no data is sent to the server

## Important gotchas

- `TelemetryManager` may not be initialized when the first event fires → retry loop of 3 attempts with 2s delay (`telemetry.ts:1114-1124`)
- Keys persisted in localStorage have a strict whitelist (`telemetry.ts:539-555`) — fields outside the whitelist are discarded during normalization
- No HTTP retry: if the POST fails, it is logged and discarded
- Source code, stdout, and stderr are always base64-encoded
