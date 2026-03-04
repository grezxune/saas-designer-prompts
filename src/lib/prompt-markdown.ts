import type { FeatureAnimation, ProtocolAnimation, RedesignInput } from "./generator";

/**
 * Builds the markdown packet that can be sent to an implementation agent.
 */
export function buildPromptMarkdown(
  input: RedesignInput,
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
    "",
    "## Implementation Instructions",
    "1. Load `saas-designer.md`, then enforce `saas-ux-core-rules.md` fundamentals.",
    `2. Apply ${input.mode === "landing" ? "landing" : "platform"} mode rules for structure and quality gates.`,
    `3. Redesign only this slice: "${input.target}" while preserving app information architecture.`,
    "4. Enforce no-repeat contract using the archetype IDs and GIF descriptors below.",
    "",
    "## Required Variation Plan Fragment",
    "```json",
    JSON.stringify(
      {
        runNonce: input.runNonce,
        preset: input.preset,
        target: input.target,
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
