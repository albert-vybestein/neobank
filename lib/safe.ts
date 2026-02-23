import { createSmartAccountClient } from "permissionless";
import { toSafeSmartAccount } from "permissionless/accounts";
import { createPimlicoClient } from "permissionless/clients/pimlico";
import { createPublicClient, createWalletClient, custom, http, type Address, type EIP1193Provider } from "viem";
import { entryPoint07Address } from "viem/account-abstraction";
import { sepolia } from "viem/chains";

export type AccountType = "personal" | "joint" | "business" | "sub-account";

export type SafeModuleConfig = {
  guildDelay: boolean;
  guildRoles: boolean;
  guildAllowance: boolean;
  guildRecovery: boolean;
  rhinestoneSessions: boolean;
  rhinestoneSpendingPolicy: boolean;
  rhinestoneAutomation: boolean;
  timeLockHours: number;
};

export type SafeSetupRequest = {
  walletAddress: string;
  accountType: AccountType;
  baseCurrency: "EUR" | "USD" | "GBP";
  accountName: string;
  subAccounts: Array<{ name: string; spendingLimit: string }>;
  modules: SafeModuleConfig;
};

export type SafeSetupResult = {
  safeAddress: string;
  deploymentTxHash: string;
  moduleTxHash: string;
  status: "deployed";
  mode?: "mock" | "real";
  network?: string;
};

type ApiErrorPayload = {
  error?: string;
};

type DeploymentLookupResponse = {
  deployment: {
    safeAddress: string;
    deploymentTxHash: string;
    moduleTxHash: string;
    createdAt: string;
    mode: "mock" | "real";
    network: string;
  } | null;
};

type AuthVerifyResponse = {
  ok: true;
  walletAddress: string;
  safeAddress: string;
  expiresAt: string;
};

export type AuthSessionResponse = {
  authenticated: boolean;
  walletAddress?: string;
  safeAddress?: string;
  expiresAt?: string;
};

type DeploySafeAccountOptions = {
  ownerProvider?: WalletProvider;
};

type WalletProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (eventName: string, listener: (...eventArgs: unknown[]) => void) => unknown;
  removeListener?: (eventName: string, listener: (...eventArgs: unknown[]) => void) => unknown;
};

function isMockWalletMode() {
  return process.env.NEXT_PUBLIC_SAFE_WALLET_MODE === "mock";
}

function getDeployStrategy(): "relay" | "erc4337" {
  const explicit = process.env.NEXT_PUBLIC_SAFE_DEPLOY_STRATEGY?.trim().toLowerCase();
  if (explicit === "relay" || explicit === "erc4337") return explicit;
  return process.env.NEXT_PUBLIC_PIMLICO_RPC_URL ? "erc4337" : "relay";
}

function getPimlicoRpcUrl() {
  return process.env.NEXT_PUBLIC_PIMLICO_RPC_URL?.trim() ?? "";
}

function getPublicRpcUrl() {
  return process.env.NEXT_PUBLIC_SAFE_RPC_URL?.trim() || getPimlicoRpcUrl();
}

function getInjectedProvider(): WalletProvider {
  if (typeof window === "undefined") {
    throw new Error("Wallet connection is only available in the browser.");
  }

  const provider = (window as Window & { ethereum?: EIP1193Provider }).ethereum;
  if (!provider) {
    throw new Error("No browser wallet detected. Install MetaMask or a compatible wallet.");
  }

  return provider;
}

async function ensureSepoliaNetwork(provider: WalletProvider) {
  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0xaa36a7" }]
    });
  } catch {
    // Keep current chain if switch prompt fails. Deploy call will surface network mismatch.
  }
}

async function parseApiError(response: Response, fallback: string) {
  const payload = (await response.json().catch(() => null)) as ApiErrorPayload | null;
  return payload?.error ?? fallback;
}

async function deploySafeAccountVia4337(
  request: SafeSetupRequest,
  ownerProvider: WalletProvider
): Promise<SafeSetupResult> {
  const pimlicoRpcUrl = getPimlicoRpcUrl();
  if (!pimlicoRpcUrl) {
    throw new Error("NEXT_PUBLIC_PIMLICO_RPC_URL is required for ERC-4337 deployment.");
  }

  const publicRpcUrl = getPublicRpcUrl();
  if (!publicRpcUrl) {
    throw new Error("Set NEXT_PUBLIC_SAFE_RPC_URL or NEXT_PUBLIC_PIMLICO_RPC_URL for Safe ownership checks.");
  }

  await ensureSepoliaNetwork(ownerProvider);

  const ownerWalletClient = createWalletClient({
    account: request.walletAddress as Address,
    chain: sepolia,
    transport: custom(ownerProvider as EIP1193Provider)
  });

  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(publicRpcUrl)
  });

  const pimlicoClient = createPimlicoClient({
    chain: sepolia,
    transport: http(pimlicoRpcUrl),
    entryPoint: {
      address: entryPoint07Address,
      version: "0.7"
    }
  });

  const safeAccount = await toSafeSmartAccount({
    client: publicClient,
    owners: [ownerWalletClient],
    version: "1.4.1",
    entryPoint: {
      address: entryPoint07Address,
      version: "0.7"
    },
    saltNonce: BigInt(Date.now())
  });

  const smartAccountClient = createSmartAccountClient({
    account: safeAccount,
    chain: sepolia,
    client: publicClient,
    bundlerTransport: http(pimlicoRpcUrl),
    paymaster: {
      getPaymasterStubData: async (parameters) => pimlicoClient.getPaymasterStubData(parameters),
      getPaymasterData: async (parameters) => pimlicoClient.getPaymasterData(parameters)
    },
    userOperation: {
      estimateFeesPerGas: async () => {
        const gasPrice = await pimlicoClient.getUserOperationGasPrice();
        return gasPrice.fast;
      }
    }
  });

  const deploymentTxHash = await smartAccountClient.sendTransaction({
    account: safeAccount,
    to: request.walletAddress as Address,
    value: BigInt(0),
    data: "0x"
  });

  const registerResponse = await fetch("/api/safe/deploy/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      ...request,
      safeAddress: safeAccount.address,
      deploymentTxHash,
      moduleTxHash: deploymentTxHash,
      mode: "real",
      network: "sepolia"
    })
  });

  if (!registerResponse.ok) {
    throw new Error(await parseApiError(registerResponse, "Safe deployed but registration failed."));
  }

  return (await registerResponse.json()) as SafeSetupResult;
}

export async function connectWallet(connector: "walletconnect" | "injected") {
  if (isMockWalletMode()) {
    const response = await fetch("/api/safe/connect", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ connector })
    });

    if (!response.ok) {
      throw new Error(await parseApiError(response, "Could not connect signer"));
    }

    return (await response.json()) as {
      connector: "walletconnect" | "injected";
      walletAddress: string;
      sessionId: string;
    };
  }

  if (connector !== "injected") {
    throw new Error("Live testnet deploy requires browser wallet.");
  }

  const provider = getInjectedProvider();
  await ensureSepoliaNetwork(provider);

  const walletClient = createWalletClient({
    transport: custom(provider),
    chain: sepolia
  });

  const addresses = await walletClient.requestAddresses();
  const walletAddress = addresses[0];

  if (!walletAddress) {
    throw new Error("No wallet address returned from browser wallet.");
  }

  return {
    connector,
    walletAddress,
    sessionId: `${Date.now()}`
  };
}

export async function deploySafeAccount(
  request: SafeSetupRequest,
  options: DeploySafeAccountOptions = {}
): Promise<SafeSetupResult> {
  if (!isMockWalletMode() && getDeployStrategy() === "erc4337") {
    if (!options.ownerProvider) {
      throw new Error("Could not access wallet provider for ERC-4337 deployment.");
    }
    return deploySafeAccountVia4337(request, options.ownerProvider);
  }

  const response = await fetch("/api/safe/deploy", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(request)
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response, "Could not deploy smart account"));
  }

  return (await response.json()) as SafeSetupResult;
}

export async function findSafeByOwner(owner: string) {
  const response = await fetch(`/api/safe/by-owner?owner=${encodeURIComponent(owner)}`, {
    method: "GET",
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response, "Could not load account by owner"));
  }

  const parsed = (await response.json()) as DeploymentLookupResponse;
  return parsed.deployment;
}

export async function loginWithSafe(params: {
  walletAddress: string;
  safeAddress: string;
  privyAccessToken?: string;
}) {
  if (isMockWalletMode() && !params.privyAccessToken) {
    const mockResponse = await fetch("/api/auth/mock-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        walletAddress: params.walletAddress,
        safeAddress: params.safeAddress
      })
    });

    if (!mockResponse.ok) {
      throw new Error(await parseApiError(mockResponse, "Could not create mock session"));
    }

    return (await mockResponse.json()) as AuthVerifyResponse;
  }

  if (!params.privyAccessToken) {
    throw new Error("Privy authentication is required before creating a Safe session.");
  }

  const response = await fetch("/api/auth/privy-session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      walletAddress: params.walletAddress,
      safeAddress: params.safeAddress,
      accessToken: params.privyAccessToken
    })
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response, "Could not verify Privy session"));
  }

  return (await response.json()) as AuthVerifyResponse;
}

export async function getAuthSession() {
  const response = await fetch("/api/auth/session", {
    method: "GET",
    cache: "no-store"
  });

  if (!response.ok) {
    return { authenticated: false } as AuthSessionResponse;
  }

  return (await response.json()) as AuthSessionResponse;
}

export async function logoutAuthSession() {
  await fetch("/api/auth/logout", {
    method: "POST"
  });
}
