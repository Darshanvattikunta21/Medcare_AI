import fs from "node:fs";
import path from "node:path";
import { notifications as seedNotifications, userProfile } from "@medicare/core";
import { env } from "../config/env";
import { hashPassword } from "./auth";
import { createSeedDatabase } from "../seed";
import type { AppDatabase, AppSettingsRecord, CartItemRecord, NotificationRecord, UserRecord } from "../types";

function ensureDataFile() {
  const dir = path.dirname(env.dataFile);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(env.dataFile)) {
    fs.writeFileSync(env.dataFile, JSON.stringify(createSeedDatabase(), null, 2), "utf8");
  }
}

function defaultSettings(settings?: Partial<AppSettingsRecord>): AppSettingsRecord {
  return {
    notificationsEnabled: settings?.notificationsEnabled ?? true,
    biometricLogin: settings?.biometricLogin ?? false,
    darkMode: settings?.darkMode ?? false,
    language: settings?.language ?? "English"
  };
}

function normalizeUser(user?: Partial<UserRecord>): UserRecord {
  const now = new Date().toISOString();
  const password = user?.password ?? "demo123";

  return {
    id: user?.id ?? "user-1",
    role: user?.role ?? "patient",
    name: user?.name ?? userProfile.name,
    email: user?.email ?? userProfile.email,
    phone: user?.phone ?? "+91 99999 00000",
    password: password.startsWith("scrypt:") ? password : hashPassword(password),
    emailVerified: user?.emailVerified ?? true,
    passwordResetOtp: user?.passwordResetOtp,
    passwordResetOtpExpiresAt: user?.passwordResetOtpExpiresAt,
    conditions: user?.conditions ?? userProfile.chronicConditions,
    medications: user?.medications ?? userProfile.currentMedications,
    allergies: user?.allergies ?? userProfile.allergies,
    addresses: user?.addresses ?? [],
    settings: defaultSettings(user?.settings),
    createdAt: user?.createdAt ?? now,
    updatedAt: user?.updatedAt ?? now
  };
}

function normalizeCart(cart?: unknown): CartItemRecord[] {
  if (!Array.isArray(cart)) {
    return [];
  }

  return cart
    .map((item) => {
      if (typeof item === "string") {
        return { userId: "user-1", medicineId: item, quantity: 1 };
      }

      if (item && typeof item === "object" && "medicineId" in item) {
        const cartItem = item as Partial<CartItemRecord>;
        return {
          userId: String(cartItem.userId ?? "user-1"),
          medicineId: String(cartItem.medicineId ?? ""),
          quantity: Math.max(1, Number(cartItem.quantity ?? 1))
        };
      }

      return null;
    })
    .filter((item): item is CartItemRecord => Boolean(item?.medicineId));
}

function normalizeNotifications(notifications?: NotificationRecord[]): NotificationRecord[] {
  if (!Array.isArray(notifications) || notifications.length === 0) {
    return seedNotifications.map((item) => ({ ...item, userId: "user-1", read: false }));
  }

  return notifications.map((item) => ({
    ...item,
    userId: item.userId ?? "user-1",
    read: item.read ?? false
  }));
}

function normalizeDb(db: Partial<AppDatabase>): AppDatabase {
  return {
    users: Array.isArray(db.users) && db.users.length > 0 ? db.users.map((item) => normalizeUser(item)) : [normalizeUser()],
    orders: Array.isArray(db.orders) ? db.orders.map((item) => ({ ...item, userId: item.userId ?? "user-1" })) : [],
    prescriptions: Array.isArray(db.prescriptions)
      ? db.prescriptions.map((item) => ({ ...item, userId: item.userId ?? "user-1" }))
      : [],
    cart: normalizeCart(db.cart),
    notifications: normalizeNotifications(db.notifications),
    symptomAssessments: Array.isArray(db.symptomAssessments)
      ? db.symptomAssessments.map((item) => ({ ...item, userId: item.userId ?? "user-1" }))
      : [],
    medicineStocks: db.medicineStocks ?? {},
    deliveryBaseCharge: typeof db.deliveryBaseCharge === "number" ? db.deliveryBaseCharge : 20,
    deliveryRatePerKm: typeof db.deliveryRatePerKm === "number" ? db.deliveryRatePerKm : 5
  };
}

export function readDb(): AppDatabase {
  ensureDataFile();
  const raw = fs.readFileSync(env.dataFile, "utf8");
  return normalizeDb(JSON.parse(raw) as Partial<AppDatabase>);
}

export function writeDb(nextDb: AppDatabase) {
  ensureDataFile();
  fs.writeFileSync(env.dataFile, JSON.stringify(normalizeDb(nextDb), null, 2), "utf8");
}
