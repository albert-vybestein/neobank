import { NextRequest, NextResponse } from "next/server";

type MutableHeaders = {
  set: (key: string, value: string) => void;
};

const PUBLIC_DEV_ORIGINS = new Set([
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3001"
]);

const JSON_SECURITY_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
  Vary: "Origin"
};

function normalizeOrigin(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  try {
    return new URL(trimmed).origin;
  } catch {
    return "";
  }
}

function getRequestOrigin(request: NextRequest) {
  const nextLikeRequest = request as NextRequest & { nextUrl?: URL };
  const fromNextUrl = nextLikeRequest.nextUrl?.origin;
  if (fromNextUrl) return fromNextUrl;

  try {
    return new URL(request.url).origin;
  } catch {
    return "";
  }
}

function getAllowedOrigins(request: NextRequest) {
  const origins = new Set<string>();
  const requestOrigin = getRequestOrigin(request);
  if (requestOrigin) origins.add(requestOrigin);

  const hostHeader = request.headers.get("host")?.trim();
  if (hostHeader) {
    origins.add(`http://${hostHeader}`);
    origins.add(`https://${hostHeader}`);
  }

  const forwardedHost = request.headers.get("x-forwarded-host")?.trim();
  if (forwardedHost) {
    origins.add(`http://${forwardedHost}`);
    origins.add(`https://${forwardedHost}`);
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (siteUrl) {
    const normalized = normalizeOrigin(siteUrl);
    if (normalized) origins.add(normalized);
  }

  if (process.env.NODE_ENV !== "production") {
    for (const origin of PUBLIC_DEV_ORIGINS) {
      origins.add(origin);
    }
  }

  return origins;
}

export function ensureTrustedOrigin(request: NextRequest) {
  const originHeader = normalizeOrigin(request.headers.get("origin") ?? "");
  const fetchSite = request.headers.get("sec-fetch-site")?.toLowerCase() ?? "";
  const trustedOrigins = getAllowedOrigins(request);

  if (originHeader && process.env.NODE_ENV !== "production") {
    try {
      const originUrl = new URL(originHeader);
      if (originUrl.hostname === "localhost" || originUrl.hostname === "127.0.0.1") {
        return null;
      }
    } catch {
      // Ignore parse errors and continue with normal checks.
    }
  }

  if (originHeader && !trustedOrigins.has(originHeader)) {
    return NextResponse.json({ error: "Untrusted request origin." }, { status: 403 });
  }

  if (fetchSite === "cross-site") {
    return NextResponse.json({ error: "Cross-site requests are not allowed." }, { status: 403 });
  }

  return null;
}

export function applyApiNoStoreHeaders(response: NextResponse) {
  for (const [key, value] of Object.entries(JSON_SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
}

export function addStandardSecurityHeaders(headers: MutableHeaders) {
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
  headers.set("Cross-Origin-Resource-Policy", "same-origin");
  headers.set("Cross-Origin-Opener-Policy", "same-origin-allow-popups");

  if (process.env.NODE_ENV === "production") {
    headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "strict" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 7 * 24 * 60 * 60
};

export const clearSessionCookieOptions = {
  ...sessionCookieOptions,
  maxAge: 0
};
