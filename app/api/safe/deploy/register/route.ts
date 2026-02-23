import { NextRequest, NextResponse } from "next/server";

import { getValidationMessage } from "@/lib/server/api";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { getClientKey, parseJsonBody } from "@/lib/server/request";
import { applyApiNoStoreHeaders, ensureTrustedOrigin } from "@/lib/server/security";
import { registerSafeDeployment } from "@/lib/server/safe-adapter";
import { safeDeploymentRegisterSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const untrusted = ensureTrustedOrigin(request);
  if (untrusted) return applyApiNoStoreHeaders(untrusted);

  const clientKey = getClientKey(request);
  const rateLimit = checkRateLimit(`safe-deploy-register:${clientKey}`, { max: 10, windowMs: 60_000 });

  if (!rateLimit.allowed) {
    return applyApiNoStoreHeaders(
      NextResponse.json(
        { error: "Too many deployment registration attempts. Please wait before trying again." },
        { status: 429 }
      )
    );
  }

  const payload = await parseJsonBody<unknown>(request);
  if (!payload) {
    return applyApiNoStoreHeaders(NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 }));
  }

  try {
    const parsed = safeDeploymentRegisterSchema.parse(payload);
    const deployment = await registerSafeDeployment(parsed);
    return applyApiNoStoreHeaders(NextResponse.json(deployment));
  } catch (error) {
    return applyApiNoStoreHeaders(NextResponse.json({ error: getValidationMessage(error) }, { status: 400 }));
  }
}
