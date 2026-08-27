export type AddressRecord = {
  id: string;
  label: string;
  line1: string;
  city: string;
  state: string;
  pinCode: string;
  landmark?: string;
  instructions?: string;
};

export type AppSettingsRecord = {
  notificationsEnabled: boolean;
  biometricLogin: boolean;
  darkMode: boolean;
  language: string;
};

export type UserRecord = {
  id: string;
  role: "patient" | "admin" | "pharmacist" | "delivery";
  name: string;
  email: string;
  phone: string;
  password: string;
  emailVerified: boolean;
  passwordResetOtp?: string;
  passwordResetOtpExpiresAt?: string;
  conditions: string[];
  medications: string[];
  allergies: string[];
  addresses: AddressRecord[];
  settings: AppSettingsRecord;
  createdAt: string;
  updatedAt: string;
};

export type CartItemRecord = {
  userId: string;
  medicineId: string;
  quantity: number;
};

export type OrderRecord = {
  id: string;
  userId: string;
  status: string;
  deliveryStage?: string;
  eta: string;
  items: string[];
  pharmacy: string;
  total: string;
  addressId: string;
  paymentMethod: string;
  paymentStatus?: "pending" | "authorized" | "paid" | "failed" | "cancelled" | "refunded";
  paymentReference?: string;
  paymentFailureReason?: string;
  createdAt: string;
  issueReported?: boolean;
  trackingTimeline?: Array<{
    stage: string;
    status: "completed" | "current" | "upcoming" | "issue";
    timestamp: string;
    description: string;
  }>;
  pharmacyDetails?: {
    rating: number;
    distanceKm: number;
    load: number;
  };
};

export type PrescriptionRecord = {
  id: string;
  userId: string;
  doctorName: string;
  patientName: string;
  status: string;
  ocrStatus?: string;
  ocrProvider?: string;
  medicines: string[];
  dosageSummary?: string[];
  notes?: string;
  confidence: string;
  sourceFileName?: string;
  sourceMimeType?: string;
  sourcePath?: string;
  extractedText?: string;
  validationIssues?: string[];
  createdAt: string;
};

export type NotificationRecord = {
  id: string;
  userId: string;
  icon: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
};

export type SymptomAssessmentRecord = {
  id: string;
  userId: string;
  symptoms: string[];
  duration: string;
  severity: number;
  notes: string;
  condition: string;
  confidence: string;
  createdAt: string;
};

export type ReconciliationRecord = {
  id: string;
  provider: "razorpay" | "stripe" | "cod" | string;
  providerEvent: string;
  providerReference?: string;
  payload: unknown;
  reconciledOrderId?: string | null;
  processedAt: string;
};

export type AppDatabase = {
  users: UserRecord[];
  orders: OrderRecord[];
  prescriptions: PrescriptionRecord[];
  cart: CartItemRecord[];
  notifications: NotificationRecord[];
  symptomAssessments: SymptomAssessmentRecord[];
  reconciliations?: ReconciliationRecord[];
  medicineStocks?: Record<string, "in_stock" | "out_of_stock" | "limited">;
  deliveryBaseCharge?: number;
  deliveryRatePerKm?: number;
};
