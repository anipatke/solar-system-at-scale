# Solar System at Scale — Codex Notes

This repo is a standalone static web experience for `solar-system-at-scale.anipatke.com.au`. It shows the solar system at true proportional distances in a horizontal scroll canvas.

## Stack

- Vanilla JS
- HTML canvas
- Static deployment on Vercel
- No framework, no build step, no dependencies

## Core Files

- `index.html`: page shell and UI chrome
- `style.css`: tokens, layout, overlays, controls
- `main.js`: rendering, input, camera, planets, moons, info panels
- `audio/ambient.mp3`: looping ambient track
- `vercel.json`: static hosting config
- `branding.md`: brand direction

## Working Rules

- Keep this repo dependency-free.
- Preserve the current canvas-first architecture.
- Do not introduce React, Tailwind, bundlers, or a build pipeline.
- Favor small, direct changes over abstractions.
- Keep the Atari-noir visual language intact.

## Scale Rules

- Planet distances use `PIXELS_PER_AU = 2000`.
- Planet screen X is driven by `planet.distanceAU * PIXELS_PER_AU - cameraX + canvasW * 0.2`.
- True-size planet radii are proportional to the Sun, with `TRUE_SIZE_MIN_RADIUS` preserving visibility for tiny bodies.
- Moon orbital radii in true-size mode must use the same distance scale as the rest of the solar system:

```js
moon.orbitalKm / AU_KM * PIXELS_PER_AU
```

- Navigable moon orbits can stay exaggerated for legibility.

## Interaction Model

- Vertical wheel and touch input drive horizontal camera movement.
- Camera movement is smoothed with lerp.
- After scroll idle, the camera snaps to the nearest planet.
- Audio starts on first user interaction.

## Modes

### TRUE SIZE

- Default mode.
- Sun fills browser height.
- Planet sizes follow real diameter ratios.
- Distances stay physically scaled.

### NAVIGABLE

- Planet sizes are exaggerated for readability and interaction.
- Small-planet emphasis is allowed near center frame.
- Distances still remain based on the scene scale.

## Moons

- Keep the current 13-moon set.
- Preserve orbital periods and retrograde flags.
- Orbit rings are atmospheric UI, but orbital radius math should remain physically consistent in true-size mode.
- Moon display radii can remain slightly exaggerated when needed for visibility.

## UI Expectations

- Fixed ruler at top.
- Info panel auto-appears for centered planet.
- Mute button bottom-right.
- Size mode toggle top-right.
- No header, footer, or extra navigation.

## Brand Notes

- Warm, precise, direct tone.
- Dark space background with restrained Vibe Purple accents.
- Pixel-art or chunky-canvas rendering, not photorealistic.
- Avoid neon-heavy cyberpunk styling.

## Delivery Notes

- This project deploys from `master`.
- Prefer simple manual verification in-browser after visual changes.
- If behavior and documentation disagree, update the code first, then align docs.
