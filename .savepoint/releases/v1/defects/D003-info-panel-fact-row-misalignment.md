---
id: v1/D003-info-panel-fact-row-misalignment
release: v1
status: resolved
severity: low
title: "Info card's SIZE/HIGHLIGHT rows sit side-by-side at mismatched label widths instead of stacking cleanly"
reference: E04-interface-motion-audio-cleanup/T002-simplify-cards-and-scale-ui
---

# D003: Info Panel Fact Row Misalignment

## Symptom

The consolidated info card's two facts (`SIZE`, `HIGHLIGHT`) read as visually
uneven/wonky — the fact text after each label starts at a different
horizontal position, so the two rows don't line up.

## Expected Behavior

Each fact's label sits directly above its value as a clean stacked
label/caption pair, consistent with the same pattern already used elsewhere
in this UI (e.g. `#ruler-focus-card`'s label-above-value stack, `.closing-stat`'s
aligned label/value pairs).

## Reproduction

Root cause found by CSS inspection (no headless browser available in this
environment): `.fact` (`style.css:644`) is `display: flex` with no
`flex-direction` set, so it defaults to `row` — placing `.fact-label` and
`.fact-value` side by side. But `.fact-label` (`style.css:650`) carries
`display: block; margin-bottom: 3px`, styling written for a *stacked*
label-above-value layout, not a row. Because `.fact-label`'s rendered width
varies with its text ("SIZE" vs "HIGHLIGHT"), the two `.fact-value` texts
start at different x-offsets in the row layout, reading as misaligned. This
is pre-existing since T002 consolidated the card to two facts; the row/column
mismatch was not caught because no browser was available to visually confirm
the resulting layout in that task's Quick check either.

## Impact

Cosmetic only — affects the single info card shown for every planet, belt
marker, and probe, at both viewports. No effect on functionality, navigation,
or scale accuracy.

## Fix Plan

- Set `.fact { flex-direction: column; }` and drop `.fact`'s `gap: 10px`
  (that gap belongs between the two stacked facts, not between a fact's own
  label and value) so `.fact-label`'s existing `margin-bottom: 3px` supplies
  the tight label-to-value spacing.
- Keep `.info-facts`'s existing `gap: 10px` for spacing between the two
  fact blocks — unchanged.

## Acceptance Criteria

- [x] `SIZE` and `HIGHLIGHT` each render as a label stacked directly above
      its value, both left-aligned to the card edge.
- [x] Spacing between the two fact blocks is unchanged from before this fix.
- [x] `git diff --check` passes.

## Resolution Notes

Fixed in `style.css`: `.fact` changed from `display: flex; gap: 10px;
align-items: flex-start;` to `display: flex; flex-direction: column;
align-items: flex-start;` (dropped the row-only `gap: 10px`, which was
spacing intended for side-by-side items and is no longer needed once label
and value stack). `.fact-label`'s pre-existing `margin-bottom: 3px` now
supplies the intended tight label-to-value spacing, and `.info-facts`'s own
`gap: 10px` (unchanged) still spaces the two fact blocks apart. No HTML or
JS change needed — `index.html`'s markup and `main.js`'s `fact-size`/
`fact-highlight` population were already correct; only the flex axis was
wrong.

No live-browser confirmation was captured (no headless browser available in
this environment, consistent with every other E04 task/defect); the fix is a
single-property flex-axis correction verified by CSS box-model reasoning
against the already-working `#ruler-focus-card`/`.closing-stat` stacked-label
patterns elsewhere in this file.
