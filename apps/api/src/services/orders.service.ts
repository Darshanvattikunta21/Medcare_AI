import { env } from "../config/env";
import { prisma } from "../lib/db";
import { badRequest, notFound } from "../lib/errors";
import { readDb, writeDb } from "../lib/file-db";
import { asTrimmedString } from "../lib/validation";
import { addAddressDb, deleteAddressDb, listAddressesDb, updateAddressDb } from "./address.service";
import type { AddressRecord } from "../types";
import {
  addUserNotification as addUserNotificationDb,
  getCartDetailedDb,
  getCurrentUser as getCurrentUserDb,
  getOrderDb,
  mapOrdersDb
} from "./database.service";
import { buildTrackingTimeline, evaluatePayment } from "./payment.service";
import { addUserNotification, createAddress, createOrderFromCart, getCartDetailed, getCurrentUser, selectBestPharmacy } from "./data.service";

export async function listOrders(userId?: string) {
  if (env.useDatabase) {
    return mapOrdersDb(userId);
  }

  const db = readDb();
  const user = getCurrentUser(userId, db);
  return db.orders.filter((order) => order.userId === user.id);
}

export async function getOrder(orderId: string, userId?: string) {
  if (env.useDatabase) {
    return getOrderDb(orderId, userId);
  }

  const db = readDb();
  const user = getCurrentUser(userId, db);
  return db.orders.find((order) => order.id === orderId && order.userId === user.id) ?? null;
}

export async function updateOrderStatus(
  orderId: string,
  payload: {
    status?: string;
    deliveryStage?: string;
    paymentStatus?: "pending" | "authorized" | "paid" | "failed" | "cancelled" | "refunded";
    eta?: string;
  },
  userId?: string
) {
  const nextStatus = asTrimmedString(payload.status, "status");
  const nextStage = asTrimmedString(payload.deliveryStage, "deliveryStage");
  const nextEta = asTrimmedString(payload.eta, "eta");

  if (env.useDatabase) {
    const user = await getCurrentUserDb(userId);
    if (!user) {
      throw badRequest("User not found");
    }

    const existing: any = await prisma.order.findFirst({
      where: { id: orderId, userId: user.id },
      include: { items: { orderBy: { createdAt: "asc" } } }
    });

    if (!existing) {
      throw notFound("Order not found");
    }

    const paymentStatus = payload.paymentStatus ?? existing.paymentStatus;
    const deliveryStage = nextStage || existing.deliveryStage;
    const updated: any = await prisma.order.update({
      where: { id: existing.id },
      data: {
        status: nextStatus || existing.status,
        deliveryStage,
        eta: nextEta || existing.eta,
        paymentStatus,
        trackingTimeline: buildTrackingTimeline({
          createdAt: existing.createdAt,
          stage: deliveryStage,
          paid: paymentStatus === "paid" || paymentStatus === "authorized",
          issueReported: existing.issueReported
        })
      } as any,
      include: { items: { orderBy: { createdAt: "asc" } } }
    });

    await addUserNotificationDb(
      user.id,
      "Order status updated",
      `${updated.id} is now ${updated.deliveryStage ?? updated.status}.`,
      "package"
    );

    return {
      ok: true,
      order: {
        id: updated.id,
        userId: updated.userId,
        status: updated.status,
        eta: updated.eta,
        items: updated.items.map((item: any) => `${item.name} x${item.quantity}`),
        pharmacy: updated.pharmacy,
        total: updated.total,
        addressId: updated.addressId,
        paymentMethod: updated.paymentMethod,
        paymentStatus: updated.paymentStatus,
        paymentReference: updated.paymentReference ?? undefined,
        paymentFailureReason: updated.paymentFailureReason ?? undefined,
        createdAt: updated.createdAt.toISOString(),
        issueReported: updated.issueReported,
        deliveryStage: updated.deliveryStage,
        trackingTimeline: Array.isArray(updated.trackingTimeline) ? updated.trackingTimeline : []
      }
    };
  }

  const db = readDb();
  const user = getCurrentUser(userId, db);
  const order = db.orders.find((item) => item.id === orderId && item.userId === user.id);

  if (!order) {
    throw notFound("Order not found");
  }

  order.status = nextStatus || order.status;
  order.deliveryStage = nextStage || order.deliveryStage || order.status;
  order.eta = nextEta || order.eta;
  order.paymentStatus = payload.paymentStatus ?? order.paymentStatus;
  order.trackingTimeline = buildTrackingTimeline({
    createdAt: new Date(order.createdAt),
    stage: order.deliveryStage,
    paid: order.paymentStatus === "paid" || order.paymentStatus === "authorized",
    issueReported: order.issueReported
  });
  writeDb(db);

  return {
    ok: true,
    order
  };
}

export async function checkout(payload: { paymentMethod?: string; paymentSimulation?: "success" | "failure" | "cancel"; addressId?: string }, userId?: string) {
  if (env.useDatabase) {
    const user = await getCurrentUserDb(userId);
    if (!user) {
      throw badRequest("User not found");
    }

    const userCartItems = await prisma.cartItem.findMany({
      where: { userId: user.id },
      include: { medicine: true },
      orderBy: { createdAt: "asc" }
    });
    const cart = await getCartDetailedDb(user.id);

    if (userCartItems.length === 0) {
      throw badRequest("Your cart is empty");
    }

    const addressId = payload.addressId ?? user.addresses[0]?.id;
    if (!addressId) {
      throw badRequest("Please add a delivery address before checkout");
    }

    if (!user.addresses.some((address) => address.id === addressId)) {
      throw badRequest("Selected delivery address was not found");
    }

    const requiresPrescription = cart.items.some((item) => item.prescriptionRequired);
    const verifiedPrescriptions = await prisma.prescription.findMany({
      where: { userId: user.id, status: { equals: "verified", mode: "insensitive" } }
    });
    const hasVerifiedPrescription = verifiedPrescriptions.some((item) =>
      item.medicines.some((medicineName) =>
        cart.items.some((cartItem) => cartItem.name.toLowerCase() === medicineName.toLowerCase())
      )
    );

    if (requiresPrescription && !hasVerifiedPrescription) {
      throw badRequest("A verified prescription is required for one or more items in your cart");
    }

    const existingCount = await prisma.order.count();
    const payment = evaluatePayment(payload);
    const orderId = `MC-${String(4500 + existingCount + 1).padStart(6, "0")}`;

    const pharmacySelection = selectBestPharmacy(cart.items);
    const createdAt = new Date();
    const deliveryStage = payment.paymentStatus === "paid" || payment.paymentStatus === "authorized" ? "Confirmed" : "Awaiting payment";
    const order: any = await prisma.order.create({
      data: {
        id: orderId,
        userId: user.id,
        status: payment.paymentStatus === "failed" ? "Payment failed" : payment.paymentStatus === "cancelled" ? "Payment cancelled" : "Confirmed",
        deliveryStage,
        eta: pharmacySelection.eta,
        pharmacy: pharmacySelection.pharmacy,
        total: cart.total,
        addressId,
        paymentMethod: payment.paymentMethod,
        paymentStatus: payment.paymentStatus,
        paymentReference: payment.paymentReference,
        paymentFailureReason: payment.paymentFailureReason,
        issueReported: false,
        trackingTimeline: buildTrackingTimeline({
          createdAt,
          stage: deliveryStage,
          paid: payment.paymentStatus === "paid" || payment.paymentStatus === "authorized"
        }),
        items: {
          create: userCartItems.map((item) => ({
            medicineId: item.medicineId,
            name: item.medicine.name,
            quantity: item.quantity,
            unitPrice: item.medicine.price,
            lineTotal: cart.items.find((cartItem) => cartItem.medicineId === item.medicineId)?.lineTotal,
            prescriptionRequired: item.medicine.prescriptionRequired
          }))
        }
      } as any,
      include: { items: { orderBy: { createdAt: "asc" } } }
    });

    const orderResponse = {
      id: order.id,
      userId: order.userId,
      status: order.status,
      eta: order.eta,
      items: order.items.map((item: any) => `${item.name} x${item.quantity}`),
      pharmacy: order.pharmacy,
      total: order.total,
      addressId: order.addressId,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      paymentReference: order.paymentReference ?? undefined,
      paymentFailureReason: order.paymentFailureReason ?? undefined,
      createdAt: order.createdAt.toISOString(),
      issueReported: order.issueReported,
      deliveryStage: order.deliveryStage,
      trackingTimeline: Array.isArray(order.trackingTimeline) ? order.trackingTimeline : [],
      pharmacyDetails: pharmacySelection.pharmacyDetails
    };

    if (payment.paymentStatus === "paid" || payment.paymentStatus === "authorized") {
      await prisma.cartItem.deleteMany({
        where: { userId: user.id }
      });
      await addUserNotificationDb(
        user.id,
        "Order confirmed",
        `${orderResponse.id} has been routed to ${pharmacySelection.pharmacy} and will arrive in ${pharmacySelection.eta.replace("ETA ", "")}.`,
        "package"
      );
    } else {
      await addUserNotificationDb(
        user.id,
        "Payment action required",
        `${orderResponse.id} was created but checkout could not be completed: ${payment.paymentFailureReason ?? "payment pending"}.`,
        "warning"
      );
    }

    return {
      ok: payment.paymentStatus === "paid" || payment.paymentStatus === "authorized",
      order: orderResponse,
      paymentMethod: orderResponse.paymentMethod,
      message:
        payment.paymentStatus === "paid" || payment.paymentStatus === "authorized"
          ? "Order placed successfully"
          : payment.paymentFailureReason ?? "Payment is pending"
    };
  }

  const db = readDb();
  const user = getCurrentUser(userId, db);
  const userCartItems = db.cart.filter((item) => item.userId === user.id);
  const cart = getCartDetailed(db, user.id);

  if (userCartItems.length === 0) {
    throw badRequest("Your cart is empty");
  }

  const addressId = payload.addressId ?? user.addresses[0]?.id;
  if (!addressId) {
    throw badRequest("Please add a delivery address before checkout");
  }

  if (!user.addresses.some((address) => address.id === addressId)) {
    throw badRequest("Selected delivery address was not found");
  }

  const requiresPrescription = cart.items.some((item) => item.prescriptionRequired);
  const hasVerifiedPrescription = db.prescriptions.some(
    (item) =>
      item.userId === user.id &&
      item.status.toLowerCase() === "verified" &&
      item.medicines.some((medicineName) =>
        cart.items.some((cartItem) => cartItem.name.toLowerCase() === medicineName.toLowerCase())
      )
  );

  if (requiresPrescription && !hasVerifiedPrescription) {
    throw badRequest("A verified prescription is required for one or more items in your cart");
  }

  const selected = selectBestPharmacy(cart.items);
  const payment = evaluatePayment(payload);
  const order = createOrderFromCart({
    db,
    addressId,
    cartItems: userCartItems,
    paymentMethod: payment.paymentMethod,
    userId: user.id,
    pharmacy: selected.pharmacy,
    eta: selected.eta
  });
  order.paymentStatus = payment.paymentStatus;
  order.paymentReference = payment.paymentReference;
  order.paymentFailureReason = payment.paymentFailureReason;
  order.deliveryStage = payment.paymentStatus === "paid" || payment.paymentStatus === "authorized" ? "Confirmed" : "Awaiting payment";
  order.trackingTimeline = buildTrackingTimeline({
    createdAt: new Date(order.createdAt),
    stage: order.deliveryStage,
    paid: payment.paymentStatus === "paid" || payment.paymentStatus === "authorized"
  });
  order.status = payment.paymentStatus === "failed" ? "Payment failed" : payment.paymentStatus === "cancelled" ? "Payment cancelled" : order.status;

  db.orders.unshift(order);
  if (payment.paymentStatus === "paid" || payment.paymentStatus === "authorized") {
    db.cart = db.cart.filter((item) => item.userId !== user.id);
  }
  writeDb(db);
  addUserNotification(
    user.id,
    payment.paymentStatus === "paid" || payment.paymentStatus === "authorized" ? "Order confirmed" : "Payment action required",
    payment.paymentStatus === "paid" || payment.paymentStatus === "authorized"
      ? `${order.id} has been routed to ${selected.pharmacy} and will arrive in ${selected.eta.replace("ETA ", "")}.`
      : `${order.id} could not be finalized: ${payment.paymentFailureReason ?? "payment pending"}.`,
    payment.paymentStatus === "paid" || payment.paymentStatus === "authorized" ? "package" : "warning"
  );

  return {
    ok: payment.paymentStatus === "paid" || payment.paymentStatus === "authorized",
    order,
    paymentMethod: order.paymentMethod,
    message:
      payment.paymentStatus === "paid" || payment.paymentStatus === "authorized"
        ? "Order placed successfully"
        : payment.paymentFailureReason ?? "Payment is pending"
  };
}

export async function listAddresses(userId?: string) {
  if (env.useDatabase) {
    return listAddressesDb(userId);
  }

  const db = readDb();
  const user = getCurrentUser(userId, db);
  return user.addresses;
}

export async function addAddress(payload: Partial<AddressRecord>, userId?: string) {
  if (env.useDatabase) {
    return addAddressDb(payload, userId);
  }

  const db = readDb();
  const user = getCurrentUser(userId, db);
  const address = createAddress(payload, user);

  address.label = asTrimmedString(payload.label, "label") || address.label;
  address.line1 = asTrimmedString(payload.line1, "line1", { required: true, minLength: 5 });
  address.city = asTrimmedString(payload.city, "city", { required: true, minLength: 2 });
  address.state = asTrimmedString(payload.state, "state", { required: true, minLength: 2 });
  address.pinCode = asTrimmedString(payload.pinCode, "pinCode", { required: true, minLength: 4 });
  address.landmark = asTrimmedString(payload.landmark, "landmark");
  address.instructions = asTrimmedString(payload.instructions, "instructions");

  user.addresses.push(address);
  user.updatedAt = new Date().toISOString();
  writeDb(db);

  return address;
}

export async function updateAddress(addressId: string, payload: Partial<AddressRecord>, userId?: string) {
  if (env.useDatabase) {
    return updateAddressDb(addressId, payload, userId);
  }

  const db = readDb();
  const user = getCurrentUser(userId, db);
  const address = user.addresses.find((item) => item.id === addressId);

  if (!address) {
    throw notFound("Address not found");
  }

  address.label = asTrimmedString(payload.label, "label") || address.label;
  address.line1 = asTrimmedString(payload.line1, "line1") || address.line1;
  address.city = asTrimmedString(payload.city, "city") || address.city;
  address.state = asTrimmedString(payload.state, "state") || address.state;
  address.pinCode = asTrimmedString(payload.pinCode, "pinCode") || address.pinCode;
  address.landmark = asTrimmedString(payload.landmark, "landmark") || address.landmark;
  address.instructions = asTrimmedString(payload.instructions, "instructions") || address.instructions;
  user.updatedAt = new Date().toISOString();
  writeDb(db);

  return address;
}

export async function deleteAddress(addressId: string, userId?: string) {
  if (env.useDatabase) {
    return deleteAddressDb(addressId, userId);
  }

  const db = readDb();
  const user = getCurrentUser(userId, db);
  const before = user.addresses.length;
  user.addresses = user.addresses.filter((item) => item.id !== addressId);

  if (before === user.addresses.length) {
    throw notFound("Address not found");
  }

  user.updatedAt = new Date().toISOString();
  writeDb(db);

  return {
    ok: true
  };
}

export async function reportOrderIssue(orderId: string, payload: { reason?: string }, userId?: string) {
  if (env.useDatabase) {
    const user = await getCurrentUserDb(userId);
    if (!user) {
      return null;
    }

    const order: any = await prisma.order.findFirst({
      where: { id: orderId, userId: user.id },
      include: { items: { orderBy: { createdAt: "asc" } } }
    });

    if (!order) {
      return null;
    }

    const reason = asTrimmedString(payload.reason, "reason", { required: true, minLength: 5 });
    const updated: any = await prisma.order.update({
      where: { id: order.id },
      data: {
        issueReported: true,
        status: "Issue reported",
        deliveryStage: "Issue reported",
        trackingTimeline: buildTrackingTimeline({
          createdAt: order.createdAt,
          stage: "Issue reported",
          paid: order.paymentStatus === "paid" || order.paymentStatus === "authorized",
          issueReported: true
        })
      } as any,
      include: { items: { orderBy: { createdAt: "asc" } } }
    });
    await addUserNotificationDb(user.id, "Order issue recorded", `Issue reported for ${updated.id}: ${reason}.`, "warning");

    return {
      ok: true,
      order: {
        id: updated.id,
        userId: updated.userId,
        status: updated.status,
        eta: updated.eta,
        items: updated.items.map((item: any) => `${item.name} x${item.quantity}`),
        pharmacy: updated.pharmacy,
        total: updated.total,
        addressId: updated.addressId,
        paymentMethod: updated.paymentMethod,
        paymentStatus: updated.paymentStatus,
        paymentReference: updated.paymentReference ?? undefined,
        paymentFailureReason: updated.paymentFailureReason ?? undefined,
        createdAt: updated.createdAt.toISOString(),
        issueReported: updated.issueReported,
        deliveryStage: updated.deliveryStage,
        trackingTimeline: Array.isArray(updated.trackingTimeline) ? updated.trackingTimeline : []
      },
      message: "Order issue submitted"
    };
  }

  const db = readDb();
  const user = getCurrentUser(userId, db);
  const order = db.orders.find((item) => item.id === orderId && item.userId === user.id);

  if (!order) {
    return null;
  }

  const reason = asTrimmedString(payload.reason, "reason", { required: true, minLength: 5 });
  order.issueReported = true;
  order.status = "Issue reported";
  order.deliveryStage = "Issue reported";
  order.trackingTimeline = buildTrackingTimeline({
    createdAt: new Date(order.createdAt),
    stage: "Issue reported",
    paid: order.paymentStatus === "paid" || order.paymentStatus === "authorized",
    issueReported: true
  });
  writeDb(db);
  addUserNotification(user.id, "Order issue recorded", `Issue reported for ${order.id}: ${reason}.`, "warning");

  return {
    ok: true,
    order,
    message: "Order issue submitted"
  };
}
