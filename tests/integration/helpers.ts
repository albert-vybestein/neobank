import path from "node:path";
import { rm } from "node:fs/promises";

import { clearRateLimitBuckets } from "@/lib/server/rate-limit";

export async function resetTestState() {
  clearRateLimitBuckets();
  await rm(path.join(process.cwd(), ".data"), { recursive: true, force: true });
}
