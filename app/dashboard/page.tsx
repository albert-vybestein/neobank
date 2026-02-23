"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  Bot,
  CandlestickChart,
  Gauge,
  Landmark,
  LayoutDashboard,
  ListChecks,
  LogOut,
  MapPin,
  Repeat,
  Settings,
  ShieldCheck,
  Sparkles,
  TimerReset,
  TrendingUp,
  Wallet
} from "lucide-react";

import { SignInButton } from "@/components/SignInButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import dashboardSeed from "@/data/dashboard.json";
import { trackEvent } from "@/lib/analytics";
import { formatCurrency, projectSavings } from "@/lib/dashboard/math";
import { getJson, postJson } from "@/lib/http-client";
import { getAuthSession, logoutAuthSession } from "@/lib/safe";
import type { DashboardData, Market, PredictionEvent, RiskProfile } from "@/lib/types/dashboard";

type DashboardResponse = {
  authenticated: boolean;
  safeAddress: string;
  walletAddress: string;
  data: DashboardData;
  fetchedAt: string;
};

type WorkspaceSection =
  | "overview"
  | "accounts"
  | "ibans"
  | "advisor"
  | "markets"
  | "predictions"
  | "products"
  | "settings";

type TradeSide = "Long" | "Short";

type VirtualIban = {
  id: string;
  label: string;
  currency: string;
  region: string;
  iban: string;
  balance: number;
  status: "Active" | "Pending";
};

type ConsumerProductId =
  | "income-vault"
  | "goal-lock-pot"
  | "family-shared-wallet"
  | "subscription-guardian"
  | "travel-mode-wallet"
  | "market-guard-account"
  | "salary-stream-split"
  | "teen-spend-card"
  | "bill-autopilot"
  | "emergency-lock"
  | "round-up-saver";

type ConsumerProduct = {
  id: ConsumerProductId;
  name: string;
  category:
    | "Cash growth"
    | "Savings"
    | "Family"
    | "Spending control"
    | "Travel"
    | "Investing"
    | "Income automation"
    | "Youth banking";
  summary: string;
  customerValue: string;
  controlBehavior: string;
  moduleMapping: string;
  defaultEnabled: boolean;
  status: "Live" | "Pilot" | "Coming soon";
};

type AccountFeatureState = {
  transferReviewDelay: boolean;
  transferReviewDelayHours: number;
  transferReviewThreshold: number;
  recipientAllowlists: boolean;
  sharedApprovalRoles: boolean;
  sharedApprovalsRequired: number;
  trustedSessions: boolean;
  trustedSessionLimit: number;
  trustedSessionHours: number;
  recoveryProtection: boolean;
  recoveryGuardians: number;
  recoveryDelayHours: number;
  automationRules: boolean;
  autoSweepPercent: number;
  autoSweepDay: "Monday" | "Wednesday" | "Friday" | "Sunday";
  subscriptionCaps: boolean;
  subscriptionMonthlyCap: number;
  marketRiskLimits: boolean;
  marketMaxLeverage: number;
  marketDailyLossLimit: number;
};

type FeaturePresetId = "balanced" | "travel" | "family" | "treasury";

const defaultDashboardData: DashboardData = dashboardSeed as DashboardData;

const defaultAccountFeatures: AccountFeatureState = {
  transferReviewDelay: true,
  transferReviewDelayHours: 24,
  transferReviewThreshold: 2500,
  recipientAllowlists: true,
  sharedApprovalRoles: true,
  sharedApprovalsRequired: 2,
  trustedSessions: true,
  trustedSessionLimit: 1200,
  trustedSessionHours: 8,
  recoveryProtection: true,
  recoveryGuardians: 3,
  recoveryDelayHours: 48,
  automationRules: true,
  autoSweepPercent: 20,
  autoSweepDay: "Friday",
  subscriptionCaps: true,
  subscriptionMonthlyCap: 600,
  marketRiskLimits: true,
  marketMaxLeverage: 5,
  marketDailyLossLimit: 1500
};

const featurePresetConfig: Array<{
  id: FeaturePresetId;
  label: string;
  description: string;
  apply: (current: AccountFeatureState) => AccountFeatureState;
}> = [
  {
    id: "balanced",
    label: "Balanced",
    description: "Default for everyday use with moderate controls.",
    apply: (current) => ({
      ...current,
      subscriptionCaps: true,
      marketRiskLimits: true,
      automationRules: true,
      trustedSessions: true,
      transferReviewDelay: true,
      transferReviewDelayHours: 24,
      transferReviewThreshold: 2500,
      sharedApprovalsRequired: 2,
      trustedSessionLimit: 1200,
      trustedSessionHours: 8,
      recoveryGuardians: 3,
      recoveryDelayHours: 48,
      autoSweepPercent: 20,
      subscriptionMonthlyCap: 600,
      marketMaxLeverage: 5,
      marketDailyLossLimit: 1500
    })
  },
  {
    id: "travel",
    label: "Travel mode",
    description: "Faster approvals and higher flexible spending while away.",
    apply: (current) => ({
      ...current,
      subscriptionCaps: true,
      marketRiskLimits: true,
      automationRules: true,
      trustedSessions: true,
      transferReviewDelay: true,
      transferReviewDelayHours: 8,
      transferReviewThreshold: 4500,
      trustedSessionLimit: 2200,
      trustedSessionHours: 18,
      sharedApprovalsRequired: 1,
      autoSweepPercent: 10,
      marketMaxLeverage: 4,
      marketDailyLossLimit: 1800
    })
  },
  {
    id: "family",
    label: "Family mode",
    description: "Stricter approvals and stronger shared protections.",
    apply: (current) => ({
      ...current,
      subscriptionCaps: true,
      marketRiskLimits: true,
      automationRules: true,
      trustedSessions: true,
      transferReviewDelay: true,
      transferReviewDelayHours: 36,
      transferReviewThreshold: 1500,
      sharedApprovalRoles: true,
      sharedApprovalsRequired: 2,
      trustedSessionLimit: 700,
      trustedSessionHours: 6,
      recoveryGuardians: 4,
      recoveryDelayHours: 72,
      subscriptionMonthlyCap: 450,
      marketMaxLeverage: 3,
      marketDailyLossLimit: 1000
    })
  },
  {
    id: "treasury",
    label: "Treasury mode",
    description: "Highest control setting for larger balances and teams.",
    apply: (current) => ({
      ...current,
      subscriptionCaps: true,
      marketRiskLimits: true,
      automationRules: true,
      transferReviewDelay: true,
      transferReviewDelayHours: 48,
      transferReviewThreshold: 1000,
      sharedApprovalRoles: true,
      sharedApprovalsRequired: 3,
      trustedSessions: false,
      trustedSessionLimit: 500,
      trustedSessionHours: 4,
      recoveryGuardians: 5,
      recoveryDelayHours: 72,
      autoSweepPercent: 35,
      subscriptionMonthlyCap: 300,
      marketMaxLeverage: 2,
      marketDailyLossLimit: 850
    })
  }
];

const navItems: Array<{ id: WorkspaceSection; label: string; icon: typeof LayoutDashboard }> = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "accounts", label: "Accounts", icon: Wallet },
  { id: "ibans", label: "Virtual IBANs", icon: Landmark },
  { id: "advisor", label: "Robo advisor", icon: Bot },
  { id: "markets", label: "Markets", icon: CandlestickChart },
  { id: "predictions", label: "Predictions", icon: TrendingUp },
  { id: "products", label: "Products", icon: Sparkles },
  { id: "settings", label: "Settings", icon: Settings }
];

const consumerProducts: ConsumerProduct[] = [
  {
    id: "income-vault",
    name: "Income Vault",
    category: "Cash growth",
    summary: "Automatically moves idle cash into curated low-volatility yield vaults.",
    customerValue: "Grow everyday balances without managing protocols manually.",
    controlBehavior: "Enables scheduled sweeps with conservative destination allowlists.",
    moduleMapping: "Rhinestone Automation + Gnosis Guild Allowance",
    defaultEnabled: true,
    status: "Live"
  },
  {
    id: "goal-lock-pot",
    name: "Goal Lock Pot",
    category: "Savings",
    summary: "Creates goal-based savings pots with optional unlock delays.",
    customerValue: "Protect savings from impulse spending and hit targets faster.",
    controlBehavior: "Adds delayed withdrawals and high-value review windows.",
    moduleMapping: "Gnosis Guild Delay + Safe smart account policies",
    defaultEnabled: true,
    status: "Live"
  },
  {
    id: "family-shared-wallet",
    name: "Family Shared Wallet",
    category: "Family",
    summary: "Shared spending account with role-based limits and approvals.",
    customerValue: "Run household money safely across partners and dependents.",
    controlBehavior: "Requires multi-approval for key actions and member-level limits.",
    moduleMapping: "Gnosis Guild Roles + Allowance",
    defaultEnabled: true,
    status: "Live"
  },
  {
    id: "subscription-guardian",
    name: "Subscription Guardian",
    category: "Spending control",
    summary: "Caps recurring debits and lets users pause merchants in one tap.",
    customerValue: "Avoid billing leakage and recurring charge surprises.",
    controlBehavior: "Applies recurring charge caps with merchant-level stop controls.",
    moduleMapping: "Gnosis Guild Allowance + Rhinestone policy controls",
    defaultEnabled: true,
    status: "Live"
  },
  {
    id: "travel-mode-wallet",
    name: "Travel Mode Wallet",
    category: "Travel",
    summary: "Temporary higher card/session limits with automatic reversion windows.",
    customerValue: "Spend smoothly while traveling without sacrificing safety.",
    controlBehavior: "Temporarily increases session limits and auto-reverts after travel.",
    moduleMapping: "Rhinestone Session Keys + Gnosis Guild Delay",
    defaultEnabled: false,
    status: "Pilot"
  },
  {
    id: "market-guard-account",
    name: "Market Guard Account",
    category: "Investing",
    summary: "Risk-scoped investing account with leverage and loss guardrails.",
    customerValue: "Access market products with built-in downside controls.",
    controlBehavior: "Adds leverage caps and daily loss guardrails before execution.",
    moduleMapping: "Rhinestone policy module + Safe guard rules",
    defaultEnabled: true,
    status: "Live"
  },
  {
    id: "salary-stream-split",
    name: "Salary Stream Split",
    category: "Income automation",
    summary: "Automatically divides inbound salary into bills, savings, and investing buckets.",
    customerValue: "Run your monthly plan on autopilot from first deposit.",
    controlBehavior: "Sets recurring split rules and destination allowlists.",
    moduleMapping: "Rhinestone Automation + Gnosis Guild Allowance",
    defaultEnabled: false,
    status: "Pilot"
  },
  {
    id: "teen-spend-card",
    name: "Teen Spend Card",
    category: "Youth banking",
    summary: "Sub-account card with category limits and parent approvals.",
    customerValue: "Teach healthy money habits with safety rails by default.",
    controlBehavior: "Enforces shared approvals, category controls, and strict allowlists.",
    moduleMapping: "Gnosis Guild Roles + Rhinestone Policy",
    defaultEnabled: false,
    status: "Coming soon"
  },
  {
    id: "bill-autopilot",
    name: "Bill Autopilot",
    category: "Spending control",
    summary: "Pays verified recurring bills automatically with fail-safe caps.",
    customerValue: "Never miss essentials while keeping bill spend in bounds.",
    controlBehavior: "Automates approved recipients and pauses over-cap payments.",
    moduleMapping: "Rhinestone Automation + Gnosis Guild Allowance",
    defaultEnabled: true,
    status: "Live"
  },
  {
    id: "emergency-lock",
    name: "Emergency Lock",
    category: "Family",
    summary: "Instantly tighten account permissions during suspicious activity.",
    customerValue: "Buy time to review without freezing all daily money movement.",
    controlBehavior: "Disables trusted sessions and increases recovery and review delay.",
    moduleMapping: "Gnosis Guild Delay + Recovery + Rhinestone Sessions",
    defaultEnabled: false,
    status: "Live"
  },
  {
    id: "round-up-saver",
    name: "Round-up Saver",
    category: "Savings",
    summary: "Rounds card purchases and sends spare change into a savings pot.",
    customerValue: "Build savings quietly with everyday spending.",
    controlBehavior: "Triggers small automatic sweeps into protected savings buckets.",
    moduleMapping: "Rhinestone Automation + Safe smart account policies",
    defaultEnabled: true,
    status: "Live"
  }
];

function Sparkline({ data, color = "#2563eb" }: { data: number[]; color?: string }) {
  const width = 620;
  const height = 220;
  const padding = 18;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const yRange = max - min || 1;

  const points = data
    .map((value, index) => {
      const x = padding + (index / (data.length - 1)) * (width - padding * 2);
      const y = height - padding - ((value - min) / yRange) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-44 w-full" aria-hidden="true">
      <defs>
        <linearGradient id="workspaceSparkGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline points={points} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />
      <polyline
        points={`${points} ${width - padding},${height - padding} ${padding},${height - padding}`}
        fill="url(#workspaceSparkGradient)"
        stroke="none"
      />
    </svg>
  );
}

function generateVirtualIban(currency: string, region: string) {
  const prefix = region.toUpperCase().slice(0, 2);
  const checksum = Math.floor(Math.random() * 90 + 10);
  const part1 = Math.floor(Math.random() * 9000 + 1000);
  const part2 = Math.floor(Math.random() * 9000 + 1000);
  const part3 = Math.floor(Math.random() * 9000 + 1000);
  const part4 = Math.floor(Math.random() * 9000 + 1000);
  return `${prefix}${checksum} NB${currency.slice(0, 1)} ${part1} ${part2} ${part3} ${part4}`;
}

export default function DashboardPage() {
  const [authLoading, setAuthLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [sessionWallet, setSessionWallet] = useState("");
  const [sessionSafe, setSessionSafe] = useState("");

  const [dashboardData, setDashboardData] = useState<DashboardData>(defaultDashboardData);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState("");

  const [activeSection, setActiveSection] = useState<WorkspaceSection>("overview");

  const [weeklyContribution, setWeeklyContribution] = useState(200);
  const [growthYears, setGrowthYears] = useState(5);
  const [expectedYield, setExpectedYield] = useState(8);

  const [riskProfile, setRiskProfile] = useState<RiskProfile>("balanced");
  const [advisorBudget, setAdvisorBudget] = useState(2200);
  const [advisorEnabled, setAdvisorEnabled] = useState(false);
  const [advisorMessage, setAdvisorMessage] = useState("");

  const [selectedMarket, setSelectedMarket] = useState<Market>(defaultDashboardData.perpsMarkets[0]);
  const [tradeSide, setTradeSide] = useState<TradeSide>("Long");
  const [tradeSize, setTradeSize] = useState(2500);
  const [leverage, setLeverage] = useState(3);
  const [tradeStatus, setTradeStatus] = useState<{ state: "idle" | "loading" | "success" | "error"; message: string }>({
    state: "idle",
    message: ""
  });

  const [predictionSubmitting, setPredictionSubmitting] = useState<string | null>(null);
  const [predictionStatus, setPredictionStatus] = useState("");

  const [virtualIbans, setVirtualIbans] = useState<VirtualIban[]>([
    {
      id: "iban-eur-main",
      label: "Main EUR",
      currency: "EUR",
      region: "DE",
      iban: "DE42 NB1 1842 9301 5521 0440",
      balance: 14220,
      status: "Active"
    },
    {
      id: "iban-usd-us",
      label: "USD Ops",
      currency: "USD",
      region: "US",
      iban: "US87 NB2 6509 1208 4599 7012",
      balance: 8300,
      status: "Active"
    },
    {
      id: "iban-gbp-uk",
      label: "GBP Payroll",
      currency: "GBP",
      region: "GB",
      iban: "GB64 NB3 4420 1829 7371 6605",
      balance: 5400,
      status: "Pending"
    }
  ]);
  const [newIbanLabel, setNewIbanLabel] = useState("New global account");
  const [newIbanCurrency, setNewIbanCurrency] = useState("USD");
  const [newIbanRegion, setNewIbanRegion] = useState("US");
  const [ibanStatus, setIbanStatus] = useState("");

  const [productEnrollment, setProductEnrollment] = useState<Record<ConsumerProductId, boolean>>(
    () =>
      Object.fromEntries(
        consumerProducts.map((product) => [product.id, product.defaultEnabled])
      ) as Record<ConsumerProductId, boolean>
  );
  const [productMessage, setProductMessage] = useState("");
  const [accountFeatures, setAccountFeatures] = useState<AccountFeatureState>(defaultAccountFeatures);
  const [selectedFeaturePreset, setSelectedFeaturePreset] = useState<FeaturePresetId>("balanced");
  const [settingsMessage, setSettingsMessage] = useState("");

  const { portfolioCurve, spendByCategory, protocolCatalog, perpsMarkets, predictionEvents } = dashboardData;

  useEffect(() => {
    let active = true;

    const loadDashboard = async () => {
      try {
        const session = await getAuthSession();
        if (!active) return;

        if (!session.authenticated || !session.walletAddress || !session.safeAddress) {
          setAuthenticated(false);
          setDashboardLoading(false);
          setAuthLoading(false);
          return;
        }

        setAuthenticated(true);
        setSessionWallet(session.walletAddress);
        setSessionSafe(session.safeAddress);
        setAuthLoading(false);

        const response = await getJson<DashboardResponse>("/api/dashboard");
        if (!active) return;

        setDashboardData(response.data);
        setDashboardError("");
        setSelectedMarket((current) => response.data.perpsMarkets.find((entry) => entry.symbol === current.symbol) ?? response.data.perpsMarkets[0]);
      } catch (error) {
        if (!active) return;
        setAuthLoading(false);
        setDashboardError(error instanceof Error ? error.message : "Could not refresh workspace data.");
      } finally {
        if (active) setDashboardLoading(false);
      }
    };

    void loadDashboard();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!perpsMarkets.length) return;
    if (!perpsMarkets.some((market) => market.symbol === selectedMarket.symbol)) {
      setSelectedMarket(perpsMarkets[0]);
    }
  }, [perpsMarkets, selectedMarket.symbol]);

  const monthlyIncome = 9200;
  const monthlySpend = spendByCategory.reduce((total, category) => total + category.spent, 0);
  const monthlySavings = monthlyIncome - monthlySpend;
  const savingsRate = Math.round((monthlySavings / monthlyIncome) * 100);

  const savingsProjection = projectSavings(weeklyContribution, growthYears, expectedYield);
  const principalOnly = weeklyContribution * 52 * growthYears;
  const projectedGrowth = savingsProjection - principalOnly;

  const yearlyCurve = useMemo(
    () => Array.from({ length: growthYears + 1 }, (_, index) => Number(projectSavings(weeklyContribution, index, expectedYield).toFixed(0))),
    [expectedYield, growthYears, weeklyContribution]
  );

  const recommendations = useMemo(
    () =>
      protocolCatalog
        .filter((protocol) => protocol.profiles.includes(riskProfile))
        .sort((a, b) => b.rewardScore - a.rewardScore)
        .slice(0, 4),
    [protocolCatalog, riskProfile]
  );

  const recommendationScore = recommendations.reduce((total, protocol) => total + protocol.rewardScore, 0);

  const totalCashBalance = virtualIbans.reduce((total, account) => total + account.balance, 0);
  const totalPortfolioEstimate = 184_200;
  const notionalExposure = tradeSize * leverage;
  const estimatedMargin = tradeSize / Math.max(leverage, 1);
  const tradeStressLossEstimate = Math.round(notionalExposure * 0.08);
  const tradeWithinFeaturePolicy =
    !accountFeatures.marketRiskLimits ||
    (leverage <= accountFeatures.marketMaxLeverage &&
      tradeStressLossEstimate <= accountFeatures.marketDailyLossLimit);
  const activatableProducts = consumerProducts.filter((product) => product.status !== "Coming soon");
  const enabledProductCount = activatableProducts.filter((product) => productEnrollment[product.id]).length;
  const simulatedTransferAmount = 3200;
  const transferRequiresReview =
    accountFeatures.transferReviewDelay && simulatedTransferAmount >= accountFeatures.transferReviewThreshold;
  const simulatedSubscriptionSpend = 540;
  const subscriptionWithinCap =
    !accountFeatures.subscriptionCaps || simulatedSubscriptionSpend <= accountFeatures.subscriptionMonthlyCap;
  const featureRuntimeRows = useMemo(
    () => [
      {
        feature: "Transfer review delay",
        owner: "Gnosis Guild Delay module",
        behavior: accountFeatures.transferReviewDelay
          ? `${accountFeatures.transferReviewDelayHours}h delay above ${formatCurrency(accountFeatures.transferReviewThreshold)}`
          : "Disabled"
      },
      {
        feature: "Shared approvals and roles",
        owner: "Gnosis Guild Roles module",
        behavior: accountFeatures.sharedApprovalRoles
          ? `${accountFeatures.sharedApprovalsRequired} approval(s) required`
          : "Single approval mode"
      },
      {
        feature: "Recipient allowlists",
        owner: "Gnosis Guild Allowance module",
        behavior: accountFeatures.recipientAllowlists ? "Only approved recipients and categories" : "Open recipients"
      },
      {
        feature: "Trusted daily sessions",
        owner: "Rhinestone Session Keys",
        behavior: accountFeatures.trustedSessions
          ? `${formatCurrency(accountFeatures.trustedSessionLimit)} for ${accountFeatures.trustedSessionHours}h`
          : "Disabled"
      },
      {
        feature: "Recovery protection",
        owner: "Gnosis Guild Recovery module",
        behavior: accountFeatures.recoveryProtection
          ? `${accountFeatures.recoveryGuardians} guardian(s), ${accountFeatures.recoveryDelayHours}h delay`
          : "Disabled"
      },
      {
        feature: "Automations and sweeps",
        owner: "Rhinestone Automation module",
        behavior: accountFeatures.automationRules
          ? `${accountFeatures.autoSweepPercent}% sweep on ${accountFeatures.autoSweepDay}`
          : "Manual mode"
      },
      {
        feature: "Subscription caps",
        owner: "Gnosis Guild Allowance module",
        behavior: accountFeatures.subscriptionCaps
          ? `Recurring cap ${formatCurrency(accountFeatures.subscriptionMonthlyCap)} monthly`
          : "Disabled"
      },
      {
        feature: "Market risk limits",
        owner: "Rhinestone Policy module",
        behavior: accountFeatures.marketRiskLimits
          ? `Max ${accountFeatures.marketMaxLeverage}x, daily stress loss ${formatCurrency(accountFeatures.marketDailyLossLimit)}`
          : "Disabled"
      }
    ],
    [accountFeatures]
  );

  const handleLogout = async () => {
    await logoutAuthSession();
    setAuthenticated(false);
    setSessionSafe("");
    setSessionWallet("");
  };

  const handleActivateAdvisor = () => {
    if (!advisorEnabled && !accountFeatures.automationRules) {
      setAdvisorMessage("Enable automation rules in Account settings before activating robo advisor autopilot.");
      return;
    }

    setAdvisorEnabled((current) => !current);
    setAdvisorMessage(
      advisorEnabled
        ? "Robo advisor paused. Funds stay in current allocations."
        : "Robo advisor activated. New allocations will follow your risk profile and budget."
    );
    void trackEvent("advisor_toggle", { enabled: !advisorEnabled, profile: riskProfile, budget: advisorBudget });
  };

  const handlePlaceOrder = async () => {
    if (!tradeWithinFeaturePolicy) {
      setTradeStatus({
        state: "error",
        message: `Order blocked by account feature policy. Max leverage is ${accountFeatures.marketMaxLeverage}x and daily stress loss limit is ${formatCurrency(accountFeatures.marketDailyLossLimit)}.`
      });
      return;
    }

    setTradeStatus({ state: "loading", message: "" });
    try {
      const payload = {
        market: selectedMarket.symbol,
        side: tradeSide,
        size: tradeSize,
        leverage
      };
      const response = await postJson<typeof payload, { id: string }>("/api/trading/orders", payload);
      setTradeStatus({ state: "success", message: `Order accepted. Ticket ${response.id.slice(-8)} created.` });
      void trackEvent("trade_order_submitted", payload);
    } catch (error) {
      setTradeStatus({
        state: "error",
        message: error instanceof Error ? error.message : "Could not place order."
      });
    }
  };

  const handlePredictionOrder = async (event: PredictionEvent, side: "yes" | "no") => {
    const key = `${event.title}:${side}`;
    setPredictionSubmitting(key);
    setPredictionStatus("");

    try {
      const payload = {
        eventTitle: event.title,
        side,
        stake: 100
      };
      const response = await postJson<typeof payload, { id: string }>("/api/predictions/orders", payload);
      setPredictionStatus(`Order submitted (${response.id.slice(-8)}).`);
      void trackEvent("prediction_order_submitted", payload);
    } catch (error) {
      setPredictionStatus(error instanceof Error ? error.message : "Could not submit order.");
    } finally {
      setPredictionSubmitting(null);
    }
  };

  const applyFeaturePreset = (presetId: FeaturePresetId) => {
    const preset = featurePresetConfig.find((entry) => entry.id === presetId);
    if (!preset) return;

    setSelectedFeaturePreset(presetId);
    setAccountFeatures((current) => preset.apply(current));
    setSettingsMessage(`Applied ${preset.label} preset. Review values and save when ready.`);
    trackEvent("feature_preset_applied", { presetId });
  };

  const saveFeatureSettings = () => {
    setSettingsMessage("Feature profile saved. New account behavior is active for future approvals.");
    trackEvent("feature_settings_saved", {
      preset: selectedFeaturePreset,
      transferReviewDelay: accountFeatures.transferReviewDelay,
      sharedApprovalRoles: accountFeatures.sharedApprovalRoles,
      trustedSessions: accountFeatures.trustedSessions,
      recoveryProtection: accountFeatures.recoveryProtection,
      automationRules: accountFeatures.automationRules,
      marketRiskLimits: accountFeatures.marketRiskLimits
    });
  };

  const toggleConsumerProduct = (productId: ConsumerProductId) => {
    const selectedProduct = consumerProducts.find((product) => product.id === productId);
    if (!selectedProduct) return;

    if (selectedProduct.status === "Coming soon") {
      setProductMessage(`${selectedProduct.name} is coming soon and not yet available in this workspace.`);
      void trackEvent("consumer_product_toggle_blocked", { productId, reason: "coming-soon" });
      return;
    }

    setProductEnrollment((current) => {
      const enabled = !current[productId];
      const next = { ...current, [productId]: enabled };

      if (enabled) {
        if (productId === "income-vault") {
          setAccountFeatures((featureState) => ({
            ...featureState,
            automationRules: true,
            autoSweepPercent: Math.max(featureState.autoSweepPercent, 20)
          }));
        }
        if (productId === "goal-lock-pot") {
          setAccountFeatures((featureState) => ({
            ...featureState,
            transferReviewDelay: true,
            transferReviewDelayHours: Math.max(featureState.transferReviewDelayHours, 24)
          }));
        }
        if (productId === "family-shared-wallet") {
          setAccountFeatures((featureState) => ({
            ...featureState,
            sharedApprovalRoles: true,
            sharedApprovalsRequired: Math.max(featureState.sharedApprovalsRequired, 2)
          }));
        }
        if (productId === "subscription-guardian") {
          setAccountFeatures((featureState) => ({
            ...featureState,
            subscriptionCaps: true
          }));
        }
        if (productId === "travel-mode-wallet") {
          setAccountFeatures((featureState) => ({
            ...featureState,
            trustedSessions: true,
            trustedSessionHours: Math.max(featureState.trustedSessionHours, 12),
            trustedSessionLimit: Math.max(featureState.trustedSessionLimit, 1800)
          }));
        }
        if (productId === "market-guard-account") {
          setAccountFeatures((featureState) => ({
            ...featureState,
            marketRiskLimits: true,
            marketMaxLeverage: Math.min(featureState.marketMaxLeverage, 5)
          }));
        }
        if (productId === "salary-stream-split") {
          setAccountFeatures((featureState) => ({
            ...featureState,
            automationRules: true,
            autoSweepPercent: Math.max(featureState.autoSweepPercent, 25),
            recipientAllowlists: true
          }));
        }
        if (productId === "teen-spend-card") {
          setAccountFeatures((featureState) => ({
            ...featureState,
            sharedApprovalRoles: true,
            sharedApprovalsRequired: Math.max(featureState.sharedApprovalsRequired, 2),
            recipientAllowlists: true,
            transferReviewDelay: true
          }));
        }
        if (productId === "bill-autopilot") {
          setAccountFeatures((featureState) => ({
            ...featureState,
            automationRules: true,
            subscriptionCaps: true,
            subscriptionMonthlyCap: Math.max(featureState.subscriptionMonthlyCap, 900)
          }));
        }
        if (productId === "emergency-lock") {
          setAccountFeatures((featureState) => ({
            ...featureState,
            transferReviewDelay: true,
            transferReviewDelayHours: Math.max(featureState.transferReviewDelayHours, 48),
            trustedSessions: false,
            recoveryProtection: true,
            recoveryDelayHours: Math.max(featureState.recoveryDelayHours, 48)
          }));
        }
        if (productId === "round-up-saver") {
          setAccountFeatures((featureState) => ({
            ...featureState,
            automationRules: true,
            autoSweepPercent: Math.max(featureState.autoSweepPercent, 12)
          }));
        }
      }

      setProductMessage(
        enabled
          ? "Product enabled. Account controls were aligned automatically."
          : "Product disabled. Existing controls were kept unchanged for safety."
      );
      trackEvent("consumer_product_toggled", { productId, enabled });
      return next;
    });
  };

  const handleCreateIban = () => {
    const label = newIbanLabel.trim();
    if (!label) {
      setIbanStatus("Please provide a label for the new IBAN account.");
      return;
    }

    const next: VirtualIban = {
      id: `iban-${Date.now()}`,
      label,
      currency: newIbanCurrency,
      region: newIbanRegion,
      iban: generateVirtualIban(newIbanCurrency, newIbanRegion),
      balance: 0,
      status: "Pending"
    };

    setVirtualIbans((current) => [next, ...current]);
    setIbanStatus(`Virtual ${newIbanCurrency} IBAN requested. Status: pending activation.`);
    void trackEvent("virtual_iban_requested", {
      currency: newIbanCurrency,
      region: newIbanRegion,
      label
    });
  };

  if (authLoading) {
    return (
      <div className="container pt-32">
        <Card className="mx-auto max-w-2xl bg-white/95">
          <CardContent className="p-10 text-center">
            <p className="text-base text-slate-600">Checking account session...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="container pt-28 pb-20">
        <Card className="mx-auto max-w-3xl bg-white/95">
          <CardHeader>
            <Badge variant="outline" className="w-fit bg-white text-slate-700">
              Dashboard access
            </Badge>
            <CardTitle className="text-4xl text-slate-950">Log in to open your banking workspace</CardTitle>
            <p className="text-base text-slate-600">
              Create your secure login, configure your account, and deploy once. Then manage everything from one workspace.
            </p>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <SignInButton journey="sign-in" size="lg">
              Log in
            </SignInButton>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="pb-16 pt-24">
      <section className="container">
        <div className="rounded-[2rem] border border-white/70 bg-[radial-gradient(circle_at_10%_0%,rgba(59,130,246,0.2),transparent_42%),radial-gradient(circle_at_100%_0%,rgba(6,182,212,0.14),transparent_36%),rgba(255,255,255,0.86)] p-6 shadow-soft md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="space-y-3">
              <Badge variant="outline" className="bg-white text-slate-700">
                Active customer workspace
              </Badge>
              <h1 className="headline-lg max-w-3xl">Your banking workspace</h1>
              <p className="body-lg max-w-3xl">
                This dashboard is scoped to your signed-in account. Balances, policies, virtual IBANs, and advisory actions are tied to this owner profile.
              </p>
              <p className="font-mono text-xs text-slate-500">
                Owner {sessionWallet.slice(0, 10)}...{sessionWallet.slice(-6)} · Safe {sessionSafe.slice(0, 10)}...{sessionSafe.slice(-6)}
              </p>
            </div>
            <div className="grid min-w-[240px] gap-3 sm:grid-cols-3">
              <Card className="bg-white/90">
                <CardContent className="p-4">
                  <p className="text-xs font-medium text-slate-500">Estimated net worth</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{formatCurrency(totalPortfolioEstimate)}</p>
                  <p className="mt-1 text-xs text-emerald-600">+5.4% this month</p>
                </CardContent>
              </Card>
              <Card className="bg-white/90">
                <CardContent className="p-4">
                  <p className="text-xs font-medium text-slate-500">Cash across IBANs</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{formatCurrency(totalCashBalance)}</p>
                  <p className="mt-1 text-xs text-slate-500">{virtualIbans.length} active accounts</p>
                </CardContent>
              </Card>
              <Card className="bg-white/90">
                <CardContent className="p-4">
                  <p className="text-xs font-medium text-slate-500">Active products</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{enabledProductCount}/{activatableProducts.length}</p>
                  <p className="mt-1 text-xs text-slate-500">Consumer financial products enabled</p>
                </CardContent>
              </Card>
            </div>
          </div>
          <div className="mt-4 flex min-h-6 items-center text-sm" aria-live="polite">
            {dashboardLoading ? <p className="text-slate-500">Refreshing workspace data...</p> : null}
            {!dashboardLoading && dashboardError ? <p className="text-amber-700">{dashboardError}</p> : null}
            {!dashboardLoading && !dashboardError ? <p className="text-emerald-700">Workspace data connected.</p> : null}
          </div>
        </div>
      </section>

      <section className="container mt-8">
        <div className="grid gap-6 lg:grid-cols-[250px_minmax(0,1fr)]">
          <aside className="h-fit rounded-3xl border border-border/70 bg-white/92 p-4 shadow-soft lg:sticky lg:top-24">
            <div className="rounded-2xl border border-border/70 bg-slate-50 p-3">
              <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Profile</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">Primary owner</p>
              <p className="mt-1 font-mono text-[11px] text-slate-500">{sessionWallet.slice(0, 8)}...{sessionWallet.slice(-6)}</p>
              <p className="mt-1 text-xs text-slate-500">Safe-backed account</p>
            </div>

            <nav aria-label="Dashboard sections" className="mt-4 space-y-2">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveSection(item.id)}
                  className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition ${
                    activeSection === item.id
                      ? "bg-blue-50 font-semibold text-slate-900"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>

            <Button variant="outline" size="sm" className="mt-4 w-full" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              Log out
            </Button>
          </aside>

          <main className="space-y-6">
            {activeSection === "overview" ? (
              <>
                <div className="grid gap-4 md:grid-cols-3">
                  <Card className="bg-white/92">
                    <CardContent className="p-4">
                      <p className="text-xs text-slate-500">Monthly income</p>
                      <p className="mt-2 text-2xl font-semibold text-slate-900">{formatCurrency(monthlyIncome)}</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-white/92">
                    <CardContent className="p-4">
                      <p className="text-xs text-slate-500">Monthly spend</p>
                      <p className="mt-2 text-2xl font-semibold text-slate-900">{formatCurrency(monthlySpend)}</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-white/92">
                    <CardContent className="p-4">
                      <p className="text-xs text-slate-500">Savings rate</p>
                      <p className="mt-2 text-2xl font-semibold text-emerald-600">{savingsRate}%</p>
                    </CardContent>
                  </Card>
                </div>

                <Card className="bg-white/92">
                  <CardHeader>
                    <CardTitle className="text-xl">Your product stack</CardTitle>
                    <p className="text-sm text-slate-600">
                      Consumer products powered by policy modules. Enable or tune them in Products and Settings.
                    </p>
                  </CardHeader>
                  <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {consumerProducts.map((product) => (
                      <div key={product.id} className="rounded-xl border border-border/70 bg-white p-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-slate-900">{product.name}</p>
                          <Badge
                            variant="outline"
                            className={
                              product.status === "Coming soon"
                                ? "bg-amber-50 text-amber-700"
                                : productEnrollment[product.id]
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-slate-100 text-slate-700"
                            }
                          >
                            {product.status === "Coming soon"
                              ? "Coming soon"
                              : productEnrollment[product.id]
                                ? "Enabled"
                                : "Disabled"}
                          </Badge>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">{product.category}</p>
                        <p className="mt-2 text-sm text-slate-700">{product.customerValue}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="bg-white/92">
                  <CardHeader>
                    <CardTitle className="text-2xl">Portfolio trend</CardTitle>
                    <p className="text-sm text-slate-600">Live movement across cash, advisor allocations, and active positions.</p>
                  </CardHeader>
                  <CardContent>
                    <Sparkline data={portfolioCurve} />
                  </CardContent>
                </Card>

                <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
                  <Card className="bg-white/92">
                    <CardHeader>
                      <CardTitle className="text-xl">Budget analysis</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {spendByCategory.map((category) => {
                        const usage = Math.min((category.spent / category.budget) * 100, 100);
                        const overBudget = category.spent > category.budget;
                        return (
                          <div key={category.label} className="rounded-xl bg-slate-50 p-3">
                            <div className="flex items-center justify-between text-sm">
                              <p className="font-medium text-slate-800">{category.label}</p>
                              <p className={`font-semibold ${overBudget ? "text-rose-600" : "text-slate-700"}`}>
                                {formatCurrency(category.spent)} / {formatCurrency(category.budget)}
                              </p>
                            </div>
                            <div className="mt-2 h-2 rounded-full bg-slate-200">
                              <div className={`h-2 rounded-full ${overBudget ? "bg-rose-500" : "bg-primary"}`} style={{ width: `${usage}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>

                  <Card className="bg-white/92">
                    <CardHeader>
                      <CardTitle className="text-xl">Savings projection</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Sparkline data={yearlyCurve} color="#0ea5e9" />
                      <div className="grid gap-3 text-sm">
                        <div className="space-y-2">
                          <label htmlFor="weekly-contribution" className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                            Weekly contribution
                          </label>
                          <input
                            id="weekly-contribution"
                            type="number"
                            min={50}
                            step={25}
                            value={weeklyContribution}
                            onChange={(event) => setWeeklyContribution(Number(event.target.value) || 0)}
                            className="h-10 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-2">
                            <label htmlFor="projection-years" className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                              Years
                            </label>
                            <input
                              id="projection-years"
                              type="number"
                              min={1}
                              max={30}
                              step={1}
                              value={growthYears}
                              onChange={(event) => setGrowthYears(Number(event.target.value) || 1)}
                              className="h-10 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                            />
                          </div>
                          <div className="space-y-2">
                            <label htmlFor="projection-yield" className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                              Yield %
                            </label>
                            <input
                              id="projection-yield"
                              type="number"
                              min={1}
                              max={30}
                              step={1}
                              value={expectedYield}
                              onChange={(event) => setExpectedYield(Number(event.target.value) || 1)}
                              className="h-10 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="grid gap-3 text-sm">
                        <div className="rounded-xl bg-slate-50 p-3">
                          <p className="text-slate-500">Projected value</p>
                          <p className="mt-1 text-xl font-semibold text-slate-900">{formatCurrency(savingsProjection)}</p>
                        </div>
                        <div className="rounded-xl bg-slate-50 p-3">
                          <p className="text-slate-500">Estimated growth</p>
                          <p className="mt-1 text-xl font-semibold text-emerald-600">{formatCurrency(projectedGrowth)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            ) : null}

            {activeSection === "accounts" ? (
              <>
                <Card className="bg-white/92">
                  <CardHeader>
                    <CardTitle className="text-2xl">Accounts and cards</CardTitle>
                    <p className="text-sm text-slate-600">Daily banking view with balances, limits, and recent activity.</p>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-3">
                    <Card className="bg-white">
                      <CardContent className="p-4">
                        <p className="text-xs text-slate-500">Main checking</p>
                        <p className="mt-2 text-xl font-semibold text-slate-900">{formatCurrency(18450)}</p>
                        <p className="mt-1 text-xs text-slate-500">Card ending 4321</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-white">
                      <CardContent className="p-4">
                        <p className="text-xs text-slate-500">Savings pot</p>
                        <p className="mt-2 text-xl font-semibold text-slate-900">{formatCurrency(42100)}</p>
                        <p className="mt-1 text-xs text-emerald-600">Auto-transfer enabled</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-white">
                      <CardContent className="p-4">
                        <p className="text-xs text-slate-500">Shared expenses</p>
                        <p className="mt-2 text-xl font-semibold text-slate-900">{formatCurrency(6800)}</p>
                        <p className="mt-1 text-xs text-slate-500">2 collaborators</p>
                      </CardContent>
                    </Card>
                  </CardContent>
                </Card>

                <Card className="bg-white/92">
                  <CardHeader>
                    <CardTitle className="text-xl">Recent activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Merchant</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Channel</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium">AeroRail</TableCell>
                          <TableCell>Transport</TableCell>
                          <TableCell>Card</TableCell>
                          <TableCell className="text-right">-€42.20</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">North Cafe</TableCell>
                          <TableCell>Food</TableCell>
                          <TableCell>Card</TableCell>
                          <TableCell className="text-right">-€18.50</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Payroll Ltd</TableCell>
                          <TableCell>Salary</TableCell>
                          <TableCell>Transfer</TableCell>
                          <TableCell className="text-right text-emerald-700">+$4,200.00</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </>
            ) : null}

            {activeSection === "ibans" ? (
              <>
                <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
                  <Card className="bg-white/92">
                    <CardHeader>
                      <CardTitle className="text-2xl">Global virtual IBAN network</CardTitle>
                      <p className="text-sm text-slate-600">Open local receiving accounts across currencies from one workspace.</p>
                    </CardHeader>
                    <CardContent>
                      <div className="relative h-56 overflow-hidden rounded-3xl border border-border/70 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.25),transparent_45%),radial-gradient(circle_at_80%_30%,rgba(6,182,212,0.2),transparent_45%),linear-gradient(145deg,#f8fafc,#e2e8f0)]">
                        <div className="absolute left-14 top-14 h-24 w-36 rounded-[44%] bg-white/80 blur-[1px]" />
                        <div className="absolute left-56 top-24 h-16 w-24 rounded-[42%] bg-white/75" />
                        <div className="absolute right-14 top-12 h-24 w-40 rounded-[48%] bg-white/80" />
                        <div className="absolute right-28 bottom-10 h-16 w-24 rounded-[42%] bg-white/75" />

                        <div className="absolute left-24 top-20 flex items-center gap-1 text-xs font-semibold text-slate-800">
                          <MapPin className="h-3.5 w-3.5 text-primary" /> London
                        </div>
                        <div className="absolute left-64 top-32 flex items-center gap-1 text-xs font-semibold text-slate-800">
                          <MapPin className="h-3.5 w-3.5 text-primary" /> Dubai
                        </div>
                        <div className="absolute right-24 top-24 flex items-center gap-1 text-xs font-semibold text-slate-800">
                          <MapPin className="h-3.5 w-3.5 text-primary" /> New York
                        </div>
                        <div className="absolute right-20 bottom-12 flex items-center gap-1 text-xs font-semibold text-slate-800">
                          <MapPin className="h-3.5 w-3.5 text-primary" /> Singapore
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/92">
                    <CardHeader>
                      <CardTitle className="text-xl">Open new virtual IBAN</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        <label htmlFor="iban-label" className="text-sm font-medium text-slate-700">Label</label>
                        <input
                          id="iban-label"
                          value={newIbanLabel}
                          onChange={(event) => setNewIbanLabel(event.target.value)}
                          className="h-10 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-2">
                          <label htmlFor="iban-currency" className="text-sm font-medium text-slate-700">Currency</label>
                          <select
                            id="iban-currency"
                            value={newIbanCurrency}
                            onChange={(event) => setNewIbanCurrency(event.target.value)}
                            className="h-10 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                          >
                            <option value="USD">USD</option>
                            <option value="EUR">EUR</option>
                            <option value="GBP">GBP</option>
                            <option value="CHF">CHF</option>
                            <option value="SGD">SGD</option>
                            <option value="AED">AED</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="iban-region" className="text-sm font-medium text-slate-700">Region</label>
                          <select
                            id="iban-region"
                            value={newIbanRegion}
                            onChange={(event) => setNewIbanRegion(event.target.value)}
                            className="h-10 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                          >
                            <option value="US">United States</option>
                            <option value="GB">United Kingdom</option>
                            <option value="DE">Germany</option>
                            <option value="AE">UAE</option>
                            <option value="SG">Singapore</option>
                            <option value="CH">Switzerland</option>
                          </select>
                        </div>
                      </div>
                      <Button className="w-full" onClick={handleCreateIban}>
                        <Landmark className="h-4 w-4" />
                        Open virtual {newIbanCurrency} IBAN
                      </Button>
                      <p aria-live="polite" className="text-xs text-slate-600">{ibanStatus}</p>
                    </CardContent>
                  </Card>
                </div>

                <Card className="bg-white/92">
                  <CardHeader>
                    <CardTitle className="text-xl">Your virtual IBAN accounts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Label</TableHead>
                          <TableHead>Currency</TableHead>
                          <TableHead>Region</TableHead>
                          <TableHead>IBAN</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Balance</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {virtualIbans.map((entry) => (
                          <TableRow key={entry.id}>
                            <TableCell className="font-medium">{entry.label}</TableCell>
                            <TableCell>{entry.currency}</TableCell>
                            <TableCell>{entry.region}</TableCell>
                            <TableCell className="font-mono text-xs">{entry.iban}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={entry.status === "Active" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}>
                                {entry.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">{formatCurrency(entry.balance)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </>
            ) : null}

            {activeSection === "advisor" ? (
              <>
                <Card className="bg-white/92">
                  <CardHeader>
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <CardTitle className="text-2xl">Robo advisor</CardTitle>
                        <p className="text-sm text-slate-600">
                          Managed allocations across curated vaults with policy-aware risk controls.
                        </p>
                      </div>
                      <div className="grid grid-cols-3 rounded-full border border-border bg-slate-100 p-1 text-xs font-semibold text-slate-600">
                        {(["conservative", "balanced", "aggressive"] as RiskProfile[]).map((profile) => (
                          <button
                            key={profile}
                            type="button"
                            onClick={() => setRiskProfile(profile)}
                            className={`rounded-full px-3 py-2 capitalize transition ${
                              riskProfile === profile ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
                            }`}
                          >
                            {profile}
                          </button>
                        ))}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
                      <Card className="bg-white">
                        <CardHeader>
                          <CardTitle className="text-lg">Curated vault opportunities</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {recommendations.map((protocol) => {
                            const weight = recommendationScore > 0 ? Math.round((protocol.rewardScore / recommendationScore) * 100) : 0;
                            return (
                              <div key={protocol.name} className="rounded-xl border border-border/70 bg-slate-50 p-3">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="text-sm font-semibold text-slate-900">{protocol.name}</p>
                                  <Badge variant="outline" className="bg-white text-slate-700">{protocol.apy}</Badge>
                                </div>
                                <p className="mt-1 text-xs text-slate-500">{protocol.summary}</p>
                                <p className="mt-2 text-xs text-slate-600">
                                  Risk {protocol.riskScore}/10 · Reward {protocol.rewardScore}/10 · Suggested {weight}%
                                </p>
                                <p className="mt-1 text-[11px] text-slate-500">Control mapping: {protocol.moduleMapping}</p>
                              </div>
                            );
                          })}
                        </CardContent>
                      </Card>

                      <Card className="bg-white">
                        <CardHeader>
                          <CardTitle className="text-lg">Advisor controls</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-2">
                            <label htmlFor="advisor-budget" className="text-sm font-medium text-slate-700">
                              Monthly allocation budget
                            </label>
                            <input
                              id="advisor-budget"
                              type="number"
                              min={250}
                              step={50}
                              value={advisorBudget}
                              onChange={(event) => setAdvisorBudget(Number(event.target.value) || 0)}
                              className="h-10 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                            />
                          </div>

                          <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                            <p className="font-medium">Current mode</p>
                            <p className="mt-1 text-slate-600">{advisorEnabled ? "Autopilot active" : "Manual approval required"}</p>
                          </div>

                          <Button className="w-full" onClick={handleActivateAdvisor}>
                            <Sparkles className="h-4 w-4" />
                            {advisorEnabled ? "Pause robo advisor" : "Activate robo advisor"}
                          </Button>
                          <p aria-live="polite" className="text-xs text-slate-600">{advisorMessage}</p>
                        </CardContent>
                      </Card>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : null}

            {activeSection === "markets" ? (
              <>
                <Card className="bg-white/92">
                  <CardHeader>
                    <CardTitle className="text-2xl">Perps and synthetic market access</CardTitle>
                    <p className="text-sm text-slate-600">Trade from your account with limits enforced by account policies.</p>
                  </CardHeader>
                  <CardContent className="grid gap-4 lg:grid-cols-[1.25fr_1fr]">
                    <div className="space-y-3">
                      {perpsMarkets.map((market) => (
                        <button
                          key={market.symbol}
                          type="button"
                          onClick={() => setSelectedMarket(market)}
                          className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                            selectedMarket.symbol === market.symbol
                              ? "border-primary bg-blue-50"
                              : "border-border/80 bg-white hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <p className="font-semibold text-slate-900">{market.symbol}</p>
                            <p className={`text-sm font-semibold ${market.change24h >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                              {market.change24h >= 0 ? "+" : ""}
                              {market.change24h.toFixed(2)}%
                            </p>
                          </div>
                          <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                            <span>{formatCurrency(market.price)}</span>
                            <span>Funding {market.funding.toFixed(3)}%</span>
                            <span>OI {market.openInterest}</span>
                          </div>
                        </button>
                      ))}
                    </div>

                    <Card className="bg-white">
                      <CardHeader>
                        <CardTitle className="text-lg">Order ticket</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid h-10 grid-cols-2 rounded-full bg-slate-100 p-1 text-sm font-semibold">
                          {(["Long", "Short"] as TradeSide[]).map((side) => (
                            <button
                              key={side}
                              type="button"
                              onClick={() => setTradeSide(side)}
                              className={`rounded-full transition ${
                                tradeSide === side
                                  ? side === "Long"
                                    ? "bg-emerald-600 text-white"
                                    : "bg-rose-600 text-white"
                                  : "text-slate-600"
                              }`}
                            >
                              {side}
                            </button>
                          ))}
                        </div>

                        <div className="space-y-2">
                          <label htmlFor="trade-size" className="text-sm font-medium text-slate-700">Position size</label>
                          <input
                            id="trade-size"
                            type="number"
                            min={100}
                            step={100}
                            value={tradeSize}
                            onChange={(event) => setTradeSize(Number(event.target.value) || 0)}
                            className="h-10 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">Leverage ({leverage}x)</label>
                          <input
                            type="range"
                            min={1}
                            max={20}
                            step={1}
                            value={leverage}
                            onChange={(event) => setLeverage(Number(event.target.value))}
                            className="w-full"
                          />
                        </div>

                        <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                          <p className="font-medium">{selectedMarket.symbol}</p>
                          <div className="mt-1 space-y-1 text-xs text-slate-500">
                            <p>Notional: {formatCurrency(notionalExposure)}</p>
                            <p>Estimated margin: {formatCurrency(estimatedMargin)}</p>
                            <p>
                              Feature leverage limit: {accountFeatures.marketRiskLimits ? `${accountFeatures.marketMaxLeverage}x` : "Disabled"}
                            </p>
                            <p>
                              Stress loss estimate: {formatCurrency(tradeStressLossEstimate)} /{" "}
                              {formatCurrency(accountFeatures.marketDailyLossLimit)}
                            </p>
                          </div>
                        </div>

                        <Button className="w-full" onClick={handlePlaceOrder} disabled={tradeStatus.state === "loading" || tradeSize <= 0}>
                          <ArrowUpRight className="h-4 w-4" />
                          {tradeStatus.state === "loading" ? "Placing order..." : `Place ${tradeSide.toLowerCase()} order`}
                        </Button>

                        <p
                          aria-live="polite"
                          className={`text-xs ${
                            tradeStatus.state === "error"
                              ? "text-rose-600"
                              : tradeStatus.state === "success"
                                ? "text-emerald-700"
                                : "text-slate-500"
                          }`}
                        >
                          {tradeStatus.message}
                        </p>
                      </CardContent>
                    </Card>
                  </CardContent>
                </Card>
              </>
            ) : null}

            {activeSection === "predictions" ? (
              <>
                <Card className="bg-white/92">
                  <CardHeader>
                    <CardTitle className="text-2xl">Prediction markets</CardTitle>
                    <p className="text-sm text-slate-600">Express views on macro and market outcomes with clear position sizing.</p>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-3">
                    {predictionEvents.map((event) => (
                      <Card key={event.title} className="bg-white">
                        <CardContent className="space-y-3 p-4">
                          <div className="flex items-center justify-between text-xs text-slate-500">
                            <span>{event.category}</span>
                            <span>Closes {event.closeDate}</span>
                          </div>
                          <p className="text-sm font-semibold text-slate-900">{event.title}</p>
                          <div>
                            <div className="mb-1 flex items-center justify-between text-xs">
                              <span className="font-medium text-emerald-600">Yes {event.yes}%</span>
                              <span className="font-medium text-rose-600">No {event.no}%</span>
                            </div>
                            <div className="h-2 rounded-full bg-slate-200">
                              <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${event.yes}%` }} />
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-xs text-slate-500">
                            <span>Volume {event.volume}</span>
                            <span className="rounded-full bg-slate-100 px-2 py-1">Live</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <Button
                              size="sm"
                              className="h-9 bg-emerald-600 hover:bg-emerald-700"
                              onClick={() => handlePredictionOrder(event, "yes")}
                              disabled={predictionSubmitting !== null}
                            >
                              {predictionSubmitting === `${event.title}:yes` ? "Submitting..." : "Buy Yes"}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-9 border-rose-200 text-rose-600 hover:bg-rose-50"
                              onClick={() => handlePredictionOrder(event, "no")}
                              disabled={predictionSubmitting !== null}
                            >
                              {predictionSubmitting === `${event.title}:no` ? "Submitting..." : "Buy No"}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </CardContent>
                </Card>
                <p aria-live="polite" className="text-sm text-slate-600">{predictionStatus}</p>
              </>
            ) : null}

            {activeSection === "products" ? (
              <>
                <Card className="bg-white/92">
                  <CardHeader>
                    <div>
                      <CardTitle className="text-2xl">Consumer financial products</CardTitle>
                      <p className="text-sm text-slate-600">
                        Purpose-built products for consumers. Each one maps to policy modules and smart account controls under the hood.
                      </p>
                    </div>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {consumerProducts.map((product) => {
                      const enabled = productEnrollment[product.id];
                      const isComingSoon = product.status === "Coming soon";
                      return (
                        <Card key={product.id} className="bg-white">
                          <CardContent className="space-y-3 p-4">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-base font-semibold text-slate-900">{product.name}</p>
                              <Badge
                                variant="outline"
                                className={
                                  isComingSoon
                                    ? "bg-amber-50 text-amber-700"
                                    : enabled
                                      ? "bg-emerald-50 text-emerald-700"
                                      : "bg-slate-100 text-slate-700"
                                }
                              >
                                {isComingSoon ? "Coming soon" : enabled ? "Enabled" : "Disabled"}
                              </Badge>
                            </div>
                            <p className="text-xs text-slate-500">{product.category} · {product.status}</p>
                            <p className="text-sm text-slate-700">{product.summary}</p>
                            <div className="rounded-xl border border-border/70 bg-slate-50 p-3">
                              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Consumer value</p>
                              <p className="mt-1 text-sm text-slate-700">{product.customerValue}</p>
                            </div>
                            <p className="text-xs text-slate-500">Powered by {product.moduleMapping}</p>
                            <Button
                              type="button"
                              variant={enabled || isComingSoon ? "outline" : "default"}
                              className="w-full"
                              onClick={() => toggleConsumerProduct(product.id)}
                              disabled={isComingSoon}
                            >
                              {isComingSoon ? "Coming soon" : enabled ? "Disable product" : "Enable product"}
                            </Button>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </CardContent>
                </Card>

                <Card className="bg-white/92">
                  <CardHeader>
                    <CardTitle className="text-xl">How products map to account controls</CardTitle>
                    <p className="text-sm text-slate-600">
                      Product switches update account-level controls so behavior remains safe, clear, and consistent.
                    </p>
                  </CardHeader>
                  <CardContent className="grid gap-3 md:grid-cols-2">
                    {consumerProducts.map((product) => (
                      <div key={`${product.id}-mapping`} className="rounded-xl border border-border/70 bg-slate-50 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-slate-900">{product.name}</p>
                          <Badge
                            variant="outline"
                            className={
                              product.status === "Coming soon"
                                ? "bg-amber-50 text-amber-700"
                                : product.status === "Pilot"
                                  ? "bg-blue-50 text-blue-700"
                                  : "bg-emerald-50 text-emerald-700"
                            }
                          >
                            {product.status}
                          </Badge>
                        </div>
                        <p className="mt-1 text-xs text-slate-600">{product.controlBehavior}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <p aria-live="polite" className="text-sm text-slate-600">
                  {productMessage || "Select a product to enable or disable it for this account profile."}
                </p>
              </>
            ) : null}

            {activeSection === "settings" ? (
              <>
                <Card className="bg-white/92">
                  <CardHeader>
                    <CardTitle className="text-2xl">Account feature studio</CardTitle>
                    <p className="text-sm text-slate-600">
                      Configure how your account behaves in real usage. Features stay user-friendly while mapped to Safe account modules in the background.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="grid gap-3 md:grid-cols-4">
                      {featurePresetConfig.map((preset) => (
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
                          <p className="text-sm font-semibold text-slate-900">{preset.label}</p>
                          <p className="mt-1 text-xs text-slate-500">{preset.description}</p>
                        </button>
                      ))}
                    </div>

                    <div className="grid gap-4 xl:grid-cols-2">
                      <Card className="bg-white">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <TimerReset className="h-4 w-4 text-primary" />
                            Payments and approvals
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="rounded-xl border border-border/70 p-3">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-slate-900">Transfer review delay</p>
                                <p className="text-xs text-slate-500">Delay large transfers so they can be reviewed before execution.</p>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  setAccountFeatures((current) => ({ ...current, transferReviewDelay: !current.transferReviewDelay }))
                                }
                                className={`inline-flex h-6 w-11 items-center rounded-full p-0.5 transition ${
                                  accountFeatures.transferReviewDelay ? "bg-primary" : "bg-slate-300"
                                }`}
                                aria-pressed={accountFeatures.transferReviewDelay}
                                aria-label="Toggle transfer review delay"
                              >
                                <span
                                  className={`h-5 w-5 rounded-full bg-white transition ${
                                    accountFeatures.transferReviewDelay ? "translate-x-5" : "translate-x-0"
                                  }`}
                                />
                              </button>
                            </div>
                            <div className="mt-3 grid gap-2 sm:grid-cols-2">
                              <div>
                                <label htmlFor="transfer-threshold" className="text-xs font-medium text-slate-600">
                                  Review threshold
                                </label>
                                <input
                                  id="transfer-threshold"
                                  type="number"
                                  min={500}
                                  step={100}
                                  value={accountFeatures.transferReviewThreshold}
                                  onChange={(event) =>
                                    setAccountFeatures((current) => ({
                                      ...current,
                                      transferReviewThreshold: Number(event.target.value) || 500
                                    }))
                                  }
                                  disabled={!accountFeatures.transferReviewDelay}
                                  className="mt-1 h-9 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
                                />
                              </div>
                              <div>
                                <label htmlFor="transfer-delay" className="text-xs font-medium text-slate-600">
                                  Delay hours
                                </label>
                                <input
                                  id="transfer-delay"
                                  type="number"
                                  min={0}
                                  max={72}
                                  step={1}
                                  value={accountFeatures.transferReviewDelayHours}
                                  onChange={(event) =>
                                    setAccountFeatures((current) => ({
                                      ...current,
                                      transferReviewDelayHours: Math.max(0, Math.min(72, Number(event.target.value) || 0))
                                    }))
                                  }
                                  disabled={!accountFeatures.transferReviewDelay}
                                  className="mt-1 h-9 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="rounded-xl border border-border/70 p-3">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-slate-900">Shared approval roles</p>
                                <p className="text-xs text-slate-500">Require multiple approvals for shared or business actions.</p>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  setAccountFeatures((current) => ({ ...current, sharedApprovalRoles: !current.sharedApprovalRoles }))
                                }
                                className={`inline-flex h-6 w-11 items-center rounded-full p-0.5 transition ${
                                  accountFeatures.sharedApprovalRoles ? "bg-primary" : "bg-slate-300"
                                }`}
                                aria-pressed={accountFeatures.sharedApprovalRoles}
                                aria-label="Toggle shared approval roles"
                              >
                                <span
                                  className={`h-5 w-5 rounded-full bg-white transition ${
                                    accountFeatures.sharedApprovalRoles ? "translate-x-5" : "translate-x-0"
                                  }`}
                                />
                              </button>
                            </div>
                            <div className="mt-3">
                              <label htmlFor="approval-count" className="text-xs font-medium text-slate-600">
                                Approvals required ({accountFeatures.sharedApprovalsRequired})
                              </label>
                              <input
                                id="approval-count"
                                type="range"
                                min={1}
                                max={4}
                                step={1}
                                value={accountFeatures.sharedApprovalsRequired}
                                onChange={(event) =>
                                  setAccountFeatures((current) => ({
                                    ...current,
                                    sharedApprovalsRequired: Number(event.target.value)
                                  }))
                                }
                                disabled={!accountFeatures.sharedApprovalRoles}
                                className="mt-2 w-full disabled:opacity-60"
                              />
                            </div>
                          </div>

                          <div className="rounded-xl border border-border/70 p-3">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-slate-900">Recipient allowlists</p>
                                <p className="text-xs text-slate-500">Only approved recipients and categories can receive funds.</p>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  setAccountFeatures((current) => ({ ...current, recipientAllowlists: !current.recipientAllowlists }))
                                }
                                className={`inline-flex h-6 w-11 items-center rounded-full p-0.5 transition ${
                                  accountFeatures.recipientAllowlists ? "bg-primary" : "bg-slate-300"
                                }`}
                                aria-pressed={accountFeatures.recipientAllowlists}
                                aria-label="Toggle recipient allowlists"
                              >
                                <span
                                  className={`h-5 w-5 rounded-full bg-white transition ${
                                    accountFeatures.recipientAllowlists ? "translate-x-5" : "translate-x-0"
                                  }`}
                                />
                              </button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-white">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <Gauge className="h-4 w-4 text-primary" />
                            Sessions, automation, and risk
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="rounded-xl border border-border/70 p-3">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-slate-900">Trusted sessions</p>
                                <p className="text-xs text-slate-500">Fast approvals for daily use with strict time and spend caps.</p>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  setAccountFeatures((current) => ({ ...current, trustedSessions: !current.trustedSessions }))
                                }
                                className={`inline-flex h-6 w-11 items-center rounded-full p-0.5 transition ${
                                  accountFeatures.trustedSessions ? "bg-primary" : "bg-slate-300"
                                }`}
                                aria-pressed={accountFeatures.trustedSessions}
                                aria-label="Toggle trusted sessions"
                              >
                                <span
                                  className={`h-5 w-5 rounded-full bg-white transition ${
                                    accountFeatures.trustedSessions ? "translate-x-5" : "translate-x-0"
                                  }`}
                                />
                              </button>
                            </div>
                            <div className="mt-3 grid gap-2 sm:grid-cols-2">
                              <div>
                                <label htmlFor="session-limit" className="text-xs font-medium text-slate-600">
                                  Session spend limit
                                </label>
                                <input
                                  id="session-limit"
                                  type="number"
                                  min={200}
                                  step={100}
                                  value={accountFeatures.trustedSessionLimit}
                                  onChange={(event) =>
                                    setAccountFeatures((current) => ({
                                      ...current,
                                      trustedSessionLimit: Number(event.target.value) || 200
                                    }))
                                  }
                                  disabled={!accountFeatures.trustedSessions}
                                  className="mt-1 h-9 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
                                />
                              </div>
                              <div>
                                <label htmlFor="session-hours" className="text-xs font-medium text-slate-600">
                                  Session duration (hours)
                                </label>
                                <input
                                  id="session-hours"
                                  type="number"
                                  min={1}
                                  max={24}
                                  step={1}
                                  value={accountFeatures.trustedSessionHours}
                                  onChange={(event) =>
                                    setAccountFeatures((current) => ({
                                      ...current,
                                      trustedSessionHours: Math.max(1, Math.min(24, Number(event.target.value) || 1))
                                    }))
                                  }
                                  disabled={!accountFeatures.trustedSessions}
                                  className="mt-1 h-9 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="rounded-xl border border-border/70 p-3">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-slate-900">Recovery protection</p>
                                <p className="text-xs text-slate-500">Guardians and delay windows for secure recovery.</p>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  setAccountFeatures((current) => ({ ...current, recoveryProtection: !current.recoveryProtection }))
                                }
                                className={`inline-flex h-6 w-11 items-center rounded-full p-0.5 transition ${
                                  accountFeatures.recoveryProtection ? "bg-primary" : "bg-slate-300"
                                }`}
                                aria-pressed={accountFeatures.recoveryProtection}
                                aria-label="Toggle recovery protection"
                              >
                                <span
                                  className={`h-5 w-5 rounded-full bg-white transition ${
                                    accountFeatures.recoveryProtection ? "translate-x-5" : "translate-x-0"
                                  }`}
                                />
                              </button>
                            </div>
                            <div className="mt-3 grid gap-2 sm:grid-cols-2">
                              <div>
                                <label htmlFor="recovery-guardians" className="text-xs font-medium text-slate-600">
                                  Guardian count
                                </label>
                                <input
                                  id="recovery-guardians"
                                  type="number"
                                  min={2}
                                  max={7}
                                  step={1}
                                  value={accountFeatures.recoveryGuardians}
                                  onChange={(event) =>
                                    setAccountFeatures((current) => ({
                                      ...current,
                                      recoveryGuardians: Math.max(2, Math.min(7, Number(event.target.value) || 2))
                                    }))
                                  }
                                  disabled={!accountFeatures.recoveryProtection}
                                  className="mt-1 h-9 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
                                />
                              </div>
                              <div>
                                <label htmlFor="recovery-delay" className="text-xs font-medium text-slate-600">
                                  Recovery delay (hours)
                                </label>
                                <input
                                  id="recovery-delay"
                                  type="number"
                                  min={12}
                                  max={168}
                                  step={12}
                                  value={accountFeatures.recoveryDelayHours}
                                  onChange={(event) =>
                                    setAccountFeatures((current) => ({
                                      ...current,
                                      recoveryDelayHours: Math.max(12, Math.min(168, Number(event.target.value) || 12))
                                    }))
                                  }
                                  disabled={!accountFeatures.recoveryProtection}
                                  className="mt-1 h-9 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="rounded-xl border border-border/70 p-3">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-slate-900">Automation rules</p>
                                <p className="text-xs text-slate-500">Scheduled sweeps and recurring smart cash management.</p>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  setAccountFeatures((current) => ({ ...current, automationRules: !current.automationRules }))
                                }
                                className={`inline-flex h-6 w-11 items-center rounded-full p-0.5 transition ${
                                  accountFeatures.automationRules ? "bg-primary" : "bg-slate-300"
                                }`}
                                aria-pressed={accountFeatures.automationRules}
                                aria-label="Toggle automation rules"
                              >
                                <span
                                  className={`h-5 w-5 rounded-full bg-white transition ${
                                    accountFeatures.automationRules ? "translate-x-5" : "translate-x-0"
                                  }`}
                                />
                              </button>
                            </div>
                            <div className="mt-3 grid gap-2 sm:grid-cols-2">
                              <div>
                                <label htmlFor="sweep-percent" className="text-xs font-medium text-slate-600">
                                  Auto sweep (%)
                                </label>
                                <input
                                  id="sweep-percent"
                                  type="number"
                                  min={0}
                                  max={80}
                                  step={5}
                                  value={accountFeatures.autoSweepPercent}
                                  onChange={(event) =>
                                    setAccountFeatures((current) => ({
                                      ...current,
                                      autoSweepPercent: Math.max(0, Math.min(80, Number(event.target.value) || 0))
                                    }))
                                  }
                                  disabled={!accountFeatures.automationRules}
                                  className="mt-1 h-9 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
                                />
                              </div>
                              <div>
                                <label htmlFor="sweep-day" className="text-xs font-medium text-slate-600">
                                  Sweep day
                                </label>
                                <select
                                  id="sweep-day"
                                  value={accountFeatures.autoSweepDay}
                                  onChange={(event) =>
                                    setAccountFeatures((current) => ({
                                      ...current,
                                      autoSweepDay: event.target.value as AccountFeatureState["autoSweepDay"]
                                    }))
                                  }
                                  disabled={!accountFeatures.automationRules}
                                  className="mt-1 h-9 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
                                >
                                  <option value="Monday">Monday</option>
                                  <option value="Wednesday">Wednesday</option>
                                  <option value="Friday">Friday</option>
                                  <option value="Sunday">Sunday</option>
                                </select>
                              </div>
                            </div>
                          </div>

                          <div className="rounded-xl border border-border/70 p-3">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-slate-900">Subscription and market guards</p>
                                <p className="text-xs text-slate-500">Keep recurring charges and leveraged markets within policy.</p>
                              </div>
                            </div>
                            <div className="mt-3 grid gap-2 sm:grid-cols-2">
                              <label className="flex items-center justify-between rounded-xl border border-border/70 px-3 py-2 text-xs">
                                <span className="font-medium text-slate-700">Subscription caps</span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setAccountFeatures((current) => ({
                                      ...current,
                                      subscriptionCaps: !current.subscriptionCaps
                                    }))
                                  }
                                  className={`inline-flex h-6 w-11 items-center rounded-full p-0.5 transition ${
                                    accountFeatures.subscriptionCaps ? "bg-primary" : "bg-slate-300"
                                  }`}
                                  aria-pressed={accountFeatures.subscriptionCaps}
                                  aria-label="Toggle subscription caps"
                                >
                                  <span
                                    className={`h-5 w-5 rounded-full bg-white transition ${
                                      accountFeatures.subscriptionCaps ? "translate-x-5" : "translate-x-0"
                                    }`}
                                  />
                                </button>
                              </label>

                              <label className="flex items-center justify-between rounded-xl border border-border/70 px-3 py-2 text-xs">
                                <span className="font-medium text-slate-700">Market risk limits</span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setAccountFeatures((current) => ({
                                      ...current,
                                      marketRiskLimits: !current.marketRiskLimits
                                    }))
                                  }
                                  className={`inline-flex h-6 w-11 items-center rounded-full p-0.5 transition ${
                                    accountFeatures.marketRiskLimits ? "bg-primary" : "bg-slate-300"
                                  }`}
                                  aria-pressed={accountFeatures.marketRiskLimits}
                                  aria-label="Toggle market risk limits"
                                >
                                  <span
                                    className={`h-5 w-5 rounded-full bg-white transition ${
                                      accountFeatures.marketRiskLimits ? "translate-x-5" : "translate-x-0"
                                    }`}
                                  />
                                </button>
                              </label>
                            </div>
                            <div className="mt-3 grid gap-3 sm:grid-cols-2">
                              <div>
                                <label htmlFor="subscription-cap" className="text-xs font-medium text-slate-600">
                                  Monthly subscription cap
                                </label>
                                <input
                                  id="subscription-cap"
                                  type="number"
                                  min={50}
                                  step={50}
                                  value={accountFeatures.subscriptionMonthlyCap}
                                  onChange={(event) =>
                                    setAccountFeatures((current) => ({
                                      ...current,
                                      subscriptionMonthlyCap: Number(event.target.value) || 50
                                    }))
                                  }
                                  disabled={!accountFeatures.subscriptionCaps}
                                  className="mt-1 h-9 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
                                />
                              </div>
                              <div>
                                <label htmlFor="market-loss-limit" className="text-xs font-medium text-slate-600">
                                  Daily market stress loss limit
                                </label>
                                <input
                                  id="market-loss-limit"
                                  type="number"
                                  min={300}
                                  step={100}
                                  value={accountFeatures.marketDailyLossLimit}
                                  onChange={(event) =>
                                    setAccountFeatures((current) => ({
                                      ...current,
                                      marketDailyLossLimit: Number(event.target.value) || 300
                                    }))
                                  }
                                  disabled={!accountFeatures.marketRiskLimits}
                                  className="mt-1 h-9 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
                                />
                              </div>
                            </div>
                            <div className="mt-3">
                              <label htmlFor="max-leverage" className="text-xs font-medium text-slate-600">
                                Max leverage ({accountFeatures.marketMaxLeverage}x)
                              </label>
                              <input
                                id="max-leverage"
                                type="range"
                                min={1}
                                max={10}
                                step={1}
                                value={accountFeatures.marketMaxLeverage}
                                onChange={(event) =>
                                  setAccountFeatures((current) => ({
                                    ...current,
                                    marketMaxLeverage: Number(event.target.value)
                                  }))
                                }
                                disabled={!accountFeatures.marketRiskLimits}
                                className="mt-2 w-full disabled:opacity-60"
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      <Card className="bg-white">
                        <CardContent className="p-4">
                          <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                            <ListChecks className="h-4 w-4 text-primary" />
                            Transfer simulation
                          </p>
                          <p className="mt-2 text-xs text-slate-500">
                            Sending {formatCurrency(simulatedTransferAmount)}:
                          </p>
                          <p className={`mt-1 text-sm font-semibold ${transferRequiresReview ? "text-amber-700" : "text-emerald-700"}`}>
                            {transferRequiresReview
                              ? `Queued for ${accountFeatures.transferReviewDelayHours}h review`
                              : "Executes instantly"}
                          </p>
                        </CardContent>
                      </Card>

                      <Card className="bg-white">
                        <CardContent className="p-4">
                          <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                            <Repeat className="h-4 w-4 text-primary" />
                            Subscription simulation
                          </p>
                          <p className="mt-2 text-xs text-slate-500">
                            Monthly recurring charge {formatCurrency(simulatedSubscriptionSpend)}:
                          </p>
                          <p className={`mt-1 text-sm font-semibold ${subscriptionWithinCap ? "text-emerald-700" : "text-rose-700"}`}>
                            {subscriptionWithinCap ? "Approved by policy" : "Blocked by subscription cap"}
                          </p>
                        </CardContent>
                      </Card>

                      <Card className="bg-white">
                        <CardContent className="p-4">
                          <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                            <Gauge className="h-4 w-4 text-primary" />
                            Market simulation
                          </p>
                          <p className="mt-2 text-xs text-slate-500">
                            {selectedMarket.symbol} at {leverage}x with stress loss {formatCurrency(tradeStressLossEstimate)}:
                          </p>
                          <p className={`mt-1 text-sm font-semibold ${tradeWithinFeaturePolicy ? "text-emerald-700" : "text-rose-700"}`}>
                            {tradeWithinFeaturePolicy ? "Order allowed by policy" : "Order would be blocked"}
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <Button type="button" onClick={saveFeatureSettings}>
                        <ShieldCheck className="h-4 w-4" />
                        Save feature profile
                      </Button>
                      <p aria-live="polite" className="text-sm text-slate-600">
                        {settingsMessage || "No unsaved warnings. Profile is ready."}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/92">
                  <CardHeader>
                    <CardTitle className="text-xl">Feature to module mapping</CardTitle>
                    <p className="text-sm text-slate-600">
                      These settings are user-facing features. Under the hood they map to Safe smart account module controls.
                    </p>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Feature</TableHead>
                          <TableHead>Enabled by</TableHead>
                          <TableHead>Current behavior</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {featureRuntimeRows.map((row) => (
                          <TableRow key={row.feature}>
                            <TableCell className="font-medium">{row.feature}</TableCell>
                            <TableCell>{row.owner}</TableCell>
                            <TableCell>{row.behavior}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                <Card className="bg-slate-950 text-white">
                  <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Architecture</p>
                      <p className="mt-1 text-lg font-semibold">Safe smart accounts + feature modules + payment rails</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                      <ShieldCheck className="h-4 w-4 text-cyan-300" />
                      Ownership remains with the user. Feature logic is policy enforced.
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : null}
          </main>
        </div>
      </section>
    </div>
  );
}
