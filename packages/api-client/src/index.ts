import {
  aiResult,
  categories,
  dashboardHighlights,
  featureModules,
  medicines,
  notifications,
  orders,
  screenInventory,
  userProfile
} from "@medicare/core";
import type { SymptomAnalysisSummary } from "@medicare/core/src/index";

export type ProfileAddress = {
  id: string;
  label: string;
  line1: string;
  city: string;
  state: string;
  pinCode: string;
  landmark?: string;
  instructions?: string;
};

export type ProfileSettings = {
  notificationsEnabled: boolean;
  biometricLogin: boolean;
  darkMode: boolean;
  language: string;
};

export type ProfileData = {
  id?: string;
  role?: string;
  name: string;
  email: string;
  phone?: string;
  conditions?: string[];
  medications?: string[];
  allergies?: string[];
  addresses?: ProfileAddress[];
  settings?: ProfileSettings;
};

export type PaymentProviderData = {
  id: "razorpay" | "stripe" | "cod";
  label: string;
  enabled: boolean;
  mode: "test" | "live" | "offline";
  publishableKey?: string;
  currency: string;
  notes: string[];
};

export type PrescriptionData = {
  id: string;
  doctorName: string;
  patientName: string;
  status: string;
  ocrStatus?: string;
  ocrProvider?: string;
  medicines: string[];
  dosageSummary?: string[];
  notes?: string;
  confidence: string;
  createdAt: string;
  sourceFileName?: string;
  sourceMimeType?: string;
  sourcePath?: string;
  extractedText?: string;
  validationIssues?: string[];
};

export type CartData = {
  items: Array<{
    medicineId: string;
    name: string;
    brand: string;
    price: string;
    quantity: number;
    lineTotal: string;
    prescriptionRequired: boolean;
  }>;
  subtotal: string;
  deliveryFee: string;
  total: string;
  itemCount: number;
};

export type AppSnapshot = {
  highlights: typeof dashboardHighlights;
  features: typeof featureModules;
  categories: typeof categories;
  medicines: typeof medicines;
  notifications: Array<{
    id: string;
    icon: string;
    title: string;
    message: string;
    time: string;
    read?: boolean;
  }>;
  orders: Array<{
    id: string;
    status: string;
    deliveryStage?: string;
    eta: string;
    items: string[];
    pharmacy: string;
    total?: string;
    paymentMethod?: string;
    paymentStatus?: string;
    paymentReference?: string;
    paymentFailureReason?: string;
    createdAt?: string;
    trackingTimeline?: Array<{
      stage: string;
      status: string;
      timestamp: string;
      description: string;
    }>;
  }>;
  profile: ProfileData;
  prescriptions: PrescriptionData[];
  cart: CartData;
  aiResult: typeof aiResult;
  screens: typeof screenInventory;
};

type RequestOptions = RequestInit & {
  fallback?: unknown;
  baseUrl?: string;
  timeoutMs?: number;
};

type AuthResponse = {
  ok: boolean;
  token?: string;
  user?: ProfileData;
  message: string;
};

const AUTH_TOKEN_KEY = "medicare-ai-auth-token";
let memoryAuthToken: string | null = null;

// Runtime-overridable API base URL — set at app startup from expo-constants
let memoryBaseUrl: string | null = null;

/**
 * Override the API base URL at runtime. Call this at app startup in _layout.tsx
 * so the correct LAN IP is always used in dev, regardless of .env staleness.
 */
export function setApiBaseUrl(url: string | null) {
  memoryBaseUrl = url;
}

export function getApiBaseUrl(): string {
  return resolveBaseUrl();
}

type WebStorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

export class ApiClientError extends Error {
  status?: number;
  code?: string;

  constructor(message: string, options?: { status?: number; code?: string }) {
    super(message);
    this.name = "ApiClientError";
    this.status = options?.status;
    this.code = options?.code;
  }
}

const fallbackCart: CartData = {
  items: medicines.slice(0, 2).map((item) => ({
    medicineId: item.id,
    name: item.name,
    brand: item.brand,
    price: item.price,
    quantity: 1,
    lineTotal: item.price,
    prescriptionRequired: item.tag.toLowerCase() === "rx"
  })),
  subtotal: "Rs 150",
  deliveryFee: "Rs 30",
  total: "Rs 180",
  itemCount: 2
};

const fallbackSnapshot: AppSnapshot = {
  highlights: dashboardHighlights,
  features: featureModules,
  categories,
  medicines,
  notifications,
  orders,
  profile: {
    name: userProfile.name,
    email: userProfile.email,
    phone: "+91 99999 00000",
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
        pinCode: "560001"
      }
    ],
    settings: {
      notificationsEnabled: true,
      biometricLogin: false,
      darkMode: false,
      language: "English"
    }
  },
  prescriptions: [
    {
      id: "rx-1",
      doctorName: "Dr. Mehta",
      patientName: userProfile.name,
      status: "verified",
      medicines: medicines.slice(0, 2).map((item) => item.name),
      notes: "Continue medication after meals.",
      confidence: "91%",
      createdAt: new Date().toISOString()
    }
  ],
  cart: fallbackCart,
  aiResult,
  screens: screenInventory
};

function resolveBaseUrl(explicit?: string) {
  if (explicit) return explicit;
  // Runtime override takes highest priority (set via setApiBaseUrl in _layout.tsx)
  if (memoryBaseUrl) return memoryBaseUrl;
  if (typeof process !== "undefined") {
    if (process.env.NEXT_PUBLIC_API_BASE_URL) return process.env.NEXT_PUBLIC_API_BASE_URL;
    if (process.env.EXPO_PUBLIC_API_BASE_URL) return process.env.EXPO_PUBLIC_API_BASE_URL;
    if (process.env.API_BASE_URL) return process.env.API_BASE_URL;
  }
  const globalScope = globalThis as { window?: unknown; document?: unknown };
  if (typeof globalScope.window !== "undefined" && typeof globalScope.document !== "undefined") {
    return "";
  }
  return "http://localhost:4000";
}

function getBrowserStorage() {
  const globalWindow = globalThis as { localStorage?: WebStorageLike };
  return typeof globalWindow.localStorage !== "undefined" ? globalWindow.localStorage : null;
}

function canUseBrowserStorage() {
  return getBrowserStorage() !== null;
}

export function getAuthToken() {
  if (memoryAuthToken) {
    return memoryAuthToken;
  }

  if (canUseBrowserStorage()) {
    const token = getBrowserStorage()?.getItem(AUTH_TOKEN_KEY) ?? null;
    memoryAuthToken = token;
    return token;
  }

  return null;
}

export function setAuthToken(token: string | null) {
  memoryAuthToken = token;

  if (canUseBrowserStorage()) {
    if (token) {
      getBrowserStorage()?.setItem(AUTH_TOKEN_KEY, token);
    } else {
      getBrowserStorage()?.removeItem(AUTH_TOKEN_KEY);
    }
  }
}

export function clearAuthToken() {
  setAuthToken(null);
}

export function getFallbackSnapshot() {
  return fallbackSnapshot;
}

function toErrorMessage(error: unknown, fallback = "Something went wrong") {
  return error instanceof Error ? error.message : fallback;
}

async function requestJson<T>(path: string, options?: RequestOptions): Promise<T> {
  const url = `${resolveBaseUrl(options?.baseUrl)}${path}`;
  const fallback = options?.fallback as T | undefined;
  const token = getAuthToken();
  const timeoutMs = options?.timeoutMs ?? 10000;
  const abortController = new AbortController();
  const signal = options?.signal ?? abortController.signal;

  const timeoutHandle = setTimeout(() => abortController.abort(), timeoutMs);

  try {
    const startedAt = Date.now();
    const response = await fetch(url, {
      ...options,
      signal,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options?.headers ?? {})
      }
    });

    clearTimeout(timeoutHandle);
    console.info("[api-client] response", {
      method: options?.method ?? "GET",
      path,
      status: response.status,
      durationMs: Date.now() - startedAt
    });

    const contentType = response.headers.get("content-type") ?? "";
    let json: Record<string, unknown> | null = null;
    if (contentType.includes("application/json")) {
      try {
        json = (await response.json()) as Record<string, unknown>;
      } catch (parseError) {
        throw new ApiClientError("Unable to parse API response", {
          status: response.status,
          code: "invalid_json"
        });
      }
    }

    if (!response.ok) {
      const message = typeof json?.error === "string" ? json.error : `Request failed: ${response.status}`;
      throw new ApiClientError(message, {
        status: response.status,
        code: typeof json?.code === "string" ? (json.code as string) : undefined
      });
    }

    if (!json) {
      throw new ApiClientError("API response was empty or not JSON", {
        status: response.status,
        code: "invalid_response"
      });
    }

    return json as T;
  } catch (error) {
    clearTimeout(timeoutHandle);

    if (error instanceof Error && error.name === "AbortError") {
      const timeoutError = new ApiClientError("Request timed out", { status: 408, code: "timeout" });
      if (fallback !== undefined) {
        return fallback;
      }
      throw timeoutError;
    }

    if (fallback !== undefined && !(error instanceof ApiClientError)) {
      return fallback;
    }

    console.error("[api-client] request failed", {
      method: options?.method ?? "GET",
      path,
      message: toErrorMessage(error)
    });
    throw error;
  }
}

export async function fetchAppSnapshot(baseUrl?: string) {
  return requestJson<AppSnapshot>("/api/app/snapshot", { fallback: fallbackSnapshot, baseUrl });
}

export async function fetchCatalog(filters?: {
  q?: string;
  category?: string;
  tag?: string;
  page?: number;
  limit?: number;
  sort?: "name" | "price-asc" | "price-desc";
  includeMeta?: boolean;
  baseUrl?: string;
}) {
  const params = new URLSearchParams();
  if (filters?.q) params.set("q", filters.q);
  if (filters?.category) params.set("category", filters.category);
  if (filters?.tag) params.set("tag", filters.tag);
  if (filters?.page) params.set("page", String(filters.page));
  if (filters?.limit) params.set("limit", String(filters.limit));
  if (filters?.sort) params.set("sort", filters.sort);
  if (filters?.includeMeta) params.set("includeMeta", "true");

  const suffix = params.toString() ? `?${params.toString()}` : "";
  return requestJson<typeof medicines>(`/api/catalog/medicines${suffix}`, {
    fallback: medicines,
    baseUrl: filters?.baseUrl
  });
}

export async function fetchCategories(baseUrl?: string) {
  return requestJson<typeof categories>("/api/catalog/categories", { fallback: categories, baseUrl });
}

export async function fetchMedicine(id: string, baseUrl?: string) {
  return requestJson<(typeof medicines)[number]>(`/api/catalog/medicines/${id}`, {
    fallback: medicines.find((item) => item.id === id) ?? medicines[0],
    baseUrl
  });
}

export async function fetchOrders(baseUrl?: string) {
  return requestJson<AppSnapshot["orders"]>("/api/orders", { fallback: orders, baseUrl });
}

export async function fetchOrder(id: string, baseUrl?: string) {
  return requestJson<AppSnapshot["orders"][number]>(`/api/orders/${id}`, {
    fallback: orders.find((o) => o.id === id) ?? orders[0],
    baseUrl
  });
}

export async function fetchProfile(baseUrl?: string) {
  return requestJson<ProfileData>("/api/profile", { baseUrl });
}

export async function fetchCurrentUser(baseUrl?: string) {
  return requestJson<ProfileData>("/api/auth/me", { baseUrl });
}

export async function updateProfile(payload: Record<string, unknown>, baseUrl?: string) {
  return requestJson<ProfileData>("/api/profile", {
    method: "PUT",
    body: JSON.stringify(payload),
    fallback: {
      ...fallbackSnapshot.profile,
      ...payload
    },
    baseUrl
  });
}

export async function fetchNotifications(baseUrl?: string) {
  return requestJson<AppSnapshot["notifications"]>("/api/profile/notifications", { baseUrl });
}

export async function fetchPrescriptions(baseUrl?: string) {
  return requestJson<PrescriptionData[]>("/api/prescriptions", { baseUrl });
}

export function getPrescriptionFileUrl(prescriptionId: string, baseUrl?: string) {
  return `${resolveBaseUrl(baseUrl)}/api/prescriptions/${prescriptionId}/file`;
}

export async function fetchPrescriptionReviewQueue(baseUrl?: string) {
  return requestJson<PrescriptionData[]>("/api/prescriptions/review-queue", { baseUrl });
}

export async function updatePrescriptionStatus(
  prescriptionId: string,
  payload: { status?: string; notes?: string },
  baseUrl?: string
) {
  return requestJson<PrescriptionData>(`/api/prescriptions/${prescriptionId}/status`, {
    method: "PATCH",
    body: JSON.stringify(payload),
    baseUrl
  });
}

export type SymptomSafetyCheck = {
  type: "allergy" | "interaction" | "duplicate" | "condition" | "general";
  message: string;
  medicineId?: string;
};

export type SymptomHistoryItem = {
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

export type SymptomAnalysisResponse = {
  ok: boolean;
  input: Record<string, unknown>;
  analysis: SymptomAnalysisSummary;
  result: typeof aiResult & {
    safetyChecks: SymptomSafetyCheck[];
  };
  recommendedMedicines: typeof medicines;
};

const symptomAnalysisFields: Array<keyof SymptomAnalysisSummary> = [
  "symptoms",
  "duration",
  "severity",
  "possibleConditions",
  "medicines",
  "homeCare",
  "warnings",
  "consultDoctor",
  "confidence"
];

function isStringArray(value: unknown) {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

export function validateSymptomAnalysisResponse(value: unknown): SymptomAnalysisResponse {
  const response = value as Partial<SymptomAnalysisResponse> | null;
  const analysis = response?.analysis as Partial<SymptomAnalysisSummary> | undefined;

  if (!response?.ok || !analysis || !response.result || !Array.isArray(response.recommendedMedicines)) {
    throw new ApiClientError("Incomplete analysis response from the AI service.", { code: "invalid_symptom_response" });
  }

  const hasValidShape = symptomAnalysisFields.every((field) => {
    const current = analysis[field];
    if (field === "duration" || field === "severity") return typeof current === "string";
    if (field === "consultDoctor") return typeof current === "boolean";
    if (field === "confidence") return typeof current === "number";
    return isStringArray(current);
  });

  if (!hasValidShape || !isStringArray(analysis.detectedSymptoms) || !isStringArray(analysis.possibleDiseases)) {
    throw new ApiClientError("Invalid analysis schema returned by the AI service.", { code: "invalid_symptom_schema" });
  }

  return response as SymptomAnalysisResponse;
}

export async function analyzeSymptoms(payload: Record<string, unknown>, baseUrl?: string) {
  const response = await requestJson<SymptomAnalysisResponse>("/api/symptoms/analyze", {
    method: "POST",
    body: JSON.stringify(payload),
    baseUrl,
    timeoutMs: 30000  // AI analysis can take up to 30s — increased from 5s
  });

  return validateSymptomAnalysisResponse(response);
}

export async function fetchSymptomHistory(baseUrl?: string) {
  return requestJson<SymptomHistoryItem[]>("/api/symptoms/history", { baseUrl });
}

export async function fetchPaymentProviders(baseUrl?: string) {
  return requestJson<PaymentProviderData[]>("/api/payments/providers", { baseUrl });
}

export async function createPaymentSession(
  payload: {
    provider: string;
    orderAmount?: string;
    orderId?: string;
    customerEmail?: string;
  },
  baseUrl?: string
) {
  return requestJson<{
    ok: boolean;
    provider: PaymentProviderData;
    sessionId: string;
    orderId: string;
    orderAmount: string;
    customerEmail?: string;
    redirectUrl: string;
    webhookHint: string;
    message: string;
  }>("/api/payments/checkout-session", {
    method: "POST",
    body: JSON.stringify(payload),
    baseUrl
  });
}

export async function analyzePrescription(payload: Record<string, unknown>, baseUrl?: string) {
  return requestJson<{
    ok: boolean;
    status: string;
    confidence: string;
    extractedFields: PrescriptionData;
  }>("/api/prescriptions/analyze", {
    method: "POST",
    body: JSON.stringify(payload),
    baseUrl
  });
}

export async function uploadPrescription(
  payload: {
    doctorName?: string;
    patientName?: string;
    notes?: string;
    medicines?: string[];
    fileName?: string;
    fileType?: string;
    fileContentBase64?: string;
  },
  baseUrl?: string
) {
  return analyzePrescription(payload, baseUrl);
}

// ─── Production OCR Verify (multipart) ──────────────────────────────────────

export type PrescriptionVerifyResponse = {
  verificationStatus: "VERIFIED" | "REJECTED";
  confidenceScore: number;
  matchedCatalogIds: string[];
  message?: string;
};

/**
 * Uploads a prescription image as multipart/form-data to the production
 * OCR verification endpoint. Returns structured verification results.
 * No PII is logged in this function.
 */
export async function verifyPrescriptionOcr(
  formData: FormData,
  baseUrl?: string
): Promise<PrescriptionVerifyResponse> {
  const base = resolveBaseUrl(baseUrl);
  const url = `${base}/api/v1/prescriptions/verify`;
  const token = getAuthToken();
  const abortController = new AbortController();
  const timeoutHandle = setTimeout(() => abortController.abort(), 30000);

  try {
    const response = await fetch(url, {
      method: "POST",
      body: formData,
      signal: abortController.signal,
      headers: {
        // Do NOT set Content-Type — browser/RN sets it with boundary automatically
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });

    clearTimeout(timeoutHandle);

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      throw new ApiClientError("Invalid response from OCR service", {
        status: response.status,
        code: "invalid_ocr_response"
      });
    }

    const json = (await response.json()) as Record<string, unknown>;

    if (!response.ok) {
      const message = typeof json.error === "string" ? json.error : `OCR verification failed: ${response.status}`;
      throw new ApiClientError(message, { status: response.status });
    }

    return json as PrescriptionVerifyResponse;
  } catch (error) {
    clearTimeout(timeoutHandle);
    if (error instanceof Error && error.name === "AbortError") {
      throw new ApiClientError("Prescription upload timed out. Please try again.", {
        status: 408,
        code: "timeout"
      });
    }
    throw error;
  }
}

// ─── Production Payment Intent ───────────────────────────────────────────────

export type PaymentIntentResponse = {
  ok: boolean;
  provider: "stripe" | "razorpay";
  // Stripe fields
  paymentIntentClientSecret?: string;
  ephemeralKeySecret?: string;
  customerId?: string;
  publishableKey?: string;
  // Razorpay fields
  razorpayOrderId?: string;
  razorpayKeyId?: string;
  // Shared
  amount: number;
  currency: string;
  orderId: string;
  message?: string;
};

/**
 * Creates a real payment intent on the backend for the given provider.
 * Returns gateway-specific tokens needed to initialise the SDK sheet.
 */
export async function createPaymentIntent(
  payload: {
    provider: "stripe" | "razorpay";
    amount: number;
    currency: string;
    addressId: string;
    orderId?: string;
  },
  baseUrl?: string
): Promise<PaymentIntentResponse> {
  return requestJson<PaymentIntentResponse>("/api/v1/payments/create-intent", {
    method: "POST",
    body: JSON.stringify(payload),
    baseUrl,
    timeoutMs: 15000
  });
}

export async function fetchCart(baseUrl?: string) {
  return requestJson<CartData>("/api/cart", { baseUrl });
}

export async function addCartItem(payload: { medicineId: string; quantity?: number }, baseUrl?: string) {
  return requestJson<{ ok: boolean; cart: CartData; message?: string }>("/api/cart/items", {
    method: "POST",
    body: JSON.stringify(payload),
    baseUrl
  });
}

export async function updateCartItem(medicineId: string, payload: { quantity: number }, baseUrl?: string) {
  return requestJson<{ ok: boolean; cart: CartData }>(`/api/cart/items/${medicineId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
    baseUrl
  });
}

export async function removeCartItem(medicineId: string, baseUrl?: string) {
  return requestJson<{ ok: boolean; cart: CartData }>(`/api/cart/items/${medicineId}`, {
    method: "DELETE",
    baseUrl
  });
}

export async function submitCheckout(payload: Record<string, unknown>, baseUrl?: string) {
  return requestJson<{
    ok: boolean;
    order?: AppSnapshot["orders"][number];
    paymentMethod?: string;
    message?: string;
  }>("/api/orders/checkout", {
    method: "POST",
    body: JSON.stringify(payload),
    baseUrl
  });
}

export async function updateOrderStatus(
  orderId: string,
  payload: {
    status?: string;
    deliveryStage?: string;
    paymentStatus?: "pending" | "authorized" | "paid" | "failed" | "cancelled" | "refunded";
    eta?: string;
  },
  baseUrl?: string
) {
  return requestJson<{
    ok: boolean;
    order: AppSnapshot["orders"][number];
  }>(`/api/orders/${orderId}/status`, {
    method: "PATCH",
    body: JSON.stringify(payload),
    baseUrl
  });
}


export async function fetchAddresses(baseUrl?: string) {
  return requestJson<ProfileAddress[]>("/api/orders/addresses", { baseUrl });
}

export async function addAddress(payload: Record<string, unknown>, baseUrl?: string) {
  return requestJson<ProfileAddress>("/api/orders/addresses", {
    method: "POST",
    body: JSON.stringify(payload),
    baseUrl
  });
}

export async function updateAddress(addressId: string, payload: Record<string, unknown>, baseUrl?: string) {
  return requestJson<ProfileAddress>(`/api/orders/addresses/${addressId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
    baseUrl
  });
}

export async function deleteAddress(addressId: string, baseUrl?: string) {
  return requestJson<{ ok: boolean }>(`/api/orders/addresses/${addressId}`, {
    method: "DELETE",
    baseUrl
  });
}

export async function login(payload: { email: string; password: string }, baseUrl?: string) {
  const result = await requestJson<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
    baseUrl
  });

  if (result.token) {
    setAuthToken(result.token);
  }

  return result;
}

export async function signUp(payload: Record<string, unknown>, baseUrl?: string) {
  const result = await requestJson<AuthResponse>("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify(payload),
    baseUrl
  });

  if (result.token) {
    setAuthToken(result.token);
  }

  return result;
}

export async function forgotPassword(payload: { email: string }, baseUrl?: string) {
  return requestJson<{ ok: boolean; otp?: string; message: string }>("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify(payload),
    baseUrl
  });
}

export async function verifyOtp(payload: { email: string; otp: string }, baseUrl?: string) {
  return requestJson<{ ok: boolean; message: string }>("/api/auth/verify-otp", {
    method: "POST",
    body: JSON.stringify(payload),
    baseUrl
  });
}

export async function resetPassword(payload: { email: string; otp: string; newPassword: string }, baseUrl?: string) {
  return requestJson<{ ok: boolean; message: string }>("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(payload),
    baseUrl
  });
}

export type AdminSettingsResponse = {
  deliveryBaseCharge: number;
  deliveryRatePerKm: number;
  medicines: Array<{
    id: string;
    name: string;
    brand: string;
    category: string;
    price: string;
    tag: string;
    stockStatus: "in_stock" | "out_of_stock" | "limited";
  }>;
};

export async function fetchAdminSettings(baseUrl?: string) {
  return requestJson<AdminSettingsResponse>("/api/admin/settings", {
    method: "GET",
    baseUrl
  });
}

export async function updateAdminSettings(payload: { deliveryBaseCharge: number; deliveryRatePerKm: number }, baseUrl?: string) {
  return requestJson<{ ok: boolean; message: string }>("/api/admin/settings", {
    method: "PUT",
    body: JSON.stringify(payload),
    baseUrl
  });
}

export async function updateAdminStock(payload: { medicineId: string; stockStatus: string }, baseUrl?: string) {
  return requestJson<{ ok: boolean; message: string }>("/api/admin/stock", {
    method: "PUT",
    body: JSON.stringify(payload),
    baseUrl
  });
}

export function getErrorMessage(error: unknown, fallback = "Something went wrong") {
  return toErrorMessage(error, fallback);
}
