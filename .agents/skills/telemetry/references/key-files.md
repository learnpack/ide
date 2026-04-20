# Key Files Map — IDE Telemetry

## Core file

### `src/managers/telemetry.ts`
The heart of all telemetry logic in the IDE.

| Lines (approx.) | Contents |
|-----------------|----------|
| 25-31 | `withAssetIdQuery()` — appends `asset_id` to Breathecode batch URL |
| 33+ | `sendBatchTelemetryBreathecode()` — optional `packageAssetIds` for Breathecode query |
| (next) | `sendBatchTelemetryRigobot()` |
| 103+ | `fetchTelemetryFromServer()` |
| (next) | `reconcileTelemetry()` |
| (next) | `submitViaBeacon()` — used for Rigobot keepalive POSTs |
| (next) | `sendStreamTelemetry()` |
| (next) | `stringToBase64` / encoding helpers used by `fixStepData` |
| (next) | `fixStepData()` — normalizes step event payloads |
| (next) | `TELEMETRY_WHITELIST_KEYS` — persisted blob whitelist |
| (next) | `normalizeTelemetrySchema()` |
| (next) | `buildSubmitPayload()` |
| ~1359–1399 | `submit()` — dual batch POST; on success copies `global_metrics` / `global_indicators` from payload to `current` + `save()` |
| ~1421–1434 | `mergePackageIdIfMissing()` — fills `package_id` string when absent |
| 772+ | `TelemetryManager.start()` — cloud vs os/vscode bootstrap; loads `packageAssetIds` |
| (next) | `refreshFromServerIfStale()` |
| (next) | `registerStepEvent()` — mutates `current`, `submit()` / `save()` / `streamEvent()` |
| 1358+ | `submit()` — Breathecode batch (with `asset_id` query when set) then Rigobot batch |
| (next) | `streamEvent()` — optional streaming URL |
| (next) | `submitTelemetryToRigobotViaBeacon()` — unload hook (Rigobot only) |

---

## Store (state logic)

### `src/utils/store.tsx`

| Lines (approx.) | Contents |
|-----------------|----------|
| 454, 493 | Test handlers → `registerTelemetryEvent("test", ...)` |
| 530, 547 | Compile handlers → `registerTelemetryEvent("compile", ...)` |
| 1069, 2656 | `registerTelemetryEvent("open_step", ...)` |
| ~872–876 | `fetchExercises` — if config **slug** changes from a previous non-empty value, clears `packageId` / `packageIdSlug` |
| ~895–911 | `fetchPackageMetadata` — `getPackageBySlug`, cache by slug, `mergePackageIdIfMissing` |
| `startTelemetry` | Assigns `TelemetryManager.urls`, `skipDuplicateBootstrap` guard, `await TelemetryManager.start()`, `mergePackageIdIfMissing` if store `packageId` set; `telemetryReady` only on success; initial struggle listeners + `open_step` only when not skipping duplicate bootstrap |
| `ensureTelemetryStarted` | Delegates to `startTelemetry()` — call after **`loginToRigo`**, **`refreshDataFromAnotherTab`**, **`checkRigobotInvitation`** when session arrives after bootstrap |
| `loginToRigo` / `refreshDataFromAnotherTab` / `checkRigobotInvitation` | Late session: `await getOrCreateActiveSession()` then `await ensureTelemetryStarted()` (plus `initRigoAI` in `refreshDataFromAnotherTab`) |
| (in `startTelemetry`) | Tab hidden → `TelemetryManager.submit()`; `pagehide` / `beforeunload` → `submitTelemetryToRigobotViaBeacon()`; `visibilitychange` listener — guarded by `telemetryLifecycleListenersRegistered` |

---

## Package id wiring

### `src/components/PackageMetadataListener.tsx`
- `useEffect` on **Rigobot token** + **config slug**; calls `fetchPackageMetadata()` when both are non-empty (no UI).

---

## Components that register events

### `src/components/Rigobot/Agent.tsx`
- Registers `ai_interaction` when AI response completes

### `src/components/Rigobot/NewAgent.tsx`
- Registers `ai_interaction` (new agent variant)

### `src/components/composites/QuizRenderer.tsx`
- `registerTesteableElement` on mount / submission (with `language`)
- Registers `quiz_submission`

### `src/components/composites/Markdowner.tsx` (`FillInTheBlankRenderer`)
- `registerTesteableElement` (with `language`)
- Registers `quiz_submission` for inline quizzes

### `src/components/composites/OpenQuestion.tsx`
- `registerTesteableElement` (with `language`)
- Registers `quiz_submission`

### `src/components/composites/LessonRenderer/LessonRenderer.tsx`
- Emits `lesson_rendered` eventBus event in a `useEffect` whenever `currentContent` or
  `currentExercisePosition` changes. This signals `TelemetryManager.onLessonRendered`
  to start the debounce for read-only step detection.

### `src/managers/eventBus.ts`
- Typed event bus (mitt). Relevant telemetry events:
  - `lesson_rendered: { stepPosition: number }` — emitted by LessonRenderer, consumed by `onLessonRendered`
  - `last_lesson_finished: {}` — triggers `completeStepIfReadOnly(lastPos)` in eventListener
  - `position_changed: {}` — step navigation confirmed

---

## Privacy and sanitization

### `src/utils/piiSanitizer.ts`
- Masks `fullname → "[REDACTED]"` in telemetry
- Hook on `LocalStorage.set()`
- Removes: `email`, `user.email`, `user.first_name`, `user.last_name`, `user.github`

### `src/managers/localStorage.ts`
- `LocalStorage.set()` — sanitizer interception point
- Telemetry key: `"TELEMETRY"`

---

## API helpers

### `src/utils/apiCalls.ts`

- `fetchLearnpackPackageAssetIds()` — GET Rigobot package, returns `asset_ids` as `number[]` for Breathecode batch URL (telemetry bootstrap).
- `getPackageBySlug()` — GET same package URL; returns `{ id }` or `null` (no throw); used for `package_id` merge path.

### `src/App.tsx`
- Renders `<PackageMetadataListener />` next to other global listeners.

---

## Models / shared types

### `src/models/`
Telemetry types live primarily in `src/managers/telemetry.ts`, not in separate model files.
