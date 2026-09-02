---
type: project-design
status: active
last_audited: never
---

# Solar System at Scale — System Design

## Architecture commitments

- **Static delivery.** Vercel serves `index.html`, `style.css`, `main.js`, and static assets directly; there is no application server or build step.
- **Canvas-first scene.** The existing 2D canvas owns stars, orbit guides, labels, belt background effects, and the camera journey.
- **Additive 3D.** V1 may add a transparent native WebGL canvas for reusable planet and asteroid geometry without replacing DOM UI or the 2D scene.
- **One distance source of truth.** Body positions derive from `distanceAU * PIXELS_PER_AU`; visual enlargement must not change world positions.
- **DOM for interface.** The ruler, modes, information card, scale disclosure, intro, and closing state remain semantic HTML styled by CSS.
- **Data-led bodies.** Planet, moon, probe, and belt content stays in declarative data near the top of `main.js` until a split has measurable value.

## Codebase map

```text
.
├── index.html          Page shell, semantic overlays, fonts, and analytics script
├── style.css           Design tokens, layout, controls, responsive rules
├── main.js             Body data, camera/input state, rendering, HUD, and panels
├── audio/ambient.mp3   Current ambient track; scheduled for removal in v1
├── vercel.json         Static rewrites and response headers
├── context.md          Compact implementation context for coding agents
└── .savepoint/         Product, design, release, task, policy, and audit records
```

`Codex.md` and `CLAUDE.md` are vendor-specific pointers to `AGENTS.md` and `context.md`; they must not duplicate implementation guidance. `package.json` currently records Vercel Analytics metadata but does not introduce a bundling workflow.

## Runtime flow

1. `init()` sizes the canvas and builds deterministic session data such as stars, ruler notches, rotations, moons, and belt particles.
2. Wheel, touch, and mouse input update a target camera position on the horizontal AU axis.
3. The animation loop eases the camera, draws the visible scene, updates focus state, and synchronises DOM overlays.
4. After input settles, the nearest eligible target snaps into focus and receives a temporary readable-size treatment.
5. Passing Pluto reveals the closing card while reverse movement can return to the journey.

## Scale model

- Planet and belt positions use `PIXELS_PER_AU = 2000` on one proportional horizontal axis.
- Current planet radii use real ratios relative to a viewport-height Sun, plus minimum visibility and snap enlargement.
- Moon orbits are intentionally compressed local overlays around their parent; they are not positions on the AU axis.
- V1 may increase focused-body size so 3D detail is readable, but must preserve the original position marker and disclose the visual scale treatment.

## Rendering layers

| Layer | Current owner | V1 direction |
|---|---|---|
| Space, stars, orbit guides, labels | 2D canvas | Retain |
| Planets and Saturn rings | 2D canvas drawing functions | Transparent native WebGL layer with shared sphere geometry |
| Asteroid belt | 2D haze and particles | Sparse instanced WebGL rocks with a restrained 2D depth field if needed |
| Moons | 2D local overlays | Retain unless the shared sphere path is demonstrably cheaper and clearer |
| HUD and cards | DOM/CSS | Retain and simplify |

If WebGL initialisation fails, the current 2D planet renderer remains the functional fallback. The 3D layer must use off-screen culling, bounded geometry, compressed textures or procedural materials, and device-pixel-ratio caps.

## Interaction and interface

- Wheel movement, vertical/horizontal touch, and mouse drag all advance the same camera target.
- Scroll idle triggers focus snapping; direct manipulation cancels an active snap.
- The ruler communicates current distance and active target.
- Planet mode and probe mode share the journey but use one active information card at a time in the v1 direction.
- The main experience is silent. Existing ambient playback and mute UI are scheduled for removal in E04.
- Reduced-motion mode should stop decorative rotation/twinkle and use immediate or shortened UI transitions without disabling navigation.

## Content model

Body data owns names, symbols, types, distances, rotation metadata, colours/material references, and short facts. V1 cards expose at most two facts for the active target. Scientific claims and unit conversions must be traceable to a named authoritative source in task evidence when changed.

## Deployment and validation

- Deployment remains a push of static files to Vercel.
- Syntax gate: `node --check main.js`.
- Repository hygiene gate: `git diff --check`.
- Browser validation covers load, input methods, focus snapping, mode switching, responsive layout, WebGL fallback, and the Sun-to-Pluto journey.
- Performance evidence records a representative desktop and mobile viewport; exact budgets are set in the implementing epic.

## Planned module changes

The v1 epics may introduce small focused JavaScript modules or static texture assets if E02 design shows that keeping all WebGL code in `main.js` would harm maintainability. Any new file must be added to this map through the epic drift/audit process.
