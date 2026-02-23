import { NextRequest, NextResponse } from "next/server";

import { getValidationMessage } from "@/lib/server/api";
import { SESSION_COOKIE_NAME, getAuthSessionByToken } from "@/lib/server/auth-adapter";
import { saveTradeOrder } from "@/lib/server/activity-adapter";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { getClientKey, getCookieValue, parseJsonBody } from "@/lib/server/request";
import { applyApiNoStoreHeaders, ensureTrustedOrigin } from "@/lib/server/security";
import { tradeOrderSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const untrusted = ensureTrustedOrigin(request);
  if (untrusted) return applyApiNoStoreHeaders(untrusted);

  const token = getCookieValue(request, SESSION_COOKIE_NAME);
  const session = await getAuthSessionByToken(token);
  if (!session) {
    return applyApiNoStoreHeaders(NextResponse.json({ error: "Not authenticated" }, { status: 401 }));
  }

  const clientKey = getClientKey(request);
  const rateLimit = checkRateLimit(`trade-orders:${clientKey}`, { max: 20, windowMs: 60_000 });

  if (!rateLimit.allowed) {
    return applyApiNoStoreHeaders(
      NextResponse.json({ error: "Order limit reached. Try again shortly." }, { status: 429 })
    );
  }

  const payload = await parseJsonBody<unknown>(request);
  if (!payload) {
    return applyApiNoStoreHeaders(NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 }));
  }

  try {
    const parsed = tradeOrderSchema.parse(payload);
    const order = await saveTradeOrder(parsed);

    return applyApiNoStoreHeaders(
      NextResponse.json({
        ok: true,
        id: order.id,
        status: order.status,
        createdAt: order.createdAt
      })
    );
  } catch (error) {
    return applyApiNoStoreHeaders(NextResponse.json({ error: getValidationMessage(error) }, { status: 400 }));
  }
}
