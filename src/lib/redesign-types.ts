import type { GsapRecipe } from "./gsap-recipe";

export type Mode = "landing" | "platform";
export type Preset = "A" | "B" | "C" | "D";

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
  layoutSignature: string;
  layoutVariantPlan: LayoutVariantPlan;
  featureAnimations: FeatureAnimation[];
  protocolAnimations: ProtocolAnimation[];
  promptMarkdown: string;
  session?: {
    id: string;
    path: string;
  };
}
