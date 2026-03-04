import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Mode, Preset, RequestInterpretation } from "../lib/redesign-types";

interface NaturalLanguageIntent {
  mode?: Mode;
  target?: string;
  brand?: string;
  purpose?: string;
  preset?: Preset;
  valueProps?: string[];
  cta?: string;
  featureTileCount?: number;
  protocolStepCount?: number;
  tweakNotes?: string;
  captureCurrent?: boolean;
  currentStateNotes?: string;
}

export interface NaturalLanguageOptions {
  request?: string;
  requestFile?: string;
  noAi: boolean;
  openrouterModel?: string;
}

export interface NaturalLanguageResolution {
  intent: NaturalLanguageIntent;
  interpretation?: RequestInterpretation;
}

const PRESETS: Preset[] = ["A", "B", "C", "D"];

/**
 * Resolves plain-English request text into structured redesign intent.
 */
export async function resolveNaturalLanguageIntent(
  opts: NaturalLanguageOptions,
): Promise<NaturalLanguageResolution> {
  const raw = await loadRequestText(opts.request, opts.requestFile);
  if (!raw) return { intent: {} };

  if (!opts.noAi && process.env.OPENROUTER_API_KEY) {
    const ai = await parseWithOpenRouter(raw, opts.openrouterModel).catch(() => null);
    if (ai) {
      return {
        intent: normalizeIntent(ai, raw),
        interpretation: { parser: "openrouter", raw },
      };
    }
  }

  return {
    intent: heuristicIntent(raw),
    interpretation: { parser: "heuristic", raw },
  };
}

async function loadRequestText(request?: string, requestFile?: string): Promise<string | undefined> {
  const inline = request?.trim();
  const file = requestFile?.trim();
  if (!inline && !file) return undefined;
  if (inline && file) return `${inline}\n${await readRequestFile(file)}`.trim();
  if (inline) return inline;
  return readRequestFile(file as string);
}

async function readRequestFile(filePath: string): Promise<string> {
  const resolved = path.resolve(filePath);
  const raw = await readFile(resolved, "utf8");
  const cleaned = raw.trim();
  if (!cleaned) throw new Error(`Empty request file: ${resolved}`);
  return cleaned;
}

async function parseWithOpenRouter(
  raw: string,
  model = process.env.OPENROUTER_MODEL ?? "openai/gpt-4o-mini",
): Promise<unknown> {
  const baseUrl = process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1";
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is required for OpenRouter parsing.");

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://github.com/grez-studios/saas-designer-prompts",
      "X-Title": "saas-designer-prompts-cli",
    },
    body: JSON.stringify({
      model,
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Extract structured redesign intent from the user request. Return strict JSON only. Allowed keys: mode, target, brand, purpose, preset, valueProps, cta, featureTileCount, protocolStepCount, tweakNotes, captureCurrent, currentStateNotes.",
        },
        { role: "user", content: raw },
      ],
    }),
  });

  if (!response.ok) throw new Error(`OpenRouter request failed (${response.status}).`);
  const payload = (await response.json()) as { choices?: Array<{ message?: { content?: unknown } }> };
  const message = payload.choices?.[0]?.message?.content;
  const text = extractMessageText(message);
  const jsonSlice = text.match(/\{[\s\S]*\}/)?.[0] ?? text;
  return JSON.parse(jsonSlice) as unknown;
}

function extractMessageText(content: unknown): string {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "{}";
  return content
    .map((part) => {
      if (typeof part === "string") return part;
      if (part && typeof part === "object" && "text" in part) return String((part as { text?: unknown }).text ?? "");
      return "";
    })
    .join("\n");
}

function normalizeIntent(input: unknown, raw: string): NaturalLanguageIntent {
  const record = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  const mode = parseMode(record.mode) ?? detectMode(raw);
  const preset = parsePreset(record.preset) ?? detectPreset(raw);
  const target = readString(record.target) ?? detectTarget(raw);
  const featureTileCount = readPositiveInt(record.featureTileCount) ?? detectCount(raw, /(\d+)\s*(feature|tile|card)s?/i);
  const protocolStepCount = readPositiveInt(record.protocolStepCount) ?? detectCount(raw, /(\d+)\s*(protocol|step)s?/i);
  const captureCurrent = readBoolean(record.captureCurrent) ?? detectCaptureCurrent(raw);

  return {
    mode,
    target,
    brand: readString(record.brand) ?? detectFromPrefix(raw, "brand"),
    purpose: readString(record.purpose) ?? detectFromPrefix(raw, "purpose"),
    preset,
    valueProps: readStringArray(record.valueProps) ?? detectValueProps(raw),
    cta: readString(record.cta) ?? detectFromPrefix(raw, "cta"),
    featureTileCount,
    protocolStepCount,
    tweakNotes: readString(record.tweakNotes) ?? raw,
    captureCurrent,
    currentStateNotes: readString(record.currentStateNotes) ?? detectFromPrefix(raw, "current state"),
  };
}

function heuristicIntent(raw: string): NaturalLanguageIntent {
  return normalizeIntent({}, raw);
}

function parseMode(value: unknown): Mode | undefined {
  if (value === "landing" || value === "platform") return value;
  return undefined;
}

function parsePreset(value: unknown): Preset | undefined {
  if (typeof value !== "string") return undefined;
  const upper = value.trim().toUpperCase();
  return PRESETS.includes(upper as Preset) ? (upper as Preset) : undefined;
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function readPositiveInt(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  const parsed = Math.floor(value);
  return parsed > 0 ? parsed : undefined;
}

function readBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function readStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const values = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 6);
  return values.length > 0 ? values : undefined;
}

function detectMode(raw: string): Mode | undefined {
  const text = raw.toLowerCase();
  if (/(landing|marketing|homepage)/.test(text)) return "landing";
  if (/(platform|dashboard|app|settings|billing|entity)/.test(text)) return "platform";
  return undefined;
}

function detectPreset(raw: string): Preset | undefined {
  const preset = raw.match(/\bpreset\s*[:=-]?\s*([a-d])\b/i)?.[1]?.toUpperCase();
  if (preset && PRESETS.includes(preset as Preset)) return preset as Preset;
  const text = raw.toLowerCase();
  if (text.includes("organic")) return "A";
  if (text.includes("midnight")) return "B";
  if (text.includes("brutalist")) return "C";
  if (text.includes("vapor")) return "D";
  return undefined;
}

function detectTarget(raw: string): string | undefined {
  const byKey = detectFromPrefix(raw, "target");
  if (byKey) return byKey;
  const byVerb = raw.match(/\bredesign\s+(?:the\s+)?([^.;\n]+)/i)?.[1]?.trim();
  return byVerb || undefined;
}

function detectValueProps(raw: string): string[] | undefined {
  const direct = detectFromPrefix(raw, "value props");
  if (!direct) return undefined;
  const values = direct
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 6);
  return values.length > 0 ? values : undefined;
}

function detectCount(raw: string, pattern: RegExp): number | undefined {
  const parsed = raw.match(pattern)?.[1];
  if (!parsed) return undefined;
  const value = Number.parseInt(parsed, 10);
  return Number.isFinite(value) && value > 0 ? value : undefined;
}

function detectCaptureCurrent(raw: string): boolean {
  return /\b(capture|ingest|baseline)\b/.test(raw.toLowerCase()) && /\b(current state|existing state|as-is)\b/.test(raw.toLowerCase());
}

function detectFromPrefix(raw: string, key: string): string | undefined {
  const safeKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = raw.match(new RegExp(`${safeKey}\\s*[:=-]\\s*([^\\n.;]+)`, "i"));
  return match?.[1]?.trim() || undefined;
}
