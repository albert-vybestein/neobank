import { NextRequest, NextResponse } from "next/server";

import { getValidationMessage } from "@/lib/server/api";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { getClientKey, parseJsonBody } from "@/lib/server/request";
import { createSignerSession } from "@/lib/server/safe-adapter";
import { connectorSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const clientKey = getClientKey(request);
  const rateLimit = checkRateLimit(`safe-connect:${clientKey}`, { max: 12, windowMs: 60_000 });

  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Too many connection attempts. Please wait." }, { status: 429 });
  }

  const payload = await parseJsonBody<unknown>(request);
  if (!payload) {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  try {
    const parsed = connectorSchema.parse((payload as { connector?: unknown }).connector);
    const result = await createSignerSession(parsed);

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: getValidationMessage(error) }, { status: 400 });
  }
}
