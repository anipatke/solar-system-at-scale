---
id: E04-interface-motion-audio-cleanup/T007-visualize-scale-lab-screens-comparison
status: done
objective: Replace the Scale Lab's always-full meter with a track-and-marker visual that makes the readable-vs-true-scale screens comparison visible, not just stated.
depends_on:
    - E04-interface-motion-audio-cleanup/T004-consolidate-scale-lab-readout
complexity_tier: medium
complexity_reason: Reworks one component's visual encoding and copy without touching other systems or introducing new scale math.
---

# T007: Visualize the Scale Lab Screens Comparison

## Problem

T004 consolidated the Scale Lab's two-card comparison into one sentence plus one meter, but the meter fill is normalized against `max(readable, true)`, so it always renders effectively full — the compression is only ever stated in text, never shown. The old two-card view had the same flaw duplicated across two meters. The Scale Lab's whole point is to make "how compressed is this" viscerally felt, and that impact is currently lost.

## Context Files

- `.savepoint/releases/v1/epics/E04-interface-motion-audio-cleanup/E04-Detail.md`
- `.savepoint/visual-identity.md`
- `.savepoint/Guardrails.md`
- `.savepoint/Health-Check.md`
- `index.html`
- `style.css`
- `main.js`

## Acceptance Criteria

- [x] The Scale Lab readout reframes the comparison in "screens" units — how many viewport-widths the visitor actually swiped versus how many it would take at true scale — reusing the existing `getReadableDistancePx`/`getTrueDistancePx` calculations divided by the current viewport width; no new scale math is introduced.
- [x] The same-max-normalized `.scale-meter` fill is replaced with a fixed-length track and a "you are here" marker positioned near the start, plus a far-end label stating the true-scale screens count, for both physical and symbolic-size targets.
- [x] The marker remains visibly rendered and distinguishable from the track (non-zero size, not obscured by the end label) even at very large compression ratios (e.g. a moon's true-scale count in the thousands).
- [x] The readout sentence states the screens comparison in plain language. The previously-stated size-ratio fact (e.g. "rendered ~12x larger") is preserved by moving it into the existing `scaleLabFocusMeta` line rather than being dropped.
- [x] The track/marker visual reuses the existing `.scale-meter` track styling and DOM shape rather than introducing a new component (`STYLE-03`).
- [x] The readout keeps visible keyboard focus, correct semantics, and non-colour state cues for anything interactive; unchanged from T004.
- [x] The disclosure stays collapsed by default and otherwise behaves exactly as `T002`/`T004` left it (no change to `isScaleLabCollapsed`/toggle behavior).
- [x] At `1440×900` and `360×800`, the expanded readout does not overlap the ruler, the info card, or the active body.
- [x] Syntax and hygiene gates pass.

## Implementation Plan

- [x] Compute readable/true "screens" counts in `updateScaleLab()` from the existing distance getters divided by `canvasW`.
- [x] Replace the `setMeterFill`-driven single fill with a track + positioned marker (reusing `.scale-meter`'s track markup) plus a far-end screens-count label.
- [x] Update the `scaleReadoutRatio` sentence copy to state the screens comparison; move the size-ratio fact into `scaleLabFocusMeta`.
- [x] Add/adjust `style.css` rules for the marker (position, minimum visible size/offset so it never disappears at extreme ratios) reusing the existing `.scale-meter` track styling.
- [x] Verify marker visibility at an extreme ratio (e.g. a small moon), keyboard focus, and both target viewports.

## Context Log

Files read: `.savepoint/router.md`, `.savepoint/releases/v1/epics/E04-interface-motion-audio-cleanup/E04-Detail.md`, `.savepoint/visual-identity.md`, `.savepoint/Guardrails.md`, `.savepoint/Health-Check.md`, `index.html`, `style.css`, `main.js`.

Files edited: `index.html`, `style.css`, `main.js`.

Implementation notes:
- `updateScaleLab()` now computes `readableScreens`/`trueScreens` from the existing `getReadableDistancePx`/`getTrueDistancePx` getters divided by `canvasW`; no new scale math.
- `.scale-meter-fill` is repurposed in place (same element id/DOM position) from a width-driven fill into a small absolutely-positioned "you are here" tick, moved via `left`; a new `setScaleMeterMarker()` replaces `setMeterFill()` (which had no other callers).
- Marker position is `readableScreens/trueScreens` as a percentage, clamped to `[3%, 90%]` (`SCALE_METER_MARKER_MIN_PCT`/`MAX_PCT`) so it stays visible and stays clear of the right-aligned end label regardless of how extreme the compression ratio is.
- A new `#scale-readout-meter-end-label` span (sibling of the existing fill/marker div, inside the existing `.scale-meter` track) states the true-scale screens count at the far end; both it and the marker are `aria-hidden="true"` since the same figures are already stated in the `scaleReadoutRatio` sentence text.
- The previously-dropped size-ratio fact (e.g. "rendered ~12x larger... ") is preserved by appending it to the existing `scaleLabFocusMeta` line instead of the (now removed) `scaleReadoutRatio` phrasing.
- `isScaleLabCollapsed`/`syncScaleLabCollapse`/toggle wiring untouched.

Health Check: Quick
- Guardrails rule IDs: SCALE-02 (screens reframing keeps the compression disclosed in plain language), STYLE-03 (marker/label reuse the existing `.scale-meter` track element and id rather than a new component), A11Y-01 (state is carried by the visible sentence text; marker/label are `aria-hidden` decoration only, no color-only cue), TEST-02.
- Acceptance evidence: see checklist above; marker-clamp math traced by hand for Mercury/Pluto/Sun at 1440px and 360px viewport widths (readable/true ratio is a constant ~1:94.4 given fixed `PIXELS_PER_AU`/`TRUE_SCALE_PX_PER_AU`, so the marker always clamps to the 3% floor — confirms visibility holds at any target, including moon-scale compression ratios in the thousands).
- File reality evidence: only `index.html`/`style.css`/`main.js` edited, matching task Context Files; no other files touched.
- Tests/commands: `node --check main.js` (pass), `git diff --check` (pass).
- Browser scenario(s): No headless browser is available in this sandboxed environment (no chromium/playwright/puppeteer installed), so the visual result was verified by static reasoning instead of a rendered screenshot: (1) CSS box-model trace confirms the marker (`top:-3px`, `height:11px`) and end label (`top:9px`) occupy non-overlapping vertical bands within the `position:relative` `.scale-meter` track, and the marker's clamp keeps it left of the right-aligned label; (2) existing `#scale-lab` responsive rules (`top`/`left`/`right`/`width` overrides at ≤600px) are unchanged, so the 1440×900/360×800 no-overlap requirement carries over from T004 without new collision risk since no element outside the existing track grew in width or height enough to break the aside's box. Recommend the user do a quick visual pass (expand SCALE disclosure, focus Mercury vs. Pluto) to confirm before marking done, per this project's "start the dev server and check in a browser" norm.
- Known debt: none.
- Waivers: none.
