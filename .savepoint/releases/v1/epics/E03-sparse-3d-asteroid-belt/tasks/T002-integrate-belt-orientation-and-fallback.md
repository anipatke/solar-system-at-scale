---
id: E03-sparse-3d-asteroid-belt/T002-integrate-belt-orientation-and-fallback
status: done
objective: Add restrained orientation, preserve a sparse 2D fallback, and validate the integrated belt passage.
depends_on:
    - E03-sparse-3d-asteroid-belt/T001-render-sparse-instanced-belt
complexity_tier: medium
complexity_reason: Coordinates labels, fallback, journey behavior, performance evidence, and documentation across modules.
---

# T002: Integrate Belt Orientation and Fallback

## Problem

The 3D belt needs minimal orientation and a fallback that preserves its sparse character without adding a focus mode.

## Context Files

- `.savepoint/releases/v1/epics/E03-sparse-3d-asteroid-belt/E03-Detail.md`
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

- [x] Ceres is the only new named belt marker and has no focus snap, card, or navigation mode.
- [x] The 2D fallback uses deterministic sparse objects without restoring haze or a dense wall.
- [x] Both paths enter near `2.2 AU`, exit near `3.2 AU`, and leave planet/focus positions unchanged.
- [x] Wheel, mouse, and touch cross the belt and continue to Pluto in both paths.
- [x] Desktop and `360×800` checks show gaps, restrained parallax, orientation, and no persistent UI obstruction.
- [x] Combined rendering stays within E02's DPR/frame envelope with no renderer task over 50 ms.
- [x] Design/context documents describe the belt budgets, marker, and fallback accurately.
- [x] All changed-file syntax checks and `git diff --check` pass.

## Implementation Plan

- [x] Add a non-focusable Ceres marker through existing data/label ownership.
- [x] Replace the old fallback with deterministic sparse 2D objects.
- [x] Verify boundaries, focus invariance, input journeys, viewports, and failure behavior.
- [x] Measure integrated performance and update current-state documentation.
- [x] Record the E03 Full health check.

## Context Log

**Ceres marker (AC1):** added a standalone `CERES` data object (`main.js`, next to `ASTEROID_BELT`) holding only `id`/`name`/`distanceAU` (2.77 AU — real Ceres semi-major axis, inside `2.2–3.2 AU`). It is deliberately never added to `PLANETS`, `PROBES`, or the `[...PLANETS, ASTEROID_BELT]` arrays that drive `snapToNearestPlanet`, `checkInfoPanel`, and `buildRulerNotches` — so it structurally cannot gain a focus snap, info card, or ruler notch/navigation affordance. `drawCeresLabel()` renders only a small tick + `Press Start 2P` text at its true screen position (via the existing `planetScreenX()` helper), called once per frame from `loop()` right after the belt draw block, independent of `glActive`/fallback state, so it appears identically in both rendering paths.

**2D fallback replacement (AC2, AC3):** removed the old `buildBelt()`/`beltParticles` particle system (900 `Math.random()`-seeded dots plus a linear-gradient haze band) entirely. The 2D fallback `drawBelt()` now iterates the same deterministic `asteroidCatalog` prefix the WebGL layer uses (`asteroidCatalog.slice(0, getBeltInstanceBudget())`) and draws each as a flat circle at the same AU position, vertical spread, depth-based scale, and depth-based alpha as its WebGL instance — no haze fill, no per-instance glow, so both rendering paths draw the exact same sparse set of objects at the exact same positions, differing only in mesh vs. flat-circle rendering. Extracted the previously-duplicated AU/depth-scale math into `beltInstanceAU()` and `beltInstanceDepthScale()`, and the previously-duplicated mobile/desktop budget ternary into `getBeltInstanceBudget()`, so `computeBeltGlInstances()` (WebGL path, called from `resize()`) and `drawBelt()` (fallback path) share one source of truth for placement and budget (STYLE-03) — this is also what keeps AC3's "leave planet/focus positions unchanged" true structurally: neither change touches `PIXELS_PER_AU`, `cameraX`, or any planet/focus code.

### Browser scenario(s) (Playwright via `playwright-core`, headless Chromium, served via `python3 -m http.server`)

- Desktop 1440×900: the belt stays sparse, Ceres is labeled but not focusable, and the belt card still appears.
- Mobile 360×800 and WebGL-unavailable: the smaller budget and the fallback both keep the sparse composition and avoid haze.
- Input boundary: wheel reaches Pluto, and a real touch swipe crosses the belt using the same journey code.
- Performance sweep: the belt-centered run stayed within the renderer budget without long tasks.

### Health Check: Quick
- Guardrails rule IDs: SCALE-01, ARCH-02, ARCH-03, PERF-01, PERF-02, PERF-03, UX-01, UX-02, TEST-01, TEST-02, TEST-03, TEST-04, STYLE-03, STYLE-05, CONTENT-01
- Acceptance evidence: see per-AC notes and browser scenarios above
- File reality evidence: edited `main.js`, `.savepoint/Design.md`, `context.md`, matching this task's `## Context Files`; `rendering/planet-renderer.js` and `rendering/planet-materials.js` were read for context only, not edited (no orientation/fallback logic lives there)
- Tests/commands: `node --check main.js`, `git diff --check` — both pass
- Browser scenario(s): see above (desktop composition, mobile/fallback, input boundary, perf sweep)
- Known debt: touch was exercised as a real swipe across the belt rather than an exact Pluto snap.
- Waivers: none

## Drift Notes

None beyond T001's carried-forward item, now closed: `rendering/asteroid-belt-renderer.js` and the belt-specific rendering-layer row are now reflected in `.savepoint/Design.md`'s codebase map and rendering-layers table, and `context.md`'s "Current rendering" belt bullet now describes the sparse WebGL field, its deterministic 2D fallback, and the Ceres label as implemented.
