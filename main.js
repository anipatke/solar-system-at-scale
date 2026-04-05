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
      smell:  'Like a giant oven mixed with sparklers',
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
      smell:  'Like hot metal and fireworks',
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
      smell:  'Like a nasty chemistry-lab stink',
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
      smell:  'Rain, ocean air, and forests',
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
      smell:  'Like dusty rocks and rusty metal',
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
      smell:  'Like a giant stinky egg storm',
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
      smell:  'Like cold, sharp cleaning spray',
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
      smell:  'Like the worst fart in the solar system',
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
      smell:  'Like a freezing swamp of weird gas',
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
      smell:  'Like freezer-burnt ice and cold dust',
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
const TRUE_SCALE_BASELINE_BODY_ID = 'pluto';

// ── MOON DATA ────────────────────────────────────────────────
// orbitalKm: distance from planet center (km)
// diameterKm: moon diameter (km)
// Moon systems are rendered as proportional multiples of the parent's radius.
// Tiny moons still get a minimum visible size.
const SUN_ACTUAL_R_KM = 695_700;
const TRUE_SCALE_BASELINE_RADIUS_KM = SIZE_RATIO_TO_SUN[TRUE_SCALE_BASELINE_BODY_ID] * SUN_ACTUAL_R_KM;
const TRUE_SCALE_PX_PER_KM = TRUE_SIZE_MIN_RADIUS / TRUE_SCALE_BASELINE_RADIUS_KM;
const TRUE_SCALE_PX_PER_AU = AU_KM * TRUE_SCALE_PX_PER_KM;

const MOONS = [
  // Earth
  { id: 'moon',     parentId: 'earth',   name: 'MOON',     orbitalKm: 384_400,   diameterKm: 3_474, color: '#B0BEC5', retrograde: false, orbitalPeriodDays: 27.32 },
  // Mars
  { id: 'phobos',   parentId: 'mars',    name: 'PHOBOS',   orbitalKm: 9_376,     diameterKm: 22,    color: '#8D6E63', retrograde: false, orbitalPeriodDays: 0.319 },
  { id: 'deimos',   parentId: 'mars',    name: 'DEIMOS',   orbitalKm: 23_458,    diameterKm: 12,    color: '#795548', retrograde: false, orbitalPeriodDays: 1.263 },
  // Jupiter — Galilean moons
  { id: 'io',       parentId: 'jupiter', name: 'IO',       orbitalKm: 421_700,   diameterKm: 3_643, color: '#F4CF47', retrograde: false, orbitalPeriodDays: 1.769 },
  { id: 'europa',   parentId: 'jupiter', name: 'EUROPA',   orbitalKm: 671_100,   diameterKm: 3_122, color: '#CFB99A', retrograde: false, orbitalPeriodDays: 3.551 },
  { id: 'ganymede', parentId: 'jupiter', name: 'GANYMEDE', orbitalKm: 1_070_400, diameterKm: 5_268, color: '#9E9E9E', retrograde: false, orbitalPeriodDays: 7.155 },
  { id: 'callisto', parentId: 'jupiter', name: 'CALLISTO', orbitalKm: 1_882_700, diameterKm: 4_821, color: '#616161', retrograde: false, orbitalPeriodDays: 16.69 },
  // Saturn
  { id: 'rhea',     parentId: 'saturn',  name: 'RHEA',     orbitalKm: 527_108,   diameterKm: 1_528, color: '#CFD8DC', retrograde: false, orbitalPeriodDays: 4.518 },
  { id: 'titan',    parentId: 'saturn',  name: 'TITAN',    orbitalKm: 1_221_870, diameterKm: 5_149, color: '#E8A84E', retrograde: false, orbitalPeriodDays: 15.95 },
  // Uranus
  { id: 'titania',  parentId: 'uranus',  name: 'TITANIA',  orbitalKm: 435_910,   diameterKm: 1_578, color: '#80DEEA', retrograde: false, orbitalPeriodDays: 8.706 },
  { id: 'oberon',   parentId: 'uranus',  name: 'OBERON',   orbitalKm: 583_520,   diameterKm: 1_523, color: '#4DD0E1', retrograde: false, orbitalPeriodDays: 13.46 },
  // Neptune
  { id: 'triton',   parentId: 'neptune', name: 'TRITON',   orbitalKm: 354_759,   diameterKm: 2_707, color: '#5C6BC0', retrograde: true,  orbitalPeriodDays: 5.877 },
  // Pluto
  { id: 'charon',   parentId: 'pluto',   name: 'CHARON',   orbitalKm: 19_591,    diameterKm: 1_212, color: '#A1887F', retrograde: false, orbitalPeriodDays: 6.387 },
];

// ── ASTEROID BELT ────────────────────────────────────────────
// Main belt: 2.2–3.2 AU from the Sun
const BELT_INNER_AU = 2.2;
const BELT_OUTER_AU = 3.2;
const ASTEROID_BELT = {
  id: 'asteroid-belt',
  name: 'ASTEROID BELT',
  symbol: '☄',
  type: 'BELT',
  distanceAU: (BELT_INNER_AU + BELT_OUTER_AU) / 2,
  facts: {
    size: 'Millions of rocky leftovers, from dust to dwarf-planet chunks',
    flight: '~30 years at cruising speed to the middle',
    smell: 'Like a smashed-up rock quarry in deep freeze',
  },
};

const PROBES = [
  {
    id: 'parker',
    name: 'PARKER SOLAR PROBE',
    symbol: '△',
    type: 'SOLAR PROBE',
    distanceAU: 0.09,
    facts: {
      size: 'About hatchback-length, but far flatter and wider',
      flight: 'Mission: study the Sun up close / Launched: August 12, 2018',
      smell: 'Overcaffeinated. Very hot. Still committed to the bit.',
    },
  },
  {
    id: 'solar-orbiter',
    name: 'SOLAR ORBITER',
    symbol: '◇',
    type: 'HELIOPHYSICS PROBE',
    distanceAU: 0.29,
    facts: {
      size: 'A bit wider than a hatchback once the solar arrays are counted',
      flight: 'Mission: image the Sun and heliosphere / Launched: February 10, 2020',
      smell: 'Busy, sunstruck, and trying to keep every instrument pointed right.',
    },
  },
  {
    id: 'osiris-apex',
    name: 'OSIRIS-APEX',
    symbol: '◆',
    type: 'ASTEROID MISSION',
    distanceAU: 0.50,
    facts: {
      size: 'Roughly hatchback-scale, with very non-hatchback solar wings',
      flight: 'Mission: retargeted from Bennu to Apophis / Launched: September 8, 2016',
      smell: 'Slightly smug. Already pulled off one asteroid job and wants another.',
    },
  },
  {
    id: 'juno',
    name: 'JUNO',
    symbol: '▴',
    type: 'JUPITER ORBITER',
    distanceAU: 5.203,
    facts: {
      size: 'Closer to SUV span than hatchback once the panels are out',
      flight: 'Mission: orbit and study Jupiter / Launched: August 5, 2011',
      smell: 'Icy, battered, and absolutely locked in on giant storms.',
    },
  },
];

// ── STATE ────────────────────────────────────────────────────
let cameraX = 0;           // current horizontal scroll offset in pixels
let targetCameraX = 0;     // smooth scroll target
let totalScrollPx = 0;     // total canvas width in pixels
let canvasW = 0;
let canvasH = 0;
let stars = [];
let rotations   = {};      // { planetId: angle }
let moonAngles  = {};      // { moonId: angle }
let beltParticles = [];    // asteroid belt dots
let activePlanet = null;   // currently shown in info panel
let activeProbes = [];
let displayMode = 'planets';
let isScaleLabCollapsed = false;
let introGone = false;
let closingShown = false;
let audioStarted = false;
let isMuted = false;
let lastFrameTime = 0;
let scrollIdleTimer = null;  // timer to detect scroll stop
let isSnapping = false;      // currently auto-centering a planet
let snappingTo  = null;      // which planet is being snapped to
let snapZoom    = 0;         // 0→1 animated zoom when locked onto a planet

// ── ELEMENTS ─────────────────────────────────────────────────
const canvas   = document.getElementById('space');
const ctx      = canvas.getContext('2d');
const intro    = document.getElementById('intro');
const infoPanel = document.getElementById('info-panel');
const infoPanelSecondary = document.getElementById('info-panel-secondary');
const closingCard = document.getElementById('closing-card');
const rulerNeedle = document.getElementById('ruler-needle');
const rulerKm  = document.getElementById('ruler-km');
const rulerLight = document.getElementById('ruler-light');
const rulerFocus = document.getElementById('ruler-focus');
const rulerPlanets = document.getElementById('ruler-planets');
const modePlanetsBtn = document.getElementById('mode-planets');
const modeProbesBtn = document.getElementById('mode-probes');
const scaleLab = document.getElementById('scale-lab');
const scaleLabTitle = document.getElementById('scale-lab-title');
const scaleLabBody = document.getElementById('scale-lab-body');
const scaleLabToggle = document.getElementById('scale-lab-toggle');
const scaleLabToggleLabel = document.getElementById('scale-lab-toggle-label');
const scaleLabFocusName = document.getElementById('scale-lab-focus-name');
const scaleLabFocusMeta = document.getElementById('scale-lab-focus-meta');
const scaleViewSplit = document.getElementById('scale-view-split');
const scaleSplitCopy = document.getElementById('scale-split-copy');
const scaleSplitReadableSize = document.getElementById('scale-split-readable-size');
const scaleSplitReadableSizeFill = document.getElementById('scale-split-readable-size-fill');
const scaleSplitReadableDistance = document.getElementById('scale-split-readable-distance');
const scaleSplitReadableDistanceFill = document.getElementById('scale-split-readable-distance-fill');
const scaleSplitTrueSize = document.getElementById('scale-split-true-size');
const scaleSplitTrueSizeFill = document.getElementById('scale-split-true-size-fill');
const scaleSplitTrueDistance = document.getElementById('scale-split-true-distance');
const scaleSplitTrueDistanceFill = document.getElementById('scale-split-true-distance-fill');
const scaleSplitSummary = document.getElementById('scale-split-summary');
const muteBtn  = document.getElementById('mute-btn');
const muteIcon = document.getElementById('mute-icon');
const audio    = document.getElementById('ambient');

// Info panel fields
const infoSymbol  = document.getElementById('info-symbol');
const infoName    = document.getElementById('info-name');
const infoType    = document.getElementById('info-type');
const factSize    = document.getElementById('fact-size');
const factFlight  = document.getElementById('fact-flight');
const factSmell   = document.getElementById('fact-smell');
const factIcon1   = document.getElementById('fact-icon-1');
const factIcon2   = document.getElementById('fact-icon-2');
const factIcon3   = document.getElementById('fact-icon-3');
const factLabel1  = document.getElementById('fact-label-1');
const factLabel2  = document.getElementById('fact-label-2');
const factLabel3  = document.getElementById('fact-label-3');

const info2Symbol  = document.getElementById('info2-symbol');
const info2Name    = document.getElementById('info2-name');
const info2Type    = document.getElementById('info2-type');
const info2FactSize   = document.getElementById('info2-fact-size');
const info2FactFlight = document.getElementById('info2-fact-flight');
const info2FactSmell  = document.getElementById('info2-fact-smell');
const info2FactIcon1  = document.getElementById('info2-fact-icon-1');
const info2FactIcon2  = document.getElementById('info2-fact-icon-2');
const info2FactIcon3  = document.getElementById('info2-fact-icon-3');
const info2FactLabel1 = document.getElementById('info2-fact-label-1');
const info2FactLabel2 = document.getElementById('info2-fact-label-2');
const info2FactLabel3 = document.getElementById('info2-fact-label-3');

// Closing card fields
const closeOortInner = document.getElementById('close-oort-inner');
const closeOortOuter = document.getElementById('close-oort-outer');
const closeProxima   = document.getElementById('close-proxima');
const closeNewHorizons = document.getElementById('close-new-horizons');

// ── INIT ─────────────────────────────────────────────────────
function init() {
  resize();
  buildStars();
  buildRulerNotches();
  initRotations();
  initMoonAngles();
  buildBelt();
  syncScaleLabCollapse();
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

function initMoonAngles() {
  MOONS.forEach(m => { moonAngles[m.id] = Math.random() * Math.PI * 2; });
}

function buildBelt() {
  beltParticles = [];
  for (let i = 0; i < 900; i++) {
    // Bias samples toward denser inner clusters so the belt reads as a region.
    const t = Math.pow(Math.random(), 1.55);
    const depth = Math.random();
    const cluster = Math.random();
    const sizeBase = Math.random();
    const isChunk = cluster > 0.92;
    const au = BELT_INNER_AU + t * (BELT_OUTER_AU - BELT_INNER_AU);
    beltParticles.push({
      worldX:   au * PIXELS_PER_AU,
      yFrac:    (Math.random() - 0.5) * (isChunk ? 1.2 : 1.8),
      size:     isChunk ? 1.4 + sizeBase * 2.2 : 0.35 + sizeBase * 1.35,
      opacity:  isChunk ? 0.45 + Math.random() * 0.3 : 0.08 + Math.random() * 0.32,
      depth,
    });
  }
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

function drawBelt() {
  const maxSpread = canvasH * 0.12;
  const centerY = canvasH / 2;
  const innerX = BELT_INNER_AU * PIXELS_PER_AU - cameraX + canvasW * 0.2;
  const outerX = BELT_OUTER_AU * PIXELS_PER_AU - cameraX + canvasW * 0.2;
  const bandLeft = Math.max(-canvasW * 0.2, innerX);
  const bandRight = Math.min(canvasW * 1.2, outerX);
  const bandWidth = bandRight - bandLeft;

  if (bandWidth > 0) {
    const haze = ctx.createLinearGradient(0, centerY - maxSpread, 0, centerY + maxSpread);
    haze.addColorStop(0, 'rgba(0,0,0,0)');
    haze.addColorStop(0.2, 'rgba(120,106,84,0.04)');
    haze.addColorStop(0.5, 'rgba(160,145,115,0.12)');
    haze.addColorStop(0.8, 'rgba(120,106,84,0.04)');
    haze.addColorStop(1, 'rgba(0,0,0,0)');

    ctx.fillStyle = haze;
    ctx.fillRect(bandLeft, centerY - maxSpread, bandWidth, maxSpread * 2);

    const coreGlow = ctx.createLinearGradient(0, centerY - maxSpread * 0.55, 0, centerY + maxSpread * 0.55);
    coreGlow.addColorStop(0, 'rgba(0,0,0,0)');
    coreGlow.addColorStop(0.5, 'rgba(177,161,223,0.045)');
    coreGlow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = coreGlow;
    ctx.fillRect(bandLeft, centerY - maxSpread * 0.55, bandWidth, maxSpread * 1.1);
  }

  beltParticles.forEach(p => {
    const sx = p.worldX - cameraX + canvasW * 0.2;
    if (sx < -8 || sx > canvasW + 8) return;
    const depthScale = 0.55 + (1 - p.depth) * 0.65;
    const sy = centerY + p.yFrac * maxSpread * depthScale;
    const r = Math.max(0.35, p.size * (0.8 + (1 - p.depth) * 0.45));
    const alpha = p.opacity * (0.75 + (1 - p.depth) * 0.35);

    if (r > 1.6) {
      const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, r * 3.6);
      glow.addColorStop(0, `rgba(188,170,132,${alpha * 0.32})`);
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.beginPath();
      ctx.arc(sx, sy, r * 3.6, 0, Math.PI * 2);
      ctx.fillStyle = glow;
      ctx.fill();
    }

    ctx.beginPath();
    ctx.arc(sx, sy, r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(176,160,126,${alpha})`;
    ctx.fill();
  });
}

function drawProbes() {
  const labelBaseY = canvasH * 0.22;

  PROBES.forEach((probe, index) => {
    const sx = getProbeVisualX(probe);
    if (sx < -120 || sx > canvasW + 120) return;

    const direction = index % 2 === 0 ? -1 : 1;
    const laneOffset = direction * (16 + Math.floor(index / 2) * 18);
    const labelY = labelBaseY + laneOffset;
    const markerY = canvasH * 0.41;
    const isActive = activeProbes.some(active => active.id === probe.id);

    ctx.save();

    if (isActive) {
      const glow = ctx.createRadialGradient(sx, markerY, 0, sx, markerY, 18);
      glow.addColorStop(0, 'rgba(164,198,57,0.22)');
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.beginPath();
      ctx.arc(sx, markerY, 18, 0, Math.PI * 2);
      ctx.fillStyle = glow;
      ctx.fill();
    }

    ctx.fillStyle = isActive ? '#CDE57A' : '#A4C639';
    ctx.fillRect(sx - 1, markerY - 4, 3, isActive ? 9 : 6);

    ctx.strokeStyle = isActive ? 'rgba(164,198,57,0.8)' : 'rgba(164,198,57,0.28)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(sx, markerY - 1);
    ctx.lineTo(sx + direction * 18, labelY + 4);
    ctx.stroke();

    ctx.font = isActive ? '700 10px "Space Mono"' : '400 9px "Space Mono"';
    ctx.textAlign = direction === -1 ? 'right' : 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = isActive ? '#F0E6DA' : 'rgba(240,230,218,0.78)';
    ctx.fillText(probe.name, sx + direction * 22, labelY);

    ctx.restore();
  });
}

function drawMoons(dt) {
  const yComp = 0.4;  // vertical compression for orbital perspective

  MOONS.forEach(moon => {
    const parent = PLANETS.find(p => p.id === moon.parentId);
    const parentX = planetScreenX(parent);
    const parentY = planetScreenY();
    const parentDisplayR = getDisplayRadius(parent, parentX);
    const parentVisualExtentR = getVisualExtentRadius(parent, parentX);
    const orbitTilt = (parent.tiltDeg * Math.PI) / 180;

    // Skip if parent planet is way off-screen (orbit ring + dot would be invisible anyway)
    if (parentX < -canvasW || parentX > canvasW * 2) return;

    // Advance orbital angle — 1 real second ≈ 1 simulated day
    const dir = moon.retrograde ? -1 : 1;
    moonAngles[moon.id] += dir * (2 * Math.PI) / moon.orbitalPeriodDays / 1000 * dt;

    const angle = moonAngles[moon.id];

    // Moon systems are local overlays around each parent, not literal positions
    // on the same horizontal scale as the planets.
    const orbitPx = getMoonOverlayOrbitRadius(parent, parentDisplayR, parentVisualExtentR, moon);

    // Moon display radius
    const moonDispR  = Math.max(0.8, (moon.diameterKm / 2) / SUN_ACTUAL_R_KM * (canvasH / 2));
    // Keep moon orbits comfortably outside the parent's visual footprint.
    // This is intentionally a presentation floor: the rendered planets are
    // exaggerated relative to distance scale, so strict non-overlap still
    // reads as "too close" for large bodies like Jupiter and Saturn.
    const orbitPaddingPx = Math.max(6, parentVisualExtentR * 0.18);
    const minVisibleOrbitPx = parentVisualExtentR + moonDispR + orbitPaddingPx;
    const visibleOrbitPx = Math.max(orbitPx, minVisibleOrbitPx);

    // Orbit ring (faint ellipse centered on parent)
    ctx.save();
    ctx.translate(parentX, parentY);
    ctx.rotate(orbitTilt);
    ctx.scale(1, yComp);
    ctx.beginPath();
    ctx.arc(0, 0, visibleOrbitPx, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(240,230,218,0.09)';
    ctx.lineWidth = 0.5;
    ctx.stroke();
    ctx.restore();

    // Moon dot
    const localMoonX = Math.cos(angle) * visibleOrbitPx;
    const localMoonY = Math.sin(angle) * visibleOrbitPx * yComp;
    const moonX = parentX + localMoonX * Math.cos(orbitTilt) - localMoonY * Math.sin(orbitTilt);
    const moonY = parentY + localMoonX * Math.sin(orbitTilt) + localMoonY * Math.cos(orbitTilt);
    ctx.beginPath();
    ctx.arc(moonX, moonY, Math.max(0.8, moonDispR), 0, Math.PI * 2);
    ctx.fillStyle = moon.color;
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

function probeScreenX(probe) {
  return probe.distanceAU * PIXELS_PER_AU - cameraX + canvasW * 0.2;
}

function getProbeVisualX(probe) {
  const trueX = probeScreenX(probe);
  if (probe.distanceAU > 0.8) return trueX;

  const sun = PLANETS[0];
  const sunX = planetScreenX(sun);
  const sunEdge = sunX + getVisualExtentRadius(sun, sunX);
  const innerProbes = PROBES
    .filter(item => item.distanceAU <= 0.8)
    .sort((a, b) => a.distanceAU - b.distanceAU);

  const minSeparation = 72;
  const baseX = Math.max(trueX, sunEdge + 28);
  let visualX = baseX;

  for (const item of innerProbes) {
    const itemTrueX = probeScreenX(item);
    visualX = Math.max(visualX, itemTrueX, sunEdge + 28);

    if (item.id === probe.id) {
      return visualX;
    }

    visualX += minSeparation;
  }

  return trueX;
}

function getInnerProbeTargets(centerX) {
  const innerProbes = PROBES
    .filter(probe => probe.distanceAU <= 0.8)
    .map(probe => ({ probe, x: getProbeVisualX(probe) }))
    .sort((a, b) => a.x - b.x);

  if (!innerProbes.length) return [];

  const clusterStart = innerProbes[0].x - 48;
  const clusterEnd = innerProbes[innerProbes.length - 1].x + 48;
  if (centerX < clusterStart || centerX > clusterEnd) return [];

  return innerProbes
    .map(item => ({ ...item, dist: Math.abs(item.x - centerX) }))
    .sort((a, b) => a.dist - b.dist)
    .slice(0, 2);
}

function getProbeFocusX() {
  const sun = PLANETS[0];
  const sunX = planetScreenX(sun);
  const sunEdge = sunX + getVisualExtentRadius(sun, sunX);
  return Math.max(canvasW * 0.34, sunEdge + 120);
}

function setPanelContent(panelEls, target, mode) {
  panelEls.symbol.textContent = target.symbol;
  panelEls.name.textContent = target.name;
  panelEls.type.textContent = target.type;
  panelEls.factSize.textContent = target.facts.size;
  panelEls.factFlight.textContent = target.facts.flight;
  panelEls.factSmell.textContent = target.facts.smell;

  if (mode === 'probes') {
    panelEls.icon1.textContent = '🚗';
    panelEls.icon2.textContent = '🛰️';
    panelEls.icon3.textContent = '💭';
    panelEls.label1.textContent = 'SIZE VS HATCHBACK';
    panelEls.label2.textContent = 'MISSION / LAUNCH DATE';
    panelEls.label3.textContent = "HOW'S IT FEELING";
    panelEls.panel.classList.add('probe-panel');
  } else {
    panelEls.icon1.textContent = '🌍';
    panelEls.icon2.textContent = '✈️';
    panelEls.icon3.textContent = '👃';
    panelEls.label1.textContent = 'SIZE';
    panelEls.label2.textContent = 'COMMERCIAL FLIGHT';
    panelEls.label3.textContent = 'SMELLS LIKE';
    panelEls.panel.classList.remove('probe-panel');
  }
}

function showInfoCards(targets, mode) {
  const primaryPanel = {
    panel: infoPanel,
    symbol: infoSymbol,
    name: infoName,
    type: infoType,
    factSize,
    factFlight,
    factSmell,
    icon1: factIcon1,
    icon2: factIcon2,
    icon3: factIcon3,
    label1: factLabel1,
    label2: factLabel2,
    label3: factLabel3,
  };
  const secondaryPanel = {
    panel: infoPanelSecondary,
    symbol: info2Symbol,
    name: info2Name,
    type: info2Type,
    factSize: info2FactSize,
    factFlight: info2FactFlight,
    factSmell: info2FactSmell,
    icon1: info2FactIcon1,
    icon2: info2FactIcon2,
    icon3: info2FactIcon3,
    label1: info2FactLabel1,
    label2: info2FactLabel2,
    label3: info2FactLabel3,
  };

  if (targets[0]) {
    setPanelContent(primaryPanel, targets[0], mode);
    infoPanel.classList.add('visible');
  } else {
    infoPanel.classList.remove('visible');
  }

  if (targets[1]) {
    setPanelContent(secondaryPanel, targets[1], mode);
    infoPanelSecondary.classList.add('visible');
  } else {
    infoPanelSecondary.classList.remove('visible');
  }
}

function getPlanetActualRadiusKm(planet) {
  return SIZE_RATIO_TO_SUN[planet.id] * SUN_ACTUAL_R_KM;
}

function getMoonOverlayOrbitRadius(parent, parentDisplayR, parentVisualExtentR, moon) {
  const parentActualRadiusKm = getPlanetActualRadiusKm(parent);
  const orbitMultiple = moon.orbitalKm / parentActualRadiusKm;
  const baseOffsetPx = parentVisualExtentR + Math.max(8, parentDisplayR * 0.35);
  const orbitStepPx = Math.max(6, parentDisplayR * 0.45);

  return baseOffsetPx + Math.log2(Math.max(1.1, orbitMultiple)) * orbitStepPx;
}

// ── RADIUS CALCULATION ────────────────────────────────────────
// Returns the rendered radius for the single true-size view.
function getRadius(planet) {
  // True size: Sun radius = canvasH / 2, everything else proportional
  const sunTrueR = canvasH / 2;
  return Math.max(
    TRUE_SIZE_MIN_RADIUS,
    sunTrueR * SIZE_RATIO_TO_SUN[planet.id]
  );
}

function getDisplayRadius(planet, screenX = planetScreenX(planet)) {
  const r = getRadius(planet);

  if (planet === snappingTo && planet.id !== 'sun' && snapZoom > 0.01) {
    return r * (1 + snapZoom * 0.8);
  }
  return r;
}

function getVisualExtentRadius(planet, screenX = planetScreenX(planet)) {
  const displayR = getDisplayRadius(planet, screenX);

  if (planet.hasRings) {
    return displayR * 2.2;
  }

  return displayR;
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

  const displayR = getDisplayRadius(planet, x);

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
    // Treat the spot as a feature on Jupiter's surface, not a moon orbiting the center.
    // As the planet rotates, the spot should slide across the visible disc and disappear
    // behind the limb rather than spin in a circle.
    const spotPhase = rot % (Math.PI * 2);
    const spotFrontness = Math.cos(spotPhase);

    if (spotFrontness > -0.15) {
      const spotX = Math.sin(spotPhase) * r * 0.72;
      const spotY = r * 0.08;
      const spotRx = r * 0.18 * Math.max(0.2, Math.abs(spotFrontness));
      const spotRy = r * 0.1;
      const spotAlpha = Math.max(0, spotFrontness) * 0.9;
      const spotGrad = ctx.createRadialGradient(spotX, spotY, 0, spotX, spotY, spotRx);

      spotGrad.addColorStop(0, `rgba(198,40,40,${spotAlpha})`);
      spotGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = spotGrad;
      ctx.beginPath();
      ctx.ellipse(spotX, spotY, spotRx, spotRy, 0, 0, Math.PI * 2);
      ctx.fill();
    }
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
  // Rings drawn in planet-local coords (translate already applied by caller).
  // Two passes: back half (behind planet body), then front half (in front).
  // Each ring is a proper annular arc — outer edge to inner edge, closed path.
  // Front rings are clipped to exclude the planet body, which in y-compressed
  // space maps to an ellipse with a=r, b=r/0.3.

  const ringDefs = [
    { inner: 1.35, outer: 1.65, color: planet.colors.ring1 },
    { inner: 1.7,  outer: 1.95, color: planet.colors.ring2 },
    { inner: 2.0,  outer: 2.2,  color: planet.colors.ring3 },
  ];

  ctx.save();
  ctx.rotate(tilt);
  ctx.scale(1, 0.3);   // flatten into perspective ellipse

  if (frontHalf) {
    // Clip to bottom half of space (y > 0), excluding the planet body.
    // In this y-scaled coord system the planet screen-circle (radius r) is
    // a tall ellipse: a_x = r, a_y = r / 0.3
    const clipBound = ringDefs[ringDefs.length - 1].outer * r * 2;
    ctx.save();
    ctx.beginPath();
    ctx.rect(-clipBound, 0, clipBound * 2, clipBound);   // bottom half
    ctx.ellipse(0, 0, r, r / 0.3, 0, 0, Math.PI * 2);   // planet body to subtract
    ctx.clip('evenodd');
  }

  ringDefs.forEach(ring => {
    const innerR = ring.inner * r;
    const outerR = ring.outer * r;
    ctx.beginPath();
    if (frontHalf) {
      // Bottom half (y > 0) — visually in front of planet
      ctx.arc(0, 0, outerR, 0, Math.PI, false);    // CW outer arc, bottom
      ctx.arc(0, 0, innerR, Math.PI, 0, true);     // CCW inner arc, bottom reversed
    } else {
      // Top half (y < 0) — visually behind planet
      ctx.arc(0, 0, outerR, Math.PI, 0, false);    // CW outer arc, top
      ctx.arc(0, 0, innerR, 0, Math.PI, true);     // CCW inner arc, top reversed
    }
    ctx.closePath();
    ctx.fillStyle = ring.color;
    ctx.fill();
  });

  if (frontHalf) ctx.restore();   // remove clip
  ctx.restore();                   // remove rotate + scale
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
  if (displayMode === 'probes') {
    const focusX = getProbeFocusX();
    const threshold = Math.max(120, canvasW * 0.12);
    const innerTargets = getInnerProbeTargets(focusX);
    const inRange = innerTargets.length
      ? innerTargets
      : PROBES
          .map(probe => {
            const visualX = getProbeVisualX(probe);
            return { probe, dist: Math.abs(visualX - focusX), x: visualX };
          })
          .filter(item => item.dist < threshold)
          .sort((a, b) => a.dist - b.dist)
          .slice(0, 2);

    if (inRange.length) {
      const orderedTargets = inRange
        .sort((a, b) => a.x - b.x)
        .map(item => item.probe);

      const changed = orderedTargets.length !== activeProbes.length
        || orderedTargets.some((probe, index) => activeProbes[index]?.id !== probe.id);

      if (changed) {
        activeProbes = orderedTargets;
        showInfoCards(orderedTargets, 'probes');
      }
    } else {
      activeProbes = [];
      hideInfoPanel();
    }
    activePlanet = null;
    return;
  }

  const cx = canvasW * 0.5;
  let nearest = null;
  let nearestDist = Infinity;

  [...PLANETS, ASTEROID_BELT].forEach(p => {
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
  showInfoCards([planet], 'planets');
}

function hideInfoPanel() {
  infoPanel.classList.remove('visible');
  infoPanelSecondary.classList.remove('visible');
}

// ── RULER HUD ────────────────────────────────────────────────
function getMaxCameraX() {
  return Math.max(0, totalScrollPx - canvasW * 0.6);
}

function getPlanetSnapCameraX(target) {
  const focusX = canvasW * 0.5;
  const sceneOffsetX = canvasW * 0.2;
  const snapTarget = target.distanceAU * PIXELS_PER_AU + sceneOffsetX - focusX;
  return Math.max(0, Math.min(snapTarget, getMaxCameraX()));
}

function getRulerPctForCameraX(cameraXValue) {
  const maxCameraX = getMaxCameraX();
  if (maxCameraX <= 0) return 0;
  return Math.max(0, Math.min(cameraXValue / maxCameraX, 1));
}

function buildRulerNotches() {
  rulerPlanets.innerHTML = '';
  [...PLANETS, ASTEROID_BELT].forEach(p => {
    const pct = getRulerPctForCameraX(getPlanetSnapCameraX(p));
    const notch = document.createElement('div');
    notch.className = 'ruler-notch planet-notch';
    notch.dataset.planetId = p.id;
    notch.style.left = `${pct * 100}%`;
    notch.innerHTML = `
      <div class="ruler-notch-tick" aria-hidden="true"></div>
    `;
    rulerPlanets.appendChild(notch);
  });

  PROBES.forEach(probe => {
    const pct = getRulerPctForCameraX(getPlanetSnapCameraX(probe));
    const notch = document.createElement('div');
    notch.className = 'ruler-notch probe-notch';
    notch.dataset.probeId = probe.id;
    notch.style.left = `${pct * 100}%`;
    notch.innerHTML = `
      <div class="ruler-notch-tick" aria-hidden="true"></div>
    `;
    rulerPlanets.appendChild(notch);
  });
}

function updateRuler() {
  const scrollFraction = getRulerPctForCameraX(cameraX);
  const currentAU = cameraX <= 0
    ? 0
    : Math.min(TOTAL_AU, (cameraX + canvasW * 0.3) / PIXELS_PER_AU);
  const currentKm = currentAU * AU_KM;
  const currentLM = currentKm / LIGHT_MINUTE_KM;

  rulerKm.textContent    = formatKm(currentKm) + ' FROM SUN';
  rulerLight.textContent = currentLM < 1
    ? `${(currentLM * 60).toFixed(1)} light-seconds`
    : `${currentLM.toFixed(2)} light-minutes`;

  const focusTarget = displayMode === 'probes' ? activeProbes[0] : activePlanet;
  rulerFocus.textContent = focusTarget ? focusTarget.name : 'DEEP SPACE';

  rulerPlanets.querySelectorAll('.planet-notch').forEach(notch => {
    const isActivePlanet = activePlanet && notch.dataset.planetId === activePlanet.id;
    notch.classList.toggle('active', displayMode === 'planets' && isActivePlanet);
    notch.classList.toggle('dimmed', displayMode === 'probes');
  });

  rulerPlanets.querySelectorAll('.probe-notch').forEach(notch => {
    const isActiveProbe = activeProbes.some(probe => notch.dataset.probeId === probe.id);
    notch.classList.toggle('active', displayMode === 'probes' && isActiveProbe);
    notch.classList.toggle('visible', displayMode === 'probes');
  });

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

function formatPixels(px) {
  if (px == null || !Number.isFinite(px)) return 'N/A';
  if (px < 10) return `${px.toFixed(2)} px`;
  if (px < 1000) return `${px.toFixed(1)} px`;
  return `${Math.round(px).toLocaleString()} px`;
}

function formatAu(au) {
  if (au < 1) return `${au.toFixed(2)} AU`;
  if (au < 100) return `${au.toFixed(1)} AU`;
  return `${Math.round(au).toLocaleString()} AU`;
}

function formatScreens(px) {
  const screens = px / Math.max(1, canvasW);
  if (screens < 10) return `${screens.toFixed(1)} screens`;
  if (screens < 1000) return `${Math.round(screens).toLocaleString()} screens`;
  return `${Math.round(screens).toLocaleString()} screens`;
}

function setMeterFill(el, value, max) {
  const pct = max > 0 ? Math.max(0, Math.min(value / max, 1)) : 0;
  el.style.width = `${pct * 100}%`;
}

function syncScaleLabCollapse() {
  const mobile = window.innerWidth <= 600;
  if (!mobile) {
    isScaleLabCollapsed = false;
  } else if (!scaleLab.dataset.mobileInitialized) {
    isScaleLabCollapsed = true;
    scaleLab.dataset.mobileInitialized = 'true';
  }

  scaleLab.classList.toggle('collapsed', isScaleLabCollapsed);
  scaleLabToggle.setAttribute('aria-expanded', String(!isScaleLabCollapsed));
  scaleLabToggleLabel.textContent = isScaleLabCollapsed ? 'SHOW' : 'HIDE';
}

function getScaleFocusTarget() {
  if (displayMode === 'probes') {
    if (activeProbes[0]) return activeProbes[0];

    const focusX = getProbeFocusX();
    let nearest = PROBES[0] || null;
    let nearestDist = Infinity;
    PROBES.forEach(probe => {
      const dist = Math.abs(getProbeVisualX(probe) - focusX);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = probe;
      }
    });
    return nearest;
  }

  if (activePlanet) return activePlanet;

  const cx = canvasW * 0.5;
  let nearest = PLANETS[0];
  let nearestDist = Infinity;
  [...PLANETS, ASTEROID_BELT].forEach(target => {
    const dist = Math.abs(planetScreenX(target) - cx);
    if (dist < nearestDist) {
      nearestDist = dist;
      nearest = target;
    }
  });
  return nearest;
}

function getTargetActualRadiusKm(target) {
  if (!target || SIZE_RATIO_TO_SUN[target.id] == null) return null;
  return SIZE_RATIO_TO_SUN[target.id] * SUN_ACTUAL_R_KM;
}

function getReadableDiameterPx(target) {
  if (!target || SIZE_RATIO_TO_SUN[target.id] == null) return null;
  return getDisplayRadius(target) * 2;
}

function getTrueDiameterPx(target) {
  const radiusKm = getTargetActualRadiusKm(target);
  return radiusKm == null ? null : radiusKm * TRUE_SCALE_PX_PER_KM * 2;
}

function getReadableDistancePx(target) {
  return target?.distanceAU == null ? null : target.distanceAU * PIXELS_PER_AU;
}

function getTrueDistancePx(target) {
  return target?.distanceAU == null ? null : target.distanceAU * TRUE_SCALE_PX_PER_AU;
}

function updateScaleLab() {
  const target = getScaleFocusTarget();
  if (!target) return;

  const readableDistancePx = getReadableDistancePx(target);
  const trueDistancePx = getTrueDistancePx(target);
  const readableDiameterPx = getReadableDiameterPx(target);
  const trueDiameterPx = getTrueDiameterPx(target);
  const sizeFactor = readableDiameterPx && trueDiameterPx
    ? readableDiameterPx / trueDiameterPx
    : null;
  const distanceFactor = TRUE_SCALE_PX_PER_AU / PIXELS_PER_AU;

  scaleLabFocusName.textContent = target.name;
  if (trueDiameterPx == null) {
    scaleLabFocusMeta.textContent = `${target.type} uses symbolic sizing here. Distance remains anchored to real AU values.`;
  } else {
    scaleLabFocusMeta.textContent = `If Pluto's radius is ${TRUE_SIZE_MIN_RADIUS}px, ${target.name} lands at ${formatPixels(trueDistancePx)} from the Sun.`;
  }

  const maxSize = Math.max(readableDiameterPx || 0, trueDiameterPx || 0, 1);
  const maxDistance = Math.max(readableDistancePx || 0, trueDistancePx || 0, 1);
  scaleLabTitle.textContent = 'Split View';
  scaleViewSplit.classList.add('active');
  scaleSplitCopy.textContent = `Same target, two systems. Left is the current readable composition. Right is one consistent physical scale using Pluto as the visibility floor.`;
  scaleSplitReadableSize.textContent = readableDiameterPx == null ? 'SYMBOLIC' : formatPixels(readableDiameterPx);
  scaleSplitTrueSize.textContent = trueDiameterPx == null ? 'N/A' : formatPixels(trueDiameterPx);
  scaleSplitReadableDistance.textContent = readableDistancePx == null
    ? 'N/A'
    : `${formatPixels(readableDistancePx)} / ${formatScreens(readableDistancePx)}`;
  scaleSplitTrueDistance.textContent = trueDistancePx == null
    ? 'N/A'
    : `${formatPixels(trueDistancePx)} / ${formatScreens(trueDistancePx)}`;
  setMeterFill(scaleSplitReadableSizeFill, readableDiameterPx || 0, maxSize);
  setMeterFill(scaleSplitTrueSizeFill, trueDiameterPx || 0, maxSize);
  setMeterFill(scaleSplitReadableDistanceFill, readableDistancePx || 0, maxDistance);
  setMeterFill(scaleSplitTrueDistanceFill, trueDistancePx || 0, maxDistance);

  if (sizeFactor == null) {
    scaleSplitSummary.textContent = `Distances are compressed by ${distanceFactor.toFixed(1)}x relative to this true scale. ${target.name} is a symbolic object here, so only the distance comparison is literal.`;
  } else if (sizeFactor >= 1) {
    scaleSplitSummary.textContent = `${target.name} is rendered about ${sizeFactor.toFixed(1)}x larger than this Pluto-anchored physical scale, while distances are compressed by ${distanceFactor.toFixed(1)}x.`;
  } else {
    scaleSplitSummary.textContent = `${target.name} is rendered at about ${(sizeFactor * 100).toFixed(0)}% of its Pluto-anchored physical size, while distances are compressed by ${distanceFactor.toFixed(1)}x.`;
  }
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
  const newHorizons = 65.5;

  closeOortInner.textContent = `~${scrollMultiple(oortInner).toLocaleString()}× this entire scroll`;
  closeOortOuter.textContent = `~${scrollMultiple(oortOuter).toLocaleString()}× this entire scroll`;
  closeProxima.textContent   = `~${scrollMultiple(proxima).toLocaleString()}× this entire scroll`;
  closeNewHorizons.textContent = `~${(newHorizons / journeyAU).toFixed(1)}× farther than Pluto`;
}

function checkClosingCard() {
  const plutoPx = PLANETS[PLANETS.length - 1].distanceAU * PIXELS_PER_AU;
  const plutoScreenX = plutoPx - cameraX + canvasW * 0.2;
  const pastPluto = plutoScreenX < canvasW * 0.1;
  if (pastPluto && !closingShown) {
    closingShown = true;
    closingCard.classList.add('visible');
  } else if (!pastPluto && closingShown) {
    closingShown = false;
    closingCard.classList.remove('visible');
  }
}

// ── SCROLL & TOUCH ───────────────────────────────────────────
const SCROLL_SENSITIVITY = 6.0;   // faster pan to cover the vast distances
const TOUCH_SENSITIVITY  = 4.0;
const LERP_SPEED         = 0.08;

let touchStartY    = 0;
let lastTouchY     = 0;
let touchStartX    = 0;
let lastTouchX     = 0;
let touchVelocity  = 0;    // px/frame momentum
let lastTouchTime  = 0;
let momentumRaf    = null;
let isMouseDragging = false;
let lastMouseX = 0;
let lastMouseY = 0;
let mouseVelocity = 0;
let lastMouseTime = 0;

function onWheel(e) {
  dismissIntro();
  e.preventDefault();
  targetCameraX += e.deltaY * SCROLL_SENSITIVITY;
  clampTarget();
  scheduleSnap();
}

function onTouchStart(e) {
  touchStartY   = e.touches[0].clientY;
  lastTouchY    = touchStartY;
  touchStartX   = e.touches[0].clientX;
  lastTouchX    = touchStartX;
  lastTouchTime = Date.now();
  touchVelocity = 0;
  clearTimeout(scrollIdleTimer);
  isSnapping = false;
  // Cancel any ongoing momentum
  if (momentumRaf) { cancelAnimationFrame(momentumRaf); momentumRaf = null; }
}

function onTouchMove(e) {
  dismissIntro();
  e.preventDefault();
  const now = Date.now();
  const dy = e.touches[0].clientY - lastTouchY;
  const dx = e.touches[0].clientX - lastTouchX;
  const dt = Math.max(1, now - lastTouchTime);
  // Combine vertical and horizontal — horizontal swipe left moves forward
  const delta = dy - dx;
  // Track velocity in px/ms
  touchVelocity = delta / dt;
  lastTouchY    = e.touches[0].clientY;
  lastTouchX    = e.touches[0].clientX;
  lastTouchTime = now;
  targetCameraX += delta * TOUCH_SENSITIVITY;
  clampTarget();
}

function onTouchEnd() {
  // Launch momentum scroll from flick velocity
  const initialVelocity = touchVelocity * TOUCH_SENSITIVITY * 16; // scale to px/frame at 60fps
  applyMomentum(initialVelocity);
}

function onMouseDown(e) {
  if (e.button !== 0) return;
  dismissIntro();
  isMouseDragging = true;
  lastMouseX = e.clientX;
  lastMouseY = e.clientY;
  lastMouseTime = Date.now();
  mouseVelocity = 0;
  clearTimeout(scrollIdleTimer);
  isSnapping = false;
  if (momentumRaf) { cancelAnimationFrame(momentumRaf); momentumRaf = null; }
  document.body.classList.add('dragging');
}

function onMouseMove(e) {
  if (!isMouseDragging) return;
  const now = Date.now();
  const dx = e.clientX - lastMouseX;
  const dy = e.clientY - lastMouseY;
  const dt = Math.max(1, now - lastMouseTime);
  const delta = dy - dx;
  mouseVelocity = delta / dt;
  lastMouseX = e.clientX;
  lastMouseY = e.clientY;
  lastMouseTime = now;
  targetCameraX += delta * TOUCH_SENSITIVITY;
  clampTarget();
}

function endMouseDrag() {
  if (!isMouseDragging) return;
  isMouseDragging = false;
  document.body.classList.remove('dragging');
  const initialVelocity = mouseVelocity * TOUCH_SENSITIVITY * 16;
  applyMomentum(initialVelocity);
}

function applyMomentum(velocity) {
  if (Math.abs(velocity) < 0.5) {
    // Velocity exhausted — now snap
    scheduleSnap();
    return;
  }
  targetCameraX += velocity;
  clampTarget();
  // Friction: reduce velocity each frame
  momentumRaf = requestAnimationFrame(() => applyMomentum(velocity * 0.92));
}

function clampTarget() {
  const maxScroll = getMaxCameraX();
  targetCameraX = Math.max(0, Math.min(targetCameraX, maxScroll));
}

function snapToNearestPlanet() {
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
  if (nearest && nearestDist < canvasW * 0.22) {
    targetCameraX = getPlanetSnapCameraX(nearest);
    isSnapping = true;
    snappingTo = nearest;
  }
}

function snapToNearestProbe() {
  const focusX = getProbeFocusX();
  let nearest = null;
  let nearestDist = Infinity;

  PROBES.forEach(probe => {
    const sx = getProbeVisualX(probe);
    const dist = Math.abs(sx - focusX);
    if (dist < nearestDist) {
      nearestDist = dist;
      nearest = probe;
    }
  });

  if (!nearest || nearestDist >= Math.max(120, canvasW * 0.12)) return;

  const targetVisualX = getProbeVisualX(nearest);
  const delta = targetVisualX - focusX;
  targetCameraX += delta;
  clampTarget();
  isSnapping = false;
  snappingTo = null;
}

function scheduleSnap() {
  clearTimeout(scrollIdleTimer);
  isSnapping = false;
  snappingTo = null;
  scrollIdleTimer = setTimeout(
    displayMode === 'probes' ? snapToNearestProbe : snapToNearestPlanet,
    350
  );
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
  audio.loop = true;
  audio.play().catch(() => {
    // Autoplay blocked — that's fine, user can unmute
  });
}

audio.addEventListener('ended', () => {
  audio.currentTime = 0;
  audio.play().catch(() => {});
});

muteBtn.addEventListener('click', () => {
  isMuted = !isMuted;
  audio.muted = isMuted;
  muteBtn.classList.toggle('muted', isMuted);
  muteIcon.textContent = isMuted ? '✕' : '♪';
  if (!audioStarted) tryStartAudio();
});

function setDisplayMode(mode) {
  displayMode = mode;
  activePlanet = null;
  activeProbes = [];
  hideInfoPanel();
  modePlanetsBtn.classList.toggle('active', mode === 'planets');
  modePlanetsBtn.setAttribute('aria-pressed', String(mode === 'planets'));
  modeProbesBtn.classList.toggle('active', mode === 'probes');
  modeProbesBtn.setAttribute('aria-pressed', String(mode === 'probes'));
}

modePlanetsBtn.addEventListener('click', () => setDisplayMode('planets'));
modeProbesBtn.addEventListener('click', () => setDisplayMode('probes'));
scaleLabToggle.addEventListener('click', () => {
  isScaleLabCollapsed = !isScaleLabCollapsed;
  if (window.innerWidth <= 600) {
    scaleLab.dataset.mobileInitialized = 'true';
  }
  syncScaleLabCollapse();
});

// ── MAIN LOOP ────────────────────────────────────────────────
function loop(ts) {
  const dt = Math.min(ts - lastFrameTime, 50);  // cap at 50ms
  lastFrameTime = ts;

  // Smooth camera
  cameraX += (targetCameraX - cameraX) * LERP_SPEED;

  // Animate snap zoom — eases in when locked, eases out when scrolling away
  snapZoom += ((isSnapping ? 1 : 0) - snapZoom) * 0.06;

  // Clear
  ctx.clearRect(0, 0, canvasW, canvasH);
  ctx.fillStyle = '#121212';
  ctx.fillRect(0, 0, canvasW, canvasH);

  // Draw stars
  drawStars(dt);

  // Asteroid belt (behind planets)
  drawBelt();

  // Draw planets
  PLANETS.forEach(p => drawPlanet(p, dt));

  // Draw moons (on top of planets so they're visible against planet bodies)
  drawMoons(dt);

  if (displayMode === 'probes') {
    drawProbes();
  }

  // Update HUD
  checkInfoPanel();
  updateRuler();
  updateScaleLab();
  checkClosingCard();

  requestAnimationFrame(loop);
}

// ── EVENT LISTENERS ──────────────────────────────────────────
window.addEventListener('resize', () => {
  resize();
  buildStars();
  buildRulerNotches();
  syncScaleLabCollapse();
});

window.addEventListener('wheel', onWheel, { passive: false });
window.addEventListener('mousedown', onMouseDown);
window.addEventListener('mousemove', onMouseMove);
window.addEventListener('mouseup', endMouseDrag);
window.addEventListener('mouseleave', endMouseDrag);
window.addEventListener('touchstart', onTouchStart, { passive: true });
window.addEventListener('touchmove', onTouchMove, { passive: false });
window.addEventListener('touchend',  onTouchEnd,  { passive: true });

// ── KICK OFF ─────────────────────────────────────────────────
init();
