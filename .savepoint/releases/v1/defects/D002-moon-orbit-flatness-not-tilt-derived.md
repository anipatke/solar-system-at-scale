---
id: v1/D002-moon-orbit-flatness-not-tilt-derived
release: v1
status: resolved
severity: low
title: "Moon orbit ellipse flatness was a fixed constant instead of following each planet's real axial tilt"
reference: E04-interface-motion-audio-cleanup/T003-calm-moon-and-interface-motion
---

# D002: Moon Orbit Flatness Not Tilt-Derived

## Symptom

Jupiter's moon orbits look misaligned with the planet itself: the WebGL
sphere shows Jupiter's real ~3° axial tilt, essentially upright with no
visible roll, but the moon orbit ellipse renders as a clearly tilted, fairly
open oval — the same shape used for every other planet.

## Expected Behavior

The moon orbit's roll angle already derives from the real per-planet
`tiltDeg` (NASA planetary fact-sheet obliquity values), applied identically
to the WebGL sphere (`mat4RotateZ(body.tiltRad)`) and the 2D orbit ellipse
(`ctx.rotate(orbitTilt)`) — that part was already correct and unchanged by
this fix. What was wrong: the ellipse's *flatness* (`yComp`) was a single
hardcoded `0.4` for every planet regardless of tilt. A planet with a small
real tilt (Jupiter ~3°, Venus's effective ~3° retrograde tilt, Mercury
~0.03°) should show its near-equatorial moon orbits almost edge-on from
within the solar system's plane; a planet tilted close to 90° (Uranus ~98°)
should show them close to face-on.

## Reproduction

Confirmed with the user: the tilt angle itself is correct; the reported
mismatch is that Jupiter's rendered rotation looks upright while its moon
orbits look noticeably oval. Root cause was the fixed `yComp = 0.4` constant
in `drawMoons()` (`main.js`), independent of `parent.tiltDeg`.

## Impact

Affects the moon-orbit rendering for every planet's moons, most noticeable
on low-tilt planets (Jupiter, Venus, Mercury has no moons) where the fixed
40% squash looked more dramatically tilted than the near-zero real
inclination would suggest.

## Fix Plan

Replace `const yComp = 0.4` with a per-moon value derived from the same
`orbitTilt` already computed from `parent.tiltDeg`:
`yComp = Math.abs(Math.sin(orbitTilt))`. At tilt ≈0°/180° this goes to ≈0
(edge-on); at tilt ≈90° it goes to 1 (face-on). No floor was added — the
user explicitly accepted near-edge-on orbits for low-tilt planets like
Jupiter.

## Acceptance Criteria

- [x] Orbit ellipse flatness (`yComp`) is derived from `parent.tiltDeg`
      instead of a fixed constant, computed once per moon alongside the
      existing `orbitTilt`.
- [x] The orbit-plane roll angle is unchanged (still `parent.tiltDeg`,
      still applied identically to the ring and the moon dot).
- [x] `node --check main.js` and `git diff --check` pass.

## Resolution Notes

Fixed in `main.js` (`drawMoons()`): removed the function-level
`const yComp = 0.4`, added `const yComp = Math.abs(Math.sin(orbitTilt))`
immediately after `orbitTilt` is computed per moon, so both the orbit-ring
stroke and the moon dot's position (which already both read from the same
`yComp` variable) pick up the new tilt-derived value automatically.

Verified numerically (not via live browser — none available in this
environment): Mercury 0.001, Jupiter 0.052, Venus 0.052, Earth 0.399,
Mars 0.423, Saturn 0.454, Neptune 0.469, Pluto 0.848, Uranus 0.990 —
a physically sensible spread from near-edge-on (Jupiter, Venus) to
near-face-on (Uranus), with Earth/Mars/Saturn/Neptune landing close to the
old fixed 0.4 by coincidence of their tilt values. `node --check main.js`
and `git diff --check` both pass. Live-browser confirmation is deferred to
the user.
