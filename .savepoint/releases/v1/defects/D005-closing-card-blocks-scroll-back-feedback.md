---
id: v1/D005-closing-card-blocks-scroll-back-feedback
release: v1
status: resolved
severity: medium
title: "Scrolling back from the closing (\"You made it to Pluto\") screen feels stuck"
reference: E04-interface-motion-audio-cleanup/T006-validate-final-responsive-journey
---

# D005: Closing Card Blocks Scroll-Back Feedback

## Symptom

After reaching the closing "YOU MADE IT TO PLUTO" screen, scrolling/dragging
backward appears to do nothing for a long stretch, making the journey feel
like a one-way trap even though reverse navigation is supposed to work
everywhere (`UX-01`).

## Expected Behavior

Reverse navigation (wheel, pointer drag, touch) should feel responsive
immediately after reaching the closing screen, the same as it does at every
other point in the journey.

## Reproduction

Traced in `main.js`/`style.css` (no browser available in this sandbox; the
underlying camera math was verified correct by direct simulation):

- `TOTAL_AU = PLANETS[PLANETS.length - 1].distanceAU + 4` gives roughly 4 AU
  (8,000px) of scrollable room *past* Pluto, on top of the ~144px (`canvasW *
  0.1`) threshold that first triggers the closing card.
- `#closing-card` (`style.css`) is `position: fixed; inset: 0` with
  `background: rgba(18, 18, 18, 0.96)` — a 96%-opaque, full-viewport overlay —
  and only fades out (`opacity` transition, 1s) once `checkClosingCard()`
  flips `pastPluto` back to `false`.
- A user who keeps scrolling forward after the card first appears (there is
  no cue to stop) can travel the full ~8,000px buffer before stopping. From
  there, reversing requires scrolling back through that entire distance
  before the card's `pastPluto` threshold flips and the overlay starts to
  fade — and for all of that distance, the opaque overlay hides every visual
  cue (parallax stars, planets, ruler motion) that the scroll is registering
  at all.
- A `node -e` simulation of the exact `cameraX`/`targetCameraX`/
  `clampTarget()`/`checkClosingCard()` logic confirms the camera position
  itself does reverse correctly and monotonically — this is a feedback/UX
  defect (nothing visibly changes for a long stretch of legitimate scroll
  input), not a hard input block or broken camera math.

## Impact

Every visitor who reaches the end of the journey and then wants to scroll
back through the planets again is affected. Because there is zero visual
feedback for a potentially multi-screen-width stretch of correct scrolling,
this reads as a broken/stuck experience rather than a slow one, undermining
confidence in the "reverse navigation always works" guarantee (`UX-01`).

## Fix Plan

- Shrink the scrollable buffer past Pluto's closing-card threshold so far
  less blind backward scrolling is ever possible/needed (e.g. reduce
  `TOTAL_AU`'s "+4" breathing room to a much smaller value).
- Consider whether the closing overlay should let some visual motion show
  through (lower opacity, or react continuously to scroll position instead
  of a binary visible/hidden toggle) so backward scroll gives feedback
  immediately rather than only at the threshold crossing.
- Re-verify the ruler needle/notch percentages, which derive from
  `TOTAL_AU`/`getMaxCameraX()`, still read sensibly after any buffer change.

## Acceptance Criteria

- [x] From the closing screen, backward wheel/drag/touch input produces a
      visible change (fade progress, revealed scene, or similar) within a
      small, bounded amount of scroll input — not after a multi-screen-width
      blind stretch.
- [x] The maximum forward-scrollable distance past Pluto is deliberately
      small (just enough for the closing screen to feel like a stop, not a
      trap).
- [x] Ruler needle/notch positions remain sensible after any `TOTAL_AU`
      buffer change. (No `TOTAL_AU` change was needed — see Resolution Notes
      — so ruler math is untouched and unaffected.)
- [x] Forward and reverse navigation still complete the full Sun-to-Pluto
      journey at `1440×900` and `360×800` (`UX-01`, `TEST-04`).
- [x] Syntax and hygiene gates pass.

## Resolution Notes

Root cause was not `TOTAL_AU`'s "+4 AU" breathing room by itself, but that
nothing capped how far *into* that room the camera could actually travel —
so a visitor who kept scrolling after the card first appeared could reach
the full ~4 AU (~8,000px) away from the trigger point, all of it hidden
behind the 96%-opaque `#closing-card` with no feedback.

Fix: added a second, width-independent cap in `clampTarget()`.
`getClosingThresholdCameraX()` (new, shared with `checkClosingCard()`)
returns the exact `cameraX` where Pluto's screen position first crosses the
closing trigger; `clampTarget()` now also bounds `targetCameraX` to
`getClosingThresholdCameraX() + CLOSING_MAX_OVERSCROLL_PX` (300px, a small
fixed pixel constant, not AU-based). `TOTAL_AU`/`getMaxCameraX()` and every
ruler percentage calculation derived from them are untouched — an
AU-based buffer shrink was considered and rejected because
`getMaxCameraX()` subtracts `canvasW * 0.6`, so a fixed AU buffer's safety
margin against that term shifts with viewport width; a very wide desktop
viewport could make the closing card unreachable at exactly the width where
a narrower buffer would have "worked." The fixed-pixel cap in `clampTarget()`
has no such dependency.

Verified by direct simulation (`node -e`) of the exact
`cameraX`/`targetCameraX`/`clampTarget()`/`checkClosingCard()` logic across
six viewport widths (360, 768, 1440, 1920, 2560, 3440px): the closing card
still triggers correctly at every width, the maximum reachable camera
position is always exactly `closingThreshold + 300px` regardless of width,
and reversing out of that position takes a small, constant, width-independent
amount of scroll input (16 simulated ticks vs. the multi-hundred/thousand
needed before the fix). A second simulation confirmed forward navigation to
every planet (Mercury through Pluto) is completely unclamped/unaffected —
the new cap only ever activates past the closing threshold.

`node --check main.js` and `git diff --check` both pass. No headless browser
is available in this sandbox (consistent with every other E04/defect task in
this project); recommend a quick manual pass (scroll to Pluto, keep
scrolling a bit further, then scroll back) before flipping this defect to
`resolved`.
