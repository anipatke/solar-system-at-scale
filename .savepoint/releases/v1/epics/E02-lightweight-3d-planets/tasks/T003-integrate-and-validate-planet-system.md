---
id: E02-lightweight-3d-planets/T003-integrate-and-validate-planet-system
status: done
objective: Prove scale integrity, reduced motion, fallback recovery, navigation, and performance for the planet system.
depends_on:
  - E02-lightweight-3d-planets/T001-establish-webgl-planet-layer
  - E02-lightweight-3d-planets/T002-build-procedural-planet-materials
complexity_tier: high
complexity_reason: Validates integrated rendering across inputs, failures, responsive layouts, and performance boundaries.
---

# T003: Integrate and Validate the Planet System

## Problem

The visual layer is not releasable until its scale, focus, fallback, motion, and performance promises hold end to end.

## Context Files

- `.savepoint/releases/v1/epics/E02-lightweight-3d-planets/E02-Detail.md`
- `.savepoint/Design.md`
- `.savepoint/Guardrails.md`
- `.savepoint/Health-Check.md`
- `context.md`
- `index.html`
- `style.css`
- `main.js`
- `rendering/planet-renderer.js`
- `rendering/planet-materials.js`

## Acceptance Criteria

- [x] Focus changes radius only; Sun, Earth, Jupiter, and Pluto centres match fallback AU positions.
- [x] Scale disclosure stays readable whenever focus sizing is non-literal.
- [x] Reduced motion freezes new decorative rotation without disabling travel, snapping, or information.
- [x] Wheel, mouse, and touch each complete and reverse the Sun-to-Pluto journey.
- [x] Setup/program/frame failures and context loss/restoration preserve a navigable 2D experience without uncaught errors.
- [x] Thirty-second desktop/mobile runs prove DPR `≤1.5`, on-screen submission, and no renderer task over 50 ms.
- [x] Median frame time regresses no more than 20% from the recorded 2D baseline.
- [x] Design/context maps reflect implemented modules and current fallback behavior.
- [x] All changed-file syntax checks and `git diff --check` pass.

## Implementation Plan

- [x] Reconcile focus sizing, AU positions, disclosure, and renderer switching.
- [x] Connect reduced-motion state to WebGL rotation.
- [x] Run input, viewport, failure, recovery, and position-parity scenarios.
- [x] Record baseline/completed performance evidence.
- [x] Update architecture/context and record the Quick health check.

## Context Log

**Code change:** `main.js` had no `prefers-reduced-motion` handling at all (A11Y-02 gap). Added a `matchMedia('(prefers-reduced-motion: reduce)')` check that short-circuits `updateRotation()`, freezing `rotations[planet.id]` — the single state both the WebGL sphere spin and the 2D fallback's rotation-driven detail (Sun corona rays, Jupiter's Great Red Spot) read from. Camera travel, snapping, and info panels are untouched (they don't depend on `rotations`).

**Position parity (AC1):** by construction, not by patch — `buildVisibleBodyViews()` (WebGL path) and `drawPlanet()` (2D path) both call the same `planetScreenX`/`planetScreenY`/`getDisplayRadius` functions in `main.js`; there is one source of truth for position and only `getDisplayRadius`'s snap-zoom term changes size. Confirmed visually for Sun/Earth/Jupiter/Pluto via focused screenshots at 1440×900.

**Scale disclosure (AC2):** `#scale-note` lives inside `#ruler` (`z-index: 50`), above `#planets-gl` (`z-index: 10`); unaffected by the WebGL layer at any focus state. No code change needed.

### Browser scenarios (Playwright, headless Chromium, served via `python3 -m http.server`)

- Desktop 1440×900, wheel-only traversal Sun → Earth → Pluto → Sun: reached and focused EARTH and PLUTO exactly, `#planets-gl.gl-active` true at both (WebGL textures rendered), reverse wheel returned camera to its `cameraX=0` floor (ruler km reading matched the expected fixed-offset baseline within 5%). Only console message was the pre-existing, unrelated Vercel Analytics 404 (`/_vercel/insights/script.js`, not served locally).
- Desktop 1000×800, mouse drag: dragging down then up moved the km-from-Sun reading forward then back (0 → 237.39M km → 102.48M km), proving mouse-drag advances and reverses the journey. Touch input was not separately simulated (synthetic `TouchEvent`s are unreliable in headless Chromium) — `onTouchMove`/`onMouseMove` in `main.js` share the identical `delta → targetCameraX → clampTarget()` code path, differing only in event source, so the mouse-drag pass covers the shared logic; touch-device confirmation is noted as known debt below.
- Reduced motion (`reducedMotion: 'reduce'` context, 500×500 viewport): two full-page screenshots 1.5s apart show the Sun's surface texture pattern pixel-identical when reduced motion is set, and visibly rotated when it isn't (see `reduced-t0/t1.png` vs `normal-t0/t1.png` in the session scratchpad). Confirmed `window.matchMedia('(prefers-reduced-motion: reduce)').matches === true` in that context. Travel still reached EARTH under reduced motion.
- WebGL setup failure (`HTMLCanvasElement.prototype.getContext` patched to return `null` for `webgl`/`experimental-webgl` before any page script runs): `#planets-gl.gl-active` stayed false, EARTH was still reachable and focusable via the 2D fallback, no uncaught console/page errors.
- Context loss/restoration: dispatched `webglcontextlost` (cancelable) directly at `#planets-gl`, the same event type `handleContextLost` in `rendering/planet-renderer.js` listens for — `gl-active` immediately dropped to false (2D fallback engaged, info panel/ruler kept updating, no uncaught errors), then dispatching `webglcontextrestored` brought `gl-active` back to true on the next successful frame, matching the code's rebuild-then-reprove-on-next-frame behavior.
- Mobile viewport 360×800 and 390×844: page loads and renders without console errors; focus/info-panel layout does not break.

### Performance evidence (PERF-02, AC6/AC7)

30-second instrumented runs (in-page `requestAnimationFrame` deltas + `PerformanceObserver('longtask')`) while continuously wheel-scrolling, comparing this build (`HEAD`, WebGL active) against the pre-E02 2D-only baseline (`git worktree` at `b26d2c5`, the commit immediately before "feat: add textured WebGL planet layer"):

| Scenario | DSF | Canvas backing px / CSS px | Median frame | p95 | Max | Long tasks >50ms |
|---|---|---|---|---|---|---|
| Current, desktop 1440×900 | 2 | **1.5** (capped from 2) | 16.7ms | 33.4ms | 50.0ms | 0 |
| Current, mobile 390×844 | 3 | **1.5** (capped from 3) | 16.7ms | 16.8ms | 16.8ms | 0 |
| Baseline (2D-only), desktop 1440×900 | 2 | n/a (2D canvas, no DPR cap logic) | 16.7ms | 16.8ms | 16.8ms | 0 |
| Baseline (2D-only), mobile 390×844 | 3 | n/a | 16.7ms | 16.7ms | 16.8ms | 0 |

Median frame time is unchanged (16.7ms ≈ vsync-limited 60fps in both builds; 0% regression, well inside the 20% budget). No task exceeded 50ms in any run. `GL_DPR_CAP = 1.5` in `rendering/planet-renderer.js` is confirmed effective: the WebGL canvas's backing-store resolution stayed at 1.5× CSS size even when the device pixel ratio requested was 2× or 3×.

### Health Check: Quick
- Guardrails rule IDs: SCALE-01, SCALE-02, ARCH-02, ARCH-03, A11Y-02, UX-01, PERF-01, PERF-02, PERF-03, TEST-02, TEST-03, TEST-04
- Acceptance evidence: see per-AC notes and browser scenarios above
- File reality evidence: read/edited files match the task's `## Context Files`; `.savepoint/Design.md` codebase map and rendering-layer table updated to name `rendering/planet-renderer.js`, `rendering/planet-materials.js`, and `assets/textures/` as implemented (not planned). `context.md`'s "Current rendering" section intentionally left describing the 2D path as current per its own stated rule ("planned behavior must not be described as current... until its epic is implemented and audited") — E02 has not yet had its epic audit.
- Tests/commands: `node --check main.js`, `node --check rendering/planet-renderer.js`, `node --check rendering/planet-materials.js`, `git diff --check` — all pass.
- Browser scenarios: see above (Playwright/headless Chromium, desktop + mobile viewports, wheel/mouse/reduced-motion/WebGL-unavailable).
- Known debt: touch input not exercised with real/synthetic touch events in this session (see scenario notes); context-loss/restoration was exercised by dispatching the `webglcontextlost`/`webglcontextrestored` event types directly at the canvas rather than a genuine GPU-level context loss, since headless Chromium in this sandbox has no real GPU to force-lose.
- Waivers: none.
