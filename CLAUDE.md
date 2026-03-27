# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Turn on DEV_MODE, start Vite dev server with hot reload
npm run build        # Turn off DEV_MODE, then production build (IIFE bundle → app.js + app.css)
npm run dev-build    # Turn on DEV_MODE, then build (for testing with local APIs)
npm run lint         # ESLint — 0 warnings allowed
npm run watch        # Vite build in watch mode
```

## DEV_MODE Flag

`src/utils/development.js` is a Node.js script that rewrites line 12 of `src/utils/lib.tsx` to toggle `DEV_MODE`. The npm scripts call this before Vite. When `DEV_MODE = true`, the app points to `http://localhost:3000` instead of production APIs. Always use `npm run build` (not `dev-build`) for production to ensure `DEV_MODE = false`.

## Architecture

### State Management — Single Zustand Store

All application state lives in **`src/utils/store.tsx`** (~2500 lines). There is no `src/store/` or `src/stores/` directory. The store is the core of the app and contains:

- All state properties (exercises, current position, user/auth, UI flags, telemetry, editor tabs, compilation status, AI/chat state)
- All actions: `start()`, `build()`, `runExerciseTests()`, `resetExercise()`, `setPosition()`, `setLanguage()`, `toggleRigo()`, `registerTelemetryEvent()`, etc.
- Debounced file saving (1.5s debounce)

Import pattern: `import useStore from "./utils/store"` then `const action = useStore((s) => s.action)`.

### Socket.io — Scope-Based Pattern

`src/managers/socket.ts` wraps Socket.io with a **scope** abstraction. Each feature creates an isolated scope via `socket.createScope(scopeName)`, which returns its own `emit()`, `on()`, and `onStatus()` methods. Valid socket actions: `build`, `test`, `run`, `reset`, `reload`, `open`, `preview`, `prettify`, `input`, `generate`, `ai_interaction`, `open_terminal`, `telemetry_event`. Max 5 reconnection attempts.

### Environment Types

`src/managers/fetchManager.ts` switches behavior based on the runtime environment string:
- `localhost` — connects to local CLI dev server
- `localStorage` — reads config from `/config.json` (static/offline)
- `creatorWeb` — uses Rigobot auth token against the production backend
- `scorm` — SCORM-compliant LMS mode

The environment is detected at startup in `store.tsx`'s `start()` action.

### Component Organization

- `src/components/composites/` — multi-feature components (Editor, LessonRenderer, SocketHandler, etc.)
- `src/components/sections/` — page-level: `header/`, `sidebar/`, `modals/`
- `src/components/ui/` — reusable primitives (Radix UI wrappers)
- `src/components/Creator/` — components for the `creatorWeb` environment only

### Event Communication

Two internal messaging systems:
- **EventBus** (`src/managers/eventBus.ts`) — Mitt-based emitter for component-to-component communication
- **EventProxy** (`src/managers/EventProxy.ts`) — wraps Socket.io output, detects user input prompts by language (regex for `prompt()`, `input()`, etc.), generates session UUIDs

### Telemetry

- `src/managers/telemetry.ts` — fetches from Rigobot (BigQuery + Redis), batches POSTs to Breathecode and Rigobot APIs, uses Beacon API on page unload, refreshes after 5 min idle
- `src/utils/metrics.ts` — computes `engagement_indicator` and `frustration_indicator` from step-level metrics (time spent, compilation/test struggles, skipped steps, AI usage)
- Events are registered via `store.registerTelemetryEvent(event, data)`

### Routing

`src/main.tsx` sets up React Router v6:
- `/` and `/preview/:slug` → `App.tsx` (main exercise UI)
- `/preview/:slug/webview` → `PreviewHTMLPage`

`Layout.tsx` is a thin wrapper providing React Hot Toast and Radix UI Tooltip context.

### i18n

`src/utils/i18n.ts` initializes i18next with `src/locales/en.json` and `src/locales/es.json`. Language is stored in the Zustand store and changed via `store.setLanguage()`.

## Build Output

Vite is configured (IIFE format) to produce a single `app.js` + `app.css`. The bundle is served by the learnpack-cli Express server as static assets.
