import { env } from "../config/env";
import { prisma } from "../lib/db";
import { badRequest } from "../lib/errors";
import { readDb, writeDb } from "../lib/file-db";
import { asBoolean, asEmail, asOptionalStringArray, asTrimmedString } from "../lib/validation";
import {
  getCurrentUser as getCurrentUserDb,
  listNotifications as listNotificationsDb,
  toPublicUser as toPublicUserDb
} from "./database.service";
import { getCurrentUser, listNotifications, toPublicUser } from "./data.service";

export async function getProfile(userId?: string) {
  if (env.useDatabase) {
    const user = await getCurrentUserDb(userId);
    return user ? toPublicUserDb(user) : null;
  }

  return toPublicUser(getCurrentUser(userId));
}

export async function updateProfile(
  payload: {
    name?: string;
    email?: string;
    phone?: string;
    conditions?: string[];
    medications?: string[];
    allergies?: string[];
  },
  userId?: string
) {
  if (env.useDatabase) {
    const user = await getCurrentUserDb(userId);
    if (!user) {
      return null;
    }

    const nextEmail = payload.email ? asEmail(payload.email) : user.email;
    if (nextEmail !== user.email) {
      const emailOwner = await prisma.user.findUnique({ where: { email: nextEmail } });
      if (emailOwner && emailOwner.id !== user.id) {
        throw badRequest("An account with this email already exists");
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: asTrimmedString(payload.name, "name") || user.name,
        email: nextEmail,
        phone: asTrimmedString(payload.phone, "phone") || user.phone,
        conditions: asOptionalStringArray(payload.conditions, "conditions") ?? user.conditions,
        medications: asOptionalStringArray(payload.medications, "medications") ?? user.medications,
        allergies: asOptionalStringArray(payload.allergies, "allergies") ?? user.allergies
      },
      include: {
        addresses: {
          orderBy: { createdAt: "asc" }
        }
      }
    });

    return toPublicUserDb(updatedUser);
  }

  const db = readDb();
  const user = getCurrentUser(userId, db);

  user.name = asTrimmedString(payload.name, "name") || user.name;
  user.email = payload.email ? asEmail(payload.email) : user.email;
  user.phone = asTrimmedString(payload.phone, "phone") || user.phone;
  user.conditions = asOptionalStringArray(payload.conditions, "conditions") ?? user.conditions;
  user.medications = asOptionalStringArray(payload.medications, "medications") ?? user.medications;
  user.allergies = asOptionalStringArray(payload.allergies, "allergies") ?? user.allergies;
  user.updatedAt = new Date().toISOString();

  writeDb(db);
  return toPublicUser(user);
}

export async function getSettings(userId?: string) {
  if (env.useDatabase) {
    const user = await getCurrentUserDb(userId);
    if (!user) {
      return null;
    }

    return {
      notificationsEnabled: user.notificationsEnabled,
      biometricLogin: user.biometricLogin,
      darkMode: user.darkMode,
      language: user.language
    };
  }

  return getCurrentUser(userId).settings;
}

export async function updateSettings(
  payload: {
    notificationsEnabled?: boolean;
    biometricLogin?: boolean;
    darkMode?: boolean;
    language?: string;
  },
  userId?: string
) {
  if (env.useDatabase) {
    const user = await getCurrentUserDb(userId);
    if (!user) {
      return null;
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        notificationsEnabled:
          payload.notificationsEnabled === undefined
            ? user.notificationsEnabled
            : asBoolean(payload.notificationsEnabled, "notificationsEnabled"),
        biometricLogin:
          payload.biometricLogin === undefined
            ? user.biometricLogin
            : asBoolean(payload.biometricLogin, "biometricLogin"),
        darkMode: payload.darkMode === undefined ? user.darkMode : asBoolean(payload.darkMode, "darkMode"),
        language: asTrimmedString(payload.language, "language") || user.language
      }
    });

    return {
      notificationsEnabled: updatedUser.notificationsEnabled,
      biometricLogin: updatedUser.biometricLogin,
      darkMode: updatedUser.darkMode,
      language: updatedUser.language
    };
  }

  const db = readDb();
  const user = getCurrentUser(userId, db);

  user.settings = {
    notificationsEnabled:
      payload.notificationsEnabled === undefined
        ? user.settings.notificationsEnabled
        : asBoolean(payload.notificationsEnabled, "notificationsEnabled"),
    biometricLogin:
      payload.biometricLogin === undefined
        ? user.settings.biometricLogin
        : asBoolean(payload.biometricLogin, "biometricLogin"),
    darkMode:
      payload.darkMode === undefined ? user.settings.darkMode : asBoolean(payload.darkMode, "darkMode"),
    language: asTrimmedString(payload.language, "language") || user.settings.language
  };
  user.updatedAt = new Date().toISOString();
  writeDb(db);
  return user.settings;
}

export async function getNotifications(userId?: string) {
  if (env.useDatabase) {
    const user = await getCurrentUserDb(userId);
    if (!user) {
      return [];
    }

    return listNotificationsDb(user.id);
  }

  return listNotifications(userId);
}
