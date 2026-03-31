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

## How `is_completed` gets set (state machine)

`step.is_completed` can only be set to `true` in `registerStepEvent` — there are four paths:

| Path | Location | Condition |
|------|----------|-----------|
| Test passes | `case "test"` — `telemetry.ts` | `exit_code === 0` AND `!hasPendingTasks` AND `!step.completed_at` |
| Quiz succeeds | `case "quiz_submission"` — `telemetry.ts` | `status === "SUCCESS"` AND no other pending testeable elements AND `!step.completed_at` |
| User navigates away | `case "open_step"` — `telemetry.ts` | `!hasPendingTasks` on the previous step AND `!prevStep.completed_at` |
| Last step opened | `case "open_step"` — `telemetry.ts` | `stepPosition === steps.length - 1` AND `!hasPendingTasks` |

**If `is_completed` stays `false` after an exercise is completed, check these in order:**
1. Did `hasPendingTasks` return `true` unexpectedly? → inspect `step.testeable_elements`
2. Are there stale elements with `is_completed: false` from a previous failed attempt?
3. Are testeable elements in the correct step slot (array index matches)?
4. Was `submit()` called before the relevant state was updated?

## `testeable_elements` and `hasPendingTasks`

`testeable_elements` is a per-step array of trackable sub-tasks (individual quiz questions, code tests). It exists to support steps with **multiple** testeable items — the step is only complete when all items are done.

`hasPendingTasks(stepPosition)` returns `true` if any element in `testeable_elements` has `is_completed: false`.

**Critical: `testeable_elements` carries state across attempts.** A failed attempt registers an element with `is_completed: false`. If a subsequent successful attempt calls `registerStepEvent` before updating that element via `registerTesteableElement`, `hasPendingTasks` still sees the stale `false` value — and blocks `is_completed` from being set.

**Where elements are registered:**
- Code tests: `fetchSingleExerciseInfo` (on step load, `is_completed: false`), `debounceTestingSuccess/Error` (on result)
- Quizzes: `QuizRenderer.tsx`, `Markdowner.tsx`, `OpenQuestion.tsx` (on submission)

**The fix for quiz completion** (`telemetry.ts`, `case "quiz_submission"`): instead of calling `hasPendingTasks()` which includes the current quiz's stale element, check only OTHER elements: `step.testeable_elements?.some(e => e.hash !== data.quiz_hash && !e.is_completed)`. The current submission's `data.status` is the authoritative source for whether this quiz is done.

## The double-call pattern

For code tests and quizzes, a single logical "user completed X" maps to **two separate calls** that must be understood together:

```
registerTelemetryEvent(event, data)       → records the attempt in step.tests / step.quiz_submissions
                                           → checks hasPendingTasks → may set is_completed → calls submit()

registerTesteableElement(index, element)  → updates testeable_elements cache for this item
                                           → calls save() only, NOT submit()
```

These two calls happen in sequence from the same handler (store.tsx or component), but `registerStepEvent` runs synchronously and calls `submit()` before `registerTesteableElement` updates the cache. **Any logic inside `registerStepEvent` that reads `testeable_elements` sees the state from before `registerTesteableElement` ran.**

When diagnosing completion bugs, always check whether the relevant `registerTesteableElement` call happens before or after `registerTelemetryEvent` in the calling code.

## Course completion architecture

Course completion is determined by four layers that must all agree:

### Layer 1 — `step.completed_at` (step status, source of truth)

`metrics.ts` derives the status of each step from `step.completed_at`, **not** from `step.is_completed`:

```typescript
let status = step.completed_at
  ? "completed"
  : step.opened_at
  ? "attempted"
  : "unread";
```

`is_completed` is set alongside `completed_at` in `registerStepEvent`, but `completion_rate` and all per-step metrics in the telemetry payload are driven by `completed_at`. If `completed_at` is missing, the step is never counted as completed, regardless of `is_completed`.

### Layer 2 — `hasPendingTasks` / `hasPendingTasksInAnyLesson` (real-time gate)

- `hasPendingTasks(stepPosition)` — returns `true` if any `testeable_element` in that step has `is_completed: false` or undefined.
- `hasPendingTasksInAnyLesson()` — iterates **all steps** and applies `hasPendingTasks` to each. A single pending element in any step blocks course completion.

### Layer 3 — "Finish" button and last_lesson_finished modal

Located in `LessonRenderer.tsx` and `eventListener.tsx`:

```
isFinishDisabled = isLastExercise && (hasPendingTasks || hasPendingTasksInAnyLesson)
```

When the student clicks Finish on the last step:
1. `eventBus.emit("last_lesson_finished")` fires.
2. `EventListener` re-checks `hasPendingTasksInAnyLesson()` — if still false, triggers confetti + modal.

`assessment_completed` (from quiz/open-question submissions) also triggers `last_lesson_finished` automatically if the student is on the last step and all tasks are done.

### Layer 4 — `completion_rate` in the telemetry payload

Calculated in `calculateGlobalMetrics` (`metrics.ts`):

```typescript
const completion_rate = total_steps
  ? (num_completed / total_steps) * 100
  : 0;
```

`num_completed` = steps where `calculateStepMetrics` returns `status === "completed"` (i.e., `step.completed_at` exists).

**Full flow:**
```
quiz SUCCESS / test pass / navigation
        │
        ▼
registerStepEvent() → sets step.completed_at if !hasPendingTasks
        │
        ▼
submit() → buildSubmitPayload() → calculateGlobalMetrics()
        → completion_rate = steps_with_completed_at / total_steps * 100
        → POST Rigobot + Breathecode

        │  (on last step)
        ▼
hasPendingTasksInAnyLesson()? NO
  → last_lesson_finished → confetti + modal
```

## Multi-language progress in `testeable_elements`

**Implemented behavior.** Quiz hashes still differ per language (`asyncHashText` on rendered text), and old hashes are **not** removed when the student changes language — but pending checks are scoped to the active locale.

- **`TTesteableElement.language?: string`** — set for quizzes/open questions from `QuizRenderer.tsx`, `Markdowner.tsx` (fill-in-the-blank), and `OpenQuestion.tsx`. Omitted for `type: "test"` (code tests share the same files across locales).
- **`TelemetryManager.currentLanguage`** — updated via **`setCurrentLanguage`** from `store.tsx` on **`setLanguage`** and after **`start()`** bootstrap.
- **`hasPendingTasks(stepPosition)`** — counts an element as pending only if it is incomplete **and** either: no `language` (legacy quiz data or any element without the field), `type === "test"`, or `e.language === currentLanguage`.
- **`case "quiz_submission"`** — the “other pending elements” check uses the same language filter so `SUCCESS` can set `completed_at` when only other-locale quiz hashes remain.
- **Backward compatibility** — stored blobs without `language` on quiz elements behave as before (every such element is still evaluated), so no migration is required.

**If completion still looks wrong in a multi-language course:**
1. Inspect `step.testeable_elements` — confirm quiz rows include `language` after redeploy.
2. Confirm `TelemetryManager.currentLanguage` matches the UI locale (`setLanguage` path).
3. Legacy rows without `language` can still block completion across locales; clearing local telemetry or re-submitting after the new build repopulates `language` on new registrations.

## Important gotchas

- `TelemetryManager` may not be initialized when the first event fires → retry loop of 3 attempts with 2s delay (`telemetry.ts:1114-1124`)
- Keys persisted in localStorage have a strict whitelist (`telemetry.ts:539-555`) — fields outside the whitelist are discarded during normalization
- No HTTP retry: if the POST fails, it is logged and discarded
- Source code, stdout, and stderr are always base64-encoded
- **Never use `exercise.position` to index `current.steps`** — always use the array index (`currentExercisePosition` or `findIndex`). `exercise.position` can differ from the array index if the tutorial was reordered or if the server returned steps out of order. Using `.position` causes event data and testeable elements to land in wrong step slots, breaking `hasPendingTasks` and `is_completed` logic.
- **`step.completed_at` is the real source of truth** for step status in metrics — `is_completed` (boolean) is always set together with it, but `metrics.ts` only reads `completed_at`. If debugging why a step doesn't count as completed in `completion_rate`, check `completed_at`, not `is_completed`.
- **`hasPendingTasksInAnyLesson()` blocks the entire course** — a single `testeable_element` with no `is_completed` in any step (including steps the student hasn't visited yet) will prevent the Finish button and the completion modal from activating.