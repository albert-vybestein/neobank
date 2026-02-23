import { beforeEach, describe, expect, it } from "vitest";
import type { NextRequest } from "next/server";
import { privateKeyToAccount } from "viem/accounts";

import { POST as postDeploy } from "@/app/api/safe/deploy/route";
import { POST as postChallenge } from "@/app/api/auth/challenge/route";
import { POST as postVerify } from "@/app/api/auth/verify/route";
import { GET as getSession } from "@/app/api/auth/session/route";
import { resetTestState } from "@/tests/integration/helpers";

function buildRequest(url: string, payload: unknown, cookie?: string) {
  return new Request(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": "127.0.0.1",
      origin: "http://localhost",
      ...(cookie ? { cookie } : {})
    },
    body: JSON.stringify(payload)
  }) as unknown as NextRequest;
}

describe("auth routes", () => {
  beforeEach(async () => {
    await resetTestState();
    process.env.SAFE_DEPLOY_MODE = "mock";
  });

  it("issues challenge, verifies signature, and returns active session", async () => {
    const ownerAccount = privateKeyToAccount("0x59c6995e998f97a5a0044976f7d4e8947600f1a6f0a26c11f2a8f30f6d2e9c60");

    const deployResponse = await postDeploy(
      buildRequest("http://localhost/api/safe/deploy", {
        walletAddress: ownerAccount.address,
        accountType: "personal",
        baseCurrency: "USD",
        accountName: "Main account",
        subAccounts: [],
        modules: {
          guildDelay: true,
          guildRoles: true,
          guildAllowance: true,
          guildRecovery: true,
          rhinestoneSessions: true,
          rhinestoneSpendingPolicy: true,
          rhinestoneAutomation: false,
          timeLockHours: 24
        }
      })
    );

    expect(deployResponse.status).toBe(200);
    const deployBody = (await deployResponse.json()) as { safeAddress: string };

    const challengeResponse = await postChallenge(
      buildRequest("http://localhost/api/auth/challenge", {
        walletAddress: ownerAccount.address,
        safeAddress: deployBody.safeAddress
      })
    );

    expect(challengeResponse.status).toBe(200);
    const challengeBody = (await challengeResponse.json()) as { message: string; nonce: string };

    const signature = await ownerAccount.signMessage({ message: challengeBody.message });

    const verifyResponse = await postVerify(
      buildRequest("http://localhost/api/auth/verify", {
        walletAddress: ownerAccount.address,
        safeAddress: deployBody.safeAddress,
        nonce: challengeBody.nonce,
        signature
      })
    );

    expect(verifyResponse.status).toBe(200);

    const setCookie = verifyResponse.headers.get("set-cookie");
    expect(setCookie).toContain("neobank_session=");
    const cookieValue = (setCookie ?? "").split(";")[0];

    const sessionRequest = new Request("http://localhost/api/auth/session", {
      method: "GET",
      headers: {
        cookie: cookieValue
      }
    }) as unknown as NextRequest;

    const sessionResponse = await getSession(sessionRequest);
    expect(sessionResponse.status).toBe(200);

    const sessionBody = (await sessionResponse.json()) as { authenticated: boolean; safeAddress: string };
    expect(sessionBody.authenticated).toBe(true);
    expect(sessionBody.safeAddress.toLowerCase()).toBe(deployBody.safeAddress.toLowerCase());
  });
});
