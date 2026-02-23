import { NextRequest, NextResponse } from "next/server";

import { getValidationMessage } from "@/lib/server/api";
import { createAuthChallenge } from "@/lib/server/auth-adapter";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { getClientKey, parseJsonBody } from "@/lib/server/request";
import { applyApiNoStoreHeaders, ensureTrustedOrigin } from "@/lib/server/security";
import { authChallengeRequestSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const untrusted = ensureTrustedOrigin(request);
  if (untrusted) return applyApiNoStoreHeaders(untrusted);

  const clientKey = getClientKey(request);
  const rateLimit = checkRateLimit(`auth-challenge:${clientKey}`, { max: 20, windowMs: 60_000 });

  if (!rateLimit.allowed) {
    return applyApiNoStoreHeaders(
      NextResponse.json({ error: "Too many sign in attempts. Try again shortly." }, { status: 429 })
    );
  }

  const payload = await parseJsonBody<unknown>(request);
  if (!payload) {
    return applyApiNoStoreHeaders(NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 }));
  }

  try {
    const parsed = authChallengeRequestSchema.parse(payload);
    const challenge = await createAuthChallenge(parsed);

    return applyApiNoStoreHeaders(NextResponse.json(challenge));
  } catch (error) {
    return applyApiNoStoreHeaders(NextResponse.json({ error: getValidationMessage(error) }, { status: 400 }));
  }
}
