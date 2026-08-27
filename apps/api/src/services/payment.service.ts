import { asTrimmedString } from "../lib/validation";

export type PaymentEvaluation = {
  paymentMethod: string;
  paymentStatus: "pending" | "authorized" | "paid" | "failed" | "cancelled";
  paymentReference: string;
  paymentFailureReason?: string;
};

export function evaluatePayment(payload: {
  paymentMethod?: string;
  paymentSimulation?: "success" | "failure" | "cancel";
}) {
  const paymentMethod = asTrimmedString(payload.paymentMethod, "paymentMethod") || "Razorpay";
  const paymentReference = `${paymentMethod.toUpperCase().replace(/[^A-Z0-9]/g, "")}-${Date.now()}`;
  const requestedOutcome = payload.paymentSimulation ?? "success";

  if (requestedOutcome === "failure") {
    return {
      paymentMethod,
      paymentStatus: "failed" as const,
      paymentReference,
      paymentFailureReason: "The payment provider declined the transaction."
    };
  }

  if (requestedOutcome === "cancel") {
    return {
      paymentMethod,
      paymentStatus: "cancelled" as const,
      paymentReference,
      paymentFailureReason: "The customer cancelled the payment before completion."
    };
  }

  return {
    paymentMethod,
    paymentStatus: paymentMethod.toLowerCase().includes("cash") ? ("authorized" as const) : ("paid" as const),
    paymentReference
  };
}

export function buildTrackingTimeline(options: {
  createdAt: Date;
  stage: string;
  paid: boolean;
  issueReported?: boolean;
}) {
  const base = options.createdAt.getTime();
  const timeline: Array<{
    stage: string;
    status: "completed" | "current" | "upcoming" | "issue";
    timestamp: string;
    description: string;
  }> = [
    {
      stage: "Order placed",
      status: "completed" as const,
      timestamp: new Date(base).toISOString(),
      description: "Your order request was created successfully."
    },
    {
      stage: "Payment confirmed",
      status: options.paid ? ("completed" as const) : ("current" as const),
      timestamp: new Date(base + 2 * 60_000).toISOString(),
      description: options.paid ? "Payment was confirmed by the gateway." : "Payment confirmation is pending."
    },
    {
      stage: "Pharmacy review",
      status: options.stage === "Preparing" || options.stage === "Out for delivery" || options.stage === "Delivered" ? ("completed" as const) : ("current" as const),
      timestamp: new Date(base + 8 * 60_000).toISOString(),
      description: "Pharmacist verification and stock allocation are in progress."
    },
    {
      stage: "Out for delivery",
      status: options.stage === "Out for delivery" || options.stage === "Delivered" ? ("completed" as const) : ("upcoming" as const),
      timestamp: new Date(base + 25 * 60_000).toISOString(),
      description: "A delivery partner has been assigned to the order."
    },
    {
      stage: "Delivered",
      status: options.stage === "Delivered" ? ("completed" as const) : ("upcoming" as const),
      timestamp: new Date(base + 55 * 60_000).toISOString(),
      description: "The order is expected to reach the patient."
    }
  ];

  if (options.issueReported) {
    timeline.push({
      stage: "Issue reported",
      status: "issue" as const,
      timestamp: new Date(base + 65 * 60_000).toISOString(),
      description: "A support request has been raised for this order."
    });
  }

  return timeline;
}
