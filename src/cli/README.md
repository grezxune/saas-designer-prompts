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

Iterate from a prior run:

```bash
./bin/saas-redesign --resume <session-id> --tweak "Calmer motion, same layout"
```
