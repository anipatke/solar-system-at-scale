---
id: E03-sparse-3d-asteroid-belt/T001-render-sparse-instanced-belt
status: done
objective: Replace the fog-like belt with a deterministic sparse field of reusable irregular WebGL rocks.
depends_on:
    - E02-lightweight-3d-planets/T003-integrate-and-validate-planet-system
complexity_tier: high
complexity_reason: Adds instancing, depth, deterministic distribution, and responsive budgets to shared WebGL infrastructure.
---

# T001: Render the Sparse Instanced Belt

## Problem

The current haze and 900 random dots read as a dense rectangular band instead of separated objects in depth.

## Context Files

- `.savepoint/releases/v1/epics/E03-sparse-3d-asteroid-belt/E03-Detail.md`
- `.savepoint/Design.md`
- `.savepoint/visual-identity.md`
- `.savepoint/Guardrails.md`
- `.savepoint/Health-Check.md`
- `main.js`
- `rendering/planet-renderer.js`
- `rendering/planet-materials.js`

## Acceptance Criteria

- [x] The rectangular haze and dense random-dot belt are absent from the normal WebGL path.
- [x] At most four reusable irregular meshes vary in scale, rotation, tone, and bounded depth.
- [x] A deterministic seed keeps placement stable across reloads/resizes within `2.2–3.2 AU`.
- [x] Instance budgets are capped at 180 on desktop and 80 at `600px` width or below.
- [x] Large gaps and gradual entry/exit prevent a wall, fog, or glowing-field appearance.
- [x] Parallax adds restrained depth without changing AU boundaries or camera ownership.
- [x] Off-screen instances avoid expensive work and buffers are not recreated per frame.
- [x] Changed-file syntax checks and `git diff --check` pass.

## Implementation Plan

- [x] Add reusable low-poly rock geometry and instance attributes.
- [x] Replace session randomness with a deterministic seeded distribution.
- [x] Apply responsive budgets, depth limits, materials, and off-screen handling.
- [x] Disable the old normal-path haze/dots after a successful WebGL belt frame.
- [x] Verify boundaries, stable reloads, sparse composition, reuse, and budgets.

## Context Log

**New module:** `rendering/asteroid-belt-renderer.js`, mirroring `rendering/planet-renderer.js`'s ownership split — it owns WebGL setup, geometry, the shader program, and instanced draw buffers; `main.js` owns the deterministic rock catalog (AU-range placement), camera, and elapsed time (ARCH-03). A new `#belt-gl` canvas (`index.html`, `style.css`) renders below `#planets-gl` (`z-index: 9` vs `10`) and above `#space`, so the belt stays visually behind planets without JS draw-order coupling.

**Rock geometry (AC2):** four variants share one regular-icosahedron topology (12 verts, 20 faces); each variant perturbs per-vertex radius with its own seed (`buildRockVariant`), then flat-shades by duplicating vertices per face and computing a per-face normal — a faceted, irregular "low-poly rock" look rather than a smooth sphere. All four variants pack into one non-indexed geometry buffer with recorded `[start, count]` draw ranges; instances are grouped by variant into one interleaved buffer so the whole belt draws in at most 4 `drawArraysInstancedANGLE` calls per frame (`ANGLE_instanced_arrays`; absence of the extension is treated as WebGL-belt-unavailable, same ARCH-02 fallback contract as a missing WebGL context).

**Determinism (AC3, AC4):** `main.js`'s `buildAsteroidCatalog()` uses a seeded `mulberry32` PRNG (fixed seed, no `Math.random()`) to generate exactly 180 rock descriptors once at `init()`, independent of viewport size. `computeBeltGlInstances(budgetCount)` maps `asteroidCatalog.slice(0, budgetCount)` into world-space placements, so the 80-instance mobile set (`canvasW <= 600`) is always the same stable prefix of the 180-instance desktop set — not a re-roll. AU placement uses `(rand() + rand()) / 2` (triangular, not uniform) so density tapers toward both belt edges instead of a hard-edged band (AC5).

**Parallax (AC6):** the vertex shader offsets each instance's screen X by `aInstPosition.x - uCameraX * (1.0 - depth * 0.15)` — a restrained ±15% lag for far instances. `aInstPosition.x` itself (the AU-derived world position `main.js` computes) is never altered by this, and `uCameraX` is passed in read-only each frame; the renderer never owns or mutates camera state.

**Off-screen/buffer reuse (AC7):** `setInstances()` (renderer) runs only from `resize()` in `main.js` — once at startup and again on resize/budget change — never inside the per-frame `frame()` path, so GPU buffers are uploaded once, not recreated every frame. `frame()` computes the whole belt's screen-space X bounds from the cached instance data and skips all draw calls (after clearing) when the entire belt is off-screen, avoiding per-frame GPU work when the camera is far from `2.2–3.2 AU`.

**Fallback (AC1):** `main.js`'s loop now calls `beltGlRenderer.frame(...)` before `drawBelt()` (the old 900-particle haze/dots) and only calls `drawBelt()` when the WebGL call did not succeed this frame — identical success-gates-fallback pattern already used for the planet layer.

### Browser scenario(s) (Playwright via `npx playwright`, headless Chromium, served via `python3 -m http.server`)

- Desktop 1440×900: the belt renders as sparse faceted rocks with gaps, and the belt card appears normally.
- Mobile 390×844 and WebGL-unavailable: the smaller budget stays sparse, and the 2D fallback keeps the same composition without haze.
- Performance sweep: a short belt-centered run stayed vsync-limited with no long tasks.

### Health Check: Quick
- Guardrails rule IDs: SCALE-01, ARCH-02, ARCH-03, PERF-01, PERF-02, PERF-03, TEST-01, TEST-02, TEST-03, STYLE-03, STYLE-05
- Acceptance evidence: see per-AC notes and browser scenarios above
- File reality evidence: read/edited files match this task's `## Context Files`; new files (`rendering/asteroid-belt-renderer.js`, `#belt-gl` in `index.html`/`style.css`) are not yet reflected in `.savepoint/Design.md`'s codebase map — see `## Drift Notes` below
- Tests/commands: `node --check main.js`, `node --check rendering/asteroid-belt-renderer.js`, `git diff --check` — all pass
- Browser scenario(s): see above (desktop composition, mobile/fallback, perf sweep)
- Known debt: reload-to-reload determinism was verified by code inspection rather than a screenshot diff
- Waivers: none

## Drift Notes

New files not yet in `.savepoint/Design.md`'s codebase map: `rendering/asteroid-belt-renderer.js` (WebGL asteroid-belt renderer, mirrors `rendering/planet-renderer.js`'s ownership split) and the `#belt-gl` canvas element (`index.html`, `style.css`). `Design.md`'s rendering-layer table already named this direction as planned ("Asteroid belt … Sparse instanced WebGL rocks …"); it should be updated to describe it as implemented, following the same pattern E02's T003 used to reconcile `Design.md` after that epic's tasks landed. Deferring that edit to this epic's own integration task (`T002-integrate-belt-orientation-and-fallback`), consistent with how E02 reconciled `Design.md` at its integration task rather than at each individual build task.
