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
      featureAnimations: { signature: string; gifDescriptor: string }[];
      protocolAnimations: { signature: string }[];
    };
    const p2 = JSON.parse(second.stdout) as {
      featureAnimations: { signature: string; gifDescriptor: string }[];
      protocolAnimations: { signature: string }[];
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

    const registryRaw = readFileSync(registry, "utf8");
    const saved = JSON.parse(registryRaw) as {
      sessions: unknown[];
      featureSignatures: unknown[];
      protocolSignatures: unknown[];
      gifDescriptors: unknown[];
    };

    expect(saved.sessions.length).toBe(2);
    expect(saved.featureSignatures.length).toBeGreaterThanOrEqual(8);
    expect(saved.protocolSignatures.length).toBeGreaterThanOrEqual(6);
    expect(saved.gifDescriptors.length).toBeGreaterThanOrEqual(8);
  });
});
