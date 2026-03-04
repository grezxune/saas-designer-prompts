# CLI

`redesign-prompt.ts` generates a cross-project redesign packet for a specific UI slice.

Use it directly:

```bash
bun run src/cli/redesign-prompt.ts --target "dashboard tiles"
```

Or via the bin wrapper:

```bash
./bin/saas-redesign --target "dashboard tiles"
```

Output semantics:
- `signature` fields are uniqueness/identity markers for registry + novelty scoring.
- `gsapRecipe` is the executable animation contract an implementation agent should apply.

Iterate from a prior run:

```bash
./bin/saas-redesign --resume <session-id> --tweak "Calmer motion, same layout"
```

Capture baseline for an existing app that has not used the engine yet:

```bash
./bin/saas-redesign --capture-current --current-state-file /abs/path/current-state.json --current-state "Static header, dense cards, low motion"
```

Baseline capture also supports plain English:

```bash
./bin/saas-redesign --capture-current --request "Capture current state of dashboard shell and header for Acme; preset B; static full-width header and dense KPI cards."
```

Plain-English request input (local heuristic parser):

```bash
./bin/saas-redesign --request "Redesign billing table interactions for NovaOps, preset D, 5 feature tiles, 4 protocol steps, CTA Start pilot" --no-ai
```

Optional OpenRouter BYOK parser (for richer intent extraction):

```bash
export OPENROUTER_API_KEY=...
./bin/saas-redesign --request-file /abs/path/request.txt --openrouter-model openai/gpt-4o-mini
```

Parsing precedence:
- Explicit CLI flags override parsed request fields.
- If OpenRouter is not configured or fails, parsing falls back to the local heuristic parser.
- Optional env vars: `OPENROUTER_MODEL`, `OPENROUTER_BASE_URL`.

Novelty controls:

```bash
./bin/saas-redesign --target "dashboard" --max-attempts 12 --novelty-threshold 78 --visual-threshold 0.32
```
