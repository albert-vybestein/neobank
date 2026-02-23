"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  Brain,
  CandlestickChart,
  Gauge,
  LineChart,
  PiggyBank,
  ShieldCheck,
  Target,
  TrendingUp
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import dashboardSeed from "@/data/dashboard.json";
import { trackEvent } from "@/lib/analytics";
import { projectSavings, formatCurrency } from "@/lib/dashboard/math";
import { postJson, getJson } from "@/lib/http-client";
import type { DashboardData, Market, PredictionEvent, RiskProfile } from "@/lib/types/dashboard";

type TradeSide = "Long" | "Short";

type DashboardResponse = {
  data: DashboardData;
  fetchedAt: string;
};

const defaultDashboardData: DashboardData = dashboardSeed as DashboardData;

function Sparkline({ data, color = "#2563eb" }: { data: number[]; color?: string }) {
  const width = 640;
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
    <svg viewBox={`0 0 ${width} ${height}`} className="h-44 w-full">
      <defs>
        <linearGradient id="sparkGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline points={points} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />
      <polyline points={`${points} ${width - padding},${height - padding} ${padding},${height - padding}`} fill="url(#sparkGradient)" stroke="none" />
    </svg>
  );
}

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData>(defaultDashboardData);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState("");

  const [riskProfile, setRiskProfile] = useState<RiskProfile>("balanced");
  const [weeklyContribution, setWeeklyContribution] = useState(200);
  const [growthYears, setGrowthYears] = useState(5);
  const [expectedYield, setExpectedYield] = useState(8);
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

  const { portfolioCurve, spendByCategory, protocolCatalog, perpsMarkets, predictionEvents } = dashboardData;

  useEffect(() => {
    let active = true;

    const loadDashboard = async () => {
      try {
        const response = await getJson<DashboardResponse>("/api/dashboard");

        if (!active) return;
        setDashboardData(response.data);
        setDashboardError("");

        setSelectedMarket((current) => {
          const bySymbol = response.data.perpsMarkets.find((market) => market.symbol === current.symbol);
          return bySymbol ?? response.data.perpsMarkets[0];
        });
      } catch (error) {
        if (!active) return;
        setDashboardError(error instanceof Error ? error.message : "Could not refresh live dashboard data.");
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
  const monthlySpend = spendByCategory.reduce((total, item) => total + item.spent, 0);
  const budgetPerformance = Math.round(((monthlyIncome - monthlySpend) / monthlyIncome) * 100);
  const savingsProjection = projectSavings(weeklyContribution, growthYears, expectedYield);
  const principalOnly = weeklyContribution * 52 * growthYears;
  const projectedGrowth = savingsProjection - principalOnly;

  const yearlyCurve = useMemo(
    () =>
      Array.from({ length: growthYears + 1 }, (_, index) =>
        Number(projectSavings(weeklyContribution, index, expectedYield).toFixed(0))
      ),
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

  const totalScore = recommendations.reduce((total, protocol) => total + protocol.rewardScore, 0);
  const notionalExposure = tradeSize * leverage;
  const entryCost = tradeSize / Math.max(leverage, 1);

  const handlePlaceOrder = async () => {
    setTradeStatus({ state: "loading", message: "" });

    try {
      const payload = {
        market: selectedMarket.symbol,
        side: tradeSide,
        size: tradeSize,
        leverage
      };

      const response = await postJson<typeof payload, { id: string }>("/api/trading/orders", payload);
      setTradeStatus({
        state: "success",
        message: `Order accepted. Ticket ${response.id.slice(-8)} created.`
      });
      void trackEvent("trade_order_submitted", payload);
    } catch (error) {
      setTradeStatus({
        state: "error",
        message: error instanceof Error ? error.message : "Order failed. Please try again."
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
      setPredictionStatus(`Prediction order accepted (${response.id.slice(-8)}).`);
      void trackEvent("prediction_order_submitted", payload);
    } catch (error) {
      setPredictionStatus(error instanceof Error ? error.message : "Could not place prediction order.");
    } finally {
      setPredictionSubmitting(null);
    }
  };

  return (
    <div className="pb-20 pt-24">
      <section className="container">
        <div className="rounded-[2rem] border border-white/70 bg-[radial-gradient(circle_at_10%_0%,rgba(59,130,246,0.2),transparent_44%),radial-gradient(circle_at_100%_0%,rgba(6,182,212,0.16),transparent_40%),rgba(255,255,255,0.84)] p-6 shadow-soft md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="space-y-4">
              <Badge variant="outline" className="bg-white/80 text-slate-700">
                Logged in workspace
              </Badge>
              <h1 className="headline-lg max-w-2xl">Your command center for banking, investing, and market access.</h1>
              <p className="body-lg max-w-2xl">
                One account for cash flow, savings, DeFi opportunities, perps, and prediction markets with risk-aware guidance.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Card className="min-w-[180px] bg-white/90">
                <CardContent className="p-4">
                  <p className="text-xs font-medium text-slate-500">Net worth</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">$184,200</p>
                  <p className="mt-1 text-xs text-emerald-600">+5.4% this month</p>
                </CardContent>
              </Card>
              <Card className="min-w-[180px] bg-white/90">
                <CardContent className="p-4">
                  <p className="text-xs font-medium text-slate-500">Available cash</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">$26,480</p>
                  <p className="mt-1 text-xs text-slate-500">Across 4 cash buckets</p>
                </CardContent>
              </Card>
            </div>
          </div>
          <div className="mt-4 flex min-h-6 items-center text-sm" aria-live="polite">
            {dashboardLoading ? <p className="text-slate-500">Refreshing live dashboard data...</p> : null}
            {!dashboardLoading && dashboardError ? <p className="text-amber-700">{dashboardError}</p> : null}
            {!dashboardLoading && !dashboardError ? <p className="text-emerald-700">Data source connected.</p> : null}
          </div>
        </div>
      </section>

      <section className="container mt-8 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <Card className="bg-white/92">
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <LineChart className="h-5 w-5 text-primary" />
                  Portfolio performance
                </CardTitle>
                <p className="mt-1 text-sm text-slate-600">30-day movement across cash, DeFi yields, and market exposure.</p>
              </div>
              <Badge className="bg-emerald-600 text-white">+$14,360 PnL</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Sparkline data={portfolioCurve} />
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-slate-500">Cash</p>
                <p className="mt-1 font-semibold text-slate-900">$61,200</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-slate-500">DeFi strategies</p>
                <p className="mt-1 font-semibold text-slate-900">$74,300</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-slate-500">Trading</p>
                <p className="mt-1 font-semibold text-slate-900">$48,700</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/92">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Gauge className="h-5 w-5 text-primary" />
              Risk monitor
            </CardTitle>
            <p className="text-sm text-slate-600">Live guardrails from your enabled account features.</p>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-700">
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="font-medium">Daily spend cap</p>
              <p className="mt-1 text-slate-500">$6,100 used of $8,000</p>
              <div className="mt-2 h-2 rounded-full bg-slate-200">
                <div className="h-2 w-[76%] rounded-full bg-primary" />
              </div>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="font-medium">Large transfer hold</p>
              <p className="mt-1 text-slate-500">24h active on transfers above $10,000</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="font-medium">Session approvals</p>
              <p className="mt-1 text-slate-500">3 trusted sessions currently active</p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="container mt-8 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <Card className="bg-white/92">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <PiggyBank className="h-5 w-5 text-primary" />
              Savings growth simulator
            </CardTitle>
            <p className="text-sm text-slate-600">Model the upside if you add money every week.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Sparkline data={yearlyCurve} color="#0ea5e9" />
            <div className="grid gap-3 sm:grid-cols-3 text-sm">
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-slate-500">Projected value</p>
                <p className="mt-1 text-xl font-semibold text-slate-900">{formatCurrency(savingsProjection)}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-slate-500">Your deposits</p>
                <p className="mt-1 text-xl font-semibold text-slate-900">{formatCurrency(principalOnly)}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-slate-500">Estimated growth</p>
                <p className="mt-1 text-xl font-semibold text-emerald-600">{formatCurrency(projectedGrowth)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/92">
          <CardHeader>
            <CardTitle className="text-xl">Scenario settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="weekly-amount">Weekly contribution</label>
              <input
                id="weekly-amount"
                type="number"
                min={50}
                step={25}
                value={weeklyContribution}
                onChange={(event) => setWeeklyContribution(Number(event.target.value) || 0)}
                className="h-11 w-full rounded-2xl border border-border bg-white px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Years</label>
              <input
                type="range"
                min={1}
                max={20}
                step={1}
                value={growthYears}
                onChange={(event) => setGrowthYears(Number(event.target.value))}
                className="w-full"
              />
              <p className="text-xs text-slate-500">{growthYears} year horizon</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Expected annual return</label>
              <input
                type="range"
                min={2}
                max={20}
                step={1}
                value={expectedYield}
                onChange={(event) => setExpectedYield(Number(event.target.value))}
                className="w-full"
              />
              <p className="text-xs text-slate-500">{expectedYield}% target APY</p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="container mt-8 grid gap-4 lg:grid-cols-[1.1fr_1fr]">
        <Card className="bg-white/92">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Target className="h-5 w-5 text-primary" />
              Budget analysis
            </CardTitle>
            <p className="text-sm text-slate-600">Track spend quality and adjust before month end.</p>
          </CardHeader>
          <CardContent className="space-y-4">
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
            <CardTitle className="text-xl">Monthly score</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-700">
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-slate-500">Income</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">{formatCurrency(monthlyIncome)}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-slate-500">Spend</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">{formatCurrency(monthlySpend)}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-slate-500">Savings rate</p>
              <p className="mt-1 text-2xl font-semibold text-emerald-600">{budgetPerformance}%</p>
            </div>
            <p className="rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-emerald-700">
              You are pacing above target. Shift $90 from subscriptions to long-term savings to raise your score next month.
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="container mt-8">
        <Card className="bg-white/92">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <Brain className="h-5 w-5 text-primary" />
                  Money manager
                </CardTitle>
                <p className="mt-1 text-sm text-slate-600">
                  Strategy recommendations ranked by risk/reward with automatic policy mapping.
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Protocol</TableHead>
                  <TableHead>Strategy</TableHead>
                  <TableHead>Risk / Reward</TableHead>
                  <TableHead>Yield</TableHead>
                  <TableHead>Suggested allocation</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recommendations.map((protocol) => {
                  const weight = totalScore > 0 ? Math.round((protocol.rewardScore / totalScore) * 100) : 0;

                  return (
                    <TableRow key={protocol.name}>
                      <TableCell>
                        <p className="font-semibold text-slate-900">{protocol.name}</p>
                        <p className="text-xs text-slate-500">{protocol.liquidity} liquidity</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-slate-700">{protocol.strategy}</p>
                        <p className="text-xs text-slate-500">{protocol.summary}</p>
                      </TableCell>
                      <TableCell className="text-sm text-slate-700">
                        {protocol.riskScore}/10 risk · {protocol.rewardScore}/10 reward
                      </TableCell>
                      <TableCell className="text-sm font-semibold text-emerald-600">{protocol.apy}</TableCell>
                      <TableCell>
                        <p className="text-sm font-semibold text-slate-900">{weight}%</p>
                        <p className="text-xs text-slate-500">{protocol.moduleMapping}</p>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

      <section className="container mt-8">
        <Card className="bg-white/92">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <CandlestickChart className="h-5 w-5 text-primary" />
              Trading access: perps and synthetic stocks
            </CardTitle>
            <p className="text-sm text-slate-600">Native venue connectivity with risk caps and account-level controls.</p>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="perps">
              <TabsList>
                <TabsTrigger value="perps">Perps</TabsTrigger>
                <TabsTrigger value="stocks">Stocks</TabsTrigger>
              </TabsList>

              <TabsContent value="perps">
                <div className="grid gap-4 lg:grid-cols-[1.25fr_1fr]">
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
                          <p>Estimated margin: {formatCurrency(entryCost)}</p>
                          <p>Risk cap: max 15% of liquid portfolio</p>
                        </div>
                      </div>

                      <Button
                        className="w-full"
                        onClick={handlePlaceOrder}
                        disabled={tradeStatus.state === "loading" || tradeSize <= 0}
                      >
                        <ArrowUpRight className="h-4 w-4" />
                        {tradeStatus.state === "loading" ? "Placing order..." : `Place ${tradeSide.toLowerCase()} order`}
                      </Button>
                      <p
                        aria-live="polite"
                        className={`text-xs ${
                          tradeStatus.state === "error" ? "text-rose-600" : tradeStatus.state === "success" ? "text-emerald-700" : "text-slate-500"
                        }`}
                      >
                        {tradeStatus.message}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="stocks">
                <div className="grid gap-4 md:grid-cols-3">
                  <Card className="bg-white">
                    <CardContent className="p-4">
                      <p className="text-sm font-semibold text-slate-900">US Tech basket</p>
                      <p className="mt-1 text-xs text-slate-500">Weighted synthetic exposure</p>
                      <p className="mt-2 text-lg font-semibold text-emerald-600">+1.8%</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-white">
                    <CardContent className="p-4">
                      <p className="text-sm font-semibold text-slate-900">AI infra basket</p>
                      <p className="mt-1 text-xs text-slate-500">Vol-adjusted allocation</p>
                      <p className="mt-2 text-lg font-semibold text-emerald-600">+2.4%</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-white">
                    <CardContent className="p-4">
                      <p className="text-sm font-semibold text-slate-900">Energy hedge basket</p>
                      <p className="mt-1 text-xs text-slate-500">Macro downside buffer</p>
                      <p className="mt-2 text-lg font-semibold text-rose-600">-0.4%</p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </section>

      <section className="container mt-8">
        <Card className="bg-white/92">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <TrendingUp className="h-5 w-5 text-primary" />
              Prediction markets
            </CardTitle>
            <p className="text-sm text-slate-600">Trade probabilities on macro, crypto, and equity outcomes.</p>
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
        <p aria-live="polite" className="mt-3 text-sm text-slate-600">
          {predictionStatus}
        </p>
      </section>

      <section className="container mt-8">
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-white/92">
            <CardContent className="p-4">
              <p className="text-xs text-slate-500">Connected accounts</p>
              <p className="mt-2 text-xl font-semibold text-slate-900">7</p>
            </CardContent>
          </Card>
          <Card className="bg-white/92">
            <CardContent className="p-4">
              <p className="text-xs text-slate-500">Automation rules</p>
              <p className="mt-2 text-xl font-semibold text-slate-900">18</p>
            </CardContent>
          </Card>
          <Card className="bg-white/92">
            <CardContent className="p-4">
              <p className="text-xs text-slate-500">Protected transfers</p>
              <p className="mt-2 text-xl font-semibold text-slate-900">24h</p>
            </CardContent>
          </Card>
          <Card className="bg-white/92">
            <CardContent className="p-4">
              <p className="text-xs text-slate-500">Risk status</p>
              <p className="mt-2 text-xl font-semibold text-emerald-600">Healthy</p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="container mt-8">
        <Card className="bg-slate-950 text-white">
          <CardContent className="flex flex-wrap items-center justify-between gap-4 p-6">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Connected stack</p>
              <p className="mt-1 text-lg font-semibold">Safe smart accounts + Gnosis Guild modules + Rhinestone modules</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <ShieldCheck className="h-4 w-4 text-cyan-300" />
              Features are policy-enforced across spending, investing, and trading.
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
