export type RiskProfile = "conservative" | "balanced" | "aggressive";

export type ProtocolRecommendation = {
  name: string;
  strategy: string;
  riskScore: number;
  rewardScore: number;
  apy: string;
  liquidity: string;
  profiles: RiskProfile[];
  moduleMapping: string;
  summary: string;
};

export type Market = {
  symbol: string;
  price: number;
  change24h: number;
  funding: number;
  openInterest: string;
};

export type PredictionEvent = {
  title: string;
  category: string;
  closeDate: string;
  yes: number;
  no: number;
  volume: string;
};

export type SpendingCategory = {
  label: string;
  spent: number;
  budget: number;
};

export type DashboardData = {
  portfolioCurve: number[];
  spendByCategory: SpendingCategory[];
  protocolCatalog: ProtocolRecommendation[];
  perpsMarkets: Market[];
  predictionEvents: PredictionEvent[];
};
