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

### The IDE as source of truth for step structure (cloud)

In the cloud environment, the IDE is the **only actor that knows**:
- Which exercises currently exist in the tutorial (from `configObject.exercises`)
- Their current slugs and correct order
- Which steps are testeable

The server stores telemetry blobs but has no knowledge of the tutorial structure.
This means **server data can arrive with steps in a different order or with stale
slugs** if the tutorial was updated between sessions. The IDE must always enforce
the current exercise structure when reconciling.

### Step indexing contract

`current.steps` is a flat array built from `configObject.exercises.map(...)`.
The **array index** is the canonical identifier — `current.steps[N]` always
corresponds to `exercises[N]`.

**All code that accesses `current.steps` must use the array index**, not
`exercise.position`. The two values can diverge if:
- Exercises come from the server with non-sequential position values
- The tutorial was updated and exercises were reordered between sessions

Concretely:
- `registerTelemetryEvent()` → uses `currentExercisePosition` (array index) ✓
- `registerTesteableElement()` → **must use `currentExercisePosition`** (array index), not `exercise.position`. This was a bug fixed in the IDE: using `.position` caused testeable elements to land in a different step slot than the one modified by `registerTelemetryEvent`, breaking `hasPendingTasks` checks.

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

### Step merge on reconciliation (`normalizeTelemetrySchema`)

After choosing a winner blob, steps are **not** used as-is. They are merged into
`freshSteps` (the current exercise list) by `slug`:

- **Structural fields** (`slug`, `position`, `files`, `is_testeable`) always come
  from `freshSteps` — this enforces correct array ordering.
- **Activity fields** (`compilations`, `tests`, `ai_interactions`, `quiz_submissions`,
  `testeable_elements`, `is_completed`, `completed_at`, `opened_at`, `sessions`)
  are preserved from the stored blob when present.
- Steps in the stored blob that have no matching slug in `freshSteps` are
  **discarded** — they correspond to exercises removed from the tutorial.
- Steps in `freshSteps` with no match in the stored blob get the blank defaults.

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
- **Never use `exercise.position` to index `current.steps`** — always use the array index (`currentExercisePosition` or `findIndex`). `exercise.position` can differ from the array index if the tutorial was reordered or if the server returned steps out of order. Using `.position` causes event data and testeable elements to land in wrong step slots, breaking `hasPendingTasks` and `is_completed` logic.
- **`submit()` fires before step is marked complete in some paths** — `registerStepEvent("test")` calls `submit()` synchronously. Any `registerTesteableElement` call that should influence `hasPendingTasks` for that test must happen before `registerTelemetryEvent`, not after.
