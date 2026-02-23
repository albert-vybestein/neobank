import { createHash, randomBytes } from "node:crypto";

import Safe from "@safe-global/protocol-kit";
import { createPublicClient, createWalletClient, http, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";

import { appendJsonItem, readJsonFile } from "@/lib/server/json-store";
import type { Connector, SafeDeploymentRegisterInput, SafeSetupRequestInput } from "@/lib/validation";

const SAFE_SUPPORTED_CHAIN_ID = sepolia.id;
const SAFE_SUPPORTED_NETWORK_LABEL = "Sepolia";
const DEFAULT_SEPOLIA_RPC_URL = "https://ethereum-sepolia-rpc.publicnode.com";

type DeployMode = "mock" | "real";
type DeployStrategy = "mock" | "relay" | "erc4337";

export type SafeDeploymentRecord = {
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
  network: string;
  mode: "mock" | "real";
  createdAt: string;
};

type SignerSessionRecord = {
  id: string;
  connector: Connector;
  walletAddress: string;
  createdAt: string;
};

function pseudoHex(length: number) {
  return randomBytes(Math.ceil(length / 2)).toString("hex").slice(0, length);
}

function hashToAddress(input: string) {
  const hash = createHash("sha256").update(input).digest("hex");
  return `0x${hash.slice(0, 40)}`;
}

function getMode(): DeployMode {
  return process.env.SAFE_DEPLOY_MODE === "real" ? "real" : "mock";
}

function getRelayerPrivateKey(): Hex | null {
  const raw = process.env.SAFE_RELAYER_PRIVATE_KEY;
  if (!raw) return null;
  return (raw.startsWith("0x") ? raw : `0x${raw}`) as Hex;
}

function getDeploymentStrategy(): DeployStrategy {
  if (getMode() === "mock") return "mock";

  const explicit = process.env.SAFE_DEPLOY_STRATEGY?.trim().toLowerCase();
  if (explicit === "relay" || explicit === "erc4337") {
    return explicit;
  }

  if (process.env.PIMLICO_RPC_URL || process.env.NEXT_PUBLIC_PIMLICO_RPC_URL) {
    return "erc4337";
  }

  return getRelayerPrivateKey() ? "relay" : "erc4337";
}

export function isMockDeployMode() {
  return getMode() === "mock";
}

function getRpcUrl(): string {
  return (
    process.env.SAFE_RPC_URL ||
    process.env.PIMLICO_RPC_URL ||
    process.env.NEXT_PUBLIC_PIMLICO_RPC_URL ||
    DEFAULT_SEPOLIA_RPC_URL
  );
}

async function assertSupportedSafeRpc(rpcUrl: string) {
  const probeClient = createPublicClient({
    transport: http(rpcUrl)
  });
  const chainId = await probeClient.getChainId();

  if (Number(chainId) !== SAFE_SUPPORTED_CHAIN_ID) {
    throw new Error(
      `RPC is on chain ${chainId}. Use ${SAFE_SUPPORTED_NETWORK_LABEL} (${SAFE_SUPPORTED_CHAIN_ID}), where Safe smart contracts are deployed.`
    );
  }
}

export async function getValidatedSafeRpcUrl() {
  const rpcUrl = getRpcUrl();
  await assertSupportedSafeRpc(rpcUrl);
  return rpcUrl;
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

async function persistDeploymentRecord(params: {
  walletAddress: string;
  safeAddress: string;
  deploymentTxHash: string;
  moduleTxHash: string;
  accountType: SafeSetupRequestInput["accountType"];
  baseCurrency: SafeSetupRequestInput["baseCurrency"];
  accountName: string;
  subAccounts: SafeSetupRequestInput["subAccounts"];
  modules: SafeSetupRequestInput["modules"];
  network: string;
  mode: "mock" | "real";
}) {
  const record: SafeDeploymentRecord = {
    id: `safe_${pseudoHex(12)}`,
    walletAddress: params.walletAddress,
    safeAddress: params.safeAddress,
    deploymentTxHash: params.deploymentTxHash,
    moduleTxHash: params.moduleTxHash,
    accountType: params.accountType,
    baseCurrency: params.baseCurrency,
    accountName: params.accountName,
    subAccounts: params.subAccounts,
    modules: params.modules,
    network: params.network,
    mode: params.mode,
    createdAt: new Date().toISOString()
  };

  await appendJsonItem("safe-deployments.json", record);

  return {
    safeAddress: record.safeAddress,
    deploymentTxHash: record.deploymentTxHash,
    moduleTxHash: record.moduleTxHash,
    status: "deployed" as const,
    mode: record.mode,
    network: record.network
  };
}

async function deployMockSafe(input: SafeSetupRequestInput) {
  const deploymentEntropy = `${input.walletAddress}:${input.accountName}:${Date.now()}:${pseudoHex(8)}`;
  const safeAddress = hashToAddress(`safe:${deploymentEntropy}`);
  const deploymentTxHash = `0x${createHash("sha256").update(`deploy:${deploymentEntropy}`).digest("hex")}`;
  const moduleTxHash = `0x${createHash("sha256").update(`module:${deploymentEntropy}`).digest("hex")}`;

  return persistDeploymentRecord({
    walletAddress: input.walletAddress,
    safeAddress,
    deploymentTxHash,
    moduleTxHash,
    accountType: input.accountType,
    baseCurrency: input.baseCurrency,
    accountName: input.accountName,
    subAccounts: input.subAccounts,
    modules: input.modules,
    network: "sepolia",
    mode: "mock"
  });
}

async function deployRealSafeViaRelayer(input: SafeSetupRequestInput) {
  const relayerPrivateKey = getRelayerPrivateKey();
  if (!relayerPrivateKey) {
    throw new Error(
      "SAFE_RELAYER_PRIVATE_KEY is required for relay deployment mode. Set SAFE_DEPLOY_STRATEGY=erc4337 to deploy through Pimlico instead."
    );
  }

  const rpcUrl = await getValidatedSafeRpcUrl();
  const relayerAccount = privateKeyToAccount(relayerPrivateKey);
  const walletClient = createWalletClient({
    account: relayerAccount,
    chain: sepolia,
    transport: http(rpcUrl)
  });

  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(rpcUrl)
  });

  const protocolKit = await Safe.init({
    provider: rpcUrl,
    signer: relayerPrivateKey,
    predictedSafe: {
      safeAccountConfig: {
        owners: [input.walletAddress],
        threshold: 1
      },
      safeDeploymentConfig: {
        saltNonce: BigInt(`0x${pseudoHex(8)}`).toString()
      }
    }
  });

  const predictedSafeAddress = await protocolKit.getAddress();
  const deploymentTransaction = await protocolKit.createSafeDeploymentTransaction();

  const deploymentTxHash = await walletClient.sendTransaction({
    account: relayerAccount,
    to: deploymentTransaction.to as Hex,
    data: deploymentTransaction.data as Hex,
    value: BigInt(deploymentTransaction.value),
    chain: sepolia
  });

  const receipt = await publicClient.waitForTransactionReceipt({
    hash: deploymentTxHash
  });

  if (receipt.status !== "success") {
    throw new Error("Safe deployment transaction failed.");
  }

  return persistDeploymentRecord({
    walletAddress: input.walletAddress,
    safeAddress: predictedSafeAddress,
    deploymentTxHash,
    moduleTxHash: deploymentTxHash,
    accountType: input.accountType,
    baseCurrency: input.baseCurrency,
    accountName: input.accountName,
    subAccounts: input.subAccounts,
    modules: input.modules,
    network: "sepolia",
    mode: "real"
  });
}

export async function registerSafeDeployment(input: SafeDeploymentRegisterInput) {
  if (getMode() === "mock" || input.mode === "mock") {
    return persistDeploymentRecord({
      walletAddress: input.walletAddress,
      safeAddress: input.safeAddress,
      deploymentTxHash: input.deploymentTxHash,
      moduleTxHash: input.moduleTxHash,
      accountType: input.accountType,
      baseCurrency: input.baseCurrency,
      accountName: input.accountName,
      subAccounts: input.subAccounts,
      modules: input.modules,
      network: input.network,
      mode: "mock"
    });
  }

  const isOwner = await isWalletOwnerOfSafe(input.walletAddress, input.safeAddress);
  if (!isOwner) {
    throw new Error("Owner verification failed. The wallet is not an owner of this Safe account.");
  }

  const rpcUrl = await getValidatedSafeRpcUrl();
  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(rpcUrl)
  });

  const deploymentReceipt = await publicClient
    .getTransactionReceipt({ hash: input.deploymentTxHash as Hex })
    .catch(() => null);
  if (!deploymentReceipt || deploymentReceipt.status !== "success") {
    throw new Error("Could not verify deployment transaction on Sepolia.");
  }

  if (input.moduleTxHash.toLowerCase() !== input.deploymentTxHash.toLowerCase()) {
    const moduleReceipt = await publicClient
      .getTransactionReceipt({ hash: input.moduleTxHash as Hex })
      .catch(() => null);
    if (!moduleReceipt || moduleReceipt.status !== "success") {
      throw new Error("Could not verify module configuration transaction on Sepolia.");
    }
  }

  return persistDeploymentRecord({
    walletAddress: input.walletAddress,
    safeAddress: input.safeAddress,
    deploymentTxHash: input.deploymentTxHash,
    moduleTxHash: input.moduleTxHash,
    accountType: input.accountType,
    baseCurrency: input.baseCurrency,
    accountName: input.accountName,
    subAccounts: input.subAccounts,
    modules: input.modules,
    network: input.network,
    mode: "real"
  });
}

export async function deploySafeSetup(input: SafeSetupRequestInput) {
  if (getMode() === "mock") {
    return deployMockSafe(input);
  }

  if (getDeploymentStrategy() === "relay") {
    return deployRealSafeViaRelayer(input);
  }

  throw new Error(
    "This app is configured for ERC-4337 deployment. Complete deployment from the browser wallet and then register it via /api/safe/deploy/register."
  );
}

export async function findLatestSafeByOwner(walletAddress: string): Promise<SafeDeploymentRecord | null> {
  const deployments = await readJsonFile<SafeDeploymentRecord[]>("safe-deployments.json", []);
  const normalized = walletAddress.toLowerCase();

  for (let index = deployments.length - 1; index >= 0; index -= 1) {
    const deployment = deployments[index];
    if (deployment.walletAddress.toLowerCase() === normalized) {
      return deployment;
    }
  }

  return null;
}

export async function isWalletOwnerOfSafe(walletAddress: string, safeAddress: string) {
  if (getMode() === "mock") {
    const deployments = await readJsonFile<SafeDeploymentRecord[]>("safe-deployments.json", []);
    return deployments.some(
      (entry) =>
        entry.walletAddress.toLowerCase() === walletAddress.toLowerCase() &&
        entry.safeAddress.toLowerCase() === safeAddress.toLowerCase()
    );
  }

  const rpcUrl = await getValidatedSafeRpcUrl();
  const protocolKit = await Safe.init({
    provider: rpcUrl,
    signer: walletAddress,
    safeAddress
  });

  const owners = await protocolKit.getOwners();
  return owners.some((owner) => owner.toLowerCase() === walletAddress.toLowerCase());
}
