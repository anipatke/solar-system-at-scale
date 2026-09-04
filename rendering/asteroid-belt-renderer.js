/* ============================================================
   ASTEROID BELT RENDERER
   Native WebGL layer for the sparse instanced asteroid belt.

   Owns: WebGL setup, up to four shared low-poly irregular rock
   meshes, the embedded shader program, instanced draw buffers,
   resize/DPR handling, and context-loss recovery.

   Does NOT own: camera position, the belt's AU boundaries, or how
   many rocks exist at a given viewport width. `main.js` computes a
   deterministic, seeded list of rock placements (world-space pixel
   position, depth, scale, spin) and hands it to `setInstances()`;
   this module only uploads it once and redraws it every frame from
   the current camera offset and elapsed time (ARCH-03).
   ============================================================ */

'use strict';

// ── SHARED GEOMETRY CONSTANTS ───────────────────────────────
const VARIANT_COUNT = 4;
const ROCK_JITTER_MIN = 0.62;
const ROCK_JITTER_MAX = 1.18;
const GL_DPR_CAP = 1.5;
const LIGHT_DIR = normalizeVec3([-0.35, -0.5, 0.8]);
const AMBIENT = 0.4;
const BASE_COLOR = [0.68, 0.62, 0.5]; // warm neutral rock tone, matches the 2D belt's rgba(176,160,126)
const DEPTH_RANGE_PX = 300;
const PARALLAX_STRENGTH = 0.15; // restrained: far rocks lag camera pan by at most 15%
const CULL_MARGIN_PX = 60;

// Regular icosahedron: 12 vertices, 20 triangular faces. Reused as the
// base topology for all four rock variants — only per-vertex radius
// jitter (seeded per variant) differs, so one shape family reads as a
// small reusable set rather than four unrelated models (STYLE-03).
const PHI = (1 + Math.sqrt(5)) / 2;
const ICOSA_VERTICES = [
  [-1, PHI, 0], [1, PHI, 0], [-1, -PHI, 0], [1, -PHI, 0],
  [0, -1, PHI], [0, 1, PHI], [0, -1, -PHI], [0, 1, -PHI],
  [PHI, 0, -1], [PHI, 0, 1], [-PHI, 0, -1], [-PHI, 0, 1],
];
const ICOSA_FACES = [
  [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
  [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
  [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
  [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1],
];

// ── EMBEDDED SHADERS ─────────────────────────────────────────
const ROCK_VERTEX_SRC = `
  attribute vec3 aPosition;
  attribute vec3 aNormal;
  attribute vec3 aInstPosition;  // worldX px, worldY px, depth 0..1
  attribute vec4 aInstParams;    // scale, baseRotation, spinSpeed, shade
  uniform mat4 uProjection;
  uniform float uCameraX;
  uniform float uTime;
  varying vec3 vNormal;
  varying float vShade;
  void main() {
    float angle = aInstParams.y + uTime * aInstParams.z;
    float c = cos(angle);
    float s = sin(angle);
    vec3 rotatedPos = vec3(
      aPosition.x * c + aPosition.z * s,
      aPosition.y,
      -aPosition.x * s + aPosition.z * c
    );
    vec3 rotatedNormal = vec3(
      aNormal.x * c + aNormal.z * s,
      aNormal.y,
      -aNormal.x * s + aNormal.z * c
    );
    float depth = aInstPosition.z;
    float parallax = 1.0 - depth * ${PARALLAX_STRENGTH.toFixed(3)};
    float screenX = aInstPosition.x - uCameraX * parallax;
    float screenZ = (depth - 0.5) * ${DEPTH_RANGE_PX.toFixed(1)};
    vNormal = rotatedNormal;
    vShade = aInstParams.w;
    vec3 worldPos = rotatedPos * aInstParams.x + vec3(screenX, aInstPosition.y, screenZ);
    gl_Position = uProjection * vec4(worldPos, 1.0);
  }
`;

const ROCK_FRAGMENT_SRC = `
  precision mediump float;
  varying vec3 vNormal;
  varying float vShade;
  uniform vec3 uLightDir;
  uniform float uAmbient;
  uniform vec3 uBaseColor;
  void main() {
    float diff = max(dot(normalize(vNormal), uLightDir), 0.0);
    vec3 color = uBaseColor * vShade * (uAmbient + (1.0 - uAmbient) * diff);
    gl_FragColor = vec4(color, 1.0);
  }
`;

// ── DETERMINISTIC PRNG ───────────────────────────────────────
// Small seeded generator so the four rock shapes are stable across
// reloads without pulling in a dependency (DEP-01, STYLE-05).
function mulberry32(seed) {
  let a = seed >>> 0;
  return function random() {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function normalizeVec3([x, y, z]) {
  const len = Math.hypot(x, y, z) || 1;
  return [x / len, y / len, z / len];
}

// ── GEOMETRY BUILDER ─────────────────────────────────────────
// Perturbs the shared icosahedron's vertex radii with a per-variant
// seed and flat-shades each face (duplicated verts, per-face normal)
// so the rock reads as faceted and irregular rather than a smooth
// sphere (Implementation Plan: "reusable low-poly rock geometry").
function buildRockVariant(seed) {
  const rand = mulberry32(seed);
  const verts = ICOSA_VERTICES.map(([x, y, z]) => {
    const len = Math.hypot(x, y, z);
    const jitter = ROCK_JITTER_MIN + rand() * (ROCK_JITTER_MAX - ROCK_JITTER_MIN);
    return [(x / len) * jitter, (y / len) * jitter, (z / len) * jitter];
  });

  const positions = [];
  const normals = [];
  ICOSA_FACES.forEach(([ia, ib, ic]) => {
    const a = verts[ia], b = verts[ib], c = verts[ic];
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
    const vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    const nlen = Math.hypot(nx, ny, nz) || 1;
    nx /= nlen; ny /= nlen; nz /= nlen;
    [a, b, c].forEach(p => {
      positions.push(p[0], p[1], p[2]);
      normals.push(nx, ny, nz);
    });
  });

  return { positions, normals, vertexCount: ICOSA_FACES.length * 3 };
}

// Combines all variants into one non-indexed geometry buffer and
// records each variant's [start, count] draw range.
function buildCombinedGeometry(seedBase) {
  const positions = [];
  const normals = [];
  const ranges = [];
  let cursor = 0;
  for (let v = 0; v < VARIANT_COUNT; v++) {
    const variant = buildRockVariant(seedBase + v * 7919);
    positions.push(...variant.positions);
    normals.push(...variant.normals);
    ranges.push({ start: cursor, count: variant.vertexCount });
    cursor += variant.vertexCount;
  }
  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    ranges,
  };
}

// ── MATRIX HELPERS (matches rendering/planet-renderer.js) ────
function mat4Identity() {
  return new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
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

function createBuffer(gl, target, data, usage) {
  const buffer = gl.createBuffer();
  gl.bindBuffer(target, buffer);
  gl.bufferData(target, data, usage);
  return buffer;
}

// Groups instances by variant and packs them into one interleaved
// Float32Array (7 floats/instance: x, y, depth, scale, baseRotation,
// spinSpeed, shade), recording each variant's contiguous [start,
// count] range within that array.
function packInstances(instances) {
  const byVariant = Array.from({ length: VARIANT_COUNT }, () => []);
  instances.forEach(inst => {
    const v = Math.min(VARIANT_COUNT - 1, Math.max(0, inst.variant | 0));
    byVariant[v].push(inst);
  });

  const stride = 7;
  const data = new Float32Array(instances.length * stride);
  const ranges = [];
  let cursor = 0;
  let minX = Infinity;
  let maxX = -Infinity;

  byVariant.forEach(group => {
    ranges.push({ start: cursor, count: group.length });
    group.forEach(inst => {
      const o = cursor * stride;
      data[o] = inst.x;
      data[o + 1] = inst.y;
      data[o + 2] = inst.depth;
      data[o + 3] = inst.scale;
      data[o + 4] = inst.baseRotation;
      data[o + 5] = inst.spinSpeed;
      data[o + 6] = inst.shade;
      cursor++;
      minX = Math.min(minX, inst.x);
      maxX = Math.max(maxX, inst.x);
    });
  });

  return {
    data,
    ranges,
    minX: instances.length ? minX : 0,
    maxX: instances.length ? maxX : 0,
  };
}

// ── RENDERER ─────────────────────────────────────────────────
export function createAsteroidBeltRenderer(canvas) {
  let gl = null;
  let ext = null; // ANGLE_instanced_arrays
  let program = null;
  let uniforms = null;
  let geometry = null;
  let geometryBuffers = null;
  let instanceBuffer = null;
  let instanceRanges = [];
  let instanceBoundsX = { min: 0, max: 0 };
  let lastInstances = [];
  let cssWidth = 0;
  let cssHeight = 0;
  let contextLost = false;
  let ready = false;
  let everDrewFrame = false;

  function getContext() {
    const opts = { alpha: true, antialias: true, premultipliedAlpha: true, depth: true };
    return canvas.getContext('webgl', opts) || canvas.getContext('experimental-webgl', opts);
  }

  function buildResources() {
    program = linkProgram(gl, ROCK_VERTEX_SRC, ROCK_FRAGMENT_SRC);
    uniforms = {
      projection: gl.getUniformLocation(program, 'uProjection'),
      cameraX: gl.getUniformLocation(program, 'uCameraX'),
      time: gl.getUniformLocation(program, 'uTime'),
      lightDir: gl.getUniformLocation(program, 'uLightDir'),
      ambient: gl.getUniformLocation(program, 'uAmbient'),
      baseColor: gl.getUniformLocation(program, 'uBaseColor'),
    };

    const attribs = {
      aPosition: gl.getAttribLocation(program, 'aPosition'),
      aNormal: gl.getAttribLocation(program, 'aNormal'),
      aInstPosition: gl.getAttribLocation(program, 'aInstPosition'),
      aInstParams: gl.getAttribLocation(program, 'aInstParams'),
    };

    geometry = buildCombinedGeometry(0x9E3779B1);
    geometryBuffers = {
      positionBuffer: createBuffer(gl, gl.ARRAY_BUFFER, geometry.positions, gl.STATIC_DRAW),
      normalBuffer: createBuffer(gl, gl.ARRAY_BUFFER, geometry.normals, gl.STATIC_DRAW),
      attribs,
    };

    // Re-upload the last known instance placement (if any) so context
    // restoration doesn't require main.js to call setInstances again.
    uploadInstances(lastInstances);
  }

  function uploadInstances(instances) {
    lastInstances = instances;
    const packed = packInstances(instances);
    instanceRanges = packed.ranges;
    instanceBoundsX = { min: packed.minX, max: packed.maxX };
    if (!gl) return;
    instanceBuffer = createBuffer(gl, gl.ARRAY_BUFFER, packed.data, gl.DYNAMIC_DRAW);
  }

  function setup() {
    gl = getContext();
    if (!gl) return false;
    ext = gl.getExtension('ANGLE_instanced_arrays');
    if (!ext) return false; // no instancing support — 2D fallback stays active (ARCH-02)

    buildResources();

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
      buildResources();
      gl.enable(gl.DEPTH_TEST);
      gl.enable(gl.BLEND);
      gl.blendFuncSeparate(gl.ONE, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      contextLost = false;
    } catch (err) {
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

  // Replaces the current rock placements. Instance buffers are only
  // (re)built here — once at startup and again on resize/budget
  // change — never inside the per-frame draw path (Implementation
  // Plan: "buffers are not recreated per frame").
  function setInstances(instances) {
    uploadInstances(instances || []);
  }

  function isOffscreen(cameraX) {
    if (!lastInstances.length) return true;
    const left = instanceBoundsX.min - cameraX - CULL_MARGIN_PX;
    const right = instanceBoundsX.max - cameraX + CULL_MARGIN_PX;
    return right < 0 || left > cssWidth;
  }

  function drawFrame(cameraX, timeSec) {
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    if (isOffscreen(cameraX)) return; // whole belt out of view — skip draw work (PERF-01)

    const projection = mat4Ortho(0, cssWidth, cssHeight, 0, -2000, 2000);
    const { aPosition, aNormal, aInstPosition, aInstParams } = geometryBuffers.attribs;
    const instanceStride = 7 * 4; // 7 floats, 4 bytes each

    gl.useProgram(program);
    gl.uniformMatrix4fv(uniforms.projection, false, projection);
    gl.uniform1f(uniforms.cameraX, cameraX);
    gl.uniform1f(uniforms.time, timeSec);
    gl.uniform3fv(uniforms.lightDir, LIGHT_DIR);
    gl.uniform1f(uniforms.ambient, AMBIENT);
    gl.uniform3fv(uniforms.baseColor, BASE_COLOR);

    gl.bindBuffer(gl.ARRAY_BUFFER, geometryBuffers.positionBuffer);
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, 0);
    ext.vertexAttribDivisorANGLE(aPosition, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, geometryBuffers.normalBuffer);
    gl.enableVertexAttribArray(aNormal);
    gl.vertexAttribPointer(aNormal, 3, gl.FLOAT, false, 0, 0);
    ext.vertexAttribDivisorANGLE(aNormal, 0);

    gl.enableVertexAttribArray(aInstPosition);
    ext.vertexAttribDivisorANGLE(aInstPosition, 1);
    gl.enableVertexAttribArray(aInstParams);
    ext.vertexAttribDivisorANGLE(aInstParams, 1);

    geometry.ranges.forEach((geomRange, variant) => {
      const instRange = instanceRanges[variant];
      if (!instRange || instRange.count === 0) return;

      gl.bindBuffer(gl.ARRAY_BUFFER, instanceBuffer);
      const byteOffset = instRange.start * instanceStride;
      gl.vertexAttribPointer(aInstPosition, 3, gl.FLOAT, false, instanceStride, byteOffset);
      gl.vertexAttribPointer(aInstParams, 4, gl.FLOAT, false, instanceStride, byteOffset + 3 * 4);

      gl.bindBuffer(gl.ARRAY_BUFFER, geometryBuffers.positionBuffer);
      gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, geomRange.start * 3 * 4);
      gl.bindBuffer(gl.ARRAY_BUFFER, geometryBuffers.normalBuffer);
      gl.vertexAttribPointer(aNormal, 3, gl.FLOAT, false, 0, geomRange.start * 3 * 4);

      ext.drawArraysInstancedANGLE(gl.TRIANGLES, 0, geomRange.count, instRange.count);
    });
  }

  // Draws one frame. Returns true whenever the GL pipeline ran without
  // error — including a whole-belt off-screen skip, which is a normal
  // outcome, not a failure — so main.js only falls back to the 2D
  // haze/dots on genuine setup or runtime failure (ARCH-02).
  function frame({ cameraX, timeSec }) {
    if (!ready || !gl || contextLost) return false;
    try {
      drawFrame(cameraX, timeSec);
      everDrewFrame = true;
      return true;
    } catch (err) {
      try {
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      } catch (clearErr) {
        // Context already unusable; nothing further to clean up.
      }
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

  return { resize, setInstances, frame, isActive, dispose };
}
