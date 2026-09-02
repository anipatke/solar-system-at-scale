---
type: visual-identity
status: active
last_audited: never
---

# Solar System at Scale — Visual Identity

## Design character

The experience is **Atari-noir astronomy**: deep black space, warm off-white typography, restrained Vibe Purple accents, and simple instrumentation surrounding one strong celestial subject. Retro cues come from typography, sparse scanlines, and deliberate motion—not from making the planets look crude.

## Palette

| Token | Value | Use |
|---|---|---|
| Background | `#121212` | Space and full-screen transitions |
| Surface | `#0D0D0D` | Primary panels |
| Surface 2 | `#0F0F0F` | Secondary depth |
| Border | `#1A1A1A` | Quiet structure |
| Border strong | `#222222` | Active separators |
| Text | `#F0E6DA` | Primary copy |
| Vibe Purple | `#B1A1DF` | Active target and scale emphasis |
| Probe Green | `#A4C639` | Probe-only state |

Large interface surfaces remain near-black. Accent colours identify state and should not wash the scene in neon glow. Planet materials use body-specific natural colour families rather than the interface accent palette.

## Typography

- `Chakra Petch`: titles, planet names, and prominent measurements.
- `Space Mono`: body copy and functional readouts.
- `Press Start 2P`: very short labels and ruler details only; never paragraph text.
- Uppercase and tracking are reserved for labels and headings. Explanatory copy uses normal sentence rhythm.

## Visual hierarchy

1. Focused celestial body
2. Distance and position on the journey
3. Body name and up to two facts
4. Optional explanation or secondary mode

The interface must not surround the scene with equally weighted cards. Borders, glows, scanlines, and labels become quieter as content density increases.

## Planet and asteroid direction

- Planets are lightweight 3D spheres with restrained directional light, soft ambient fill, and recognisable materials.
- Surface texture carries identity: Jupiter needs layered cloud bands and its Great Red Spot; Earth needs land/ocean/cloud separation; Saturn needs a dimensional ring plane.
- Focus enlargement should feel like inspection, not a bouncing game reward.
- Asteroids are sparse, irregular, non-glowing rocks at varied depths. The belt must never read as fog, a wall, or a dense collision field.
- Photorealism is not the goal; coherent volume, material, and light are.

## Interface patterns

- The information card is a quiet caption: name, type or category, and no more than two concise facts.
- Emoji are not used as fact-list decoration.
- The ruler remains the primary persistent instrument.
- Scale explanation is available but subordinate; it must not permanently occupy the visual weight of a planet.
- The default experience contains no audio control because the v1 journey is silent.

## Motion

- Camera movement is smooth and weighty, with no elastic or bouncy easing.
- Planet rotation communicates volume and remains slow enough to inspect.
- Moon movement is calm; short real orbital periods do not produce frantic screen motion.
- Asteroid rotation varies subtly and does not synchronise.
- `prefers-reduced-motion` removes decorative rotation, twinkle, and long transitions while preserving navigation and focus changes.

## Responsive and accessible presentation

- At 360px width, persistent UI must leave a clear central scene region and avoid stacked cards over the active body.
- Essential text meets WCAG AA contrast against its rendered surface.
- Modes and disclosures have keyboard focus states and do not rely on colour alone.
- Scale exceptions are stated in plain language wherever a focused body is enlarged.

## Copy voice

Warm, precise, direct, and lightly self-aware. Prefer one concrete comparison over three novelty facts. Humour may punctuate the journey but must not undermine scientific credibility.
