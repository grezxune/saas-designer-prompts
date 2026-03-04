---
title: Tile Animation Uniqueness Enforcement
created: 2026-03-04
owner: Tommy
log:
  - 2026-03-04: Initial requirements documented for eliminating repeated tile animations in generated outputs.
  - 2026-03-04: Implemented shared no-repeat contract, runNonce entropy, noveltyMemory/session registry rules, and mode-specific animation plan enforcement.
  - 2026-03-04: Expanded novelty scope to include header/navigation style and section/page layout variants selected with the same seed plan.
---

## Problem
Generated SaaS landing/platform outputs frequently reuse the same feature tile animations and similar tile GIF behavior across runs, reducing perceived quality and violating the premium novelty expectation.

## Business Context
This repository is used as a reusable prompt spec for generating high-fidelity SaaS interfaces. Repetition lowers trust in the generator quality and weakens differentiation between brands and sessions.

## Goals & KPIs
- Prevent duplicate feature tile animation archetypes within a single generated output.
- Reduce repeated animation archetype sets across consecutive runs for the same brand context.
- Ensure each protocol card and feature tile uses a distinct animation identity.
- KPI: 0 duplicate animation archetype IDs within one output.
- KPI: >=80% archetype set difference across the last 5 consecutive outputs for same project context.

## Personas/Journeys
- Prompt operator generating multiple iterations for one brand.
- Designer evaluating outputs for novelty and premium polish.
- Engineer converting generated UI into implementation-ready code.

## Functional Requirements
1. Variation planning must include explicit entropy beyond static brand seed.
2. Feature tiles must be assigned unique animation archetype IDs without repetition per output.
3. Protocol cards must use non-repeating animation types per output.
4. Prompt must enforce diversity in motion timing/profile so cards are not only visually different but behaviorally different.
5. Prompt must require a short-term novelty memory (recent outputs) and reject regeneration if reuse threshold is exceeded.
6. Prompt must include deterministic fallback behavior when available archetypes are exhausted (mutate parameters and interaction model).
7. Variation plan must include header and layout template variants so composition changes with animation decisions.

## Non-functional Requirements
- Prompt logic should remain concise and implementable.
- Rules must be unambiguous enough for LLM agents to execute reliably.
- Added constraints should not increase instruction conflicts across shared and mode-specific files.

## Data & Integrations
- No external service integration required.
- Optional local `noveltyMemory` object maintained in generated output context only.

## Security Architecture & Threat Model
- Trust boundary: user-provided inputs (brand/purpose/value props) are untrusted text.
- Threat: prompt injection attempts to disable uniqueness checks.
- Mitigation: hard requirement language in shared core rules and mode files with explicit non-override behavior.
- No secrets, auth, or sensitive data paths introduced.

## Performance Strategy & Budgets
- Prompt generation overhead should add at most two extra regeneration attempts per output.
- Constraint evaluation should be O(n) over tile/protocol counts.
- Budget: no more than two novelty re-roll attempts to avoid runaway token usage.

## Open Questions
- Should novelty memory persist outside a single conversation/session?
- Should operators be allowed to request deterministic replay mode for debugging?

## Risks & Mitigations
- Risk: over-constraining may reduce coherence.
- Mitigation: require unique archetypes while allowing shared visual identity tokens.
- Risk: model ignores novelty memory instructions.
- Mitigation: add explicit validation and retry steps in build sequence.

## Success Metrics
- Manual review confirms no duplicate feature/protocol animation archetypes in output.
- Consecutive run comparisons show meaningful variation in tile animation sets.
- No conflicting instructions introduced across prompt files.

## Rollout Plan
1. Update shared core rules with anti-repetition contract.
2. Update landing and platform prompts with uniqueness engine + validation checks.
3. Validate consistency and conflict resolution rules.
4. Document changes and usage notes.

## Next Steps
- Monitor generated outputs for >5 consecutive runs to validate practical uniqueness behavior.
- Add optional deterministic replay guidance for debugging flows when needed.
