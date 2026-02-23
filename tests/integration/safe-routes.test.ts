import { beforeEach, describe, expect, it } from "vitest";
import type { NextRequest } from "next/server";

import { POST as postConnect } from "@/app/api/safe/connect/route";
import { POST as postDeploy } from "@/app/api/safe/deploy/route";
import { POST as postTradeOrder } from "@/app/api/trading/orders/route";
import { POST as postPredictionOrder } from "@/app/api/predictions/orders/route";
import { resetTestState } from "@/tests/integration/helpers";

function buildRequest(url: string, payload: unknown, ip = "127.0.0.1") {
  return new Request(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": ip
    },
    body: JSON.stringify(payload)
  }) as unknown as NextRequest;
}

describe("safe and trading api", () => {
  beforeEach(async () => {
    await resetTestState();
  });

  it("connects and deploys a safe account", async () => {
    const connectResponse = await postConnect(
      buildRequest("http://localhost/api/safe/connect", { connector: "passkey" })
    );

    expect(connectResponse.status).toBe(200);
    const connectBody = (await connectResponse.json()) as { walletAddress: string };
    expect(connectBody.walletAddress).toMatch(/^0x[a-f0-9]{40}$/);

    const deployResponse = await postDeploy(
      buildRequest("http://localhost/api/safe/deploy", {
        walletAddress: connectBody.walletAddress,
        accountType: "personal",
        baseCurrency: "USD",
        accountName: "Main account",
        subAccounts: [{ name: "Bills", spendingLimit: "1200" }],
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
    const deployBody = (await deployResponse.json()) as { safeAddress: string; status: string };
    expect(deployBody.safeAddress).toMatch(/^0x[a-f0-9]{40}$/);
    expect(deployBody.status).toBe("deployed");
  });

  it("accepts trading and prediction orders", async () => {
    const tradeResponse = await postTradeOrder(
      buildRequest("http://localhost/api/trading/orders", {
        market: "BTC-PERP",
        side: "Long",
        size: 1500,
        leverage: 3
      })
    );

    expect(tradeResponse.status).toBe(200);

    const predictionResponse = await postPredictionOrder(
      buildRequest("http://localhost/api/predictions/orders", {
        eventTitle: "Fed cuts rates before Q4",
        side: "yes",
        stake: 100
      })
    );

    expect(predictionResponse.status).toBe(200);
  });

  it("rejects invalid trading orders", async () => {
    const tradeResponse = await postTradeOrder(
      buildRequest("http://localhost/api/trading/orders", {
        market: "BTC-PERP",
        side: "Long",
        size: -10,
        leverage: 3
      })
    );

    expect(tradeResponse.status).toBe(400);
  });
});
