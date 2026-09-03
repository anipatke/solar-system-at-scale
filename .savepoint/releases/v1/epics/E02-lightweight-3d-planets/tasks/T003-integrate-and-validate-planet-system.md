---
id: E02-lightweight-3d-planets/T003-integrate-and-validate-planet-system
status: planned
objective: Prove scale integrity, reduced motion, fallback recovery, navigation, and performance for the planet system.
depends_on:
  - E02-lightweight-3d-planets/T001-establish-webgl-planet-layer
  - E02-lightweight-3d-planets/T002-build-procedural-planet-materials
complexity_tier: high
complexity_reason: Validates integrated rendering across inputs, failures, responsive layouts, and performance boundaries.
---

# T003: Integrate and Validate the Planet System

## Problem

The visual layer is not releasable until its scale, focus, fallback, motion, and performance promises hold end to end.

## Context Files

- `.savepoint/releases/v1/epics/E02-lightweight-3d-planets/E02-Detail.md`
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

- [ ] Focus changes radius only; Sun, Earth, Jupiter, and Pluto centres match fallback AU positions.
- [ ] Scale disclosure stays readable whenever focus sizing is non-literal.
- [ ] Reduced motion freezes new decorative rotation without disabling travel, snapping, or information.
- [ ] Wheel, mouse, and touch each complete and reverse the Sun-to-Pluto journey.
- [ ] Setup/program/frame failures and context loss/restoration preserve a navigable 2D experience without uncaught errors.
- [ ] Thirty-second desktop/mobile runs prove DPR `≤1.5`, on-screen submission, and no renderer task over 50 ms.
- [ ] Median frame time regresses no more than 20% from the recorded 2D baseline.
- [ ] Design/context maps reflect implemented modules and current fallback behavior.
- [ ] All changed-file syntax checks and `git diff --check` pass.

## Implementation Plan

- [ ] Reconcile focus sizing, AU positions, disclosure, and renderer switching.
- [ ] Connect reduced-motion state to WebGL rotation.
- [ ] Run input, viewport, failure, recovery, and position-parity scenarios.
- [ ] Record baseline/completed performance evidence.
- [ ] Update architecture/context and record the Full health check.

## Context Log

Pending.
