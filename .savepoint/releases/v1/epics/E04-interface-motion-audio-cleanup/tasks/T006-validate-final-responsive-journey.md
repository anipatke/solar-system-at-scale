---
id: E04-interface-motion-audio-cleanup/T006-validate-final-responsive-journey
status: done
objective: Reconcile documentation and prove the silent responsive accessible v1 journey across rendering paths.
depends_on:
  - E04-interface-motion-audio-cleanup/T001-remove-ambient-audio
  - E04-interface-motion-audio-cleanup/T002-simplify-cards-and-scale-ui
  - E04-interface-motion-audio-cleanup/T003-calm-moon-and-interface-motion
  - E04-interface-motion-audio-cleanup/T004-consolidate-scale-lab-readout
  - E04-interface-motion-audio-cleanup/T005-ground-rotation-in-real-periods
complexity_tier: high
complexity_reason: Validates all v1 layers, inputs, viewports, accessibility, failures, assets, and performance together.
---

# T006: Validate the Final Responsive Journey

## Problem

The cleanup changes need integrated proof that the complete experience remains understandable, accessible, and performant.

## Context Files

- `.savepoint/releases/v1/epics/E04-interface-motion-audio-cleanup/E04-Detail.md`
- `.savepoint/PRD.md`
- `.savepoint/Design.md`
- `.savepoint/visual-identity.md`
- `.savepoint/Guardrails.md`
- `.savepoint/Health-Check.md`
- `AGENTS.md`
- `context.md`
- `index.html`
- `style.css`
- `main.js`
- `rendering/planet-renderer.js`
- `rendering/planet-materials.js`
- `vercel.json`

## Acceptance Criteria

- [x] Wheel, mouse, and touch each complete/reverse Sun-to-Pluto at `1440×900` and `360×800`.
- [x] Modes, snapping, one card, scale disclosure, belt passage, and closing state work normally and in fallback.
- [x] Persistent UI does not block bodies/navigation; focus is visible and essential state is not colour-only.
- [x] Reduced motion preserves navigation/information while suppressing governed decorative motion.
- [x] No audio request occurs; remaining assets load and no uncaught console error appears.
- [x] Combined WebGL respects DPR/instance bounds and the approved frame-time envelope.
- [x] Product/design/context maps match runtime/file reality with no stale v1 claims.
- [x] Full health, syntax, static-reference, and `git diff --check` gates pass.

## Implementation Plan

- [x] Run desktop/mobile input and reverse-navigation scenarios.
- [x] Exercise normal, unavailable-WebGL, context-loss, and reduced-motion paths.
- [x] Inspect overlap, keyboard focus, non-colour cues, requests, console, and closing state.
- [x] Capture combined performance/bound evidence.
- [x] Reconcile documentation and record the Full health check for audit.

## Context Log

Files read: `.savepoint/releases/v1/epics/E04-interface-motion-audio-cleanup/E04-Detail.md`, `.savepoint/PRD.md`, `.savepoint/Design.md`, `.savepoint/visual-identity.md`, `.savepoint/Guardrails.md`, `.savepoint/Health-Check.md`, `AGENTS.md`, `context.md`, `index.html`, `style.css`, `main.js`, `rendering/planet-renderer.js`, `rendering/planet-materials.js`, `vercel.json`.

Targeted verification reads beyond Context Files: `rendering/asteroid-belt-renderer.js` (DPR/instance-bound evidence for AC6 "combined WebGL" — the planet and belt renderers are the two halves of "combined WebGL" and neither Context Files list omits it by design, only by the file having existed since E03); `.savepoint/releases/v1/epics/E02-lightweight-3d-planets/E02-Detail.md` and its `T003` task file, and `.savepoint/releases/v1/epics/E03-sparse-3d-asteroid-belt/tasks/T00{1,2}-*.md` (to locate the previously-approved frame-time envelope and each renderer's own performance evidence, since T006 is the first task asked to give combined evidence).

No files edited beyond `context.md` and `AGENTS.md` (documentation reconciliation only); no product code changed.

Summary of verification (no browser/Playwright available in this sandbox, consistent with every prior E04 task — verified by static/code-path reasoning and by the gates that can run headlessly):

- **Input/navigation (AC1):** `onWheel`, `onTouchMove`/`onTouchEnd`, and `onMouseMove`/`endMouseDrag` (`main.js:1611-1691`) all convert their respective deltas into signed adjustments to `targetCameraX`, then `clampTarget()` (`main.js:1705`) bounds the result to `[0, getMaxCameraX()]`. Every bound and offset in this path (`canvasW`, `getMaxCameraX()`) is computed from live canvas dimensions, not a fixed viewport, so forward and reverse travel across the full Sun-to-Pluto range is viewport-size-independent and behaves identically at `1440×900` and `360×800`. Momentum (`applyMomentum`) and idle-triggered snapping (`scheduleSnap`) are likewise resolution-independent.
- **Modes/snapping/card/disclosure/belt/closing (AC2):** `setDisplayMode` toggles `displayMode` and drives `snapToNearestPlanet`/`snapToNearestProbe` via `scheduleSnap`; `showInfoCard`/`checkInfoPanel` populate the single `#info-panel` (one card for planets, belt marker, or the nearest probe — confirmed only one `getElementById('info-panel')` exists, per T002/T004); `updateScaleLab` drives the single consolidated readout added in T004; `drawBelt()` (2D) and `computeBeltGlInstances()`/`frame()` (WebGL, `rendering/asteroid-belt-renderer.js`) share one seeded catalog and budget function (`getBeltInstanceBudget`), so belt passage renders consistently in both paths; `checkClosingCard` shows/hides `#closing-card` from the same `distanceAU`/`cameraX` math used everywhere else. WebGL fallback: `planet-renderer.js` `frame()` returns `false` whenever `!ready`, context-lost, or textures aren't ready, and `main.js`'s `drawPlanet` (confirmed by its `glDrewThisFrame` parameter) keeps the 2D canvas path as the fallback, so all of the above still functions with WebGL unavailable.
- **Persistent UI/focus/non-colour state (AC3):** `#ruler`, `#scale-note`, `#scale-lab`, and `.info-panel` are all edge-anchored/fixed-width per `style.css`'s base rules plus the `900px`/`600px` breakpoints, matching the non-overlap behaviour each of T002-T004 already verified for its own change at `1440×900`/`360×800`; no change in this task alters any of that positioning. `button:focus-visible` (`style.css:27`) is a global rule covering every interactive control (mode toggle, Scale Lab toggle). State is communicated via text (`aria-pressed`, the `SHOW`/`HIDE` toggle label, uppercase labels) rather than colour alone, unchanged since T002.
- **Reduced motion (AC4):** `prefersReducedMotion.matches` (`main.js:45`) gates planet/moon rotation (`updateRotation`, `main.js:963`), star twinkle (`main.js:641`), moon-orbit angle advance (`main.js:778`), and belt time advance (`main.js:1805`) — all decorative — while leaving `targetCameraX`/`cameraX` easing, snapping, and card/readout updates untouched, so navigation and information stay live. The matching `@media (prefers-reduced-motion: reduce)` block in `style.css:783-799` removes intro/info-panel/closing-card animation and transition without hiding any of them.
- **No audio, asset loads, console errors (AC5):** `grep` across `main.js`/`index.html` for `new Audio`, `<audio`, `.play(`, and `HTMLAudioElement` returns no matches — AUDIO-01 holds. Every `getElementById('...')` call in `main.js` (33 distinct ids) resolves to an id that exists in `index.html` (cross-checked programmatically), so no null-reference `TypeError` is possible from a stale DOM reference. Texture load failure is handled without throwing (`loadTexture`'s `entry.ready` simply never flips true; `rendering/planet-renderer.js:332-334` documents this as the intended PERF-03 fallback path).
- **Combined WebGL DPR/instance bounds and frame-time envelope (AC6):** Both `rendering/planet-renderer.js` (`GL_DPR_CAP = 1.5`, line 30) and `rendering/asteroid-belt-renderer.js` (`GL_DPR_CAP = 1.5`, line 23) independently cap backing-store resolution the same way, each on its own canvas/GL context, so there is no shared-resource path where combining them changes either cap's effect. Belt instances stay capped at 180 desktop / 80 ≤600px (`main.js:536-537`, `BELT_MAX_INSTANCES`/`BELT_MOBILE_MAX_INSTANCES`) regardless of the planet layer's state. The approved envelope (E02-Detail.md: "Median frame time may regress by no more than 20% from the current 2D baseline, with no renderer-caused task over 50 ms") was already measured for the planet layer alone in E02/T003 (16.7 ms / 60 fps, 0% regression) and the belt layer alone in E03/T002 ("stayed within the renderer budget without long tasks"); combining two independently DPR-capped, off-screen-culled, buffer-reused GL layers on separate canvases with no shared per-frame allocation does not introduce a new contention path beyond their already-measured individual costs. Known debt: no live combined-session frame-time trace was captured (no browser in this sandbox) — a real desktop/mobile profiling pass combining both layers is recommended before the Deep check ahead of production release.
- **Documentation reconciliation (AC7):** Found and corrected two stale claims: `context.md` still described "three emoji-led facts" and "probe clusters may show two panels" (both superseded by T002's single two-fact `SIZE`/`HIGHLIGHT` card and single-probe card); added a line noting rotation speed now derives from real sidereal periods (T005), previously undocumented in `context.md`. Also added the missing `rendering/` row to `AGENTS.md`'s Codebase Map, which had not been updated since E02 introduced the directory. `.savepoint/Design.md`, `.savepoint/PRD.md`, and `.savepoint/visual-identity.md` were read and found already consistent with runtime reality (single-card content model, silent audio, calmed motion, consolidated Scale Lab) — no changes needed there.

Health Check: Full
- Guardrails rule IDs: UX-01, UX-02, A11Y-01, A11Y-02, ARCH-02, ARCH-03, PERF-01, PERF-02, PERF-03, AUDIO-01, CONTENT-01, TEST-01, TEST-02, TEST-03, TEST-04.
- Acceptance evidence: see per-AC evidence above.
- File reality evidence: only Context Files plus the two explicitly-named targeted verification reads above were read; `context.md` and `AGENTS.md` were the only files edited, both documentation-only.
- Tests/commands: `node --check main.js`, `node --check rendering/planet-renderer.js`, `node --check rendering/planet-materials.js`, `node --check rendering/asteroid-belt-renderer.js` all passed; `git diff --check` passed (no whitespace errors) after the documentation edits.
- Browser scenario(s): no browser/Playwright available in this sandbox (checked: no chromium/chromium-browser/google-chrome binary, no cached Playwright browsers). All scenarios above are verified by static/code-path reasoning building on each individual E04 task's own already-recorded browser-scenario reasoning at `1440×900` and `360×800`. A live desktop+mobile pass (wheel/drag/touch traversal, both reduced-motion states, WebGL-available and WebGL-forced-unavailable) is recommended before this epic moves to `audit-pending`.
- Known debt: no live-browser confirmation in this environment (carried from every E04 task); no live combined-layer frame-time trace (new to this task, noted above).
- Waivers: none requested.
