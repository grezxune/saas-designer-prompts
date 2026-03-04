#!/usr/bin/env bun
import path from "node:path";
import {
  createEmptyRegistry,
  getDefaultRegistryPath,
  loadRegistry,
  recordSession,
  saveRegistry,
} from "../lib/registry";
import { generateRedesignPacket } from "../lib/generator";
import { createRunNonce, pickOne } from "../lib/random";
import type { Mode, Preset, RedesignInput } from "../lib/redesign-types";
import {
  getDefaultSessionDir,
  loadSession,
  saveSession,
} from "../lib/session-store";
import {
  getString,
  parseArgMap,
  parseOptionalInt,
  printHelp,
  splitCsv,
} from "./cli-helpers";

interface CliOptions {
  mode?: Mode;
  target?: string;
  brand?: string;
  purpose?: string;
  preset?: Preset;
  valueProps?: string[];
  cta?: string;
  featureTileCount?: number;
  protocolStepCount?: number;
  resumeRef?: string;
  tweakNotes?: string;
  preserveRunNonce: boolean;
  dryRun: boolean;
  noSave: boolean;
  json: boolean;
  outPath?: string;
  registryPath: string;
  sessionDir: string;
}

const PRESETS: Preset[] = ["A", "B", "C", "D"];

/**
 * Entrypoint for the cross-project redesign packet generator.
 */
async function main(): Promise<void> {
  const opts = parseArgs(process.argv.slice(2));
  const registry = await loadRegistry(opts.registryPath).catch(() => createEmptyRegistry());

  const base = await resolveBaseInput(opts);
  const input = buildRedesignInput(opts, base);

  const packet = generateRedesignPacket(input, registry);

  if (!opts.dryRun) {
    const next = recordSession(registry, {
      generatedAt: packet.generatedAt,
      mode: packet.mode,
      target: packet.target,
      runNonce: packet.runNonce,
      featureSignatures: packet.featureAnimations.map((item) => item.signature),
      protocolSignatures: packet.protocolAnimations.map((item) => item.signature),
      gifDescriptors: packet.featureAnimations.map((item) => item.gifDescriptor),
      layoutSignatures: [packet.layoutSignature],
    });
    await saveRegistry(opts.registryPath, next);
  }

  if (!opts.noSave) {
    packet.session = await saveSession(opts.sessionDir, input, packet);
  }

  const output = opts.json ? JSON.stringify(packet, null, 2) : toMarkdownOutput(packet.promptMarkdown, packet.session);
  if (opts.outPath) {
    const targetPath = path.resolve(opts.outPath);
    await Bun.write(targetPath, output + "\n");
    process.stdout.write(`Wrote redesign packet to ${targetPath}\n`);
    return;
  }
  process.stdout.write(output + "\n");
}

async function resolveBaseInput(opts: CliOptions): Promise<Partial<RedesignInput>> {
  if (!opts.resumeRef) return {};
  const session = await loadSession(opts.sessionDir, opts.resumeRef);
  return {
    ...session.input,
    sourceSessionId: session.id,
  };
}

function buildRedesignInput(opts: CliOptions, base: Partial<RedesignInput>): RedesignInput {
  const mode = opts.mode ?? base.mode ?? "platform";
  const target = opts.target ?? base.target;
  if (!target) throw new Error("Missing required --target argument (or provide --resume with a saved target).");

  return {
    mode,
    target,
    brand: opts.brand ?? base.brand ?? path.basename(process.cwd()),
    purpose: opts.purpose ?? base.purpose ?? "Refine UX and interaction quality for this app.",
    preset: opts.preset ?? base.preset ?? pickOne(PRESETS, Math.random),
    runNonce: opts.preserveRunNonce && base.runNonce ? base.runNonce : createRunNonce(),
    valueProps: opts.valueProps ?? base.valueProps ?? ["Higher clarity", "Faster action loops", "Distinctive UI motion"],
    cta: opts.cta ?? base.cta ?? "Ship redesign",
    featureTileCount: opts.featureTileCount ?? base.featureTileCount,
    protocolStepCount: opts.protocolStepCount ?? base.protocolStepCount,
    sourceSessionId: base.sourceSessionId,
    tweakNotes: opts.tweakNotes,
  };
}

function parseArgs(argv: string[]): CliOptions {
  if (argv.includes("--help") || argv.includes("-h")) {
    printHelp();
    process.exit(0);
  }

  const map = parseArgMap(argv);
  const modeRaw = getString(map, "mode") as Mode | undefined;
  if (modeRaw && modeRaw !== "landing" && modeRaw !== "platform") {
    throw new Error("--mode must be landing or platform.");
  }

  const presetRaw = getString(map, "preset")?.toUpperCase() as Preset | undefined;
  const preset = presetRaw && PRESETS.includes(presetRaw) ? presetRaw : undefined;

  return {
    mode: modeRaw,
    target: getString(map, "target"),
    brand: getString(map, "brand"),
    purpose: getString(map, "purpose"),
    preset,
    valueProps: getString(map, "value-props") ? splitCsv(getString(map, "value-props") as string) : undefined,
    cta: getString(map, "cta"),
    featureTileCount: parseOptionalInt(getString(map, "feature-count")),
    protocolStepCount: parseOptionalInt(getString(map, "protocol-count")),
    resumeRef: getString(map, "resume"),
    tweakNotes: getString(map, "tweak"),
    preserveRunNonce: map.has("preserve-run-nonce"),
    dryRun: map.has("dry-run"),
    noSave: map.has("no-save"),
    json: map.has("json"),
    outPath: getString(map, "out"),
    registryPath: path.resolve(getString(map, "registry") ?? getDefaultRegistryPath()),
    sessionDir: path.resolve(getString(map, "session-dir") ?? getDefaultSessionDir()),
  };
}

function toMarkdownOutput(markdown: string, session?: { id: string; path: string }): string {
  if (!session) return markdown;
  return `${markdown}\n\nSaved Session: ${session.id}\nSession Path: ${session.path}`;
}

main().catch((error) => {
  process.stderr.write(`Error: ${(error as Error).message}\n`);
  process.exit(1);
});
