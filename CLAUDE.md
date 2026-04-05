# Solar System at Scale — Project Spec

Standalone interactive web experience hosted at `solar-system-at-scale.anipatke.com.au` (Vercel). Linked from the main Vibe Lab site. Shows the true proportional scale of the solar system from the Sun to Pluto via a scroll-driven horizontal pan.

---

## Tech Stack

- **Vanilla JS + HTML Canvas** — zero dependencies, no framework
- **Static site** — `index.html` + `main.js` + `style.css`
- **Deployed to Vercel** — push to deploy, managed independently

---

## Scroll Mechanic

- Vertical scroll (and touch swipe) is hijacked while the page is in view
- Scroll delta translates to horizontal camera movement across the canvas
- Unified experience across desktop and mobile (touch events mapped to same logic)
- Music starts on first scroll/touch interaction (browser autoplay policy)

---

## Scale Rules

- **Distances:** True proportional scale from Sun to Pluto
- **Planet sizes:** Exaggerated by a fixed multiplier (planets would be sub-pixel at true scale) — labeled clearly as "sizes exaggerated"
- **Small planets** (Mercury, Mars, Pluto): zoom-in emphasis when they enter the viewport to highlight their relative tininess

---

## Bodies Included

Sun + all 8 planets + Pluto, in order:

| Body | Notes |
|------|-------|
| Sun | Starting point |
| Mercury | |
| Venus | Retrograde rotation |
| Earth | |
| Mars | |
| Jupiter | Fast rotation (~10hr day) |
| Saturn | Rings rendered |
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
| Labels, ruler notches, planet names | `Press Start 2P` or `Silkscreen` |

### Planet Rendering

- Drawn entirely on canvas — no image files
- Pixel-art / low-res aesthetic (chunky gradients, not photorealistic)
- Each planet recognizable by color/banding: Jupiter banded, Mars rusty red, Earth blue, Saturn with rings, etc.
- Subtle glow treatment: lit-from-within using Vibe Purple with transparency
- **No neon cyberpunk spam**

### Atmosphere

- Deep space black background
- Subtle randomised star field (static dots, varying opacity)
- CRT scanline overlay across the entire experience (low opacity, atmospheric not gimmicky)

---

## HUD

- **Scale ruler** fixed across the top of the viewport
  - Shows current distance from Sun in km and light-minutes
  - Planet name notches mark each body's position
  - Moving needle/indicator tracks scroll position
- **Mute/unmute button** — corner, minimal
- Nothing else. No header, no footer, no nav chrome.

---

## Audio

- Subtle haunting ambient space music — looping CC0 track (~1–2mb MP3)
- Starts on first scroll/touch (browser autoplay policy)
- Mute toggle in corner

---

## Page Structure

- **Full bleed dark page** — the canvas IS the page
- Opening tagline fades in before scroll begins (something like: *"If the Sun were this big... Pluto would be here →"*)
- No header, no footer

---

## End of Journey

After Pluto's info panel, a closing message card appears with:
- How much further to the **Oort Cloud inner edge** (~2,000 AU — ~50x this entire scroll)
- How much further to the **Oort Cloud outer edge** (~100,000 AU — ~2,500x)
- How much further to **Proxima Centauri** (~268,000 AU / 4.24 ly — ~6,700x)
- Framed in terms of "at this same scale, you would need to scroll X more"
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

## File Structure (target)

```
/
├── index.html
├── style.css
├── main.js
├── audio/
│   └── ambient.mp3
└── CLAUDE.md
```
