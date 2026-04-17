# Key Files Map — IDE Telemetry

## Core file

### `src/managers/telemetry.ts`
The heart of all telemetry logic in the IDE.

| Lines (approx.) | Contents |
|-----------------|----------|
| 24-57 | `sendBatchTelemetryBreathecode()` |
| 59-76 | `sendBatchTelemetryRigobot()` |
| 91-143 | `fetchTelemetryFromServer()` |
| 164-262 | `reconcileTelemetry()` |
| 267-280 | `submitViaBeacon()` — used for Rigobot keepalive POSTs |
| 283-306 | `sendStreamTelemetry()` |
| 339+ | `stringToBase64` / encoding helpers used by `fixStepData` |
| 424+ | `fixStepData()` — normalizes step event payloads |
| 487+ | `TELEMETRY_WHITELIST_KEYS` — persisted blob whitelist |
| 580+ | `normalizeTelemetrySchema()` |
| 632+ | `buildSubmitPayload()` |
| 757+ | `TelemetryManager.start()` — cloud vs os/vscode bootstrap |
| 908+ | `refreshFromServerIfStale()` |
| 1112+ | `registerStepEvent()` — mutates `current`, `submit()` / `save()` / `streamEvent()` |
| 1323+ | `submit()` — Breathecode batch then Rigobot batch |
| 1369+ | `streamEvent()` — optional streaming URL |
| 1395+ | `submitTelemetryToRigobotViaBeacon()` — unload hook (Rigobot only) |

---

## Store (state logic)

### `src/utils/store.tsx`

| Lines (approx.) | Contents |
|-----------------|----------|
| 454, 493 | Test handlers → `registerTelemetryEvent("test", ...)` |
| 530, 547 | Compile handlers → `registerTelemetryEvent("compile", ...)` |
| 1069, 2656 | `registerTelemetryEvent("open_step", ...)` |
| 2539+ | `startTelemetry` — assigns `TelemetryManager.urls`, calls `TelemetryManager.start()` |
| 2620 | Tab hidden → `TelemetryManager.submit()` (Breathecode + Rigobot) |
| 2630 | `pagehide` / `beforeunload` → `submitTelemetryToRigobotViaBeacon()` (Rigobot only) |
| 2633 | `visibilitychange` listener registration |

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

## Models / shared types

### `src/models/`
Telemetry types live primarily in `src/managers/telemetry.ts`, not in separate model files.
