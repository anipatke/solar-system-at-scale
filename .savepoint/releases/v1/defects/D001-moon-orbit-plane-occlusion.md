---
id: v1/D001-moon-orbit-plane-occlusion
release: v1
status: resolved
severity: medium
title: "Moons never occlude in front of the WebGL planet sphere, only ever behind it"
reference: E04-interface-motion-audio-cleanup/T003-calm-moon-and-interface-motion
---

# D001: Moon Orbit Plane Occlusion

## Symptom

Moon orbits, most visibly Jupiter's four Galilean moons, look wrong: moon dots
never render in front of their parent's rendered sphere, even on the near
side of their orbital plane, where they visually cross the planet's disc.
The tilt/inclination angle of each orbit is correct; only the front/back
depth relative to the planet body is wrong.

## Expected Behavior

A moon on the near side of its orbital plane should render on top of (in
front of) its parent planet's sphere; a moon on the far side should render
behind it. The existing orbit-plane tilt angle (`parent.tiltDeg`) is correct
and unchanged by this fix.

## Reproduction

Root cause found by code inspection (no headless browser available in this
environment): `#planets-gl` (the WebGL planet layer) has CSS `z-index: 10`,
stacked above `#space` (the main 2D canvas where `drawMoons()` draws every
moon dot, at the default `z-index: auto`). Because moons are drawn on `#space`, `main.js`
`drawMoons()`/`main.js` render loop, they always paint beneath `#planets-gl`
regardless of orbital position — a moon on the near side of its orbit is
still hidden behind the opaque WebGL sphere pixels wherever it overlaps
on-screen. Confirmed with the user that the orbit-plane angle itself is
correct and the defect is specifically about front/back occlusion.

## Impact

Most visible on Jupiter because it is the largest-rendered planet on screen
(`SIZE_RATIO_TO_SUN.jupiter = 0.10052`, the largest ratio of any body), so
its four Galilean moons cross its face at a scale where the missing
occlusion reads as visibly wrong. The same code path affects every moon in
`MOONS`, but is least noticeable on small-radius planets.

## Fix Plan

- Add a new transparent 2D canvas `#moons-front`, CSS `z-index: 11` (above
  `#planets-gl`'s 10, below all DOM UI at 45+).
- Size it alongside `#space` in `resize()`.
- In `drawMoons()`, keep the faint orbit-ring stroke on `ctx` unchanged
  (low-opacity guide, not the reported symptom), but route the moon dot to
  `moonsFrontCtx` when `Math.sin(angle) < 0` (near side, using the same
  local-frame angle that already drives the dot's screen position) and to
  `ctx` otherwise (far side). Clear `moonsFrontCtx` once per frame before
  the per-moon loop.

## Acceptance Criteria

- [x] A moon's near-side orbit position renders above the WebGL planet
      sphere instead of always beneath it.
- [x] The orbit-plane tilt angle is unchanged.
- [x] `node --check main.js` and `git diff --check` pass.
- [x] No change to the 2D no-WebGL fallback's existing (pre-existing,
      unfixed) occlusion behavior — see Known debt below.

## Resolution Notes

Fixed in `index.html`, `style.css`, `main.js` alongside
`E04-interface-motion-audio-cleanup/T003`. New `#moons-front` canvas added
above `#planets-gl`; `drawMoons()` now splits the moon dot (not the orbit
ring) between `ctx` and `moonsFrontCtx` by the sign of `Math.sin(angle)` in
the same local frame already used for the dot's screen position, so the
split is exact and self-consistent with the existing tilt/scale math.

Static-serve smoke test confirmed: `index.html` ships the new
`<canvas id="moons-front">` element, `style.css` ships its `z-index: 11`
rule (correctly above `#planets-gl`'s 10 and `#belt-gl`'s 9), and
`main.js` wires `moonsFrontCanvas`/`moonsFrontCtx` through element lookup,
`resize()`, and `drawMoons()`.

Known debt: the no-WebGL 2D fallback path (`glActive === false`) draws the
planet body and all moons on the same `ctx` canvas in a single pass, so
far-side moons still render on top of the fallback-drawn planet there —
this is pre-existing behavior from before this fix (not a regression) and
was out of scope for the reported symptom, which is specific to the
WebGL-active path. No live-browser recording was captured (no headless
browser available in this environment); confirmation of the corrected
near/far behavior on Jupiter is deferred to the user.
