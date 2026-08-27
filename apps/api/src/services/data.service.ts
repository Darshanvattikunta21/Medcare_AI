import { medicines, notifications as seedNotifications } from "@medicare/core";
import { readDb, writeDb } from "../lib/file-db";
import type {
  AddressRecord,
  AppDatabase,
  CartItemRecord,
  NotificationRecord,
  OrderRecord,
  PrescriptionRecord,
  UserRecord
} from "../types";

export function getPrimaryUser(db?: AppDatabase): UserRecord {
  const resolvedDb = db ?? readDb();
  return resolvedDb.users[0];
}

export function getUserById(userId: string, db?: AppDatabase) {
  const resolvedDb = db ?? readDb();
  return resolvedDb.users.find((item) => item.id === userId) ?? null;
}

export function getCurrentUser(userId?: string, db?: AppDatabase) {
  if (!userId) {
    return getPrimaryUser(db);
  }

  return getUserById(userId, db) ?? getPrimaryUser(db);
}

export function toPublicUser(user: UserRecord) {
  const { password: _password, passwordResetOtp: _otp, passwordResetOtpExpiresAt: _otpExpiresAt, ...safeUser } = user;
  return safeUser;
}

export function findMedicine(medicineId: string) {
  return medicines.find((item) => item.id === medicineId) ?? null;
}

type PharmacyOffer = {
  name: string;
  distanceKm: number;
  rating: number;
  queueLoad: number;
};

function getPharmacyOffers() {
  return [
    { name: "CarePlus Pharmacy", distanceKm: 2.1, rating: 4.8, queueLoad: 11 },
    { name: "GreenLife Pharmacy", distanceKm: 3.4, rating: 4.7, queueLoad: 9 },
    { name: "Metro Meds", distanceKm: 1.8, rating: 4.5, queueLoad: 14 },
    { name: "HealthHub Pharmacy", distanceKm: 4.0, rating: 4.9, queueLoad: 7 },
    { name: "Neighborhood Pharmacy", distanceKm: 1.3, rating: 4.3, queueLoad: 18 }
  ] as const;
}

function scorePharmacy(offer: PharmacyOffer, hasPrescriptionItems: boolean) {
  const availabilityScore = hasPrescriptionItems ? 8 : 5;
  return (
    offer.rating * 18 +
    availabilityScore * 3 -
    offer.queueLoad * 1.4 -
    offer.distanceKm * 4.2
  );
}

export function selectBestPharmacy(items: Array<{ prescriptionRequired: boolean }>) {
  const hasPrescriptionItems = items.some((item) => item.prescriptionRequired);
  const candidate = getPharmacyOffers().reduce((best, current) => {
    const bestScore = scorePharmacy(best, hasPrescriptionItems);
    const currentScore = scorePharmacy(current, hasPrescriptionItems);
    return currentScore > bestScore ? current : best;
  });

  const etaMinutes = 20 + Math.round(candidate.distanceKm * 5) + Math.round(candidate.queueLoad / 2);
  return {
    pharmacy: candidate.name,
    eta: `ETA ${etaMinutes} mins`,
    pharmacyDetails: {
      rating: candidate.rating,
      distanceKm: candidate.distanceKm,
      load: candidate.queueLoad
    }
  };
}

export function parsePrice(price: string) {
  const amount = Number(price.replace(/[^0-9.]/g, ""));
  return Number.isFinite(amount) ? amount : 0;
}

export function formatPrice(amount: number) {
  return `Rs ${amount}`;
}

export function getCartDetailed(db?: AppDatabase, userId?: string) {
  const resolvedDb = db ?? readDb();
  const user = getCurrentUser(userId, resolvedDb);
  const cartItems = resolvedDb.cart.filter((item) => item.userId === user.id);

  const items = cartItems
    .map((item) => {
      const medicine = findMedicine(item.medicineId);
      if (!medicine) {
        return null;
      }

      const unitPrice = parsePrice(medicine.price);
      return {
        medicineId: medicine.id,
        name: medicine.name,
        brand: medicine.brand,
        price: medicine.price,
        quantity: item.quantity,
        lineTotal: formatPrice(unitPrice * item.quantity),
        prescriptionRequired: medicine.tag.toLowerCase() === "rx"
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  const subtotal = items.reduce((sum, item) => sum + parsePrice(item.lineTotal), 0);
  
  let deliveryFee = 0;
  if (items.length > 0) {
    const selected = selectBestPharmacy(items);
    const distanceKm = selected.pharmacyDetails?.distanceKm ?? 2.0;
    const base = typeof resolvedDb.deliveryBaseCharge === "number" ? resolvedDb.deliveryBaseCharge : 20;
    const rate = typeof resolvedDb.deliveryRatePerKm === "number" ? resolvedDb.deliveryRatePerKm : 5;
    deliveryFee = Math.round(base + distanceKm * rate);
  }

  return {
    items,
    subtotal: formatPrice(subtotal),
    deliveryFee: formatPrice(deliveryFee),
    total: formatPrice(subtotal + deliveryFee),
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0)
  };
}

export function addUserNotification(userId: string, title: string, message: string, icon = "package") {
  const db = readDb();
  const notification: NotificationRecord = {
    id: `n-${Date.now()}`,
    userId,
    title,
    message,
    icon,
    time: "Just now",
    read: false
  };

  db.notifications.unshift(notification);
  writeDb(db);
  return notification;
}

export function listNotifications(userId?: string) {
  const db = readDb();
  const user = getCurrentUser(userId, db);
  const notifications = db.notifications.filter((item) => item.userId === user.id);

  return notifications.length > 0
    ? notifications
    : seedNotifications.map((item) => ({ ...item, userId: user.id, read: false }));
}

export function buildSnapshot(userId?: string) {
  const db = readDb();
  const user = getCurrentUser(userId, db);
  const cart = getCartDetailed(db, user.id);

  return {
    db,
    user,
    cart
  };
}

export function createAddress(payload: Partial<AddressRecord>, user: UserRecord): AddressRecord {
  return {
    id: `addr-${user.addresses.length + 1}`,
    label: payload.label ?? "Saved",
    line1: payload.line1 ?? "",
    city: payload.city ?? "",
    state: payload.state ?? "",
    pinCode: payload.pinCode ?? "",
    landmark: payload.landmark ?? "",
    instructions: payload.instructions ?? ""
  };
}

export function createOrderFromCart(options: {
  addressId: string;
  cartItems: CartItemRecord[];
  paymentMethod: string;
  db: AppDatabase;
  userId: string;
  pharmacy?: string;
  eta?: string;
}): OrderRecord {
  const { addressId, cartItems, paymentMethod, db, userId, pharmacy, eta } = options;
  const detailed = getCartDetailed({ ...db, cart: cartItems }, userId);
  const selected: {
    pharmacy: string;
    eta: string;
    pharmacyDetails?: {
      rating: number;
      distanceKm: number;
      load: number;
    };
  } = pharmacy && eta
    ? { pharmacy, eta, pharmacyDetails: undefined }
    : selectBestPharmacy(detailed.items);

  return {
    id: `MC-${String(4500 + db.orders.length + 1).padStart(6, "0")}`,
    userId,
    status: "Confirmed",
    eta: selected.eta,
    items: detailed.items.map((item) => `${item.name} x${item.quantity}`),
    pharmacy: selected.pharmacy,
    total: detailed.total,
    addressId,
    paymentMethod,
    createdAt: new Date().toISOString(),
    issueReported: false,
    deliveryStage: "Confirmed",
    pharmacyDetails: selected.pharmacyDetails
  };
}

export function createPrescription(payload: {
  doctorName?: string;
  patientName?: string;
  notes?: string;
  medicines?: string[];
  confidence?: string;
  status?: string;
  userId: string;
  db: AppDatabase;
}): PrescriptionRecord {
  const { doctorName, patientName, notes, medicines: medicineNames, confidence, status, userId, db } = payload;

  return {
    id: `rx-${db.prescriptions.length + 1}`,
    userId,
    doctorName: doctorName ?? "Dr. Mehta",
    patientName: patientName ?? getCurrentUser(userId, db).name,
    status: status ?? "verified",
    medicines: medicineNames ?? medicines.slice(0, 3).map((item) => item.name),
    notes: notes ?? "",
    confidence: confidence ?? "91%",
    createdAt: new Date().toISOString()
  };
}
