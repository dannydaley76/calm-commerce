import { createHmac, timingSafeEqual } from "crypto";

type ExtensionTokenPayload = {
  learnerId: string;
  exp: number;
  scope: "scout_pro";
};

export type VerifiedExtensionToken = ExtensionTokenPayload;

const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 14;

function base64UrlEncode(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function tokenSecret(): string | null {
  return process.env.SCOUT_EXTENSION_TOKEN_SECRET || null;
}

function sign(value: string, secret: string): string {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

export function canIssueScoutExtensionTokens(): boolean {
  return Boolean(tokenSecret());
}

export function createScoutExtensionToken(learnerId: string): { token: string; expiresAt: string } {
  const secret = tokenSecret();
  if (!secret) {
    throw new Error("Scout extension token secret is not configured.");
  }

  const payload: ExtensionTokenPayload = {
    learnerId,
    exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
    scope: "scout_pro",
  };
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = sign(encodedPayload, secret);

  return {
    token: `${encodedPayload}.${signature}`,
    expiresAt: new Date(payload.exp * 1000).toISOString(),
  };
}

export function verifyScoutExtensionToken(token: string): VerifiedExtensionToken | null {
  const secret = tokenSecret();
  if (!secret) return null;

  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return null;

  const expected = sign(encodedPayload, secret);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (
    actualBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(actualBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as ExtensionTokenPayload;
    if (payload.scope !== "scout_pro") return null;
    if (!payload.learnerId) return null;
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function bearerTokenFromRequest(request: Request): string | null {
  const header = request.headers.get("authorization") || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? null;
}
