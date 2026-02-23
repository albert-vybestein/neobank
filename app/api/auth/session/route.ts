import { NextRequest, NextResponse } from "next/server";

import { SESSION_COOKIE_NAME, getAuthSessionByToken } from "@/lib/server/auth-adapter";
import { getCookieValue } from "@/lib/server/request";
import { applyApiNoStoreHeaders } from "@/lib/server/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const token = getCookieValue(request, SESSION_COOKIE_NAME);
  const session = await getAuthSessionByToken(token);

  if (!session) {
    return applyApiNoStoreHeaders(NextResponse.json({ authenticated: false }, { status: 401 }));
  }

  return applyApiNoStoreHeaders(
    NextResponse.json({
      authenticated: true,
      walletAddress: session.walletAddress,
      safeAddress: session.safeAddress,
      expiresAt: session.expiresAt
    })
  );
}
