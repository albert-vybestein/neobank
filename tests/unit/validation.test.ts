import { describe, expect, it } from "vitest";

import { contactSubmissionSchema, safeSetupRequestSchema } from "@/lib/validation";

describe("validation schemas", () => {
  it("rejects invalid contact submissions", () => {
    const parsed = contactSubmissionSchema.safeParse({
      name: "A",
      email: "invalid-email",
      message: "short"
    });

    expect(parsed.success).toBe(false);
  });

  it("accepts valid safe setup requests", () => {
    const parsed = safeSetupRequestSchema.safeParse({
      walletAddress: "0x1234567890abcdef1234567890abcdef12345678",
      accountType: "personal",
      baseCurrency: "EUR",
      accountName: "Main",
      subAccounts: [{ name: "Bills", spendingLimit: "1000" }],
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
    });

    expect(parsed.success).toBe(true);
  });
});
