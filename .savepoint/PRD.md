---
type: project-prd
status: active
---

# Solar System at Scale — Product Vision

## What it is

Solar System at Scale is a single-page interactive web experience that turns vertical wheel, touch, or drag input into a horizontal journey from the Sun to Pluto. Planet positions share one AU-based distance axis so the time spent crossing empty space is part of the experience. Lightweight explanatory UI helps a general audience understand the scale without turning the page into a dashboard.

## Why

Most solar-system diagrams compress distance until neighbouring worlds appear close together. This project makes the separation tangible: the user must travel through the emptiness instead of reading a number beside a diagram. Its value is the combination of a memorable interaction, an honest scale explanation, and a visually distinctive portfolio piece.

## Target user

**Curious general audiences and portfolio visitors** — people who should understand the central scale relationship without prior astronomy knowledge.

Not: researchers seeking an orbital simulator, ephemeris, or physically exact scientific visualisation.

## Experience promise

The user should feel small, curious, and rewarded for continuing. The planet or other active body is always the visual subject; controls and facts remain supporting context. Copy is precise, brief, warm, and lightly self-aware.

## Headline differentiator

**The emptiness is interactive.** Proportional AU spacing makes distance a duration the visitor experiences rather than a fact they are told.

## Success metrics

- A visitor can travel from the Sun to Pluto using wheel, mouse drag, or touch without losing their position or encountering a blocked viewport.
- Every planet is recognisable in its focused presentation while the UI states honestly when size is visually enlarged.
- Desktop and 360px-wide mobile layouts keep the active body, ruler, and essential information readable without overlap.
- The default journey is silent, contains no unexpected playback, and respects reduced-motion preferences.
- The page remains a static Vercel deployment with no application framework or build step.

## Constraints

- Preserve the fixed AU-based horizontal distance axis and the Sun-to-Pluto journey.
- Preserve the static HTML, CSS, and vanilla JavaScript delivery model.
- Rendering may combine the existing 2D canvas with a lightweight native WebGL layer; no large model files or general-purpose 3D framework.
- Visual planet sizing may be enlarged for legibility only when the interface discloses that it is not on the distance scale.
- Pluto remains a planet in the voice and structure of this project.

## Out of scope

- No orbital-position simulator, live ephemeris, gravity, collisions, or spacecraft navigation.
- No accounts, saved state, backend, CMS, or user-authored content.
- No photorealistic renderer, cinematic post-processing stack, or large downloaded 3D models.
- No narration, soundtrack replacement, or additional educational modes in v1.
- No framework migration, bundler, or component library.
