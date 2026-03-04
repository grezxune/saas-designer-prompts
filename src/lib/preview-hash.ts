import { createHash } from "node:crypto";
import type { RedesignPacket } from "./redesign-types";

/**
 * Returns a structural visual proxy hash from key variant dimensions.
 */
export function makeStructuralVisualHash(packet: RedesignPacket): string {
  const payload = JSON.stringify({
    layout: packet.layoutVariantPlan,
    dna: packet.brandDnaPlan,
    voice: packet.copyVoicePlan,
    data: packet.dataShapePlan,
    interaction: packet.pageInteractionPlan,
  });
  return createHash("sha1").update(payload).digest("hex").slice(0, 20);
}

/**
 * Converts hash overlap to a 0..1 visual distance estimate.
 */
export function estimateVisualDistance(currentHash: string, previousHashes: string[]): number {
  if (previousHashes.length === 0) return 1;
  let best = 1;
  for (const previous of previousHashes) {
    const distance = hashDistance(currentHash, previous);
    if (distance < best) best = distance;
  }
  return best;
}

function hashDistance(a: string, b: string): number {
  const len = Math.min(a.length, b.length);
  let different = 0;
  for (let i = 0; i < len; i += 1) {
    if (a[i] !== b[i]) different += 1;
  }
  return different / Math.max(1, len);
}
