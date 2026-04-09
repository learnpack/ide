# Key Files Map — IDE Telemetry

## Core file

### `src/managers/telemetry.ts`
The heart of all telemetry logic in the IDE.

| Lines | Contents |
|-------|----------|
| 1-50 | Timeout constants, imports, auxiliary types |
| 23-56 | `sendBatchTelemetryBreathecode()` |
| 58-75 | `sendBatchTelemetryRigobot()` |
| 82-107 | `getRigobotPackageIdBySlug()` |
| 129-193 | `fetchTelemetryFromServer()` |
| 214-314 | `reconcileTelemetry()` — local/server reconciliation logic |
| 386-391 | `encode()` / `decode()` — base64 for source code |
| 539-555 | localStorage key whitelist |
| 587-640 | `normalize()` — normalizes blob before saving |
| 649 | Metrics and indicators computation in `submit()` |
| 759-870 | `TelemetryManager.start()` — full bootstrap |
| 859 | Auto-submit when source is "local" |
| 964-1007 | `refreshFromServerIfStale()` |
| 1061 | `open_step` registration in store |
| 1114-1124 | Event registration retry loop (3 attempts, 2s) |
| 1164 | Submit on test complete with exit_code === 0 |
| 1197 | Submit on quiz submitted |
| 1212 | Session duration registration |
| 1234 | Complete last step of the course |
| 1240 | Submit on step opened |
| 1250 | `save()` after each event |
| 1296-1324 | `submit()` — batch send to Rigobot + Breathecode |
| 1332 | Sync to CLI when agent is os/vscode |
| 1342-1362 | `streamEvent()` — individual streaming |

---

## Store (state logic)

### `src/store.tsx`

| Lines | Contents |
|-------|----------|
| 424, 480 | Test success/failure handlers → `test` event registration |
| 520, 538 | Compilation success/failure handlers → `compile` event registration |
| 547 | Compilation event start |
| 1061 | `registerTelemetryEvent("open_step", ...)` |
| 2611 | Submit on tab hidden (`visibilitychange`) |
| 2621 | Beacon on page close (`pagehide`/`beforeunload`) |
| 2624 | `visibilitychange` listener |
| 2625-2626 | `beforeunload` / `pagehide` listeners |
| 2647 | Alternative `open_step` registration |

---

## Components that register events

### `src/components/composites/Agent.tsx`
- Line **618**: Registers `ai_interaction` when AI response completes

### `src/components/composites/NewAgent.tsx`
- Line **544**: Registers `ai_interaction` (new agent variant)

### `src/components/composites/QuizRenderer.tsx`
- Line **76-84**: `registerTesteableElement` on mount (debounced 2s), passes `language`
- Line **249-258**: `registerTesteableElement` on quiz submission, passes `language`
- Line **228**: Registers `quiz_submission`

### `src/components/composites/Markdowner.tsx` (`FillInTheBlankRenderer`)
- Line **1082-1088**: `registerTesteableElement` on mount (debounced 2s), passes `language`
- Line **1239**: Registers `quiz_submission` (inline quizzes in markdown)

### `src/components/composites/OpenQuestion.tsx`
- Line **101-103**: `registerTesteableElement` on mount (debounced 2s), passes `language`
- Line **237-246**: `registerTesteableElement` on successful evaluation, passes `language`
- Line **250**: Registers `quiz_submission` (open-ended questions)

### `src/components/composites/LessonRenderer/LessonRenderer.tsx`
- Emits `lesson_rendered` eventBus event in a `useEffect` whenever `currentContent` or
  `currentExercisePosition` changes. This signals `TelemetryManager.onLessonRendered`
  to start the 7s debounce for read-only step detection.

### `src/managers/eventBus.ts`
- Typed event bus (mitt). Relevant telemetry events:
  - `lesson_rendered: { stepPosition: number }` — emitted by LessonRenderer, consumed by `onLessonRendered`
  - `last_lesson_finished: {}` — triggers `completeStepIfReadOnly(lastPos)` in eventListener
  - `position_changed: {}` — step navigation confirmed

---

## Privacy and sanitization

### `src/utils/piiSanitizer.ts`
- Lines **78-91**: Masks `fullname → "[REDACTED]"` in telemetry
- Lines **101-120**: Hook on `LocalStorage.set()`
- Removes: `email`, `user.email`, `user.first_name`, `user.last_name`, `user.github`

### `src/managers/localStorage.ts`
- Lines **16-23**: `LocalStorage.set()` — sanitizer interception point
- Telemetry key: `"TELEMETRY"`

---

## Models / shared types

### `src/models/`
Telemetry types live primarily in `src/managers/telemetry.ts`, not in separate model files.
