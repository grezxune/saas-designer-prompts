---
title: Cross-Project Redesign CLI with Global Uniqueness Registry
created: 2026-03-04
owner: Tommy
log:
  - 2026-03-04: Initial requirements documented for a terminal-invokable redesign prompt generator.
  - 2026-03-04: Implemented Bun CLI, persistent uniqueness registry, and tests for cross-run no-repeat guarantees.
  - 2026-03-04: Added explicit GSAP recipe payloads per animation so implementation agents can execute motion deterministically.
  - 2026-03-04: Added saved-session and resume/tweak loop so agents can iterate from prior seeds without full re-specification.
  - 2026-03-04: Added layout variance requirements (header patterns + section/page templates) so seeds choose full composition plans in tandem.
  - 2026-03-04: Implemented brand/copy/interaction/data-shape variance, rarity weighting, anti-clone fingerprints, novelty scoring, visual similarity signal, and registry lock safety.
  - 2026-03-04: Added baseline current-state capture mode (`--capture-current`) so first-time projects can ingest existing UI state as an initial seed and then iterate with resume/tweak.
  - 2026-03-04: Accepted `src/cli/redesign-prompt.ts` above 200 LOC temporarily because it is the single orchestration entrypoint for lock/registry/session flow; follow-up refactor can split argument parsing and selection logic.
  - 2026-03-04: Added plain-English request parsing (`--request` / `--request-file`) with optional OpenRouter BYOK and local heuristic fallback so users can guide redesigns conversationally.
---

## Problem
The current prompt files are strong, but there is no reusable terminal entrypoint from other projects to request a redesign of a specific app slice (for example: dashboard hero, feature tiles, billing table) while guaranteeing no repeated animation/tile/GIF signatures across runs.

## Business Context
The prompt repository should behave like a shared design engine that can be called from any app workspace. Teams need fast iteration with high novelty and zero repeated motion signatures to maintain premium output quality.

## Goals & KPIs
- Provide a one-command CLI callable from any project.
- Accept a target app slice and generate a redesign packet/prompt.
- Enforce persistent no-repeat rules for animation archetype IDs and GIF descriptors across runs.
- KPI: 100% of generated packets contain unique feature/protocol archetype IDs and GIF descriptors versus stored registry.
- KPI: CLI generation completes in < 250ms p95 for default settings.

## Personas/Journeys
- Product engineer in another repo runs one command to get redesign direction for a single UI slice.
- Designer/PM reviews generated packet and sends it to implementation agent.
- Team repeats process many times without seeing repeated tile/animation/GIF signatures.

## Functional Requirements
1. CLI command accepts: mode (`landing|platform`), target slice, brand/purpose context, optional preset, optional counts.
2. CLI generates a fresh `runNonce` and full `variationPlan` fragment for requested slice.
3. CLI persists and consults a registry of previously emitted archetype IDs/descriptors.
4. CLI must never emit an already-registered feature/protocol archetype ID or GIF descriptor.
5. CLI emits a ready-to-use prompt packet as markdown (and optional JSON mode).
6. CLI emits explicit GSAP recipe objects for each feature/protocol animation (trigger, step sequence, easing, reduced-motion strategy).
7. CLI supports explicit registry path for team-shared state.
8. CLI supports `--dry-run` mode that does not write registry.
9. CLI persists each generated packet as a session artifact by default (id + path + input + output payload).
10. CLI supports `--resume <session-id-or-path>` to load prior input context for iterative tweaks.
11. CLI supports `--tweak` notes and emits source-session metadata in packet output for delta implementation.
12. CLI packet must include `layoutVariantPlan` with header pattern, main-page composition, and app-page template variants.
13. CLI uniqueness system must track and avoid repeated layout signatures across runs.
14. CLI must support baseline ingestion for first-time projects: capture current-state metadata and persist it as a reusable seed in registry/session.
15. CLI must accept plain-English redesign requests and map them into structured input fields, with optional external LLM parsing when API key is provided.

## Non-functional Requirements
- Keep files modular and under readability limits.
- Fail with typed/clear errors on invalid args and registry corruption.
- Use Bun-compatible TypeScript and strict validation.

## Data & Integrations
- Local JSON registry file, defaulting to user home path for cross-project reuse.
- No external API dependency.

## Security Architecture & Threat Model
- Trust boundary: CLI args are untrusted input from shell/user scripts.
- Risks: path traversal in `--out` / `--registry`, malformed JSON registry, prompt injection text.
- Mitigations:
  - Normalize and resolve paths before writes.
  - Validate registry schema and recover safely.
  - Treat input text as plain data; avoid shell execution from interpolated values.

## Performance Strategy & Budgets
- Budget generation logic to O(n) against requested tile/protocol counts.
- Keep retry loops bounded (max attempts configured, hard cap).
- p95 < 250ms on local machine for default counts and non-cold filesystem.

## Open Questions
- Should we optionally support team-level remote registry storage?
- Should we provide a lockfile strategy for concurrent CLI calls?

## Risks & Mitigations
- Risk: registry growth over time.
- Mitigation: retain canonical hashes and compact old metadata.
- Risk: impossible uniqueness if namespace exhausted.
- Mitigation: expand signature space via parameter mutations and nonce suffixing.

## Success Metrics
- Manual and test validation confirms no duplicate signatures across repeated runs.
- CLI is usable from a second repo with absolute path invocation.
- Generated packet is implementation-ready and aligned with core prompt fundamentals.

## Rollout Plan
1. Implement CLI and uniqueness engine.
2. Add unit + integration tests.
3. Document install/use flow in README.
4. Update changelog and PRD log with implementation status.

## Next Steps
- Validate behavior under concurrent invocations and add lock strategy if needed.
- Evaluate optional team-shared remote registry backend.
