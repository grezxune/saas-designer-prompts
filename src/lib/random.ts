/**
 * Small deterministic PRNG seeded from string input.
 */
export function createRng(seed: string): () => number {
  let state = hashToUint32(seed) || 0x9e3779b9;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 0x100000000;
  };
}

/**
 * Hashes a string into an unsigned 32-bit integer.
 */
export function hashToUint32(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/**
 * Picks a random item from an array using the provided RNG.
 */
export function pickOne<T>(items: readonly T[], rng: () => number): T {
  const raw = Math.floor(rng() * items.length);
  const index = Math.max(0, Math.min(items.length - 1, raw));
  return items[index] as T;
}

/**
 * Picks a random integer in inclusive range.
 */
export function pickInt(min: number, max: number, rng: () => number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

/**
 * Creates a short deterministic hash string for human-readable IDs.
 */
export function shortHash(value: string): string {
  return hashToUint32(value).toString(36).padStart(6, "0").slice(0, 6);
}

/**
 * Creates a run nonce used to force per-run entropy.
 */
export function createRunNonce(): string {
  const now = new Date();
  const stamp = now
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
  const rand = Math.floor(Math.random() * 0xffffff)
    .toString(36)
    .padStart(4, "0");
  return `${stamp}-${rand}`;
}
