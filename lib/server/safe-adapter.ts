import { createHash, randomBytes } from "node:crypto";

import { appendJsonItem } from "@/lib/server/json-store";
import type { Connector, SafeSetupRequestInput } from "@/lib/validation";

type SignerSessionRecord = {
  id: string;
  connector: Connector;
  walletAddress: string;
  createdAt: string;
};

type SafeDeploymentRecord = {
  id: string;
  walletAddress: string;
  safeAddress: string;
  deploymentTxHash: string;
  moduleTxHash: string;
  accountType: SafeSetupRequestInput["accountType"];
  baseCurrency: SafeSetupRequestInput["baseCurrency"];
  accountName: string;
  subAccounts: SafeSetupRequestInput["subAccounts"];
  modules: SafeSetupRequestInput["modules"];
  createdAt: string;
};

function pseudoHex(length: number) {
  return randomBytes(Math.ceil(length / 2)).toString("hex").slice(0, length);
}

function hashToAddress(input: string) {
  const hash = createHash("sha256").update(input).digest("hex");
  return `0x${hash.slice(0, 40)}`;
}

export async function createSignerSession(connector: Connector) {
  const sessionId = `session_${pseudoHex(16)}`;
  const entropy = `${connector}:${Date.now()}:${pseudoHex(10)}`;
  const walletAddress = hashToAddress(entropy);

  const record: SignerSessionRecord = {
    id: sessionId,
    connector,
    walletAddress,
    createdAt: new Date().toISOString()
  };

  await appendJsonItem("signer-sessions.json", record);

  return {
    sessionId,
    walletAddress,
    connector
  };
}

export async function deploySafeSetup(input: SafeSetupRequestInput) {
  const deploymentEntropy = `${input.walletAddress}:${input.accountName}:${Date.now()}:${pseudoHex(8)}`;
  const safeAddress = hashToAddress(`safe:${deploymentEntropy}`);
  const deploymentTxHash = `0x${createHash("sha256").update(`deploy:${deploymentEntropy}`).digest("hex")}`;
  const moduleTxHash = `0x${createHash("sha256").update(`module:${deploymentEntropy}`).digest("hex")}`;

  const record: SafeDeploymentRecord = {
    id: `safe_${pseudoHex(12)}`,
    walletAddress: input.walletAddress,
    safeAddress,
    deploymentTxHash,
    moduleTxHash,
    accountType: input.accountType,
    baseCurrency: input.baseCurrency,
    accountName: input.accountName,
    subAccounts: input.subAccounts,
    modules: input.modules,
    createdAt: new Date().toISOString()
  };

  await appendJsonItem("safe-deployments.json", record);

  return {
    safeAddress,
    deploymentTxHash,
    moduleTxHash,
    status: "deployed" as const
  };
}
