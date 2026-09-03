---
id: E04-interface-motion-audio-cleanup/T001-remove-ambient-audio
status: planned
objective: Remove ambient playback, its control and asset, and current-state documentation that promises audio.
depends_on:
  - E03-sparse-3d-asteroid-belt/T002-integrate-belt-orientation-and-fallback
complexity_tier: medium
complexity_reason: Deletes a runtime feature and asset across HTML, CSS, JavaScript, and documentation.
---

# T001: Remove Ambient Audio

## Problem

The current interaction starts ambient audio and exposes a mute control, contrary to the silent v1 requirement.

## Context Files

- `.savepoint/releases/v1/epics/E04-interface-motion-audio-cleanup/E04-Detail.md`
- `.savepoint/Design.md`
- `.savepoint/Guardrails.md`
- `.savepoint/Health-Check.md`
- `AGENTS.md`
- `context.md`
- `index.html`
- `style.css`
- `main.js`
- `audio/ambient.mp3`

## Acceptance Criteria

- [ ] Audio markup, playback state/listeners, startup calls, mute control, and audio CSS are absent.
- [ ] `audio/ambient.mp3` is intentionally deleted and no runtime path requests replacement audio.
- [ ] First wheel, mouse, or touch input dismisses the intro and navigates without playback errors.
- [ ] The full journey stays silent with no audio control at desktop or `360×800`.
- [ ] Codebase maps/current context no longer list audio; historical records remain truthful.
- [ ] No soundtrack, narration, settings panel, dependency, or new network flow is introduced.
- [ ] Syntax, static-reference, and `git diff --check` gates pass.

## Implementation Plan

- [ ] Remove audio markup, styling, state, listeners, and startup behavior.
- [ ] Delete the asset and scan runtime references.
- [ ] Verify intro dismissal and every input path without playback side effects.
- [ ] Update current-state maps/context and record deletion and browser evidence.

## Context Log

Pending.
