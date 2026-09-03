---
id: E04-interface-motion-audio-cleanup/T004-validate-final-responsive-journey
status: planned
objective: Reconcile documentation and prove the silent responsive accessible v1 journey across rendering paths.
depends_on:
  - E04-interface-motion-audio-cleanup/T001-remove-ambient-audio
  - E04-interface-motion-audio-cleanup/T002-simplify-cards-and-scale-ui
  - E04-interface-motion-audio-cleanup/T003-calm-moon-and-interface-motion
complexity_tier: high
complexity_reason: Validates all v1 layers, inputs, viewports, accessibility, failures, assets, and performance together.
---

# T004: Validate the Final Responsive Journey

## Problem

The cleanup changes need integrated proof that the complete experience remains understandable, accessible, and performant.

## Context Files

- `.savepoint/releases/v1/epics/E04-interface-motion-audio-cleanup/E04-Detail.md`
- `.savepoint/PRD.md`
- `.savepoint/Design.md`
- `.savepoint/visual-identity.md`
- `.savepoint/Guardrails.md`
- `.savepoint/Health-Check.md`
- `AGENTS.md`
- `context.md`
- `index.html`
- `style.css`
- `main.js`
- `rendering/planet-renderer.js`
- `rendering/planet-materials.js`
- `vercel.json`

## Acceptance Criteria

- [ ] Wheel, mouse, and touch each complete/reverse Sun-to-Pluto at `1440×900` and `360×800`.
- [ ] Modes, snapping, one card, scale disclosure, belt passage, and closing state work normally and in fallback.
- [ ] Persistent UI does not block bodies/navigation; focus is visible and essential state is not colour-only.
- [ ] Reduced motion preserves navigation/information while suppressing governed decorative motion.
- [ ] No audio request occurs; remaining assets load and no uncaught console error appears.
- [ ] Combined WebGL respects DPR/instance bounds and the approved frame-time envelope.
- [ ] Product/design/context maps match runtime/file reality with no stale v1 claims.
- [ ] Full health, syntax, static-reference, and `git diff --check` gates pass.

## Implementation Plan

- [ ] Run desktop/mobile input and reverse-navigation scenarios.
- [ ] Exercise normal, unavailable-WebGL, context-loss, and reduced-motion paths.
- [ ] Inspect overlap, keyboard focus, non-colour cues, requests, console, and closing state.
- [ ] Capture combined performance/bound evidence.
- [ ] Reconcile documentation and record the Full health check for audit.

## Context Log

Pending.
