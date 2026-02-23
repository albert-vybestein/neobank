import { NextRequest, NextResponse } from "next/server";

import { getValidationMessage } from "@/lib/server/api";
import { saveContactSubmission } from "@/lib/server/activity-adapter";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { getClientKey, parseJsonBody } from "@/lib/server/request";
import { contactSubmissionSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const limitOptions = { max: 5, windowMs: 60_000 };

export async function POST(request: NextRequest) {
  const clientKey = getClientKey(request);
  const rateLimit = checkRateLimit(`contact:${clientKey}`, limitOptions);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again in a minute." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil(rateLimit.retryAfterMs / 1000))
        }
      }
    );
  }

  const payload = await parseJsonBody<unknown>(request);
  if (!payload) {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  try {
    const parsed = contactSubmissionSchema.parse(payload);

    // Honeypot trap to reduce bot noise.
    if (parsed.website && parsed.website.trim().length > 0) {
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    const submission = await saveContactSubmission(parsed);

    return NextResponse.json({
      ok: true,
      id: submission.id,
      receivedAt: submission.createdAt
    });
  } catch (error) {
    return NextResponse.json({ error: getValidationMessage(error) }, { status: 400 });
  }
}
