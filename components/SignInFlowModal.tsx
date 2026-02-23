"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useCreateWallet, usePrivy, useWallets } from "@privy-io/react-auth";
import {
  ArrowRight,
  CheckCircle2,
  CircleDot,
  Clock3,
  Copy,
  Fingerprint,
  Globe2,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  Wallet
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trackEvent } from "@/lib/analytics";
import { getPrivyLoginMethodConfig, type PrivyLoginMethod } from "@/lib/privy";
import { connectWallet, deploySafeAccount, findSafeByOwner, loginWithSafe } from "@/lib/safe";
import type { AccountType, SafeModuleConfig } from "@/lib/safe";

type SignInFlowModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type Journey = "create" | "sign-in";
type StepKey = "access" | "account" | "features" | "deploy" | "ready";
type AccessKeyMode = "reuse" | "new";
type FeaturePresetId = "everyday" | "family" | "global" | "investor";

type ExistingDeployment = {
  safeAddress: string;
  deploymentTxHash: string;
  moduleTxHash: string;
  mode: "mock" | "real";
  network: string;
  createdAt: string;
};

type SubAccountDraft = {
  id: string;
  name: string;
  spendingLimit: string;
};

type ModuleToggleKey = Exclude<keyof SafeModuleConfig, "timeLockHours">;

type FeatureRow = {
  key: ModuleToggleKey;
  title: string;
  description: string;
  enabledBy: string;
};

type FeaturePreset = {
  id: FeaturePresetId;
  title: string;
  description: string;
  modules: SafeModuleConfig;
};

const stepLabels: Record<StepKey, string> = {
  access: "Access",
  account: "Account",
  features: "Features",
  deploy: "Deploy",
  ready: "Ready"
};

const journeySteps: Record<Journey, StepKey[]> = {
  create: ["access", "account", "features", "deploy", "ready"],
  "sign-in": ["access", "deploy", "ready"]
};

const deployChecklist = [
  "Authenticate",
  "Prepare secure account key",
  "Check existing Safe",
  "Deploy or resume",
  "Open dashboard session"
] as const;

const accountTypes: Array<{ id: AccountType; title: string; subtitle: string }> = [
  { id: "personal", title: "Personal", subtitle: "Everyday spending and savings" },
  { id: "joint", title: "Joint", subtitle: "Shared account for couples and family" },
  { id: "business", title: "Business", subtitle: "Team cards, approvals, and controls" },
  { id: "sub-account", title: "Sub-account", subtitle: "Dedicated budget account" }
];

const accessMethodCards: Array<{
  id: PrivyLoginMethod;
  title: string;
  description: string;
  icon: typeof Fingerprint;
  recommended?: boolean;
}> = [
  {
    id: "passkey",
    title: "Passkey",
    description: "Use Face ID or Touch ID. Best default for most people.",
    icon: Fingerprint,
    recommended: true
  },
  {
    id: "google",
    title: "Google",
    description: "Use Google as your login method.",
    icon: Globe2
  },
  {
    id: "twitter",
    title: "X",
    description: "Use X as your login method.",
    icon: Sparkles
  },
  {
    id: "wallet",
    title: "Wallet",
    description: "Use an existing wallet as your login method.",
    icon: Wallet
  }
];

const featureRows: FeatureRow[] = [
  {
    key: "guildDelay",
    title: "Transfer review delay",
    description: "Pause high value transfers for review before execution.",
    enabledBy: "Gnosis Guild Delay module"
  },
  {
    key: "guildRoles",
    title: "Approval roles",
    description: "Route approvals by role for shared and team accounts.",
    enabledBy: "Gnosis Guild Roles module"
  },
  {
    key: "guildAllowance",
    title: "Recurring spending limits",
    description: "Set recipient and category budgets with monthly resets.",
    enabledBy: "Gnosis Guild Allowance module"
  },
  {
    key: "guildRecovery",
    title: "Protected recovery",
    description: "Use trusted contacts with clear recovery timing.",
    enabledBy: "Gnosis Guild Recovery module"
  },
  {
    key: "rhinestoneSessions",
    title: "Trusted sessions",
    description: "Faster daily approvals bounded by account rules.",
    enabledBy: "Rhinestone Session Keys"
  },
  {
    key: "rhinestoneSpendingPolicy",
    title: "Smart spending policies",
    description: "Recipient, category, and transaction level controls.",
    enabledBy: "Rhinestone Policy module"
  },
  {
    key: "rhinestoneAutomation",
    title: "Scheduled automations",
    description: "Automate recurring top-ups and portfolio sweeps.",
    enabledBy: "Rhinestone Automation"
  }
];

const initialModules: SafeModuleConfig = {
  guildDelay: true,
  guildRoles: true,
  guildAllowance: true,
  guildRecovery: true,
  rhinestoneSessions: true,
  rhinestoneSpendingPolicy: true,
  rhinestoneAutomation: false,
  timeLockHours: 24
};

const featurePresets: FeaturePreset[] = [
  {
    id: "everyday",
    title: "Everyday",
    description: "Balanced controls for daily spending and transfers.",
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
  },
  {
    id: "family",
    title: "Family",
    description: "Stronger approvals and safer shared account defaults.",
    modules: {
      guildDelay: true,
      guildRoles: true,
      guildAllowance: true,
      guildRecovery: true,
      rhinestoneSessions: true,
      rhinestoneSpendingPolicy: true,
      rhinestoneAutomation: true,
      timeLockHours: 36
    }
  },
  {
    id: "global",
    title: "Global travel",
    description: "Faster session approvals with policy guardrails while abroad.",
    modules: {
      guildDelay: true,
      guildRoles: true,
      guildAllowance: true,
      guildRecovery: true,
      rhinestoneSessions: true,
      rhinestoneSpendingPolicy: true,
      rhinestoneAutomation: true,
      timeLockHours: 12
    }
  },
  {
    id: "investor",
    title: "Active investor",
    description: "Automation and spending policies on by default for market workflows.",
    modules: {
      guildDelay: true,
      guildRoles: true,
      guildAllowance: true,
      guildRecovery: true,
      rhinestoneSessions: false,
      rhinestoneSpendingPolicy: true,
      rhinestoneAutomation: true,
      timeLockHours: 18
    }
  }
];

const PRIVY_CONFIGURED = Boolean(process.env.NEXT_PUBLIC_PRIVY_APP_ID?.trim());

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function shortAddress(address: string) {
  return `${address.slice(0, 10)}...${address.slice(-6)}`;
}

function humanizeAccessMethodLabel(method: PrivyLoginMethod) {
  if (method === "twitter") return "X";
  if (method === "google") return "Google";
  if (method === "wallet") return "Wallet";
  return "Passkey";
}

function normalizeFlowErrorMessage(error: unknown, selectedAccessMethod: PrivyLoginMethod) {
  const raw = error instanceof Error ? error.message : "Setup failed. Please try again.";
  const normalized = raw.toLowerCase();
  const accessMethodLabel = humanizeAccessMethodLabel(selectedAccessMethod);

  if (normalized.includes("not allowed")) {
    return `${accessMethodLabel} sign in is not enabled for this Privy app yet. Enable this login method in Privy dashboard and try again.`;
  }

  if (normalized.includes("popup") && normalized.includes("block")) {
    return "Your browser blocked the sign in popup. Allow popups for this site and retry.";
  }

  if (normalized.includes("not completed") || normalized.includes("cancel")) {
    return "Sign in was not completed. Please retry and approve the request.";
  }

  if (normalized.includes("not authenticated") || normalized.includes("access token")) {
    return "Session validation failed. Please authenticate again.";
  }

  return raw;
}

function ToggleRow({
  label,
  description,
  enabledBy,
  enabled,
  onChange
}: {
  label: string;
  description: string;
  enabledBy: string;
  enabled: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-white px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">{label}</p>
          <p className="mt-1 text-xs text-slate-500">{description}</p>
          <p className="mt-1 text-[11px] text-slate-400">Enabled by {enabledBy}</p>
        </div>
        <button
          type="button"
          onClick={() => onChange(!enabled)}
          className={`inline-flex h-6 w-11 items-center rounded-full p-0.5 transition ${enabled ? "bg-primary" : "bg-slate-300"}`}
          aria-pressed={enabled}
          aria-label={`${label} toggle`}
        >
          <span className={`h-5 w-5 rounded-full bg-white transition ${enabled ? "translate-x-5" : "translate-x-0"}`} />
        </button>
      </div>
    </div>
  );
}

export function SignInFlowModal({ open, onOpenChange }: SignInFlowModalProps) {
  const { ready: privyReady, authenticated: privyAuthenticated, login, logout, getAccessToken } = usePrivy();
  const { wallets, ready: walletsReady } = useWallets();
  const { createWallet } = useCreateWallet();

  const walletsRef = useRef(wallets);
  const walletsReadyRef = useRef(walletsReady);
  const privyAuthenticatedRef = useRef(privyAuthenticated);
  const privyReadyRef = useRef(privyReady);

  const [journey, setJourney] = useState<Journey>("create");
  const [stepIndex, setStepIndex] = useState(0);

  const [selectedAccessMethod, setSelectedAccessMethod] = useState<PrivyLoginMethod>("passkey");
  const [accessProfileName, setAccessProfileName] = useState("Main passkey");
  const [accessKeyMode, setAccessKeyMode] = useState<AccessKeyMode>("reuse");

  const [accountType, setAccountType] = useState<AccountType>("personal");
  const [accountName, setAccountName] = useState("Main account");
  const [baseCurrency, setBaseCurrency] = useState<"EUR" | "USD" | "GBP">("EUR");

  const [subAccountName, setSubAccountName] = useState("");
  const [subAccountLimit, setSubAccountLimit] = useState("");
  const [subAccounts, setSubAccounts] = useState<SubAccountDraft[]>([
    { id: "bills", name: "Bills", spendingLimit: "2500" },
    { id: "travel", name: "Travel", spendingLimit: "1200" }
  ]);

  const [modules, setModules] = useState<SafeModuleConfig>(initialModules);
  const [selectedFeaturePreset, setSelectedFeaturePreset] = useState<FeaturePresetId>("everyday");
  const [preferExistingSafe, setPreferExistingSafe] = useState(true);

  const [deploying, setDeploying] = useState(false);
  const [deployPhaseIndex, setDeployPhaseIndex] = useState(0);

  const [walletAddress, setWalletAddress] = useState("");
  const [existingDeployment, setExistingDeployment] = useState<ExistingDeployment | null>(null);

  const [safeAddress, setSafeAddress] = useState("");
  const [deploymentTx, setDeploymentTx] = useState("");
  const [moduleTx, setModuleTx] = useState("");
  const [deploymentMode, setDeploymentMode] = useState<"mock" | "real">("mock");
  const [deploymentNetwork, setDeploymentNetwork] = useState("sepolia");

  const [sessionReady, setSessionReady] = useState(false);
  const [flowError, setFlowError] = useState("");
  const [copied, setCopied] = useState(false);

  const privyConfig = getPrivyLoginMethodConfig();
  const visibleAccessMethods = useMemo(() => {
    if (!privyConfig.hasExplicitConfiguration) return accessMethodCards;
    const filtered = accessMethodCards.filter((entry) => privyConfig.methods.includes(entry.id));
    return filtered.length > 0 ? filtered : accessMethodCards;
  }, [privyConfig.hasExplicitConfiguration, privyConfig.methods]);

  const steps = journeySteps[journey];
  const currentStep = steps[Math.min(stepIndex, steps.length - 1)] ?? "access";

  const canContinue = useMemo(() => {
    if (currentStep === "account") return accountName.trim().length > 0;
    return true;
  }, [accountName, currentStep]);

  const enabledFeatureCount = useMemo(
    () => featureRows.reduce((count, row) => (modules[row.key] ? count + 1 : count), 0),
    [modules]
  );

  useEffect(() => {
    walletsRef.current = wallets;
  }, [wallets]);

  useEffect(() => {
    walletsReadyRef.current = walletsReady;
  }, [walletsReady]);

  useEffect(() => {
    privyAuthenticatedRef.current = privyAuthenticated;
  }, [privyAuthenticated]);

  useEffect(() => {
    privyReadyRef.current = privyReady;
  }, [privyReady]);

  useEffect(() => {
    if (stepIndex > steps.length - 1) {
      setStepIndex(steps.length - 1);
    }
  }, [stepIndex, steps.length]);

  const resetFlow = () => {
    setJourney("create");
    setStepIndex(0);
    setSelectedAccessMethod("passkey");
    setAccessProfileName("Main passkey");
    setAccessKeyMode("reuse");

    setAccountType("personal");
    setAccountName("Main account");
    setBaseCurrency("EUR");
    setSubAccountName("");
    setSubAccountLimit("");
    setSubAccounts([
      { id: "bills", name: "Bills", spendingLimit: "2500" },
      { id: "travel", name: "Travel", spendingLimit: "1200" }
    ]);
    setModules(initialModules);
    setSelectedFeaturePreset("everyday");
    setPreferExistingSafe(true);

    setDeploying(false);
    setDeployPhaseIndex(0);

    setWalletAddress("");
    setExistingDeployment(null);
    setSafeAddress("");
    setDeploymentTx("");
    setModuleTx("");
    setDeploymentMode("mock");
    setDeploymentNetwork("sepolia");
    setSessionReady(false);
    setFlowError("");
    setCopied(false);
  };

  useEffect(() => {
    if (!open) {
      const timer = setTimeout(resetFlow, 150);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const waitForPrivyReady = async () => {
    for (let attempt = 0; attempt < 80; attempt += 1) {
      if (privyReadyRef.current) return;
      await delay(250);
    }
    throw new Error("Sign in is still loading. Please try again.");
  };

  const waitForPrivyAuthenticated = async () => {
    for (let attempt = 0; attempt < 480; attempt += 1) {
      if (privyAuthenticatedRef.current) return;
      await delay(250);
    }
    throw new Error("Sign in was not completed. Please try again.");
  };

  const waitForWalletProvider = async (address?: string) => {
    for (let attempt = 0; attempt < 60; attempt += 1) {
      if (!walletsReadyRef.current) {
        await delay(250);
        continue;
      }

      const candidates = walletsRef.current.filter(
        (wallet) => wallet.address && wallet.address.toLowerCase().startsWith("0x")
      );

      const match = address
        ? candidates.find((wallet) => wallet.address.toLowerCase() === address.toLowerCase())
        : candidates[0];

      if (match && typeof match.getEthereumProvider === "function") {
        return match;
      }

      await delay(250);
    }

    return null;
  };

  const ensurePrivyAuthentication = async () => {
    if (!PRIVY_CONFIGURED) return;

    await waitForPrivyReady();

    if (privyAuthenticatedRef.current) return;

    if (privyConfig.hasExplicitConfiguration && !privyConfig.methods.includes(selectedAccessMethod)) {
      throw new Error("The selected access method is not enabled for this Privy app.");
    }

    try {
      login({ loginMethods: [selectedAccessMethod] });
    } catch {
      login();
    }

    await waitForPrivyAuthenticated();
  };

  const resolveOwnerForSession = async () => {
    if (!PRIVY_CONFIGURED) {
      if (!walletAddress) {
        const connected = await connectWallet("injected");
        setWalletAddress(connected.walletAddress);
        return { ownerAddress: connected.walletAddress, ownerProvider: undefined };
      }
      return { ownerAddress: walletAddress, ownerProvider: undefined };
    }

    await ensurePrivyAuthentication();

    const shouldCreateNewKey = selectedAccessMethod !== "wallet" && accessKeyMode === "new";

    if (!shouldCreateNewKey) {
      const existingWallet = await waitForWalletProvider();
      if (existingWallet) {
        const provider = await existingWallet.getEthereumProvider();
        setWalletAddress(existingWallet.address);
        return { ownerAddress: existingWallet.address, ownerProvider: provider };
      }
    }

    if (selectedAccessMethod === "wallet") {
      throw new Error("No wallet was found for this sign in method. Connect a wallet in the login prompt and retry.");
    }

    const created = await createWallet();
    if (!created?.address) {
      throw new Error("Could not create your secure account key.");
    }

    const hydratedWallet = await waitForWalletProvider(created.address);
    if (!hydratedWallet) {
      throw new Error("Account key was created but could not be initialized. Please retry.");
    }

    const provider = await hydratedWallet.getEthereumProvider();
    setWalletAddress(hydratedWallet.address);
    void trackEvent("privy_embedded_wallet_created", { source: "deploy" });

    return { ownerAddress: hydratedWallet.address, ownerProvider: provider };
  };

  const startSafeSession = async (targetSafeAddress: string, ownerAddress: string) => {
    const privyAccessToken = PRIVY_CONFIGURED ? await getAccessToken() : undefined;
    if (PRIVY_CONFIGURED && !privyAccessToken) {
      throw new Error("Authenticated session expired. Please retry.");
    }

    await loginWithSafe({
      walletAddress: ownerAddress,
      safeAddress: targetSafeAddress,
      privyAccessToken: privyAccessToken ?? undefined
    });

    setSessionReady(true);
  };

  const runDeployOrSignIn = async () => {
    setFlowError("");
    setDeploying(true);

    try {
      setDeployPhaseIndex(1);
      await delay(100);

      setDeployPhaseIndex(2);
      const { ownerAddress, ownerProvider } = await resolveOwnerForSession();

      setDeployPhaseIndex(3);
      const existing = await findSafeByOwner(ownerAddress);
      setExistingDeployment(existing);

      if (journey === "sign-in") {
        if (!existing) {
          throw new Error("No existing account was found for this login method. Choose Create account to continue.");
        }

        setSafeAddress(existing.safeAddress);
        setDeploymentTx(existing.deploymentTxHash);
        setModuleTx(existing.moduleTxHash);
        setDeploymentMode(existing.mode);
        setDeploymentNetwork(existing.network);

        setDeployPhaseIndex(5);
        await startSafeSession(existing.safeAddress, ownerAddress);
        setStepIndex(steps.length - 1);

        void trackEvent("safe_login_existing_success", {
          authMethod: selectedAccessMethod,
          safeAddress: existing.safeAddress,
          accessProfileName,
          accessKeyMode
        });

        return;
      }

      if (existing && preferExistingSafe) {
        setSafeAddress(existing.safeAddress);
        setDeploymentTx(existing.deploymentTxHash);
        setModuleTx(existing.moduleTxHash);
        setDeploymentMode(existing.mode);
        setDeploymentNetwork(existing.network);

        setDeployPhaseIndex(5);
        await startSafeSession(existing.safeAddress, ownerAddress);
        setStepIndex(steps.length - 1);

        void trackEvent("safe_login_existing_success", {
          authMethod: selectedAccessMethod,
          safeAddress: existing.safeAddress,
          accessProfileName,
          accessKeyMode
        });

        return;
      }

      setDeployPhaseIndex(4);
      const deployed = await deploySafeAccount(
        {
          walletAddress: ownerAddress,
          accountType,
          baseCurrency,
          accountName,
          subAccounts: subAccounts.map((item) => ({ name: item.name, spendingLimit: item.spendingLimit })),
          modules
        },
        { ownerProvider }
      );

      setSafeAddress(deployed.safeAddress);
      setDeploymentTx(deployed.deploymentTxHash);
      setModuleTx(deployed.moduleTxHash);
      setDeploymentMode(deployed.mode ?? "mock");
      setDeploymentNetwork(deployed.network ?? "sepolia");

      setDeployPhaseIndex(5);
      await startSafeSession(deployed.safeAddress, ownerAddress);
      setStepIndex(steps.length - 1);

      void trackEvent("safe_deploy_success", {
        accountType,
        features: enabledFeatureCount,
        authMethod: selectedAccessMethod,
        mode: deployed.mode ?? "mock",
        accessProfileName,
        accessKeyMode
      });
    } catch (error) {
      const message = normalizeFlowErrorMessage(error, selectedAccessMethod);
      setFlowError(message);
      setSessionReady(false);
      void trackEvent("safe_deploy_failed", { message, journey });
    } finally {
      setDeploying(false);
      setDeployPhaseIndex(0);
    }
  };

  const applyFeaturePreset = (presetId: FeaturePresetId) => {
    const preset = featurePresets.find((entry) => entry.id === presetId);
    if (!preset) return;

    setSelectedFeaturePreset(presetId);
    setModules({ ...preset.modules });
    setFlowError("");
    void trackEvent("signup_feature_preset_applied", { presetId });
  };

  const addSubAccount = () => {
    if (!subAccountName.trim() || !subAccountLimit.trim()) return;

    const generatedId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    setSubAccounts((prev) => [
      ...prev,
      {
        id: generatedId,
        name: subAccountName.trim(),
        spendingLimit: subAccountLimit.trim()
      }
    ]);

    setSubAccountName("");
    setSubAccountLimit("");
  };

  const copySafeAddress = async () => {
    if (!safeAddress) return;

    try {
      await navigator.clipboard.writeText(safeAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  const goBack = () => {
    if (deploying) return;
    setFlowError("");
    setStepIndex((index) => Math.max(index - 1, 0));
  };

  const goNext = () => {
    if (deploying || !canContinue) return;
    setFlowError("");

    if (currentStep === "deploy") {
      void runDeployOrSignIn();
      return;
    }

    setStepIndex((index) => Math.min(index + 1, steps.length - 1));
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (deploying && !nextOpen) return;
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="max-h-[96dvh] w-[min(96vw,1120px)] max-w-none overflow-hidden p-0">
        <div className="flex h-[min(92dvh,860px)] flex-col overflow-hidden md:grid md:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="border-b border-border/80 bg-slate-50 p-6 md:border-b-0 md:border-r">
            <div className="space-y-2">
              <Badge variant="outline" className="bg-white text-slate-700">
                {journey === "create" ? "Create account" : "Sign in"}
              </Badge>
              <p className="text-sm text-slate-600">
                Select access first. Authentication only happens at deploy or sign in stage.
              </p>
            </div>

            <ol className="mt-6 space-y-2">
              {steps.map((step, index) => {
                const active = index === stepIndex;
                const done = index < stepIndex;
                return (
                  <li
                    key={`${step}-${index}`}
                    className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm ${
                      active ? "bg-white font-semibold text-slate-900 shadow-sm" : "text-slate-500"
                    }`}
                  >
                    {done ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <CircleDot className="h-4 w-4" />
                    )}
                    <span>{stepLabels[step]}</span>
                  </li>
                );
              })}
            </ol>
          </aside>

          <div className="min-h-0 overflow-y-auto overscroll-contain p-6 pb-20 md:p-8 md:pb-8">
            {currentStep === "access" ? (
              <div className="space-y-6">
                <DialogHeader>
                  <DialogTitle className="text-3xl">Choose access method</DialogTitle>
                  <DialogDescription className="text-base">
                    Pick your login method now. We connect it at the final step.
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => {
                      setJourney("create");
                      setStepIndex(0);
                    }}
                    className={`rounded-2xl border p-4 text-left transition ${
                      journey === "create" ? "border-primary bg-blue-50" : "border-border/80 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <p className="text-sm font-semibold text-slate-900">Create account</p>
                    <p className="mt-1 text-xs text-slate-500">New Safe account with your selected account features.</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setJourney("sign-in");
                      setStepIndex(0);
                    }}
                    className={`rounded-2xl border p-4 text-left transition ${
                      journey === "sign-in" ? "border-primary bg-blue-50" : "border-border/80 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <p className="text-sm font-semibold text-slate-900">Sign in existing</p>
                    <p className="mt-1 text-xs text-slate-500">Find and open your existing Safe-backed account.</p>
                  </button>
                </div>

                {PRIVY_CONFIGURED ? (
                  <Card className="bg-white/95">
                    <CardContent className="space-y-4 p-5">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Primary method</p>
                        {visibleAccessMethods
                          .filter((entry) => entry.id === "passkey")
                          .map((method) => (
                            <button
                              key={method.id}
                              type="button"
                              onClick={() => setSelectedAccessMethod(method.id)}
                              className={`mt-2 w-full rounded-2xl border p-4 text-left transition ${
                                selectedAccessMethod === method.id
                                  ? "border-primary bg-blue-50"
                                  : "border-blue-200 bg-blue-50/60 hover:bg-blue-100/60"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-base font-semibold text-slate-900">{method.title}</p>
                                  <p className="mt-1 text-sm text-slate-600">{method.description}</p>
                                </div>
                                <Badge className="bg-white text-slate-700">Recommended</Badge>
                              </div>
                            </button>
                          ))}
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Secondary methods</p>
                        <div className="mt-2 grid gap-3 sm:grid-cols-3">
                          {visibleAccessMethods
                            .filter((entry) => entry.id !== "passkey")
                            .map((method) => (
                              <button
                                key={method.id}
                                type="button"
                                onClick={() => setSelectedAccessMethod(method.id)}
                                className={`rounded-2xl border p-4 text-left transition ${
                                  selectedAccessMethod === method.id
                                    ? "border-primary bg-blue-50"
                                    : "border-border/80 bg-white hover:bg-slate-50"
                                }`}
                              >
                                <method.icon className="mb-2 h-4 w-4 text-primary" />
                                <p className="text-sm font-semibold text-slate-900">{method.title}</p>
                                <p className="mt-1 text-xs text-slate-500">{method.description}</p>
                              </button>
                            ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="bg-white/95">
                    <CardHeader>
                      <CardTitle className="text-lg">Local test mode</CardTitle>
                      <p className="text-sm text-slate-600">
                        Privy is not configured. You can test with a local browser wallet flow.
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {!walletAddress ? (
                        <Button
                          type="button"
                          onClick={async () => {
                            setFlowError("");
                            try {
                              const connected = await connectWallet("injected");
                              setWalletAddress(connected.walletAddress);
                            } catch (error) {
                              setFlowError(error instanceof Error ? error.message : "Could not connect wallet.");
                            }
                          }}
                        >
                          <Wallet className="h-4 w-4" />
                          Connect browser wallet
                        </Button>
                      ) : (
                        <div className="space-y-1">
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700">
                            Connected
                          </Badge>
                          <p className="font-mono text-xs text-slate-700">{walletAddress}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                <Card className="bg-white/95">
                  <CardHeader>
                    <CardTitle className="text-lg">Access profile</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="access-profile-name" className="text-sm font-medium text-slate-700">
                        Profile label
                      </label>
                      <input
                        id="access-profile-name"
                        value={accessProfileName}
                        onChange={(event) => setAccessProfileName(event.target.value)}
                        className="h-10 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                        placeholder="Main passkey"
                        maxLength={40}
                      />
                    </div>

                    {PRIVY_CONFIGURED && selectedAccessMethod !== "wallet" ? (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Key handling at deploy</p>
                        <div className="grid gap-2 sm:grid-cols-2">
                          <button
                            type="button"
                            onClick={() => setAccessKeyMode("reuse")}
                            className={`rounded-xl border p-3 text-left transition ${
                              accessKeyMode === "reuse"
                                ? "border-primary bg-blue-50"
                                : "border-border/80 bg-white hover:bg-slate-50"
                            }`}
                          >
                            <p className="text-sm font-semibold text-slate-900">Use existing key</p>
                            <p className="mt-1 text-xs text-slate-500">Recommended for returning users.</p>
                          </button>
                          <button
                            type="button"
                            onClick={() => setAccessKeyMode("new")}
                            className={`rounded-xl border p-3 text-left transition ${
                              accessKeyMode === "new"
                                ? "border-primary bg-blue-50"
                                : "border-border/80 bg-white hover:bg-slate-50"
                            }`}
                          >
                            <p className="text-sm font-semibold text-slate-900">Create new key</p>
                            <p className="mt-1 text-xs text-slate-500">Use this if your previous key was lost or reset.</p>
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>

                <Card className="bg-white/95">
                  <CardContent className="space-y-2 p-5 text-sm text-slate-600">
                    <p className="font-semibold text-slate-900">What happens at deploy</p>
                    <p>1. You authenticate with the method selected above.</p>
                    <p>2. We prepare your secure account key if needed.</p>
                    <p>3. We open your existing Safe account or deploy a new one.</p>
                    <p>4. Your dashboard session starts automatically.</p>
                  </CardContent>
                </Card>

                {flowError ? <p className="text-sm text-rose-600">{flowError}</p> : null}
              </div>
            ) : null}

            {currentStep === "account" ? (
              <div className="space-y-6">
                <DialogHeader>
                  <DialogTitle className="text-3xl">Set up account</DialogTitle>
                  <DialogDescription className="text-base">
                    Configure your account profile before deployment.
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-3 md:grid-cols-2">
                  {accountTypes.map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setAccountType(type.id)}
                      className={`rounded-2xl border p-4 text-left transition ${
                        accountType === type.id
                          ? "border-primary bg-blue-50"
                          : "border-border/80 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <p className="text-sm font-semibold text-slate-900">{type.title}</p>
                      <p className="mt-1 text-xs text-slate-500">{type.subtitle}</p>
                    </button>
                  ))}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="account-name" className="text-sm font-medium text-slate-700">
                      Account name
                    </label>
                    <input
                      id="account-name"
                      value={accountName}
                      onChange={(event) => setAccountName(event.target.value)}
                      className="h-11 w-full rounded-2xl border border-border bg-white px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                      placeholder="Main account"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="currency" className="text-sm font-medium text-slate-700">
                      Base currency
                    </label>
                    <select
                      id="currency"
                      value={baseCurrency}
                      onChange={(event) => setBaseCurrency(event.target.value as "EUR" | "USD" | "GBP")}
                      className="h-11 w-full rounded-2xl border border-border bg-white px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="EUR">EUR</option>
                      <option value="USD">USD</option>
                      <option value="GBP">GBP</option>
                    </select>
                  </div>
                </div>

                <Card className="bg-white/95">
                  <CardHeader>
                    <CardTitle className="text-xl">Sub-accounts</CardTitle>
                    <p className="text-sm text-slate-600">Create dedicated buckets with their own limits.</p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid gap-3 sm:grid-cols-[1fr_130px_auto]">
                      <input
                        value={subAccountName}
                        onChange={(event) => setSubAccountName(event.target.value)}
                        className="h-10 rounded-xl border border-border bg-white px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                        placeholder="Sub-account name"
                      />
                      <input
                        value={subAccountLimit}
                        onChange={(event) => setSubAccountLimit(event.target.value)}
                        className="h-10 rounded-xl border border-border bg-white px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                        placeholder="Limit"
                      />
                      <Button type="button" variant="outline" className="h-10" onClick={addSubAccount}>
                        <Plus className="h-4 w-4" />
                        Add
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {subAccounts.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between rounded-xl border border-border/70 bg-slate-50 px-3 py-2"
                        >
                          <div>
                            <p className="text-sm font-medium text-slate-800">{item.name}</p>
                            <p className="text-xs text-slate-500">
                              Limit {baseCurrency} {item.spendingLimit}
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setSubAccounts((prev) => prev.filter((entry) => entry.id !== item.id))}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : null}

            {currentStep === "features" ? (
              <div className="space-y-6">
                <DialogHeader>
                  <DialogTitle className="text-3xl">Account features</DialogTitle>
                  <DialogDescription className="text-base">
                    Choose the controls you want active from day one.
                  </DialogDescription>
                </DialogHeader>

                <Card className="bg-white/95">
                  <CardHeader>
                    <CardTitle className="text-lg">How this is enabled</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm text-slate-600">
                    <p>
                      You only choose product features here. During deployment we map these features to audited account
                      modules from Safe ecosystem partners.
                    </p>
                    <p>Gnosis Guild and Rhinestone modules are configured in background, not as user-facing complexity.</p>
                  </CardContent>
                </Card>

                <div className="grid gap-3 md:grid-cols-4">
                  {featurePresets.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => applyFeaturePreset(preset.id)}
                      className={`rounded-2xl border p-4 text-left transition ${
                        selectedFeaturePreset === preset.id
                          ? "border-primary bg-blue-50"
                          : "border-border/80 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <p className="text-sm font-semibold text-slate-900">{preset.title}</p>
                      <p className="mt-1 text-xs text-slate-500">{preset.description}</p>
                    </button>
                  ))}
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  {featureRows.map((row) => (
                    <ToggleRow
                      key={row.key}
                      label={row.title}
                      description={row.description}
                      enabledBy={row.enabledBy}
                      enabled={modules[row.key]}
                      onChange={(value) => setModules((prev) => ({ ...prev, [row.key]: value }))}
                    />
                  ))}
                </div>

                <Card className="bg-white/95">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Clock3 className="h-4 w-4 text-primary" />
                      Transfer review window
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-slate-600">
                      For high value transfers, add a delay so you can review and cancel if needed.
                    </p>
                    <input
                      type="range"
                      min={0}
                      max={72}
                      step={1}
                      value={modules.timeLockHours}
                      onChange={(event) =>
                        setModules((prev) => ({ ...prev, timeLockHours: Number(event.target.value) }))
                      }
                      className="w-full"
                    />
                    <div className="flex items-center justify-between text-sm text-slate-600">
                      <span>Immediate</span>
                      <span className="font-semibold text-slate-900">{modules.timeLockHours} hours</span>
                      <span>72h max</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : null}

            {currentStep === "deploy" ? (
              <div className="space-y-6">
                <DialogHeader>
                  <DialogTitle className="text-3xl">{journey === "create" ? "Deploy account" : "Sign in"}</DialogTitle>
                  <DialogDescription className="text-base">
                    Authenticate now, then we finish setup and open your dashboard session.
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 lg:grid-cols-2">
                  <Card className="bg-white/95">
                    <CardHeader>
                      <CardTitle className="text-lg">Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-slate-700">
                      <p>
                        <span className="font-semibold">Journey:</span>{" "}
                        {journey === "create" ? "Create account" : "Sign in existing"}
                      </p>
                      <p>
                        <span className="font-semibold">Access method:</span>{" "}
                        {selectedAccessMethod === "twitter" ? "X" : selectedAccessMethod}
                      </p>
                      <p>
                        <span className="font-semibold">Access profile:</span> {accessProfileName || "Main access"}
                      </p>
                      {selectedAccessMethod !== "wallet" ? (
                        <p>
                          <span className="font-semibold">Key mode:</span>{" "}
                          {accessKeyMode === "new" ? "Create new key at deploy" : "Use existing key if available"}
                        </p>
                      ) : null}
                      {journey === "create" ? (
                        <>
                          <p>
                            <span className="font-semibold">Account type:</span> {accountType}
                          </p>
                          <p>
                            <span className="font-semibold">Account name:</span> {accountName}
                          </p>
                          <p>
                            <span className="font-semibold">Base currency:</span> {baseCurrency}
                          </p>
                          <p>
                            <span className="font-semibold">Sub-accounts:</span> {subAccounts.length}
                          </p>
                          <p>
                            <span className="font-semibold">Features enabled:</span> {enabledFeatureCount}
                          </p>
                        </>
                      ) : (
                        <p className="text-slate-600">We will find the latest account linked to this owner and open it.</p>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="bg-white/95">
                    <CardHeader>
                      <CardTitle className="text-lg">Sign in and deployment behavior</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm text-slate-700">
                      {journey === "create" ? (
                        <label className="flex cursor-pointer items-start gap-3">
                          <input
                            type="checkbox"
                            checked={preferExistingSafe}
                            onChange={(event) => setPreferExistingSafe(event.target.checked)}
                            className="mt-1 h-4 w-4 rounded border-slate-300"
                          />
                          <span>If an existing account is found, sign in directly instead of deploying a new one.</span>
                        </label>
                      ) : (
                        <p>Only existing accounts are opened in this mode. No new account is deployed.</p>
                      )}

                      <p className="text-xs text-slate-500">
                        Transaction and signature handling is automatic. There are no manual signature steps in this flow.
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <Card className="bg-white/95">
                  <CardHeader>
                    <CardTitle className="text-lg">Progress</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {deployChecklist.map((label, index) => {
                      const itemIndex = index + 1;
                      const done = deployPhaseIndex > itemIndex;
                      const active = deployPhaseIndex === itemIndex;

                      return (
                        <div key={label} className="flex items-center gap-2 text-sm">
                          {done ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          ) : active ? (
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          ) : (
                            <CircleDot className="h-4 w-4 text-slate-300" />
                          )}
                          <span className={active ? "font-medium text-slate-900" : "text-slate-600"}>{label}</span>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>

                {existingDeployment ? (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4">
                    <p className="text-sm font-semibold text-emerald-900">Existing account detected</p>
                    <p className="mt-1 font-mono text-xs text-emerald-800">{existingDeployment.safeAddress}</p>
                  </div>
                ) : null}

                {journey === "sign-in" && flowError.toLowerCase().includes("no existing account") ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setJourney("create");
                      setStepIndex(1);
                      setFlowError("");
                    }}
                  >
                    Switch to Create account
                  </Button>
                ) : null}

                <Button type="button" onClick={() => void runDeployOrSignIn()} disabled={deploying}>
                  {deploying ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Working...
                    </>
                  ) : (
                    <>
                      {journey === "create" ? "Authenticate and deploy" : "Authenticate and sign in"}
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>

                {PRIVY_CONFIGURED ? (
                  <Button
                    variant="ghost"
                    type="button"
                    onClick={async () => {
                      await logout();
                      setFlowError("");
                    }}
                    disabled={deploying}
                  >
                    Reset sign in session
                  </Button>
                ) : null}

                {flowError ? <p className="text-sm text-rose-600">{flowError}</p> : null}
              </div>
            ) : null}

            {currentStep === "ready" ? (
              <div className="space-y-6">
                <DialogHeader>
                  <DialogTitle className="text-3xl">Account ready</DialogTitle>
                  <DialogDescription className="text-base">
                    Session is active. Your dashboard is ready.
                  </DialogDescription>
                </DialogHeader>

                <Card className="bg-white/95">
                  <CardContent className="space-y-3 p-5">
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700">
                      {deploymentMode === "real" ? "Live testnet deployment" : "Mock deployment mode"}
                    </Badge>
                    <div className="space-y-2 text-sm">
                      <p className="font-medium text-slate-900">Account address</p>
                      <div className="flex flex-wrap items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 font-mono text-xs text-slate-700">
                        <span>{safeAddress}</span>
                        <Button type="button" variant="ghost" size="sm" className="h-7 px-2" onClick={copySafeAddress}>
                          <Copy className="h-3.5 w-3.5" />
                          {copied ? "Copied" : "Copy"}
                        </Button>
                      </div>
                      <p className="text-xs text-slate-500">Owner key: {walletAddress ? shortAddress(walletAddress) : "-"}</p>
                      <p className="text-xs text-slate-500">Access profile: {accessProfileName || "Main access"}</p>
                      <p className="text-xs text-slate-500">Network: {deploymentNetwork}</p>
                      <p className="text-xs text-slate-500">
                        Deploy tx: {deploymentTx ? `${deploymentTx.slice(0, 14)}...${deploymentTx.slice(-10)}` : "-"}
                      </p>
                      <p className="text-xs text-slate-500">
                        Feature tx: {moduleTx ? `${moduleTx.slice(0, 14)}...${moduleTx.slice(-10)}` : "-"}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex flex-wrap gap-3">
                  {sessionReady ? (
                    <Button asChild>
                      <Link href="/dashboard" onClick={() => onOpenChange(false)}>
                        Open dashboard
                      </Link>
                    </Button>
                  ) : (
                    <Button disabled>Open dashboard</Button>
                  )}

                  <Button variant="outline" onClick={resetFlow}>
                    Start another setup
                  </Button>
                </div>
              </div>
            ) : null}

            {currentStep !== "ready" ? (
              <div className="mt-8 flex items-center justify-between border-t border-border/70 pt-4">
                <Button variant="ghost" onClick={goBack} disabled={stepIndex === 0 || deploying}>
                  Back
                </Button>

                {currentStep !== "deploy" ? (
                  <Button onClick={goNext} disabled={!canContinue || deploying}>
                    Continue
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
