---
type: epic-design
status: audited
---

# E04: Interface, Motion, and Audio Cleanup

## Purpose

Let the solar system dominate the experience by reducing interface weight, calming moon movement, and removing audio.

## Planned value

- Replace three-fact emoji cards with one compact card containing at most two useful facts.
- Show only one active probe card and demote or remove the always-expanded Scale Lab.
- Slow moon orbits with a shared time scale and a minimum visual orbit duration.
- Remove ambient audio, its asset, playback code, and mute control.
- Validate responsive layout, keyboard focus, reduced-motion behavior, and the complete Sun-to-Pluto journey.

## Dependencies

- E01 defines content and accessibility policy.
- E02 and E03 establish the final visual layering and performance envelope.

## Boundaries

No new educational modes, narration, settings panel, or replacement soundtrack.

## Open decisions

None. Cards use `SIZE` and `HIGHLIGHT`; Scale Lab remains behind a collapsed-by-default `SCALE` disclosure.
