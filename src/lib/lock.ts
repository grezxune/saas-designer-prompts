import { mkdir, open, unlink } from "node:fs/promises";
import path from "node:path";

/**
 * Runs callback under an exclusive file lock with retries.
 */
export async function withFileLock<T>(
  lockPath: string,
  callback: () => Promise<T>,
  timeoutMs = 15000,
): Promise<T> {
  const resolved = path.resolve(lockPath);
  await mkdir(path.dirname(resolved), { recursive: true });

  const start = Date.now();
  while (true) {
    try {
      const handle = await open(resolved, "wx");
      await handle.close();
      try {
        return await callback();
      } finally {
        await unlink(resolved).catch(() => undefined);
      }
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code !== "EEXIST") throw error;
      if (Date.now() - start > timeoutMs) {
        throw new Error(`Timed out waiting for lock: ${resolved}`);
      }
      await sleep(80);
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
