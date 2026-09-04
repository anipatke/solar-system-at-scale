---
type: health-check
status: active
last_audited: never
---

# Solar System at Scale — Health Check

## Purpose

Health checks capture compact evidence for the static browser experience. `.savepoint/Guardrails.md` defines policy; this document defines when and how evidence is recorded. Prefer one representative proof per changed behavior, not a grid of redundant combinations.

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
5. For behavior changes, record one representative normal-path browser scenario and, when relevant, one adjacent fallback or boundary scenario that proves the changed behavior. Include the browser, viewport, input path, and expected result, but do not multiply scenarios across every input method and viewport unless the task truly changed them.
6. For documentation-only work, record a scoped placeholder/stale-reference scan instead.
7. Record relevant guardrail IDs, known debt, and owner-approved waivers.

Task Context Log format:

```md
Health Check: Quick
- Guardrails rule IDs:
- Acceptance evidence:
- File reality evidence:
- Tests/commands:
- Browser scenario(s):
- Known debt:
- Waivers:
```

## Full check

Before epic audit closeout:

- confirm every task criterion and Quick check has evidence;
- run `node --check main.js` and `git diff --check` against the integrated epic;
- exercise the epic’s user-visible path once at a representative desktop viewport and once at 360px width;
- verify only the fallback, reduced-motion, or WebGL-unavailable behavior that the epic actually changed, using one representative scenario per changed subsystem;
- reconcile new modules or architecture with `.savepoint/Design.md`;
- confirm blocker and required guardrails are satisfied or explicitly waived.

Record the result under `### Guardrails Verification` in the epic audit.

## Deep check

Before production release:

- complete the Sun-to-Pluto journey with wheel, pointer drag, and touch emulation at least once each;
- verify planet and probe modes, focus snapping, scale disclosure, closing state, and reverse navigation;
- verify desktop and mobile layout, keyboard focus, reduced motion, and WebGL fallback once each, not in a combinatorial matrix;
- record representative desktop and mobile rendering performance;
- check static asset loading, console errors, response headers, and Vercel deployment behavior;
- confirm all critical/high audit findings are closed or accepted by the owner.

Deep checks produce a release-readiness note and do not change product code unless separately requested.
