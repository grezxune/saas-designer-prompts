import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { shortHash } from "./random";
import type { RedesignInput, RedesignPacket } from "./redesign-types";

export interface SavedSession {
  id: string;
  createdAt: string;
  input: RedesignInput;
  packet: RedesignPacket;
}

/**
 * Returns the default session directory used across projects.
 */
export function getDefaultSessionDir(): string {
  const home = process.env.HOME || process.cwd();
  return path.join(home, ".saas-designer-prompts", "sessions");
}

/**
 * Loads a saved session by id or absolute file path.
 */
export async function loadSession(sessionDir: string, ref: string): Promise<SavedSession> {
  const sessionPath = resolveSessionPath(sessionDir, ref);
  const raw = await readFile(sessionPath, "utf8");
  const parsed = JSON.parse(raw) as Partial<SavedSession>;
  if (!isSavedSession(parsed)) {
    throw new Error(`Invalid session format at ${sessionPath}`);
  }
  return parsed;
}

/**
 * Saves a session to disk and returns id/path metadata.
 */
export async function saveSession(
  sessionDir: string,
  input: RedesignInput,
  packet: RedesignPacket,
): Promise<{ id: string; path: string }> {
  const id = createSessionId(input, packet);
  const resolvedDir = path.resolve(sessionDir);
  const sessionPath = path.join(resolvedDir, `${id}.json`);
  const payload: SavedSession = {
    id,
    createdAt: new Date().toISOString(),
    input,
    packet,
  };

  await mkdir(resolvedDir, { recursive: true });
  await writeFile(sessionPath, JSON.stringify(payload, null, 2) + "\n", "utf8");

  return { id, path: sessionPath };
}

function resolveSessionPath(sessionDir: string, ref: string): string {
  const isPathRef = ref.includes("/") || ref.endsWith(".json") || path.isAbsolute(ref);
  if (isPathRef) {
    const maybeAbsolute = path.resolve(ref);
    if (path.isAbsolute(ref) || ref.includes("/")) return maybeAbsolute;
  }
  const file = ref.endsWith(".json") ? ref : `${ref}.json`;
  return path.resolve(sessionDir, file);
}

function createSessionId(input: RedesignInput, packet: RedesignPacket): string {
  const now = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const seed = `${input.mode}|${input.target}|${packet.runNonce}|${packet.generatedAt}`;
  return `session-${now}-${shortHash(seed)}`;
}

function isSavedSession(value: Partial<SavedSession>): value is SavedSession {
  return Boolean(
    value &&
      typeof value.id === "string" &&
      typeof value.createdAt === "string" &&
      typeof value.input === "object" &&
      typeof value.packet === "object",
  );
}
