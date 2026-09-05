---
id: v1/D004-moon-orbit-distance-and-speed-accuracy
release: v1
status: in_progress
stage: build
severity: medium
title: "Moon orbit distances and speeds are still only approximate"
reference: E04-interface-motion-audio-cleanup/T003-calm-moon-and-interface-motion
---

# D004: Moon Orbit Distance and Speed Accuracy

## Symptom

The moon system is intentionally readable, but it still compresses real orbital
behavior. The orbit distances are rounded, the motion is driven by a single
shared visual-time rule, and the result is only an approximation of the real
relative orbital cadence for the major moons.

**Correction found during review (undocumented regression):** the roster
expansion that produced this defect also removed `MOON_MIN_VISUAL_ORBIT_SEC`
entirely (no floor, no ceiling) rather than tuning it. That directly
contradicts `T003`'s already-`done`/audited AC1 ("Every moon derives from one
shared time-scale calculation with a minimum 24-second visual orbit") and
`T005`/`T006`'s explicit statements that T003's floor/pacing was left
unchanged, and it undoes the epic's own approved `E04-Detail.md` planned-value
line ("a minimum visual orbit duration"). No `## Drift Notes` were added to
those task files when the floor was removed. Concretely, computing
`orbitalPeriodDays * 24` unbounded for the new roster gives Nereid ≈144
minutes, Himalia ≈100 minutes, and Iapetus ≈32 minutes per visual orbit —
all effectively frozen for any realistic viewing session, which reads as a
rendering bug rather than "less physically faithful."

## Expected Behavior

The project should keep the moons recognizable and readable, but the larger
planet systems should feel more faithful in their relative orbital spacing and
speed ordering. The inner moons should still move faster than the outer ones,
and the most recognizable moons should sit at roughly believable relative
distances from their parent planets.

## Reproduction

Inspect `main.js`:

- the moon list is a curated subset, not a complete satellite catalogue;
- `orbitalKm` values are rounded for display;
- `getMoonVisualPeriodSec()` uses one shared visual-speed conversion for every
  moon, so the cadence is readable but not physically accurate.

## Impact

This is visible every time the moon overlay is shown. It is not a navigation
bug, but it does make the gas-giant systems feel more stylized than intended
once more moons are added.

## Fix Plan

- Keep the curated moon roster, but tune the selected moons so each planet has
  a clearly recognizable set.
- Restore a bounded pacing model — a minimum **and** a maximum visual orbit
  duration — rather than an unbounded linear conversion, so no moon ever
  reads as frozen regardless of how slow its real orbit is.
- Preserve readability and keep the overlay non-cluttering.

## Acceptance Criteria

- [x] The moon roster stays small and recognizable, not a 1:1 satellite dump.
- [x] Inner moons still move faster than outer moons, but the relative cadence
      reads more like the real solar system.
- [x] The biggest planet systems feel more faithful without becoming visually
      noisy.
- [x] No moon's visual orbit period is long enough to read as static/frozen
      during a normal viewing session (new AC added during this repair, to
      close the gap the original three ACs didn't explicitly cover).

## Resolution Notes

Restored a bounded pacing model in `getMoonVisualPeriodSec()` (`main.js`):
`MOON_MIN_VISUAL_ORBIT_SEC = 24` (unchanged from T003's original floor) and a
new `MOON_MAX_VISUAL_ORBIT_SEC = 420`. 420s was chosen because it is the exact
ceiling that leaves every moon from T003's original 13-moon roster completely
unaffected (its slowest mover, Callisto, was already ~400.6s and nothing else
came close) while clamping only the four moons whose real periods make them
outliers under the new 25-moon roster: Earth's Moon (655.7s → 420s), Iapetus
(1903.9s → 420s), Himalia (5997.8s → 420s), and Nereid (8643.2s → 420s).
Ordering is preserved everywhere (clamping a monotonic function to `[min,
max]` stays non-decreasing), so "inner moons move faster than outer ones"
still holds. Verified by direct computation across all 25 moons (`node -e`
sweep), not a live browser — recommend a quick visual pass (watch Jupiter's
four Galilean moons and Saturn's Iapetus for a minute or two) before flipping
this defect to `resolved`. `node --check main.js` passes.

Also appended `## Drift Notes` to `T003`, `T005`, and `T006` (all `status:
done`) documenting that the floor-removal this defect describes happened
after they were marked done and audited, without a drift note at the time —
so their existing AC/evidence text describing the floor as present/unchanged
no longer matched runtime reality between when the roster expanded and this
repair. This defect's fix restores consistency with all three.
