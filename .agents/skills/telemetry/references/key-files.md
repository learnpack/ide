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
| 567 | `normalizeWorkoutSession()` — session array normalization |
| 589-664 | `normalizeTelemetrySchema()` — normalizes blob before saving |
| 790+ | `TelemetryManager.start()` — full bootstrap |
| 983 | Auto-submit when source is "local" |
| 995+ | `refreshFromServerIfStale()` |
| 1145-1153 | Event registration retry loop (3 attempts, 2s) |
| 1187 | Submit on test complete with exit_code === 0 |
| 1205 | `case "quiz_submission"` — quiz completion logic |
| 1236 | Submit on quiz submitted |
| 1240 | `case "open_step"` — step navigation handler |
| 1289 | `save()` after each event |
| 1341+ | `submit()` — batch send to Rigobot + Breathecode |

---

## Store (state logic)

### `src/store.tsx`

| Lines | Contents |
|-------|----------|
| 454, 493 | Test success/failure handlers → `test` event registration |
| 530, 547 | Compilation success/failure handlers → `compile` event registration |
| 1061 | `registerTelemetryEvent("open_step", ...)` |
| 2626-2628 | `visibilitychange`, `beforeunload`, `pagehide` listeners |
| 2649 | Alternative `open_step` registration |

---

## Components that register events

### `src/components/Rigobot/Agent.tsx`
- Line **618**: Registers `ai_interaction` when AI response completes

### `src/components/Rigobot/NewAgent.tsx`
- Line **544**: Registers `ai_interaction` (new agent variant)

### `src/components/composites/QuizRenderer/QuizRenderer.tsx`
- Line **231**: Registers `quiz_submission`

### `src/components/composites/Markdowner/Markdowner.tsx`
- Line **1242**: Registers `quiz_submission` (inline quizzes in markdown)

### `src/components/composites/OpenQuestion/OpenQuestion.tsx`
- Line **254**: Registers `quiz_submission` (open-ended questions)

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
