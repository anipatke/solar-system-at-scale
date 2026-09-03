---
id: E03-sparse-3d-asteroid-belt/T001-render-sparse-instanced-belt
status: planned
objective: Replace the fog-like belt with a deterministic sparse field of reusable irregular WebGL rocks.
depends_on:
  - E02-lightweight-3d-planets/T003-integrate-and-validate-planet-system
complexity_tier: high
complexity_reason: Adds instancing, depth, deterministic distribution, and responsive budgets to shared WebGL infrastructure.
---

# T001: Render the Sparse Instanced Belt

## Problem

The current haze and 900 random dots read as a dense rectangular band instead of separated objects in depth.

## Context Files

- `.savepoint/releases/v1/epics/E03-sparse-3d-asteroid-belt/E03-Detail.md`
- `.savepoint/Design.md`
- `.savepoint/visual-identity.md`
- `.savepoint/Guardrails.md`
- `.savepoint/Health-Check.md`
- `main.js`
- `rendering/planet-renderer.js`
- `rendering/planet-materials.js`

## Acceptance Criteria

- [ ] The rectangular haze and dense random-dot belt are absent from the normal WebGL path.
- [ ] At most four reusable irregular meshes vary in scale, rotation, tone, and bounded depth.
- [ ] A deterministic seed keeps placement stable across reloads/resizes within `2.2–3.2 AU`.
- [ ] Instance budgets are capped at 180 on desktop and 80 at `600px` width or below.
- [ ] Large gaps and gradual entry/exit prevent a wall, fog, or glowing-field appearance.
- [ ] Parallax adds restrained depth without changing AU boundaries or camera ownership.
- [ ] Off-screen instances avoid expensive work and buffers are not recreated per frame.
- [ ] Changed-file syntax checks and `git diff --check` pass.

## Implementation Plan

- [ ] Add reusable low-poly rock geometry and instance attributes.
- [ ] Replace session randomness with a deterministic seeded distribution.
- [ ] Apply responsive budgets, depth limits, materials, and off-screen handling.
- [ ] Disable the old normal-path haze/dots after a successful WebGL belt frame.
- [ ] Verify boundaries, stable reloads, sparse composition, reuse, and budgets.

## Context Log

Pending.
