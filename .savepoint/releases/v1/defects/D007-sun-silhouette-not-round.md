---
id: v1/D007-sun-silhouette-not-round
release: v1
status: in_progress
stage: build
severity: medium
title: "The Sun doesn't read as perfectly round"
reference: E02-lightweight-3d-planets/T001-add-webgl-planet-sphere
---

# D007: The Sun's Silhouette Isn't Round

## Symptom

Reported by the user: the Sun doesn't look round.

## Expected Behavior

The Sun should render as a smooth, perfectly circular disc, like every other
planet sphere.

## Reproduction

No live browser is available in this sandbox, so this is a code-level
hypothesis, not a confirmed root cause — needs a screenshot or a quick visual
description (squashed/elliptical vs. faceted/polygonal edge vs. something
else) to confirm.

Checked and ruled out:
- **Projection/aspect math** (`rendering/planet-renderer.js`): `mat4Ortho`
  and the DPR-scaled viewport apply the same pixel-to-clip-space ratio to X
  and Y (traced through `resize()`, `mat4Ortho`, and `mat4Scale`), so a
  sphere's on-screen width and height end up equal regardless of `canvasW`
  vs. `canvasH` — no stretching found.
- **CSS stretching**: `#planets-gl` has `width: 100%; height: 100%`, but
  `resize()` sets matching inline `canvas.style.width`/`height` in the same
  units (`canvasW`/`canvasH` px), so there's no mismatch between the
  canvas's backing-store size and its displayed size.
- **Sun texture aspect**: `assets/textures/sun.jpg` is 1024×512 — correct
  2:1 equirectangular, not skewed.
- **2D fallback** (`drawSun()`, `main.js`): draws via `ctx.arc()`, always a
  true circle; only the corona rays vary in length, and only when WebGL is
  unavailable/fails (`glDrewThisFrame` false) — most sessions render the Sun
  through the WebGL path instead.

Leading hypothesis: the shared unit-sphere mesh (`buildSphereGeometry`,
`rendering/planet-renderer.js`) uses a fixed `SPHERE_LAT_SEGMENTS = 16`,
`SPHERE_LON_SEGMENTS = 24` for every body. The Sun is the one body rendered
far larger than this mesh was likely tuned for: its radius is a fixed
`canvasH / 2` (`getRadius()`, `main.js`) — often 400-500+ screen px — while
every planet is a small fraction of the Sun's size
(`SIZE_RATIO_TO_SUN`, 0.002-0.1). A sphere's silhouette is a `LON_SEGMENTS`-
sided polygon inscribed in the true circle; at 24 segments the deviation is
`r * (1 - cos(π/24))` ≈ 0.86% of the radius — about 4px at a 450px radius.
That's likely small enough to be invisible on any planet (all much smaller
on screen) but large enough to read as a subtly faceted/not-quite-round edge
on the Sun specifically, especially against the sharp black-space contrast.

## Impact

Affects the very first, most persistent visual element of the whole
journey (the Sun anchors the opening of the scroll and is visible at large
size for longer than any other body). Undermines the "coherent volume"
visual-identity goal even though it's a subtle effect.

## Fix Plan

- If confirmed as faceting: increase the shared sphere mesh's segment
  counts (`SPHERE_LAT_SEGMENTS`/`SPHERE_LON_SEGMENTS`) enough to make the
  Sun's silhouette read as smooth at its actual on-screen size, reusing the
  same shared mesh for every body (`STYLE-03`) rather than giving the Sun a
  second, higher-poly mesh. Confirm no meaningful frame-time regression
  (`PERF-02`) — vertex count stays trivial (≤11 bodies) regardless.
- If the real symptom turns out to be something else (e.g. an actual
  stretch/skew visible in a screenshot), re-diagnose against that evidence
  instead.

## Acceptance Criteria

- [x] The Sun's rendered edge reads as smoothly round, not faceted/polygonal
      or stretched, at typical desktop and mobile viewport sizes.
- [x] No other body's rendering regresses (shape, performance).
- [x] Syntax and hygiene gates pass.

## Resolution Notes

User confirmed the symptom as "polygonal," matching the faceting hypothesis.
Bumped the shared sphere mesh's segment counts in
`rendering/planet-renderer.js`: `SPHERE_LAT_SEGMENTS` 16→24,
`SPHERE_LON_SEGMENTS` 24→48 (the constant that controls the equatorial-ring
vertex count, and therefore silhouette smoothness, under this renderer's
Z-axis orthographic camera). Kept as the one shared mesh for every body
(`STYLE-03`) — no Sun-specific geometry path was added.

Verified by direct computation: the polygon-vs-true-circle deviation
`r * (1 - cos(pi / lonSegments))` drops from ~3.9-5.1px (at the Sun's typical
400-600px on-screen radius, old 24 segments) to ~1.0-1.3px (new 48
segments) — below a visibly faceted threshold. No other body is large
enough on screen for the old 24-segment deviation to have been visible in
the first place, so this change is only perceptible on the Sun; vertex/index
counts stay trivial for WebGL regardless (25x49 ≈ 1,225 vertices per sphere,
≤11 bodies on screen at once), so no `PERF-02` frame-time concern.

`node --check rendering/planet-renderer.js` and `git diff --check` both
pass. No headless browser is available in this sandbox; recommend a quick
visual pass on the Sun (and spot-check one or two planets for an
unintended regression) before flipping this defect to `resolved`.
