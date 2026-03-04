import type {
  FeatureAnimation,
  LayoutVariantPlan,
  ProtocolAnimation,
  RedesignInput,
} from "./redesign-types";

/**
 * Builds the markdown packet that can be sent to an implementation agent.
 */
export function buildPromptMarkdown(
  input: RedesignInput,
  layoutVariantPlan: LayoutVariantPlan,
  layoutSignature: string,
  featureAnimations: FeatureAnimation[],
  protocolAnimations: ProtocolAnimation[],
): string {
  const base = [
    `# Redesign Packet: ${input.target}`,
    "",
    `- Mode: ${input.mode}`,
    `- Brand: ${input.brand}`,
    `- Purpose: ${input.purpose}`,
    `- Preset: ${input.preset}`,
    `- Run Nonce: ${input.runNonce}`,
    `- Layout Signature: ${layoutSignature}`,
    ...(input.sourceSessionId ? [`- Source Session: ${input.sourceSessionId}`] : []),
    ...(input.tweakNotes ? [`- Tweak Notes: ${input.tweakNotes}`] : []),
    "",
    "## Implementation Instructions",
    "1. Load `saas-designer.md`, then enforce `saas-ux-core-rules.md` fundamentals.",
    `2. Apply ${input.mode === "landing" ? "landing" : "platform"} mode rules for structure and quality gates.`,
    `3. Redesign only this slice: "${input.target}" while preserving app information architecture.`,
    "4. Enforce no-repeat contract using the archetype IDs and GIF descriptors below.",
    "5. Implement each animation from its `gsapRecipe` object directly (timeline steps, trigger, repeat/yoyo, reduced-motion strategy).",
    ...(input.sourceSessionId
      ? ["6. Treat this as a delta iteration from the source session; keep unaffected structures and only apply requested tweaks."]
      : []),
    "",
    "## Required Variation Plan Fragment",
    "```json",
    JSON.stringify(
      {
        runNonce: input.runNonce,
        preset: input.preset,
        target: input.target,
        layoutSignature,
        layoutVariantPlan,
        featureAnimationPlan: featureAnimations,
        protocolAnimationPlan: protocolAnimations,
        valueProps: input.valueProps,
        cta: input.cta,
      },
      null,
      2,
    ),
    "```",
  ];
  return base.join("\n");
}
