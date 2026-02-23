import { NextRequest, NextResponse } from "next/server";

import { getValidationMessage } from "@/lib/server/api";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { getClientKey } from "@/lib/server/request";
import { applyApiNoStoreHeaders } from "@/lib/server/security";
import { findLatestSafeByOwner } from "@/lib/server/safe-adapter";
import { findSafeByOwnerSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const clientKey = getClientKey(request);
  const rateLimit = checkRateLimit(`safe-by-owner:${clientKey}`, { max: 60, windowMs: 60_000 });
  if (!rateLimit.allowed) {
    return applyApiNoStoreHeaders(
      NextResponse.json({ error: "Too many lookup requests. Try again shortly." }, { status: 429 })
    );
  }

  try {
    const query = Object.fromEntries(request.nextUrl.searchParams.entries());
    const parsed = findSafeByOwnerSchema.parse(query);
    const deployment = await findLatestSafeByOwner(parsed.owner);

    return applyApiNoStoreHeaders(
      NextResponse.json({
        deployment
      })
    );
  } catch (error) {
    return applyApiNoStoreHeaders(NextResponse.json({ error: getValidationMessage(error) }, { status: 400 }));
  }
}
