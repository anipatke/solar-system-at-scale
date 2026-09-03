---
id: E04-interface-motion-audio-cleanup/T002-simplify-cards-and-scale-ui
status: planned
objective: Replace competing panels with one two-fact card and move Scale Lab behind an optional disclosure.
depends_on:
  - E03-sparse-3d-asteroid-belt/T002-integrate-belt-orientation-and-fallback
complexity_tier: high
complexity_reason: Redesigns content data, selection, semantic controls, responsive layout, and factual evidence.
---

# T002: Simplify Cards and Scale UI

## Problem

Three emoji facts, two possible probe panels, and expanded Scale Lab compete with the active body.

## Context Files

- `.savepoint/releases/v1/epics/E04-interface-motion-audio-cleanup/E04-Detail.md`
- `.savepoint/PRD.md`
- `.savepoint/visual-identity.md`
- `.savepoint/Guardrails.md`
- `.savepoint/Health-Check.md`
- `index.html`
- `style.css`
- `main.js`

## Acceptance Criteria

- [ ] One reusable card shows at most two text facts for any planet, belt marker, or probe.
- [ ] Canonical facts are `SIZE` and `HIGHLIGHT`; decorative fact emoji and the secondary card are absent.
- [ ] Changed astronomical or mission claims name authoritative sources in task evidence.
- [ ] Probe mode deterministically chooses one nearest eligible probe and never overlaps cards.
- [ ] Scale Lab is collapsed by default behind a semantic `SCALE` disclosure.
- [ ] Controls support keyboard use, visible focus, correct semantics, and non-colour state cues.
- [ ] At `1440×900` and `360×800`, card, ruler, disclosure, and active body avoid persistent overlap.
- [ ] Mode switching, snapping, disclosure, syntax, and hygiene checks pass.

## Implementation Plan

- [ ] Consolidate fact data into sourced `size` and `highlight` fields.
- [ ] Replace duplicate card markup/state with one semantic card.
- [ ] Make overlapping probe selection deterministic.
- [ ] Put Scale Lab behind a collapsed disclosure.
- [ ] Tune responsive/focus styling and verify content, keyboard, modes, and viewports.

## Context Log

Pending.
