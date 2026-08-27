import crypto from "node:crypto";
import { env } from "../config/env";

const TOKEN_VERSION = "v1";
const DEFAULT_SECRET = "medicare-ai-dev-secret";

function getSecret() {
  return process.env.AUTH_SECRET ?? env.authSecret ?? DEFAULT_SECRET;
}

function toBase64Url(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function fromBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(value: string) {
  return crypto.createHmac("sha256", getSecret()).update(value).digest("base64url");
}

export function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${derived}`;
}

export function verifyPassword(password: string, stored: string) {
  if (!stored.startsWith("scrypt:")) {
    return stored === password;
  }

  const [, salt, expected] = stored.split(":");
  const actual = crypto.scryptSync(password, salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(actual, "hex"), Buffer.from(expected, "hex"));
}

export function issueAuthToken(userId: string, ttlHours = 24) {
  const payload = {
    v: TOKEN_VERSION,
    sub: userId,
    exp: Date.now() + ttlHours * 60 * 60 * 1000
  };
  const encoded = toBase64Url(JSON.stringify(payload));
  return `${encoded}.${sign(encoded)}`;
}

export function readAuthToken(token: string) {
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature || sign(encoded) !== signature) {
    return null;
  }

  try {
    const payload = JSON.parse(fromBase64Url(encoded)) as { v?: string; sub?: string; exp?: number };
    if (payload.v !== TOKEN_VERSION || !payload.sub || !payload.exp || payload.exp < Date.now()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
