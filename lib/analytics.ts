export type AnalyticsPayload = Record<string, unknown>;

export function trackEvent(name: string, payload: AnalyticsPayload = {}) {
  void fetch("/api/analytics/events", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    keepalive: true,
    body: JSON.stringify({ name, payload })
  }).catch(() => {
    // Analytics is non-blocking.
  });
}
