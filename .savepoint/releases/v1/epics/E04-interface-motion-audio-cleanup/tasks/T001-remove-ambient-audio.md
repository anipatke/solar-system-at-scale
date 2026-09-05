---
id: E04-interface-motion-audio-cleanup/T001-remove-ambient-audio
status: done
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

- [x] Audio markup, playback state/listeners, startup calls, mute control, and audio CSS are absent.
- [x] `audio/ambient.mp3` is intentionally deleted and no runtime path requests replacement audio.
- [x] First wheel, mouse, or touch input dismisses the intro and navigates without playback errors.
- [x] The full journey stays silent with no audio control at desktop or `360×800`.
- [x] Codebase maps/current context no longer list audio; historical records remain truthful.
- [x] No soundtrack, narration, settings panel, dependency, or new network flow is introduced.
- [x] Syntax, static-reference, and `git diff --check` gates pass.

## Implementation Plan

- [x] Remove audio markup, styling, state, listeners, and startup behavior.
- [x] Delete the asset and scan runtime references.
- [x] Verify intro dismissal and every input path without playback side effects.
- [x] Update current-state maps/context and record deletion and browser evidence.

## Context Log

**Removed:** `<audio id="ambient">` + `<source>` and the `#mute-btn`/`#mute-icon` markup (`index.html`); `#mute-btn` rule block (`style.css`); `audioStarted`/`isMuted` state, the `muteBtn`/`muteIcon`/`audio` DOM refs, `tryStartAudio()`, its `ended` listener, and the `muteBtn` click listener (`main.js`). `dismissIntro()` no longer calls `tryStartAudio()`; it now only sets `introGone` and toggles the `hidden` class. `audio/ambient.mp3` deleted via `git rm` (the now-empty `audio/` directory was removed with it).

**AC1/AC2/AC6 (absence + no replacement):** repo-wide grep for `ambient|mute|\.mp3|audio` across `*.html`, `*.css`, `*.js` outside `.savepoint/` returns only unrelated `AMBIENT`/`uAmbient` WebGL lighting-uniform hits in `rendering/planet-renderer.js` and `rendering/asteroid-belt-renderer.js`, and one unrelated "ambient glow" lighting comment in `main.js` — none are audio playback. No new dependency, settings panel, or network flow was added.

**AC3/AC4 (dismissal + silence):** code inspection — `dismissIntro()`'s only remaining side effects are `introGone = true` and `intro.classList.add('hidden')`, so wheel/mouse/touch-triggered dismissal (all three call `dismissIntro()`) cannot throw a playback error because no playback code path exists. Static file server smoke test (`npx serve .` on port 4173) confirms the served page contains zero `mute-btn`/`ambient` occurrences, and no build step exists to diverge served output from source — this stands for both desktop and `360×800` since the removed control had no viewport-conditional markup.

**AC5 (docs):** `context.md` (runtime-files table, current-content note, E04 direction line), `AGENTS.md` (Codebase Map row), and `.savepoint/Design.md` (codebase-map tree, interaction/interface note) no longer list `audio/ambient.mp3` or promise ambient playback. Historical entries (`E01-Detail.md`, `E02-Detail.md`, `v1-PRD.md`, prior audits) were left untouched as truthful history of the pre-E04 state.

### Health Check: Quick
- Guardrails rule IDs: AUDIO-01, ARCH-01, ASSET-01, TEST-01, TEST-02
- Acceptance evidence: see per-AC notes above
- File reality evidence: read/edited files match this task's `## Context Files`; `audio/ambient.mp3` itself was read via `git rm` (deletion, not content read) since its removal is the acceptance criterion
- Tests/commands: `node --check main.js` (pass), `git diff --check` (pass)
- Browser scenario(s): static-serve smoke test (desktop, `npx serve .` + `curl`) confirmed no `#mute-btn`/`<audio>` markup ships; remaining dismissal-safety evidence is code inspection (no playback code path remains to error) rather than a live interaction recording
- Known debt: no live-browser wheel/touch interaction recording for this deletion-only change; consistent with this project's prior precedent of accepting code-inspection evidence for behavior that can't regress because the code path was removed entirely
- Waivers: none
