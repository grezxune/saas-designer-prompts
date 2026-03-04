import { pickRare, type UsageMap } from "./rarity";

export interface BrandDnaPlan {
  colorStrategy: string;
  typePairing: string;
  spacingRhythm: string;
  radiusProfile: string;
  shadowStyle: string;
  iconStyle: string;
  density: string;
  materiality: string;
}

const COLOR = ["monochrome-accent", "split-complement", "earth-contrast", "high-contrast-neutral", "duotone-glow"] as const;
const TYPE = ["neo-grotesk+editorial", "geometric+humanist", "humanist+mono", "brutalist+serif", "condensed+mono"] as const;
const SPACING = ["compact", "balanced", "airy", "editorial"] as const;
const RADIUS = ["sharp", "soft", "pill-heavy", "hybrid"] as const;
const SHADOW = ["diffuse", "hard-edge", "layered", "minimal"] as const;
const ICON = ["outline", "duotone", "glyph", "microstroke"] as const;
const DENSITY = ["minimal", "standard", "dense", "high-information"] as const;
const MATERIAL = ["glass", "paper", "solid", "gradient-film"] as const;

/**
 * Creates a rarity-weighted brand DNA plan.
 */
export function createBrandDnaPlan(rng: () => number, usage: UsageMap): BrandDnaPlan {
  return {
    colorStrategy: pickRare("dna.color", COLOR, usage, rng),
    typePairing: pickRare("dna.type", TYPE, usage, rng),
    spacingRhythm: pickRare("dna.spacing", SPACING, usage, rng),
    radiusProfile: pickRare("dna.radius", RADIUS, usage, rng),
    shadowStyle: pickRare("dna.shadow", SHADOW, usage, rng),
    iconStyle: pickRare("dna.icon", ICON, usage, rng),
    density: pickRare("dna.density", DENSITY, usage, rng),
    materiality: pickRare("dna.material", MATERIAL, usage, rng),
  };
}

/**
 * Stable signature for dedupe/novelty.
 */
export function makeBrandDnaSignature(plan: BrandDnaPlan): string {
  return [
    plan.colorStrategy,
    plan.typePairing,
    plan.spacingRhythm,
    plan.radiusProfile,
    plan.shadowStyle,
    plan.iconStyle,
    plan.density,
    plan.materiality,
  ].join("|");
}

/**
 * Registry tokens for rarity tracking.
 */
export function brandDnaTokens(plan: BrandDnaPlan): string[] {
  return [
    `dna.color:${plan.colorStrategy}`,
    `dna.type:${plan.typePairing}`,
    `dna.spacing:${plan.spacingRhythm}`,
    `dna.radius:${plan.radiusProfile}`,
    `dna.shadow:${plan.shadowStyle}`,
    `dna.icon:${plan.iconStyle}`,
    `dna.density:${plan.density}`,
    `dna.material:${plan.materiality}`,
  ];
}
