import { NextRequest, NextResponse } from "next/server";

import { getValidationMessage } from "@/lib/server/api";
import { saveAnalyticsEvent } from "@/lib/server/activity-adapter";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { getClientKey, parseJsonBody } from "@/lib/server/request";
import { applyApiNoStoreHeaders, ensureTrustedOrigin } from "@/lib/server/security";
import { analyticsEventSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const untrusted = ensureTrustedOrigin(request);
  if (untrusted) return applyApiNoStoreHeaders(untrusted);

  const clientKey = getClientKey(request);
  const rateLimit = checkRateLimit(`events:${clientKey}`, { max: 80, windowMs: 60_000 });

  if (!rateLimit.allowed) {
    return applyApiNoStoreHeaders(NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 }));
  }

  const payload = await parseJsonBody<unknown>(request);
  if (!payload) {
    return applyApiNoStoreHeaders(NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 }));
  }

  try {
    const parsed = analyticsEventSchema.parse(payload);
    await saveAnalyticsEvent(parsed);
    return applyApiNoStoreHeaders(NextResponse.json({ ok: true }, { status: 202 }));
  } catch (error) {
    return applyApiNoStoreHeaders(NextResponse.json({ error: getValidationMessage(error) }, { status: 400 }));
  }
}
