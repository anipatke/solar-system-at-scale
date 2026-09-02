---
type: epic-design
status: planned
---

# E02: Lightweight 3D Planet System

## Purpose

Replace canvas-drawn planet illustrations with readable, lightweight 3D representations while preserving the scale journey.

## Planned value

- Render every planet as a lit sphere using a shared lightweight WebGL path.
- Give each body a recognisable material, including Jupiter cloud bands and Great Red Spot, Saturn rings, and terrestrial surface character.
- Introduce a clearly disclosed focus-size treatment so 3D detail remains visible without implying literal body-to-distance scale.
- Provide a graceful fallback when WebGL is unavailable.

## Dependencies

- E01 establishes the architecture and visual contract.

## Boundaries

No framework, large model downloads, photorealistic renderer, or change to AU-based positions.

## Open decisions

Choose authored compressed textures versus procedural materials per body during epic design.
