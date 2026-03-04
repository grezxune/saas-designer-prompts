import { describe, expect, it } from "bun:test";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { tmpdir } from "node:os";

function runCli(args: string[]): { stdout: string; stderr: string; exitCode: number } {
  const cmd = Bun.spawnSync(["bun", "run", "src/cli/redesign-prompt.ts", ...args], {
    cwd: path.resolve(process.cwd()),
    stdout: "pipe",
    stderr: "pipe",
  });
  return {
    stdout: new TextDecoder().decode(cmd.stdout),
    stderr: new TextDecoder().decode(cmd.stderr),
    exitCode: cmd.exitCode,
  };
}

describe("redesign CLI", () => {
  it("avoids reusing signatures across sequential runs with shared registry", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "saas-redesign-"));
    const registry = path.join(dir, "registry.json");

    const baseArgs = [
      "--mode",
      "platform",
      "--target",
      "dashboard tiles",
      "--brand",
      "Acme",
      "--purpose",
      "Ops command center",
      "--preset",
      "C",
      "--feature-count",
      "4",
      "--protocol-count",
      "3",
      "--registry",
      registry,
      "--json",
    ];

    const first = runCli(baseArgs);
    expect(first.exitCode).toBe(0);

    const second = runCli(baseArgs);
    expect(second.exitCode).toBe(0);

    const p1 = JSON.parse(first.stdout) as {
      layoutSignature: string;
      layoutVariantPlan: { marketingHeaderPattern: string; heroAdjacentPattern: string };
      brandDnaSignature: string;
      copyVoiceSignature: string;
      interactionSignature: string;
      dataShapeSignature: string;
      noveltyScore: number;
      noveltyThreshold: number;
      noveltyBreakdown: { visual: number };
      featureAnimations: { signature: string; gifDescriptor: string; gsapRecipe: { steps: unknown[] } }[];
      protocolAnimations: { signature: string; gsapRecipe: { steps: unknown[] } }[];
    };
    const p2 = JSON.parse(second.stdout) as {
      layoutSignature: string;
      layoutVariantPlan: { marketingHeaderPattern: string; heroAdjacentPattern: string };
      brandDnaSignature: string;
      copyVoiceSignature: string;
      interactionSignature: string;
      dataShapeSignature: string;
      noveltyScore: number;
      noveltyThreshold: number;
      featureAnimations: { signature: string; gifDescriptor: string; gsapRecipe: { steps: unknown[] } }[];
      protocolAnimations: { signature: string; gsapRecipe: { steps: unknown[] } }[];
    };

    const f1 = new Set(p1.featureAnimations.map((x) => x.signature));
    const f2 = new Set(p2.featureAnimations.map((x) => x.signature));
    const pr1 = new Set(p1.protocolAnimations.map((x) => x.signature));
    const pr2 = new Set(p2.protocolAnimations.map((x) => x.signature));
    const g1 = new Set(p1.featureAnimations.map((x) => x.gifDescriptor));
    const g2 = new Set(p2.featureAnimations.map((x) => x.gifDescriptor));

    expect([...f1].filter((x) => f2.has(x)).length).toBe(0);
    expect([...pr1].filter((x) => pr2.has(x)).length).toBe(0);
    expect([...g1].filter((x) => g2.has(x)).length).toBe(0);
    expect(p1.layoutSignature).not.toBe(p2.layoutSignature);
    expect(p1.brandDnaSignature).not.toBe(p2.brandDnaSignature);
    expect(p1.copyVoiceSignature).not.toBe(p2.copyVoiceSignature);
    expect(p1.layoutVariantPlan.marketingHeaderPattern.length).toBeGreaterThan(3);
    expect(p1.layoutVariantPlan.heroAdjacentPattern.length).toBeGreaterThan(3);
    expect(p1.noveltyScore).toBeGreaterThan(0);
    expect(p1.noveltyThreshold).toBeGreaterThan(0);
    expect(p1.noveltyBreakdown.visual).toBeGreaterThanOrEqual(0);
    expect(p1.featureAnimations.every((x) => x.gsapRecipe.steps.length > 0)).toBe(true);
    expect(p1.protocolAnimations.every((x) => x.gsapRecipe.steps.length > 0)).toBe(true);

    const registryRaw = readFileSync(registry, "utf8");
    const saved = JSON.parse(registryRaw) as {
      sessions: unknown[];
      featureSignatures: unknown[];
      protocolSignatures: unknown[];
      gifDescriptors: unknown[];
      layoutSignatures: unknown[];
      compositionFingerprints: unknown[];
      brandDnaSignatures: unknown[];
      copyVoiceSignatures: unknown[];
      interactionSignatures: unknown[];
      dataShapeSignatures: unknown[];
      visualHashes: unknown[];
      noveltyScores: unknown[];
    };

    expect(saved.sessions.length).toBe(2);
    expect(saved.featureSignatures.length).toBeGreaterThanOrEqual(8);
    expect(saved.protocolSignatures.length).toBeGreaterThanOrEqual(6);
    expect(saved.gifDescriptors.length).toBeGreaterThanOrEqual(8);
    expect(saved.layoutSignatures.length).toBeGreaterThanOrEqual(2);
    expect(saved.compositionFingerprints.length).toBeGreaterThanOrEqual(2);
    expect(saved.brandDnaSignatures.length).toBeGreaterThanOrEqual(2);
    expect(saved.copyVoiceSignatures.length).toBeGreaterThanOrEqual(2);
    expect(saved.interactionSignatures.length).toBeGreaterThanOrEqual(2);
    expect(saved.dataShapeSignatures.length).toBeGreaterThanOrEqual(2);
    expect(saved.visualHashes.length).toBeGreaterThanOrEqual(2);
    expect(saved.noveltyScores.length).toBeGreaterThanOrEqual(2);
  });

  it("can resume from a saved session and apply tweak notes without full re-spec", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "saas-redesign-resume-"));
    const registry = path.join(dir, "registry.json");
    const sessions = path.join(dir, "sessions");

    const first = runCli([
      "--mode",
      "platform",
      "--target",
      "settings security panel",
      "--brand",
      "Acme",
      "--purpose",
      "Ops command center",
      "--preset",
      "A",
      "--registry",
      registry,
      "--session-dir",
      sessions,
      "--json",
    ]);
    expect(first.exitCode).toBe(0);

    const p1 = JSON.parse(first.stdout) as {
      runNonce: string;
      target: string;
      layoutSignature: string;
      session?: { id: string; path: string };
    };
    expect(typeof p1.session?.id).toBe("string");

    const second = runCli([
      "--resume",
      p1.session?.id ?? "",
      "--session-dir",
      sessions,
      "--registry",
      registry,
      "--tweak",
      "Keep layout and copy; reduce motion intensity by 20%.",
      "--json",
    ]);
    expect(second.exitCode).toBe(0);

    const p2 = JSON.parse(second.stdout) as {
      runNonce: string;
      target: string;
      layoutSignature: string;
      sourceSessionId?: string;
      tweakNotes?: string;
      session?: { id: string; path: string };
      promptMarkdown: string;
    };

    expect(p2.target).toBe(p1.target);
    expect(p2.sourceSessionId).toBe(p1.session?.id);
    expect(p2.tweakNotes).toBe("Keep layout and copy; reduce motion intensity by 20%.");
    expect(p2.runNonce).not.toBe(p1.runNonce);
    expect(p2.layoutSignature).not.toBe(p1.layoutSignature);
    expect(typeof p2.session?.id).toBe("string");
    expect(p2.session?.id).not.toBe(p1.session?.id);
    expect(p2.promptMarkdown.includes("Source Session")).toBe(true);
    expect(p2.promptMarkdown.includes("delta iteration")).toBe(true);
  });

  it("captures current state as a baseline seed for first-time projects", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "saas-redesign-baseline-"));
    const registry = path.join(dir, "registry.json");
    const sessions = path.join(dir, "sessions");
    const profile = path.join(dir, "current-state.json");

    writeFileSync(
      profile,
      JSON.stringify({
        mode: "platform",
        target: "dashboard shell and header",
        brand: "BaselineCo",
        purpose: "Keep operations visible and calm",
        preset: "B",
        valueProps: ["Stable navigation", "Fast summaries", "Clear action states"],
        cta: "Review dashboard",
        currentStateNotes: "Today the product uses a static full-width header and dense KPI board.",
      }),
      "utf8",
    );

    const baseline = runCli([
      "--capture-current",
      "--current-state-file",
      profile,
      "--current-state",
      "Card spacing is tight and interactions are quiet.",
      "--registry",
      registry,
      "--session-dir",
      sessions,
      "--json",
    ]);
    expect(baseline.exitCode).toBe(0);

    const p1 = JSON.parse(baseline.stdout) as {
      seedKind: string;
      currentStateNotes?: string;
      runNonce: string;
      session?: { id: string };
      target: string;
    };

    expect(p1.seedKind).toBe("baseline-current-state");
    expect(p1.runNonce.startsWith("baseline-")).toBe(true);
    expect((p1.currentStateNotes ?? "").includes("static full-width header")).toBe(true);
    expect((p1.currentStateNotes ?? "").includes("interactions are quiet")).toBe(true);
    expect(typeof p1.session?.id).toBe("string");

    const resumed = runCli([
      "--resume",
      p1.session?.id ?? "",
      "--session-dir",
      sessions,
      "--registry",
      registry,
      "--tweak",
      "Redesign only the header and dashboard cards with higher contrast.",
      "--json",
    ]);
    expect(resumed.exitCode).toBe(0);

    const p2 = JSON.parse(resumed.stdout) as {
      seedKind: string;
      sourceSessionId?: string;
      target: string;
      tweakNotes?: string;
    };

    expect(p2.seedKind).toBe("generated");
    expect(p2.sourceSessionId).toBe(p1.session?.id);
    expect(p2.target).toBe(p1.target);
    expect(p2.tweakNotes).toBe("Redesign only the header and dashboard cards with higher contrast.");
  });

  it("accepts plain-English request input and maps it into redesign fields", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "saas-redesign-nl-"));
    const registry = path.join(dir, "registry.json");

    const result = runCli([
      "--request",
      "mode: platform. target: billing table interactions. brand: NovaOps. purpose: reduce invoice confusion. preset: D. value props: Instant totals, Clear statuses, One-click exports. cta: Start pilot. Use 5 feature tiles and 4 protocol steps. tweak: keep IA stable but make motion bolder.",
      "--no-ai",
      "--registry",
      registry,
      "--json",
      "--dry-run",
      "--no-save",
    ]);
    expect(result.exitCode).toBe(0);

    const packet = JSON.parse(result.stdout) as {
      mode: string;
      target: string;
      preset: string;
      featureAnimations: unknown[];
      protocolAnimations: unknown[];
      tweakNotes?: string;
      requestInterpretation?: { parser: string; raw: string };
      promptMarkdown: string;
    };

    expect(packet.mode).toBe("platform");
    expect(packet.target).toContain("billing table interactions");
    expect(packet.preset).toBe("D");
    expect(packet.featureAnimations.length).toBe(5);
    expect(packet.protocolAnimations.length).toBe(4);
    expect(packet.promptMarkdown.includes("\"Instant totals\"")).toBe(true);
    expect(packet.promptMarkdown.includes("\"Clear statuses\"")).toBe(true);
    expect(packet.promptMarkdown.includes("\"One-click exports\"")).toBe(true);
    expect(packet.promptMarkdown.includes("\"cta\": \"Start pilot\"")).toBe(true);
    expect(packet.tweakNotes?.includes("make motion bolder")).toBe(true);
    expect(packet.requestInterpretation?.parser).toBe("heuristic");
    expect(packet.promptMarkdown.includes("Request Parser")).toBe(true);
  });

  it("accepts plain-English request from file input", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "saas-redesign-nl-file-"));
    const registry = path.join(dir, "registry.json");
    const requestPath = path.join(dir, "request.txt");

    writeFileSync(
      requestPath,
      "target: notifications command center. brand: RadarCo. preset: A. cta: Explore alerts.",
      "utf8",
    );

    const result = runCli([
      "--request-file",
      requestPath,
      "--no-ai",
      "--registry",
      registry,
      "--json",
      "--dry-run",
      "--no-save",
    ]);
    expect(result.exitCode).toBe(0);

    const packet = JSON.parse(result.stdout) as {
      target: string;
      preset: string;
      requestInterpretation?: { parser: string; raw: string };
      promptMarkdown: string;
    };

    expect(packet.target).toContain("notifications command center");
    expect(packet.preset).toBe("A");
    expect(packet.requestInterpretation?.parser).toBe("heuristic");
    expect(packet.promptMarkdown.includes("RadarCo")).toBe(true);
  });
});
