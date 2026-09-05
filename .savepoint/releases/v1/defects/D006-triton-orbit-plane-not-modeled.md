---
id: v1/D006-triton-orbit-plane-not-modeled
release: v1
status: in_progress
stage: build
severity: low
title: "Triton's orbit renders in Neptune's equatorial plane instead of its real, steeply inclined retrograde plane"
reference: E04-interface-motion-audio-cleanup/T003-calm-moon-and-interface-motion
---

# D006: Triton's Orbital Plane Is Not Modeled

## Symptom

Triton correctly orbits backward (`retrograde: true`) relative to Neptune's
other moons, but it does so in the same orbital plane every other Neptune
moon uses — Neptune's own equatorial plane, derived from `tiltDeg: 28`. In
reality, Triton's orbit is inclined roughly 157° to Neptune's equator, which
is *why* it's retrograde in the first place: it isn't a same-plane moon that
happens to spin backward, it is fundamentally tilted over relative to every
regular moon (strong evidence it's a captured Kuiper Belt object, not one
that formed with Neptune).

## Expected Behavior

Triton's rendered orbit plane should visually communicate that it is
dramatically different from Neptune's other (regular, equatorial) moons —
not just reversed in direction within the same plane.

## Reproduction

`drawMoons()` (`main.js`) computes one `orbitTilt`/`yComp` pair per **planet**
(from `parent.tiltDeg`, fixed by `D002`) and applies it to every moon of that
planet identically, including direction-reversed ones. Triton's `retrograde:
true` flips its angular direction (`dir = moon.retrograde ? -1 : 1`) but does
not change `orbitTilt`/`yComp`, so it still renders in Neptune's ~28°
equatorial plane alongside Proteus and Nereid.

Data values themselves were checked against NASA/JPL and are correct:
`orbitalKm: 354,800` (real ~354,759 km), `orbitalPeriodDays: 5.876994` (real
~5.877 days), `diameterKm: 2,706` (real ~2,706.8 km), `retrograde: true`
(correct). This defect is about the rendered orbital *plane*, not the
distance/period/size data.

Related note (not a separate defect — a byproduct of the existing, shared,
already-disclosed log-compression every moon uses): the same
`getMoonOverlayOrbitRadius()` formula that places every moon compresses real
orbital-radius ratios logarithmically (`Math.log2(orbitMultiple)`). For
Neptune's three modeled moons this gives roughly Proteus ≈2.26 log-steps,
Triton ≈3.85, Nereid ≈7.81 — even though Triton (~14.4 Neptune radii) is
really only ~3x farther out than Proteus (~4.8 Neptune radii) while Nereid
(~223.7 Neptune radii) is really ~15.6x farther out than Triton. This is why
Triton can visually read as closer-in than expected; it is the same
compression already accepted for every other moon system (`SCALE-02`), not
something specific to Triton, so it isn't part of this defect's fix scope.

## Impact

Low severity: doesn't break navigation or the overlay's general legibility,
and the single most citable Triton fact (retrograde motion) is already
correct. But it understates Triton's real distinctiveness — the one thing
that makes it scientifically interesting is currently rendered as "a regular
moon that spins the wrong way," not "a captured object in a wildly different
plane."

## Fix Plan

- Give moons an optional per-moon orbital-plane override (e.g. an
  `orbitInclinationDeg` or similar field) distinct from the parent's
  `tiltDeg`, defaulting to the parent's plane for regular/equatorial moons
  so no other moon's rendering changes.
- Set Triton's override so its rendered plane visibly reads as steeply
  different from Proteus's, consistent with its real ~157° inclination to
  Neptune's equator (exact on-screen angle is an implementer/visual-identity
  call, not a literal 1:1 inclination mapping, same as the rest of this
  overlay).
- Keep the fix scoped to data + the existing shared `orbitTilt`/`yComp`
  calculation; do not introduce a second, moon-specific rendering path
  (`STYLE-03`).

## Acceptance Criteria

- [x] Triton's rendered orbital plane is visibly distinct from Proteus's and
      Nereid's (not just reversed direction in the same plane).
- [x] No other moon's rendered orbit plane changes.
- [x] The retrograde direction fix and distance/period/size data (already
      correct) are unchanged.
- [x] Syntax and hygiene gates pass.

## Resolution Notes

Added an optional per-moon `orbitTiltDeg` field to `MOONS` (`main.js`),
defaulting to the parent's `tiltDeg` when absent so every existing moon's
rendering is byte-for-byte unaffected. Set `orbitTiltDeg: 157` on Triton only
— NASA/JPL's cited inclination of Triton's orbit to Neptune's equator
(source: NASA Planetary Satellite Mean Orbital Parameters,
https://ssd.jpl.nasa.gov/sats/elem/) — rather than an arbitrary
"looks different enough" value, so the number is both citable (`SCALE-03`)
and happens to already satisfy "visibly distinct" on its own.

`drawMoons()` now computes `const tiltDeg = moon.orbitTiltDeg ?? parent.tiltDeg`
before deriving `orbitTilt`/`yComp`, so the one shared calculation (`STYLE-03`)
still serves every moon — Triton just resolves to a different input. Verified
by direct computation: Proteus/Nereid (both defaulting to Neptune's 28°) keep
`yComp = 0.469`, `cos(roll) = 0.883`; Triton (157°) becomes `yComp = 0.391`,
`cos(roll) = -0.921` — the roll term's sign flip (≈129° of rotation
difference) makes Triton's orbit plane orientation clearly distinct from its
two Neptune siblings on screen, while direction (`retrograde: true`, already
correct) and the already-verified distance/period/size data are untouched by
this change. Confirmed by `grep` that no other moon in `MOONS` received an
`orbitTiltDeg`, so every other planet's moon system renders identically to
before.

`node --check main.js` and `git diff --check` both pass. No headless browser
is available in this sandbox (consistent with every other E04/defect task in
this project); recommend a quick visual pass on Neptune's three moons before
flipping this defect to `resolved`.
