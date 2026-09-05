---
id: v1/D004-moon-orbit-distance-and-speed-accuracy
release: v1
status: open
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
- Replace the single shared visual-speed conversion with per-planet tuning or
  a tighter orbital scaling model if the current compression still feels too
  flat.
- Preserve readability and keep the overlay non-cluttering.

## Acceptance Criteria

- [ ] The moon roster stays small and recognizable, not a 1:1 satellite dump.
- [ ] Inner moons still move faster than outer moons, but the relative cadence
      reads more like the real solar system.
- [ ] The biggest planet systems feel more faithful without becoming visually
      noisy.

## Resolution Notes

Pending.
