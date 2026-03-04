# Contributing

Thanks for contributing to `saas-designer-prompts`.

## Scope

This repository defines reusable prompt specs for:
- landing-page SaaS generation
- full SaaS platform generation
- shared UX/style rules that keep both aligned

## Core Rule

Always preserve the shared source of truth in `saas-ux-core-rules.md`.

- Mode-specific behavior goes in:
  - `saas-landing-designer.md`
  - `saas-platform-designer.md`
- Routing logic stays in:
  - `saas-designer.md`

If rules conflict, shared core rules must win.

## Recommended Change Process

1. Propose the change in a PR description with intent and expected impact.
2. Update `saas-ux-core-rules.md` first when the change affects both modes.
3. Update mode file(s) only for mode-specific execution differences.
4. Keep prompts concise, deterministic, and implementation-ready.
5. Ensure novelty/variation constraints remain enforceable.

## Quality Checklist

Before opening a PR:
- Ensure no contradictory instructions across files.
- Ensure landing and platform files both reference shared core rules.
- Verify the router (`saas-designer.md`) still points to correct files.
- Use clear, direct language and avoid ambiguous requirements.

## Commit Style

Use Conventional Commits when possible:
- `feat:` for new capabilities
- `fix:` for corrections
- `docs:` for documentation updates
- `refactor:` for non-behavioral restructuring

## Pull Requests

PRs should include:
- Summary of what changed
- Why the change is needed
- Which file(s) were modified and why
- Any backward-compatibility concerns

## License

By contributing, you agree your contributions are licensed under the MIT License in `LICENSE`.
