---
type: guardrails
status: active
last_audited: never
---

# Solar System at Scale — Engineering Policy

## Purpose

These are the only project rules that may block or condition Savepoint work. They protect the scale premise, static architecture, browser experience, and truthful presentation without importing backend policy this repository does not need.

## Severity model

| Severity | Meaning |
|---|---|
| Blocker | Must be resolved before handoff or explicitly excepted by the owner. |
| Required | Must be satisfied before approval unless the owner records a waiver. |
| Guideline | Shapes implementation and review but does not block by itself. |

## Rule index

### Scale and scientific integrity

| ID | Severity | Rule |
|---|---|---|
| SCALE-01 | Blocker | Planet and belt world positions must continue to derive from the shared AU axis unless the owner approves a product-scope change. |
| SCALE-02 | Required | Any visible size, spacing, or moon-orbit treatment that is not literal must be disclosed in concise user-facing language. |
| SCALE-03 | Required | Changed astronomical values or factual claims must name an authoritative source in task evidence. |

### Architecture and dependencies

| ID | Severity | Rule |
|---|---|---|
| ARCH-01 | Required | Production remains a static HTML/CSS/JavaScript experience with no application server, framework, or mandatory build step. |
| ARCH-02 | Required | 3D rendering must be additive to the canvas-first scene and must retain a functional fallback when WebGL is unavailable. |
| ARCH-03 | Required | Camera position, focus state, and body data must each have one source of truth. |
| DEP-01 | Required | A new runtime dependency requires explicit justification against native browser APIs, payload cost, maintenance, and fallback behavior. |
| ASSET-01 | Required | Added textures, models, audio, or fonts must have documented provenance, usage rights, and an appropriate web format. |

### Interaction and accessibility

| ID | Severity | Rule |
|---|---|---|
| UX-01 | Blocker | Wheel, pointer drag, and touch must remain capable of completing the Sun-to-Pluto journey. |
| UX-02 | Required | Persistent UI must not obscure the active body or prevent navigation at 360px-wide and representative desktop viewports. |
| A11Y-01 | Required | Interactive DOM controls require semantic roles, keyboard operation, visible focus, and text or shape reinforcement for colour-coded state. |
| A11Y-02 | Required | `prefers-reduced-motion` must suppress non-essential animation without disabling navigation or hiding information. |
| A11Y-03 | Required | Essential interface text must meet WCAG AA contrast against its actual background. |

### Performance and runtime safety

| ID | Severity | Rule |
|---|---|---|
| PERF-01 | Required | Renderers must cull off-screen work, cap device-pixel-ratio or equivalent resolution cost, and bound generated instances. |
| PERF-02 | Required | New rendering work must record representative desktop and mobile frame-time or FPS evidence using an agreed scenario. |
| PERF-03 | Required | Rendering failure must leave the page navigable and the scale journey understandable. |

### Content, privacy, and sound

| ID | Severity | Rule |
|---|---|---|
| CONTENT-01 | Required | Information cards expose no more than four concise facts per active target in the v1 presentation. |
| CONTENT-02 | Guideline | Copy remains warm and human but does not trade scientific credibility for novelty. |
| PRIV-01 | Required | Do not add user tracking, storage, or network data flows beyond the existing disclosed deployment analytics without owner approval. |
| AUDIO-01 | Required | The v1 experience must not start, request, or expose ambient audio playback. |

### Testing and evidence

| ID | Severity | Rule |
|---|---|---|
| TEST-01 | Required | Every changed behavior has named evidence: an automated check or an explicit browser scenario with viewport and expected outcome. |
| TEST-02 | Required | `node --check main.js` and `git diff --check` must pass at task handoff. |
| TEST-03 | Required | Rendering changes verify the normal path and the relevant fallback or failure path. |
| TEST-04 | Required | UI or navigation changes verify the complete Sun-to-Pluto journey at desktop and mobile sizes. |

### Code style

| ID | Severity | Rule |
|---|---|---|
| STYLE-01 | Guideline | Keep functions focused and name rendering passes by responsibility. |
| STYLE-02 | Guideline | Keep content and body-specific configuration in data rather than control flow where practical. |
| STYLE-03 | Guideline | Reuse shared geometry, materials, timing constants, and scale calculations instead of duplicating them per body. |
| STYLE-04 | Guideline | Comments explain scale compromises, rendering constraints, or non-obvious intent—not syntax. |
| STYLE-05 | Guideline | Prefer small native-browser solutions over speculative abstractions. |

## Savepoint enforcement

Quick, Full, and Deep checks in `.savepoint/Health-Check.md` provide evidence for these rules. Audits may fail work only on these rules, unmet acceptance criteria, missing evidence, or explicit release gates.
