---
type: health-check
status: active
last_audited: never
---

# Solar System at Scale — Health Check

## Purpose

Health checks capture compact evidence for the static browser experience. `.savepoint/Guardrails.md` defines policy; this document defines when and how evidence is recorded.

## Modes

| Mode | When | Output |
|---|---|---|
| Quick | Before each task handoff | Evidence block in the task Context Log |
| Full | Before an epic audit closes | Guardrails verification in the epic audit |
| Deep | Before the v1 production release or after a major rendering concern | Release-readiness summary |

## Quick check

1. Confirm every acceptance criterion has a named outcome.
2. Confirm changed/read files match the active task Context Files, with any necessary targeted verification read explained.
3. Run:

   ```bash
   node --check main.js
   git diff --check
   ```

4. Run the configured quality gate from `.savepoint/config.yml` when it adds evidence beyond the commands above.
5. For behavior changes, record the exact browser, viewport, input path, and expected result checked. For documentation-only work, record a scoped placeholder/stale-reference scan instead.
6. Record relevant guardrail IDs, known debt, and owner-approved waivers.

Task Context Log format:

```md
Health Check: Quick
- Guardrails rule IDs:
- Acceptance evidence:
- File reality evidence:
- Tests/commands:
- Browser scenarios:
- Known debt:
- Waivers:
```

## Full check

Before epic audit closeout:

- confirm every task criterion and Quick check has evidence;
- run `node --check main.js` and `git diff --check` against the integrated epic;
- exercise the epic’s user-visible path at a representative desktop viewport and at 360px width;
- verify relevant fallback, reduced-motion, and WebGL-unavailable behavior when those areas changed;
- reconcile new modules or architecture with `.savepoint/Design.md`;
- confirm blocker and required guardrails are satisfied or explicitly waived.

Record the result under `### Guardrails Verification` in the epic audit.

## Deep check

Before production release:

- complete the Sun-to-Pluto journey with wheel, pointer drag, and touch emulation;
- verify planet and probe modes, focus snapping, scale disclosure, closing state, and reverse navigation;
- verify desktop and mobile layout, keyboard focus, reduced motion, and WebGL fallback;
- record representative desktop and mobile rendering performance;
- check static asset loading, console errors, response headers, and Vercel deployment behavior;
- confirm all critical/high audit findings are closed or accepted by the owner.

Deep checks produce a release-readiness note and do not change product code unless separately requested.
