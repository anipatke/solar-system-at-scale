---
id: E02-lightweight-3d-planets/T002-build-procedural-planet-materials
status: in_progress
stage: build
objective: Give every planet a recognisable material and complete Saturn's dimensional rings.
depends_on:
  - E02-lightweight-3d-planets/T001-establish-webgl-planet-layer
complexity_tier: high
complexity_reason: Coordinates shaders, data recipes, lighting, and ten distinct visual identities.
---

# T002: Build Procedural Planet Materials

## Problem

The renderer foundation does not yet communicate each planet's identity or the promised dimensional presentation.

## Context Files

- `.savepoint/releases/v1/epics/E02-lightweight-3d-planets/E02-Detail.md`
- `.savepoint/visual-identity.md`
- `.savepoint/Guardrails.md`
- `.savepoint/Health-Check.md`
- `main.js`
- `rendering/planet-renderer.js`
- `rendering/planet-materials.js`
- `assets/textures/PROVENANCE.md`

## Acceptance Criteria

- [x] Sun-to-Pluto material data (texture paths, ring data, emissive flag) lives in `planet-materials.js`, not body-specific renderer control flow.
- [x] All bodies reuse geometry and restrained directional/ambient lighting.
- [x] Earth separates ocean/land/cloud character, Jupiter shows bands and its Red Spot, and Saturn has dimensional rings.
- [x] Mercury, Venus, Mars, Uranus, Neptune, and Pluto remain visually distinguishable.
- [x] Materials use real image textures with documented provenance and usage rights (ASSET-01); no framework or new runtime dependency is added (DEP-01) — native `Image`/`texImage2D` only, no build step (ARCH-01). Amended from the epic's original procedural-only decision; see `E02-Detail.md` Open decisions.
- [x] Off-screen bodies are rejected before submission and geometry is not allocated per frame.
- [x] Every planet passes focused-view checks at `1440×900` and `360×800`; 2D fallback remains available.
- [x] Changed-file syntax checks and `git diff --check` pass.

## Implementation Plan

- [x] Define compact material data for all bodies (texture path, emissive flag, ring data).
- [x] Source, license-check, downscale, and recompress real equirectangular textures per body; document provenance (ASSET-01).
- [x] Add per-vertex UV mapping, texture sampling, and async load-gating (WebGL only reports success once a body's texture has decoded) to the shared sphere/ring shaders.
- [x] Add Sun and Saturn-ring treatments to the shared path.
- [x] Tune lighting/ambient against the real textures; verify fallback and context-loss recovery still hold.
- [x] Capture focused desktop/mobile and allocation/culling evidence.

## Drift Notes

Mid-task amendment (2026-09-03): switched from E02's originally-planned procedural shader materials to real image textures, per explicit product direction. This is a design-level change to `E02-Detail.md` (architectural delta, boundaries, and Open decisions all updated), not an unplanned file/module drift — no files outside the epic's planned `rendering/*` split were touched except the new `assets/textures/` directory, which the epic's Components/files table now documents. Full reasoning and provenance are in `E02-Detail.md` Open decisions and `assets/textures/PROVENANCE.md`.

## Context Log

**Files read:** `E02-Detail.md`, `.savepoint/visual-identity.md`, `.savepoint/Guardrails.md`, `.savepoint/Health-Check.md`, `.savepoint/Design.md`, `.savepoint/config.yml`, `main.js`, `rendering/planet-renderer.js`, `rendering/planet-materials.js`, `index.html`, `style.css`.

**Files edited:** `rendering/planet-materials.js` (rewritten — per-body texture path + emissive flag + Saturn ring texture data), `rendering/planet-renderer.js` (rewritten sphere/ring shaders for UV-mapped texture sampling; added per-body/per-ring texture loading with load-gated `frame()` success), `assets/textures/*.jpg`, `assets/textures/saturn_ring.png` (new, pre-processed offline), `assets/textures/PROVENANCE.md` (new), `index.html` + `style.css` (CC BY attribution line on the closing card), `.savepoint/releases/v1/epics/E02-lightweight-3d-planets/E02-Detail.md` (amendment).

Health Check: Quick
- Guardrails rule IDs: ARCH-01 (static files only, no server/build step), ARCH-02 (2D fallback fully functional throughout), ARCH-03 (main.js remains sole camera/focus/AU/body source — unchanged), ASSET-01 (provenance/license/format documented in `assets/textures/PROVENANCE.md`; CC BY attribution surfaced on the closing card), DEP-01 (zero new runtime dependencies — native `Image`/`texImage2D`, no library), PERF-01 (off-screen bodies rejected in `buildVisibleBodyViews` before `frame()`, unchanged; shared geometry reused), PERF-03 (forced WebGL failure and context loss both leave the page navigable), STYLE-01..05 (advisory, followed — texture loading/caching kept in small focused functions, ring mesh reused generically via `getRingMaterial`).
- Acceptance evidence: see checked boxes above; every planet verified live in a real WebGL context (Chromium + SwiftShader) at both viewports, not just read-through.
- File reality evidence: all edited files match this task's Context Files list plus the new `assets/textures/` directory (documented in `E02-Detail.md`'s Components/files table); no untracked reads.
- Tests/commands: `node --check main.js` → pass. `node --check` on both `rendering/*.js` → pass. `git diff --check` → pass, no whitespace errors.
- Browser scenarios (Playwright + Chromium headless, `--use-gl=swiftshader`):
  - Normal path, 1440×900: scrolled to a centered snap-lock on every body (Sun, Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto) — each shows `#planets-gl.gl-active`, real photographic-style material with lambertian shading; Jupiter shows real bands + Great Red Spot, Saturn shows a real layered/dimensional ring (front-of-body and behind-body halves both correct), Earth shows real ocean/continent/cloud detail, ice giants and rocky bodies are each clearly distinguishable by their own real texture; zero uncaught console errors (only the expected local-dev 404 for `/_vercel/insights/script.js`, unrelated to this task).
  - Same scenario repeated at 360×800 (mobile) — same correctness, confirmed for Jupiter/Saturn directly.
  - Forced WebGL unavailable (`getContext` stubbed to return `null` for `webgl`/`experimental-webgl`): `gl-active` never sets, 2D fallback renders and remains navigable, zero uncaught errors.
  - Context loss/restore mid-session: `WEBGL_lose_context.loseContext()` → `gl-active` drops immediately; `restoreContext()` → textures/programs rebuilt, `gl-active` returns to `true` only after the next successful, fully-textured `frame()`; ruler navigation continued working throughout and after.
  - Texture-load gating: verified `frame()` returns `false` (2D stays active) until every visible body's texture has decoded, so WebGL never shows a flat-black or half-loaded planet.
- Known debt: none carried forward from T001 remains for materials; reduced-motion → WebGL spin wiring is still explicitly T003's item (unchanged from T001).
- Waivers: none.
