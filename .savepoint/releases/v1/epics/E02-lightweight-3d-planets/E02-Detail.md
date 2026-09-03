---
type: epic-design
status: planned
---

# E02: Lightweight 3D Planet System

## Purpose

Make every planet readable as a dimensional, recognisable body without weakening the proportional AU journey, static deployment, or low-cost fallback.

## What this epic adds

- A transparent native WebGL planet layer above the existing 2D space scene and below semantic DOM interface elements.
- One reusable sphere mesh, a reusable Saturn ring mesh, restrained lighting, and data-driven material recipes for every planet.
- Real equirectangular image materials for every body (Sun through Pluto) with documented provenance and licensing, giving terrestrial colour regions, Jupiter's bands and Great Red Spot, gas/ice-giant banding, and Pluto's high-contrast character.
- A disclosed focus-size treatment that keeps the body's AU position fixed while making surface detail legible.
- Automatic use of the existing 2D planet renderer whenever WebGL cannot produce a valid frame.

## Components and files

| Module | Purpose |
|--------|---------|
| `index.html` | Add the transparent rendering canvas and load the browser-native module entry point without a build step. |
| `style.css` | Stack the WebGL canvas between the 2D scene and DOM UI while preserving pointer input and responsive overlays. |
| `main.js` | Remain the source of truth for body data, camera/focus state, AU positions, display radii, rotation timing, and fallback selection. |
| `rendering/planet-renderer.js` | Own WebGL setup, shared geometry and programs, resize/DPR handling, visible-body drawing, context recovery, and a narrow frame-input API. |
| `rendering/planet-materials.js` | Define body-specific material data (texture paths, ring data, emissive flag) as data, separate from renderer control flow. |
| `assets/textures/` | Pre-processed static image textures for every body plus Saturn's ring strip, with `PROVENANCE.md` documenting source, license, and processing (ASSET-01). |
| `.savepoint/Design.md` | Add the accepted renderer modules and texture assets to the codebase map after implementation proves the split. |

## Architectural delta

The 2D canvas continues to own space, stars, belt effects, moons, probes, labels, and the complete journey. A second transparent canvas owns only planets and Saturn's rings. `main.js` computes each visible body's screen centre, display radius, focus state, and rotation, then passes an immutable per-frame view model to the renderer; the WebGL layer must not maintain a second camera, focus reducer, distance calculation, or body catalogue.

The renderer uses browser-native ES modules and embeds its shader sources in JavaScript so deployment remains static and no shader-fetch failure path is introduced. Shared buffers represent a unit sphere and ring geometry; per-body appearance comes from compact uniform-driven material recipes rather than copied geometry or body-specific draw functions.

Materials use real equirectangular image textures rather than procedural shader math (amended during T002 — see Open decisions). Each body's diffuse map is sampled in the shared sphere shader via per-vertex UV coordinates and lit with the same restrained directional/ambient model as before; Saturn's ring plane samples a shared density/color strip the same way. Textures are pre-downscaled and recompressed offline before being committed as static files, so deployment stays static (no server, no build step) and no runtime dependency is added (DEP-01) — only native `Image`/`texImage2D`. Provenance, licenses, and processing notes are documented in `assets/textures/PROVENANCE.md` (ASSET-01), and CC BY attribution is surfaced in-page at the closing card.

WebGL becomes active only after context creation, shader compilation/linking, buffer creation, and one successful frame. Initialization failure, frame failure, or context loss immediately leaves or returns the scene to the current 2D planet path. After context restoration, resources may be rebuilt, but WebGL is shown again only after another successful frame. Failure must never disable input, ruler updates, focus snapping, cards, or the Sun-to-Pluto journey.

## Boundaries

**In scope:**

- Sun, Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune, and Pluto as shared-geometry WebGL bodies.
- Saturn's dimensional ring plane, body-specific axial orientation, restrained directional and ambient light, and slow rotation.
- One display-size calculation owned by `main.js`; focus enlargement changes radius only, never AU-derived position.
- Off-screen culling before draw submission, bounded geometry, a device-pixel-ratio cap of `1.5`, and pause/freeze of decorative rotation under reduced motion.
- Fallback for unavailable WebGL, shader/program failure, draw failure, context loss, and unsuccessful restoration.

**Out of scope:**

- 3D moons, probes, asteroid-belt work, orbital simulation, new astronomical content, or changes to AU values.
- Frameworks, a bundler, runtime rendering dependencies, large/unlicensed models, post-processing, shadows, or photorealistic lighting beyond the sourced diffuse maps.
- Card simplification, scale-panel redesign, audio removal, or broad responsive-interface work owned by E04.
- Replacing the existing 2D planet code; it remains the maintained fallback.

## Quality gates

- Every planet has a named focused-view recognisability check at `1440×900` and `360×800`; Jupiter includes bands and the Great Red Spot, Earth separates ocean/land/cloud character, and Saturn has a visibly dimensional ring plane.
- Wheel, mouse drag, and touch emulation each complete the Sun-to-Pluto journey; ruler/focus positions match the 2D fallback at the Sun, Earth, Jupiter, and Pluto.
- Existing scale disclosure remains visible when focus sizing is active, and toggling WebGL/fallback does not move a body's centre on the AU axis.
- Forced WebGL unavailability, shader/program failure, draw failure, context loss, and restoration are exercised; each failure keeps navigation and information usable without an uncaught console error.
- Reduced-motion mode freezes new decorative planet rotation without disabling travel or focus changes.
- The renderer submits only on-screen bodies, reuses shared geometry, caps DPR at `1.5`, and records a 30-second desktop/mobile traversal. Median frame time may regress by no more than 20% from the current 2D baseline, with no renderer-caused task over 50 ms.
- `node --check` passes for every changed JavaScript file and `git diff --check` passes for the integrated epic.

## Open decisions

Resolved during T002 (2026-09-03): switched from procedural-only shader materials to real equirectangular image textures, per explicit product direction that procedural math read as an approximation rather than a rendered planet. Textures are sourced from Solar System Scope (CC BY 4.0) for the Sun and all eight major planets, and NASA/JHUAPL/SwRI New Horizons imagery via Wikimedia Commons (public domain) for Pluto; all are pre-processed offline (downscaled, recompressed, and — for Pluto's unimaged far-side gap — fuzz-filled to a muted tone) before being committed as static assets. Full provenance is in `assets/textures/PROVENANCE.md`. This satisfies `ASSET-01` (provenance/rights/format) and `DEP-01` (no new runtime dependency: native `Image`/`texImage2D` only); `ARCH-01` is unaffected since textures are static files, not a build step or server. Browser-native ES modules remain unchanged. No further open decisions.
