# Telemetry Schema — IDE

## Main types (src/managers/telemetry.ts)

### ITelemetryJSONSchema (root blob)

```typescript
interface ITelemetryJSONSchema {
  telemetry_id?: string          // blob UUID
  user_id: string
  fullname: string               // "[REDACTED]" in localStorage
  slug: string                   // package/course slug
  package_id?: number | string   // Rigobot LearnPack package id (merge fills via String())
  version: string                // e.g. "CLOUD:0.46.0"
  cohort_id: string | null
  academy_id: string | null
  agent: "cloud" | "os" | "vscode"
  tutorial_started_at: number    // timestamp ms
  last_interaction_at: number    // timestamp ms — used for reconciliation
  steps: TStep[]
  workout_session: TWorkoutSession[]
  global_metrics?: GlobalMetrics
  global_indicators?: TIndicators
}
```

### TStep

```typescript
interface TStep {
  slug: string
  position: number
  files: IFile[]
  is_testeable: boolean
  opened_at?: number             // timestamp ms
  completed_at?: number          // timestamp ms
  sessions?: number[]            // session durations in ms
  compilations: TCompilationAttempt[]
  tests: TTestAttempt[]
  ai_interactions: TAIInteraction[]
  quiz_submissions: TQuizSubmission[]
  testeable_elements?: TTesteableElement[]
  metrics?: StepMetrics          // computed in submit()
  indicators?: TIndicators       // computed in submit()
}
```

### TCompilationAttempt / TTestAttempt

```typescript
interface TCompilationAttempt {
  source_code: string   // base64(encodeURIComponent(code))
  stdout: string        // base64
  stderr?: string       // base64, only present on error
  exit_code: number     // 0 = success
  started_at: number    // timestamp ms
  ended_at: number      // timestamp ms
}
// TTestAttempt has the same structure
```

### TAIInteraction

```typescript
interface TAIInteraction {
  student_message: string
  source_code: string   // base64
  ai_response: string
  started_at: number
  ended_at: number
}
```

### TQuizSubmission

```typescript
interface TQuizSubmission {
  quiz_hash: string
  selections: Array<{
    question: string
    answer: string
    isCorrect: boolean
    feedback?: string
  }>
  status: "SUCCESS" | "ERROR"
  percentage: number
  started_at: number
  ended_at: number
}
```

### TTesteableElement

```typescript
interface TTesteableElement {
  hash: string
  type: "quiz" | "test"
  is_completed?: boolean
  language?: string              // locale code ("en", "es", …); set for type === "quiz", omitted for "test"
  searchString?: string          // first 200 chars of content, for debugging/display
  metrics?: TTesteableElementMetrics
}
```

`language` is the key that enables multi-language progress tracking. It is set by
`QuizRenderer.tsx`, `Markdowner.tsx` (FITB), and `OpenQuestion.tsx` when calling
`registerTesteableElement`. Elements without `language` (legacy data) are treated
as matching every locale check in `hasPendingTasks`.

### TWorkoutSession

```typescript
interface TWorkoutSession {
  started_at: number
  ended_at?: number
}
```

### TIndicators

```typescript
interface TIndicators {
  engagement_indicator: number   // 0-100
  frustration_indicator: number  // 0-100
}
```

## Per-step computed metrics (StepMetrics)

Computed automatically on every `submit()`:

- `time_spent` — total time on the step (ms)
- `comp_struggles` — failed compilations
- `comp_success` — successful compilations
- `test_struggles` — failed tests
- `test_success` — passed tests
- `quiz_struggles` / `quiz_success`
- `streak_*` — consecutive streaks
- `ai_used` — boolean, whether Rigobot was used
- `is_abandoned` — has failures but no successes

## localStorage persistence whitelist

Only these top-level keys are saved (telemetry.ts:539-555):

```
telemetry_id, user_id, fullname, slug, package_id, version,
cohort_id, academy_id, agent, tutorial_started_at, last_interaction_at,
steps, workout_session, global_metrics, global_indicators
```

Any key outside this list is discarded by `normalize()`.

## Binary data encoding

```typescript
// telemetry.ts:386-391
const encode = (s: string) => btoa(encodeURIComponent(s))
const decode = (s: string) => decodeURIComponent(atob(s))
```

Applies to: `source_code`, `stdout`, `stderr` in compilations and tests.
