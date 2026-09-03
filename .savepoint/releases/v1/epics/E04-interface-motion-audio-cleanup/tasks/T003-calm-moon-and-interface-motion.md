---
id: E04-interface-motion-audio-cleanup/T003-calm-moon-and-interface-motion
status: planned
objective: Apply calm shared moon timing and complete reduced-motion behavior without changing navigation.
depends_on:
  - E03-sparse-3d-asteroid-belt/T002-integrate-belt-orientation-and-fallback
complexity_tier: medium
complexity_reason: Coordinates animation timing across Canvas, WebGL, CSS, media queries, and focus transitions.
---

# T003: Calm Moon and Interface Motion

## Problem

Moon speeds and decorative transitions can become frantic or continue under reduced-motion preferences.

## Context Files

- `.savepoint/releases/v1/epics/E04-interface-motion-audio-cleanup/E04-Detail.md`
- `.savepoint/Design.md`
- `.savepoint/visual-identity.md`
- `.savepoint/Guardrails.md`
- `.savepoint/Health-Check.md`
- `style.css`
- `main.js`
- `rendering/planet-renderer.js`

## Acceptance Criteria

- [ ] Every moon derives from one shared time-scale calculation with a minimum 24-second visual orbit.
- [ ] Relative ordering stays calm/deterministic without claiming literal orbital simulation.
- [ ] Reduced motion freezes moons, planet rotation, star twinkle, and governed decorative loops.
- [ ] Reduced motion removes non-essential CSS motion while preserving visible focus and information.
- [ ] Navigation, snapping, modes, disclosure, and reverse travel remain operational.
- [ ] Preference changes do not jump state, hide content, or cause uncaught errors.
- [ ] Normal/reduced scenarios pass at `1440×900` and `360×800` with syntax/hygiene gates.

## Implementation Plan

- [ ] Replace moon speed multiplication with one documented visual-period calculation.
- [ ] Centralise reduced-motion detection across Canvas and WebGL.
- [ ] Add reduced-motion CSS for decorative transitions/keyframes.
- [ ] Verify preference changes, focus continuity, inputs, and viewports.
- [ ] Record timing rationale and browser evidence.

## Context Log

Pending.
