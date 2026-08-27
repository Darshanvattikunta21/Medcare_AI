import { env } from "../config/env";
import { hashPassword, issueAuthToken, verifyPassword } from "../lib/auth";
import { badRequest } from "../lib/errors";
import { prisma } from "../lib/db";
import { readDb, writeDb } from "../lib/file-db";
import { asEmail, asTrimmedString } from "../lib/validation";
import type { UserRecord } from "../types";
import {
  addUserNotification as addUserNotificationDb,
  getCurrentUser as getCurrentUserDb,
  getUserByEmail,
  toPublicUser as toPublicUserDb
} from "./database.service";
import { addUserNotification, createAddress, getCurrentUser, toPublicUser } from "./data.service";

function nextOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function login(payload: { email?: string; password?: string }) {
  if (env.useDatabase) {
    const email = asEmail(payload.email);
    const password = asTrimmedString(payload.password, "password", { required: true, minLength: 6 });
    const user = await getUserByEmail(email);

    if (!user || !verifyPassword(password, user.password)) {
      throw badRequest("Invalid email or password");
    }

    await addUserNotificationDb(user.id, "Login detected", "Your MediCare AI account was accessed successfully.", "lock");

    return {
      ok: true,
      token: issueAuthToken(user.id),
      user: toPublicUserDb(user),
      message: "Login successful"
    };
  }

  const db = readDb();
  const email = asEmail(payload.email);
  const password = asTrimmedString(payload.password, "password", { required: true, minLength: 6 });
  const user = db.users.find((item) => item.email.toLowerCase() === email);

  if (!user || !verifyPassword(password, user.password)) {
    throw badRequest("Invalid email or password");
  }

  addUserNotification(user.id, "Login detected", "Your MediCare AI account was accessed successfully.", "lock");

  return {
    ok: true,
    token: issueAuthToken(user.id),
    user: toPublicUser(user),
    message: "Login successful"
  };
}

export async function signUp(payload: {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
  city?: string;
  state?: string;
  role?: string;
}) {
  if (env.useDatabase) {
    const name = asTrimmedString(payload.name, "name", { required: true, minLength: 2 });
    const email = asEmail(payload.email);
    const password = asTrimmedString(payload.password, "password", { required: true, minLength: 6 });
    const existingUser = await getUserByEmail(email);

    if (existingUser) {
      throw badRequest("An account with this email already exists");
    }

    const user = await prisma.user.create({
      data: {
        role: (payload.role === "admin" || payload.role === "pharmacist") ? payload.role : "patient",
        name,
        email,
        phone: asTrimmedString(payload.phone, "phone"),
        password: hashPassword(password),
        emailVerified: true,
        conditions: [],
        medications: [],
        allergies: [],
        notificationsEnabled: true,
        biometricLogin: false,
        darkMode: false,
        language: "English",
        addresses:
          payload.city || payload.state
            ? {
                create: {
                  label: "Home",
                  city: asTrimmedString(payload.city, "city"),
                  state: asTrimmedString(payload.state, "state"),
                  line1: "Update your address",
                  pinCode: ""
                }
              }
            : undefined
      },
      include: {
        addresses: {
          orderBy: { createdAt: "asc" }
        }
      }
    });

    await addUserNotificationDb(user.id, "Welcome to MediCare AI", `Account created for ${user.name}.`, "welcome");

    return {
      ok: true,
      token: issueAuthToken(user.id),
      user: toPublicUserDb(user),
      message: "Signup successful"
    };
  }

  const db = readDb();
  const name = asTrimmedString(payload.name, "name", { required: true, minLength: 2 });
  const email = asEmail(payload.email);
  const password = asTrimmedString(payload.password, "password", { required: true, minLength: 6 });

  if (db.users.some((item) => item.email.toLowerCase() === email)) {
    throw badRequest("An account with this email already exists");
  }

  const now = new Date().toISOString();
  const user: UserRecord = {
    id: `user-${db.users.length + 1}`,
    role: (payload.role === "admin" || payload.role === "pharmacist") ? payload.role : "patient",
    name,
    email,
    phone: asTrimmedString(payload.phone, "phone"),
    password: hashPassword(password),
    emailVerified: true,
    conditions: [],
    medications: [],
    allergies: [],
    addresses: [],
    settings: {
      notificationsEnabled: true,
      biometricLogin: false,
      darkMode: false,
      language: "English"
    },
    createdAt: now,
    updatedAt: now
  };

  if (payload.city || payload.state) {
    user.addresses.push(
      createAddress(
        {
          label: "Home",
          city: asTrimmedString(payload.city, "city"),
          state: asTrimmedString(payload.state, "state"),
          line1: "Update your address",
          pinCode: ""
        },
        user
      )
    );
  }

  db.users.unshift(user);
  writeDb(db);
  addUserNotification(user.id, "Welcome to MediCare AI", `Account created for ${user.name}.`, "welcome");

  return {
    ok: true,
    token: issueAuthToken(user.id),
    user: toPublicUser(user),
    message: "Signup successful"
  };
}

export async function forgotPassword(payload: { email?: string }) {
  if (env.useDatabase) {
    const email = asEmail(payload.email);
    const user = await getUserByEmail(email);

    if (!user) {
      throw badRequest("No account found for that email");
    }

    const otp = nextOtp();
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetOtp: otp,
        passwordResetOtpExpiresAt: new Date(Date.now() + 10 * 60 * 1000)
      }
    });

    return {
      ok: true,
      otp,
      message: "Password reset OTP generated for development mode"
    };
  }

  const db = readDb();
  const email = asEmail(payload.email);
  const user = db.users.find((item) => item.email.toLowerCase() === email);

  if (!user) {
    throw badRequest("No account found for that email");
  }

  user.passwordResetOtp = nextOtp();
  user.passwordResetOtpExpiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  user.updatedAt = new Date().toISOString();
  writeDb(db);

  return {
    ok: true,
    otp: user.passwordResetOtp,
    message: "Password reset OTP generated for development mode"
  };
}

export async function verifyOtp(payload: { email?: string; otp?: string }) {
  if (env.useDatabase) {
    const email = asEmail(payload.email);
    const otp = asTrimmedString(payload.otp, "otp", { required: true, minLength: 6 });
    const user = await getUserByEmail(email);

    if (!user || !user.passwordResetOtp || !user.passwordResetOtpExpiresAt) {
      throw badRequest("No pending OTP found for that email");
    }

    const isValid = user.passwordResetOtp === otp && new Date(user.passwordResetOtpExpiresAt).getTime() > Date.now();

    return {
      ok: isValid,
      message: isValid ? "OTP verified" : "Invalid OTP"
    };
  }

  const db = readDb();
  const email = asEmail(payload.email);
  const otp = asTrimmedString(payload.otp, "otp", { required: true, minLength: 6 });
  const user = db.users.find((item) => item.email.toLowerCase() === email);

  if (!user || !user.passwordResetOtp || !user.passwordResetOtpExpiresAt) {
    throw badRequest("No pending OTP found for that email");
  }

  const isValid = user.passwordResetOtp === otp && new Date(user.passwordResetOtpExpiresAt).getTime() > Date.now();

  return {
    ok: isValid,
    message: isValid ? "OTP verified" : "Invalid OTP"
  };
}

export async function resetPassword(payload: { email?: string; otp?: string; newPassword?: string }) {
  if (env.useDatabase) {
    const email = asEmail(payload.email);
    const otp = asTrimmedString(payload.otp, "otp", { required: true, minLength: 6 });
    const newPassword = asTrimmedString(payload.newPassword, "new password", { required: true, minLength: 6 });
    const user = await getUserByEmail(email);

    if (!user || !user.passwordResetOtp || !user.passwordResetOtpExpiresAt) {
      throw badRequest("No pending OTP found for that email");
    }

    const isValid = user.passwordResetOtp === otp && new Date(user.passwordResetOtpExpiresAt).getTime() > Date.now();

    if (!isValid) {
      throw badRequest("Invalid or expired OTP");
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashPassword(newPassword),
        passwordResetOtp: null,
        passwordResetOtpExpiresAt: null
      }
    });

    return { ok: true, message: "Password reset successfully" };
  }

  const db = readDb();
  const email = asEmail(payload.email);
  const otp = asTrimmedString(payload.otp, "otp", { required: true, minLength: 6 });
  const newPassword = asTrimmedString(payload.newPassword, "new password", { required: true, minLength: 6 });
  const user = db.users.find((item) => item.email.toLowerCase() === email);

  if (!user || !user.passwordResetOtp || !user.passwordResetOtpExpiresAt) {
    throw badRequest("No pending OTP found for that email");
  }

  const isValid = user.passwordResetOtp === otp && new Date(user.passwordResetOtpExpiresAt).getTime() > Date.now();

  if (!isValid) {
    throw badRequest("Invalid or expired OTP");
  }

  user.password = hashPassword(newPassword);
  user.passwordResetOtp = undefined;
  user.passwordResetOtpExpiresAt = undefined;
  user.updatedAt = new Date().toISOString();
  writeDb(db);

  return { ok: true, message: "Password reset successfully" };
}

export async function getAuthMe(userId?: string) {
  if (env.useDatabase) {
    const user = await getCurrentUserDb(userId);
    return user ? toPublicUserDb(user) : null;
  }

  return toPublicUser(getCurrentUser(userId));
}
