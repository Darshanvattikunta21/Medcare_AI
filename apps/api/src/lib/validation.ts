import { badRequest } from "./errors";

export function asTrimmedString(value: unknown, field: string, options?: { required?: boolean; minLength?: number }) {
  const text = typeof value === "string" ? value.trim() : "";

  if (options?.required && !text) {
    throw badRequest(`${field} is required`);
  }

  if (text && options?.minLength && text.length < options.minLength) {
    throw badRequest(`${field} must be at least ${options.minLength} characters`);
  }

  return text;
}

export function asEmail(value: unknown, field = "email") {
  const email = asTrimmedString(value, field, { required: true }).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw badRequest(`${field} must be a valid email address`);
  }
  return email;
}

export function asOptionalStringArray(value: unknown, field: string) {
  if (value === undefined) {
    return undefined;
  }

  if (!Array.isArray(value)) {
    throw badRequest(`${field} must be an array of strings`);
  }

  return value.map((item) => String(item).trim()).filter(Boolean);
}

export function asPositiveInteger(value: unknown, field: string, options?: { defaultValue?: number; min?: number }) {
  const parsed = Number(value ?? options?.defaultValue ?? 0);
  if (!Number.isInteger(parsed) || parsed < (options?.min ?? 1)) {
    throw badRequest(`${field} must be an integer greater than or equal to ${options?.min ?? 1}`);
  }
  return parsed;
}

export function asBoolean(value: unknown, field: string) {
  if (typeof value !== "boolean") {
    throw badRequest(`${field} must be a boolean`);
  }
  return value;
}
