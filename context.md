# Solar System at Scale — Shared Context

This file is the shared AI context for this repo. It replaces overlapping guidance in `CLAUDE.md` and `Codex.md` where they disagree with the current implementation.

## Project

- Standalone interactive web experience for `solar-system-at-scale.anipatke.com.au`
- Hosted on Vercel as a static site
- Repo: `anipatke/solar-system-at-scale`
- Push to `master` to deploy

## Stack

- Vanilla JavaScript
- HTML canvas
- Static assets only
- No framework
- No dependencies
- No build step

## Core Files

- `index.html`: page shell and UI elements
- `style.css`: brand tokens, layout, overlays, controls
- `main.js`: canvas rendering, scroll input, HUD, planet/moon systems, info panels
- `audio/ambient.mp3`: ambient loop
- `branding.md`: brand direction
- `vercel.json`: static hosting config

## Non-Negotiables

- Keep the repo dependency-free
- Preserve the canvas-first architecture
- Do not add React, Tailwind, bundlers, or a build pipeline
- Favor small direct changes over extra abstraction
- Preserve the Atari-noir visual language
- Pluto is a planet in this project

## Visual Direction

- Background: deep space black `#121212`
- Accent: Vibe Purple `#B1A1DF`
- Surface: near-black panels
- Typography:
  - `Chakra Petch` for headings
  - `Space Mono` for body/UI copy
  - `Press Start 2P` for labels and ruler notches
- Planets are rendered directly in canvas
- Pixel-art / chunky illustrative style, not photorealistic
- Saturn rings are layered front/back
- Jupiter has a Great Red Spot
- Avoid neon-heavy cyberpunk styling

## Interaction Model

- Vertical wheel and touch input drive horizontal movement
- Camera movement is smoothed with lerp
- After scroll idle, the camera snaps to the nearest focus target
- Audio starts on first user interaction
- Mute button is bottom-right
- There is no longer a navigable/true-size toggle in the UI

## Current Scale Model

### Planet distances

- Planet-to-planet spacing uses a fixed scene scale:

```js
PIXELS_PER_AU = 2000
```

- Planet screen X:

```js
planet.distanceAU * PIXELS_PER_AU - cameraX + canvasW * 0.2
```

- This means interplanet distances are on a consistent AU-based horizontal axis.

### Planet sizes

- Planet sizes are based on real diameter ratios relative to the Sun
- Current true-size anchor:

```js
sun radius = canvasH / 2
```

- Planet radius is:

```js
Math.max(TRUE_SIZE_MIN_RADIUS, sunTrueR * SIZE_RATIO_TO_SUN[planet.id])
```

- `TRUE_SIZE_MIN_RADIUS = 1.5` means tiny planets can be enlarged for visibility
- Snapped planets can get a temporary scale-up via `snapZoom`

### Moon systems

- Moon systems are **not** drawn as literal positions on the same solar-system distance axis as the planets
- They are rendered as **local overlays** around each parent planet
- Orbit radius is compressed from the real orbit multiple using `getMoonOverlayOrbitRadius(...)`
- This is intentional so moons stay visually attached to their parent instead of stretching toward neighboring planets
- Moon dots still use real diameter ratios relative to the Sun, with a minimum visible size of `0.8px`
- Moon orbit overlays are tilted to match the parent planet's tilt
- Saturn's moon plane now visually aligns with Saturn's tilted ring plane

### Honest summary

- Planet distances: proportional on the AU axis
- Planet sizes: mostly proportional to the Sun, except tiny-body minimums and snap zoom
- Moon systems: local overlay visualization, not global-distance positions

## Bodies Included

- Sun
- Mercury
- Venus
- Earth
- Mars
- Asteroid Belt
- Jupiter
- Saturn
- Uranus
- Neptune
- Pluto
- 13 moons

## Asteroid Belt

- Main belt spans `2.2–3.2 AU`
- Rendered as particle field
- Included as a center-focus info target
- Included in ruler notches
- Has the same info-panel treatment as planets

## Moon Set

- Moon
- Phobos
- Deimos
- Io
- Europa
- Ganymede
- Callisto
- Rhea
- Titan
- Titania
- Oberon
- Triton
- Charon

## Planet Rotation / Tilt

- Planet bodies rotate in the render loop
- Retrograde planets spin backward
- Tilt values are encoded per body
- Jupiter's Great Red Spot now behaves like a surface feature, not a dot orbiting the center

## HUD / Panels

- Fixed ruler at the top
- Ruler shows distance from Sun in km and light-time
- Ruler includes body notches
- Info panel auto-appears for the nearest centered focus target
- Focus targets currently include all planets plus the asteroid belt
- Closing card appears after passing Pluto

## Audio

- Source: `audio/ambient.mp3`
- Loops
- Starts on first user interaction
- Volume is `0.18`

## Current Copy Direction

- Tone: warm, precise, direct, lightly self-aware
- Translate complex systems into concrete metaphors
- Copy should move quickly
- Smell facts are now written as kid-friendly sensory analogies rather than raw chemistry labels

## Current Known State

- `CLAUDE.md` and `Codex.md` contain outdated references to the removed navigable mode
- `context.md` should be treated as the current source of truth for AI guidance
- The current implementation has already removed the visible size-mode toggle
- The moon system is intentionally hybridized for readability

## Good Next Steps

- Keep cleaning stale references to the old navigable mode from legacy docs
- Tune moon overlay spacing if any system still feels too loose or too cramped
- Add per-moon orbital plane data if more accurate inclination is desired beyond parent-tilt matching
- Improve small-screen info-panel placement if needed
