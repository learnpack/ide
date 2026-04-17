---
name: telemetry-ide
description: >
  Complete knowledge of the telemetry system in the LearnPack IDE (ide/).
  Use this skill whenever working on any telemetry-related task in this repo:
  new tracking features, event bug fixes, changes to local/server reconciliation,
  data schema modifications, Rigobot integration, engagement/frustration metrics,
  or any question about how telemetry data flows. Also applies for onboarding
  new developers to this module. Always use this skill when the user touches
  TelemetryManager, registerTelemetryEvent, registerTesteableElement,
  hasPendingTasks, is_completed, testeable_elements, quiz_submission, open_step,
  reconcileTelemetry, normalizeTelemetrySchema, workout_session, lesson_rendered,
  completeStepIfReadOnly, onLessonRendered, activeHashes, or anything related to
  completion_rate, step tracking, or telemetry submission/persistence.
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
    └─ submit() → POST Breathecode (batch URL) then POST Rigobot (same JSON body)
```

### Batch vs streaming

**Student progress is carried by the batch blob**, not by the streaming channel.

- Every `registerStepEvent()` updates `TelemetryManager.current`, then **`save()`** (localStorage or CLI file).
- **`submit()`** sends the **full blob** to **`config.telemetry.batch`** (Breathecode) and to **Rigobot** (`/v1/learnpack/telemetry`).
- **`config.telemetry.streaming`** is **optional**. Default LearnPack templates often define only `telemetry.batch`. If `streaming` is missing, `streamEvent()` returns immediately and **no** per-event HTTP firehose runs — the student’s work is still recorded via **`save()`** and **batch `submit()`**.

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
- `registerTesteableElement()` → **must use `currentExercisePosition`** (array index), not `exercise.position`. Using `.position` causes testeable elements to land in a different step slot, breaking `hasPendingTasks` checks.

## Main file

**`src/managers/telemetry.ts`** — contains almost all the logic:
- `TelemetryManager` singleton: `start()`, `save()`, `submit()`, `registerStepEvent()`, `reconcileTelemetry()`
- TypeScript types: `ITelemetryJSONSchema`, `TStep`, `TCompilationAttempt`, etc.
- Bootstrap functions, server fetch, base64 encoding

## Event types

| Event | Registered in | Trigger |
|-------|--------------|---------|
| `compile` | `store.tsx` | Compilation result via socket |
| `test` | `store.tsx` | Test result via socket |
| `ai_interaction` | `Rigobot/Agent.tsx`, `Rigobot/NewAgent.tsx` | AI completes response |
| `open_step` | `store.tsx` (guarded by `telemetryReady`) | User navigates to a step |
| `quiz_submission` | `QuizRenderer.tsx`, `Markdowner.tsx`, `OpenQuestion.tsx` | User submits quiz |

Additionally, `LessonRenderer.tsx` emits the `lesson_rendered` eventBus event whenever
`currentContent` changes. This is not a `registerStepEvent` call — it's an internal
signal used by `onLessonRendered` to detect read-only steps (see below).

## How to register a new event

1. Call `TelemetryManager.registerStepEvent(stepPosition, eventType, data)` from the component/store (via `registerTelemetryEvent` in the store)
2. The event is appended to the corresponding array in `TelemetryManager.current.steps[n]`
3. `save()` is called automatically after each registration
4. Add the new type to `TStep` (see `references/schema.md`)

For compilation/test events, data must be base64-encoded (see `stringToBase64` / `fixStepData` in `src/managers/telemetry.ts`).

## Lifecycle and submission triggers

**Bootstrap** (cloud agent — `TelemetryManager.start`):
1. Load prior blob from `localStorage` (same tutorial slug only)
2. `GET ${RIGOBOT_HOST}/v1/learnpack/telemetry?...` with `user_ids`, `package_slug`, `include_buffer=true`, `include_steps=true` — 5s timeout (`FETCH_TELEMETRY_TIMEOUT_MS`)
3. `reconcileTelemetry()` (see Reconciliation section)
4. Apply session fields (`user_id`, `fullname`, `cohort_id`, `academy_id`), `save()`, then if reconciliation source is `"local"`, **`submit()`** immediately

There is **no separate “resolve package_id” HTTP step** in this bootstrap path; `package_id` may appear inside stored or server blobs and is preserved when whitelisted.

**`submit()` — dual batch POST (same body, strict order):**
1. `POST` **`config.telemetry.batch`** with **Breathecode** token (`Authorization: Token <breathecode_token>`).
2. If that succeeds, `POST` **`${RIGOBOT_HOST}/v1/learnpack/telemetry`** with **Rigobot** token.

If the Breathecode POST **throws**, the Rigobot POST is **not** attempted (single `try` / sequential `await`).

**When `submit()` runs** (non-exhaustive):
- After **`test`** when `exit_code === 0` (and related completion logic)
- After **`quiz_submission`**
- After **`open_step`**
- Cloud: when the tab becomes **hidden** (`visibilitychange` → `TelemetryManager.submit()`)

**Page unload — Rigobot-only beacon:**

On `beforeunload` / `pagehide` (cloud), `submitTelemetryToRigobotViaBeacon()` sends **one** `fetch` with **`keepalive: true`** to **Rigobot only**. It does **not** call the Breathecode batch URL. This is a best-effort last send when the page is tearing down; the hidden-tab `submit()` path is what reliably hits **both** backends during normal navigation.

**Server refresh:**
- On tab focus if idle > 5 minutes (`TELEMETRY_VISIBILITY_REFRESH_IDLE_MS`) — refetch Rigobot telemetry and merge via `normalizeTelemetrySchema` when server `last_interaction_at` is newer

## Local ↔ server reconciliation

Function: `reconcileTelemetry()` — `src/managers/telemetry.ts` (`export function reconcileTelemetry`)

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
- Steps in the stored blob that have no matching slug in `freshSteps` are discarded.
- Steps in `freshSteps` with no match in the stored blob get blank defaults.

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
- Email is **never** sent in telemetry
- `user.email`, `user.first_name`, `user.last_name`, `user.github` removed from localStorage
- No explicit opt-out mechanism; without a Rigobot token, no data is sent to the server

## How `is_completed` gets set (state machine)

`step.is_completed` and `step.completed_at` are always set together. There are five paths:

| Path | Mechanism | Key conditions |
|------|-----------|----------------|
| Test passes | `case "test"` | `exit_code === 0` AND `!hasPendingTasks(pos)` AND `!step.completed_at` |
| Quiz succeeds | `case "quiz_submission"` | `status === "SUCCESS"` AND no other active pending elements AND `!step.completed_at` |
| Navigate away from step | `case "open_step"` — auto-completes **previous** step | `prev.testeable_elements?.length > 0` AND `!hasPendingTasks(prevStep)` AND `!prev.completed_at` |
| Read-only step (any step) | `onLessonRendered` → `completeStepIfReadOnly` — 7s debounce after `lesson_rendered` | `!step.testeable_elements?.length` AND `!step.is_testeable` AND `!step.completed_at` |
| Last step — user clicks Finish | `completeStepIfReadOnly` via `last_lesson_finished` in eventListener | Same as above — safety net if 7s debounce hasn't fired yet |

**Critical:** `open_step` only auto-completes the previous step if `testeable_elements`
is **non-empty**. Steps with empty `testeable_elements` are never completed by departure
— they rely exclusively on `onLessonRendered` (7s debounce) to decide if they're
read-only. This prevents a race condition where a quiz step whose components haven't
mounted yet looks indistinguishable from a read-only step.

### `completeStepIfReadOnly`

Called from `onLessonRendered` (for all steps) and from the `last_lesson_finished`
handler (safety net for the last step). It is a no-op if:
- `step.completed_at` already set (already completed via quiz/test)
- `step.testeable_elements?.length > 0` (has registered quiz/test elements — not read-only)
- `step.is_testeable === true` (code-test step whose element may not have registered yet)

### `onLessonRendered`

Listens to the `lesson_rendered` eventBus event. On each emission:
1. Cancels any pending debounce (prevents stale completions from previous step)
2. Schedules `completeStepIfReadOnly(stepPosition)` with a **7-second debounce**

The 7s window gives quiz/FITB/OQ components time to mount, compute their hashes,
and call `registerTesteableElement`. If no elements are registered after 7s, the
step is genuinely read-only and gets marked complete.

**Diagnosing `is_completed` bugs:**
- Stays `false` unexpectedly → check `hasPendingTasks`: any stale/orphaned element?
  Is `testeable_elements` in the correct step slot (array index)? Did `registerTesteableElement`
  run before or after `registerStepEvent`?
- Set `true` unexpectedly → was `open_step` fired before `testeable_elements` was
  populated (race condition)? Check `telemetryReady` guard. Did `onLessonRendered`
  fire 7s after a step that had slow quiz registration?

## `testeable_elements` and `hasPendingTasks`

`testeable_elements` is a per-step array of trackable sub-tasks (quiz questions,
code tests). The step is only complete when all active items are done.

### `hasPendingTasks(stepPosition)` — logic

```
1. If testeable_elements is empty → return false (no tasks, nothing pending)
2. If any element with type === "test" is incomplete → return true
3. Filter quiz elements. If none → return false
4. For each language in activeHashes:
     collect the hashes of this step that appear in that language's set
     if all of them are is_completed === true → return false  (OR logic: one complete language = done)
5. return true  (no language found where all active quizzes are done)
```

**Key behavior:** `hasPendingTasks` uses **OR logic across languages** — the step is
considered done if ALL active quiz hashes of **at least one language** are completed.
Orphaned hashes (not in `activeHashes`) are completely ignored.

### `hasPendingTasksInAnyLesson()` — logic

Does **not** delegate to `hasPendingTasks`. Uses `is_completed` directly:

```typescript
return steps.some(step =>
  (step.is_testeable || step.testeable_elements?.length) && !step.is_completed
)
```

This avoids any dependency on `activeHashes` (in-memory, session-only) and works
correctly for all steps, including those not visited in the current session.

**The sidebar** (`ExercisesList.tsx`) uses `TelemetryManager.isStepCompleted(position)`
(reads `step.is_completed` from persisted data) instead of `hasPendingTasks`, which
requires in-memory session state only available for the currently rendered step.

### The double-call pattern

For quizzes and tests, a single "user completed X" maps to two calls:

```
registerTelemetryEvent(event, data)      → records attempt, checks hasPendingTasks,
                                           may set is_completed, calls submit()

registerTesteableElement(index, element) → updates testeable_elements cache,
                                           calls save() only (NOT submit())
```

`registerStepEvent` runs synchronously and reads `testeable_elements` **before**
`registerTesteableElement` updates it. When diagnosing completion bugs, always
check the call order in the triggering code.

**The fix for quiz completion** (`case "quiz_submission"`): instead of `hasPendingTasks()`
(which would include the current quiz's stale element), check only OTHER active elements:
`step.testeable_elements?.some(e => e.hash !== data.quiz_hash && !e.is_completed)`.

## Course completion architecture

### Layer 1 — `step.completed_at` (metrics source of truth)

`metrics.ts` derives step status from `step.completed_at`, **not** `step.is_completed`:

```typescript
let status = step.completed_at ? "completed" : step.opened_at ? "attempted" : "unread";
```

If `completed_at` is missing, the step is never counted in `completion_rate`.

### Layer 2 — `hasPendingTasks` / `hasPendingTasksInAnyLesson` (real-time gate)

- `hasPendingTasks(stepPosition)` — language-aware, `activeHashes`-filtered check for the **current rendered step**
- `hasPendingTasksInAnyLesson()` — reads `is_completed` directly; works for all steps including unvisited ones

### Layer 3 — "Finish" button and last_lesson_finished modal

```
isFinishDisabled = isLastExercise && (hasPendingTasks || hasPendingTasksInAnyLesson)
```

When the student clicks Finish: `eventBus.emit("last_lesson_finished")` →
`EventListener` re-checks `hasPendingTasksInAnyLesson()` → confetti + modal.

### Layer 4 — `completion_rate` in the telemetry payload

```typescript
completion_rate = (steps_with_completed_at / total_steps) * 100
```

## Hash generation per testeable element type

Each testeable element is identified by a SHA-256 hash (`asyncHashText`, `lib.tsx:361`):

| Type | Input to `asyncHashText` |
|------|--------------------------|
| **Quiz (MCQ)** | `renderedGroups.join(" ")` — rendered group titles (`QuizRenderer.tsx`) |
| **Open question** | `metadata.eval` — the `eval` attribute string (`Markdowner.tsx`) |
| **Fill-in-the-blank** | `buildFillInTheBlankIdentityString(code, metadata)` — format: `fitb:<code>:<idx>=<answer>\|...` |

All three types are **language-sensitive**: hash inputs come from README content,
which is fetched per locale. The same element in a different language produces a
different hash.

### Known limitation: content edits orphan progress

Any text change to quiz content produces a new hash. The old element stays in
`testeable_elements` with its previous `is_completed` state. The student loses
visible progress on that question. Orphaned elements are ignored by `hasPendingTasks`
(via `activeHashes` filter) so they don't block completion, but they accumulate over
time.

### `activeHashes` — in-memory orphan filter

`TelemetryManager.activeHashes: Map<language, Set<hash>>` — **not persisted**,
rebuilt each session as quiz components mount.

**How it works:**
- `registerTesteableElement` adds the hash to `activeHashes[language]` when
  `type === "quiz"` and a language is provided.
- `hasPendingTasks` iterates `activeHashes` entries and applies OR logic across
  languages (see above). Hashes not in any language's set are ignored.
- Code tests (`type: "test"`) are never orphaned — they are always evaluated
  regardless of `activeHashes`.

`activeHashes` is reset to an empty `Map` at the start of each `TelemetryManager.start()`
call, preventing hash leakage when switching courses in the same tab.

## Multi-language progress in `testeable_elements`

Quiz elements (MCQ, open question, FITB) produce different hashes per language.
Progress per language is tracked independently via `TTesteableElement.language`.

- `language` is set on registration for `type === "quiz"` elements by `QuizRenderer.tsx`,
  `Markdowner.tsx` (FITB), and `OpenQuestion.tsx`. Omitted for `type: "test"`.
- `hasPendingTasks` uses OR logic: if ALL active hashes of **at least one language**
  are completed, the step is done. This means completing a course in Spanish does not
  require having also completed quizzes in English.
- `hasPendingTasksInAnyLesson()` reads `step.is_completed` directly and is not
  affected by language at all.
- Legacy stored elements without `language` (from before multi-language support) are
  treated as matching every language check — they will block completion in any locale
  until re-answered.

**If completion looks wrong in a multi-language course:**
1. Inspect `step.testeable_elements` — confirm quiz rows include `language`.
2. Check that `registerTesteableElement` is being called with the `language` argument
   in `QuizRenderer.tsx`, `Markdowner.tsx`, `OpenQuestion.tsx`.
3. Legacy rows without `language` can block completion across locales.

## workout_session mechanics

`workout_session` is an array of `{ started_at, ended_at? }` objects tracking study periods.
Each `TelemetryManager.start()` call closes the previous session (sets `ended_at =
last_interaction_at` if no `ended_at`) and opens a new one. Handled by
`normalizeWorkoutSession()` inside `normalizeTelemetrySchema`.

## Important gotchas

- **`open_step` is guarded by `telemetryReady`** — `setPosition` only fires
  `open_step` when `telemetryReady === true`. This prevents a 2s retry from being
  enqueued before `TelemetryManager.start()` completes, which could trigger completion
  logic with stale state. `startTelemetry()` registers the initial `open_step` itself.

- **Race condition: `startTelemetry` + `getOrCreateActiveSession`** — both are called
  concurrently on startup. If `getOrCreateActiveSession` resolves after telemetry is
  ready and calls `setPosition(N)` for the same step that's already open, `open_step(N)`
  fires with `prevStep === N === stepPosition`. The guard `this.prevStep !== stepPosition`
  prevents this from triggering auto-completion.

- **`open_step` never completes steps with empty `testeable_elements`** — read-only step
  completion relies on `onLessonRendered` (7s debounce). Never add completion logic to
  `open_step` for steps with `testeable_elements.length === 0` — it cannot distinguish
  a read-only step from a quiz step whose components haven't mounted yet.

- **`TelemetryManager` may not be initialized when the first event fires** → retry loop
  of 3 attempts with 2s delay. Note: `open_step` is excluded from this retry mechanism
  via the `telemetryReady` guard in `setPosition`.

- **Keys persisted in localStorage have a strict whitelist** (`TELEMETRY_WHITELIST_KEYS` in `src/managers/telemetry.ts`) —
  fields outside the whitelist are discarded during normalization.

- **No HTTP retry**: if a POST fails, it is logged and discarded.

- **Source code, stdout, and stderr are always base64-encoded.**

- **Never use `exercise.position` to index `current.steps`** — always use the array
  index. `exercise.position` can differ from the array index if the tutorial was
  reordered or the server returned steps out of order.

- **`step.completed_at` is the real source of truth** for metrics — `metrics.ts` only
  reads `completed_at`. If debugging why a step doesn't count in `completion_rate`,
  check `completed_at`, not `is_completed`.

- **`hasPendingTasksInAnyLesson()` blocks the entire course** — a single step with
  `is_completed: false` and `is_testeable || testeable_elements.length` will prevent
  the Finish button and completion modal, even for unvisited steps.

- **`console.log` objects in browser devtools show live references** — expanding an
  object in the console shows its *current* state, not the state at log time. When
  debugging `is_completed` mutations, always log the primitive value separately
  (`console.log(step.is_completed)`) alongside the object to get an accurate snapshot.
