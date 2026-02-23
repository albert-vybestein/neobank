import { NextRequest, NextResponse } from "next/server";

import { getValidationMessage } from "@/lib/server/api";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { getClientKey, parseJsonBody } from "@/lib/server/request";
import { deploySafeSetup } from "@/lib/server/safe-adapter";
import { safeSetupRequestSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const clientKey = getClientKey(request);
  const rateLimit = checkRateLimit(`safe-deploy:${clientKey}`, { max: 8, windowMs: 60_000 });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many deployment attempts. Please wait before trying again." },
      { status: 429 }
    );
  }

  const payload = await parseJsonBody<unknown>(request);
  if (!payload) {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  try {
    const parsed = safeSetupRequestSchema.parse(payload);
    const deployment = await deploySafeSetup(parsed);

    return NextResponse.json(deployment);
  } catch (error) {
    return NextResponse.json({ error: getValidationMessage(error) }, { status: 400 });
  }
}
