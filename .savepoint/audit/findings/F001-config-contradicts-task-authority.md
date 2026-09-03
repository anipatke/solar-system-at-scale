---
id: F001
title: Savepoint config contradicts task completion authority
status: verified
severity: medium
confidence: high
source_auditor: Codex
work_item: E01-project-documentation-reset/T001-rightsize-project-documentation
guardrail_ids: []
locations:
  - .savepoint/config.yml:3
  - AGENTS.md:34-38
first_seen: 2026-09-03
last_seen: 2026-09-03
proof_needed: Replace the stale completion comment with repository-accurate guidance and rerun the scoped lifecycle-language scan.
duplicate_of:
deferral_reason:
---

## Summary

The active Savepoint config says tasks reach `done` on assertion, while the repository workflow says only the user may mark a task `done`. E01 is intended to remove generic guidance and leave one internally consistent documentation set, so this surviving scaffold comment undermines that purpose and can mislead an agent about who controls task completion.

## Evidence

`.savepoint/config.yml:3` describes `verify_strict: false` as a mode in which “tasks reach done on assertion.” `AGENTS.md:34-38` instead reserves the `done` transition to the user. The contradiction is present on the supported path because both files are active project guidance and both are listed in T001's context.

## Proof

Verified on 2026-09-03. `.savepoint/config.yml:3` now states that task completion remains user-controlled. The named scoped scan

```text
rg -n "tasks reach done on assertion|vibe-coder soft mode" .savepoint/config.yml AGENTS.md .savepoint/router.md .savepoint/releases/v1/epics/E01-project-documentation-reset/tasks/T001-rightsize-project-documentation.md
```

returned no matches. `node --check main.js`, `git diff --check`, file/link checks, and the unchanged-product boundary also passed during the full re-audit.

## History

- 2026-09-03: Created as a net-new finding during the initial E01 full audit.
- 2026-09-03: Repair applied and finding verified by the named scoped lifecycle-language scan and full E01 gates.
