# Solar System at Scale — Implementation Context

Use this file for compact implementation facts. Product intent lives in `.savepoint/PRD.md`; architecture lives in `.savepoint/Design.md`; active work is selected by `.savepoint/router.md`.

## Product

- Static interactive journey from the Sun to Pluto at `solar-system-at-scale.anipatke.com.au`.
- Vertical wheel, touch, and pointer-drag input move a horizontal camera through proportional AU distances.
- The emptiness between bodies is the central experience.
- Pluto is a planet in this project’s voice and structure.

## Current stack and deployment

- Vanilla JavaScript, semantic HTML, CSS, and one HTML Canvas 2D scene.
- No framework or build step; Vercel serves the repository as static files.
- `package.json` records `@vercel/analytics`; the page currently loads `/_vercel/insights/script.js` directly.
- Pushes to `master` deploy the site.

## Runtime files

- `index.html`: page shell, ruler, Scale Lab, modes, two possible information panels, intro, closing state, and analytics script.
- `style.css`: Atari-noir tokens, overlays, controls, panels, and responsive layout.
- `main.js`: body/probe data, camera and input state, Canvas rendering, focus snapping, HUD, Scale Lab, and cards.
- `vercel.json`: SPA-style static rewrite and security response headers.

## Current scale model

- Planet and belt positions use `PIXELS_PER_AU = 2000`.
- Screen X is `distanceAU * PIXELS_PER_AU - cameraX + canvasW * 0.2`.
- Planet radii use real size ratios relative to a viewport-height Sun, with a `1.5px` minimum and temporary snap enlargement.
- Each planet's self-rotation speed derives from its real sidereal rotation period (NASA Planetary Fact Sheet) through one shared scale factor; direction follows the same source's sign convention.
- The scale note discloses that body sizes do not share the distance-axis scale.
- Moon systems are compressed local overlays based on parent-relative orbital distance; they are not literal AU-axis positions.

## Current content

- Sun, Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto, and the main asteroid belt.
- Twenty-five moons: Moon, Phobos, Deimos, Io, Europa, Ganymede, Callisto, Amalthea, Himalia, Mimas, Enceladus, Tethys, Dione, Rhea, Titan, Iapetus, Miranda, Ariel, Umbriel, Titania, Oberon, Triton, Nereid, Proteus, and Charon.
- Planet mode and probe mode share the ruler and focus system.
- One reusable information card shows at most two facts (SIZE, HIGHLIGHT) for the active planet, belt marker, or probe; probe mode shows a single nearest-probe card, not two.
- The experience is silent: no ambient audio, playback control, or audio asset ships with v1.

## Current rendering

- Stars, asteroid particles, planets, rings, moons, probes, and labels are drawn in the 2D canvas loop.
- Planets use gradients and clipped procedural shapes; Jupiter uses rectangular cloud bands and a moving Great Red Spot.
- The asteroid belt is a sparse, deterministic seeded field of instanced WebGL rocks (`rendering/asteroid-belt-renderer.js`) across 2.2–3.2 AU, capped at 180 instances desktop / 80 at ≤600px width, with a 2D canvas fallback drawing the same catalog as sparse dots when WebGL is unavailable. A non-focusable Ceres label offers restrained orientation with no card or navigation mode.
- Off-screen bodies are culled and camera movement is eased.

## Approved v1 direction

- E01: replace generic and stale documentation with repo-specific sources of truth.
- E02: add lightweight native WebGL spheres for every planet, recognisable materials, Saturn rings, focus sizing, and a 2D fallback.
- E03: replace the belt haze with sparse reusable 3D asteroid instances and restrained depth/parallax.
- E04: simplify to one two-fact card, calm moon motion, demote scale explanation, and validate responsiveness/accessibility. Ambient audio and its control are removed (T001).

Planned behavior must not be described as current behavior until its epic is implemented and audited.

## Visual direction

- Atari-noir interface: `#121212` background, `#F0E6DA` text, `#B1A1DF` primary accent, and `#A4C639` for probe state.
- `Chakra Petch` headings, `Space Mono` body/UI, and sparing `Press Start 2P` labels.
- Celestial bodies should have coherent volume and material without becoming a photorealistic simulation.
- Avoid neon-heavy cyberpunk styling, dense dashboards, playful bounce, and decorative emoji lists.

## Working rules

- Follow `AGENTS.md` and `.savepoint/router.md` before beginning planned work.
- Keep the AU position calculation as the single distance source of truth.
- Preserve wheel, pointer-drag, and touch navigation.
- Use native browser capabilities unless a dependency is explicitly justified.
- Validate JavaScript with `node --check main.js` and repository hygiene with `git diff --check`.
