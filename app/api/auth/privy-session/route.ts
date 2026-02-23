import { NextRequest, NextResponse } from "next/server";

import { getValidationMessage } from "@/lib/server/api";
import { SESSION_COOKIE_NAME, createAuthSessionForOwner } from "@/lib/server/auth-adapter";
import { verifyPrivyAccessTokenForWallet } from "@/lib/server/privy-adapter";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { getClientKey, parseJsonBody } from "@/lib/server/request";
import { applyApiNoStoreHeaders, ensureTrustedOrigin, sessionCookieOptions } from "@/lib/server/security";
import { privySessionRequestSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function verifyPrivyWithRetry(params: { accessToken: string; walletAddress: string }) {
  let lastError: unknown;

  for (let attempt = 0; attempt < 8; attempt += 1) {
    try {
      await verifyPrivyAccessTokenForWallet(params);
      return;
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : "";
      const isWalletSyncLag = message.toLowerCase().includes("does not have this wallet linked");

      if (!isWalletSyncLag || attempt === 7) {
        throw error;
      }

      await delay(500);
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Could not verify Privy session.");
}

async function createOwnerSessionWithRetry(params: { walletAddress: string; safeAddress: string }) {
  let lastError: unknown;

  for (let attempt = 0; attempt < 10; attempt += 1) {
    try {
      return await createAuthSessionForOwner(params);
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : "";
      const waitingForDeployment = message.toLowerCase().includes("not an owner of this safe account");

      if (!waitingForDeployment || attempt === 9) {
        throw error;
      }

      await delay(1200);
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Could not create account session.");
}

export async function POST(request: NextRequest) {
  const untrusted = ensureTrustedOrigin(request);
  if (untrusted) return applyApiNoStoreHeaders(untrusted);

  const clientKey = getClientKey(request);
  const rateLimit = checkRateLimit(`auth-privy-session:${clientKey}`, { max: 20, windowMs: 60_000 });

  if (!rateLimit.allowed) {
    return applyApiNoStoreHeaders(
      NextResponse.json({ error: "Too many sign in attempts. Try again shortly." }, { status: 429 })
    );
  }

  const payload = await parseJsonBody<unknown>(request);
  if (!payload) {
    return applyApiNoStoreHeaders(NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 }));
  }

  try {
    const parsed = privySessionRequestSchema.parse(payload);
    await verifyPrivyWithRetry({
      accessToken: parsed.accessToken,
      walletAddress: parsed.walletAddress
    });

    const session = await createOwnerSessionWithRetry({
      walletAddress: parsed.walletAddress,
      safeAddress: parsed.safeAddress
    });

    const response = NextResponse.json({
      ok: true,
      walletAddress: session.walletAddress,
      safeAddress: session.safeAddress,
      expiresAt: session.expiresAt
    });

    response.cookies.set(SESSION_COOKIE_NAME, session.token, sessionCookieOptions);

    return applyApiNoStoreHeaders(response);
  } catch (error) {
    return applyApiNoStoreHeaders(NextResponse.json({ error: getValidationMessage(error) }, { status: 400 }));
  }
}
