import { describe, expect, it } from "bun:test";
import { mkdtempSync, readFileSync } from "node:fs";
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
      featureAnimations: { signature: string; gifDescriptor: string; gsapRecipe: { steps: unknown[] } }[];
      protocolAnimations: { signature: string; gsapRecipe: { steps: unknown[] } }[];
    };
    const p2 = JSON.parse(second.stdout) as {
      layoutSignature: string;
      layoutVariantPlan: { marketingHeaderPattern: string; heroAdjacentPattern: string };
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
    expect(p1.layoutVariantPlan.marketingHeaderPattern.length).toBeGreaterThan(3);
    expect(p1.layoutVariantPlan.heroAdjacentPattern.length).toBeGreaterThan(3);
    expect(p1.featureAnimations.every((x) => x.gsapRecipe.steps.length > 0)).toBe(true);
    expect(p1.protocolAnimations.every((x) => x.gsapRecipe.steps.length > 0)).toBe(true);

    const registryRaw = readFileSync(registry, "utf8");
    const saved = JSON.parse(registryRaw) as {
      sessions: unknown[];
      featureSignatures: unknown[];
      protocolSignatures: unknown[];
      gifDescriptors: unknown[];
      layoutSignatures: unknown[];
    };

    expect(saved.sessions.length).toBe(2);
    expect(saved.featureSignatures.length).toBeGreaterThanOrEqual(8);
    expect(saved.protocolSignatures.length).toBeGreaterThanOrEqual(6);
    expect(saved.gifDescriptors.length).toBeGreaterThanOrEqual(8);
    expect(saved.layoutSignatures.length).toBeGreaterThanOrEqual(2);
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
});
