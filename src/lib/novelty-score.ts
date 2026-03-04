import type { UniquenessRegistry } from "./registry";

export interface NoveltyInput {
  layoutSignature: string;
  brandDnaSignature: string;
  copyVoiceSignature: string;
  interactionSignature: string;
  dataShapeSignature: string;
  featureSignatures: string[];
  protocolSignatures: string[];
  visualDistance: number;
}

export interface NoveltyBreakdown {
  layout: number;
  style: number;
  behavior: number;
  motion: number;
  visual: number;
}

export interface NoveltyResult {
  score: number;
  threshold: number;
  passed: boolean;
  breakdown: NoveltyBreakdown;
}

/**
 * Computes novelty score and pass/fail against threshold.
 */
export function computeNoveltyScore(
  input: NoveltyInput,
  registry: UniquenessRegistry,
  threshold = 72,
): NoveltyResult {
  const layout = uniquenessBonus(input.layoutSignature, registry.layoutSignatures);

  const styleSources = [
    ...registry.brandDnaSignatures,
    ...registry.copyVoiceSignatures,
  ];
  const style = mean([
    uniquenessBonus(input.brandDnaSignature, registry.brandDnaSignatures),
    uniquenessBonus(input.copyVoiceSignature, registry.copyVoiceSignatures),
    compositeSetBonus([input.brandDnaSignature, input.copyVoiceSignature], styleSources),
  ]);

  const behaviorSources = [
    ...registry.interactionSignatures,
    ...registry.dataShapeSignatures,
    ...registry.compositionFingerprints,
  ];
  const behavior = mean([
    uniquenessBonus(input.interactionSignature, registry.interactionSignatures),
    uniquenessBonus(input.dataShapeSignature, registry.dataShapeSignatures),
    compositeSetBonus([input.interactionSignature, input.dataShapeSignature], behaviorSources),
  ]);

  const motionPool = [...registry.featureSignatures, ...registry.protocolSignatures];
  const motion = compositeSetBonus([...input.featureSignatures, ...input.protocolSignatures], motionPool);

  const visual = Math.max(0, Math.min(1, input.visualDistance));

  const weighted = layout * 0.2 + style * 0.2 + behavior * 0.2 + motion * 0.2 + visual * 0.2;
  const score = Math.round(weighted * 100);
  return {
    score,
    threshold,
    passed: score >= threshold,
    breakdown: { layout, style, behavior, motion, visual },
  };
}

function uniquenessBonus(signature: string, pool: string[]): number {
  return pool.includes(signature) ? 0.2 : 1;
}

function compositeSetBonus(signatures: string[], pool: string[]): number {
  const set = new Set(pool);
  const reused = signatures.filter((value) => set.has(value)).length;
  return 1 - reused / Math.max(1, signatures.length);
}

function mean(values: number[]): number {
  return values.reduce((acc, value) => acc + value, 0) / Math.max(1, values.length);
}
