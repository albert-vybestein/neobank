import { NextRequest, NextResponse } from "next/server";

import { getValidationMessage } from "@/lib/server/api";
import { SESSION_COOKIE_NAME, createMockAuthSession } from "@/lib/server/auth-adapter";
import { isMockDeployMode } from "@/lib/server/safe-adapter";
import { parseJsonBody } from "@/lib/server/request";
import { applyApiNoStoreHeaders, ensureTrustedOrigin, sessionCookieOptions } from "@/lib/server/security";
import { authChallengeRequestSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const untrusted = ensureTrustedOrigin(request);
  if (untrusted) return applyApiNoStoreHeaders(untrusted);

  if (!isMockDeployMode()) {
    return applyApiNoStoreHeaders(
      NextResponse.json({ error: "Mock session endpoint is disabled in real deploy mode." }, { status: 403 })
    );
  }

  const payload = await parseJsonBody<unknown>(request);
  if (!payload) {
    return applyApiNoStoreHeaders(NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 }));
  }

  try {
    const parsed = authChallengeRequestSchema.parse(payload);
    const session = await createMockAuthSession(parsed);

    const response = NextResponse.json({
      ok: true,
      walletAddress: session.walletAddress,
      safeAddress: session.safeAddress,
      expiresAt: session.expiresAt
    });

    response.cookies.set(SESSION_COOKIE_NAME, session.token, sessionCookieOptions);

    return applyApiNoStoreHeaders(response);
  } catch (error) {
    return applyApiNoStoreHeaders(NextResponse.json({ error: getValidationMessage(error) }, { status: 400 }));
  }
}
