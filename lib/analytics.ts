export type AnalyticsPayload = Record<string, unknown>;

export async function trackEvent(name: string, payload: AnalyticsPayload = {}) {
  try {
    await fetch("/api/analytics/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ name, payload })
    });
  } catch {
    // Analytics is non-blocking.
  }
}
