---
id: v1/D008-planet-texture-pop-in
release: v1
status: in_progress
stage: build
severity: medium
title: "The flat 2D fallback briefly shows on each planet just before its WebGL texture loads"
reference: E02-lightweight-3d-planets/T001-add-webgl-planet-sphere
---

# D008: Planet Texture Pop-In

## Symptom

Reported by the user: scrolling up to a planet (e.g. Jupiter), the old flat
2D canvas rendering briefly shows before the textured WebGL sphere "kicks
in."

## Expected Behavior

Every planet should already look like its final textured WebGL sphere by
the time it's visible on screen — no flash of the flatter 2D fallback
material as you approach.

## Reproduction

Confirmed in `rendering/planet-renderer.js`: `getSphereTexture(bodyId)`
lazily calls `loadTexture()` the *first time* a body id is requested, and
that first request only happens once the body appears in the `bodies` list
`frame(bodies)` receives — which is `main.js`'s `buildVisibleBodyViews()`,
itself gated by on-screen culling (`x < -r*4 || x > canvasW + r*4`). So a
planet's texture image doesn't start fetching/decoding until the moment it
scrolls into range.

Meanwhile `frame()` starts with `if (!allTexturesReady(bodies)) return false`
— while *any* currently-visible body's texture is still loading, the whole
WebGL layer reports failure for that frame, and `main.js`'s `drawPlanet()`
falls back to the flat 2D canvas path for every body that frame (this is
`ARCH-02`'s fallback contract working exactly as designed — it just doesn't
distinguish "WebGL is genuinely unavailable" from "a texture hasn't finished
loading yet"). Once the image's `onload` fires (typically a handful of
frames later, small pre-downscaled JPEGs), `allTexturesReady()` passes again
and WebGL resumes drawing every body, including the ring geometry state that
never actually changed.

## Impact

Affects every planet on its first approach each page load, since textures
are per-session in-memory (`sphereTextures`/`ringTextures` Maps), not
preloaded. Undercuts the "coherent volume, real material" visual-identity
goal at exactly the moment — first sight of a new planet — where first
impressions matter most.

## Fix Plan

- Kick off every known body's texture (and ring texture, where applicable)
  load immediately at renderer setup, rather than lazily on first visibility,
  so the fetch/decode latency happens once at startup instead of visibly at
  the moment each planet is approached.
- Re-trigger the same eager preload on WebGL context restoration, matching
  the existing lazy-reload behavior there.
- Keep this inside `rendering/planet-renderer.js`/`planet-materials.js` — no
  change to `main.js`'s body catalogue or the renderer's stated boundary
  ("does not own the body catalogue"), since `planet-materials.js` already
  owns the complete list of texture recipes.

## Acceptance Criteria

- [x] Every planet's texture load is requested at WebGL setup, not on first
      appearance in the visible-bodies list.
- [x] No other body's rendering, culling, or fallback behavior changes.
- [x] `PERF-01`/`ARCH-02`: fallback for a genuinely slow/failed load, or a
      real WebGL failure, is unchanged — this only changes *when* loading
      starts, not the success/failure contract.
- [x] Syntax and hygiene gates pass.

## Resolution Notes

Added `getAllTexturedBodyIds()` to `rendering/planet-materials.js`
(`Object.keys(RECIPES)` — the sun and all nine planets, exactly the set
`buildVisibleBodyViews()` ever passes to the renderer; belt/probe rendering
doesn't go through this sphere pipeline). Added `preloadAllTextures()` to
`rendering/planet-renderer.js`, which calls the existing
`getSphereTexture()`/`getRingTexture()` for every id in that list; called
once right after `buildSphereResources()`/`buildRingResources()` in both
`setup()` and `handleContextRestored()`, so textures start loading the
moment the WebGL context exists (in `init()`, before the user has scrolled
anywhere) instead of waiting for each body's first appearance.

No change to `frame()`, `allTexturesReady()`, `drawSphere()`, culling, or
the fallback contract itself — a texture that fails to load (or a context
that's genuinely unavailable) still leaves that body on the 2D fallback
exactly as before (`ARCH-02`, `PERF-03`); this fix only changes *when*
loading is requested. `getSphereTexture`/`getRingTexture` were already
idempotent per-id (`Map.has()` guard), so calling them again lazily from
`frame()` later is a no-op — no double-loading.

`node --check rendering/planet-renderer.js`, `node --check
rendering/planet-materials.js`, and `git diff --check` all pass. No headless
browser is available in this sandbox; recommend a hard-refresh visual pass
(clear cache so textures are genuinely uncached) scrolling straight to a
mid-journey planet to confirm the pop-in is gone, before flipping this
defect to `resolved`.
