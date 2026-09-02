---
type: epic-design
status: planned
---

# E01: Project Documentation Reset

## Purpose

Replace scaffold and stale documentation with a compact source of truth for the actual solar-system experience before implementation begins.

## What this epic adds

- Document the product, audience, experience promise, current static-site architecture, and v1 boundaries.
- Right-size Savepoint policy and health checks for a dependency-light browser experience.
- Reconcile `AGENTS.md`, `context.md`, `Codex.md`, `CLAUDE.md`, and Savepoint documents so they do not contradict one another.

## Components and files

| Module | Purpose |
|--------|---------|
| `.savepoint/PRD.md` | Canonical product vision and durable product boundaries. |
| `.savepoint/Design.md` | Current architecture plus the approved v1 Canvas/WebGL direction. |
| `.savepoint/visual-identity.md` | Repo-specific Atari-noir visual and motion rules. |
| `.savepoint/Guardrails.md` | Static-experience engineering, accuracy, accessibility, and performance policy. |
| `.savepoint/Health-Check.md` | Evidence gates using commands and scenarios this repository can actually run. |
| `AGENTS.md` | Savepoint workflow and an accurate codebase/build map. |
| `context.md` | Compact implementation context and current-state truth. |
| `Codex.md`, `CLAUDE.md` | Thin pointers to the shared context. |
| `.savepoint/Concept.md` | Retired template concept replaced by a pointer to the committed PRD. |
| `.savepoint/config.yml` | Quality gates aligned with the static JavaScript project. |

## Architectural delta

The documentation will stop describing the Savepoint CLI example and instead define this repository as a static, canvas-first browser experience. `context.md` remains the compact implementation reference, while Savepoint owns product scope, architecture, policy, release planning, and audit evidence. Future WebGL work is documented as an additive transparent rendering layer rather than a framework migration.

## Boundaries

**In scope:**

- Remove template instructions and irrelevant backend, database, billing, TUI, and CLI policy.
- Describe current behavior separately from approved v1 direction.
- Preserve the Savepoint state machine and agent-specific pointer files.
- Define lightweight validation for JavaScript syntax, static asset references, and manual browser journeys.

**Out of scope:**

- Product code, UI, rendering, content, or asset changes.
- Detailed implementation plans for later epics.
- Claims that planned 3D, asteroid, motion, card, or audio work already exists.

## Quality gates

- Documentation contains no unresolved template placeholders or claims that this repository is a CLI/TUI/backend product.
- Canonical documents have distinct responsibilities and agree on stack, deployment, interaction, scale, and v1 direction.
- Every documented validation command exists and can run in this repository.
- `git diff --check` and JavaScript syntax validation pass.

## Open decisions

None. `context.md` remains the compact implementation source; Savepoint documents own planning and governance; agent-specific files remain pointers.
