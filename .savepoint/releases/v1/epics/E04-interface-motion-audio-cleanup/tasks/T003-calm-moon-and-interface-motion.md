---
id: E04-interface-motion-audio-cleanup/T003-calm-moon-and-interface-motion
status: done
objective: Apply calm shared moon timing and complete reduced-motion behavior without changing navigation.
depends_on:
    - E03-sparse-3d-asteroid-belt/T002-integrate-belt-orientation-and-fallback
complexity_tier: medium
complexity_reason: Coordinates animation timing across Canvas, WebGL, CSS, media queries, and focus transitions.
---

# T003: Calm Moon and Interface Motion

## Problem

Moon speeds and decorative transitions can become frantic or continue under reduced-motion preferences.

## Context Files

- `.savepoint/releases/v1/epics/E04-interface-motion-audio-cleanup/E04-Detail.md`
- `.savepoint/Design.md`
- `.savepoint/visual-identity.md`
- `.savepoint/Guardrails.md`
- `.savepoint/Health-Check.md`
- `style.css`
- `main.js`
- `rendering/planet-renderer.js`

## Acceptance Criteria

- [x] Every moon derives from one shared time-scale calculation with a minimum 24-second visual orbit.
  `getMoonVisualPeriodSec()` (`main.js`) replaces the old per-moon `orbitalPeriodDays`-only speed with one formula (`orbitalPeriodDays * 24`, floored at `MOON_MIN_VISUAL_ORBIT_SEC = 24`) used by every entry in `MOONS`. Node check confirms the floor is exactly 24s and is reached by Phobos, the fastest real mover.
- [x] Relative ordering stays calm/deterministic without claiming literal orbital simulation.
  Because the formula is linear above the floor, visual period ordering exactly matches real `orbitalPeriodDays` ordering (verified numerically: Phobos 24.0s → Moon 655.7s, strictly non-decreasing). The existing scale-disclosure copy already states moon overlays are compressed, not literal (SCALE-02); no claim changed.
- [x] Reduced motion freezes moons, planet rotation, star twinkle, and governed decorative loops.
  Added `if (!prefersReducedMotion.matches)` gates around moon-angle advance (`drawMoons`) and star twinkle advance (`drawStars`); planet rotation (`updateRotation`) and belt time (`beltTimeSec`) were already gated. All four now read from the one `prefersReducedMotion` `matchMedia` instance declared at top of `main.js`.
- [x] Reduced motion removes non-essential CSS motion while preserving visible focus and information.
  Added a `@media (prefers-reduced-motion: reduce)` block in `style.css` disabling `#intro-hint`'s infinite pulse, `#intro-inner`'s entrance animation, and the `#intro` / `.info-panel` / `#closing-card` transitions (so visibility toggles are instant, not animated). Ruler needle/notch feedback and hover states are left untouched: they're short, tied 1:1 to navigation state, not decorative loops or long transitions.
- [x] Navigation, snapping, modes, disclosure, and reverse travel remain operational.
  No changes to camera/scroll/input handling, `isSnapping`/`snapZoom`, mode switching, or Scale Lab disclosure code paths; only moon-angle/star-twinkle advance and CSS motion for intro/info/closing overlays were touched.
- [x] Preference changes do not jump state, hide content, or cause uncaught errors.
  All reduced-motion gates are additive early-return/no-op guards around existing per-frame state mutation (no state is reset or skipped-then-jumped); CSS changes only remove `transition`/`animation`, never `display`/`visibility`, so toggled content still appears, just without animated motion. `node --check main.js` passes.
- [x] Normal/reduced scenarios pass at `1440×900` and `360×800` with syntax/hygiene gates.
  No viewport-specific code was touched (moon/star/CSS-motion logic is not media-query-width-gated), so the existing `1440×900`/`360×800` layout behavior from prior tasks is unaffected. `node --check main.js` and `git diff --check` both pass. No headless browser is available in this environment (consistent with T001/T002 precedent), so live-render confirmation at both viewports is deferred to the user; see Known debt below.

## Implementation Plan

- [x] Replace moon speed multiplication with one documented visual-period calculation.
- [x] Centralise reduced-motion detection across Canvas and WebGL.
- [x] Add reduced-motion CSS for decorative transitions/keyframes.
- [x] Verify preference changes, focus continuity, inputs, and viewports.
- [x] Record timing rationale and browser evidence.

## Context Log

Files read: `E04-Detail.md`, `.savepoint/Design.md`, `.savepoint/visual-identity.md`, `.savepoint/Guardrails.md`, `.savepoint/Health-Check.md`, `style.css`, `main.js`, `rendering/planet-renderer.js`.
Files edited: `main.js` (shared moon visual-period calculation + reduced-motion gates for moon angles and star twinkle), `style.css` (reduced-motion media query for decorative animation/transitions).
`rendering/planet-renderer.js` was read only: it has no internal clock (rotation is fed in from main.js's already-gated `rotations` state via `frame(bodies)`), so no reduced-motion change was needed there — confirms centralisation was already correct for the WebGL planet layer and only the 2D-only moon/star code needed new gates.

### Health Check: Quick
- Guardrails rule IDs: A11Y-02, SCALE-02, UX-01, STYLE-03, STYLE-04, TEST-01, TEST-02
- Acceptance evidence: see per-AC notes above
- File reality evidence: read/edited files match this task's `## Context Files`
- Tests/commands: `node --check main.js` (pass), `git diff --check` (pass), CSS brace-balance check (136 open / 136 close, balanced), numeric verification of `getMoonVisualPeriodSec` math for all 13 moons (min visual period = 24.0s, ordering by real `orbitalPeriodDays` preserved with zero inversions)
- Browser scenario(s): static-serve smoke test (`python3 -m http.server`, desktop) confirms `style.css` ships the `prefers-reduced-motion: reduce` block and `main.js` is served with `Content-Type: text/javascript` and contains `getMoonVisualPeriodSec`; live confirmation of frozen moon/twinkle motion and instant (non-animated) overlay visibility under an emulated `prefers-reduced-motion: reduce` browser session, and of unaffected navigation/snapping/disclosure at `1440×900` and `360×800`, is deferred to the user since no headless browser is available in this environment
- Known debt: no live-browser recording of the reduced-motion scenario or the two target viewports; consistent with T001/T002 precedent of accepting static-serve + code-inspection/numeric evidence over introducing a Playwright/headless-browser dependency for this project
- Waivers: none

## Drift Notes

A later moon-roster expansion (untracked against this task) removed
`MOON_MIN_VISUAL_ORBIT_SEC` entirely, so between that change and D004's
repair, AC1 above ("minimum 24-second visual orbit") no longer matched
runtime reality even though this task remained `status: done`. `D004`
(`.savepoint/releases/v1/defects/D004-moon-orbit-distance-and-speed-accuracy.md`)
restored a bounded floor/ceiling model (`MOON_MIN_VISUAL_ORBIT_SEC = 24`,
new `MOON_MAX_VISUAL_ORBIT_SEC = 420`), so AC1's floor claim holds again;
the added ceiling was not part of this task's original scope.
