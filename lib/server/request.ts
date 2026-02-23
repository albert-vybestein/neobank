import { NextRequest } from "next/server";

const MAX_JSON_BODY_BYTES = 256_000;

function getFirstForwardedIp(raw: string) {
  const candidate = raw.split(",")[0]?.trim();
  if (!candidate) return "";
  if (candidate.length > 64) return "";
  return candidate;
}

function normalizeIp(ip: string) {
  const value = ip.trim();
  if (!value) return "";
  if (value.length > 64) return "";
  return value;
}

export function getClientKey(request: NextRequest) {
  const forwardedIp = getFirstForwardedIp(
    request.headers.get("x-forwarded-for") ?? request.headers.get("x-vercel-forwarded-for") ?? ""
  );
  const cloudflareIp = normalizeIp(request.headers.get("cf-connecting-ip") ?? "");
  const realIp = normalizeIp(request.headers.get("x-real-ip") ?? "");
  const clientIp = cloudflareIp || forwardedIp || realIp || "unknown";

  const userAgent = request.headers.get("user-agent")?.slice(0, 120) ?? "ua-unknown";
  return `${clientIp}:${userAgent}`;
}

export async function parseJsonBody<T>(request: Request): Promise<T | null> {
  const contentLengthRaw = request.headers.get("content-length");
  const contentLength = contentLengthRaw ? Number(contentLengthRaw) : 0;
  if (Number.isFinite(contentLength) && contentLength > MAX_JSON_BODY_BYTES) {
    return null;
  }

  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}

export function getCookieValue(request: Request, key: string) {
  const maybeNextRequest = request as NextRequest & {
    cookies?: {
      get?: (name: string) => { value: string } | undefined;
    };
  };

  const fromNextCookies = maybeNextRequest.cookies?.get?.(key)?.value;
  if (fromNextCookies) return fromNextCookies;

  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return "";

  for (const segment of cookieHeader.split(";")) {
    const [cookieKey, ...rest] = segment.trim().split("=");
    if (cookieKey === key) {
      return rest.join("=");
    }
  }

  return "";
}
