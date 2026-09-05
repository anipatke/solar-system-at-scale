---
id: E04-interface-motion-audio-cleanup/T008-restore-smell-and-add-screens-facts
status: in_progress
stage: build
objective: Expand the info card from two facts to four by restoring a SMELLS LIKE fact for every body and adding a computed screens-traveled-vs-true-scale fact for planets and probes.
depends_on:
  - E04-interface-motion-audio-cleanup/T002-simplify-cards-and-scale-ui
  - E04-interface-motion-audio-cleanup/T004-consolidate-scale-lab-readout
complexity_tier: medium
complexity_reason: Multi-file change combining new flavor-copy authoring with one new computed fact and a fourth card row/layout adjustment.
---

# T008: Restore Smells Like and Add a Screens-Traveled Fact

## Problem

T002 cut the info card down to two facts (`SIZE`, `HIGHLIGHT`) to satisfy `CONTENT-01`'s prior two-fact cap, dropping the whimsical `smell` fact that PROBES used to carry (e.g. Parker Solar Probe: *"Overcaffeinated. Very hot. Still committed to the bit."*). The owner wants that flavor back for every body, plus a new fourth fact that makes the journey's compression concrete per body: how many screens the visitor actually swiped to reach this target versus how many it would take at true, uncompressed scale. `CONTENT-01` has already been raised from two to four concise facts to make room for both (`.savepoint/Guardrails.md`).

**Scope correction:** `ASTEROID_BELT` (`main.js`, `id: 'asteroid-belt'`) already has its own focusable card with the same `facts: {size, highlight}` shape as `PLANETS` entries — it is not the same as `CERES`, which is a separate, deliberately non-focusable, card-less landmark (E03 T002 AC1) and must stay untouched by this task. Treat `ASTEROID_BELT` as part of "planets" scope for both new facts.

## Context Files

- `.savepoint/releases/v1/epics/E04-interface-motion-audio-cleanup/E04-Detail.md`
- `.savepoint/visual-identity.md`
- `.savepoint/Guardrails.md`
- `.savepoint/Health-Check.md`
- `index.html`
- `style.css`
- `main.js`

## Acceptance Criteria

- [x] Every `PLANETS` entry (Sun through Pluto), `ASTEROID_BELT`, and every `PROBES` entry has a `smellsLike` (or equivalently named) fact. The four existing probe lines (Parker, Solar Orbiter, OSIRIS-APEX, Juno) are restored verbatim from git history (`git log -S"smell" -- main.js`) rather than rewritten. New copy for the Sun, each planet, and the belt matches the existing warm/precise/lightly-self-aware voice (`.savepoint/visual-identity.md` Copy voice) and does not read as a sourced scientific claim (no `SCALE-03` citation needed — this fact is deliberately flavor, not astronomy, exactly like the original probe lines).
- [x] Every `PLANETS` entry (including the Sun, where the value is the degenerate reference-point case) and every `PROBES` entry gets a computed "screens" fact stating screens swiped to reach this target versus screens it would take at true scale, reusing the same distance calculations Scale Lab already uses (`getReadableDistancePx`/`getTrueDistancePx`) divided by the current viewport width; no new scale math is introduced. `ASTEROID_BELT` gets this fact too, consistent with the scope correction above.
- [x] The Sun's degenerate case (`distanceAU: 0`, so both screens values are 0) is handled with a clear, non-broken presentation rather than a confusing "0 / 0" — implementer's choice, recorded with rationale in the Context Log.
- [x] The info card renders all four facts (`SIZE`, `DISTANCE` — renamed from `HIGHLIGHT` mid-task per explicit user request, see Context Log — `SMELLS LIKE`, and the new screens fact) legibly at `1440×900` and `360×800` without overlapping the ruler, Scale Lab, or active body, extending `D003`'s corrected stacked label/value layout to a fourth row.
- [x] The screens-fact computation is exposed as one reusable function rather than inlined, so `T007`'s planned Scale Lab track/marker visual can share it instead of duplicating the math (`STYLE-03`).
- [x] Probe mode's single-card behavior (T002) and Scale Lab's collapsed-by-default behavior (T002/T004) are unchanged.
- [x] Syntax and hygiene gates pass.

## Implementation Plan

- [x] Restore the four probe `smell` lines verbatim from git history; author new `smellsLike` copy for the Sun, each of the nine planets, and `ASTEROID_BELT`.
- [x] Write one shared screens-comparison function (e.g. `getScreensComparison(target)`) returning both the readable and true-scale screen counts, reusing existing distance getters; decide and document the Sun's degenerate-case presentation.
- [x] Add the fourth fact row to `index.html`'s `#info-panel` markup and wire both new facts through `showInfoCard`/`updateScaleLab`'s existing per-target update path in `main.js`.
- [x] Extend `style.css`'s `.info-facts`/`.fact` styling (already corrected in `D003`) to a clean four-row stack at both target viewports.
- [x] Verify probe-mode single-card behavior, Scale Lab collapse behavior, keyboard focus, and both viewports are unchanged.

## Context Log

Files read: `.savepoint/router.md`, `AGENTS.md`, `context.md`, `.savepoint/releases/v1/epics/E04-interface-motion-audio-cleanup/E04-Detail.md`, `.savepoint/visual-identity.md`, `.savepoint/Guardrails.md`, `.savepoint/Health-Check.md`, `index.html`, `style.css`, `main.js`, `git log -S"smell" -- main.js` and `git show b9ff8b5 -- main.js` for the verbatim probe lines, `.savepoint/releases/v1/epics/E04-interface-motion-audio-cleanup/tasks/T004-consolidate-scale-lab-readout.md` and `T007-visualize-scale-lab-screens-comparison.md` for prior Scale Lab context.

Files edited: `main.js`, `index.html`.

Implementation notes:
- Restored the four probe `smellsLike` lines verbatim from commit `b9ff8b5` (Parker: "Overcaffeinated. Very hot. Still committed to the bit."; Solar Orbiter: "Busy, sunstruck, and trying to keep every instrument pointed right."; OSIRIS-APEX: "Slightly smug. Already pulled off one asteroid job and wants another."; Juno: "Icy, battered, and absolutely locked in on giant storms.").
- Authored new `smellsLike` copy for the Sun, all nine planets, and `ASTEROID_BELT` — flavor lines grounded in a real, checkable atmospheric/surface fact per body (e.g. Venus's sulfuric acid clouds, Jupiter/Uranus's hydrogen-sulfide "rotten egg" smell, Mars's iron oxide dust) but phrased as warm/lightly-self-aware voice, not a sourced scientific claim, matching the existing probe lines' register. `CERES` was left untouched (E03 T002 AC1: no facts, no card, out of scope).
- Added `getScreensComparison(target)` (`main.js`), a single reusable function returning `{ readableScreens, trueScreens }` from the existing `getReadableDistancePx`/`getTrueDistancePx` getters divided by `canvasW` — no new scale math. `updateScaleLab()` was refactored to call it instead of its previous inline division (removed the now-redundant local `readableDistancePx` var, kept `trueDistancePx` since `scaleLabFocusMeta` still needs it), satisfying `STYLE-03` reuse for `T007`'s already-landed Scale Lab readout.
- Added `getScreensFactText(target)` for the info card: for the Sun (`distanceAU === 0`, where both screens counts are always 0) it returns the plain-language "The reference point — 0 screens either way" instead of a "0 / 0"-style output; every other target gets `"<readable> swiped here · <true> at true scale"` via the existing `formatScreens()` helper.
- `showInfoCard()` now sets `factSmell.textContent = target.facts.smellsLike` and `factScreens.textContent = getScreensFactText(target)` alongside the existing `factSize`/`factHighlight` assignments.
- Added `updateInfoCardScreens()`, called once per frame from the main `loop()` right after `checkInfoPanel()` (mirroring `updateScaleLab()`'s own per-frame refresh) so the SCREENS fact stays correct across a window resize even when the active target hasn't changed — `canvasW` feeds directly into the screens math and nothing else previously kept that fact live outside a target-identity change.
- `index.html`: added two new `.fact` rows (`SMELLS LIKE` → `#fact-smell`, `SCREENS SWIPED` → `#fact-screens`) inside the existing `#info-panel .info-facts` block, updated its stale "at most two facts" comment.
- `style.css`: no changes needed. `.info-facts`/`.fact` (`display:flex; flex-direction:column; gap:10px`) is already row-count-agnostic from prior D003/T007 work — confirmed no `nth-child` or fixed-height rule assumes two facts, so a third and fourth row extend the same stack cleanly.
- Probe mode's single-card path (`showInfoCard(nearest, 'probes')` in `checkInfoPanel()`) and Scale Lab's `isScaleLabCollapsed`/`syncScaleLabCollapse` wiring are untouched by this task's diff.

Health Check: Quick
- Guardrails rule IDs: CONTENT-01 (four facts, at the cap, not over it), CONTENT-02 (new smell copy stays warm but keeps a real physical/atmospheric anchor per body rather than trading credibility for novelty), SCALE-02 (screens fact keeps the compression disclosed in plain language, including the Sun's degenerate case), STYLE-03 (`getScreensComparison` is the single shared function behind both the info card and `updateScaleLab()`), A11Y-03 (new fact rows reuse the existing `.fact-label`/`.fact-value` classes and contrast tokens, no new colors introduced), TEST-02.
- Acceptance evidence: see checklist above; each AC satisfied by the `main.js`/`index.html` edits described in Implementation notes.
- File reality evidence: only `index.html`/`main.js` were edited (style.css read but not changed — verified unnecessary); no files outside the task's `## Context Files` were read or edited, aside from the git-history commands the AC explicitly directs to (`git log -S"smell"`, `git show b9ff8b5`).
- Tests/commands: `node --check main.js` (pass), `git diff --check` (pass).
- Browser scenario(s): no headless browser is available in this sandboxed environment (no chromium/chrome/playwright binary found), consistent with prior E04 tasks (T004, T007). Verified instead by static reasoning: (1) traced `checkInfoPanel()`/`showInfoCard()`/`updateInfoCardScreens()` call order for both a planet (`ASTEROID_BELT` included via the `[...PLANETS, ASTEROID_BELT]` nearest-search) and a probe, confirming all four `fact-*` elements receive text on every target change and on every frame thereafter; (2) traced the Sun case specifically (`distanceAU === 0`) through `getScreensFactText` to confirm it returns the degenerate-case sentence, never `formatScreens(0)`; (3) box-model trace of `.info-panel` (`position:fixed; bottom:24px/12px`) plus `.info-facts`'s unchanged flex-column stack shows a third/fourth row only grows the panel upward from its bottom anchor — at `1440×900` this stays far short of the ruler/Scale Lab (both top-anchored) and the vertically-centered planet; at `360×800` (mobile `.info-panel` override: `bottom:12px; left/right:12px`) the longest `smellsLike`/`fact-screens` strings wrap to at most two lines at 11px in the ~300px usable width, keeping total panel height well clear of `#ruler` (118px, top-anchored) and the collapsed `#scale-lab` (top:136px). Recommend the user do a quick visual pass (scrub through a few planets, a probe, and the Sun at both viewports) to confirm before marking done, per this project's "start the dev server and check in a browser" norm.
- Known debt: no live-browser confirmation of the two target viewports in this environment; recommend a quick manual pass, especially to eyeball the Sun's degenerate-case copy and the longest `smellsLike` lines (Sun, Saturn) for wrapping at 360px.
- Waivers: none.

Note on repository state: at the start of this task, `main.js`/`index.html`/`style.css`/other files already carried substantial uncommitted changes from other in-progress E04 work (moon catalog expansion, rotation-speed derivation, etc.), and a separate `codex` process was observed actively editing this same working tree concurrently during this session. The user was informed and chose to continue. This task's diff is scoped strictly to the `smellsLike`/screens-fact additions described above (plus the user-directed rename immediately below); the moon/rotation changes are pre-existing or concurrent work from elsewhere, not part of this task.

Out-of-plan addition (explicit user request mid-task): renamed the pre-existing `HIGHLIGHT` fact to `DISTANCE` — label text in `index.html`, and `facts.highlight` → `facts.distance`, `factHighlight` → `factDistance`, `#fact-highlight` → `#fact-distance` in `main.js`/`index.html`. Confirmed with the user this is a pure rename (no content change), since the fact's actual content differs by body type — planets/belt show travel-time-at-cruising-speed text (e.g. "~19 years at cruising speed"), probes show mission/launch text (e.g. "Mission: study the Sun up close / Launched: August 12, 2018") — neither of which is literal distance data. The rename is cosmetic only; values are unchanged. `node --check main.js` and `git diff --check` re-run clean after this change.
