# Library

Shared utilities for the redesign CLI:
- `random.ts`: deterministic RNG + nonce/hash helpers.
- `registry.ts`: persistent uniqueness registry load/save/merge.
- `generator.ts`: builds unique animation plans and redesign prompt packet.
- `prompt-markdown.ts`: renders the final markdown redesign packet.
- `gsap-recipe.ts`: emits explicit GSAP-ready motion recipe objects.
- `redesign-types.ts`: shared packet/type contracts.
- `session-store.ts`: persists and reloads session artifacts for tweak iterations.
- `layout-variants.ts`: generates unique header/section/page composition plans.
- `brand-dna.ts`: style DNA variants (type, spacing, materiality, density).
- `copy-voice.ts`: tone/headline/CTA/microcopy variance.
- `interaction-data-variants.ts`: page interaction and data-shape variance plans.
- `novelty-score.ts`: composite novelty scoring and threshold checks.
- `visual-similarity.ts`: visual-distance signal (playwright-backed when available, structural fallback otherwise).
- `rarity.ts`: rarity-weighted variant selection from historical usage.
- `lock.ts`: lockfile helper for concurrent CLI safety.
- `preview-hash.ts`: structural visual hashing fallback and distance calculation.
- `registry-normalize.ts`: schema normalization for backward-compatible registry loading.
