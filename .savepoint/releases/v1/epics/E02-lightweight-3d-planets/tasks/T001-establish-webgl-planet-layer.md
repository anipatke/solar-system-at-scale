---
id: E02-lightweight-3d-planets/T001-establish-webgl-planet-layer
status: done
objective: Add the native WebGL planet layer, shared geometry, frame contract, and complete 2D fallback lifecycle.
depends_on: []
complexity_tier: high
complexity_reason: Adds cross-module rendering infrastructure and failure recovery without disrupting the existing journey.
---

# T001: Establish the WebGL Planet Layer

## Problem

The scene has no isolated 3D layer or safe WebGL activation path that preserves the working Canvas journey.

## Context Files

- `.savepoint/releases/v1/epics/E02-lightweight-3d-planets/E02-Detail.md`
- `.savepoint/Design.md`
- `.savepoint/Guardrails.md`
- `.savepoint/Health-Check.md`
- `index.html`
- `style.css`
- `main.js`
- `rendering/planet-renderer.js`
- `rendering/planet-materials.js`

## Acceptance Criteria

- [x] A transparent WebGL canvas sits above the 2D scene, below DOM UI, and never intercepts navigation input.
- [x] Browser-native modules load statically with no bundler, framework, or runtime dependency.
- [x] One unit-sphere mesh and one Saturn-ring mesh are allocated once and reused.
- [x] `main.js` supplies immutable visible-body views; the renderer duplicates no camera, focus, AU, or body state.
- [x] Backing resolution follows the viewport with device-pixel ratio capped at `1.5`.
- [x] WebGL appears only after a successful frame; setup/frame/context failures and failed restoration keep 2D planets active.
- [x] Every fallback leaves wheel, mouse, touch, ruler, cards, and reverse travel usable without uncaught errors.
- [x] Changed-file syntax checks and `git diff --check` pass.

## Implementation Plan

- [x] Add and stack the transparent canvas.
- [x] Define renderer creation, resize, frame, availability, and disposal APIs.
- [x] Build shared geometry and embedded minimal shader programs.
- [x] Produce frame views in `main.js` and gate WebGL visibility on successful drawing.
- [x] Handle setup errors, frame errors, context loss, restoration, and 2D fallback.
- [x] Verify static loading and failures at desktop and mobile sizes.

## Drift Notes

`rendering/planet-renderer.js` and `rendering/planet-materials.js` are new files. Both are pre-planned in `E02-Detail.md`'s "Components and files" table, so this is not an unplanned deviation. Per that same table and T003's Implementation Plan ("Update architecture/context..."), reconciling `.savepoint/Design.md`'s codebase map with these modules is explicitly T003's job, not done here.

## Context Log

**Files read:** `.savepoint/releases/v1/epics/E02-lightweight-3d-planets/E02-Detail.md`, `.savepoint/Design.md`, `.savepoint/Guardrails.md`, `.savepoint/Health-Check.md`, `index.html`, `style.css`, `main.js`, T002/T003 task files (to confirm the T001/T002 scope split before choosing minimal-vs-procedural materials).

**Files edited:** `index.html` (added `#planets-gl` canvas, `main.js` script tag switched to `type="module"`), `style.css` (`#planets-gl` layer rule + `.gl-active` opacity toggle), `main.js` (renderer wiring: `glRenderer`/`glActive` state, `buildVisibleBodyViews`, `updateRotation` extracted from `drawPlanet`, `drawPlanet` gated on `glDrewThisFrame`), `rendering/planet-renderer.js` (new), `rendering/planet-materials.js` (new — flat per-body base colors only; T002 owns the full procedural recipes).

Health Check: Quick
- Guardrails rule IDs: ARCH-01 (no bundler/server added), ARCH-02 (2D fallback fully functional), ARCH-03 (main.js remains sole camera/focus/AU/body source), DEP-01 (zero new runtime dependencies — hand-rolled mat4/mat3 helpers, no library), PERF-01 (off-screen bodies rejected in `buildVisibleBodyViews` before `frame()`), PERF-03 (verified: forced WebGL failure and context loss both leave the page navigable), TEST-02, TEST-03, STYLE-01..05 (advisory, followed).
- Acceptance evidence: see checked boxes above; each verified live in a real WebGL context (Chromium + SwiftShader), not just read-through.
- File reality evidence: all edited files match this task's Context Files list; no untracked reads.
- Tests/commands: `node --check main.js` → pass. `node --check` (module syntax) on both `rendering/*.js` → pass. `git diff --check` → pass, no whitespace errors.
- Browser scenario(s) (Playwright + Chromium headless, `--use-gl=swiftshader`)
- Desktop 1440×900: Jupiter/Saturn render through WebGL with shading and ring occlusion, and `#planets-gl.gl-active` stays set.
- WebGL-unavailable and restore boundary: a forced `getContext(null)` keeps the 2D fallback active, and `WEBGL_lose_context`/restore returns WebGL only after a successful frame.
- Mobile 360×800: page loads and WebGL activates cleanly.
- Known debt: sphere/ring materials are flat single-color placeholders; reduced-motion is not yet wired to WebGL spin.
- Waivers: none.
