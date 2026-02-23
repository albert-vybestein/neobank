"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  CircleDot,
  Clock3,
  Copy,
  CreditCard,
  Fingerprint,
  Loader2,
  Plus,
  ShieldCheck,
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
import {
  connectWallet,
  deploySafeAccount
} from "@/lib/safe";
import type { AccountType, SafeModuleConfig } from "@/lib/safe";

type SignInFlowModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type Connector = "passkey" | "walletconnect" | "injected";

type SubAccountDraft = {
  id: string;
  name: string;
  spendingLimit: string;
};

const connectorOptions: Array<{ id: Connector; label: string; description: string; icon: typeof Fingerprint }> = [
  {
    id: "passkey",
    label: "Passkey",
    description: "Fast sign in with biometric security",
    icon: Fingerprint
  },
  {
    id: "walletconnect",
    label: "WalletConnect",
    description: "Connect from mobile wallet apps",
    icon: Wallet
  },
  {
    id: "injected",
    label: "Browser wallet",
    description: "Use an installed wallet extension",
    icon: CreditCard
  }
];

const accountTypes: Array<{ id: AccountType; title: string; subtitle: string }> = [
  { id: "personal", title: "Personal", subtitle: "One owner, instant daily use" },
  { id: "joint", title: "Joint", subtitle: "Two or more owners with approvals" },
  { id: "business", title: "Business", subtitle: "Team cards, admin roles, policy controls" },
  { id: "sub-account", title: "Sub-account", subtitle: "Dedicated account for a team, project, or budget" }
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

const stepTitles = ["Connect", "Account setup", "Features", "Deploy", "Ready"] as const;

function ToggleRow({
  label,
  description,
  enabled,
  onChange
}: {
  label: string;
  description: string;
  enabled: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-white px-4 py-3">
      <div>
        <p className="text-sm font-semibold text-slate-900">{label}</p>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!enabled)}
        className={`inline-flex h-6 w-11 items-center rounded-full p-0.5 transition ${enabled ? "bg-primary" : "bg-slate-300"}`}
        aria-pressed={enabled}
      >
        <span className={`h-5 w-5 rounded-full bg-white transition ${enabled ? "translate-x-5" : "translate-x-0"}`} />
      </button>
    </div>
  );
}

export function SignInFlowModal({ open, onOpenChange }: SignInFlowModalProps) {
  const [step, setStep] = useState(0);
  const [connector, setConnector] = useState<Connector>("passkey");
  const [connecting, setConnecting] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>("");

  const [accountType, setAccountType] = useState<AccountType>("personal");
  const [accountName, setAccountName] = useState("Main account");
  const [baseCurrency, setBaseCurrency] = useState<"EUR" | "USD" | "GBP">("EUR");

  const [subAccountName, setSubAccountName] = useState("");
  const [subAccountLimit, setSubAccountLimit] = useState("");
  const [subAccounts, setSubAccounts] = useState<SubAccountDraft[]>([
    { id: "1", name: "Bills", spendingLimit: "2500" },
    { id: "2", name: "Travel", spendingLimit: "1200" }
  ]);

  const [modules, setModules] = useState<SafeModuleConfig>(initialModules);

  const [deploying, setDeploying] = useState(false);
  const [safeAddress, setSafeAddress] = useState("");
  const [deploymentTx, setDeploymentTx] = useState("");
  const [moduleTx, setModuleTx] = useState("");
  const [copied, setCopied] = useState(false);
  const [flowError, setFlowError] = useState("");

  const resetFlow = () => {
    setStep(0);
    setConnecting(false);
    setWalletAddress("");
    setAccountType("personal");
    setAccountName("Main account");
    setBaseCurrency("EUR");
    setSubAccountName("");
    setSubAccountLimit("");
    setSubAccounts([
      { id: "1", name: "Bills", spendingLimit: "2500" },
      { id: "2", name: "Travel", spendingLimit: "1200" }
    ]);
    setModules(initialModules);
    setDeploying(false);
    setSafeAddress("");
    setDeploymentTx("");
    setModuleTx("");
    setCopied(false);
    setFlowError("");
  };

  useEffect(() => {
    if (!open) {
      const resetTimer = setTimeout(() => {
        resetFlow();
      }, 150);
      return () => clearTimeout(resetTimer);
    }
  }, [open]);

  const canContinue = useMemo(() => {
    if (step === 0) return Boolean(walletAddress);
    if (step === 1) return Boolean(accountName.trim());
    if (step === 2) return true;
    if (step === 3) return Boolean(safeAddress);
    return true;
  }, [step, walletAddress, accountName, safeAddress]);

  const handleConnect = async () => {
    setFlowError("");
    setConnecting(true);

    try {
      const result = await connectWallet(connector);
      setWalletAddress(result.walletAddress);
      void trackEvent("safe_connect_success", { connector });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Connection failed. Please try again.";
      setFlowError(message);
      void trackEvent("safe_connect_failed", { connector, message });
    } finally {
      setConnecting(false);
    }
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

  const handleDeploy = async () => {
    setFlowError("");
    setDeploying(true);

    try {
      const result = await deploySafeAccount({
        walletAddress,
        accountType,
        baseCurrency,
        accountName,
        subAccounts: subAccounts.map((item) => ({ name: item.name, spendingLimit: item.spendingLimit })),
        modules
      });
      setSafeAddress(result.safeAddress);
      setDeploymentTx(result.deploymentTxHash);
      setModuleTx(result.moduleTxHash);
      setStep(4);
      void trackEvent("safe_deploy_success", { accountType, subAccounts: subAccounts.length });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Deployment failed. Please try again.";
      setFlowError(message);
      void trackEvent("safe_deploy_failed", { message });
    } finally {
      setDeploying(false);
    }
  };

  const copySafeAddress = async () => {
    try {
      await navigator.clipboard.writeText(safeAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  const goNext = () => {
    setFlowError("");
    if (step === 2) {
      setStep(3);
      return;
    }
    if (step < 3 && canContinue) {
      setStep((prev) => prev + 1);
    }
  };

  const goBack = () => {
    setFlowError("");
    if (step > 0 && step < 4) {
      setStep((prev) => prev - 1);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-hidden p-0">
        <div className="grid h-[88vh] max-h-[88vh] grid-rows-[auto_minmax(0,1fr)] overflow-hidden md:grid-cols-[240px_minmax(0,1fr)] md:grid-rows-1">
          <aside className="border-b border-border/80 bg-slate-50 p-6 md:border-b-0 md:border-r">
            <div className="space-y-3">
              <Badge variant="outline" className="bg-white text-slate-700">
                Sign in flow
              </Badge>
              <p className="text-sm text-slate-600">Deploy your Safe smart account with neobank controls.</p>
            </div>
            <ol className="mt-6 space-y-3">
              {stepTitles.map((title, index) => (
                <li
                  key={title}
                  className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm ${
                    step === index ? "bg-white font-semibold text-slate-900 shadow-sm" : "text-slate-500"
                  }`}
                >
                  {step > index ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <CircleDot className="h-4 w-4" />}
                  <span>{title}</span>
                </li>
              ))}
            </ol>
          </aside>

          <div className="min-h-0 overflow-y-auto overscroll-contain p-6 md:p-8">
            {step === 0 ? (
              <div className="space-y-6">
                <DialogHeader>
                  <DialogTitle className="text-3xl">Connect to begin</DialogTitle>
                  <DialogDescription className="text-base">
                    Connect your preferred signer. We use this to deploy and control your Safe smart account.
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-3 sm:grid-cols-3">
                  {connectorOptions.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setConnector(option.id)}
                      className={`rounded-2xl border p-4 text-left transition ${
                        connector === option.id ? "border-primary bg-blue-50" : "border-border/80 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <option.icon className="mb-3 h-5 w-5 text-primary" />
                      <p className="text-sm font-semibold text-slate-900">{option.label}</p>
                      <p className="mt-1 text-xs text-slate-500">{option.description}</p>
                    </button>
                  ))}
                </div>

                <Card className="bg-white/95">
                  <CardContent className="p-5">
                    {!walletAddress ? (
                      <Button onClick={handleConnect} disabled={connecting}>
                        {connecting ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Connecting
                          </>
                        ) : (
                          <>
                            <Wallet className="h-4 w-4" />
                            Connect {connectorOptions.find((item) => item.id === connector)?.label}
                          </>
                        )}
                      </Button>
                    ) : (
                      <div className="space-y-2">
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700">
                          Connected
                        </Badge>
                        <p className="font-mono text-xs text-slate-700">{walletAddress}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {flowError ? <p className="text-sm text-rose-600">{flowError}</p> : null}
              </div>
            ) : null}

            {step === 1 ? (
              <div className="space-y-6">
                <DialogHeader>
                  <DialogTitle className="text-3xl">Account setup</DialogTitle>
                  <DialogDescription className="text-base">
                    Choose how your account should operate from day one.
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-3 md:grid-cols-2">
                  {accountTypes.map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setAccountType(type.id)}
                      className={`rounded-2xl border p-4 text-left transition ${
                        accountType === type.id ? "border-primary bg-blue-50" : "border-border/80 bg-white hover:bg-slate-50"
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
                    <p className="text-sm text-slate-600">Create dedicated buckets with their own spending limits.</p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid gap-3 sm:grid-cols-[1fr_140px_auto]">
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
                        <div key={item.id} className="flex items-center justify-between rounded-xl border border-border/70 bg-slate-50 px-3 py-2">
                          <div>
                            <p className="text-sm font-medium text-slate-800">{item.name}</p>
                            <p className="text-xs text-slate-500">Limit {baseCurrency} {item.spendingLimit}</p>
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

            {step === 2 ? (
              <div className="space-y-6">
                <DialogHeader>
                  <DialogTitle className="text-3xl">Account features</DialogTitle>
                  <DialogDescription className="text-base">
                    Turn on the features you want in your account. We handle the technical setup behind the scenes.
                  </DialogDescription>
                </DialogHeader>

                <Card className="bg-white/95">
                  <CardHeader>
                    <CardTitle className="text-lg">How features are enabled</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-slate-600">
                    <p>
                      Every feature below maps to audited modules. We install and configure them automatically during deployment.
                    </p>
                    <ul className="space-y-1">
                      <li>
                        <span className="font-semibold text-slate-800">Gnosis Guild:</span> delay, roles, allowance, recovery
                      </li>
                      <li>
                        <span className="font-semibold text-slate-800">Rhinestone:</span> session access, spending policies, automations
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                <div className="grid gap-4 lg:grid-cols-2">
                  <Card className="bg-white/95">
                    <CardHeader>
                      <CardTitle className="text-lg">Safety and control features</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <ToggleRow
                        label="Approval delay for sensitive changes"
                        description="Adds a protected waiting period for owner and policy updates"
                        enabled={modules.guildDelay}
                        onChange={(value) => setModules((prev) => ({ ...prev, guildDelay: value }))}
                      />
                      <ToggleRow
                        label="Team roles and approval routing"
                        description="Define who can initiate, approve, and execute different actions"
                        enabled={modules.guildRoles}
                        onChange={(value) => setModules((prev) => ({ ...prev, guildRoles: value }))}
                      />
                      <ToggleRow
                        label="Recurring budgets and spending caps"
                        description="Set monthly limits for cards, recipients, or shared budgets"
                        enabled={modules.guildAllowance}
                        onChange={(value) => setModules((prev) => ({ ...prev, guildAllowance: value }))}
                      />
                      <ToggleRow
                        label="Trusted recovery contacts"
                        description="Restore access with guardians and a clear recovery timeline"
                        enabled={modules.guildRecovery}
                        onChange={(value) => setModules((prev) => ({ ...prev, guildRecovery: value }))}
                      />
                    </CardContent>
                  </Card>

                  <Card className="bg-white/95">
                    <CardHeader>
                      <CardTitle className="text-lg">Speed and automation features</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <ToggleRow
                        label="Fast trusted sessions"
                        description="Approve frequent actions faster without removing account limits"
                        enabled={modules.rhinestoneSessions}
                        onChange={(value) => setModules((prev) => ({ ...prev, rhinestoneSessions: value }))}
                      />
                      <ToggleRow
                        label="Smart spending rules"
                        description="Control recipients, categories, and transfer sizes in real time"
                        enabled={modules.rhinestoneSpendingPolicy}
                        onChange={(value) => setModules((prev) => ({ ...prev, rhinestoneSpendingPolicy: value }))}
                      />
                      <ToggleRow
                        label="Scheduled money automations"
                        description="Automate recurring actions like top-ups, sweeps, and guardrail checks"
                        enabled={modules.rhinestoneAutomation}
                        onChange={(value) => setModules((prev) => ({ ...prev, rhinestoneAutomation: value }))}
                      />
                    </CardContent>
                  </Card>
                </div>

                <Card className="bg-white/95">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Clock3 className="h-4 w-4 text-primary" />
                      Transfer hold window
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-slate-600">
                      Add a delay to high-value transfers so you have time to review and cancel if needed.
                    </p>
                    <input
                      type="range"
                      min={0}
                      max={72}
                      step={1}
                      value={modules.timeLockHours}
                      onChange={(event) =>
                        setModules((prev) => ({
                          ...prev,
                          timeLockHours: Number(event.target.value)
                        }))
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

            {step === 3 ? (
              <div className="space-y-6">
                <DialogHeader>
                  <DialogTitle className="text-3xl">Review and deploy</DialogTitle>
                  <DialogDescription className="text-base">
                    This deploys your account and enables the features selected in setup.
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 lg:grid-cols-2">
                  <Card className="bg-white/95">
                    <CardHeader>
                      <CardTitle className="text-lg">Account summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-slate-700">
                      <p><span className="font-semibold">Connected signer:</span> {walletAddress.slice(0, 10)}...{walletAddress.slice(-6)}</p>
                      <p><span className="font-semibold">Account type:</span> {accountType}</p>
                      <p><span className="font-semibold">Account name:</span> {accountName}</p>
                      <p><span className="font-semibold">Base currency:</span> {baseCurrency}</p>
                      <p><span className="font-semibold">Sub-accounts:</span> {subAccounts.length}</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/95">
                    <CardHeader>
                      <CardTitle className="text-lg">Feature summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-slate-700">
                      <p className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-primary" />
                        Safety features: {modules.guildDelay || modules.guildRoles || modules.guildAllowance || modules.guildRecovery ? "Enabled" : "Off"}
                      </p>
                      <p className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        Speed features: {modules.rhinestoneSessions || modules.rhinestoneSpendingPolicy || modules.rhinestoneAutomation ? "Enabled" : "Off"}
                      </p>
                      <p className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-primary" />Transfer hold: {modules.timeLockHours} hours</p>
                      <p className="text-xs text-slate-500">
                        Under the hood providers: Gnosis Guild + Rhinestone
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <Button onClick={handleDeploy} disabled={deploying}>
                  {deploying ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Deploying smart account
                    </>
                  ) : (
                    <>
                      Deploy account
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>

                {flowError ? <p className="text-sm text-rose-600">{flowError}</p> : null}
              </div>
            ) : null}

            {step === 4 ? (
              <div className="space-y-6">
                <DialogHeader>
                  <DialogTitle className="text-3xl">Account deployed</DialogTitle>
                  <DialogDescription className="text-base">
                    Your account is live with your selected safety, speed, and automation features.
                  </DialogDescription>
                </DialogHeader>

                <Card className="bg-white/95">
                  <CardContent className="space-y-3 p-5">
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700">
                      Deployment complete
                    </Badge>
                    <div className="space-y-2 text-sm">
                      <p className="font-medium text-slate-900">Safe account</p>
                      <div className="flex flex-wrap items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 font-mono text-xs text-slate-700">
                        <span>{safeAddress}</span>
                        <Button type="button" variant="ghost" size="sm" className="h-7 px-2" onClick={copySafeAddress}>
                          <Copy className="h-3.5 w-3.5" />
                          {copied ? "Copied" : "Copy"}
                        </Button>
                      </div>
                      <p className="text-xs text-slate-500">Deploy tx: {deploymentTx.slice(0, 14)}...{deploymentTx.slice(-10)}</p>
                      <p className="text-xs text-slate-500">Feature setup tx: {moduleTx.slice(0, 14)}...{moduleTx.slice(-10)}</p>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Card className="bg-white/95">
                    <CardHeader>
                      <CardTitle className="text-lg">Enabled features</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 text-sm text-slate-700">
                        <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" />Time locked admin actions</li>
                        <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" />Policy based spending limits</li>
                        <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" />Sub-account controls</li>
                        <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" />Session based fast approvals</li>
                      </ul>
                    </CardContent>
                  </Card>
                  <Card className="bg-white/95">
                    <CardHeader>
                      <CardTitle className="text-lg">Next actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 text-sm text-slate-700">
                        <li>Issue virtual card</li>
                        <li>Request IBAN rails</li>
                        <li>Add team members</li>
                        <li>Set transfer allowlists</li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button asChild>
                    <Link href="/dashboard" onClick={() => onOpenChange(false)}>
                      Open dashboard
                    </Link>
                  </Button>
                  <Button variant="outline" onClick={resetFlow}>Start another setup</Button>
                </div>
              </div>
            ) : null}

            {step < 4 ? (
              <div className="mt-8 flex items-center justify-between border-t border-border/70 pt-4">
                <Button variant="ghost" onClick={goBack} disabled={step === 0 || deploying}>
                  Back
                </Button>
                {step < 3 ? (
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
