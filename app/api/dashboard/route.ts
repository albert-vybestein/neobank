import { NextResponse } from "next/server";

import { getDashboardData } from "@/lib/server/dashboard-adapter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const data = await getDashboardData();

  return NextResponse.json({
    data,
    fetchedAt: new Date().toISOString()
  });
}
