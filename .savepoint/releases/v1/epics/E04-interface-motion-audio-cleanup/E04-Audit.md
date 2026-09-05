---
type: audit-findings
audited: 2026-09-05
---

# Audit Findings: E04 Interface, Motion, and Audio Cleanup

## Main Findings

### Verdict

CLEAR. All six tasks (T001–T006) were independently re-verified against the live `main.js`, `index.html`, `style.css`, and both WebGL renderers rather than taken on their own Context Log claims. Every acceptance criterion traces to real, currently-shipping code; no leftover audio/mute/dual-card code remains; the syntax and hygiene gates pass; and the two related defects (D001, D002) are correctly implemented and self-consistent with the tilt math they build on. No owner waiver or further evidence is required to hand this off. CLEAR TO COMMIT/PUSH.

### What Needs Attention

No blocking findings. Three items are worth the Product Owner's awareness but do not change the verdict:

- **No live-browser confirmation exists anywhere in this epic.** Every task, and this audit, relied on code-path/CSS-box-model reasoning because this sandbox has never had a usable browser for this project's own tooling. This mirrors the already-accepted precedent from the E01 and E03 epic audits (both returned CLEAR under the identical constraint). A short manual desktop+mobile pass (wheel/drag/touch traversal, both reduced-motion states, a WebGL-forced-unavailable check) is worth doing before the next production push, as T006 itself recommends.
  Evidence: no `chromium`/`chromium-browser`/`google-chrome` binary and no project-configured browser tooling in this environment; T001–T006 Context Logs all record the same limitation.
- **The corrected near/far moon occlusion (D001) could not be visually confirmed.** The code now conditionally routes each moon to a layer above or below the WebGL planet sphere based on `Math.sin(angle) < 0`, so occlusion genuinely varies with orbital position instead of being permanently wrong — the acceptance criterion is met either way — but which physical side of the orbit that sign picks out as "near" is a 3D-perspective judgment call that only a rendered frame can confirm.
  Evidence: `main.js:823-828` (`drawMoons`).
- **A pre-existing, unrelated probe-marker spacing quirk in `getProbeVisualX`** occasionally over-spaces inner probe labels beyond the intended 72px minimum once a probe's own true position already clears the prior probe's slot. This function was not touched, widened, or introduced by E04 (confirmed by diff), so it is out of scope for this audit and only recorded for future reference.
  Evidence: `main.js:845-872`.

### Materiality Summary

No materiality actions are required. No item above meets the bar for a finding (each is either pre-existing/out of scope, already-disclosed environment limitation consistent with prior CLEAR audits, or a cosmetic judgment call with no guardrail or acceptance criterion attached).

### What Is Proven / Not Proven

**Proven, by direct code inspection and re-derivation (not by trusting the task logs):**
- Every audio/mute code path, DOM node, CSS rule, and the asset itself are gone; a repo-wide grep for `ambient|mute|\.mp3|new Audio|<audio` outside `.savepoint/` returns only unrelated WebGL "ambient light" hits (AUDIO-01).
- The info panel is a single reusable `#info-panel` showing exactly `SIZE` and `HIGHLIGHT`; the second card, decorative fact emoji, and all associated CSS/JS are gone (CONTENT-01).
- Probe selection (`findNearestProbe`) is provably deterministic: ties resolve to the first strict-minimum distance in `PROBES`' fixed ascending order.
- Scale Lab defaults to collapsed on every viewport (`isScaleLabCollapsed = true` unconditionally; `.collapsed #scale-lab-body{display:none}` is unscoped to any media query) and its readout is now one ratio sentence plus one meter, with a correct distance-only fallback sentence for symbolic (non-`SIZE_RATIO_TO_SUN`) targets such as probes and the belt.
- Moon visual pacing is one shared formula floored at 24s; I independently recomputed it and confirmed Phobos is the only mover that hits the floor exactly at 24.0s and that ordering above the floor is unchanged from the real `orbitalPeriodDays` ordering.
- Reduced motion freezes planet rotation, moon-angle advance, star twinkle, and belt-rock spin time (`beltTimeSec` itself stops advancing, which freezes the WebGL rock shader's `uTime`-driven spin) while camera easing, snapping, and card/readout updates are untouched; the matching CSS block removes animation/transition on intro/info/closing elements without hiding them.
- Planet `rotationSpeed` now derives from one documented `ROTATION_SPEED_SCALE / rotationPeriodHours` formula; I recomputed all ten bodies' resulting speeds from the shipped constants and they match the ordering and Jupiter-anchor claims in the task log exactly. The Uranus retrograde correction is consistent with its own `tiltDeg: 98` and matches the same NASA sign convention already used for Venus/Pluto in this file.
- `rendering/planet-renderer.js` and `rendering/asteroid-belt-renderer.js` are byte-for-byte outside this epic's stated no-touch claim: neither file references `rotationSpeed`/`retrograde` directly, confirming T005's "one source of truth" claim; both cap DPR at 1.5 and both fall back cleanly (texture-not-ready / no-instancing-extension / context-loss) without throwing.
- Every `getElementById` call in `main.js` (33 distinct ids) resolves to an id that exists in the current `index.html` — I re-ran this cross-check myself rather than accepting the task's claim.
- `node --check` passes on all four JS files and `git diff --check` passes clean, run directly in this audit.
- Documentation (`context.md`, `AGENTS.md`, `.savepoint/Design.md`) no longer references audio or the old three-fact/two-panel model; `.savepoint/PRD.md` and `.savepoint/visual-identity.md` were already consistent and needed no change.

**Not proven (acceptable, non-blocking):** live-rendered confirmation of layout non-overlap, reduced-motion visuals, and the corrected moon occlusion/rotation direction at both target viewports — see "What Needs Attention" above.

### Audit Evidence

- **Scope lock:** T001–T006 acceptance criteria; guardrails AUDIO-01, CONTENT-01/02, SCALE-01/02/03, ARCH-01/02/03, UX-01/02, A11Y-01/02/03, PERF-01/02/03, TEST-01–04, STYLE-01–05; changed/added files `index.html`, `style.css`, `main.js`, `context.md`, `AGENTS.md`, `.savepoint/Design.md`; directly relied-on dependencies are `rendering/planet-renderer.js` and `rendering/asteroid-belt-renderer.js` (read, confirmed unchanged and still consuming only `main.js`-computed state).
- **Coverage and workflow result:** this is a static, side-effect-free rendering/input surface with no persistence, transactions, or external calls — the Workflow And Side-Effect Audit Lock's operation inventory reduces to WebGL setup/context-loss/recovery for both renderers, which was traced and found unchanged and still fallback-safe (`ready`/`contextLost`/`everDrewFrame` gating in both `frame()` implementations). No side-effecting workflow beyond that exists in scope.
- **File reality and drift:** every file named in every task's Context Log/Context Files exists as claimed; `audio/ambient.mp3` and the `audio/` directory are confirmed deleted from disk; `assets/textures/*.jpg/png` and `PROVENANCE.md` exist as T006 assumed. No phantom files. No undocumented architecture drift — `rendering/` is now correctly listed in `AGENTS.md`'s Codebase Map (it was missing before this epic's T006 fixed it).
- **Gates:** `node --check main.js`, `node --check rendering/planet-renderer.js`, `node --check rendering/planet-materials.js`, `node --check rendering/asteroid-belt-renderer.js` all pass; `git diff --check` passes clean — all four commands re-run directly during this audit, not copied from a task log.

### Guardrails Verification

- **Rule IDs checked:** AUDIO-01, CONTENT-01, CONTENT-02, SCALE-01, SCALE-02, SCALE-03, ARCH-01, ARCH-02, ARCH-03, UX-01, UX-02, A11Y-01, A11Y-02, A11Y-03, PERF-01, PERF-02, PERF-03, TEST-01, TEST-02, TEST-03, TEST-04.
- **Health check mode:** Full.
- **Evidence:** see "What Is Proven" and "Audit Evidence" above; UX-02 non-overlap was independently re-derived from the current CSS box model (ruler height, `#scale-lab` collapsed height, `.info-panel` height, and central-body radius at both a desktop and a 360×800 viewport) rather than accepted from the task's own numbers, and the two sets of figures agree.
- **File reality evidence:** confirmed above; no unplanned dependency or build step exists (`package.json` still only lists `@vercel/analytics`).
- **Waivers or unresolved findings:** none required.
- **Audit register reconciliation (`.savepoint/audit/`):** `F001` (Savepoint config vs. task-completion authority, unrelated to E04) was re-checked and remains `verified` — the same scoped scan (`tasks reach done on assertion|vibe-coder soft mode`) still returns no matches. No net-new register-worthy finding was produced by this epic audit. Per this audit's explicit single-file-write constraint, no `.savepoint/audit/runs/` entry or `.savepoint/audit/register.md` update was written this run; if a durable register record of this reconciliation is wanted, a follow-up run should record it.

### Non-Blocking Observations

- `#ruler-mode-toggle` uses `role="tablist"` without child `role="tab"` elements on its buttons — a pre-existing ARIA-pattern gap, not touched by E04 (native `<button>`s remain fully keyboard-operable regardless).
- `.scale-stats-row` in `style.css` is dead CSS pre-dating this epic (from an earlier "split view" design); T004 correctly left it alone as out of scope.
- The combined WebGL frame-time envelope (PERF-02) for this epic rests on reasoning from each renderer's already-measured individual E02/E03 numbers rather than a fresh combined trace, which T006 already discloses as recommended pre-release follow-up rather than a Full-check requirement.

## Code Style Review

- [x] STYLE-01 Keep functions focused and name rendering passes by responsibility. — `findNearestProbe`, `getMoonVisualPeriodSec`, `getRotationSpeedFromPeriod`, `showInfoCard` are each single-purpose and clearly named.
- [x] STYLE-02 Keep content and body-specific configuration in data rather than control flow where practical. — `rotationPeriodHours` moved into each planet's data record; one `PLANETS.forEach` derives `rotationSpeed` instead of per-body branches.
- [x] STYLE-03 Reuse shared geometry, materials, timing constants, and scale calculations instead of duplicating them per body. — one `ROTATION_SPEED_SCALE`/`getRotationSpeedFromPeriod` for all planets; one `getMoonVisualPeriodSec` for all moons.
- [x] STYLE-04 Comments explain scale compromises, rendering constraints, or non-obvious intent — not syntax. — the rotation-scale, moon-pacing, and moon-occlusion comments all explain the "why," not the "what."
- [x] STYLE-05 Prefer small native-browser solutions over speculative abstractions. — no new dependency was introduced anywhere in this epic; the audio removal is a net simplification.
