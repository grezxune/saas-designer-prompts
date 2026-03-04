/**
 * Parses argv-style flags into a key/value map.
 */
export function parseArgMap(argv: string[]): Map<string, string | true> {
  const map = new Map<string, string | true>();
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      map.set(key, true);
      continue;
    }
    map.set(key, next);
    i += 1;
  }
  return map;
}

/**
 * Reads a string value from parsed CLI args.
 */
export function getString(map: Map<string, string | true>, key: string): string | undefined {
  const value = map.get(key);
  return typeof value === "string" ? value : undefined;
}

/**
 * Parses a positive integer option.
 */
export function parseOptionalInt(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) throw new Error(`Invalid numeric value: ${value}`);
  return parsed;
}

/**
 * Parses comma-separated list values.
 */
export function splitCsv(value: string): string[] {
  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 6);
}

/**
 * Prints CLI usage.
 */
export function printHelp(): void {
  process.stdout.write(`saas-redesign\n\n`);
  process.stdout.write(`Required:\n  --target \"dashboard KPI tiles\" (or --resume <session>)\n\n`);
  process.stdout.write(`Options:\n`);
  process.stdout.write(`  --mode landing|platform\n`);
  process.stdout.write(`  --brand \"Brand Name\"\n`);
  process.stdout.write(`  --purpose \"One-line app purpose\"\n`);
  process.stdout.write(`  --preset A|B|C|D\n`);
  process.stdout.write(`  --value-props \"A,B,C\"\n`);
  process.stdout.write(`  --cta \"Start trial\"\n`);
  process.stdout.write(`  --feature-count N\n`);
  process.stdout.write(`  --protocol-count N\n`);
  process.stdout.write(`  --resume <session-id-or-path>\n`);
  process.stdout.write(`  --tweak \"what to change from prior session\"\n`);
  process.stdout.write(`  --preserve-run-nonce\n`);
  process.stdout.write(`  --registry /abs/path/registry.json\n`);
  process.stdout.write(`  --session-dir /abs/path/sessions\n`);
  process.stdout.write(`  --json\n`);
  process.stdout.write(`  --out /abs/path/output.md\n`);
  process.stdout.write(`  --dry-run (skip registry write)\n`);
  process.stdout.write(`  --no-save (skip session artifact write)\n`);
}
