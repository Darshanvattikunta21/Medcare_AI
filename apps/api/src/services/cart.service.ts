import { env } from "../config/env";
import { badRequest } from "../lib/errors";
import { readDb, writeDb } from "../lib/file-db";
import { asPositiveInteger, asTrimmedString } from "../lib/validation";
import { prisma } from "../lib/db";
import {
  addUserNotification as addUserNotificationDb,
  findMedicineDb,
  getCartDetailedDb,
  getCurrentUser as getCurrentUserDb
} from "./database.service";
import { addUserNotification, findMedicine, getCartDetailed, getCurrentUser } from "./data.service";

export async function getCart(userId?: string) {
  if (env.useDatabase) {
    return getCartDetailedDb(userId);
  }

  return getCartDetailed(undefined, userId);
}

export async function addCartItem(payload: { medicineId?: string; quantity?: number }, userId?: string) {
  const medicineId = asTrimmedString(payload.medicineId, "medicineId", { required: true });
  const quantity = asPositiveInteger(payload.quantity, "quantity", { defaultValue: 1, min: 1 });

  if (env.useDatabase) {
    const medicine = await findMedicineDb(medicineId);
    if (!medicine) {
      throw badRequest("Medicine not found");
    }

    const user = await getCurrentUserDb(userId);
    if (!user) {
      throw badRequest("User not found");
    }

    const existing = await prisma.cartItem.findUnique({
      where: {
        userId_medicineId: {
          userId: user.id,
          medicineId
        }
      }
    });

    if (existing) {
      await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + quantity }
      });
    } else {
      await prisma.cartItem.create({
        data: { userId: user.id, medicineId, quantity }
      });
    }

    await addUserNotificationDb(user.id, "Cart updated", `${medicine.name} added to your cart.`, "cart");
    return {
      ok: true,
      cart: await getCartDetailedDb(user.id)
    };
  }

  if (!findMedicine(medicineId)) {
    throw badRequest("Medicine not found");
  }

  const db = readDb();
  const user = getCurrentUser(userId, db);
  const existing = db.cart.find((item) => item.userId === user.id && item.medicineId === medicineId);

  if (existing) {
    existing.quantity += quantity;
  } else {
    db.cart.push({ userId: user.id, medicineId, quantity });
  }

  writeDb(db);
  const medicine = findMedicine(medicineId)!;
  addUserNotification(user.id, "Cart updated", `${medicine.name} added to your cart.`, "cart");

  return {
    ok: true,
    cart: getCartDetailed(db, user.id)
  };
}

export async function updateCartItem(medicineId: string, payload: { quantity?: number }, userId?: string) {
  if (env.useDatabase) {
    const user = await getCurrentUserDb(userId);
    if (!user) {
      return null;
    }

    const item = await prisma.cartItem.findUnique({
      where: {
        userId_medicineId: {
          userId: user.id,
          medicineId
        }
      }
    });

    if (!item) {
      return null;
    }

    const quantity = Number(payload.quantity ?? item.quantity);
    if (quantity <= 0) {
      await prisma.cartItem.delete({ where: { id: item.id } });
    } else {
      await prisma.cartItem.update({
        where: { id: item.id },
        data: { quantity }
      });
    }

    return {
      ok: true,
      cart: await getCartDetailedDb(user.id)
    };
  }

  const db = readDb();
  const user = getCurrentUser(userId, db);
  const item = db.cart.find((entry) => entry.userId === user.id && entry.medicineId === medicineId);

  if (!item) {
    return null;
  }

  const quantity = Number(payload.quantity ?? item.quantity);
  if (quantity <= 0) {
    db.cart = db.cart.filter((entry) => !(entry.userId === user.id && entry.medicineId === medicineId));
  } else {
    item.quantity = quantity;
  }

  writeDb(db);

  return {
    ok: true,
    cart: getCartDetailed(db, user.id)
  };
}

export async function removeCartItem(medicineId: string, userId?: string) {
  if (env.useDatabase) {
    const user = await getCurrentUserDb(userId);
    if (!user) {
      return null;
    }

    const item = await prisma.cartItem.findUnique({
      where: {
        userId_medicineId: {
          userId: user.id,
          medicineId
        }
      }
    });

    if (!item) {
      return null;
    }

    await prisma.cartItem.delete({ where: { id: item.id } });
    return {
      ok: true,
      cart: await getCartDetailedDb(user.id)
    };
  }

  const db = readDb();
  const user = getCurrentUser(userId, db);
  const before = db.cart.length;
  db.cart = db.cart.filter((item) => !(item.userId === user.id && item.medicineId === medicineId));

  if (db.cart.length === before) {
    return null;
  }

  writeDb(db);
  return {
    ok: true,
    cart: getCartDetailed(db, user.id)
  };
}

export async function clearCart(userId?: string) {
  if (env.useDatabase) {
    const user = await getCurrentUserDb(userId);
    if (!user) {
      return {
        ok: true,
        cart: await getCartDetailedDb(userId)
      };
    }

    await prisma.cartItem.deleteMany({
      where: { userId: user.id }
    });

    return {
      ok: true,
      cart: await getCartDetailedDb(user.id)
    };
  }

  const db = readDb();
  const user = getCurrentUser(userId, db);
  db.cart = db.cart.filter((item) => item.userId !== user.id);
  writeDb(db);

  return {
    ok: true,
    cart: getCartDetailed(db, user.id)
  };
}
