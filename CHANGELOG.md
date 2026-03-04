# Changelog

All notable changes to this project will be documented in this file.

## 2026-03-04
- feat: enforce tile/protocol animation no-repeat contract across shared, landing, and platform prompt specs.
- feat: add `runNonce`, `noveltyMemory`, and session `animationRegistry` requirements to prevent repeated animation archetypes/GIF descriptors.
- refactor: replace fixed first-three feature card patterns with unique per-run `featureAnimationPlan` assignment rules.
- docs: add PRD for animation uniqueness strategy at `prds/animation-uniqueness-enforcement.md`.
- feat: add cross-project Bun CLI (`saas-redesign`) to generate redesign packets for specific app slices.
- feat: add persistent registry-backed uniqueness engine to prevent reused feature/protocol signatures and GIF descriptors across runs.
- feat: add explicit per-animation `gsapRecipe` blocks so downstream agents can implement motion without inferring from signatures.
- feat: add saved session artifacts + `--resume` / `--tweak` flow for iterative seed feedback without full regeneration setup.
- feat: add layout variance engine (header styles, hero-adjacent blocks, section/page templates) with layout signature dedupe across runs.
- feat: add brand/copy/interaction/data-shape variance plans, rarity-weighted selection, anti-clone composition fingerprints, novelty scoring, visual similarity signal, and file-lock based concurrency safety.
- feat: add `--capture-current` baseline mode with `--current-state` / `--current-state-file` so first-time projects can ingest current-state seeds and iterate via `--resume`.
- feat: add plain-English request ingestion (`--request` / `--request-file`) with optional OpenRouter BYOK parsing and heuristic fallback.
- test: add unit and integration tests for generation uniqueness and CLI registry behavior.
- docs: add PRD `prds/cross-project-redesign-cli.md` and usage docs in `README.md`.
