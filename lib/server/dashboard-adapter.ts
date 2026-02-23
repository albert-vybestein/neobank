import dashboardSeed from "@/data/dashboard.json";
import type { DashboardData } from "@/lib/types/dashboard";
import { dashboardDataSchema } from "@/lib/validation";

export async function getDashboardData(): Promise<DashboardData> {
  const parsed = dashboardDataSchema.parse(dashboardSeed);
  return parsed;
}
