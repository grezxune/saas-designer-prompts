import { createRng, pickInt, pickOne, shortHash } from "./random";
import type { UniquenessRegistry } from "./registry";
import { buildPromptMarkdown } from "./prompt-markdown";
import type {
  FeatureAnimation,
  ProtocolAnimation,
  RedesignInput,
  RedesignPacket,
} from "./redesign-types";
import {
  buildFeatureGsapRecipe,
  buildProtocolGsapRecipe,
} from "./gsap-recipe";
import { createUniqueLayoutVariantPlan } from "./layout-variants";

const FEATURE_ARCHETYPES = [
  "diagnostic-shuffler", "telemetry-typewriter", "cursor-protocol-scheduler", "radial-kpi-dial",
  "timeline-scrubber", "command-palette-preview", "split-funnel-analyzer", "queue-heatmap",
  "waveform-comparator", "packet-lattice", "kinetic-sparkline-matrix", "orbit-handoff-map",
] as const;
const PROTOCOL_ARCHETYPES = [
  "rotating-geomotif", "scanning-laser-line", "pulsing-waveform", "particle-drift-field",
  "path-trace-map", "contour-sweep-graph", "phase-lens-stack", "node-latency-ribbon",
] as const;
const PRIMITIVES = ["morph", "pulse", "orbit", "wipe", "scan", "stack", "trace", "flip"] as const;
const PATHS = ["arc", "zigzag", "bezier", "lattice", "spiral", "step", "sine", "radial"] as const;
const INTERACTIONS = ["hover-reactive", "timeline-driven", "cursor-led", "auto-loop", "input-coupled"] as const;
const EASINGS = ["power3.out", "power2.inOut", "expo.out", "circ.inOut", "back.out"] as const;
const PHASES = ["0deg", "45deg", "90deg", "135deg", "180deg", "225deg"] as const;
const LINES = ["solid", "dashed", "glow", "gradient", "dot-matrix"] as const;
const GIF_A = ["kinetic", "orbital", "tactile", "signal", "cinematic", "elastic"] as const;
const GIF_B = ["queue", "matrix", "cursor", "scanline", "wave", "funnel", "dial", "protocol"] as const;
const GIF_C = ["burst", "cascade", "handoff", "trace", "drift", "sweep", "glide"] as const;

/**
 * Generates a uniqueness-checked redesign packet and prompt markdown.
 */
export function generateRedesignPacket(input: RedesignInput, registry: UniquenessRegistry): RedesignPacket {
  const seed = `${input.brand}|${input.purpose}|${input.mode}|${input.preset}|${input.target}|${input.runNonce}`;
  const rng = createRng(seed);
  const featureTileCount = input.featureTileCount ?? pickInt(2, 6, rng);
  const protocolStepCount = input.protocolStepCount ?? pickInt(2, 5, rng);

  const usedFeature = new Set(registry.featureSignatures);
  const usedProtocol = new Set(registry.protocolSignatures);
  const usedGif = new Set(registry.gifDescriptors);
  const usedLayouts = new Set(registry.layoutSignatures);
  const localFeature = new Set<string>();
  const localProtocol = new Set<string>();
  const localGif = new Set<string>();
  const localFeatureArchetypes = new Set<string>();
  const localProtocolArchetypes = new Set<string>();
  const { layoutVariantPlan, layoutSignature } = createUniqueLayoutVariantPlan(input.mode, rng, usedLayouts);

  const featureAnimations: FeatureAnimation[] = [];
  for (let i = 0; i < featureTileCount; i += 1) {
    featureAnimations.push(
      createUniqueFeature(
        i,
        rng,
        input.runNonce,
        usedFeature,
        localFeature,
        usedGif,
        localGif,
        localFeatureArchetypes,
      ),
    );
  }

  const protocolAnimations: ProtocolAnimation[] = [];
  for (let i = 0; i < protocolStepCount; i += 1) {
    protocolAnimations.push(
      createUniqueProtocol(i, rng, input.runNonce, usedProtocol, localProtocol, localProtocolArchetypes),
    );
  }

  return {
    generatedAt: new Date().toISOString(),
    mode: input.mode,
    target: input.target,
    preset: input.preset,
    runNonce: input.runNonce,
    sourceSessionId: input.sourceSessionId,
    tweakNotes: input.tweakNotes,
    layoutSignature,
    layoutVariantPlan,
    featureAnimations,
    protocolAnimations,
    promptMarkdown: buildPromptMarkdown(input, layoutVariantPlan, layoutSignature, featureAnimations, protocolAnimations),
  };
}

function createUniqueFeature(
  index: number,
  rng: () => number,
  runNonce: string,
  usedFeature: Set<string>,
  localFeature: Set<string>,
  usedGif: Set<string>,
  localGif: Set<string>,
  localFeatureArchetypes: Set<string>,
): FeatureAnimation {
  for (let attempt = 0; attempt < 2000; attempt += 1) {
    const archetype = pickOne(FEATURE_ARCHETYPES, rng);
    const primitive = pickOne(PRIMITIVES, rng);
    const tempoMs = pickInt(850, 4200, rng);
    const pathProfile = pickOne(PATHS, rng);
    const interactionModel = pickOne(INTERACTIONS, rng);
    const easing = pickOne(EASINGS, rng);
    const signature = `${archetype}|${primitive}|${tempoMs}|${pathProfile}|${interactionModel}|${easing}`;
    const descriptor = `${pickOne(GIF_A, rng)}-${pickOne(GIF_B, rng)}-${pickOne(GIF_C, rng)}-${shortHash(`${runNonce}|${index}|${attempt}`)}`;
    if (
      !usedFeature.has(signature) &&
      !localFeature.has(signature) &&
      !usedGif.has(descriptor) &&
      !localGif.has(descriptor) &&
      !localFeatureArchetypes.has(archetype)
    ) {
      localFeature.add(signature);
      localGif.add(descriptor);
      localFeatureArchetypes.add(archetype);
      return {
        animationArchetypeId: `ft-${shortHash(`${signature}|${runNonce}|${index}`)}`,
        signature,
        gifDescriptor: descriptor,
        primitive,
        tempoMs,
        pathProfile,
        interactionModel,
        easing,
        gsapRecipe: buildFeatureGsapRecipe({
          index,
          primitive,
          tempoMs,
          pathProfile,
          interactionModel,
          easing,
        }),
      };
    }
  }
  throw new Error("Failed to generate unique feature animation after 2000 attempts.");
}

function createUniqueProtocol(
  index: number,
  rng: () => number,
  runNonce: string,
  usedProtocol: Set<string>,
  localProtocol: Set<string>,
  localProtocolArchetypes: Set<string>,
): ProtocolAnimation {
  for (let attempt = 0; attempt < 2000; attempt += 1) {
    const archetype = pickOne(PROTOCOL_ARCHETYPES, rng);
    const primitive = pickOne(PRIMITIVES, rng);
    const tempoMs = pickInt(900, 4600, rng);
    const spatialPath = pickOne(PATHS, rng);
    const phaseOffset = pickOne(PHASES, rng);
    const lineStyle = pickOne(LINES, rng);
    const signature = `${archetype}|${primitive}|${tempoMs}|${spatialPath}|${phaseOffset}|${lineStyle}`;
    if (!usedProtocol.has(signature) && !localProtocol.has(signature) && !localProtocolArchetypes.has(archetype)) {
      localProtocol.add(signature);
      localProtocolArchetypes.add(archetype);
      return {
        animationArchetypeId: `pt-${shortHash(`${signature}|${runNonce}|${index}`)}`,
        signature,
        primitive,
        tempoMs,
        spatialPath,
        phaseOffset,
        lineStyle,
        gsapRecipe: buildProtocolGsapRecipe({
          index,
          primitive,
          tempoMs,
          spatialPath,
          phaseOffset,
          lineStyle,
        }),
      };
    }
  }
  throw new Error("Failed to generate unique protocol animation after 2000 attempts.");
}
