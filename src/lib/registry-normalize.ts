import type { RegistrySession, UniquenessRegistry } from "./registry";

/**
 * Normalizes unknown registry input to the current schema.
 */
export function normalizeRegistry(
  input: Partial<UniquenessRegistry>,
  createEmpty: () => UniquenessRegistry,
): UniquenessRegistry {
  if (input.version !== 1) return createEmpty();
  return {
    version: 1,
    updatedAt: typeof input.updatedAt === "string" ? input.updatedAt : new Date().toISOString(),
    featureSignatures: strings(input.featureSignatures),
    protocolSignatures: strings(input.protocolSignatures),
    gifDescriptors: strings(input.gifDescriptors),
    layoutSignatures: strings(input.layoutSignatures),
    compositionFingerprints: strings(input.compositionFingerprints),
    brandDnaSignatures: strings(input.brandDnaSignatures),
    copyVoiceSignatures: strings(input.copyVoiceSignatures),
    interactionSignatures: strings(input.interactionSignatures),
    dataShapeSignatures: strings(input.dataShapeSignatures),
    visualHashes: strings(input.visualHashes),
    noveltyScores: numbers(input.noveltyScores),
    sessions: normalizeSessions(input.sessions),
  };
}

function normalizeSessions(value: unknown): RegistrySession[] {
  if (!Array.isArray(value)) return [];
  return value
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
      featureSignatures: strings(s.featureSignatures),
      protocolSignatures: strings(s.protocolSignatures),
      gifDescriptors: strings(s.gifDescriptors),
      layoutSignatures: strings(s.layoutSignatures),
      compositionFingerprints: strings(s.compositionFingerprints),
      brandDnaSignatures: strings(s.brandDnaSignatures),
      copyVoiceSignatures: strings(s.copyVoiceSignatures),
      interactionSignatures: strings(s.interactionSignatures),
      dataShapeSignatures: strings(s.dataShapeSignatures),
      visualHashes: strings(s.visualHashes),
      noveltyScores: numbers(s.noveltyScores),
      variantTokens: strings(s.variantTokens),
    }))
    .slice(0, 500);
}

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

function numbers(value: unknown): number[] {
  return Array.isArray(value) ? value.filter((v): v is number => typeof v === "number") : [];
}
