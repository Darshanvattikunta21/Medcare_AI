import { env } from "../config/env";
import { badRequest } from "../lib/errors";
import { asTrimmedString } from "../lib/validation";
import crypto from "crypto";
import { prisma } from "../lib/db";
import { readDb, writeDb } from "../lib/file-db";

type PaymentProvider = {
  id: "razorpay" | "stripe" | "cod";
  label: string;
  enabled: boolean;
  mode: "test" | "live" | "offline";
  publishableKey?: string;
  currency: string;
  notes: string[];
};

function redactKey(value?: string) {
  if (!value) return undefined;
  return value.slice(0, 8);
}

export function listPaymentProviders(): PaymentProvider[] {
  const razorpayKey = process.env.RAZORPAY_KEY_ID;
  const stripeKey = process.env.STRIPE_PUBLISHABLE_KEY;

  return [
    {
      id: "razorpay",
      label: "Razorpay",
      enabled: Boolean(razorpayKey) || env.appEnv !== "production",
      mode: razorpayKey ? "live" : "test",
      publishableKey: redactKey(razorpayKey),
      currency: "INR",
      notes: [
        "Use this provider for card, UPI, and wallet flows.",
        razorpayKey ? "Live key detected in environment." : "No live key configured; scaffold mode only."
      ]
    },
    {
      id: "stripe",
      label: "Stripe",
      enabled: Boolean(stripeKey) || env.appEnv !== "production",
      mode: stripeKey ? "live" : "test",
      publishableKey: redactKey(stripeKey),
      currency: "INR",
      notes: [
        "Use this provider for card and international payment support.",
        stripeKey ? "Live key detected in environment." : "No live key configured; scaffold mode only."
      ]
    },
    {
      id: "cod",
      label: "Cash on Delivery",
      enabled: true,
      mode: "offline",
      currency: "INR",
      notes: ["Delivery partner collects payment at handoff."]
    }
  ];
}

export function createPaymentSession(payload: {
  provider?: string;
  orderAmount?: string;
  orderId?: string;
  customerEmail?: string;
}) {
  const provider = asTrimmedString(payload.provider, "provider", { required: true }).toLowerCase();
  const available = listPaymentProviders();
  const selected = available.find((item) => item.id === provider);

  if (!selected || !selected.enabled) {
    throw badRequest("Selected payment provider is not available");
  }

  return {
    ok: true,
    provider: selected,
    sessionId: `${selected.id}-${Date.now()}`,
    orderId: asTrimmedString(payload.orderId, "orderId") || `draft-${Date.now()}`,
    orderAmount: asTrimmedString(payload.orderAmount, "orderAmount") || "Rs 0",
    customerEmail: asTrimmedString(payload.customerEmail, "customerEmail") || undefined,
    redirectUrl: `/checkout/confirm?provider=${selected.id}`,
    webhookHint: `/api/payments/webhooks/${selected.id}`,
    message:
      selected.mode === "live"
        ? `${selected.label} session prepared with configured credentials.`
        : `${selected.label} session prepared in scaffold mode. Add provider keys and webhooks for live transactions.`
  };
}

export async function processRazorpayWebhook(rawBody: Buffer, headers: Record<string, any>) {
  const signature = (headers["x-razorpay-signature"] as string) || (headers["X-Razorpay-Signature"] as string);
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  // Verify signature when secret is configured
  if (secret) {
    const computed = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
    if (!signature || computed !== signature) {
      throw badRequest("Invalid webhook signature");
    }
  }

  let body: any;
  try {
    body = JSON.parse(rawBody.toString("utf8"));
  } catch (err) {
    throw badRequest("Invalid webhook payload");
  }

  const event = body.event as string | undefined;
  const paymentEntity = body?.payload?.payment?.entity;

  if (!event || !paymentEntity) {
    return { ok: true, message: "Ignored webhook" };
  }

  const razorpayPaymentId = paymentEntity.id as string | undefined;
  const razorpayOrderId = paymentEntity.order_id as string | undefined;
  const notes = paymentEntity.notes ?? {};
  const localOrderIdFromNotes = notes.orderId || notes.local_order_id || notes.localOrderId;

  const newStatusMap: Record<string, { status: string; reason?: string }> = {
    "payment.captured": { status: "paid" },
    "payment.authorized": { status: "authorized" },
    "payment.failed": { status: "failed", reason: paymentEntity.error_reason || paymentEntity.error?.description }
  };

  const target = newStatusMap[event];

  if (!target) {
    return { ok: true, message: `Unhandled event ${event}` };
  }

  // Try to reconcile to an existing order.
  if (env.useDatabase) {
    // Try several heuristics to find the order
    let order: any = null;
    if (localOrderIdFromNotes) {
      order = await prisma.order.findUnique({ where: { id: localOrderIdFromNotes } });
    }

    if (!order && razorpayOrderId) {
      order = await prisma.order.findFirst({ where: { paymentReference: razorpayOrderId } });
    }

    if (!order && razorpayPaymentId) {
      order = await prisma.order.findFirst({ where: { paymentReference: razorpayPaymentId } });
    }

    if (order) {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: target.status as any,
          paymentReference: razorpayPaymentId ?? order.paymentReference,
          paymentFailureReason: target.reason ?? null,
          trackingTimeline: []
        }
      });
      // Record reconciliation
      await prisma.reconciliation.create({
        data: {
          provider: "razorpay",
          providerEvent: event,
          providerReference: razorpayPaymentId ?? razorpayOrderId ?? null,
          payload: body,
          reconciledOrderId: order.id,
          processedAt: new Date()
        }
      }).catch(() => null);

      return { ok: true, reconciledOrder: order.id };
    }
    // No matching order found — persist reconciliation entry
    try {
      await prisma.reconciliation.create({
        data: {
          provider: "razorpay",
          providerEvent: event,
          providerReference: razorpayPaymentId ?? razorpayOrderId ?? null,
          payload: body,
          reconciledOrderId: null,
          processedAt: new Date()
        }
      });
    } catch (e) {
      console.warn("Failed to create reconciliation record:", e);
    }

    return { ok: true, message: "No matching order found; reconciliation recorded" };
  }

  // File DB mode
  const db = readDb();
  const orderByNote = localOrderIdFromNotes ? db.orders.find((o: any) => o.id === localOrderIdFromNotes) : undefined;
  const orderByRef = razorpayOrderId ? db.orders.find((o: any) => o.paymentReference === razorpayOrderId) : undefined;
  const orderByPayment = razorpayPaymentId ? db.orders.find((o: any) => o.paymentReference === razorpayPaymentId) : undefined;
  const order = orderByNote || orderByRef || orderByPayment;

  if (order) {
    order.paymentStatus = target.status as any;
    order.paymentReference = razorpayPaymentId ?? order.paymentReference;
    order.paymentFailureReason = target.reason ?? undefined;
    writeDb(db);
    return { ok: true, reconciledOrder: order.id };
  }

  // Append a reconciliation record in file DB as scaffold
  db.reconciliations = db.reconciliations || [];
  db.reconciliations.push({
    id: `recon-${Date.now()}`,
    provider: "razorpay",
    providerEvent: event,
    providerReference: razorpayPaymentId ?? razorpayOrderId,
    payload: body,
    processedAt: new Date().toISOString()
  });
  writeDb(db);

  return { ok: true, message: "No matching order found; reconciliation recorded" };
}
