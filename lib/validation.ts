import { z } from "zod";

const addressRegex = /^0x[a-fA-F0-9]{40}$/;
const signatureRegex = /^0x[a-fA-F0-9]+$/;
const hashRegex = /^0x[a-fA-F0-9]{64}$/;

export const evmAddressSchema = z.string().regex(addressRegex, "Invalid address");
export const signatureSchema = z.string().regex(signatureRegex, "Invalid signature");
export const hashSchema = z.string().regex(hashRegex, "Invalid hash");

export const connectorSchema = z.enum(["passkey", "walletconnect", "injected"]);
export const authMethodSchema = z.enum(["wallet", "passkey"]);

export const accountTypeSchema = z.enum(["personal", "joint", "business", "sub-account"]);

export const safeModuleConfigSchema = z.object({
  guildDelay: z.boolean(),
  guildRoles: z.boolean(),
  guildAllowance: z.boolean(),
  guildRecovery: z.boolean(),
  rhinestoneSessions: z.boolean(),
  rhinestoneSpendingPolicy: z.boolean(),
  rhinestoneAutomation: z.boolean(),
  timeLockHours: z.number().int().min(0).max(72)
});

export const subAccountSchema = z.object({
  name: z.string().trim().min(1).max(48),
  spendingLimit: z.string().trim().min(1).max(24)
});

export const safeSetupRequestSchema = z.object({
  walletAddress: evmAddressSchema,
  accountType: accountTypeSchema,
  baseCurrency: z.enum(["EUR", "USD", "GBP"]),
  accountName: z.string().trim().min(1).max(64),
  subAccounts: z.array(subAccountSchema).max(20),
  modules: safeModuleConfigSchema,
  passkeyDeploymentTx: z
    .object({
      to: evmAddressSchema,
      data: z.string().regex(signatureRegex, "Invalid passkey deployment call data"),
      value: z.string().trim().min(1).max(80)
    })
    .optional()
});

export const safeDeploymentRegisterSchema = z.object({
  walletAddress: evmAddressSchema,
  safeAddress: evmAddressSchema,
  deploymentTxHash: hashSchema,
  moduleTxHash: hashSchema,
  accountType: accountTypeSchema,
  baseCurrency: z.enum(["EUR", "USD", "GBP"]),
  accountName: z.string().trim().min(1).max(64),
  subAccounts: z.array(subAccountSchema).max(20),
  modules: safeModuleConfigSchema,
  network: z.string().trim().min(1).max(32).optional().default("sepolia"),
  mode: z.enum(["mock", "real"]).optional().default("real")
});

export const contactSubmissionSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(80),
  email: z.string().trim().email("Please enter a valid email").max(160),
  message: z.string().trim().min(10, "Message must be at least 10 characters").max(1200),
  website: z.string().optional().default("")
});

export const analyticsEventSchema = z.object({
  name: z.string().trim().min(2).max(80),
  payload: z.record(z.string(), z.unknown()).optional().default({})
});

export const tradeOrderSchema = z.object({
  market: z.string().trim().min(3).max(24),
  side: z.enum(["Long", "Short"]),
  size: z.number().positive().max(1_000_000),
  leverage: z.number().int().min(1).max(20)
});

export const predictionOrderSchema = z.object({
  eventTitle: z.string().trim().min(4).max(120),
  side: z.enum(["yes", "no"]),
  stake: z.number().min(10).max(250_000)
});

export const spendingCategorySchema = z.object({
  label: z.string().trim().min(1).max(40),
  spent: z.number().nonnegative(),
  budget: z.number().positive()
});

export const protocolRecommendationSchema = z.object({
  name: z.string().trim().min(1).max(100),
  strategy: z.string().trim().min(1).max(200),
  riskScore: z.number().int().min(1).max(10),
  rewardScore: z.number().int().min(1).max(10),
  apy: z.string().trim().min(1).max(20),
  liquidity: z.string().trim().min(1).max(30),
  profiles: z.array(z.enum(["conservative", "balanced", "aggressive"])).min(1),
  moduleMapping: z.string().trim().min(1).max(160),
  summary: z.string().trim().min(1).max(260)
});

export const marketSchema = z.object({
  symbol: z.string().trim().min(3).max(24),
  price: z.number().positive(),
  change24h: z.number(),
  funding: z.number(),
  openInterest: z.string().trim().min(1).max(40)
});

export const predictionEventSchema = z.object({
  title: z.string().trim().min(1).max(140),
  category: z.string().trim().min(1).max(40),
  closeDate: z.string().trim().min(1).max(32),
  yes: z.number().int().min(0).max(100),
  no: z.number().int().min(0).max(100),
  volume: z.string().trim().min(1).max(40)
});

export const dashboardDataSchema = z.object({
  portfolioCurve: z.array(z.number().nonnegative()).min(3),
  spendByCategory: z.array(spendingCategorySchema).min(1),
  protocolCatalog: z.array(protocolRecommendationSchema).min(1),
  perpsMarkets: z.array(marketSchema).min(1),
  predictionEvents: z.array(predictionEventSchema).min(1)
});

export const authChallengeRequestSchema = z.object({
  walletAddress: evmAddressSchema,
  safeAddress: evmAddressSchema
});

export const authVerifyRequestSchema = z.object({
  walletAddress: evmAddressSchema,
  safeAddress: evmAddressSchema,
  signature: signatureSchema,
  nonce: hashSchema,
  authMethod: authMethodSchema.optional().default("wallet")
});

export const privySessionRequestSchema = z.object({
  walletAddress: evmAddressSchema,
  safeAddress: evmAddressSchema,
  accessToken: z.string().trim().min(20).max(10000)
});

export const findSafeByOwnerSchema = z.object({
  owner: evmAddressSchema
});

export type Connector = z.infer<typeof connectorSchema>;
export type SafeSetupRequestInput = z.infer<typeof safeSetupRequestSchema>;
export type ContactSubmissionInput = z.infer<typeof contactSubmissionSchema>;
export type AnalyticsEventInput = z.infer<typeof analyticsEventSchema>;
export type TradeOrderInput = z.infer<typeof tradeOrderSchema>;
export type PredictionOrderInput = z.infer<typeof predictionOrderSchema>;
export type DashboardDataInput = z.infer<typeof dashboardDataSchema>;
export type AuthChallengeRequestInput = z.infer<typeof authChallengeRequestSchema>;
export type AuthVerifyRequestInput = z.infer<typeof authVerifyRequestSchema>;
export type PrivySessionRequestInput = z.infer<typeof privySessionRequestSchema>;
export type SafeDeploymentRegisterInput = z.infer<typeof safeDeploymentRegisterSchema>;
