import type { RedesignPacket } from "./redesign-types";
import { estimateVisualDistance, makeStructuralVisualHash } from "./preview-hash";

export interface VisualSimilarityResult {
  hash: string;
  distance: number;
  method: "playwright-image-hash" | "structural-hash";
}

/**
 * Computes visual similarity signal. Falls back to structural hash when image tooling is unavailable.
 */
export async function computeVisualSimilarity(
  packet: RedesignPacket,
  previousHashes: string[],
): Promise<VisualSimilarityResult> {
  const browserHash = await tryPlaywrightHash(packet);
  if (browserHash) {
    return {
      hash: browserHash,
      distance: estimateVisualDistance(browserHash, previousHashes),
      method: "playwright-image-hash",
    };
  }

  const hash = makeStructuralVisualHash(packet);
  return {
    hash,
    distance: estimateVisualDistance(hash, previousHashes),
    method: "structural-hash",
  };
}

async function tryPlaywrightHash(packet: RedesignPacket): Promise<string | null> {
  try {
    const playwright = await import("playwright");
    const browser = await playwright.chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 960, height: 540 } });

    const header = packet.layoutVariantPlan.marketingHeaderPattern;
    const hero = packet.layoutVariantPlan.landingSectionVariants.hero;
    const features = packet.layoutVariantPlan.landingSectionVariants.features;
    const bgA = packet.brandDnaPlan.colorStrategy;
    const bgB = packet.brandDnaPlan.materiality;

    await page.setContent(`
      <html>
      <body style="margin:0;background:#0f1115;color:#f2f2f2;font-family:system-ui;">
        <div style="padding:20px;border-bottom:1px solid #333">${header}</div>
        <div style="height:220px;margin:20px;border-radius:24px;background:linear-gradient(120deg,#1c2333,#2f3e2f);display:flex;align-items:center;justify-content:center;">${hero}</div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;padding:0 20px 20px;">
          <div style="height:120px;border-radius:16px;background:#1a1d24;display:flex;align-items:center;justify-content:center;">${features}</div>
          <div style="height:120px;border-radius:16px;background:#171b22;display:flex;align-items:center;justify-content:center;">${bgA}</div>
          <div style="height:120px;border-radius:16px;background:#151922;display:flex;align-items:center;justify-content:center;">${bgB}</div>
        </div>
      </body>
      </html>
    `);

    const screenshot = await page.screenshot({ type: "png" });
    await browser.close();
    return lightweightHashFromBuffer(screenshot);
  } catch {
    return null;
  }
}

function lightweightHashFromBuffer(buffer: Buffer): string {
  let hash = 2166136261;
  const step = Math.max(1, Math.floor(buffer.length / 512));
  for (let i = 0; i < buffer.length; i += step) {
    hash ^= buffer[i] as number;
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}
