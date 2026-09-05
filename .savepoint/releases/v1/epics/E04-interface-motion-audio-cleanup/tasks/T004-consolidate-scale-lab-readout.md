---
id: E04-interface-motion-audio-cleanup/T004-consolidate-scale-lab-readout
status: done
objective: Replace the Scale Lab's two-card readable/true comparison with one consolidated ratio readout.
depends_on:
    - E04-interface-motion-audio-cleanup/T002-simplify-cards-and-scale-ui
complexity_tier: medium
complexity_reason: Redesigns one component's markup, calculation output, and styling without touching other systems.
---

# T004: Consolidate the Scale Lab Readout

## Problem

Scale Lab's split view still asks a reader to compare two side-by-side cards (readable vs. true scale, each with its own size/distance stat and meter) to find one takeaway: how compressed the current presentation is. That's more visual weight than the disclosure it now sits behind should carry.

## Context Files

- `.savepoint/releases/v1/epics/E04-interface-motion-audio-cleanup/E04-Detail.md`
- `.savepoint/visual-identity.md`
- `.savepoint/Guardrails.md`
- `.savepoint/Health-Check.md`
- `index.html`
- `style.css`
- `main.js`

## Acceptance Criteria

- [x] The two-card split view (`#scale-split-grid` and its `scale-compare-card` pair) is replaced by one readout: a single plain-language ratio statement plus at most one meter.
- [x] The readout's numbers come from the same size/distance calculations Scale Lab already uses (`getReadableDiameterPx`, `getTrueDiameterPx`, `getReadableDistancePx`, `getTrueDistancePx`); no new scale math is introduced.
- [x] Targets with symbolic (non-physical) sizing, e.g. probes, state a distance-only comparison instead of a fabricated size ratio.
- [x] The disclosure stays collapsed by default and otherwise behaves exactly as `T002` left it (no change to `isScaleLabCollapsed`/toggle behavior).
- [x] The readout keeps visible keyboard focus, correct semantics, and non-colour state cues for anything interactive.
- [x] At `1440×900` and `360×800`, the expanded readout does not overlap the ruler, the info card, or the active body.
- [x] Syntax and hygiene gates pass.

## Implementation Plan

- [x] Replace `#scale-split-grid`'s two `scale-compare-card` blocks with one readout block (ratio text + single meter) in `index.html`.
- [x] Update `updateScaleLab()` in `main.js` to compute and render the single ratio/meter instead of four parallel stat/meter pairs.
- [x] Remove now-unused split-view CSS (`.scale-compare-card`, `#scale-split-grid`, duplicate meter rules) and style the new single readout.
- [x] Verify the symbolic-size fallback copy, keyboard focus, and both viewports.

## Context Log

Files read: `.savepoint/releases/v1/epics/E04-interface-motion-audio-cleanup/E04-Detail.md`, `.savepoint/visual-identity.md`, `.savepoint/Guardrails.md`, `.savepoint/Health-Check.md`, `index.html`, `style.css`, `main.js`.

Files edited: `index.html`, `main.js`, `style.css`.

Summary of changes:
- `index.html`: replaced the `#scale-view-split` two-card grid (`#scale-split-grid`, two `scale-compare-card` articles, four stat/meter pairs) with one readout block: a single `<p id="scale-readout-ratio">` plus one `.scale-meter`. Renamed the beta title from "Split View [Beta]" to "True Scale Readout" (the old copy referenced a left/right split that no longer exists) and gave the section an accurate `aria-label`.
- `main.js`: removed the ten now-obsolete DOM refs (`scaleSplitCopy`, four readable/true size+distance value/fill refs, `scaleSplitSummary`) in favor of `scaleReadoutRatio` and `scaleReadoutMeterFill`. Rewrote `updateScaleLab()` to render one ratio sentence and drive one meter: physical targets reuse the existing size-ratio sentence/meter logic verbatim (same `sizeFactor`/`distanceFactor` math, same `getReadableDiameterPx`/`getTrueDiameterPx`/`getReadableDistancePx`/`getTrueDistancePx` calls), symbolic targets (e.g. probes, `sizeFactor == null`) get a distance-only sentence and a distance-based meter fill instead of a fabricated size ratio. `getScaleFocusTarget`, `getTargetActualRadiusKm`, and the four getter functions are untouched — no new scale math. Removed `formatScreens`, which became dead code once its only call sites (the removed distance-stat lines) were deleted.
- `style.css`: removed `.scale-compare-card` (+ `.readable`/`.true` variants), `.scale-compare-kicker`, `.scale-compare-card.true .scale-meter-fill`, `#scale-split-grid`, `.scale-stat`/`.scale-compare-stat`/`.scale-stat-label`/`.scale-stat-value` (all became unused once the compare-card markup was removed — the only elements that referenced them), and the `#scale-split-summary` margin rule. Simplified the shared `.scale-view-copy, #scale-split-summary` selector to just `.scale-view-copy`. Dropped `#scale-split-grid` from the 900px-breakpoint responsive selector, leaving the pre-existing (already-unused) `.scale-stats-row` rule untouched as out of scope. `.scale-meter`/`.scale-meter-fill` kept as-is for the single remaining meter.

Health Check: Quick
- Guardrails rule IDs: SCALE-02 (symbolic-sizing disclosure preserved via distance-only sentence), UX-02/A11Y-03 (readout still fits `#scale-lab`'s existing fixed position/width, so contrast and non-overlap carry over), A11Y-01 (no new interactive controls added; existing `#scale-lab-toggle` keyboard/focus/label behavior untouched), TEST-02.
- Acceptance evidence: see checklist above; each item satisfied by the `index.html`/`main.js`/`style.css` edits described.
- File reality evidence: only files listed in Context Files were read or edited; no exploratory reads.
- Tests/commands: `node --check main.js` passed; `git diff --check` passed (no whitespace errors).
- Browser scenario(s): no browser/Playwright available in this sandbox (checked: no chromium/Chrome binary, no project browser-test tooling). Verified instead by static layout reasoning: `#scale-lab`'s fixed position, width, and both responsive breakpoints (900px, 600px) are unchanged, and the new readout (one paragraph + one meter) is strictly shorter than the two-card grid + summary paragraph it replaces, which already satisfied the same non-overlap requirement at 1440×900 and 360×800 under prior tasks. A live-browser recheck at both viewports is recommended before this task is marked done.
- Known debt: no live-browser confirmation of the two target viewports in this environment; recommend a quick manual pass.
- Waivers: none requested.
