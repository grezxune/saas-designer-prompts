# SaaS Designer Prompts

Unified prompt system for generating either:
- a SaaS marketing/landing site, or
- a full SaaS platform (marketing + authenticated app)

## Files

- `saas-designer.md`: Router/entrypoint. Decides which mode file to use.
- `saas-ux-core-rules.md`: Shared UX and styling source of truth.
- `saas-landing-designer.md`: Landing-page execution rules.
- `saas-platform-designer.md`: Full SaaS platform execution rules.
- `CONTRIBUTING.md`: Contribution workflow and guardrails.
- `LICENSE`: MIT license.

## Process (Always Follow)

1. Load `saas-designer.md` first.
2. Load and enforce `saas-ux-core-rules.md`.
3. Choose mode:
   - Landing-only -> `saas-landing-designer.md`
   - Full product -> `saas-platform-designer.md`
4. If uncertain, default to platform mode.
5. On rule conflicts, shared core rules win.

## Why This Structure

- Keeps one consistent design language across all generated surfaces.
- Avoids drift between landing and app prompts.
- Allows specialized execution logic per mode without duplicating base UX rules.

## Variation and Novelty

Both mode files require a `variationPlan` and novelty checks to reduce repeated layouts:
- dynamic counts (tiles, steps, nav links, etc.)
- alternate compositions (hero, section ordering, shell layout)
- motion and visual motif variance

## Recommended Usage in Agent Runs

- For a new brand: start with platform mode unless the user explicitly asks for marketing-only.
- Keep the selected preset and core visual system consistent across all generated routes.
- Validate quality gates before final output (at minimum lint + typecheck for generated apps).

## Repository Goals

- Reusable, production-minded prompt standards
- Premium, non-generic output
- Consistent UX across marketing and product UI
