import { NextRequest, NextResponse } from "next/server";

import { SESSION_COOKIE_NAME, revokeAuthSession } from "@/lib/server/auth-adapter";
import { getCookieValue } from "@/lib/server/request";
import { applyApiNoStoreHeaders, clearSessionCookieOptions, ensureTrustedOrigin } from "@/lib/server/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const untrusted = ensureTrustedOrigin(request);
  if (untrusted) return applyApiNoStoreHeaders(untrusted);

  const token = getCookieValue(request, SESSION_COOKIE_NAME);
  if (token) {
    await revokeAuthSession(token);
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE_NAME, "", clearSessionCookieOptions);

  return applyApiNoStoreHeaders(response);
}
