# Telemetry APIs — IDE

## Environment variables

```
VITE_RIGOBOT_HOST     → https://rigobot.herokuapp.com  (default)
VITE_BREATHECODE_HOST → https://breathecode.herokuapp.com  (default)
```

Batch requests use **two** tokens: Breathecode token on `telemetry.batch`, Rigobot token on `/v1/learnpack/telemetry`.

---

## Rigobot — Primary read/write for the telemetry blob

### GET /v1/learnpack/telemetry

**Purpose:** Fetch the latest stored telemetry blob for reconciliation (cloud bootstrap and stale refresh).

**Implementation:** `fetchTelemetryFromServer()` in `src/managers/telemetry.ts`.

**Query string sent by the IDE** (no other params are added by this client today):

```
GET ${RIGOBOT_HOST}/v1/learnpack/telemetry
  ?user_ids=<user_id>
  &package_slug=<slug>
  &include_buffer=true
  &include_steps=true

Headers:
  Authorization: Token <rigobot_token>
```

Timeout: `FETCH_TELEMETRY_TIMEOUT_MS` (5000ms). On failure or non-OK response, returns `null` and reconciliation falls back to local/new blob as appropriate.

Response shape: JSON with a `results` array; the IDE uses `results[0]` as `ITelemetryJSONSchema | null`.

---

### POST /v1/learnpack/telemetry

**Purpose:** Batch submission of the full telemetry payload (same JSON as Breathecode batch).

**Implementation:** `sendBatchTelemetryRigobot()` in `src/managers/telemetry.ts`.

```
POST ${RIGOBOT_HOST}/v1/learnpack/telemetry

Headers:
  Authorization: Token <rigobot_token>
  Content-Type: application/json

Body: ITelemetryJSONSchema (full blob with computed metrics)
```

**Order relative to Breathecode:** Inside `TelemetryManager.submit()`, **Breathecode batch runs first**. Rigobot POST runs only if Breathecode does not throw.

**Beacon on page unload:** `submitTelemetryToRigobotViaBeacon()` issues a **separate** `POST` with `fetch(..., { keepalive: true })` to this same path. It is **Rigobot only** — it does **not** POST to the Breathecode batch URL.

---

### GET /v1/learnpack/package/${slug}/

**Purpose:** Package metadata on Rigobot — `asset_ids`, **`id`** (LearnPack package id), author checks, etc.

**Used in:**

- `src/utils/apiCalls.ts` — `isPackageAuthor` (status 200 vs 404); `fetchLearnpackPackageAssetIds()` parses `asset_ids` for telemetry batch (Breathecode query param only).
- **`getPackageBySlug()`** — reads **`id`** from the JSON body for Zustand (`packageId` / `packageIdSlug`) and for **`TelemetryManager.mergePackageIdIfMissing`**. Does **not** throw on failure; returns `null` on errors or missing `id`.

```
GET ${RIGOBOT_HOST}/v1/learnpack/package/${packageSlug}/

Headers:
  Authorization: Token <rigobot_token>
```

During `TelemetryManager.start()` (cloud and local agents), the IDE loads `asset_ids` **once** via `fetchLearnpackPackageAssetIds` when `rigo_token` and package slug are present. IDs are kept in memory (`TelemetryManager.packageAssetIds`), not in the persisted telemetry blob.

**Package id for the telemetry blob** is filled separately: **`PackageMetadataListener`** → **`fetchPackageMetadata()`** → **`getPackageBySlug()`** → **`mergePackageIdIfMissing`**. Same URL as above; independent of the `asset_ids` fetch used for Breathecode `asset_id` query params.

---

## Breathecode — Batch mirror

### POST (URL from package config)

**Purpose:** Second destination for the **same** batch body as Rigobot (when `submit()` completes the Breathecode call).

**Implementation:** `sendBatchTelemetryBreathecode()` in `src/managers/telemetry.ts` (builds the final URL with `withAssetIdQuery()` when IDs are present).

**Optional query string** (Breathecode only — not sent on Rigobot batch or on GET telemetry):

```
POST <config.telemetry.batch>?asset_id=<id>[,<id>...]
```

When `TelemetryManager.packageAssetIds` is non-empty (from Rigobot package `asset_ids`), the client appends `asset_id` as a comma-separated list. If the batch URL already contains a `?`, the param is joined with `&`. Empty or missing package record → no `asset_id` param (URL unchanged).

```
POST <config.telemetry.batch>

Headers:
  Authorization: Token <breathecode_token>
  Content-Type: application/json

Body: ITelemetryJSONSchema (same payload as Rigobot batch)
```

The base URL comes from `config.telemetry.batch` in the loaded LearnPack config (`learn.json` / cloud `config.json`). Local templates often set this to `https://breathecode.herokuapp.com/v1/assignment/me/telemetry` (exact string may vary by environment).

---

## Streaming — Optional per-event POSTs

**Purpose:** Fire **individual** step events (`compile`, `test`, `open_step`, etc.) to a separate endpoint **in addition to** the batch blob. **Not required** for progress: the batch path + `save()` holds authoritative step state.

**Implementation:** `streamEvent()` → `sendStreamTelemetry()` in `src/managers/telemetry.ts`.

If `config.telemetry.streaming` is **undefined**, `streamEvent()` returns immediately.

```
POST <config.telemetry.streaming>

Body: {
  slug: string
  telemetry_id: string
  user_id: string
  step_position: number
  event: string
  data: any
}
```

**Auth note:** `sendStreamTelemetry` requires a non-empty token to run, but the current `fetch` call does **not** attach `Authorization` or embed the token in the body. If the streaming endpoint requires auth, that may need to be aligned in code.

---

## CLI — Local bridge (os/vscode agents)

**File:** `src/managers/telemetry.ts` (CLI URL helpers)

```
GET http://localhost:<PORT>/telemetry
→ Retrieve telemetry saved in the CLI

POST http://localhost:<PORT>/telemetry
  Content-Type: application/json
  Body: ITelemetryJSONSchema
→ Save telemetry to the CLI (local file)
```

---

## Error behavior

- **GET telemetry timeout / abort:** returns `null`, reconciliation continues with local or new state
- **4xx/5xx on batch POST:** logged, `submit()` fails as a whole; Rigobot is skipped if Breathecode failed first
- **Page close:** Rigobot `keepalive` beacon only — no delivery guarantee; Breathecode is not called on that path
- **TelemetryManager not initialized** on first event: retry loop (3 attempts, 2s delay) for `registerStepEvent`; `open_step` is gated by `telemetryReady` separately
