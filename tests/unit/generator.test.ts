import { describe, expect, it } from "bun:test";
import { generateRedesignPacket } from "../../src/lib/generator";
import { createEmptyRegistry } from "../../src/lib/registry";

describe("generateRedesignPacket", () => {
  it("creates unique feature/protocol signatures and GIF descriptors within one packet", () => {
    const packet = generateRedesignPacket(
      {
        mode: "platform",
        target: "feature tiles",
        brand: "Acme",
        purpose: "Monitoring",
        preset: "B",
        runNonce: "20260304T120000Z-abcd",
        valueProps: ["Fast", "Reliable", "Clear"],
        cta: "Start",
        featureTileCount: 6,
        protocolStepCount: 5,
      },
      createEmptyRegistry(),
    );

    const featureSignatures = new Set(packet.featureAnimations.map((x) => x.signature));
    const protocolSignatures = new Set(packet.protocolAnimations.map((x) => x.signature));
    const gifDescriptors = new Set(packet.featureAnimations.map((x) => x.gifDescriptor));
    const featureArchetypes = new Set(packet.featureAnimations.map((x) => x.signature.split("|")[0]));
    const protocolArchetypes = new Set(packet.protocolAnimations.map((x) => x.signature.split("|")[0]));

    expect(featureSignatures.size).toBe(packet.featureAnimations.length);
    expect(protocolSignatures.size).toBe(packet.protocolAnimations.length);
    expect(gifDescriptors.size).toBe(packet.featureAnimations.length);
    expect(featureArchetypes.size).toBe(packet.featureAnimations.length);
    expect(protocolArchetypes.size).toBe(packet.protocolAnimations.length);
    for (const feature of packet.featureAnimations) {
      expect(feature.signature.includes("undefined")).toBe(false);
      expect(feature.gifDescriptor.includes("undefined")).toBe(false);
      expect(feature.tempoMs).toBeGreaterThan(0);
    }
    for (const protocol of packet.protocolAnimations) {
      expect(protocol.signature.includes("undefined")).toBe(false);
      expect(protocol.tempoMs).toBeGreaterThan(0);
    }
  });
});
