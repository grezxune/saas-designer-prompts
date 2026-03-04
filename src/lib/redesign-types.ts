import type { GsapRecipe } from "./gsap-recipe";
import type { BrandDnaPlan } from "./brand-dna";
import type { CopyVoicePlan } from "./copy-voice";
import type { DataShapePlan, PageInteractionPlan } from "./interaction-data-variants";
import type { NoveltyBreakdown } from "./novelty-score";

export type Mode = "landing" | "platform";
export type Preset = "A" | "B" | "C" | "D";
export type SeedKind = "generated" | "baseline-current-state";

export interface RequestInterpretation {
  parser: "openrouter" | "heuristic";
  raw: string;
}

export interface RedesignInput {
  mode: Mode;
  target: string;
  brand: string;
  purpose: string;
  preset: Preset;
  runNonce: string;
  valueProps: string[];
  cta: string;
  featureTileCount?: number;
  protocolStepCount?: number;
  sourceSessionId?: string;
  tweakNotes?: string;
  seedKind?: SeedKind;
  currentStateNotes?: string;
  requestInterpretation?: RequestInterpretation;
}

export interface FeatureAnimation {
  animationArchetypeId: string;
  signature: string;
  gifDescriptor: string;
  primitive: string;
  tempoMs: number;
  pathProfile: string;
  interactionModel: string;
  easing: string;
  gsapRecipe: GsapRecipe;
}

export interface ProtocolAnimation {
  animationArchetypeId: string;
  signature: string;
  primitive: string;
  tempoMs: number;
  spatialPath: string;
  phaseOffset: string;
  lineStyle: string;
  gsapRecipe: GsapRecipe;
}

export interface AppPageVariantPlan {
  appHeaderPattern: string;
  dashboardTemplate: string;
  entityListTemplate: string;
  entityDetailTemplate: string;
  settingsTemplate: string;
  billingTemplate: string;
}

export interface LayoutVariantPlan {
  marketingHeaderPattern: string;
  heroAdjacentPattern: string;
  sectionOrderTemplate: string;
  landingSectionVariants: {
    hero: string;
    features: string;
    philosophy: string;
    protocol: string;
    conversion: string;
    footer: string;
  };
  appPageVariants?: AppPageVariantPlan;
}

export interface RedesignPacket {
  generatedAt: string;
  mode: Mode;
  target: string;
  preset: Preset;
  runNonce: string;
  sourceSessionId?: string;
  tweakNotes?: string;
  seedKind: SeedKind;
  currentStateNotes?: string;
  requestInterpretation?: RequestInterpretation;
  layoutSignature: string;
  compositionFingerprint: string;
  brandDnaSignature: string;
  copyVoiceSignature: string;
  interactionSignature: string;
  dataShapeSignature: string;
  layoutVariantPlan: LayoutVariantPlan;
  brandDnaPlan: BrandDnaPlan;
  copyVoicePlan: CopyVoicePlan;
  pageInteractionPlan: PageInteractionPlan;
  dataShapePlan: DataShapePlan;
  noveltyScore: number;
  noveltyThreshold: number;
  noveltyPassed: boolean;
  noveltyBreakdown: NoveltyBreakdown;
  visualMethod: "playwright-image-hash" | "structural-hash";
  visualHash: string;
  visualDistance: number;
  variantTokens: string[];
  featureAnimations: FeatureAnimation[];
  protocolAnimations: ProtocolAnimation[];
  promptMarkdown: string;
  session?: {
    id: string;
    path: string;
  };
}
