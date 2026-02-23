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
};

type ApiErrorPayload = {
  error?: string;
};

export async function connectWallet(connector: "passkey" | "walletconnect" | "injected") {
  const response = await fetch("/api/safe/connect", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ connector })
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as ApiErrorPayload | null;
    throw new Error(payload?.error ?? "Could not connect signer");
  }

  return (await response.json()) as {
    connector: "passkey" | "walletconnect" | "injected";
    walletAddress: string;
    sessionId: string;
  };
}

export async function deploySafeAccount(request: SafeSetupRequest): Promise<SafeSetupResult> {
  const response = await fetch("/api/safe/deploy", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(request)
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as ApiErrorPayload | null;
    throw new Error(payload?.error ?? "Could not deploy smart account");
  }

  return (await response.json()) as SafeSetupResult;
}
