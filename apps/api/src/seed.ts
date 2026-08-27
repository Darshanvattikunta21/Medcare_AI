import { medicines, notifications as seedNotifications, orders as seedOrders, userProfile } from "@medicare/core";
import type { AppDatabase } from "./types";

export function createSeedDatabase(): AppDatabase {
  const now = new Date().toISOString();

  return {
    users: [
      {
        id: "user-1",
        role: "patient",
        name: userProfile.name,
        email: userProfile.email,
        phone: "+91 99999 00000",
        password: "demo123",
        emailVerified: true,
        conditions: userProfile.chronicConditions,
        medications: userProfile.currentMedications,
        allergies: userProfile.allergies,
        addresses: [
          {
            id: "addr-1",
            label: "Home",
            line1: "12 Lake View Residency",
            city: "Bengaluru",
            state: "Karnataka",
            pinCode: "560001",
            landmark: "Near Lakeside Park",
            instructions: "Call on arrival"
          }
        ],
        settings: {
          notificationsEnabled: true,
          biometricLogin: false,
          darkMode: false,
          language: "English"
        },
        createdAt: now,
        updatedAt: now
      },
      {
        id: "user-2",
        role: "pharmacist",
        name: "Pharma Owner",
        email: "pharma@email.com",
        phone: "+91 99999 11111",
        password: "demo123",
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
      }
    ],
    orders: seedOrders.map((order, index) => ({
      id: order.id,
      userId: "user-1",
      status: order.status,
      eta: order.eta,
      items: order.items,
      pharmacy: order.pharmacy,
      total: index === 0 ? "Rs 200" : "Rs 215",
      addressId: "addr-1",
      paymentMethod: "Razorpay",
      createdAt: new Date(Date.now() - index * 86400000).toISOString(),
      issueReported: false
    })),
    prescriptions: [
      {
        id: "rx-1",
        userId: "user-1",
        doctorName: "Dr. Mehta",
        patientName: userProfile.name,
        status: "verified",
        medicines: medicines.slice(0, 2).map((item) => item.name),
        notes: "Continue medication after meals.",
        confidence: "91%",
        createdAt: now
      }
    ],
    cart: medicines.slice(0, 2).map((item) => ({
      userId: "user-1",
      medicineId: item.id,
      quantity: 1
    })),
    notifications: seedNotifications.map((item) => ({
      ...item,
      userId: "user-1",
      read: false
    })),
    symptomAssessments: []
  };
}
