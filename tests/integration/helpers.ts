import path from "node:path";
import { createHash } from "node:crypto";
import { rm } from "node:fs/promises";

import { writeJsonFile } from "@/lib/server/json-store";
import { clearRateLimitBuckets } from "@/lib/server/rate-limit";

export async function resetTestState() {
  clearRateLimitBuckets();
  await rm(path.join(process.cwd(), ".data"), { recursive: true, force: true });
}

export async function seedAuthSession() {
  const token = "test_session_token";
  await writeJsonFile("auth-sessions.json", [
    {
      tokenHash: createHash("sha256").update(token).digest("hex"),
      walletAddress: "0x1234567890abcdef1234567890abcdef12345678",
      safeAddress: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 60_000).toISOString()
    }
  ]);

  return token;
}
