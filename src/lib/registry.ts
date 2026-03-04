import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { normalizeRegistry } from "./registry-normalize";

export interface RegistrySession {
  generatedAt: string;
  mode: "landing" | "platform";
  target: string;
  runNonce: string;
  featureSignatures: string[];
  protocolSignatures: string[];
  gifDescriptors: string[];
  layoutSignatures: string[];
  compositionFingerprints: string[];
  brandDnaSignatures: string[];
  copyVoiceSignatures: string[];
  interactionSignatures: string[];
  dataShapeSignatures: string[];
  visualHashes: string[];
  noveltyScores: number[];
  variantTokens: string[];
}

export interface UniquenessRegistry {
  version: 1;
  updatedAt: string;
  featureSignatures: string[];
  protocolSignatures: string[];
  gifDescriptors: string[];
  layoutSignatures: string[];
  compositionFingerprints: string[];
  brandDnaSignatures: string[];
  copyVoiceSignatures: string[];
  interactionSignatures: string[];
  dataShapeSignatures: string[];
  visualHashes: string[];
  noveltyScores: number[];
  sessions: RegistrySession[];
}

/**
 * Returns the default cross-project registry path.
 */
export function getDefaultRegistryPath(): string {
  const home = process.env.HOME || process.cwd();
  return path.join(home, ".saas-designer-prompts", "uniqueness-registry.json");
}

/**
 * Creates a fresh empty registry object.
 */
export function createEmptyRegistry(): UniquenessRegistry {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    featureSignatures: [],
    protocolSignatures: [],
    gifDescriptors: [],
    layoutSignatures: [],
    compositionFingerprints: [],
    brandDnaSignatures: [],
    copyVoiceSignatures: [],
    interactionSignatures: [],
    dataShapeSignatures: [],
    visualHashes: [],
    noveltyScores: [],
    sessions: [],
  };
}

/**
 * Loads and validates the uniqueness registry. Returns an empty one if missing.
 */
export async function loadRegistry(registryPath: string): Promise<UniquenessRegistry> {
  try {
    const raw = await readFile(registryPath, "utf8");
    const parsed = JSON.parse(raw) as Partial<UniquenessRegistry>;
    return normalizeRegistry(parsed, createEmptyRegistry);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      return createEmptyRegistry();
    }
    throw new Error(`Failed to read registry at ${registryPath}: ${(error as Error).message}`);
  }
}

/**
 * Writes the uniqueness registry to disk.
 */
export async function saveRegistry(registryPath: string, registry: UniquenessRegistry): Promise<void> {
  const resolved = path.resolve(registryPath);
  await mkdir(path.dirname(resolved), { recursive: true });
  registry.updatedAt = new Date().toISOString();
  await writeFile(resolved, JSON.stringify(registry, null, 2) + "\n", "utf8");
}

/**
 * Adds a generation session and updates deduplication sets.
 */
export function recordSession(
  registry: UniquenessRegistry,
  session: RegistrySession,
): UniquenessRegistry {
  const featureSet = new Set(registry.featureSignatures);
  const protocolSet = new Set(registry.protocolSignatures);
  const gifSet = new Set(registry.gifDescriptors);
  const layoutSet = new Set(registry.layoutSignatures);
  const compositionSet = new Set(registry.compositionFingerprints);
  const brandSet = new Set(registry.brandDnaSignatures);
  const voiceSet = new Set(registry.copyVoiceSignatures);
  const interactionSet = new Set(registry.interactionSignatures);
  const dataShapeSet = new Set(registry.dataShapeSignatures);
  const visualSet = new Set(registry.visualHashes);
  const noveltyScores = [...registry.noveltyScores];

  for (const sig of session.featureSignatures) featureSet.add(sig);
  for (const sig of session.protocolSignatures) protocolSet.add(sig);
  for (const gif of session.gifDescriptors) gifSet.add(gif);
  for (const layout of session.layoutSignatures) layoutSet.add(layout);
  for (const composition of session.compositionFingerprints) compositionSet.add(composition);
  for (const brand of session.brandDnaSignatures) brandSet.add(brand);
  for (const voice of session.copyVoiceSignatures) voiceSet.add(voice);
  for (const interaction of session.interactionSignatures) interactionSet.add(interaction);
  for (const dataShape of session.dataShapeSignatures) dataShapeSet.add(dataShape);
  for (const visual of session.visualHashes) visualSet.add(visual);
  for (const score of session.noveltyScores) noveltyScores.push(score);

  const sessions = [session, ...registry.sessions].slice(0, 500);

  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    featureSignatures: [...featureSet],
    protocolSignatures: [...protocolSet],
    gifDescriptors: [...gifSet],
    layoutSignatures: [...layoutSet],
    compositionFingerprints: [...compositionSet],
    brandDnaSignatures: [...brandSet],
    copyVoiceSignatures: [...voiceSet],
    interactionSignatures: [...interactionSet],
    dataShapeSignatures: [...dataShapeSet],
    visualHashes: [...visualSet],
    noveltyScores: noveltyScores.slice(-1000),
    sessions,
  };
}
