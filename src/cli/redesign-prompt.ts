#!/usr/bin/env bun
import path from "node:path";
import { createEmptyRegistry, getDefaultRegistryPath, loadRegistry, recordSession, saveRegistry } from "../lib/registry";
import { generateRedesignPacket } from "../lib/generator";
import { createRunNonce, pickOne } from "../lib/random";
import type { Mode, Preset, RedesignInput, RedesignPacket, RequestInterpretation } from "../lib/redesign-types";
import { getDefaultSessionDir, loadSession, saveSession } from "../lib/session-store";
import { getString, parseArgMap, parseOptionalInt, printHelp, splitCsv } from "./cli-helpers";
import { computeVisualSimilarity } from "../lib/visual-similarity";
import { computeNoveltyScore } from "../lib/novelty-score";
import { withFileLock } from "../lib/lock";
import { resolveCurrentStateBaseInput } from "./current-state";
import { resolveNaturalLanguageIntent } from "./nl-input";

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
  request?: string;
  requestFile?: string;
  openrouterModel?: string;
  noAi: boolean;
  requestInterpretation?: RequestInterpretation;
  captureCurrent: boolean;
  currentState?: string;
  currentStateFile?: string;
  preserveRunNonce: boolean;
  maxAttempts: number;
  noveltyThreshold: number;
  visualThreshold: number;
  dryRun: boolean;
  noSave: boolean;
  json: boolean;
  outPath?: string;
  registryPath: string;
  sessionDir: string;
}

const PRESETS: Preset[] = ["A", "B", "C", "D"];

async function main(): Promise<void> {
  const opts = await enrichWithNaturalLanguage(parseArgs(process.argv.slice(2)));
  const output = await withFileLock(`${opts.registryPath}.lock`, async () => {
    const registry = await loadRegistry(opts.registryPath).catch(() => createEmptyRegistry());
    const base = await resolveBaseInput(opts);

    const { packet, input } = await selectNovelPacket(opts, base, registry);

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
        compositionFingerprints: [packet.compositionFingerprint],
        brandDnaSignatures: [packet.brandDnaSignature],
        copyVoiceSignatures: [packet.copyVoiceSignature],
        interactionSignatures: [packet.interactionSignature],
        dataShapeSignatures: [packet.dataShapeSignature],
        visualHashes: [packet.visualHash],
        noveltyScores: [packet.noveltyScore],
        variantTokens: packet.variantTokens,
      });
      await saveRegistry(opts.registryPath, next);
    }

    if (!opts.noSave) packet.session = await saveSession(opts.sessionDir, input, packet);
    return opts.json ? JSON.stringify(packet, null, 2) : toMarkdownOutput(packet.promptMarkdown, packet.session);
  });

  if (opts.outPath) {
    const targetPath = path.resolve(opts.outPath);
    await Bun.write(targetPath, output + "\n");
    process.stdout.write(`Wrote redesign packet to ${targetPath}\n`);
    return;
  }
  process.stdout.write(output + "\n");
}

async function enrichWithNaturalLanguage(opts: CliOptions): Promise<CliOptions> {
  const { intent, interpretation } = await resolveNaturalLanguageIntent({
    request: opts.request,
    requestFile: opts.requestFile,
    noAi: opts.noAi,
    openrouterModel: opts.openrouterModel,
  });

  const merged: CliOptions = {
    ...opts,
    mode: opts.mode ?? intent.mode,
    target: opts.target ?? intent.target,
    brand: opts.brand ?? intent.brand,
    purpose: opts.purpose ?? intent.purpose,
    preset: opts.preset ?? intent.preset,
    valueProps: opts.valueProps ?? intent.valueProps,
    cta: opts.cta ?? intent.cta,
    featureTileCount: opts.featureTileCount ?? intent.featureTileCount,
    protocolStepCount: opts.protocolStepCount ?? intent.protocolStepCount,
    tweakNotes: opts.tweakNotes ?? intent.tweakNotes,
    captureCurrent: opts.captureCurrent || (Boolean(intent.captureCurrent) && !opts.resumeRef),
    currentState: opts.currentState ?? intent.currentStateNotes,
  };

  if (interpretation && !merged.tweakNotes) merged.tweakNotes = interpretation.raw;
  if (interpretation) merged.requestInterpretation = interpretation;
  return merged;
}

async function selectNovelPacket(
  opts: CliOptions,
  base: Partial<RedesignInput>,
  registry: Awaited<ReturnType<typeof loadRegistry>>,
): Promise<{ packet: RedesignPacket; input: RedesignInput }> {
  const attempts = opts.captureCurrent ? 1 : opts.preserveRunNonce ? 1 : Math.max(1, opts.maxAttempts);
  let best: { packet: RedesignPacket; input: RedesignInput } | null = null;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const input = buildRedesignInput(opts, base, attempt);
    const packet = generateRedesignPacket(input, registry);

    const visual = await computeVisualSimilarity(packet, registry.visualHashes.slice(-50));
    packet.visualMethod = visual.method;
    packet.visualHash = visual.hash;
    packet.visualDistance = visual.distance;

    const novelty = computeNoveltyScore(
      {
        layoutSignature: packet.layoutSignature,
        brandDnaSignature: packet.brandDnaSignature,
        copyVoiceSignature: packet.copyVoiceSignature,
        interactionSignature: packet.interactionSignature,
        dataShapeSignature: packet.dataShapeSignature,
        featureSignatures: packet.featureAnimations.map((x) => x.signature),
        protocolSignatures: packet.protocolAnimations.map((x) => x.signature),
        visualDistance: packet.visualDistance,
      },
      registry,
      opts.noveltyThreshold,
    );

    packet.noveltyScore = novelty.score;
    packet.noveltyThreshold = novelty.threshold;
    packet.noveltyPassed = novelty.passed && packet.visualDistance >= opts.visualThreshold;
    packet.noveltyBreakdown = novelty.breakdown;

    if (opts.captureCurrent) {
      packet.noveltyPassed = true;
      return { packet, input };
    }

    if (!best || packet.noveltyScore > best.packet.noveltyScore) best = { packet, input };
    if (packet.noveltyPassed) return { packet, input };
  }

  if (!best) throw new Error("Failed to generate redesign packet.");
  return best;
}

async function resolveBaseInput(opts: CliOptions): Promise<Partial<RedesignInput>> {
  const resumed = opts.resumeRef
    ? await loadSession(opts.sessionDir, opts.resumeRef).then((session) => ({ ...session.input, sourceSessionId: session.id }))
    : {};
  const captured = await resolveCurrentStateBaseInput(opts);
  return { ...resumed, ...captured };
}

function buildRedesignInput(opts: CliOptions, base: Partial<RedesignInput>, attempt: number): RedesignInput {
  const mode = opts.mode ?? base.mode ?? "platform";
  const target = opts.target ?? base.target;
  if (!target) throw new Error("Missing target: provide --target, --resume, or --capture-current with a profile that includes target.");
  const suffix = attempt > 0 ? `-r${attempt}` : "";
  const useBaseNonce = Boolean(
    (opts.preserveRunNonce && base.runNonce) || (base.seedKind === "baseline-current-state" && base.runNonce),
  );
  const runNonceBase = useBaseNonce && base.runNonce ? base.runNonce : createRunNonce();

  return {
    mode,
    target,
    brand: opts.brand ?? base.brand ?? path.basename(process.cwd()),
    purpose: opts.purpose ?? base.purpose ?? "Refine UX and interaction quality for this app.",
    preset: opts.preset ?? base.preset ?? pickOne(PRESETS, Math.random),
    runNonce: `${runNonceBase}${suffix}`,
    valueProps: opts.valueProps ?? base.valueProps ?? ["Higher clarity", "Faster action loops", "Distinctive UI motion"],
    cta: opts.cta ?? base.cta ?? "Ship redesign",
    featureTileCount: opts.featureTileCount ?? base.featureTileCount,
    protocolStepCount: opts.protocolStepCount ?? base.protocolStepCount,
    sourceSessionId: base.sourceSessionId,
    tweakNotes: opts.tweakNotes ?? base.tweakNotes,
    seedKind: opts.captureCurrent ? "baseline-current-state" : "generated",
    currentStateNotes: base.currentStateNotes,
    requestInterpretation: opts.requestInterpretation ?? base.requestInterpretation,
  };
}

function parseArgs(argv: string[]): CliOptions {
  if (argv.includes("--help") || argv.includes("-h")) { printHelp(); process.exit(0); }
  const map = parseArgMap(argv);
  const modeRaw = getString(map, "mode") as Mode | undefined;
  if (modeRaw && modeRaw !== "landing" && modeRaw !== "platform") throw new Error("--mode must be landing or platform.");
  const presetRaw = getString(map, "preset")?.toUpperCase() as Preset | undefined;
  const preset = presetRaw && PRESETS.includes(presetRaw) ? presetRaw : undefined;
  const visualThreshold = Number.parseFloat(getString(map, "visual-threshold") ?? "0.28");
  const captureCurrent = map.has("capture-current");
  const currentState = getString(map, "current-state");
  const currentStateFile = getString(map, "current-state-file");
  const request = getString(map, "request");
  const requestFile = getString(map, "request-file");
  const noAi = map.has("no-ai");
  if (!Number.isFinite(visualThreshold) || visualThreshold < 0 || visualThreshold > 1) {
    throw new Error("--visual-threshold must be a number between 0 and 1.");
  }
  if (request && requestFile) {
    throw new Error("Provide either --request or --request-file, not both.");
  }
  if ((getString(map, "openrouter-model") || noAi) && !request && !requestFile) {
    throw new Error("--openrouter-model and --no-ai require --request or --request-file.");
  }
  if ((currentState || currentStateFile) && !captureCurrent) {
    throw new Error("--current-state and --current-state-file require --capture-current.");
  }
  if (captureCurrent && getString(map, "resume")) {
    throw new Error("--capture-current cannot be combined with --resume.");
  }
  if (captureCurrent && !currentState && !currentStateFile && !request && !requestFile) {
    throw new Error("--capture-current requires --current-state, --current-state-file, or --request.");
  }

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
    request,
    requestFile,
    openrouterModel: getString(map, "openrouter-model"),
    noAi,
    captureCurrent,
    currentState,
    currentStateFile,
    preserveRunNonce: map.has("preserve-run-nonce"),
    maxAttempts: parseOptionalInt(getString(map, "max-attempts")) ?? 10,
    noveltyThreshold: parseOptionalInt(getString(map, "novelty-threshold")) ?? 72,
    visualThreshold,
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

main().catch((error) => { process.stderr.write(`Error: ${(error as Error).message}\n`); process.exit(1); });
