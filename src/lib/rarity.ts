import type { UniquenessRegistry } from "./registry";

/**
 * Flat usage counts used for rarity-weighted variant selection.
 */
export interface UsageMap {
  byKey: Map<string, number>;
}

/**
 * Builds usage counts from registry sessions.
 */
export function buildUsageMap(registry: UniquenessRegistry): UsageMap {
  const byKey = new Map<string, number>();
  for (const session of registry.sessions) {
    for (const token of session.variantTokens ?? []) {
      byKey.set(token, (byKey.get(token) ?? 0) + 1);
    }
  }
  return { byKey };
}

/**
 * Picks a rarity-weighted item: less-used items are more likely.
 */
export function pickRare<T extends string>(
  keyNamespace: string,
  options: readonly T[],
  usage: UsageMap,
  rng: () => number,
): T {
  let total = 0;
  const weighted: Array<{ value: T; cumulative: number }> = [];

  for (const value of options) {
    const key = `${keyNamespace}:${value}`;
    const seen = usage.byKey.get(key) ?? 0;
    const weight = 1 / Math.pow(1 + seen, 1.25);
    total += weight;
    weighted.push({ value, cumulative: total });
  }

  const target = rng() * total;
  for (const entry of weighted) {
    if (target <= entry.cumulative) return entry.value;
  }
  return options[options.length - 1] as T;
}

/**
 * Converts key/value variant picks to registry token format.
 */
export function makeVariantToken(namespace: string, value: string): string {
  return `${namespace}:${value}`;
}
