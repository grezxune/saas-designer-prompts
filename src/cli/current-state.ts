import { readFile } from "node:fs/promises";
import path from "node:path";
import { shortHash } from "../lib/random";
import type { Mode, Preset, RedesignInput } from "../lib/redesign-types";

export interface CurrentStateOptions {
  captureCurrent: boolean;
  currentState?: string;
  currentStateFile?: string;
}

interface CurrentStateProfile {
  mode?: Mode;
  target?: string;
  brand?: string;
  purpose?: string;
  preset?: Preset;
  valueProps?: string[];
  cta?: string;
  featureTileCount?: number;
  protocolStepCount?: number;
  currentStateNotes?: string;
}

const PRESETS: Preset[] = ["A", "B", "C", "D"];

/**
 * Loads current-state capture metadata for baseline seed creation.
 */
export async function resolveCurrentStateBaseInput(
  opts: CurrentStateOptions,
): Promise<Partial<RedesignInput>> {
  if (!opts.captureCurrent) return {};

  const fromFile = opts.currentStateFile
    ? await loadProfile(opts.currentStateFile)
    : {};
  const notes = [fromFile.currentStateNotes, opts.currentState]
    .filter((value): value is string => Boolean(value?.trim()))
    .join(" | ");

  const fingerprint = JSON.stringify({
    mode: fromFile.mode,
    target: fromFile.target,
    brand: fromFile.brand,
    purpose: fromFile.purpose,
    preset: fromFile.preset,
    valueProps: fromFile.valueProps,
    cta: fromFile.cta,
    featureTileCount: fromFile.featureTileCount,
    protocolStepCount: fromFile.protocolStepCount,
    notes,
  });

  return {
    mode: fromFile.mode,
    target: fromFile.target,
    brand: fromFile.brand,
    purpose: fromFile.purpose,
    preset: fromFile.preset,
    valueProps: fromFile.valueProps,
    cta: fromFile.cta,
    featureTileCount: fromFile.featureTileCount,
    protocolStepCount: fromFile.protocolStepCount,
    runNonce: `baseline-${shortHash(fingerprint)}`,
    seedKind: "baseline-current-state",
    currentStateNotes: notes || undefined,
  };
}

async function loadProfile(filePath: string): Promise<CurrentStateProfile> {
  const resolved = path.resolve(filePath);
  const raw = await readFile(resolved, "utf8");
  const parsed = JSON.parse(raw) as Record<string, unknown>;
  const presetRaw = typeof parsed.preset === "string" ? parsed.preset.toUpperCase() : undefined;

  return {
    mode: parseMode(parsed.mode),
    target: readString(parsed.target),
    brand: readString(parsed.brand),
    purpose: readString(parsed.purpose),
    preset: presetRaw && PRESETS.includes(presetRaw as Preset) ? (presetRaw as Preset) : undefined,
    valueProps: readStringArray(parsed.valueProps),
    cta: readString(parsed.cta),
    featureTileCount: readPositiveInt(parsed.featureTileCount),
    protocolStepCount: readPositiveInt(parsed.protocolStepCount),
    currentStateNotes: readString(parsed.currentStateNotes),
  };
}

function parseMode(value: unknown): Mode | undefined {
  if (value === "landing" || value === "platform") return value;
  return undefined;
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function readStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const out = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 8);
  return out.length > 0 ? out : undefined;
}

function readPositiveInt(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  const int = Math.floor(value);
  return int > 0 ? int : undefined;
}
