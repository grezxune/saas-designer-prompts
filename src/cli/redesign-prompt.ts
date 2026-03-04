#!/usr/bin/env bun
import path from "node:path";
import {
  createEmptyRegistry,
  getDefaultRegistryPath,
  loadRegistry,
  recordSession,
  saveRegistry,
} from "../lib/registry";
import { generateRedesignPacket, type Mode, type Preset } from "../lib/generator";
import { createRunNonce, pickOne } from "../lib/random";

interface CliOptions {
  mode: Mode;
  target: string;
  brand: string;
  purpose: string;
  preset: Preset;
  valueProps: string[];
  cta: string;
  featureTileCount?: number;
  protocolStepCount?: number;
  dryRun: boolean;
  json: boolean;
  outPath?: string;
  registryPath: string;
}

const PRESETS: Preset[] = ["A", "B", "C", "D"];

/**
 * Entrypoint for the cross-project redesign packet generator.
 */
async function main(): Promise<void> {
  const opts = parseArgs(process.argv.slice(2));
  const registry = await loadRegistry(opts.registryPath).catch(() => createEmptyRegistry());

  const packet = generateRedesignPacket(
    {
      mode: opts.mode,
      target: opts.target,
      brand: opts.brand,
      purpose: opts.purpose,
      preset: opts.preset,
      runNonce: createRunNonce(),
      valueProps: opts.valueProps,
      cta: opts.cta,
      featureTileCount: opts.featureTileCount,
      protocolStepCount: opts.protocolStepCount,
    },
    registry,
  );

  if (!opts.dryRun) {
    const next = recordSession(registry, {
      generatedAt: packet.generatedAt,
      mode: packet.mode,
      target: packet.target,
      runNonce: packet.runNonce,
      featureSignatures: packet.featureAnimations.map((item) => item.signature),
      protocolSignatures: packet.protocolAnimations.map((item) => item.signature),
      gifDescriptors: packet.featureAnimations.map((item) => item.gifDescriptor),
    });
    await saveRegistry(opts.registryPath, next);
  }

  const output = opts.json ? JSON.stringify(packet, null, 2) : packet.promptMarkdown;
  if (opts.outPath) {
    const targetPath = path.resolve(opts.outPath);
    await Bun.write(targetPath, output + "\n");
    process.stdout.write(`Wrote redesign packet to ${targetPath}\n`);
    return;
  }
  process.stdout.write(output + "\n");
}

function parseArgs(argv: string[]): CliOptions {
  if (argv.includes("--help") || argv.includes("-h")) {
    printHelp();
    process.exit(0);
  }

  const map = new Map<string, string | true>();
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      map.set(key, true);
      continue;
    }
    map.set(key, next);
    i += 1;
  }

  const target = getString(map, "target");
  if (!target) throw new Error("Missing required --target argument.");
  const modeRaw = (getString(map, "mode") ?? "platform") as Mode;
  if (modeRaw !== "landing" && modeRaw !== "platform") throw new Error("--mode must be landing or platform.");

  const presetRaw = getString(map, "preset")?.toUpperCase() as Preset | undefined;
  const preset = PRESETS.includes(presetRaw as Preset)
    ? (presetRaw as Preset)
    : pickOne(PRESETS, Math.random);

  return {
    mode: modeRaw,
    target,
    brand: getString(map, "brand") ?? path.basename(process.cwd()),
    purpose: getString(map, "purpose") ?? "Refine UX and interaction quality for this app.",
    preset,
    valueProps: splitCsv(getString(map, "value-props") ?? "Higher clarity,Faster action loops,Distinctive UI motion"),
    cta: getString(map, "cta") ?? "Ship redesign",
    featureTileCount: parseOptionalInt(getString(map, "feature-count")),
    protocolStepCount: parseOptionalInt(getString(map, "protocol-count")),
    dryRun: map.has("dry-run"),
    json: map.has("json"),
    outPath: getString(map, "out"),
    registryPath: path.resolve(getString(map, "registry") ?? getDefaultRegistryPath()),
  };
}

function getString(map: Map<string, string | true>, key: string): string | undefined {
  const value = map.get(key);
  return typeof value === "string" ? value : undefined;
}

function parseOptionalInt(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) throw new Error(`Invalid numeric value: ${value}`);
  return parsed;
}

function splitCsv(value: string): string[] {
  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 6);
}

function printHelp(): void {
  process.stdout.write(`saas-redesign\n\n`);
  process.stdout.write(`Required:\n  --target \"dashboard KPI tiles\"\n\n`);
  process.stdout.write(`Options:\n`);
  process.stdout.write(`  --mode landing|platform (default: platform)\n`);
  process.stdout.write(`  --brand \"Brand Name\"\n`);
  process.stdout.write(`  --purpose \"One-line app purpose\"\n`);
  process.stdout.write(`  --preset A|B|C|D (default: random)\n`);
  process.stdout.write(`  --value-props \"A,B,C\"\n`);
  process.stdout.write(`  --cta \"Start trial\"\n`);
  process.stdout.write(`  --feature-count N\n`);
  process.stdout.write(`  --protocol-count N\n`);
  process.stdout.write(`  --registry /abs/path/registry.json\n`);
  process.stdout.write(`  --json (emit JSON packet)\n`);
  process.stdout.write(`  --out /abs/path/output.md\n`);
  process.stdout.write(`  --dry-run (skip registry write)\n`);
}

main().catch((error) => {
  process.stderr.write(`Error: ${(error as Error).message}\n`);
  process.exit(1);
});
