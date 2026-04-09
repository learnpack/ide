# Telemetry APIs — IDE

## Environment variables

```
VITE_RIGOBOT_HOST     → https://rigobot.herokuapp.com  (default)
VITE_BREATHECODE_HOST → https://breathecode.herokuapp.com  (default)
```

The auth token comes from the user's session (Rigobot token).

---

## Rigobot — Primary endpoint

### GET /v1/learnpack/telemetry
**Purpose:** Fetch telemetry from the server on startup or refresh.
**File:** `telemetry.ts:154`

```
GET ${RIGOBOT_HOST}/v1/learnpack/telemetry
  ?user_ids=<user_id>
  &package_slug=<slug>
  &package_ids=<package_id>
  &include_buffer=true
  &include_steps=true

Headers:
  Authorization: Token <rigobot_token>
```

Timeout: `FETCH_TELEMETRY_TIMEOUT_MS = 5000ms`
Response: `ITelemetryJSONSchema | null`

---

### POST /v1/learnpack/telemetry
**Purpose:** Batch submission of the full blob.
**File:** `telemetry.ts:59`

```
POST ${RIGOBOT_HOST}/v1/learnpack/telemetry

Headers:
  Authorization: Token <rigobot_token>
  Content-Type: application/json

Body: ITelemetryJSONSchema (full blob with computed metrics)
```

Also called with `keepalive: true` on `pagehide`/`beforeunload` (beacon).

---

### GET /v1/learnpack/package/${slug}/
**Purpose:** Resolve `package_id` from the package slug.
**File:** `telemetry.ts:89`

```
GET ${RIGOBOT_HOST}/v1/learnpack/package/${packageSlug}/

Headers:
  Authorization: Token <rigobot_token>
```

Timeout: `RESOLVE_PACKAGE_ID_TIMEOUT_MS = 5000ms`
Response: `{ id: number, ... }`

---

## Breathecode — Secondary endpoint

### POST (URL configured in the package)
**Purpose:** Alternate batch submission, complementary to Rigobot.
**File:** `telemetry.ts:23-56`

```
POST <config.batch_url>

Headers:
  Authorization: Token <breathecode_token>
  Content-Type: application/json

Body: ITelemetryJSONSchema (same payload as Rigobot)
```

The URL comes from `config.telemetry.batch` in the LearnPack package config.

---

## Streaming — Individual real-time events

**Purpose:** Send individual events during the session (not batch).
**File:** `telemetry.ts:1342-1362`

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

---

## CLI — Local bridge (os/vscode agents)

**File:** `telemetry.ts:361-384`

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

- **Timeout** (package resolve or fetch): returns `null`, continues with local data
- **4xx/5xx HTTP**: error is logged, Promise is rejected, **no retry**
- **Tab closed**: beacon with `keepalive: true` — one-way, no delivery confirmation
- **TelemetryManager not initialized**: retry loop of 3 attempts with 2s delay
