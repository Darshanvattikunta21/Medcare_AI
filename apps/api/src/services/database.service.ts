import {
  analyzeSymptomInput,
  categories,
  medicines,
  notifications as seedNotifications,
  orders as seedOrders,
  userProfile
} from "@medicare/core";
import type { Address, Notification, User } from "@prisma/client";
import { prisma } from "../lib/db";
import { hashPassword } from "../lib/auth";
import { validateSymptomAnalysisSummary } from "../lib/symptom-analyzer";
import { buildSafetyChecks } from "./medication-safety.service";
import { buildTrackingTimeline } from "./payment.service";
import { parsePrice, formatPrice, selectBestPharmacy } from "./data.service";

type PublicUser = Omit<
  User,
  | "password"
  | "passwordResetOtp"
  | "passwordResetOtpExpiresAt"
  | "notificationsEnabled"
  | "biometricLogin"
  | "darkMode"
  | "language"
> & {
  settings: {
    notificationsEnabled: boolean;
    biometricLogin: boolean;
    darkMode: boolean;
    language: string;
  };
};

type UserWithAddresses = User & { addresses: Address[] };

export async function ensureDatabaseSeeded() {
  const [existingMedicines, existingUsers] = await Promise.all([prisma.medicine.count(), prisma.user.count()]);

  if (existingMedicines === 0) {
    await prisma.medicine.createMany({
      data: medicines.map((item) => ({
        id: item.id,
        name: item.name,
        brand: item.brand,
        price: item.price,
        tag: item.tag,
        category: item.category,
        description: item.description,
        prescriptionRequired: item.tag.toLowerCase() === "rx",
        stockStatus: item.tag.toLowerCase() === "rx" ? "limited" : "in_stock"
      }))
    });
  }

  if (existingUsers > 0) {
    return;
  }

  const now = new Date();

  await prisma.user.create({
    data: {
      id: "user-1",
      role: "patient",
      name: userProfile.name,
      email: userProfile.email,
      phone: "+91 99999 00000",
      password: hashPassword("demo123"),
      emailVerified: true,
      conditions: userProfile.chronicConditions,
      medications: userProfile.currentMedications,
      allergies: userProfile.allergies,
      notificationsEnabled: true,
      biometricLogin: false,
      darkMode: false,
      language: "English",
      addresses: {
        create: {
          id: "addr-1",
          label: "Home",
          line1: "12 Lake View Residency",
          city: "Bengaluru",
          state: "Karnataka",
          pinCode: "560001",
          landmark: "Near Lakeside Park",
          instructions: "Call on arrival"
        }
      }
    }
  });

  await prisma.notification.createMany({
    data: seedNotifications.map((item, index) => ({
      id: item.id,
      userId: "user-1",
      icon: item.icon,
      title: item.title,
      message: item.message,
      time: item.time,
      read: false,
      createdAt: new Date(now.getTime() - index * 60_000),
      updatedAt: new Date(now.getTime() - index * 60_000)
    }))
  });

  await prisma.prescription.create({
    data: {
      id: "rx-1",
      userId: "user-1",
      doctorName: "Dr. Mehta",
      patientName: userProfile.name,
      status: "verified",
      ocrStatus: "completed",
      ocrProvider: "seed-data",
      medicines: medicines.slice(0, 2).map((item) => item.name),
      dosageSummary: ["Paracetamol 650mg after meals", "Cetirizine 10mg at night"],
      notes: "Continue medication after meals.",
      confidence: "91%",
      validationIssues: []
    } as any
  });

  await prisma.cartItem.createMany({
    data: medicines.slice(0, 2).map((item) => ({
      userId: "user-1",
      medicineId: item.id,
      quantity: 1
    }))
  });

  for (const [index, order] of seedOrders.entries()) {
    await prisma.order.create({
      data: {
        id: order.id,
        userId: "user-1",
        status: order.status,
        eta: order.eta,
        pharmacy: order.pharmacy,
        total: index === 0 ? "Rs 200" : "Rs 215",
        addressId: "addr-1",
        paymentMethod: "Razorpay",
        paymentStatus: "paid",
        paymentReference: `SEED-${index + 1}`,
        issueReported: false,
        deliveryStage: index === 0 ? "Out for delivery" : "Delivered",
        trackingTimeline: buildTrackingTimeline({
          createdAt: new Date(now.getTime() - index * 86_400_000),
          stage: index === 0 ? "Out for delivery" : "Delivered",
          paid: true
        }),
        createdAt: new Date(now.getTime() - index * 86_400_000),
        updatedAt: new Date(now.getTime() - index * 86_400_000),
        items: {
          create: order.items.map((name, itemIndex) => ({
            name,
            quantity: 1,
            medicineId: medicines.find((item) => name.toLowerCase().includes(item.name.toLowerCase()))?.id,
            prescriptionRequired: false,
            createdAt: new Date(now.getTime() - itemIndex * 60_000),
            updatedAt: new Date(now.getTime() - itemIndex * 60_000)
          }))
        }
      } as any
    });
  }
}

export function toPublicUser(user: UserWithAddresses): PublicUser & { addresses: Address[] } {
  const { password: _password, passwordResetOtp: _otp, passwordResetOtpExpiresAt: _otpExpiresAt, ...safeUser } = user;
  const {
    notificationsEnabled,
    biometricLogin,
    darkMode,
    language,
    ...publicFields
  } = safeUser;

  return {
    ...publicFields,
    settings: {
      notificationsEnabled,
      biometricLogin,
      darkMode,
      language
    }
  };
}

export async function getUserById(id: string) {
  await ensureDatabaseSeeded();
  return prisma.user.findUnique({
    where: { id },
    include: { addresses: { orderBy: { createdAt: "asc" } } }
  });
}

export async function getUserByEmail(email: string) {
  await ensureDatabaseSeeded();
  return prisma.user.findUnique({
    where: { email },
    include: { addresses: { orderBy: { createdAt: "asc" } } }
  });
}

export async function getPrimaryUser() {
  await ensureDatabaseSeeded();
  return prisma.user.findFirst({
    orderBy: { createdAt: "asc" },
    include: { addresses: { orderBy: { createdAt: "asc" } } }
  });
}

export async function getCurrentUser(userId?: string) {
  if (userId) {
    const user = await getUserById(userId);
    if (user) {
      return user;
    }
  }

  return getPrimaryUser();
}

export async function listNotifications(userId: string): Promise<Notification[]> {
  await ensureDatabaseSeeded();
  return prisma.notification.findMany({
    where: { userId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }]
  });
}

export async function addUserNotification(userId: string, title: string, message: string, icon = "package") {
  await ensureDatabaseSeeded();
  return prisma.notification.create({
    data: {
      userId,
      title,
      message,
      icon,
      time: "Just now",
      read: false
    }
  });
}

function enrichMedicine(item: {
  id: string;
  name: string;
  brand: string;
  price: string;
  tag: string;
  category: string;
  description: string;
  prescriptionRequired: boolean;
  stockStatus: string;
}) {
  return {
    ...item,
    prescriptionRequired: item.prescriptionRequired,
    stockStatus: item.stockStatus
  };
}

export function listCategoriesDb() {
  return categories;
}

export async function listMedicinesDb(filters?: {
  q?: string;
  category?: string;
  tag?: string;
  page?: number;
  limit?: number;
  sort?: "name" | "price-asc" | "price-desc";
}) {
  await ensureDatabaseSeeded();
  const q = String(filters?.q ?? "").trim().toLowerCase();
  const category = String(filters?.category ?? "").trim().toLowerCase();
  const tag = String(filters?.tag ?? "").trim().toLowerCase();
  const page = Math.max(1, Number(filters?.page ?? 1));
  const limit = Math.max(1, Math.min(50, Number(filters?.limit ?? 20)));

  let filtered = await prisma.medicine.findMany();
  filtered = filtered.filter((item) => {
    const matchesQuery =
      !q ||
      [item.name, item.brand, item.description, item.category, item.tag].some((field) => field.toLowerCase().includes(q));
    const matchesCategory = !category || item.category.toLowerCase() === category;
    const matchesTag = !tag || item.tag.toLowerCase() === tag;
    return matchesQuery && matchesCategory && matchesTag;
  });

  if (filters?.sort === "name") {
    filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
  }

  if (filters?.sort === "price-asc" || filters?.sort === "price-desc") {
    filtered = [...filtered].sort((a, b) => {
      const first = Number(a.price.replace(/[^0-9.]/g, ""));
      const second = Number(b.price.replace(/[^0-9.]/g, ""));
      return filters.sort === "price-asc" ? first - second : second - first;
    });
  }

  const total = filtered.length;
  const offset = (page - 1) * limit;

  return {
    items: filtered.slice(offset, offset + limit).map(enrichMedicine),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit))
    }
  };
}

export async function getMedicineDb(id: string) {
  await ensureDatabaseSeeded();
  const medicine = await prisma.medicine.findUnique({ where: { id } });
  return medicine ? enrichMedicine(medicine) : null;
}

export async function findMedicineDb(medicineId: string) {
  await ensureDatabaseSeeded();
  return prisma.medicine.findUnique({ where: { id: medicineId } });
}

export async function getCartDetailedDb(userId?: string) {
  await ensureDatabaseSeeded();
  const user = await getCurrentUser(userId);
  if (!user) {
    return {
      items: [],
      subtotal: "Rs 0",
      deliveryFee: "Rs 0",
      total: "Rs 0",
      itemCount: 0
    };
  }

  const cartItems = await prisma.cartItem.findMany({
    where: { userId: user.id },
    include: { medicine: true },
    orderBy: { createdAt: "asc" }
  });

  const items = cartItems.map((item) => {
    const unitPrice = parsePrice(item.medicine.price);
    return {
      medicineId: item.medicine.id,
      name: item.medicine.name,
      brand: item.medicine.brand,
      price: item.medicine.price,
      quantity: item.quantity,
      lineTotal: formatPrice(unitPrice * item.quantity),
      prescriptionRequired: item.medicine.prescriptionRequired
    };
  });

  const subtotal = items.reduce((sum, item) => sum + parsePrice(item.lineTotal), 0);
  let deliveryFee = 0;
  if (items.length > 0) {
    const selected = selectBestPharmacy(items);
    const distanceKm = selected.pharmacyDetails?.distanceKm ?? 2.0;
    deliveryFee = Math.round(20 + distanceKm * 5);
  }

  return {
    items,
    subtotal: formatPrice(subtotal),
    deliveryFee: formatPrice(deliveryFee),
    total: formatPrice(subtotal + deliveryFee),
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0)
  };
}

export async function mapOrdersDb(userId?: string) {
  await ensureDatabaseSeeded();
  const user = await getCurrentUser(userId);
  if (!user) {
    return [];
  }

  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    include: { items: { orderBy: { createdAt: "asc" } } },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }]
  });

  return orders.map((order: any) => ({
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
    trackingTimeline: Array.isArray(order.trackingTimeline) ? order.trackingTimeline : []
  }));
}

export async function getOrderDb(orderId: string, userId?: string) {
  const orders = await mapOrdersDb(userId);
  return orders.find((order) => order.id === orderId) ?? null;
}

export async function listPrescriptionsDb(userId?: string) {
  await ensureDatabaseSeeded();
  const user = await getCurrentUser(userId);
  if (!user) {
    return [];
  }

  const prescriptions = await prisma.prescription.findMany({
    where: { userId: user.id },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }]
  });

  return prescriptions.map((item: any) => ({
    id: item.id,
    doctorName: item.doctorName,
    patientName: item.patientName,
    status: item.status,
    medicines: item.medicines,
    ocrStatus: item.ocrStatus,
    ocrProvider: item.ocrProvider ?? undefined,
    dosageSummary: item.dosageSummary,
    notes: item.notes ?? undefined,
    confidence: item.confidence,
    createdAt: item.createdAt.toISOString(),
    sourceFileName: item.sourceFileName ?? undefined,
    sourceMimeType: item.sourceMimeType ?? undefined,
    sourcePath: item.sourcePath ?? undefined,
    extractedText: item.extractedText ?? undefined,
    validationIssues: item.validationIssues
  }));
}

export async function listAllPrescriptionsDb() {
  await ensureDatabaseSeeded();
  const prescriptions = await prisma.prescription.findMany({
    orderBy: [{ createdAt: "desc" }, { id: "desc" }]
  });

  return prescriptions.map((item: any) => ({
    id: item.id,
    userId: item.userId,
    doctorName: item.doctorName,
    patientName: item.patientName,
    status: item.status,
    ocrStatus: item.ocrStatus,
    ocrProvider: item.ocrProvider ?? undefined,
    medicines: item.medicines,
    dosageSummary: item.dosageSummary,
    notes: item.notes ?? undefined,
    confidence: item.confidence,
    createdAt: item.createdAt.toISOString(),
    sourceFileName: item.sourceFileName ?? undefined,
    sourceMimeType: item.sourceMimeType ?? undefined,
    sourcePath: item.sourcePath ?? undefined,
    extractedText: item.extractedText ?? undefined,
    validationIssues: item.validationIssues
  }));
}

export async function getPrescriptionDb(id: string, userId?: string) {
  const prescriptions = await listPrescriptionsDb(userId);
  return prescriptions.find((item) => item.id === id) ?? null;
}

export async function analyzeSymptomsDb(
  payload: {
    symptoms?: string[];
    duration?: string;
    severity?: number;
    notes?: string;
  },
  userId?: string
) {
  const startedAt = Date.now();
  await ensureDatabaseSeeded();
  const user = await getCurrentUser(userId);
  if (!user) {
    throw new Error("User not found");
  }

  console.info("[symptoms] db analyze request", {
    requestId: `sym-db-${startedAt}`,
    userId,
    payload: {
      symptoms: payload.symptoms ?? [],
      duration: payload.duration,
      severity: payload.severity,
      notesLength: payload.notes?.length ?? 0
    }
  });

  const analysis = analyzeSymptomInput(
    {
      symptoms: payload.symptoms,
      duration: payload.duration,
      severity: payload.severity,
      notes: payload.notes
    },
    {
      medications: user.medications,
      allergies: user.allergies
    }
  );

  const safetyChecks = buildSafetyChecks({
    recommendedMedicines: analysis.recommendedMedicines,
    currentMedications: user.medications,
    allergies: user.allergies,
    conditions: user.conditions
  });
  validateSymptomAnalysisSummary(analysis.analysis);

  await prisma.symptomAssessment.create({
    data: {
      userId: user.id,
      symptoms: analysis.input.symptoms ?? [],
      duration: analysis.input.duration ?? "2-3 days",
      severity: analysis.input.severity ?? 5,
      notes: analysis.input.notes ?? "",
      condition: analysis.result.condition,
      confidence: analysis.result.confidence
    }
  });

  await addUserNotification(
    user.id,
    "AI symptom assessment ready",
    `${analysis.result.condition} guidance has been generated.`,
    "ai"
  );

  const responsePayload = {
    ok: true,
    input: analysis.input,
    analysis: analysis.analysis,
    result: {
      ...analysis.result,
      safetyChecks
    },
    recommendedMedicines: analysis.recommendedMedicines
  };

  console.info("[symptoms] db analyze response", {
    requestId: `sym-db-${startedAt}`,
    durationMs: Date.now() - startedAt,
    condition: analysis.result.condition,
    confidence: analysis.analysis.confidence,
    detectedSymptoms: analysis.analysis.detectedSymptoms
  });

  return responsePayload;
}

export async function listSymptomAssessmentsDb(userId?: string) {
  await ensureDatabaseSeeded();
  const user = await getCurrentUser(userId);
  if (!user) {
    return [];
  }

  const assessments = await prisma.symptomAssessment.findMany({
    where: { userId: user.id },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }]
  });

  return assessments.map((item) => ({
    id: item.id,
    userId: item.userId,
    symptoms: item.symptoms,
    duration: item.duration,
    severity: item.severity,
    notes: item.notes,
    condition: item.condition,
    confidence: item.confidence,
    createdAt: item.createdAt.toISOString()
  }));
}
