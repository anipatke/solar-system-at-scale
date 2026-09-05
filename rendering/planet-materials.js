/* ============================================================
   PLANET MATERIALS
   Body-specific WebGL appearance data, kept separate from
   rendering control flow (STYLE-02).

   Every body is textured with a real equirectangular image map
   rather than a shader-computed approximation. Sources: Solar
   System Scope (CC BY 4.0) for the Sun and all planets, and NASA/
   JHUAPL/SwRI New Horizons imagery (public domain) for Pluto —
   full provenance and license text in assets/textures/PROVENANCE.md
   (ASSET-01). Files are pre-downscaled/recompressed offline; no
   texture is generated or fetched from a third party at request
   time, so deployment stays static (ARCH-01) and no runtime
   dependency is added (DEP-01).
   ============================================================ */

'use strict';

const TEXTURE_BASE = 'assets/textures/';

const RECIPES = {
  sun:     { texture: 'sun.jpg', emissive: true },
  mercury: { texture: 'mercury.jpg' },
  venus:   { texture: 'venus.jpg' },
  earth:   { texture: 'earth.jpg' },
  mars:    { texture: 'mars.jpg' },
  jupiter: { texture: 'jupiter.jpg' },
  saturn:  { texture: 'saturn.jpg' },
  uranus:  { texture: 'uranus.jpg' },
  neptune: { texture: 'neptune.jpg' },
  pluto:   { texture: 'pluto.jpg' },
};

const DEFAULT_TEXTURE = 'mercury.jpg';

// Saturn's ring density/color strip, sampled along the shared ring
// mesh's radial edge coordinate (STYLE-03: reusable by any future
// ringed body — only Saturn supplies data today).
const RING_MATERIALS = {
  saturn: { texture: 'saturn_ring.png' },
};

// D008: lets the renderer eagerly request every known body's texture at
// startup instead of waiting for each body to first scroll into view, so a
// planet's real material is already loaded well before the 2D fallback
// would otherwise show briefly as the approaching body enters the visible
// range.
export function getAllTexturedBodyIds() {
  return Object.keys(RECIPES);
}

export function getMaterialRecipe(bodyId) {
  const raw = RECIPES[bodyId];
  return {
    texturePath: TEXTURE_BASE + (raw ? raw.texture : DEFAULT_TEXTURE),
    emissive: !!(raw && raw.emissive),
  };
}

export function getRingMaterial(bodyId) {
  const raw = RING_MATERIALS[bodyId];
  return raw ? { texturePath: TEXTURE_BASE + raw.texture } : null;
}

export function isEmissive(bodyId) {
  return !!(RECIPES[bodyId] && RECIPES[bodyId].emissive);
}
