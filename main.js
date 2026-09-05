/* ============================================================
   SOLAR SYSTEM AT SCALE
   Vanilla JS + Canvas
   Atari-Noir / Vibe Lab — Vibe Purple accent
   ============================================================ */

'use strict';

import { createPlanetRenderer } from './rendering/planet-renderer.js';
import { createAsteroidBeltRenderer } from './rendering/asteroid-belt-renderer.js';

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

// A11Y-02: prefers-reduced-motion freezes decorative planet spin (both the
// WebGL sphere texture rotation and the 2D fallback's rotation-driven detail
// like the Sun's corona rays and Jupiter's Great Red Spot) without touching
// camera travel, focus snapping, or information display.
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

// One shared, documented scale factor (SCALE-03) converts each body's real
// sidereal rotation period (hours, magnitude only — direction is the
// separate `retrograde` flag) into its visual rotationSpeed, replacing the
// prior independently hand-tuned constants. The factor is calibrated so
// Jupiter — the fastest real rotator — keeps its prior top-end visual pace
// (old Jupiter rotationSpeed 0.018 * its 9.925h period); every other body's
// speed then follows in direct proportion to its real period, so relative
// ordering (e.g. Jupiter/Saturn fast, Mercury/Venus slow) matches reality.
// Source: NASA Planetary Fact Sheet, https://nssdc.gsfc.nasa.gov/planetary/factsheet/
const ROTATION_SPEED_SCALE = 0.018 * 9.925;

function getRotationSpeedFromPeriod(periodHours) {
  return ROTATION_SPEED_SCALE / periodHours;
}

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
    rotationPeriodHours: 609.12,   // 25.38 days, equatorial
    facts: {
      size:      '1.3 million Earths fit inside',
      distance: '~19 years at cruising speed',
      smellsLike: 'Ozone and static — assuming smell could survive getting anywhere close',
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
    rotationPeriodHours: 1407.6,   // 58.65 days
    small: true,
    facts: {
      size:      '18 Mercurys fit inside Earth',
      distance: '~9 years at cruising speed',
      smellsLike: 'Sun-scorched metal on one side, freezer-locked rock on the other',
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
    rotationPeriodHours: 5832.5,   // 243.02 days, retrograde
    facts: {
      size:      'Nearly the same size as Earth',
      distance: '~5 years at cruising speed',
      smellsLike: 'Sulfuric acid clouds that never quite reach the ground',
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
    rotationPeriodHours: 23.9345,
    facts: {
      size:      'This is the reference. You are here.',
      distance: 'You\'re already here',
      smellsLike: 'Rain, ozone, and cut grass — the only stop that smells like home',
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
    rotationPeriodHours: 24.6229,
    small: true,
    facts: {
      size:      'About half the size of Earth',
      distance: '~10 years at cruising speed',
      smellsLike: 'Rusted iron and fine dust that gets into absolutely everything',
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
    rotationPeriodHours: 9.925,   // fastest real rotator
    facts: {
      size:      '1,321 Earths fit inside',
      distance: '~80 years at cruising speed',
      smellsLike: 'Ammonia and rotten eggs, churning at hurricane speed forever',
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
    rotationPeriodHours: 10.656,
    facts: {
      size:      '764 Earths fit inside',
      distance: '~150 years at cruising speed',
      smellsLike: 'Cold ammonia ice with a faint whiff of showing off — it has rings',
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
    retrograde: true,   // corrected: NASA lists a negative (retrograde) rotation period, consistent with its >90° tilt
    rotationPeriodHours: 17.24,
    facts: {
      size:      '63 Earths fit inside',
      distance: '~340 years at cruising speed',
      smellsLike: 'Rotten eggs, but frozen solid and tipped on its side',
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
    rotationPeriodHours: 16.11,
    facts: {
      size:      '57 Earths fit inside',
      distance: '~555 years at cruising speed',
      smellsLike: 'Frozen methane with a chill that goes all the way through',
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
    rotationPeriodHours: 153.3,   // 6.3872 days, retrograde
    small: true,
    facts: {
      size:      '170 Plutos fit inside Earth',
      distance: '~745 years at cruising speed',
      smellsLike: 'Frozen nitrogen and old ice, patient after 4.5 billion years',
    },
    colors: {
      core:  '#8D6E63',
      mid:   '#795548',
      outer: '#5D4037',
      glow:  'rgba(140,110,90,0.12)',
    },
  },
];

// Derive each planet's visual rotationSpeed from its real rotationPeriodHours
// via the one shared scale factor above (SCALE-03) — no per-planet tuning.
PLANETS.forEach(planet => {
  planet.rotationSpeed = getRotationSpeedFromPeriod(planet.rotationPeriodHours);
});

// Total scroll distance in AU (Pluto + some breathing room)
const TOTAL_AU = PLANETS[PLANETS.length - 1].distanceAU + 4;
const TRUE_SCALE_BASELINE_BODY_ID = 'pluto';

// ── MOON DATA ────────────────────────────────────────────────
// orbitalKm: distance from planet center (km)
// diameterKm: moon diameter (km)
// Distances and periods are rounded from NASA/JPL mean elements and NASA
// moon fact pages. The visual model keeps the relative ordering and cadence
// but still compresses the systems enough to stay readable.
const SUN_ACTUAL_R_KM = 695_700;
const TRUE_SCALE_BASELINE_RADIUS_KM = SIZE_RATIO_TO_SUN[TRUE_SCALE_BASELINE_BODY_ID] * SUN_ACTUAL_R_KM;
const TRUE_SCALE_PX_PER_KM = TRUE_SIZE_MIN_RADIUS / TRUE_SCALE_BASELINE_RADIUS_KM;
const TRUE_SCALE_PX_PER_AU = AU_KM * TRUE_SCALE_PX_PER_KM;

const MOONS = [
  // Earth
  { id: 'moon',     parentId: 'earth',   name: 'MOON',     orbitalKm: 384_400,   diameterKm: 3_474, color: '#B0BEC5', retrograde: false, orbitalPeriodDays: 27.322 },
  // Mars
  { id: 'phobos',   parentId: 'mars',    name: 'PHOBOS',   orbitalKm: 9_375,     diameterKm: 23,    color: '#8D6E63', retrograde: false, orbitalPeriodDays: 0.3187 },
  { id: 'deimos',   parentId: 'mars',    name: 'DEIMOS',   orbitalKm: 23_457,    diameterKm: 13,    color: '#795548', retrograde: false, orbitalPeriodDays: 1.2625 },
  // Jupiter — the best-known moons, plus one outer family member
  { id: 'io',       parentId: 'jupiter', name: 'IO',       orbitalKm: 421_800,   diameterKm: 3_643, color: '#F4CF47', retrograde: false, orbitalPeriodDays: 1.762732 },
  { id: 'europa',   parentId: 'jupiter', name: 'EUROPA',   orbitalKm: 671_100,   diameterKm: 3_122, color: '#CFB99A', retrograde: false, orbitalPeriodDays: 3.525463 },
  { id: 'ganymede', parentId: 'jupiter', name: 'GANYMEDE', orbitalKm: 1_070_400, diameterKm: 5_268, color: '#9E9E9E', retrograde: false, orbitalPeriodDays: 7.155588 },
  { id: 'callisto', parentId: 'jupiter', name: 'CALLISTO', orbitalKm: 1_882_700, diameterKm: 4_821, color: '#616161', retrograde: false, orbitalPeriodDays: 16.690440 },
  { id: 'amalthea', parentId: 'jupiter', name: 'AMALTHEA', orbitalKm: 181_400,   diameterKm: 167,   color: '#BCAAA4', retrograde: false, orbitalPeriodDays: 0.499918 },
  { id: 'himalia',  parentId: 'jupiter', name: 'HIMALIA',  orbitalKm: 11_439_000, diameterKm: 170,   color: '#8D8D8D', retrograde: false, orbitalPeriodDays: 249.9090 },
  // Saturn — a compact set of the most recognizable moons
  { id: 'mimas',    parentId: 'saturn',   name: 'MIMAS',    orbitalKm: 186_000,   diameterKm: 396,   color: '#E0E0E0', retrograde: false, orbitalPeriodDays: 0.942422 },
  { id: 'enceladus',parentId: 'saturn',   name: 'ENCELADUS',orbitalKm: 238_400,   diameterKm: 504,   color: '#F5F5F5', retrograde: false, orbitalPeriodDays: 1.370218 },
  { id: 'tethys',   parentId: 'saturn',   name: 'TETHYS',   orbitalKm: 295_000,   diameterKm: 1_062, color: '#CFD8DC', retrograde: false, orbitalPeriodDays: 1.887802 },
  { id: 'dione',    parentId: 'saturn',   name: 'DIONE',    orbitalKm: 377_700,   diameterKm: 1_123, color: '#BDBDBD', retrograde: false, orbitalPeriodDays: 2.736916 },
  { id: 'rhea',     parentId: 'saturn',   name: 'RHEA',     orbitalKm: 527_200,   diameterKm: 1_527, color: '#CFD8DC', retrograde: false, orbitalPeriodDays: 4.517503 },
  { id: 'titan',    parentId: 'saturn',   name: 'TITAN',    orbitalKm: 1_221_900, diameterKm: 5_150, color: '#E8A84E', retrograde: false, orbitalPeriodDays: 15.945448 },
  { id: 'iapetus',  parentId: 'saturn',   name: 'IAPETUS',  orbitalKm: 3_561_700, diameterKm: 1_460, color: '#A1887F', retrograde: false, orbitalPeriodDays: 79.331002 },
  // Uranus
  { id: 'miranda',  parentId: 'uranus',   name: 'MIRANDA',  orbitalKm: 129_846,   diameterKm: 472,   color: '#90A4AE', retrograde: false, orbitalPeriodDays: 1.413479 },
  { id: 'ariel',    parentId: 'uranus',   name: 'ARIEL',    orbitalKm: 190_929,   diameterKm: 1_158, color: '#80DEEA', retrograde: false, orbitalPeriodDays: 2.520379 },
  { id: 'umbriel',  parentId: 'uranus',   name: 'UMBRIEL',  orbitalKm: 265_986,   diameterKm: 1_172, color: '#4FC3F7', retrograde: false, orbitalPeriodDays: 4.144177 },
  { id: 'titania',  parentId: 'uranus',   name: 'TITANIA',  orbitalKm: 436_298,   diameterKm: 1_580, color: '#80DEEA', retrograde: false, orbitalPeriodDays: 8.705869 },
  { id: 'oberon',   parentId: 'uranus',   name: 'OBERON',   orbitalKm: 583_511,   diameterKm: 1_524, color: '#4DD0E1', retrograde: false, orbitalPeriodDays: 13.463237 },
  // Neptune
  { id: 'triton',   parentId: 'neptune',  name: 'TRITON',   orbitalKm: 354_800,   diameterKm: 2_706, color: '#5C6BC0', retrograde: true,  orbitalPeriodDays: 5.876994 },
  { id: 'nereid',   parentId: 'neptune',  name: 'NEREID',   orbitalKm: 5_513_900, diameterKm: 340,   color: '#7986CB', retrograde: false, orbitalPeriodDays: 360.133039 },
  { id: 'proteus',  parentId: 'neptune',  name: 'PROTEUS',  orbitalKm: 117_600,   diameterKm: 420,   color: '#5C6BC0', retrograde: false, orbitalPeriodDays: 1.122315 },
  // Pluto
  { id: 'charon',   parentId: 'pluto',   name: 'CHARON',   orbitalKm: 19_600,    diameterKm: 1_212, color: '#A1887F', retrograde: false, orbitalPeriodDays: 6.387222 },
];

// One shared visual-period calculation for every moon (STYLE-03): 24 visual
// seconds per real orbital day, bounded to [MIN, MAX] (D004). The floor keeps
// the fastest inner moons (e.g. Phobos, Amalthea, Mimas — all under one real
// day) distinguishable from a dead stop instead of all reading as instant.
// The ceiling keeps the slowest outer moons (Iapetus, Himalia, Nereid — real
// periods of 79-360 days) from becoming visually static for the length of a
// normal viewing session; 420s is chosen to exactly preserve the ordering and
// pacing this project already had audited for every other moon (T003's prior
// roster topped out at Callisto's ~400.6s, unaffected by this ceiling). This
// is a disclosed compression, not a literal orbital simulation: strictly
// between the bounds, relative speed differences stay intact and faster
// movers remain visibly faster than slower ones (SCALE-02).
const MOON_VISUAL_SECONDS_PER_ORBITAL_DAY = 24;
const MOON_MIN_VISUAL_ORBIT_SEC = 24;
const MOON_MAX_VISUAL_ORBIT_SEC = 420;

function getMoonVisualPeriodSec(moon) {
  const raw = moon.orbitalPeriodDays * MOON_VISUAL_SECONDS_PER_ORBITAL_DAY;
  return Math.min(MOON_MAX_VISUAL_ORBIT_SEC, Math.max(MOON_MIN_VISUAL_ORBIT_SEC, raw));
}

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
    distance: '~30 years at cruising speed to the middle',
    smellsLike: 'Metal dust and old rock, spread thin enough that smell barely applies',
  },
};

// A single named landmark for restrained orientation inside the belt.
// Deliberately not part of PLANETS/PROBES: it must never gain a focus
// snap, info card, or navigation mode (E03 T002 AC1), only a label.
const CERES = {
  id: 'ceres',
  name: 'CERES',
  distanceAU: 2.77,
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
      distance: 'Mission: study the Sun up close / Launched: August 12, 2018',
      smellsLike: 'Overcaffeinated. Very hot. Still committed to the bit.',
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
      distance: 'Mission: image the Sun and heliosphere / Launched: February 10, 2020',
      smellsLike: 'Busy, sunstruck, and trying to keep every instrument pointed right.',
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
      distance: 'Mission: retargeted from Bennu to Apophis / Launched: September 8, 2016',
      smellsLike: 'Slightly smug. Already pulled off one asteroid job and wants another.',
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
      distance: 'Mission: orbit and study Jupiter / Launched: August 5, 2011',
      smellsLike: 'Icy, battered, and absolutely locked in on giant storms.',
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
let activePlanet = null;   // currently shown in info panel
let activeProbe  = null;   // single nearest probe shown in info panel during probe mode
let displayMode = 'planets';
let isScaleLabCollapsed = true;   // Scale Lab starts collapsed behind its disclosure on every viewport
let introGone = false;
let closingShown = false;
let lastFrameTime = 0;
let scrollIdleTimer = null;  // timer to detect scroll stop
let isSnapping = false;      // currently auto-centering a planet
let snappingTo  = null;      // which planet is being snapped to
let snapZoom    = 0;         // 0→1 animated zoom when locked onto a planet
let glRenderer  = null;      // WebGL planet-layer handle, or null if unavailable
let glActive    = false;     // true only when the WebGL layer drew this frame successfully
let beltGlRenderer = null;   // WebGL asteroid-belt-layer handle, or null if unavailable
let beltGlActive   = false;  // true only when the belt WebGL layer drew this frame successfully
let beltTimeSec    = 0;      // reduced-motion-aware clock driving rock spin

// ── ELEMENTS ─────────────────────────────────────────────────
const canvas   = document.getElementById('space');
const ctx      = canvas.getContext('2d');
const glCanvas = document.getElementById('planets-gl');
const beltGlCanvas = document.getElementById('belt-gl');
const moonsFrontCanvas = document.getElementById('moons-front');
const moonsFrontCtx = moonsFrontCanvas.getContext('2d');
const intro    = document.getElementById('intro');
const infoPanel = document.getElementById('info-panel');
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
const scaleReadoutRatio = document.getElementById('scale-readout-ratio');
const scaleReadoutMeterFill = document.getElementById('scale-readout-meter-fill');
const scaleReadoutMeterEndLabel = document.getElementById('scale-readout-meter-end-label');

// Info panel fields
const infoSymbol    = document.getElementById('info-symbol');
const infoName      = document.getElementById('info-name');
const infoType      = document.getElementById('info-type');
const factSize      = document.getElementById('fact-size');
const factDistance = document.getElementById('fact-distance');
const factSmell     = document.getElementById('fact-smell');
const factScreens   = document.getElementById('fact-screens');

// Closing card fields
const closeOortInner = document.getElementById('close-oort-inner');
const closeOortOuter = document.getElementById('close-oort-outer');
const closeProxima   = document.getElementById('close-proxima');
const closeNewHorizons = document.getElementById('close-new-horizons');

// ── INIT ─────────────────────────────────────────────────────
function init() {
  initGlRenderer();
  initBeltGlRenderer();
  buildAsteroidCatalog();
  resize();
  buildStars();
  buildRulerNotches();
  initRotations();
  initMoonAngles();
  syncScaleLabCollapse();
  populateClosingCard();
  requestAnimationFrame(loop);
}

// Setup failures (no WebGL, context creation error) leave glRenderer
// null; the loop then never calls frame() and the 2D path stays active.
function initGlRenderer() {
  try {
    glRenderer = createPlanetRenderer(glCanvas);
  } catch (err) {
    glRenderer = null;
  }
}

// Same fallback contract as initGlRenderer(): setup/instancing-support
// failures leave beltGlRenderer null so the loop never calls frame()
// and the 2D haze/dots stay active (ARCH-02).
function initBeltGlRenderer() {
  try {
    beltGlRenderer = createAsteroidBeltRenderer(beltGlCanvas);
  } catch (err) {
    beltGlRenderer = null;
  }
}

function resize() {
  canvasW = canvas.width  = window.innerWidth;
  canvasH = canvas.height = window.innerHeight;
  moonsFrontCanvas.width  = canvasW;
  moonsFrontCanvas.height = canvasH;
  totalScrollPx = TOTAL_AU * PIXELS_PER_AU;
  if (glRenderer) glRenderer.resize(canvasW, canvasH);
  if (beltGlRenderer) {
    beltGlRenderer.resize(canvasW, canvasH);
    beltGlRenderer.setInstances(computeBeltGlInstances(getBeltInstanceBudget()));
  }
}

function initRotations() {
  PLANETS.forEach(p => { rotations[p.id] = 0; });
}

function initMoonAngles() {
  MOONS.forEach(m => { moonAngles[m.id] = Math.random() * Math.PI * 2; });
}

// ── ASTEROID BELT INSTANCES ─────────────────────────────────
// One deterministic seeded catalog backs both the WebGL rock layer and
// the 2D fallback below, so a WebGL failure swaps renderers without
// changing which rocks exist or where they sit (ARCH-02, ARCH-03).
const BELT_MAX_INSTANCES = 180;
const BELT_MOBILE_MAX_INSTANCES = 80;
const BELT_MOBILE_WIDTH_PX = 600;
const BELT_VARIANT_COUNT = 4;
const BELT_SEED = 0x5EED0A57;
const BELT_ROCK_MIN_PX = 3;
const BELT_ROCK_MAX_PX = 13;
const BELT_SPIN_SPEED_RANGE = 0.6; // rad/s, subtle and non-synchronized
const BELT_SPREAD_FRAC = 0.12; // vertical belt spread as a fraction of canvas height

// Small seeded generator (mirrors the copy in
// rendering/asteroid-belt-renderer.js) so rock placement is stable
// across reloads/resizes instead of reseeding from Math.random().
function mulberry32(seed) {
  let a = seed >>> 0;
  return function random() {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let asteroidCatalog = []; // deterministic seeded rock placements, built once in init()

function buildAsteroidCatalog() {
  const rand = mulberry32(BELT_SEED);
  asteroidCatalog = [];
  for (let i = 0; i < BELT_MAX_INSTANCES; i++) {
    // Average of two uniforms tapers density toward both belt edges —
    // a gradual entry/exit instead of a hard-edged band (AC5).
    const tAU = (rand() + rand()) / 2;
    asteroidCatalog.push({
      tAU,
      yFrac: (rand() - 0.5) * 2,
      depth: rand(),
      sizeT: rand(),
      variant: Math.floor(rand() * BELT_VARIANT_COUNT),
      baseRotation: rand() * Math.PI * 2,
      spinSpeed: (rand() - 0.5) * BELT_SPIN_SPEED_RANGE,
      shade: 0.7 + rand() * 0.3,
    });
  }
}

// Responsive instance budget shared by the WebGL layer's setInstances()
// and the 2D fallback below, so both paths draw the same stable prefix
// of asteroidCatalog at a given viewport width (AC3, AC4).
function getBeltInstanceBudget() {
  return canvasW <= BELT_MOBILE_WIDTH_PX ? BELT_MOBILE_MAX_INSTANCES : BELT_MAX_INSTANCES;
}

function beltInstanceAU(a) {
  return BELT_INNER_AU + a.tAU * (BELT_OUTER_AU - BELT_INNER_AU);
}

function beltInstanceDepthScale(a) {
  return 0.55 + (1 - a.depth) * 0.65;
}

// Maps the deterministic catalog into the world-space instance format
// rendering/asteroid-belt-renderer.js expects. Only the leading
// `budgetCount` entries are used, so the mobile-budget subset is
// always the same stable prefix of the desktop set (AC3, AC4).
function computeBeltGlInstances(budgetCount) {
  const centerY = canvasH * 0.5;
  const maxSpread = canvasH * BELT_SPREAD_FRAC;
  return asteroidCatalog.slice(0, budgetCount).map(a => {
    const au = beltInstanceAU(a);
    const depthScale = beltInstanceDepthScale(a);
    return {
      x: au * PIXELS_PER_AU,
      y: centerY + a.yFrac * maxSpread * depthScale,
      depth: a.depth,
      scale: (BELT_ROCK_MIN_PX + a.sizeT * (BELT_ROCK_MAX_PX - BELT_ROCK_MIN_PX)) * depthScale,
      baseRotation: a.baseRotation,
      spinSpeed: a.spinSpeed,
      shade: a.shade,
      variant: a.variant,
    };
  });
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
    // A11Y-02: twinkle is decorative; freeze it under reduced motion while
    // stars themselves stay visible at their last-drawn brightness.
    if (!prefersReducedMotion.matches) s.twinkle += s.speed * dt * 0.001;
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

// 2D fallback for when WebGL is unavailable (ARCH-02). Draws the same
// deterministic asteroidCatalog prefix the WebGL layer would have used
// at this viewport width, as flat sparse dots — no haze band, no dense
// wall, so the sparse character holds in either rendering path (AC2).
function drawBelt() {
  const centerY = canvasH / 2;
  const maxSpread = canvasH * BELT_SPREAD_FRAC;
  const budget = getBeltInstanceBudget();

  asteroidCatalog.slice(0, budget).forEach(a => {
    const au = beltInstanceAU(a);
    const sx = au * PIXELS_PER_AU - cameraX + canvasW * 0.2;
    if (sx < -8 || sx > canvasW + 8) return;

    const depthScale = beltInstanceDepthScale(a);
    const sy = centerY + a.yFrac * maxSpread * depthScale;
    const r = (BELT_ROCK_MIN_PX + a.sizeT * (BELT_ROCK_MAX_PX - BELT_ROCK_MIN_PX)) * depthScale * 0.5;
    const alpha = 0.28 + (1 - a.depth) * 0.42;

    ctx.beginPath();
    ctx.arc(sx, sy, r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(176,160,126,${alpha})`;
    ctx.fill();
  });
}

// Restrained orientation marker for CERES: a tick and small label at its
// true belt position, drawn on the 2D overlay above the rock field in
// both the WebGL and fallback paths. No focus snap, card, or navigation
// mode is attached to it anywhere else in the file (AC1).
function drawCeresLabel() {
  const sx = planetScreenX(CERES);
  if (sx < -40 || sx > canvasW + 40) return;

  const tickTopY = canvasH * 0.5 - canvasH * BELT_SPREAD_FRAC - 6;

  ctx.save();
  ctx.strokeStyle = 'rgba(240,230,218,0.3)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(sx, tickTopY);
  ctx.lineTo(sx, tickTopY + 6);
  ctx.stroke();

  ctx.font = '5px "Press Start 2P"';
  ctx.fillStyle = 'rgba(240,230,218,0.5)';
  ctx.textAlign = 'center';
  ctx.fillText(CERES.name, sx, tickTopY - 6);
  ctx.restore();
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
    const isActive = activeProbe != null && activeProbe.id === probe.id;

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
  // The WebGL planet layer (#planets-gl) paints above the main 2D canvas,
  // so a moon drawn only on the main canvas would always sit behind the
  // planet sphere regardless of its actual orbital position. #moons-front
  // sits above the planet layer and holds only the near-side half of each
  // orbit for this frame, so it needs a fresh clear before redrawing.
  moonsFrontCtx.clearRect(0, 0, canvasW, canvasH);

  MOONS.forEach(moon => {
    const parent = PLANETS.find(p => p.id === moon.parentId);
    const parentX = planetScreenX(parent);
    const parentY = planetScreenY();
    const parentDisplayR = getDisplayRadius(parent, parentX);
    const parentVisualExtentR = getVisualExtentRadius(parent, parentX);
    const orbitTilt = (parent.tiltDeg * Math.PI) / 180;
    // Orbit-plane flatness follows the parent's real axial tilt instead of a
    // flat constant: a near-0°/180° tilt (e.g. Jupiter, Venus) views its
    // near-equatorial moon orbits almost edge-on from within the solar
    // system's plane, while a near-90° tilt (e.g. Uranus) views them nearly
    // face-on. This is a disclosed 2D approximation (SCALE-02), not a
    // literal projection.
    const yComp = Math.abs(Math.sin(orbitTilt));

    // Skip if parent planet is way off-screen (orbit ring + dot would be invisible anyway)
    if (parentX < -canvasW || parentX > canvasW * 2) return;

    // Advance orbital angle using the shared calm visual-period calculation.
    // A11Y-02: frozen under prefers-reduced-motion, same as planet rotation.
    if (!prefersReducedMotion.matches) {
      const dir = moon.retrograde ? -1 : 1;
      const visualPeriodSec = getMoonVisualPeriodSec(moon);
      moonAngles[moon.id] += dir * (2 * Math.PI) / visualPeriodSec / 1000 * dt;
    }

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

    // sin(angle) before tilt/scale is applied is the same value that would
    // carry an orbit's depth in a full 3D projection: one half of the local
    // circle is the near side of the tilted plane, the other the far side.
    // Draw the near half on the layer above the WebGL planet sphere so it
    // correctly occludes the planet instead of always sitting beneath it.
    const isNearSide = Math.sin(angle) < 0;
    const moonCtx = isNearSide ? moonsFrontCtx : ctx;
    moonCtx.beginPath();
    moonCtx.arc(moonX, moonY, Math.max(0.8, moonDispR), 0, Math.PI * 2);
    moonCtx.fillStyle = moon.color;
    moonCtx.fill();
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

// Deterministic single-probe pick: first strict-minimum distance wins, so
// ties resolve by PROBES' fixed ascending-distanceAU order (E04 T002 AC4).
function findNearestProbe(focusX) {
  let nearest = null;
  let nearestDist = Infinity;
  PROBES.forEach(probe => {
    const dist = Math.abs(getProbeVisualX(probe) - focusX);
    if (dist < nearestDist) {
      nearestDist = dist;
      nearest = probe;
    }
  });
  return { probe: nearest, dist: nearestDist };
}

function getProbeFocusX() {
  const sun = PLANETS[0];
  const sunX = planetScreenX(sun);
  const sunEdge = sunX + getVisualExtentRadius(sun, sunX);
  return Math.max(canvasW * 0.34, sunEdge + 120);
}

// One reusable card for any planet, belt marker, or probe: SIZE, DISTANCE,
// SMELLS LIKE, and SCREENS are the only facts shown (E04 T008 AC1/AC4).
function showInfoCard(target, mode) {
  if (!target) {
    infoPanel.classList.remove('visible');
    return;
  }
  infoSymbol.textContent = target.symbol || '';
  infoName.textContent = target.name;
  infoType.textContent = target.type;
  factSize.textContent = target.facts.size;
  factDistance.textContent = target.facts.distance;
  factSmell.textContent = target.facts.smellsLike;
  factScreens.textContent = getScreensFactText(target);
  infoPanel.classList.toggle('probe-panel', mode === 'probes');
  infoPanel.classList.add('visible');
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

// Advances a planet's spin state. Split out from drawing so the same
// up-to-date rotation feeds both the WebGL frame view and the 2D
// fallback path within the same animation frame.
function updateRotation(planet, dt) {
  if (prefersReducedMotion.matches) return;
  const dir = planet.retrograde ? -1 : 1;
  rotations[planet.id] += planet.rotationSpeed * dir * dt * 0.016;
}

// Builds the immutable per-frame view list the WebGL renderer draws
// from. main.js stays the one source of truth for screen position,
// display size, and rotation; the renderer never recomputes any of it.
function buildVisibleBodyViews() {
  const views = [];
  PLANETS.forEach(planet => {
    const x = planetScreenX(planet);
    const y = planetScreenY();
    const r = getRadius(planet);

    // Off-screen culling (with margin for glow/rings) — bodies outside
    // this margin are rejected before they ever reach the renderer.
    if (x < -r * 4 || x > canvasW + r * 4) return;

    views.push({
      id: planet.id,
      x,
      y,
      radius: getDisplayRadius(planet, x),
      tiltRad: (planet.tiltDeg * Math.PI) / 180,
      rotationRad: rotations[planet.id],
      hasRings: !!planet.hasRings,
    });
  });
  return views;
}

function drawPlanet(planet, glDrewThisFrame) {
  const x = planetScreenX(planet);
  const y = planetScreenY();
  const r = getRadius(planet);

  // Off-screen culling (with margin for glow/rings)
  if (x < -r * 4 || x > canvasW + r * 4) return;

  const displayR = getDisplayRadius(planet, x);

  const tilt = (planet.tiltDeg * Math.PI) / 180;
  const rot  = rotations[planet.id];

  ctx.save();
  ctx.translate(x, y);

  // The WebGL layer owns the planet body and rings once it has drawn a
  // successful frame; the 2D path only supplies the ambient glow and
  // label so failures never leave a gap between the two renderers.
  if (!glDrewThisFrame && planet.hasRings) {
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

  if (!glDrewThisFrame) {
    // Planet body
    ctx.save();
    ctx.rotate(tilt);

    if (planet.id === 'sun') {
      drawSun(planet, displayR, rot);
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
  }

  // Planet label
  drawPlanetLabel(planet, displayR);

  ctx.restore();
}

function drawSun(planet, r, rot) {
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
    const { probe: nearest, dist } = findNearestProbe(focusX);

    if (nearest && dist < threshold) {
      if (!activeProbe || activeProbe.id !== nearest.id) {
        activeProbe = nearest;
        showInfoCard(nearest, 'probes');
      }
    } else if (activeProbe) {
      activeProbe = null;
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
      showInfoCard(nearest, 'planets');
    }
  } else if (activePlanet) {
    activePlanet = null;
    hideInfoPanel();
  }
}

function hideInfoPanel() {
  infoPanel.classList.remove('visible');
}

// Keeps the SCREENS fact accurate across a viewport resize even when the
// active target hasn't changed (its value depends on canvasW), mirroring
// updateScaleLab()'s own every-frame refresh below.
function updateInfoCardScreens() {
  const target = displayMode === 'probes' ? activeProbe : activePlanet;
  if (!target) return;
  factScreens.textContent = getScreensFactText(target);
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

  const focusTarget = displayMode === 'probes' ? activeProbe : activePlanet;
  rulerFocus.textContent = focusTarget ? focusTarget.name : 'DEEP SPACE';

  rulerPlanets.querySelectorAll('.planet-notch').forEach(notch => {
    const isActivePlanet = activePlanet && notch.dataset.planetId === activePlanet.id;
    notch.classList.toggle('active', displayMode === 'planets' && isActivePlanet);
    notch.classList.toggle('dimmed', displayMode === 'probes');
  });

  rulerPlanets.querySelectorAll('.probe-notch').forEach(notch => {
    const isActiveProbe = activeProbe != null && notch.dataset.probeId === activeProbe.id;
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

function formatScreens(screens) {
  if (screens == null || !Number.isFinite(screens)) return 'N/A';
  const rounded = screens < 10 ? Math.round(screens * 10) / 10 : Math.round(screens);
  return rounded.toLocaleString();
}

// Marker sits at its true readable/true-scale ratio, clamped so it never
// collapses into the track edge or slides under the far-end label, even at
// compression ratios in the thousands (E04 T007 AC3).
const SCALE_METER_MARKER_MIN_PCT = 3;
const SCALE_METER_MARKER_MAX_PCT = 90;

function setScaleMeterMarker(readableScreens, trueScreens) {
  const rawPct = trueScreens > 0 ? (readableScreens / trueScreens) * 100 : 0;
  const pct = Math.min(SCALE_METER_MARKER_MAX_PCT, Math.max(SCALE_METER_MARKER_MIN_PCT, rawPct));
  scaleReadoutMeterFill.style.left = `${pct}%`;
}

function syncScaleLabCollapse() {
  scaleLab.classList.toggle('collapsed', isScaleLabCollapsed);
  scaleLabToggle.setAttribute('aria-expanded', String(!isScaleLabCollapsed));
  scaleLabToggleLabel.textContent = isScaleLabCollapsed ? 'SHOW' : 'HIDE';
}

function getScaleFocusTarget() {
  if (displayMode === 'probes') {
    if (activeProbe) return activeProbe;
    return findNearestProbe(getProbeFocusX()).probe;
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

// Screens swiped to reach `target` at the readable (as-shown) scale versus
// how many it would take at true, uncompressed scale. Shared by the info
// card's SCREENS fact and the Scale Lab readout (STYLE-03) so both report
// the same number from the same math instead of duplicating the division.
function getScreensComparison(target) {
  const readableDistancePx = getReadableDistancePx(target);
  const trueDistancePx = getTrueDistancePx(target);
  return {
    readableScreens: (readableDistancePx || 0) / canvasW,
    trueScreens: (trueDistancePx || 0) / canvasW,
  };
}

// The Sun sits at distanceAU 0, so both screens counts are always 0 — stated
// in plain language instead of a confusing "0 / 0" (T008 AC3).
function getScreensFactText(target) {
  if (target.distanceAU === 0) {
    return 'The reference point — 0 screens either way';
  }
  const { readableScreens, trueScreens } = getScreensComparison(target);
  return `${formatScreens(readableScreens)} swiped here · ${formatScreens(trueScreens)} at true scale`;
}

function updateScaleLab() {
  const target = getScaleFocusTarget();
  if (!target) return;

  const trueDistancePx = getTrueDistancePx(target);
  const readableDiameterPx = getReadableDiameterPx(target);
  const trueDiameterPx = getTrueDiameterPx(target);
  const sizeFactor = readableDiameterPx && trueDiameterPx
    ? readableDiameterPx / trueDiameterPx
    : null;
  const { readableScreens, trueScreens } = getScreensComparison(target);

  scaleLabFocusName.textContent = target.name;

  let sizeRatioFact = '';
  if (sizeFactor != null) {
    sizeRatioFact = sizeFactor >= 1
      ? ` Rendered about ${sizeFactor.toFixed(1)}x larger than its Pluto-anchored physical scale.`
      : ` Rendered at about ${(sizeFactor * 100).toFixed(0)}% of its Pluto-anchored physical size.`;
  }

  if (trueDiameterPx == null) {
    scaleLabFocusMeta.textContent = `${target.type} uses symbolic sizing here. Distance remains anchored to real AU values.`;
  } else {
    scaleLabFocusMeta.textContent = `If Pluto's radius is ${TRUE_SIZE_MIN_RADIUS}px, ${target.name} lands at ${formatPixels(trueDistancePx)} from the Sun.${sizeRatioFact}`;
  }

  scaleLabTitle.textContent = 'True Scale Readout';
  scaleViewSplit.classList.add('active');

  scaleReadoutRatio.textContent = `You swiped about ${formatScreens(readableScreens)} screens to reach ${target.name}. At true scale, the same distance would take about ${formatScreens(trueScreens)} screens.`;
  setScaleMeterMarker(readableScreens, trueScreens);
  scaleReadoutMeterEndLabel.textContent = `${formatScreens(trueScreens)} screens at true scale`;
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

// The `cameraX` value at which Pluto's screen position first crosses the
// closing-card trigger (`plutoScreenX < canvasW * 0.1`). Shared by
// checkClosingCard() and clampTarget()'s overscroll cap (D005) so both
// agree on exactly where "past Pluto" begins.
function getClosingThresholdCameraX() {
  const plutoPx = PLANETS[PLANETS.length - 1].distanceAU * PIXELS_PER_AU;
  return plutoPx + canvasW * 0.1;
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

// How far forward the camera may travel past the closing-card trigger
// point, in fixed pixels independent of viewport width (D005). Small on
// purpose: TOTAL_AU's own "+4 AU" breathing room (thousands of px) let a
// visitor scroll far enough past Pluto that reversing through the fully
// opaque #closing-card, with zero visual feedback, felt like a dead end.
const CLOSING_MAX_OVERSCROLL_PX = 300;

function clampTarget() {
  const maxScroll = getMaxCameraX();
  const closingCap = getClosingThresholdCameraX() + CLOSING_MAX_OVERSCROLL_PX;
  targetCameraX = Math.max(0, Math.min(targetCameraX, maxScroll, closingCap));
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
  const { probe: nearest, dist } = findNearestProbe(focusX);

  if (!nearest || dist >= Math.max(120, canvasW * 0.12)) return;

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
  }
}

function setDisplayMode(mode) {
  displayMode = mode;
  activePlanet = null;
  activeProbe = null;
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

  // Asteroid belt (behind planets, both by AU range and by z-index:
  // #belt-gl sits below #planets-gl). Same success-gates-fallback
  // pattern as the planet layer below: WebGL only replaces the 2D
  // haze/dots once it has drawn a successful frame.
  if (!prefersReducedMotion.matches) beltTimeSec += dt / 1000;
  beltGlActive = beltGlRenderer ? beltGlRenderer.frame({ cameraX, timeSec: beltTimeSec }) : false;
  beltGlCanvas.classList.toggle('gl-active', beltGlActive);
  if (!beltGlActive) drawBelt();
  drawCeresLabel();

  // Advance spin state once per planet, then let the WebGL layer attempt
  // a frame from the current positions/rotations. WebGL only takes over
  // visually on a successful draw; any setup, frame, or context failure
  // leaves glActive false and the 2D path keeps drawing every body.
  PLANETS.forEach(p => updateRotation(p, dt));
  glActive = glRenderer ? glRenderer.frame(buildVisibleBodyViews()) : false;
  glCanvas.classList.toggle('gl-active', glActive);

  // Draw planets
  PLANETS.forEach(p => drawPlanet(p, glActive));

  // Draw moons (on top of planets so they're visible against planet bodies)
  drawMoons(dt);

  if (displayMode === 'probes') {
    drawProbes();
  }

  // Update HUD
  checkInfoPanel();
  updateInfoCardScreens();
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
