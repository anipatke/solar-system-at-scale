---
id: E03-sparse-3d-asteroid-belt/T002-integrate-belt-orientation-and-fallback
status: planned
objective: Add restrained orientation, preserve a sparse 2D fallback, and validate the integrated belt passage.
depends_on:
  - E03-sparse-3d-asteroid-belt/T001-render-sparse-instanced-belt
complexity_tier: medium
complexity_reason: Coordinates labels, fallback, journey behavior, performance evidence, and documentation across modules.
---

# T002: Integrate Belt Orientation and Fallback

## Problem

The 3D belt needs minimal orientation and a fallback that preserves its sparse character without adding a focus mode.

## Context Files

- `.savepoint/releases/v1/epics/E03-sparse-3d-asteroid-belt/E03-Detail.md`
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

- [ ] Ceres is the only new named belt marker and has no focus snap, card, or navigation mode.
- [ ] The 2D fallback uses deterministic sparse objects without restoring haze or a dense wall.
- [ ] Both paths enter near `2.2 AU`, exit near `3.2 AU`, and leave planet/focus positions unchanged.
- [ ] Wheel, mouse, and touch cross the belt and continue to Pluto in both paths.
- [ ] Desktop and `360×800` checks show gaps, restrained parallax, orientation, and no persistent UI obstruction.
- [ ] Combined rendering stays within E02's DPR/frame envelope with no renderer task over 50 ms.
- [ ] Design/context documents describe the belt budgets, marker, and fallback accurately.
- [ ] All changed-file syntax checks and `git diff --check` pass.

## Implementation Plan

- [ ] Add a non-focusable Ceres marker through existing data/label ownership.
- [ ] Replace the old fallback with deterministic sparse 2D objects.
- [ ] Verify boundaries, focus invariance, input journeys, viewports, and failure behavior.
- [ ] Measure integrated performance and update current-state documentation.
- [ ] Record the E03 Full health check.

## Context Log

Pending.
