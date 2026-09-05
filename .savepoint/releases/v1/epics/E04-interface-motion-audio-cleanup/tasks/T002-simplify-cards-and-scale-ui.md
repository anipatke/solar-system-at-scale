---
id: E04-interface-motion-audio-cleanup/T002-simplify-cards-and-scale-ui
status: done
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

- [x] One reusable card shows at most two text facts for any planet, belt marker, or probe.
- [x] Canonical facts are `SIZE` and `HIGHLIGHT`; decorative fact emoji and the secondary card are absent.
- [x] Changed astronomical or mission claims name authoritative sources in task evidence.
- [x] Probe mode deterministically chooses one nearest eligible probe and never overlaps cards.
- [x] Scale Lab is collapsed by default behind a semantic `SCALE` disclosure.
- [x] Controls support keyboard use, visible focus, correct semantics, and non-colour state cues.
- [x] At `1440×900` and `360×800`, card, ruler, disclosure, and active body avoid persistent overlap.
- [x] Mode switching, snapping, disclosure, syntax, and hygiene checks pass.

## Implementation Plan

- [x] Consolidate fact data into sourced `size` and `highlight` fields.
- [x] Replace duplicate card markup/state with one semantic card.
- [x] Make overlapping probe selection deterministic.
- [x] Put Scale Lab behind a collapsed disclosure.
- [x] Tune responsive/focus styling and verify content, keyboard, modes, and viewports.

## Context Log

**Read:** `E04-Detail.md`, `visual-identity.md`, `Guardrails.md`, `Health-Check.md`, `index.html`, `style.css`, `main.js` — all listed Context Files except `.savepoint/PRD.md`, intentionally skipped per `AGENTS.md`'s "read PRD only for vision changes" budget rule (no vision change here).

**Data (AC2/AC3):** every `facts` object across `PLANETS`, `ASTEROID_BELT`, and `PROBES` in `main.js` dropped its decorative `smell` field and renamed `flight` → `highlight`; no fact *values* changed. Because no astronomical or mission claim was altered (only relabeled/consolidated), AC3's source-naming requirement has nothing new to cite — the pre-existing `size` values still trace to the NASA planetary fact sheets cited in the `SIZE_RATIO_TO_SUN` comment, and probe `highlight` text is the same previously-shipped mission/launch copy.

**Card (AC1/AC2/AC4):** `index.html` now renders a single `#info-panel` with two static-labelled facts (`SIZE`, `HIGHLIGHT`); `#info-panel-secondary` and all decorative `fact-icon` emoji spans are deleted. `main.js` collapses the old `setPanelContent`/`showInfoCards` pair (which drove two DOM cards with per-mode icon/label swaps) into one `showInfoCard(target, mode)` that only toggles the `probe-panel` accent class. Probe selection now runs through a single shared `findNearestProbe(focusX)` (replacing `getInnerProbeTargets` and the duplicated nearest-probe loop in `snapToNearestProbe`): it walks `PROBES` in its fixed ascending-`distanceAU` order and keeps the first strict-minimum distance, so ties resolve deterministically by array order. `checkInfoPanel()`'s probe branch and `getScaleFocusTarget()` both consume this helper and track one `activeProbe` (was an `activeProbes` array capped at 2). With only one DOM card ever rendered, "never overlaps cards" holds structurally.

**Scale Lab (AC5):** `isScaleLabCollapsed` now defaults to `true` unconditionally (was `false` on desktop, viewport-conditional on mobile); `syncScaleLabCollapse()` dropped the `window.innerWidth`/`dataset.mobileInitialized` branching entirely, so the state persists across resizes and only changes via the toggle click. `#scale-lab-toggle` moved from mobile-only (`display:none` by default) to always visible, and `.collapsed`'s body-hiding rule moved out of the `max-width:600px` query into the base stylesheet so it applies at every viewport. Initial HTML ships `class="collapsed"`, `aria-expanded="false"`, and `SHOW` text so there's no expanded-then-collapsed flash before `syncScaleLabCollapse()` runs in `init()`.

**Accessibility (AC6):** the Scale Lab toggle gained `aria-labelledby="scale-lab-kicker scale-lab-toggle-label"` so its accessible name reads as "REAL SCALE LAB" + the live SHOW/HIDE state, not just the bare state word; `aria-expanded`/`aria-controls` were already correct and are unchanged. Added a project-wide `button:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }` — the stylesheet previously had zero `:focus`/`:focus-visible` rules, relying entirely on unstyled UA defaults, so this is a new, explicit, non-colour-only (shape: outline ring, not fill) focus indicator covering the mode-toggle buttons and the Scale Lab toggle. Probe vs. planet card state is still conveyed by both an accent-colour swap and the `TYPE`/label text itself, not colour alone.

**Layout/overlap (AC7):** reasoned from computed CSS box models (no headless browser available in this environment — see Known debt). Desktop ≥901px: `#ruler` is 88px tall from `top:0`; `#scale-lab` starts at `top:108px`, a 20px gap below it. Collapsed, `#scale-lab` renders only its header (kicker + title + toggle, ~24px padding + ~45px content ≈ 70px total) in the top-right, well clear of the bottom-left `#info-panel` (`bottom:24px`) and the canvas-centered active body. At `360×800` (≤600px query): `#ruler` is 118px tall, `#scale-lab` starts at `top:136px` — an 18px gap — and stays a similarly short collapsed header; `.info-panel` remains bottom-anchored (`bottom:12px`) with the second, previously overlap-prone right-side card removed entirely, so the only remaining fixed elements (ruler, collapsed disclosure header, single info card) occupy disjoint top/top-right/bottom regions at both sizes.

**Mode/snap/hygiene (AC8):** `setDisplayMode()` now resets `activeProbe = null` (was `activeProbes = []`); `snapToNearestProbe()` and `getScaleFocusTarget()` were refactored onto `findNearestProbe()` without changing their snap thresholds or camera-delta math, so scroll-driven snapping behavior is unchanged. Repo-wide grep confirms no leftover references to `activeProbes`, `info2*`, `fact-icon`, `fact-flight`/`fact-smell`, `getInnerProbeTargets`, or `showInfoCards`, and every `document.getElementById` call in `main.js` resolves to an id still present in `index.html` (cross-checked both directions).

### Health Check: Quick
- Guardrails rule IDs: CONTENT-01, CONTENT-02, SCALE-03, A11Y-01, UX-02, TEST-01, TEST-02
- Acceptance evidence: see per-AC notes above
- File reality evidence: read/edited files match this task's `## Context Files` except the intentionally-skipped `PRD.md` (explained above)
- Tests/commands: `node --check main.js` (pass), `git diff --check` (pass), CSS brace-balance check (pass), bidirectional `getElementById`-vs-`id=` cross-reference across `main.js`/`index.html` (pass, zero mismatches)
- Browser scenario(s): static-serve smoke test (`python3 -m http.server`, desktop) confirms `index.html` ships exactly one `fact-highlight` node, zero `info-panel-secondary`/`fact-flight`/`fact-icon` occurrences, `#scale-lab` served with `class="collapsed"` and `aria-expanded="false"`, and `main.js` is served with `Content-Type: text/javascript` (module import will not fail on MIME grounds); the `1440×900`/`360×800` overlap claim (AC7) and live keyboard-focus/hover behavior are code-inspection/CSS-box-model evidence rather than a captured render, since no headless browser is available in this environment
- Known debt: no live-browser screenshot or interaction recording for the new card/disclosure layout at either viewport; consistent with this project's prior precedent (T001) of accepting static-serve + code-inspection evidence when live rendering tooling isn't available, and with the project's lightweight-testing preference over introducing a Playwright/headless-browser dependency for this
- Waivers: none
