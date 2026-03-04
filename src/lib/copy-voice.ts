import { pickRare, type UsageMap } from "./rarity";

export interface CopyVoicePlan {
  toneArchetype: string;
  headlineSyntax: string;
  ctaGrammar: string;
  sentenceCadence: string;
  microcopyStyle: string;
  vocabularyBias: string;
}

const TONE = ["precise-operator", "editorial-luxe", "warm-guide", "direct-brutalist", "clinical-modern"] as const;
const HEADLINE = ["verb-first", "contrast-pair", "question-hook", "result-first", "narrative-claim"] as const;
const CTA = ["imperative-short", "benefit-led", "invite-style", "proof-led"] as const;
const CADENCE = ["short-bursts", "balanced", "longform", "mixed-pulse"] as const;
const MICRO = ["instructional", "assertive", "conversational", "technical"] as const;
const VOCAB = ["plain", "technical", "premium", "playful"] as const;

/**
 * Creates copy/voice variant plan.
 */
export function createCopyVoicePlan(rng: () => number, usage: UsageMap): CopyVoicePlan {
  return {
    toneArchetype: pickRare("voice.tone", TONE, usage, rng),
    headlineSyntax: pickRare("voice.headline", HEADLINE, usage, rng),
    ctaGrammar: pickRare("voice.cta", CTA, usage, rng),
    sentenceCadence: pickRare("voice.cadence", CADENCE, usage, rng),
    microcopyStyle: pickRare("voice.micro", MICRO, usage, rng),
    vocabularyBias: pickRare("voice.vocab", VOCAB, usage, rng),
  };
}

/**
 * Stable signature for dedupe/novelty.
 */
export function makeCopyVoiceSignature(plan: CopyVoicePlan): string {
  return [
    plan.toneArchetype,
    plan.headlineSyntax,
    plan.ctaGrammar,
    plan.sentenceCadence,
    plan.microcopyStyle,
    plan.vocabularyBias,
  ].join("|");
}

/**
 * Registry tokens for rarity tracking.
 */
export function copyVoiceTokens(plan: CopyVoicePlan): string[] {
  return [
    `voice.tone:${plan.toneArchetype}`,
    `voice.headline:${plan.headlineSyntax}`,
    `voice.cta:${plan.ctaGrammar}`,
    `voice.cadence:${plan.sentenceCadence}`,
    `voice.micro:${plan.microcopyStyle}`,
    `voice.vocab:${plan.vocabularyBias}`,
  ];
}
