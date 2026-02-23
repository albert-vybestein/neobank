import { describe, expect, it } from "vitest";

import { formatCurrency, projectSavings } from "@/lib/dashboard/math";

describe("dashboard math", () => {
  it("projects savings correctly with zero yield", () => {
    expect(projectSavings(200, 5, 0)).toBe(52_000);
  });

  it("projects savings correctly with positive yield", () => {
    const projection = projectSavings(200, 5, 8);
    expect(Math.round(projection)).toBeGreaterThan(52_000);
  });

  it("formats currency in usd", () => {
    expect(formatCurrency(1234)).toBe("$1,234");
  });
});
