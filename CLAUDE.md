# Solar System at Scale — Project Spec

Standalone interactive web experience hosted at `solar-system-at-scale.anipatke.com.au` (Vercel). Linked from the main Vibe Lab site. Shows the true proportional scale of the solar system from the Sun to Pluto via a scroll-driven horizontal pan.

**Repo:** `anipatke/solar-system-at-scale` on GitHub  
**Deploy:** Vercel, static site, no build step — push to `master` to deploy

---

## Tech Stack

- **Vanilla JS + HTML Canvas** — zero dependencies, no framework
- **Static site** — `index.html` + `main.js` + `style.css`
- **Deployed to Vercel** — push to deploy, managed independently
- No React, no Tailwind, no build step — keep it that way

---

## Key Constants (main.js)

```js
PIXELS_PER_AU = 2000      // 1 AU = 2000px — Pluto is ~79 screen-widths away
SCROLL_SENSITIVITY = 6.0  // wheel delta multiplier
TOUCH_SENSITIVITY = 4.0   // touch delta multiplier
LERP_SPEED = 0.08         // camera smoothing
TRUE_SIZE_MIN_RADIUS = 1.5 // minimum px radius in true-size mode
```

---

## Scroll Mechanic

- Vertical scroll (and touch swipe) is hijacked while the page is in view
- Scroll delta translates to horizontal camera movement across the canvas
- Unified experience across desktop and mobile (touch events mapped to same logic)
- **Auto-snap:** 350ms after scrolling stops, camera eases to center the nearest planet
- Music starts on first scroll/touch interaction (browser autoplay policy)

---

## Size Modes

Two modes toggled via the **TRUE SIZE / NAVIGABLE** button (bottom-left):

### TRUE SIZE (default)
- Sun diameter = full browser height
- All planets scaled proportionally — Earth is ~4px, Pluto is sub-pixel (min 1.5px)
- The gut-punch first impression — this is the point of the experience
- Small-planet zoom emphasis disabled in this mode

### NAVIGABLE
- Exaggerated planet sizes so all bodies are visible and interactive
- Small planets (Mercury, Mars, Pluto) get a zoom-in emphasis near center-frame
- Mode transition animates smoothly (lerp speed 0.06)

### True size ratios (diameter relative to Sun)
| Body | Ratio |
|------|-------|
| Sun | 1.0 |
| Mercury | 0.00351 |
| Venus | 0.00870 |
| Earth | 0.00916 |
| Mars | 0.00487 |
| Jupiter | 0.10052 |
| Saturn | 0.08373 |
| Uranus | 0.03647 |
| Neptune | 0.03541 |
| Pluto | 0.00171 |

---

## Scale Rules

- **Distances:** True proportional scale from Sun to Pluto (`PIXELS_PER_AU = 2000`)
- **Planet sizes:** Two modes — see above
- Camera offset: planet screen X = `planet.distanceAU * PIXELS_PER_AU - cameraX + canvasW * 0.2`

---

## Bodies Included

Sun + all 8 planets + Pluto, in order:

| Body | Notes |
|------|-------|
| Sun | Starting point |
| Mercury | Small planet — zoom emphasis in navigable mode |
| Venus | Retrograde rotation |
| Earth | |
| Mars | Small planet — zoom emphasis in navigable mode |
| Jupiter | Fast rotation (~10hr day), Great Red Spot |
| Saturn | Rings rendered front/back layered |
| Uranus | 98° tilt — rolls on its side |
| Neptune | |
| Pluto | **A planet. Not a dwarf planet. Non-negotiable.** |

---

## Planet Rotation

Each planet spins on its correct axis tilt and direction:

| Planet | Tilt | Direction |
|--------|------|-----------|
| Sun | 7° | Prograde |
| Mercury | ~0° | Prograde (very slow) |
| Venus | 177° | Retrograde (clockwise) |
| Earth | 23.5° | Prograde |
| Mars | 25° | Prograde |
| Jupiter | 3° | Prograde (fast) |
| Saturn | 27° | Prograde |
| Uranus | 98° | On its side / rolling |
| Neptune | 28° | Prograde |
| Pluto | 122° | Retrograde |

---

## Info Panel

- **Trigger:** Auto-appears with a slide-in transition when a planet reaches center-frame
- **Three consistent facts per body:**
  1. How many Earths big (or how many fit inside Earth for small ones)
  2. How long to fly there via commercial flight (~900km/h)
  3. What does it smell like

### Planet Data

| Body | Earths big | Commercial flight | Smells like |
|------|-----------|-------------------|-------------|
| Sun | 1.3 million Earths fit inside | ~19 years | Burning plasma & ozone |
| Mercury | 18 Mercurys fit in Earth | ~9 years | Sulfur & rotten eggs |
| Venus | Nearly 1 Earth | ~5 years | Pure sulfuric acid |
| Earth | 1 (reference) | You're here | Petrichor & ocean |
| Mars | Half an Earth | ~10 years | Burnt gunpowder |
| Jupiter | 1,321 Earths | ~80 years | Ammonia & rotten eggs |
| Saturn | 764 Earths | ~150 years | Ammonia crystals |
| Uranus | 63 Earths | ~340 years | Hydrogen sulfide (farts) |
| Neptune | 57 Earths | ~555 years | Ammonia & methane |
| Pluto | 170 Plutos fit in Earth | ~745 years | Carbon monoxide ice |

---

## Visual Style — Atari-Noir

Follows the brand in `branding.md`. This is a **Vibe Lab** project — accent color is **Vibe Purple**.

### Palette

| Token | Hex | Usage |
|-------|-----|-------|
| Background | `#121212` | Main canvas background |
| Surface | `#0D0D0D` | Info panels |
| Primary Text | `#F0E6DA` | All readable text |
| Vibe Purple | `#B1A1DF` | Accent, highlights, glows |
| Border | `#1A1A1A` | Panel edges |

### Typography

| Role | Font |
|------|------|
| Panel headings | `Chakra Petch` — UPPERCASE, tracked |
| Body / UI text | `Space Mono` |
| Labels, ruler notches, planet names | `Press Start 2P` |

### Planet Rendering

- Drawn entirely on canvas — no image files
- Pixel-art / low-res aesthetic (chunky gradients, not photorealistic)
- Each planet recognizable by color/banding: Jupiter banded, Mars rusty red, Earth blue with land masses, Saturn with rings, etc.
- Terminator shadow on all planets (dark gradient on right side)
- Glow treatment: lit-from-within using planet accent color
- Saturn rings rendered in two passes (behind + in front of planet body)
- Jupiter has Great Red Spot
- **No neon cyberpunk spam**

### Atmosphere

- Deep space black background (`#121212`)
- Parallax star field — stars at different depths scroll at different speeds
- Stars twinkle subtly via sine wave opacity
- CRT scanline overlay across the entire experience (low opacity, atmospheric not gimmicky)

---

## HUD

- **Scale ruler** fixed across the top of the viewport
  - Shows current distance from Sun in km and light-minutes
  - Planet name notches mark each body's position on the ruler
  - Moving purple needle tracks scroll position
- **Mute/unmute button** — bottom-right corner
- **TRUE SIZE / NAVIGABLE toggle** — bottom-left corner
- Nothing else. No header, no footer, no nav chrome.

---

## Audio

- Looping ambient MP3 (`audio/ambient.mp3`, ~4.9MB)
- Starts on first scroll/touch (browser autoplay policy)
- Volume: 0.18 (subtle)
- Mute toggle in bottom-right corner

---

## Page Structure

- **Full bleed dark page** — the canvas IS the page
- Opening intro card with tagline fades in before scroll begins
- Intro dismissed on first scroll — audio starts at that moment
- No header, no footer

---

## End of Journey

After Pluto's info panel, a closing message card appears with:
- How much further to the **Oort Cloud inner edge** (~2,000 AU — ~50x this entire scroll)
- How much further to the **Oort Cloud outer edge** (~100,000 AU — ~2,500x)
- How much further to **Proxima Centauri** (~268,000 AU / 4.24 ly — ~6,700x)
- Framed in terms of "at this same scale, you would need to scroll X more"
- Closing CTA links back to `anipatke.com.au`
- Tone: awe-inspiring, human, slightly wry — matches brand voice

---

## Entry Point

Plain hyperlink from the main Vibe Lab site. Opens as its own page. No iframe, no modal.

---

## Brand Voice (from branding.md)

- Warm, precise, direct, lightly self-aware
- Translate complex systems into concrete metaphors
- Never sterile, never overhyped
- Copy should move quickly — one idea per section

---

## File Structure

```
/
├── index.html        — page shell, all UI elements
├── style.css         — brand tokens, component styles, scanline
├── main.js           — full engine: canvas, scroll, planets, HUD, panels
├── vercel.json       — static hosting config
├── branding.md       — Atari-Noir brand reference
├── CLAUDE.md         — this file
└── audio/
    └── ambient.mp3   — haunting space ambient, CC0, ~4.9MB
```

---

## Known Improvement Areas (future sessions)

- [ ] Consider adding asteroid belt as a sparse dot field between Mars and Jupiter
- [ ] Mobile: info panel position could be improved for small screens
- [ ] Could add a "share" button at the Pluto closing card
- [ ] Scroll speed could be user-adjustable (fast/slow toggle)
- [ ] Intro tagline copy could be sharpened
- [ ] Vercel domain: `solar-system-at-scale.anipatke.com.au` — set CNAME to `cname.vercel-dns.com`
