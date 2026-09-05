/* ============================================================
   PLANET RENDERER
   Native WebGL foundation for the transparent planet layer.

   Owns: WebGL setup, one shared unit-sphere mesh, one shared
   Saturn-ring mesh, embedded shader programs, texture loading,
   resize/DPR handling, context-loss recovery, and a narrow
   per-frame draw API.

   Does NOT own: camera position, focus state, AU distances, or
   the body catalogue. `main.js` computes each visible body's
   screen center, display radius, tilt, and rotation and passes
   an immutable view list into `frame()` every animation frame.
   ============================================================ */

'use strict';

import { getMaterialRecipe, getRingMaterial, getAllTexturedBodyIds } from './planet-materials.js';

// ── SHARED GEOMETRY CONSTANTS ───────────────────────────────
// D007: 16x24 left the Sun's silhouette visibly polygonal — it renders at a
// fixed canvasH/2 radius (often 400-500+ screen px), far larger than any
// planet's small fraction of that (SIZE_RATIO_TO_SUN), so the same shared
// mesh needs enough segments for its largest, not its typical, on-screen
// size. At the new SPHERE_LON_SEGMENTS the polygon-vs-circle deviation is
// r*(1-cos(pi/48)) ~= 0.2% of radius (~1px at 500px) - well under a visibly
// faceted edge - while vertex/index counts stay trivial for WebGL regardless
// (STYLE-03: one shared mesh for every body, not a Sun-specific one).
const SPHERE_LAT_SEGMENTS = 24;
const SPHERE_LON_SEGMENTS = 48;
const RING_SEGMENTS = 48;
const RING_INNER_RATIO = 1.3;
const RING_OUTER_RATIO = 2.2;
// Foreshortening applied to the ring plane so it reads as a
// dimensional disc rather than a flat circle, echoing the 2D
// fallback's fixed vertical compression.
const RING_TILT_RAD = Math.acos(0.3);
const GL_DPR_CAP = 1.5;
const LIGHT_DIR = normalizeVec3([-0.35, -0.5, 0.8]);
const AMBIENT = 0.35;

// ── EMBEDDED SHADERS ─────────────────────────────────────────
// UV comes from the mesh itself (aUV, one value per vertex,
// duplicated along the seam column — see buildSphereGeometry) so
// the equirectangular texture never smears across the longitude
// seam the way a per-fragment atan2() derivation would.
const SPHERE_VERTEX_SRC = `
  attribute vec3 aPosition;
  attribute vec2 aUV;
  uniform mat4 uProjection;
  uniform mat4 uModel;
  uniform mat3 uNormalMatrix;
  varying vec3 vNormal;
  varying vec2 vUv;
  void main() {
    vNormal = normalize(uNormalMatrix * aPosition);
    vUv = aUV;
    gl_Position = uProjection * uModel * vec4(aPosition, 1.0);
  }
`;

const SPHERE_FRAGMENT_SRC = `
  precision mediump float;
  varying vec3 vNormal;
  varying vec2 vUv;
  uniform sampler2D uTexture;
  uniform vec3 uLightDir;
  uniform float uAmbient;
  uniform float uEmissive;
  void main() {
    vec3 texColor = texture2D(uTexture, vUv).rgb;
    float diff = max(dot(normalize(vNormal), uLightDir), 0.0);
    vec3 lit = texColor * (uAmbient + (1.0 - uAmbient) * diff);
    vec3 finalColor = mix(lit, texColor, uEmissive);
    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

const RING_VERTEX_SRC = `
  attribute vec3 aPosition;
  attribute float aEdge;
  uniform mat4 uProjection;
  uniform mat4 uModel;
  varying float vEdge;
  void main() {
    vEdge = aEdge;
    gl_Position = uProjection * uModel * vec4(aPosition, 1.0);
  }
`;

// Samples the shared ring density/color strip along the radial edge
// coordinate; the strip's own alpha channel supplies the layered,
// dimensional band look instead of an analytic approximation.
const RING_FRAGMENT_SRC = `
  precision mediump float;
  varying float vEdge;
  uniform sampler2D uRingTexture;
  void main() {
    vec4 texel = texture2D(uRingTexture, vec2(vEdge, 0.5));
    if (texel.a < 0.02) discard;
    gl_FragColor = vec4(texel.rgb * texel.a, texel.a);
  }
`;

// ── SHARED GEOMETRY BUILDERS ─────────────────────────────────
function buildSphereGeometry(latSegments, lonSegments) {
  const positions = [];
  const uvs = [];
  const stride = lonSegments + 1;

  for (let lat = 0; lat <= latSegments; lat++) {
    const theta = (lat / latSegments) * Math.PI;
    const sinTheta = Math.sin(theta);
    const cosTheta = Math.cos(theta);

    for (let lon = 0; lon <= lonSegments; lon++) {
      const phi = (lon / lonSegments) * Math.PI * 2;
      positions.push(
        Math.cos(phi) * sinTheta,
        cosTheta,
        Math.sin(phi) * sinTheta
      );
      // v=0 at the +Y pole (top row of a standard equirectangular map).
      uvs.push(lon / lonSegments, lat / latSegments);
    }
  }

  const indices = [];
  for (let lat = 0; lat < latSegments; lat++) {
    for (let lon = 0; lon < lonSegments; lon++) {
      const a = lat * stride + lon;
      const b = a + stride;
      indices.push(a, b, a + 1);
      indices.push(b, b + 1, a + 1);
    }
  }

  return {
    positions: new Float32Array(positions),
    uvs: new Float32Array(uvs),
    indices: new Uint16Array(indices),
  };
}

// One shared annulus mesh, split into a "front" half (rendered after
// the sphere, in front of it) and a "back" half (rendered before the
// sphere, behind it) — the same behind/in-front split the 2D fallback
// uses, so ring occlusion stays correct without relying on depth-test
// sign conventions across an orthographic projection.
function buildRingGeometry(innerRatio, outerRatio, segments) {
  const positions = [];
  const edges = [];

  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const cx = Math.cos(angle);
    const cy = Math.sin(angle);
    positions.push(cx * innerRatio, cy * innerRatio, 0);
    edges.push(0);
    positions.push(cx * outerRatio, cy * outerRatio, 0);
    edges.push(1);
  }

  const frontIndices = [];
  const backIndices = [];
  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const target = angle < Math.PI ? frontIndices : backIndices;
    const i0 = i * 2;
    const i1 = i * 2 + 1;
    const i2 = (i + 1) * 2;
    const i3 = (i + 1) * 2 + 1;
    target.push(i0, i1, i2, i1, i3, i2);
  }

  return {
    positions: new Float32Array(positions),
    edges: new Float32Array(edges),
    frontIndices: new Uint16Array(frontIndices),
    backIndices: new Uint16Array(backIndices),
  };
}

// ── MATRIX HELPERS (column-major mat4/mat3, no dependency) ──
function mat4Identity() {
  return new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
}

function mat4Multiply(a, b) {
  const out = new Float32Array(16);
  for (let col = 0; col < 4; col++) {
    for (let row = 0; row < 4; row++) {
      let sum = 0;
      for (let k = 0; k < 4; k++) sum += a[k * 4 + row] * b[col * 4 + k];
      out[col * 4 + row] = sum;
    }
  }
  return out;
}

function mat4MultiplyAll(matrices) {
  return matrices.reduce((acc, m) => (acc ? mat4Multiply(acc, m) : m), null);
}

function mat4Translate(tx, ty, tz) {
  const m = mat4Identity();
  m[12] = tx; m[13] = ty; m[14] = tz;
  return m;
}

function mat4Scale(sx, sy, sz) {
  const m = mat4Identity();
  m[0] = sx; m[5] = sy; m[10] = sz;
  return m;
}

function mat4RotateX(rad) {
  const c = Math.cos(rad), s = Math.sin(rad);
  const m = mat4Identity();
  m[5] = c; m[6] = s; m[9] = -s; m[10] = c;
  return m;
}

function mat4RotateY(rad) {
  const c = Math.cos(rad), s = Math.sin(rad);
  const m = mat4Identity();
  m[0] = c; m[2] = -s; m[8] = s; m[10] = c;
  return m;
}

function mat4RotateZ(rad) {
  const c = Math.cos(rad), s = Math.sin(rad);
  const m = mat4Identity();
  m[0] = c; m[1] = s; m[4] = -s; m[5] = c;
  return m;
}

function mat4Ortho(left, right, bottom, top, near, far) {
  const m = mat4Identity();
  m[0] = 2 / (right - left);
  m[5] = 2 / (top - bottom);
  m[10] = -2 / (far - near);
  m[12] = -(right + left) / (right - left);
  m[13] = -(top + bottom) / (top - bottom);
  m[14] = -(far + near) / (far - near);
  return m;
}

function mat3FromMat4Rotation(m) {
  return new Float32Array([m[0], m[1], m[2], m[4], m[5], m[6], m[8], m[9], m[10]]);
}

function normalizeVec3([x, y, z]) {
  const len = Math.hypot(x, y, z) || 1;
  return [x / len, y / len, z / len];
}

// ── GL PROGRAM HELPERS ────────────────────────────────────────
function compileShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Shader compile failed: ${log}`);
  }
  return shader;
}

function linkProgram(gl, vertexSrc, fragmentSrc) {
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexSrc);
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSrc);
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(`Program link failed: ${log}`);
  }
  return program;
}

function createBuffer(gl, target, data) {
  const buffer = gl.createBuffer();
  gl.bindBuffer(target, buffer);
  gl.bufferData(target, data, gl.STATIC_DRAW);
  return buffer;
}

// ── RENDERER ─────────────────────────────────────────────────
export function createPlanetRenderer(canvas) {
  let gl = null;
  let sphereProgram = null;
  let ringProgram = null;
  let sphereUniforms = null;
  let ringUniforms = null;
  let sphereMesh = null;
  let ringMesh = null;
  let sphereTextures = new Map();  // bodyId -> {texture, ready}
  let ringTextures = new Map();    // bodyId -> {texture, ready}
  let cssWidth = 0;
  let cssHeight = 0;
  let contextLost = false;
  let ready = false;
  let everDrewFrame = false;

  function getContext() {
    const opts = { alpha: true, antialias: true, premultipliedAlpha: true, depth: true };
    return canvas.getContext('webgl', opts) || canvas.getContext('experimental-webgl', opts);
  }

  // Loads one equirectangular (or ring-strip) image as a texture.
  // The texture is usable immediately (a 1x1 placeholder), but
  // `entry.ready` only flips true once the real pixels have decoded —
  // frame() will not report success for a body until then, so WebGL
  // never shows a half-loaded or blank-textured planet (ARCH-02).
  function loadTexture(path) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 255]));
    // NPOT-safe wrapping/filtering; no mipmaps needed at planet scale.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    const entry = { texture, ready: false };
    const image = new Image();
    image.onload = () => {
      if (!gl) return; // context lost/disposed while loading
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      entry.ready = true;
    };
    // Load failure leaves entry.ready false permanently; that body's
    // frames simply never report success, so the 2D fallback keeps
    // drawing it (PERF-03) without throwing.
    image.src = path;
    return entry;
  }

  function getSphereTexture(bodyId) {
    if (!sphereTextures.has(bodyId)) {
      sphereTextures.set(bodyId, loadTexture(getMaterialRecipe(bodyId).texturePath));
    }
    return sphereTextures.get(bodyId);
  }

  function getRingTexture(bodyId) {
    if (!ringTextures.has(bodyId)) {
      const material = getRingMaterial(bodyId);
      ringTextures.set(bodyId, material ? loadTexture(material.texturePath) : null);
    }
    return ringTextures.get(bodyId);
  }

  // D008: kicks off every known body's texture load immediately, instead of
  // lazily on first appearance in frame()'s visible-bodies list. Without
  // this, a planet scrolling into view for the first time would report
  // allTexturesReady() === false for the handful of frames its image takes
  // to fetch/decode, so the whole WebGL layer would fall back to the flat
  // 2D canvas path for that stretch (ARCH-02's fallback contract working
  // exactly as designed, just triggered by load latency rather than a real
  // WebGL failure). Preloading means that latency happens once, at startup,
  // off-screen, rather than visibly at the moment a body is approached.
  function preloadAllTextures() {
    getAllTexturedBodyIds().forEach(bodyId => {
      getSphereTexture(bodyId);
      getRingTexture(bodyId);
    });
  }

  function buildSphereResources() {
    sphereProgram = linkProgram(gl, SPHERE_VERTEX_SRC, SPHERE_FRAGMENT_SRC);
    sphereUniforms = {
      projection: gl.getUniformLocation(sphereProgram, 'uProjection'),
      model: gl.getUniformLocation(sphereProgram, 'uModel'),
      normalMatrix: gl.getUniformLocation(sphereProgram, 'uNormalMatrix'),
      texture: gl.getUniformLocation(sphereProgram, 'uTexture'),
      lightDir: gl.getUniformLocation(sphereProgram, 'uLightDir'),
      ambient: gl.getUniformLocation(sphereProgram, 'uAmbient'),
      emissive: gl.getUniformLocation(sphereProgram, 'uEmissive'),
    };
    const aPosition = gl.getAttribLocation(sphereProgram, 'aPosition');
    const aUV = gl.getAttribLocation(sphereProgram, 'aUV');

    const geom = buildSphereGeometry(SPHERE_LAT_SEGMENTS, SPHERE_LON_SEGMENTS);
    sphereMesh = {
      positionBuffer: createBuffer(gl, gl.ARRAY_BUFFER, geom.positions),
      uvBuffer: createBuffer(gl, gl.ARRAY_BUFFER, geom.uvs),
      indexBuffer: createBuffer(gl, gl.ELEMENT_ARRAY_BUFFER, geom.indices),
      indexCount: geom.indices.length,
      aPosition,
      aUV,
    };

    // WebGLTexture handles from a previous context (if any) are dead;
    // rebuild the cache so the next draw re-requests fresh textures.
    sphereTextures = new Map();
  }

  function buildRingResources() {
    ringProgram = linkProgram(gl, RING_VERTEX_SRC, RING_FRAGMENT_SRC);
    ringUniforms = {
      projection: gl.getUniformLocation(ringProgram, 'uProjection'),
      model: gl.getUniformLocation(ringProgram, 'uModel'),
      texture: gl.getUniformLocation(ringProgram, 'uRingTexture'),
    };
    const aPosition = gl.getAttribLocation(ringProgram, 'aPosition');
    const aEdge = gl.getAttribLocation(ringProgram, 'aEdge');

    const geom = buildRingGeometry(RING_INNER_RATIO, RING_OUTER_RATIO, RING_SEGMENTS);
    ringMesh = {
      positionBuffer: createBuffer(gl, gl.ARRAY_BUFFER, geom.positions),
      edgeBuffer: createBuffer(gl, gl.ARRAY_BUFFER, geom.edges),
      frontIndexBuffer: createBuffer(gl, gl.ELEMENT_ARRAY_BUFFER, geom.frontIndices),
      backIndexBuffer: createBuffer(gl, gl.ELEMENT_ARRAY_BUFFER, geom.backIndices),
      frontIndexCount: geom.frontIndices.length,
      backIndexCount: geom.backIndices.length,
      aPosition,
      aEdge,
    };

    ringTextures = new Map();
  }

  function setup() {
    gl = getContext();
    if (!gl) return false;

    buildSphereResources();
    buildRingResources();
    preloadAllTextures();

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(gl.ONE, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    canvas.addEventListener('webglcontextlost', handleContextLost, false);
    canvas.addEventListener('webglcontextrestored', handleContextRestored, false);
    return true;
  }

  function handleContextLost(event) {
    event.preventDefault();
    contextLost = true;
  }

  function handleContextRestored() {
    try {
      buildSphereResources();
      buildRingResources();
      preloadAllTextures();
      gl.enable(gl.DEPTH_TEST);
      gl.enable(gl.BLEND);
      gl.blendFuncSeparate(gl.ONE, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      contextLost = false;
      // Availability is re-proven only after the next successful frame().
    } catch (err) {
      // Restoration failed — give up on WebGL for this session; 2D stays active.
      ready = false;
      gl = null;
    }
  }

  try {
    ready = setup();
  } catch (err) {
    ready = false;
    gl = null;
  }

  function resize(newCssWidth, newCssHeight) {
    cssWidth = newCssWidth;
    cssHeight = newCssHeight;
    if (!gl) return;
    const dpr = Math.min(window.devicePixelRatio || 1, GL_DPR_CAP);
    const pixelWidth = Math.max(1, Math.round(cssWidth * dpr));
    const pixelHeight = Math.max(1, Math.round(cssHeight * dpr));
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
    canvas.style.width = `${cssWidth}px`;
    canvas.style.height = `${cssHeight}px`;
    gl.viewport(0, 0, pixelWidth, pixelHeight);
  }

  function buildModelMatrix(body, includeSpin) {
    const rotation = includeSpin
      ? mat4MultiplyAll([mat4RotateZ(body.tiltRad), mat4RotateY(body.rotationRad)])
      : mat4MultiplyAll([mat4RotateZ(body.tiltRad), mat4RotateX(RING_TILT_RAD)]);
    const model = mat4MultiplyAll([
      mat4Translate(body.x, body.y, 0),
      rotation,
      mat4Scale(body.radius, body.radius, body.radius),
    ]);
    return { model, rotation };
  }

  // Every visible body's texture (and ring texture, if any) must be
  // loaded before this frame can count as a WebGL success — otherwise
  // a still-loading planet would flash as flat black.
  function allTexturesReady(bodies) {
    return bodies.every(body => {
      const tex = getSphereTexture(body.id);
      if (!tex.ready) return false;
      if (body.hasRings) {
        const ring = getRingTexture(body.id);
        if (ring && !ring.ready) return false;
      }
      return true;
    });
  }

  function drawSphere(body, projection) {
    const { model, rotation } = buildModelMatrix(body, true);
    const normalMatrix = mat3FromMat4Rotation(rotation);
    const tex = getSphereTexture(body.id);

    gl.useProgram(sphereProgram);
    gl.bindBuffer(gl.ARRAY_BUFFER, sphereMesh.positionBuffer);
    gl.enableVertexAttribArray(sphereMesh.aPosition);
    gl.vertexAttribPointer(sphereMesh.aPosition, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, sphereMesh.uvBuffer);
    gl.enableVertexAttribArray(sphereMesh.aUV);
    gl.vertexAttribPointer(sphereMesh.aUV, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sphereMesh.indexBuffer);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, tex.texture);
    gl.uniform1i(sphereUniforms.texture, 0);

    gl.uniformMatrix4fv(sphereUniforms.projection, false, projection);
    gl.uniformMatrix4fv(sphereUniforms.model, false, model);
    gl.uniformMatrix3fv(sphereUniforms.normalMatrix, false, normalMatrix);
    gl.uniform3fv(sphereUniforms.lightDir, LIGHT_DIR);
    gl.uniform1f(sphereUniforms.ambient, AMBIENT);
    gl.uniform1f(sphereUniforms.emissive, getMaterialRecipe(body.id).emissive ? 1 : 0);

    gl.drawElements(gl.TRIANGLES, sphereMesh.indexCount, gl.UNSIGNED_SHORT, 0);
  }

  function drawRingHalf(body, projection, half) {
    const ringTex = getRingTexture(body.id);
    if (!ringTex) return;

    const { model } = buildModelMatrix(body, false);
    const indexBuffer = half === 'front' ? ringMesh.frontIndexBuffer : ringMesh.backIndexBuffer;
    const indexCount = half === 'front' ? ringMesh.frontIndexCount : ringMesh.backIndexCount;
    if (indexCount === 0) return;

    gl.useProgram(ringProgram);
    gl.bindBuffer(gl.ARRAY_BUFFER, ringMesh.positionBuffer);
    gl.enableVertexAttribArray(ringMesh.aPosition);
    gl.vertexAttribPointer(ringMesh.aPosition, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, ringMesh.edgeBuffer);
    gl.enableVertexAttribArray(ringMesh.aEdge);
    gl.vertexAttribPointer(ringMesh.aEdge, 1, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, ringTex.texture);
    gl.uniform1i(ringUniforms.texture, 0);

    gl.uniformMatrix4fv(ringUniforms.projection, false, projection);
    gl.uniformMatrix4fv(ringUniforms.model, false, model);

    gl.drawElements(gl.TRIANGLES, indexCount, gl.UNSIGNED_SHORT, 0);
  }

  function drawBody(body, projection) {
    if (body.hasRings) drawRingHalf(body, projection, 'back');
    drawSphere(body, projection);
    if (body.hasRings) drawRingHalf(body, projection, 'front');
  }

  function drawFrame(bodies) {
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    const projection = mat4Ortho(0, cssWidth, cssHeight, 0, -2000, 2000);
    bodies.forEach(body => drawBody(body, projection));
  }

  function clearToTransparent() {
    if (!gl) return;
    try {
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    } catch (err) {
      // Context is already unusable; nothing further to clean up here.
    }
  }

  // Draws one frame from an immutable list of visible-body views.
  // Returns true only when the frame drew successfully with every
  // body's texture ready; the caller (main.js) shows WebGL only on a
  // true return and otherwise keeps the 2D planet path active.
  function frame(bodies) {
    if (!ready || !gl || contextLost) return false;
    if (!allTexturesReady(bodies)) return false;
    try {
      drawFrame(bodies);
      everDrewFrame = true;
      return true;
    } catch (err) {
      clearToTransparent();
      return false;
    }
  }

  function isActive() {
    return ready && !!gl && !contextLost && everDrewFrame;
  }

  function dispose() {
    if (gl) {
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      canvas.removeEventListener('webglcontextrestored', handleContextRestored);
      const loseContext = gl.getExtension('WEBGL_lose_context');
      if (loseContext) loseContext.loseContext();
    }
    gl = null;
    ready = false;
    everDrewFrame = false;
  }

  return { resize, frame, isActive, dispose };
}
