import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export interface RegistrySession {
  generatedAt: string;
  mode: "landing" | "platform";
  target: string;
  runNonce: string;
  featureSignatures: string[];
  protocolSignatures: string[];
  gifDescriptors: string[];
  layoutSignatures: string[];
}

export interface UniquenessRegistry {
  version: 1;
  updatedAt: string;
  featureSignatures: string[];
  protocolSignatures: string[];
  gifDescriptors: string[];
  layoutSignatures: string[];
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
    return normalizeRegistry(parsed);
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

  for (const sig of session.featureSignatures) featureSet.add(sig);
  for (const sig of session.protocolSignatures) protocolSet.add(sig);
  for (const gif of session.gifDescriptors) gifSet.add(gif);
  for (const layout of session.layoutSignatures) layoutSet.add(layout);

  const sessions = [session, ...registry.sessions].slice(0, 500);

  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    featureSignatures: [...featureSet],
    protocolSignatures: [...protocolSet],
    gifDescriptors: [...gifSet],
    layoutSignatures: [...layoutSet],
    sessions,
  };
}

function normalizeRegistry(input: Partial<UniquenessRegistry>): UniquenessRegistry {
  if (input.version !== 1) {
    return createEmptyRegistry();
  }
  return {
    version: 1,
    updatedAt: typeof input.updatedAt === "string" ? input.updatedAt : new Date().toISOString(),
    featureSignatures: Array.isArray(input.featureSignatures)
      ? input.featureSignatures.filter((v): v is string => typeof v === "string")
      : [],
    protocolSignatures: Array.isArray(input.protocolSignatures)
      ? input.protocolSignatures.filter((v): v is string => typeof v === "string")
      : [],
    gifDescriptors: Array.isArray(input.gifDescriptors)
      ? input.gifDescriptors.filter((v): v is string => typeof v === "string")
      : [],
    layoutSignatures: Array.isArray(input.layoutSignatures)
      ? input.layoutSignatures.filter((v): v is string => typeof v === "string")
      : [],
    sessions: Array.isArray(input.sessions)
      ? input.sessions
          .filter((s): s is Partial<RegistrySession> => {
            return Boolean(
              s &&
                typeof s.generatedAt === "string" &&
                (s.mode === "landing" || s.mode === "platform") &&
                typeof s.target === "string" &&
                typeof s.runNonce === "string" &&
                Array.isArray(s.featureSignatures) &&
                Array.isArray(s.protocolSignatures) &&
                Array.isArray(s.gifDescriptors),
            );
          })
          .map((s) => ({
            generatedAt: s.generatedAt as string,
            mode: s.mode as "landing" | "platform",
            target: s.target as string,
            runNonce: s.runNonce as string,
            featureSignatures: s.featureSignatures as string[],
            protocolSignatures: s.protocolSignatures as string[],
            gifDescriptors: s.gifDescriptors as string[],
            layoutSignatures: Array.isArray(s.layoutSignatures)
              ? (s.layoutSignatures.filter((v): v is string => typeof v === "string"))
              : [],
          }))
          .slice(0, 500)
      : [],
  };
}
