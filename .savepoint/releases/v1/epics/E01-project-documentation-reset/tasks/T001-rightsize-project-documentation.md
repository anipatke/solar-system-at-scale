---
id: E01-project-documentation-reset/T001-rightsize-project-documentation
status: in_progress
stage: build
objective: Replace generic and stale guidance with a concise, internally consistent documentation set for this repository.
depends_on: []
complexity_tier: medium
complexity_reason: Nine documentation files must be reconciled without changing product behavior.
---

# T001: Rightsize Project Documentation

## Problem

The Savepoint project documents still describe a generic CLI/TUI product, while implementation guidance contains stale audio, rendering, and file references. Agents cannot reliably distinguish current behavior from the approved v1 redesign.

## Context Files

- `.savepoint/PRD.md`
- `.savepoint/Design.md`
- `.savepoint/Concept.md`
- `.savepoint/visual-identity.md`
- `.savepoint/Guardrails.md`
- `.savepoint/Health-Check.md`
- `.savepoint/config.yml`
- `.savepoint/releases/v1/v1-PRD.md`
- `.savepoint/releases/v1/epics/E01-project-documentation-reset/E01-Detail.md`
- `AGENTS.md`
- `context.md`
- `Codex.md`
- `CLAUDE.md`
- `index.html`
- `main.js`
- `style.css`
- `package.json`
- `vercel.json`

## Acceptance Criteria

- [x] Product and design documents describe the solar-system experience, its audience, static deployment, current Canvas architecture, and approved v1 direction.
- [x] Visual identity is specific to the project and distinguishes current styling from the restrained 3D direction.
- [x] Guardrails and health checks contain only relevant static-web, scale-integrity, accessibility, performance, dependency, and evidence rules.
- [x] `AGENTS.md` contains an accurate codebase map and runnable verification commands without duplicating product context.
- [x] `context.md`, `Codex.md`, and `CLAUDE.md` form one non-contradictory context chain and clearly distinguish current state from planned work.
- [x] Template-only CLI/TUI/backend content and unresolved instructional placeholders are absent from the scoped documentation.
- [x] No product source or runtime asset is changed.

## Implementation Plan

- [x] Rewrite the project PRD and retire the generic concept template.
- [x] Rewrite the architecture and visual-identity documents around the static Canvas/WebGL experience.
- [x] Replace generic engineering policy and health checks with repository-appropriate rules and commands.
- [x] Update the agent guide codebase map and build instructions.
- [x] Reconcile shared and vendor-specific context files, separating current behavior from v1 plans.
- [x] Check the complete scoped set for stale claims, placeholders, broken references, and unintended product changes.
- [x] Run configured and targeted documentation health checks and record evidence.

## Context Log

Health Check: Quick
- Guardrails rule IDs: SCALE-01–03, ARCH-01–03, DEP-01, ASSET-01, TEST-01–02, STYLE-01–05.
- Acceptance evidence: Replaced the generic product, architecture, visual, policy, and health-check templates; reconciled the agent guide and shared context; all checklist outcomes above were inspected against the resulting files.
- File reality evidence: All Context Files were read or verified. Edited only documentation and Savepoint planning files. `git diff --quiet -- index.html main.js style.css package.json package-lock.json vercel.json audio/ambient.mp3` returned 0, confirming no tracked product-source or runtime-asset diff.
- Tests/commands: `node --check main.js` passed; configured test gate is the same command; `git diff --check` passed; scoped stale-template/reference `rg` scan returned no matches; the local `Concept.md` to `PRD.md` link target exists.
- Browser scenarios: Not applicable; E01 is documentation-only and changes no runtime behavior.
- Known debt: `.savepoint/`, `AGENTS.md`, and `agent-skills/` were already untracked as groups and remain uncommitted; later epic decisions remain explicitly labelled as planned.
- Waivers: None.
