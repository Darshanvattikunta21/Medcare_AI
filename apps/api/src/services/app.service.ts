import { env } from "../config/env";
import { aiResult, categories, dashboardHighlights, featureModules, medicines, screenInventory } from "@medicare/core";
import {
  getCartDetailedDb,
  getCurrentUser as getCurrentUserDb,
  listPrescriptionsDb,
  listNotifications as listNotificationsDb,
  mapOrdersDb,
  toPublicUser as toPublicUserDb
} from "./database.service";
import { buildSnapshot, listNotifications, toPublicUser } from "./data.service";

export async function getAppSnapshot(userId?: string) {
  if (env.useDatabase) {
    const user = await getCurrentUserDb(userId);
    const resolvedUserId = user?.id ?? userId;
    const [cart, notifications, orders, prescriptions] = await Promise.all([
      getCartDetailedDb(resolvedUserId),
      resolvedUserId ? listNotificationsDb(resolvedUserId) : [],
      mapOrdersDb(resolvedUserId),
      listPrescriptionsDb(resolvedUserId)
    ]);

    return {
      highlights: dashboardHighlights,
      features: featureModules,
      categories,
      medicines,
      notifications,
      orders,
      profile: user ? toPublicUserDb(user) : null,
      prescriptions,
      cart,
      aiResult,
      screens: screenInventory
    };
  }

  const { db, user, cart } = buildSnapshot(userId);

  return {
    highlights: dashboardHighlights,
    features: featureModules,
    categories,
    medicines,
    notifications: listNotifications(user.id),
    orders: db.orders.filter((item) => item.userId === user.id),
    profile: toPublicUser(user),
    prescriptions: db.prescriptions.filter((item) => item.userId === user.id),
    cart,
    aiResult,
    screens: screenInventory
  };
}
