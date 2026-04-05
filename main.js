/* ============================================================
   SOLAR SYSTEM AT SCALE
   Vanilla JS + Canvas
   Atari-Noir / Vibe Lab — Vibe Purple accent
   ============================================================ */

'use strict';

// ── CONSTANTS ────────────────────────────────────────────────
const AU_KM = 149_597_870.7;   // 1 AU in km
const LIGHT_MINUTE_KM = 17_987_547.48;

// Scale: how many km = 1 canvas pixel for the DISTANCE axis.
// Pluto is ~39.5 AU. We want Pluto at ~90% of the scroll width.
// Total scroll canvas width is computed dynamically but we fix the
// distance-per-pixel ratio here. 1 AU = PIXELS_PER_AU px.
const PIXELS_PER_AU = 2000;   // 1 AU = 2000px → Pluto ~79 screen-widths away

// NAVIGABLE mode: exaggerated sizes so all planets are visible and interactive
const BASE_PLANET_RADIUS = {
  sun:     60,
  mercury: 9,
  venus:   17,
  earth:   18,
  mars:    12,
  jupiter: 38,
  saturn:  32,
  uranus:  22,
  neptune: 21,
  pluto:   7,
};

// TRUE SIZE mode: diameter ratios relative to the Sun's diameter (1.0 = Sun)
// Sun fills the full canvas height, everything else scales from that.
// Source: NASA planetary fact sheets.
const SIZE_RATIO_TO_SUN = {
  sun:     1.0,
  mercury: 0.00351,   // 4,879 km  / 1,391,000 km
  venus:   0.00870,   // 12,104 km
  earth:   0.00916,   // 12,742 km
  mars:    0.00487,   // 6,779 km
  jupiter: 0.10052,   // 139,820 km
  saturn:  0.08373,   // 116,460 km
  uranus:  0.03647,   // 50,724 km
  neptune: 0.03541,   // 49,244 km
  pluto:   0.00171,   // 2,377 km  — sub-pixel at most screen sizes
};

// Minimum rendered radius in true-size mode so sub-pixel planets stay visible
const TRUE_SIZE_MIN_RADIUS = 1.5;

// ── PLANET DATA ──────────────────────────────────────────────
const PLANETS = [
  {
    id: 'sun',
    name: 'THE SUN',
    symbol: '☀️',
    type: 'STAR',
    distanceAU: 0,
    tiltDeg: 7,
    retrograde: false,
    rotationSpeed: 0.003,
    facts: {
      size:   '1.3 million Earths fit inside',
      flight: '~19 years at cruising speed',
      smell:  'Burning plasma & ozone',
    },
    colors: {
      core:    '#FFF176',
      mid:     '#FFD54F',
      outer:   '#FF8F00',
      glow:    'rgba(255,200,50,0.18)',
    },
  },
  {
    id: 'mercury',
    name: 'MERCURY',
    symbol: '☿',
    type: 'PLANET',
    distanceAU: 0.387,
    tiltDeg: 0.03,
    retrograde: false,
    rotationSpeed: 0.004,
    small: true,
    facts: {
      size:   '18 Mercurys fit inside Earth',
      flight: '~9 years at cruising speed',
      smell:  'Sulfur & rotten eggs',
    },
    colors: {
      core:  '#9E9E9E',
      mid:   '#757575',
      outer: '#616161',
      glow:  'rgba(160,160,160,0.12)',
    },
  },
  {
    id: 'venus',
    name: 'VENUS',
    symbol: '♀',
    type: 'PLANET',
    distanceAU: 0.723,
    tiltDeg: 177,
    retrograde: true,
    rotationSpeed: 0.002,
    facts: {
      size:   'Nearly the same size as Earth',
      flight: '~5 years at cruising speed',
      smell:  'Pure sulfuric acid',
    },
    colors: {
      core:  '#F5DEB3',
      mid:   '#DEB887',
      outer: '#C4A35A',
      glow:  'rgba(220,180,100,0.14)',
    },
  },
  {
    id: 'earth',
    name: 'EARTH',
    symbol: '🌍',
    type: 'PLANET',
    distanceAU: 1.0,
    tiltDeg: 23.5,
    retrograde: false,
    rotationSpeed: 0.008,
    facts: {
      size:   'This is the reference. You are here.',
      flight: 'You\'re already here',
      smell:  'Petrichor, ocean & life',
    },
    colors: {
      core:  '#1565C0',
      mid:   '#2E7D32',
      outer: '#1A237E',
      glow:  'rgba(30,100,200,0.14)',
      land:  '#388E3C',
    },
  },
  {
    id: 'mars',
    name: 'MARS',
    symbol: '♂',
    type: 'PLANET',
    distanceAU: 1.524,
    tiltDeg: 25,
    retrograde: false,
    rotationSpeed: 0.007,
    small: true,
    facts: {
      size:   'About half the size of Earth',
      flight: '~10 years at cruising speed',
      smell:  'Burnt gunpowder & iron',
    },
    colors: {
      core:  '#BF360C',
      mid:   '#D84315',
      outer: '#8D2A00',
      glow:  'rgba(200,80,30,0.14)',
    },
  },
  {
    id: 'jupiter',
    name: 'JUPITER',
    symbol: '♃',
    type: 'PLANET',
    distanceAU: 5.203,
    tiltDeg: 3,
    retrograde: false,
    rotationSpeed: 0.018,   // fastest rotator
    facts: {
      size:   '1,321 Earths fit inside',
      flight: '~80 years at cruising speed',
      smell:  'Ammonia & rotten eggs',
    },
    colors: {
      core:   '#C8A96E',
      band1:  '#8D6E63',
      band2:  '#BCAAA4',
      band3:  '#A1887F',
      outer:  '#D7B87A',
      glow:   'rgba(200,170,100,0.14)',
    },
    banded: true,
  },
  {
    id: 'saturn',
    name: 'SATURN',
    symbol: '♄',
    type: 'PLANET',
    distanceAU: 9.537,
    tiltDeg: 27,
    retrograde: false,
    rotationSpeed: 0.014,
    facts: {
      size:   '764 Earths fit inside',
      flight: '~150 years at cruising speed',
      smell:  'Ammonia crystals',
    },
    colors: {
      core:   '#E8C97A',
      band1:  '#C4A35A',
      outer:  '#D4B060',
      ring1:  'rgba(210,180,100,0.6)',
      ring2:  'rgba(190,155,80,0.35)',
      ring3:  'rgba(160,130,60,0.2)',
      glow:   'rgba(220,180,100,0.13)',
    },
    banded: true,
    hasRings: true,
  },
  {
    id: 'uranus',
    name: 'URANUS',
    symbol: '♅',
    type: 'PLANET',
    distanceAU: 19.191,
    tiltDeg: 98,
    retrograde: false,
    rotationSpeed: 0.006,
    facts: {
      size:   '63 Earths fit inside',
      flight: '~340 years at cruising speed',
      smell:  'Hydrogen sulfide — yes, like farts',
    },
    colors: {
      core:  '#80DEEA',
      mid:   '#4DD0E1',
      outer: '#00ACC1',
      glow:  'rgba(80,210,220,0.13)',
    },
  },
  {
    id: 'neptune',
    name: 'NEPTUNE',
    symbol: '♆',
    type: 'PLANET',
    distanceAU: 30.069,
    tiltDeg: 28,
    retrograde: false,
    rotationSpeed: 0.007,
    facts: {
      size:   '57 Earths fit inside',
      flight: '~555 years at cruising speed',
      smell:  'Ammonia & methane ice',
    },
    colors: {
      core:  '#1A237E',
      mid:   '#283593',
      outer: '#0D47A1',
      glow:  'rgba(30,50,200,0.14)',
    },
  },
  {
    id: 'pluto',
    name: 'PLUTO',
    symbol: '⯓',
    type: 'PLANET',   // always and forever
    distanceAU: 39.482,
    tiltDeg: 122,
    retrograde: true,
    rotationSpeed: 0.002,
    small: true,
    facts: {
      size:   '170 Plutos fit inside Earth',
      flight: '~745 years at cruising speed',
      smell:  'Carbon monoxide & methane ice',
    },
    colors: {
      core:  '#8D6E63',
      mid:   '#795548',
      outer: '#5D4037',
      glow:  'rgba(140,110,90,0.12)',
    },
  },
];

// Total scroll distance in AU (Pluto + some breathing room)
const TOTAL_AU = PLANETS[PLANETS.length - 1].distanceAU + 4;

// ── STATE ────────────────────────────────────────────────────
let cameraX = 0;           // current horizontal scroll offset in pixels
let targetCameraX = 0;     // smooth scroll target
let totalScrollPx = 0;     // total canvas width in pixels
let canvasW = 0;
let canvasH = 0;
let stars = [];
let rotations = {};        // { planetId: angle }
let activePlanet = null;   // currently shown in info panel
let introGone = false;
let closingShown = false;
let audioStarted = false;
let isMuted = false;
let lastFrameTime = 0;
let scrollIdleTimer = null;  // timer to detect scroll stop
let isSnapping = false;      // currently auto-centering a planet
let trueSize = true;         // true = TRUE SIZE mode, false = NAVIGABLE
let modeTransition = 1.0;   // 0 = navigable, 1 = true size (lerps between)

// ── ELEMENTS ─────────────────────────────────────────────────
const canvas   = document.getElementById('space');
const ctx      = canvas.getContext('2d');
const intro    = document.getElementById('intro');
const infoPanel = document.getElementById('info-panel');
const closingCard = document.getElementById('closing-card');
const rulerNeedle = document.getElementById('ruler-needle');
const rulerKm  = document.getElementById('ruler-km');
const rulerLight = document.getElementById('ruler-light');
const rulerPlanets = document.getElementById('ruler-planets');
const muteBtn  = document.getElementById('mute-btn');
const modeBtn  = document.getElementById('mode-btn');
const modeLabel = document.getElementById('mode-label');
const modeSub   = document.getElementById('mode-sub');
const muteIcon = document.getElementById('mute-icon');
const audio    = document.getElementById('ambient');

// Info panel fields
const infoSymbol  = document.getElementById('info-symbol');
const infoName    = document.getElementById('info-name');
const infoType    = document.getElementById('info-type');
const factSize    = document.getElementById('fact-size');
const factFlight  = document.getElementById('fact-flight');
const factSmell   = document.getElementById('fact-smell');

// Closing card fields
const closeOortInner = document.getElementById('close-oort-inner');
const closeOortOuter = document.getElementById('close-oort-outer');
const closeProxima   = document.getElementById('close-proxima');

// ── INIT ─────────────────────────────────────────────────────
function init() {
  resize();
  buildStars();
  buildRulerNotches();
  initRotations();
  populateClosingCard();
  requestAnimationFrame(loop);
}

function resize() {
  canvasW = canvas.width  = window.innerWidth;
  canvasH = canvas.height = window.innerHeight;
  totalScrollPx = TOTAL_AU * PIXELS_PER_AU;
}

function initRotations() {
  PLANETS.forEach(p => { rotations[p.id] = 0; });
}

// ── STARS ────────────────────────────────────────────────────
function buildStars() {
  stars = [];
  const count = Math.floor((canvasW * canvasH) / 1200);
  for (let i = 0; i < count; i++) {
    stars.push({
      x:       Math.random(),   // stored as fraction of canvas so resize-stable
      y:       Math.random(),
      r:       Math.random() * 1.2 + 0.2,
      opacity: Math.random() * 0.6 + 0.15,
      twinkle: Math.random() * Math.PI * 2,
      speed:   Math.random() * 0.4 + 0.1,
      // parallax depth 0 (closest) to 1 (furthest, slowest)
      depth:   Math.random(),
    });
  }
}

function drawStars(dt) {
  stars.forEach(s => {
    s.twinkle += s.speed * dt * 0.001;
    const alpha = s.opacity * (0.7 + 0.3 * Math.sin(s.twinkle));
    // parallax: further stars scroll less
    const parallaxX = (cameraX * (1 - s.depth * 0.7)) % canvasW;
    const sx = ((s.x * canvasW) - parallaxX % canvasW + canvasW * 2) % canvasW;
    const sy = s.y * canvasH;
    ctx.beginPath();
    ctx.arc(sx, sy, s.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(240,230,218,${alpha})`;
    ctx.fill();
  });
}

// ── PLANET POSITIONS ─────────────────────────────────────────
function planetScreenX(planet) {
  return planet.distanceAU * PIXELS_PER_AU - cameraX + canvasW * 0.2;
}

function planetScreenY() {
  return canvasH * 0.5;
}

// ── RADIUS CALCULATION ────────────────────────────────────────
// Returns the interpolated display radius for the current mode transition.
function getRadius(planet) {
  const navigableR = BASE_PLANET_RADIUS[planet.id];

  // True size: Sun radius = canvasH / 2, everything else proportional
  const sunTrueR = canvasH / 2;
  const trueR = Math.max(
    TRUE_SIZE_MIN_RADIUS,
    sunTrueR * SIZE_RATIO_TO_SUN[planet.id]
  );

  // Lerp between navigable (t=0) and true size (t=1)
  return navigableR + (trueR - navigableR) * modeTransition;
}

// ── PIXEL-ART PLANET DRAWING ──────────────────────────────────
// We draw planets as slightly pixelated canvas shapes.
// imageSmoothingEnabled=false + explicit pixel grid gives the retro feel.

function drawPlanet(planet, dt) {
  const x = planetScreenX(planet);
  const y = planetScreenY();
  const r = getRadius(planet);

  // Off-screen culling (with margin for glow/rings)
  if (x < -r * 4 || x > canvasW + r * 4) return;

  // Advance rotation
  const dir = planet.retrograde ? -1 : 1;
  rotations[planet.id] += planet.rotationSpeed * dir * dt * 0.016;

  // Zoom emphasis for small planets — only in navigable mode
  let displayR = r;
  if (planet.small && modeTransition < 0.5) {
    const zoomStrength = 1 - modeTransition * 2;  // fades out as true size kicks in
    const dist = Math.abs(x - canvasW * 0.5);
    const zoomRange = canvasW * 0.3;
    if (dist < zoomRange) {
      const t = 1 - (dist / zoomRange);
      displayR = r * (1 + t * 1.2 * zoomStrength);
    }
  }

  const tilt = (planet.tiltDeg * Math.PI) / 180;
  const rot  = rotations[planet.id];

  ctx.save();
  ctx.translate(x, y);

  // Draw rings BEHIND planet for Saturn
  if (planet.hasRings) {
    drawSaturnRings(planet, displayR, tilt, false);
  }

  // Glow
  const glowR = displayR * 1.8;
  const glow = ctx.createRadialGradient(0, 0, displayR * 0.5, 0, 0, glowR);
  glow.addColorStop(0, planet.colors.glow || 'rgba(177,161,223,0.1)');
  glow.addColorStop(1, 'transparent');
  ctx.beginPath();
  ctx.arc(0, 0, glowR, 0, Math.PI * 2);
  ctx.fillStyle = glow;
  ctx.fill();

  // Planet body
  ctx.save();
  ctx.rotate(tilt);

  if (planet.id === 'sun') {
    drawSun(planet, displayR, rot, dt);
  } else if (planet.banded) {
    drawBandedPlanet(planet, displayR, rot);
  } else if (planet.id === 'earth') {
    drawEarth(planet, displayR, rot);
  } else {
    drawSimplePlanet(planet, displayR, rot);
  }

  ctx.restore();

  // Rings in FRONT of planet (front half)
  if (planet.hasRings) {
    drawSaturnRings(planet, displayR, tilt, true);
  }

  // Planet label
  drawPlanetLabel(planet, displayR);

  ctx.restore();
}

function drawSun(planet, r, rot, dt) {
  // Radial gradient sun
  const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
  grad.addColorStop(0,   planet.colors.core);
  grad.addColorStop(0.5, planet.colors.mid);
  grad.addColorStop(0.85,planet.colors.outer);
  grad.addColorStop(1,   'rgba(255,80,0,0)');

  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();

  // Corona rays — pixel-chunky
  ctx.save();
  ctx.rotate(rot);
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const len = r * (0.25 + 0.15 * Math.sin(rot * 3 + i));
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * r * 0.9, Math.sin(angle) * r * 0.9);
    ctx.lineTo(Math.cos(angle) * (r + len), Math.sin(angle) * (r + len));
    ctx.strokeStyle = 'rgba(255,220,80,0.4)';
    ctx.lineWidth = 3;
    ctx.stroke();
  }
  ctx.restore();
}

function drawSimplePlanet(planet, r, rot) {
  // Clip to circle
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.clip();

  // Base gradient
  const grad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 0, 0, 0, r);
  grad.addColorStop(0,   planet.colors.core);
  grad.addColorStop(0.6, planet.colors.mid);
  grad.addColorStop(1,   planet.colors.outer);
  ctx.fillStyle = grad;
  ctx.fillRect(-r, -r, r * 2, r * 2);

  // Pixel noise lines for texture (retro feel)
  ctx.globalAlpha = 0.12;
  const step = Math.max(3, Math.floor(r / 4));
  for (let row = -r; row < r; row += step) {
    ctx.fillStyle = row % (step * 2) === 0 ? '#fff' : '#000';
    ctx.fillRect(-r, row, r * 2, 1);
  }
  ctx.globalAlpha = 1;

  // Terminator (shadow on right side)
  const shadow = ctx.createLinearGradient(0, 0, r, 0);
  shadow.addColorStop(0,   'transparent');
  shadow.addColorStop(0.55,'transparent');
  shadow.addColorStop(1,   'rgba(0,0,0,0.65)');
  ctx.fillStyle = shadow;
  ctx.fillRect(-r, -r, r * 2, r * 2);

  ctx.restore();

  // Outline
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(240,230,218,0.06)';
  ctx.lineWidth = 1;
  ctx.stroke();
}

function drawEarth(planet, r, rot) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.clip();

  // Ocean base
  const ocean = ctx.createRadialGradient(-r*0.2, -r*0.2, 0, 0, 0, r);
  ocean.addColorStop(0,   '#1976D2');
  ocean.addColorStop(0.7, '#0D47A1');
  ocean.addColorStop(1,   '#0a2d6e');
  ctx.fillStyle = ocean;
  ctx.fillRect(-r, -r, r * 2, r * 2);

  // Land masses — chunky pixel blobs rotating with planet
  ctx.save();
  ctx.rotate(rot);
  ctx.fillStyle = '#2E7D32';
  const blobs = [
    [0.1, -0.2, 0.35, 0.55],  // americas-ish
    [0.4,  0.1, 0.4,  0.5 ],  // europe/africa-ish
    [0.5, -0.3, 0.3,  0.3 ],  // asia-ish
  ];
  blobs.forEach(([bx, by, bw, bh]) => {
    ctx.fillRect(
      (bx - 0.5) * r * 2,
      (by - 0.5) * r * 2,
      bw * r * 2,
      bh * r * 2
    );
  });
  ctx.restore();

  // Cloud layer
  ctx.globalAlpha = 0.25;
  ctx.fillStyle = '#fff';
  const clouds = [[-0.1, -0.4, 0.6, 0.15], [0.2, 0.3, 0.5, 0.12]];
  clouds.forEach(([cx, cy, cw, ch]) => {
    ctx.fillRect(cx * r * 2 - r, cy * r * 2 - r, cw * r, ch * r);
  });
  ctx.globalAlpha = 1;

  // Terminator
  const shadow = ctx.createLinearGradient(0, 0, r, 0);
  shadow.addColorStop(0,   'transparent');
  shadow.addColorStop(0.5, 'transparent');
  shadow.addColorStop(1,   'rgba(0,0,0,0.6)');
  ctx.fillStyle = shadow;
  ctx.fillRect(-r, -r, r * 2, r * 2);

  ctx.restore();

  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(100,180,255,0.1)';
  ctx.lineWidth = 1;
  ctx.stroke();
}

function drawBandedPlanet(planet, r, rot) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.clip();

  // Base
  ctx.fillStyle = planet.colors.core;
  ctx.fillRect(-r, -r, r * 2, r * 2);

  // Horizontal bands — shift with rotation
  const bands = planet.id === 'jupiter' ? [
    { y: -0.7, h: 0.15, color: planet.colors.band1 },
    { y: -0.4, h: 0.12, color: planet.colors.band2 },
    { y: -0.1, h: 0.25, color: planet.colors.band1 },
    { y:  0.25, h: 0.12, color: planet.colors.band3 },
    { y:  0.5, h: 0.2,  color: planet.colors.band2 },
  ] : [
    { y: -0.5, h: 0.12, color: planet.colors.band1 },
    { y:  0.1, h: 0.15, color: planet.colors.band1 },
    { y:  0.4, h: 0.1,  color: planet.colors.band1 },
  ];

  bands.forEach(b => {
    ctx.fillStyle = b.color;
    ctx.fillRect(-r, b.y * r * 2, r * 2, b.h * r * 2);
  });

  // Great Red Spot for Jupiter
  if (planet.id === 'jupiter') {
    ctx.save();
    ctx.rotate(rot);
    const spotGrad = ctx.createRadialGradient(r * 0.3, r * 0.08, 0, r * 0.3, r * 0.08, r * 0.18);
    spotGrad.addColorStop(0, '#C62828');
    spotGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = spotGrad;
    ctx.beginPath();
    ctx.ellipse(r * 0.3, r * 0.08, r * 0.18, r * 0.1, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Terminator
  const shadow = ctx.createLinearGradient(0, 0, r, 0);
  shadow.addColorStop(0,   'transparent');
  shadow.addColorStop(0.5, 'transparent');
  shadow.addColorStop(1,   'rgba(0,0,0,0.55)');
  ctx.fillStyle = shadow;
  ctx.fillRect(-r, -r, r * 2, r * 2);

  ctx.restore();

  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(240,230,218,0.05)';
  ctx.lineWidth = 1;
  ctx.stroke();
}

function drawSaturnRings(planet, r, tilt, frontHalf) {
  // Rings drawn in planet-local coords (after ctx.translate to planet center)
  // tilt is already applied by parent save/rotate

  const ringDefs = [
    { inner: 1.35, outer: 1.65, color: planet.colors.ring1 },
    { inner: 1.7,  outer: 1.95, color: planet.colors.ring2 },
    { inner: 2.0,  outer: 2.2,  color: planet.colors.ring3 },
  ];

  ctx.save();
  ctx.rotate(tilt);
  // Flatten rings into an ellipse (perspective)
  ctx.scale(1, 0.3);

  ringDefs.forEach(ring => {
    const innerR = ring.inner * r;
    const outerR = ring.outer * r;
    // Draw as annular arc
    ctx.beginPath();
    ctx.arc(0, 0, outerR, frontHalf ? Math.PI : 0, frontHalf ? Math.PI * 2 : Math.PI);
    ctx.arc(0, 0, innerR, frontHalf ? Math.PI : Math.PI, frontHalf ? 0 : 0, !frontHalf);
    ctx.closePath();
    ctx.fillStyle = ring.color;
    ctx.fill();
  });

  ctx.restore();
}

function drawPlanetLabel(planet, r) {
  ctx.save();
  ctx.font = '5px "Press Start 2P"';
  ctx.fillStyle = 'rgba(240,230,218,0.55)';
  ctx.textAlign = 'center';
  ctx.fillText(planet.name, 0, r + 14);
  ctx.restore();
}

// ── INFO PANEL ───────────────────────────────────────────────
let infoPanelCooldown = 0;

function checkInfoPanel() {
  const cx = canvasW * 0.5;
  let nearest = null;
  let nearestDist = Infinity;

  PLANETS.forEach(p => {
    const sx = planetScreenX(p);
    const dist = Math.abs(sx - cx);
    if (dist < nearestDist) {
      nearestDist = dist;
      nearest = p;
    }
  });

  const threshold = canvasW * 0.2;
  if (nearest && nearestDist < threshold) {
    if (nearest !== activePlanet) {
      activePlanet = nearest;
      showInfoPanel(nearest);
    }
  } else {
    if (activePlanet) {
      activePlanet = null;
      hideInfoPanel();
    }
  }
}

function showInfoPanel(planet) {
  infoSymbol.textContent  = planet.symbol;
  infoName.textContent    = planet.name;
  infoType.textContent    = planet.type;
  factSize.textContent    = planet.facts.size;
  factFlight.textContent  = planet.facts.flight;
  factSmell.textContent   = planet.facts.smell;
  infoPanel.classList.add('visible');
}

function hideInfoPanel() {
  infoPanel.classList.remove('visible');
}

// ── RULER HUD ────────────────────────────────────────────────
function buildRulerNotches() {
  rulerPlanets.innerHTML = '';
  PLANETS.forEach(p => {
    const pct = p.distanceAU / TOTAL_AU;
    const notch = document.createElement('div');
    notch.className = 'ruler-notch';
    notch.style.left = `${pct * 100}%`;
    notch.innerHTML = `
      <div class="ruler-notch-tick"></div>
      <div class="ruler-notch-label">${p.id.toUpperCase()}</div>
    `;
    rulerPlanets.appendChild(notch);
  });
}

function updateRuler() {
  // Current distance from Sun
  const scrollFraction = Math.max(0, cameraX) / totalScrollPx;
  const currentAU = scrollFraction * TOTAL_AU;
  const currentKm = currentAU * AU_KM;
  const currentLM = currentKm / LIGHT_MINUTE_KM;

  rulerKm.textContent    = formatKm(currentKm) + ' FROM SUN';
  rulerLight.textContent = currentLM < 1
    ? `${(currentLM * 60).toFixed(1)} light-seconds`
    : `${currentLM.toFixed(2)} light-minutes`;

  // Needle position
  const needlePct = Math.min(1, scrollFraction) * 100;
  rulerNeedle.style.left = `${needlePct}%`;
}

function formatKm(km) {
  if (km < 1_000) return `${Math.round(km).toLocaleString()} km`;
  if (km < 1_000_000) return `${(km / 1_000).toFixed(1)}k km`;
  if (km < 1_000_000_000) return `${(km / 1_000_000).toFixed(2)}M km`;
  return `${(km / 1_000_000_000).toFixed(2)}B km`;
}

// ── CLOSING CARD ─────────────────────────────────────────────
function populateClosingCard() {
  // At our scale: 1 AU = PIXELS_PER_AU px
  // Total scroll journey ≈ 39.5 AU
  const journeyAU = PLANETS[PLANETS.length - 1].distanceAU;

  function scrollMultiple(targetAU) {
    return Math.round(targetAU / journeyAU);
  }

  const oortInner  = 2_000;     // AU
  const oortOuter  = 100_000;   // AU
  const proxima    = 268_332;   // AU (4.24 ly)

  closeOortInner.textContent = `~${scrollMultiple(oortInner).toLocaleString()}× this entire scroll`;
  closeOortOuter.textContent = `~${scrollMultiple(oortOuter).toLocaleString()}× this entire scroll`;
  closeProxima.textContent   = `~${scrollMultiple(proxima).toLocaleString()}× this entire scroll`;
}

function checkClosingCard() {
  if (closingShown) return;
  // Show once we've scrolled fully past Pluto
  const plutoPx = PLANETS[PLANETS.length - 1].distanceAU * PIXELS_PER_AU;
  const plutoScreenX = plutoPx - cameraX + canvasW * 0.2;
  if (plutoScreenX < canvasW * 0.1) {
    closingShown = true;
    closingCard.classList.add('visible');
  }
}

// ── SCROLL & TOUCH ───────────────────────────────────────────
const SCROLL_SENSITIVITY = 6.0;   // faster pan to cover the vast distances
const TOUCH_SENSITIVITY  = 4.0;
const LERP_SPEED         = 0.08;

let touchStartY = 0;
let lastTouchY  = 0;

function onWheel(e) {
  if (closingShown) return;
  dismissIntro();
  e.preventDefault();
  targetCameraX += e.deltaY * SCROLL_SENSITIVITY;
  clampTarget();
  scheduleSnap();
}

function onTouchStart(e) {
  touchStartY = e.touches[0].clientY;
  lastTouchY  = touchStartY;
  clearTimeout(scrollIdleTimer);
  isSnapping = false;
}

function onTouchMove(e) {
  if (closingShown) return;
  dismissIntro();
  e.preventDefault();
  const dy = lastTouchY - e.touches[0].clientY;
  lastTouchY = e.touches[0].clientY;
  targetCameraX += dy * TOUCH_SENSITIVITY;
  clampTarget();
  scheduleSnap();
}

function clampTarget() {
  const maxScroll = totalScrollPx - canvasW * 0.6;
  targetCameraX = Math.max(0, Math.min(targetCameraX, maxScroll));
}

// Snap camera so a planet sits exactly at screen center
function snapToNearestPlanet() {
  if (closingShown) return;

  const cx = canvasW * 0.5;
  let nearest = null;
  let nearestDist = Infinity;

  PLANETS.forEach(p => {
    // Where would this planet be on screen at current targetCameraX?
    const sx = p.distanceAU * PIXELS_PER_AU - targetCameraX + canvasW * 0.2;
    const dist = Math.abs(sx - cx);
    if (dist < nearestDist) {
      nearestDist = dist;
      nearest = p;
    }
  });

  // Only snap if the nearest planet is within half a screen width of center
  if (nearest && nearestDist < canvasW * 0.5) {
    // targetCameraX that puts this planet at cx
    // sx = planet.distanceAU * PIXELS_PER_AU - targetCameraX + canvasW * 0.2 = cx
    // targetCameraX = planet.distanceAU * PIXELS_PER_AU + canvasW * 0.2 - cx
    const snapTarget = nearest.distanceAU * PIXELS_PER_AU + canvasW * 0.2 - cx;
    targetCameraX = Math.max(0, snapTarget);
    isSnapping = true;
  }
}

function scheduleSnap() {
  clearTimeout(scrollIdleTimer);
  isSnapping = false;
  scrollIdleTimer = setTimeout(snapToNearestPlanet, 350);
}

function dismissIntro() {
  if (!introGone) {
    introGone = true;
    intro.classList.add('hidden');
    tryStartAudio();
  }
}

// ── AUDIO ────────────────────────────────────────────────────
function tryStartAudio() {
  if (audioStarted) return;
  audioStarted = true;
  audio.volume = 0.18;
  audio.play().catch(() => {
    // Autoplay blocked — that's fine, user can unmute
  });
}

muteBtn.addEventListener('click', () => {
  isMuted = !isMuted;
  audio.muted = isMuted;
  muteBtn.classList.toggle('muted', isMuted);
  muteIcon.textContent = isMuted ? '✕' : '♪';
  if (!audioStarted) tryStartAudio();
});

modeBtn.addEventListener('click', () => {
  trueSize = !trueSize;
  modeLabel.textContent = trueSize ? 'TRUE SIZE' : 'NAVIGABLE';
  modeSub.textContent   = trueSize ? 'SWITCH TO NAVIGABLE' : 'SWITCH TO TRUE SIZE';
});

// ── MAIN LOOP ────────────────────────────────────────────────
function loop(ts) {
  const dt = Math.min(ts - lastFrameTime, 50);  // cap at 50ms
  lastFrameTime = ts;

  // Smooth camera
  cameraX += (targetCameraX - cameraX) * LERP_SPEED;

  // Animate mode transition (0 = navigable, 1 = true size)
  const targetMode = trueSize ? 1.0 : 0.0;
  modeTransition += (targetMode - modeTransition) * 0.06;

  // Clear
  ctx.clearRect(0, 0, canvasW, canvasH);
  ctx.fillStyle = '#121212';
  ctx.fillRect(0, 0, canvasW, canvasH);

  // Draw stars
  drawStars(dt);

  // Draw planets
  PLANETS.forEach(p => drawPlanet(p, dt));

  // Update HUD
  updateRuler();
  checkInfoPanel();
  checkClosingCard();

  requestAnimationFrame(loop);
}

// ── EVENT LISTENERS ──────────────────────────────────────────
window.addEventListener('resize', () => {
  resize();
  buildStars();
  buildRulerNotches();
});

window.addEventListener('wheel', onWheel, { passive: false });
window.addEventListener('touchstart', onTouchStart, { passive: true });
window.addEventListener('touchmove', onTouchMove, { passive: false });

// ── KICK OFF ─────────────────────────────────────────────────
init();
