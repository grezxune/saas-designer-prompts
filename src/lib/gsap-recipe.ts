export type GsapTrigger = "mount" | "scroll" | "hover" | "loop";

export interface GsapStep {
  atPct: number;
  durationMs: number;
  from: Record<string, number | string>;
  to: Record<string, number | string>;
  easing: string;
  note: string;
}

export interface GsapRecipe {
  targetSelector: string;
  trigger: GsapTrigger;
  repeat: number;
  yoyo: boolean;
  staggerMs: number;
  steps: GsapStep[];
  reducedMotion: {
    strategy: "skip-heavy-transform" | "fade-only";
    durationScale: number;
  };
}

export interface FeatureRecipeInput {
  index: number;
  primitive: string;
  tempoMs: number;
  pathProfile: string;
  interactionModel: string;
  easing: string;
}

export interface ProtocolRecipeInput {
  index: number;
  primitive: string;
  tempoMs: number;
  spatialPath: string;
  phaseOffset: string;
  lineStyle: string;
}

/**
 * Builds a GSAP-ready recipe for feature tile animation.
 */
export function buildFeatureGsapRecipe(input: FeatureRecipeInput): GsapRecipe {
  const vector = getPathVector(input.pathProfile);
  const trigger = mapInteractionToTrigger(input.interactionModel);
  const base = Math.max(280, Math.floor(input.tempoMs * 0.45));
  const enterX = round2(-vector.x * 0.4);
  const enterY = round2(-vector.y * 0.4);

  return {
    targetSelector: `.feature-tile-${input.index + 1} [data-motion-layer]`,
    trigger,
    repeat: trigger === "loop" ? -1 : 0,
    yoyo: trigger === "loop",
    staggerMs: Math.floor(base * 0.18),
    steps: [
      {
        atPct: 0,
        durationMs: Math.floor(base * 0.4),
        from: { opacity: 0, scale: 0.96, x: enterX, y: enterY, rotate: -3 },
        to: { opacity: 1, scale: 1, x: 0, y: 0, rotate: 0 },
        easing: input.easing,
        note: `enter-${input.primitive}`,
      },
      {
        atPct: 40,
        durationMs: Math.floor(base * 0.35),
        from: { x: 0, y: 0 },
        to: { x: vector.x, y: vector.y, rotate: input.primitive === "orbit" ? 6 : 2 },
        easing: "power2.inOut",
        note: `travel-${input.pathProfile}`,
      },
      {
        atPct: 75,
        durationMs: Math.floor(base * 0.25),
        from: { x: vector.x, y: vector.y },
        to: { x: 0, y: 0, filter: "blur(0px)", opacity: 1 },
        easing: "power3.out",
        note: `settle-${input.interactionModel}`,
      },
    ],
    reducedMotion: {
      strategy: "fade-only",
      durationScale: 0.6,
    },
  };
}

/**
 * Builds a GSAP-ready recipe for protocol stack animation.
 */
export function buildProtocolGsapRecipe(input: ProtocolRecipeInput): GsapRecipe {
  const vector = getPathVector(input.spatialPath);
  const phase = Number.parseInt(input.phaseOffset.replace("deg", ""), 10) || 0;
  const base = Math.max(320, Math.floor(input.tempoMs * 0.5));

  return {
    targetSelector: `.protocol-step-${input.index + 1} [data-motion-layer]`,
    trigger: "scroll",
    repeat: 0,
    yoyo: false,
    staggerMs: Math.floor(base * 0.12),
    steps: [
      {
        atPct: 0,
        durationMs: Math.floor(base * 0.34),
        from: { opacity: 0, scale: 1.04, filter: "blur(8px)", x: vector.x * 0.2, y: vector.y * 0.2 },
        to: { opacity: 1, scale: 1, filter: "blur(0px)", x: 0, y: 0 },
        easing: "power3.out",
        note: `pin-enter-${input.primitive}`,
      },
      {
        atPct: 34,
        durationMs: Math.floor(base * 0.4),
        from: { x: 0, y: 0, rotate: 0 },
        to: { x: vector.x, y: vector.y, rotate: Math.round((phase / 180) * 6) },
        easing: "power2.inOut",
        note: `stack-shift-${input.spatialPath}`,
      },
      {
        atPct: 74,
        durationMs: Math.floor(base * 0.26),
        from: { opacity: 1, filter: "blur(0px)" },
        to: {
          opacity: input.lineStyle === "glow" ? 0.92 : 0.88,
          filter: input.lineStyle === "dot-matrix" ? "blur(1px)" : "blur(0px)",
          x: 0,
          y: 0,
        },
        easing: "power1.out",
        note: `stack-settle-${input.lineStyle}`,
      },
    ],
    reducedMotion: {
      strategy: "skip-heavy-transform",
      durationScale: 0.5,
    },
  };
}

function mapInteractionToTrigger(interactionModel: string): GsapTrigger {
  if (interactionModel === "timeline-driven") return "scroll";
  if (interactionModel === "hover-reactive" || interactionModel === "cursor-led") return "hover";
  if (interactionModel === "auto-loop") return "loop";
  return "mount";
}

function getPathVector(path: string): { x: number; y: number } {
  switch (path) {
    case "arc":
      return { x: 18, y: -12 };
    case "zigzag":
      return { x: 16, y: 10 };
    case "bezier":
      return { x: 14, y: -8 };
    case "lattice":
      return { x: 12, y: 12 };
    case "spiral":
      return { x: 10, y: -14 };
    case "step":
      return { x: 20, y: 6 };
    case "sine":
      return { x: 15, y: 9 };
    case "radial":
      return { x: 13, y: -13 };
    default:
      return { x: 12, y: -10 };
  }
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
