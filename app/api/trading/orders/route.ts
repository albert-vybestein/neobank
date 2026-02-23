import { NextRequest, NextResponse } from "next/server";

import { getValidationMessage } from "@/lib/server/api";
import { saveTradeOrder } from "@/lib/server/activity-adapter";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { getClientKey, parseJsonBody } from "@/lib/server/request";
import { tradeOrderSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const clientKey = getClientKey(request);
  const rateLimit = checkRateLimit(`trade-orders:${clientKey}`, { max: 20, windowMs: 60_000 });

  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Order limit reached. Try again shortly." }, { status: 429 });
  }

  const payload = await parseJsonBody<unknown>(request);
  if (!payload) {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  try {
    const parsed = tradeOrderSchema.parse(payload);
    const order = await saveTradeOrder(parsed);

    return NextResponse.json({
      ok: true,
      id: order.id,
      status: order.status,
      createdAt: order.createdAt
    });
  } catch (error) {
    return NextResponse.json({ error: getValidationMessage(error) }, { status: 400 });
  }
}
