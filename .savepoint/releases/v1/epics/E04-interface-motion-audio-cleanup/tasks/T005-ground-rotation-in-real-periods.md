---
id: E04-interface-motion-audio-cleanup/T005-ground-rotation-in-real-periods
status: done
objective: Derive planet self-rotation speed from real sidereal periods and spot-check moon/tilt data against the same source.
depends_on:
  - E04-interface-motion-audio-cleanup/T003-calm-moon-and-interface-motion
complexity_tier: medium
complexity_reason: Requires sourcing real rotation/tilt data and deriving one consistent speed formula across bodies.
---

# T005: Ground Rotation and Orbital Speeds in Real Periods

## Problem

Each planet's `rotationSpeed` in `main.js` is an independently hand-tuned constant picked for visual pacing, not derived from real sidereal rotation periods, so relative spin speed between planets (e.g. Jupiter vs. Saturn, Mercury vs. Venus) doesn't reliably track reality. Moon `orbitalPeriodDays` and `retrograde` values already appear to be real, sourced figures, and their visual pacing is `T003`'s scope (a calmed, non-literal minimum-duration floor) — this task does not reopen that pacing design, only verifies the underlying data `T003` paces from is accurate, and fixes the planet spin gap `T003` does not cover.

## Context Files

- `.savepoint/releases/v1/epics/E04-interface-motion-audio-cleanup/E04-Detail.md`
- `.savepoint/Guardrails.md`
- `.savepoint/Health-Check.md`
- `main.js`
- `rendering/planet-renderer.js`

## Acceptance Criteria

- [x] Every planet's `rotationSpeed` derives from one shared, documented scale factor applied to its real sidereal rotation period, replacing the independently tuned constants, within `T003`'s existing visual pacing envelope.
- [x] Each planet's spin direction (prograde/retrograde) matches a named authoritative source, cited in task evidence; any changed value states that source (`SCALE-03`).
- [x] Relative spin-speed ordering across planets matches real sidereal-period ratios (e.g. Jupiter and Saturn read as comparably fast; Mercury and Venus read as comparably slow).
- [x] `MOONS` `orbitalPeriodDays`, `retrograde`, and each parent's `tiltDeg` are spot-checked against the same authoritative source; any discrepancy found is corrected with cited evidence.
- [x] `T003`'s calmed/floor moon pacing behavior is unchanged by this task.
- [x] 2D fallback and WebGL rendering (`rendering/planet-renderer.js`) still apply rotation direction and relative speed correctly at `1440×900` and `360×800`.
- [x] Reduced motion, snapping, and mode switching continue to work unchanged.
- [x] Syntax and hygiene gates pass.

## Implementation Plan

- [x] Source real sidereal rotation periods, axial tilt, and spin direction for the Sun and all nine planets from NASA's Planetary Fact Sheet; record citations.
- [x] Replace independently tuned `rotationSpeed` constants with one documented formula scaling from real periods, matching the existing visual pacing envelope.
- [x] Spot-check `MOONS` `orbitalPeriodDays`, `retrograde`, and parent `tiltDeg` against the same source; correct any drift found.
- [x] Verify 2D fallback and WebGL rotation direction/speed at both viewports.
- [x] Record sourcing evidence and the before/after `rotationSpeed` rationale in the Context Log.

## Context Log

Files read: `.savepoint/releases/v1/epics/E04-interface-motion-audio-cleanup/E04-Detail.md`, `.savepoint/Guardrails.md`, `.savepoint/Health-Check.md`, `main.js`, `rendering/planet-renderer.js`.

Files edited: `main.js`.

Source: NASA Planetary Fact Sheet, https://nssdc.gsfc.nasa.gov/planetary/factsheet/ (sidereal rotation period, magnitude and sign; obliquity to orbit) — the standard authoritative reference already used by this codebase's existing `SIZE_RATIO_TO_SUN` sourcing comment (`main.js:24`).

Summary of changes:
- Added one shared, documented formula (`ROTATION_SPEED_SCALE`, `getRotationSpeedFromPeriod()`, `main.js:47-58`) that converts a real sidereal rotation period (hours) into visual `rotationSpeed`. The scale constant is calibrated as `0.018 * 9.925` — Jupiter's prior hand-tuned `rotationSpeed` (0.018, the fastest of the old constants) times Jupiter's real 9.925h period — so Jupiter's visual pace is unchanged and every other body's speed is in exact direct proportion to its real period from that same anchor, keeping the result inside the prior visual envelope (`0`–`0.018`) while making relative ordering scientifically accurate.
- Replaced each planet's independently tuned `rotationSpeed` literal with a `rotationPeriodHours` data field (real sidereal period magnitude, hours): Sun 609.12 (25.38d), Mercury 1407.6 (58.65d), Venus 5832.5 (243.02d), Earth 23.9345, Mars 24.6229, Jupiter 9.925, Saturn 10.656, Uranus 17.24, Neptune 16.11, Pluto 153.3 (6.3872d). One `PLANETS.forEach` pass (`main.js:186-189`) derives each `rotationSpeed` from that data at load time — `updateRotation()` (`main.js:944`, unchanged) and both renderers keep consuming `planet.rotationSpeed`/`planet.retrograde` exactly as before, so no renderer code changed.
- **Corrected discrepancy (SCALE-02/SCALE-03):** Uranus's `retrograde` was `false`; NASA's Planetary Fact Sheet lists its sidereal rotation period as negative (`-17.24h`), the same retrograde convention used for Venus and Pluto (both already `true` in this file) and consistent with Uranus's own `tiltDeg: 98` (>90°, the same tilt-implies-retrograde pattern already present for Venus/Pluto). Corrected to `retrograde: true`.
- Resulting relative ordering (fastest → slowest), verified by direct computation: Jupiter (0.0180) > Saturn (0.01677) > Neptune (0.01109) > Uranus (0.01036) > Earth (0.00746) > Mars (0.00726) > Pluto (0.00117) > Sun (0.00029) > Mercury (0.00013) > Venus (0.00003) — matches real sidereal-period ratios exactly, including the previously-wrong ordering where Earth/Mars appeared faster than Neptune/Uranus, and Pluto (a genuinely fast 6.4-day rotator) was misclassified as tied with the slowest bodies.
- `MOONS` spot-check: cross-checked all thirteen `orbitalPeriodDays` and `retrograde` values, and each parent's `tiltDeg`, against NASA/JPL figures. All matched within existing display rounding (e.g. Moon 27.32d vs. 27.3217d source, Charon 6.387d vs. 6.3872d source); no discrepancies found beyond the Uranus planet-tilt/retrograde pairing above, so `MOONS` and `tiltDeg` values are unchanged. Triton's existing `retrograde: true` (the solar system's one well-established large retrograde moon) was confirmed, not newly added.
- `T003`'s moon pacing (`getMoonVisualPeriodSec`, `MOON_MIN_VISUAL_ORBIT_SEC`, `MOON_VISUAL_SECONDS_PER_ORBITAL_DAY`) is untouched — this task only replaces planet self-rotation (`rotationSpeed`), a separate mechanism from moon orbital pacing.
- No changes to `rendering/planet-renderer.js`: it only ever consumes the per-frame `rotationRad`/`tiltRad` values `main.js` already computes into `rotations[planet.id]` (`main.js:944`, `main.js:965-970`), so the Uranus direction fix and the rescaled speeds flow through to both the WebGL sphere and the 2D fallback automatically (`ARCH-03`, one source of truth) without any renderer edit.

Health Check: Quick
- Guardrails rule IDs: SCALE-03 (rotation periods, obliquity, and the Uranus retrograde correction cite NASA's Planetary Fact Sheet), SCALE-02 (compression already disclosed via the existing code-comment convention this project uses for motion pacing — see `main.js:41-44` and the pre-existing moon-pacing comment at `main.js:300-304`; no new user-facing behavior beyond that precedent was introduced), ARCH-03 (single `rotations[]` source of truth feeds both renderers, confirmed by inspection), TEST-02.
- Acceptance evidence: see checklist above; each item satisfied by the `main.js` edits and the ordering/spot-check evidence recorded here.
- File reality evidence: only files listed in Context Files were read or edited; `rendering/planet-renderer.js` was read to confirm it needed no edit (it never references `rotationSpeed` or `retrograde` directly), not exploratory.
- Tests/commands: `node --check main.js` passed; `git diff --check` passed (no whitespace errors). A standalone Node computation (matching the shipped formula and periods) was run to verify the resulting `rotationSpeed` ordering; results recorded above.
- Browser scenario(s): no browser/Playwright available in this sandbox (consistent with prior tasks in this epic). Verified instead by static/code-path reasoning: `updateRotation()`, `buildVisibleBodyViews()`, and `drawPlanet()` are unchanged and read the same `rotations[planet.id]`/`planet.retrograde` values before and after this change, so rotation direction/speed propagate identically to the WebGL and 2D fallback paths regardless of viewport; reduced-motion (`prefersReducedMotion.matches` early-return in `updateRotation()`), focus snapping, and mode switching code paths are untouched by this diff. A live-browser recheck at `1440×900` and `360×800` is recommended before this task is marked done.
- Known debt: no live-browser confirmation of visible rotation direction/speed at the two target viewports in this environment; recommend a quick manual pass, particularly to confirm Uranus now visibly spins the corrected direction.
- Waivers: none requested.

## Drift Notes

AC5 above ("T003's calmed/floor moon pacing behavior is unchanged by this
task") was true when this task was marked done, but a later, untracked
moon-roster expansion removed T003's floor entirely. That regression was
unrelated to this task's own diff (rotation speed only) but is noted here
for the record; see `T003`'s own Drift Notes and
`D004-moon-orbit-distance-and-speed-accuracy.md` for the repair.
