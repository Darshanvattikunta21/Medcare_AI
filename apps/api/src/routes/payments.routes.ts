import express, { Router } from "express";
import { createPaymentSession, listPaymentProviders, processRazorpayWebhook } from "../services/payments.service";

export const paymentsRouter = Router();

paymentsRouter.get("/providers", (_req, res) => {
  res.json(listPaymentProviders());
});

paymentsRouter.post("/checkout-session", (req, res) => {
  res.json(createPaymentSession(req.body ?? {}));
});

// Razorpay webhook endpoint (expects raw body for signature verification)
paymentsRouter.post(
  "/webhooks/razorpay",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    try {
      const result = await processRazorpayWebhook(req.body as Buffer, req.headers);
      res.status(200).json(result);
    } catch (err: any) {
      console.error("Razorpay webhook error:", err?.message ?? err);
      res.status(400).json({ ok: false, message: err?.message ?? "Webhook processing failed" });
    }
  }
);

paymentsRouter.post("/create-intent", async (req, res, next) => {
  try {
    const { provider, amount, currency, addressId, orderId } = req.body ?? {};

    if (!provider || !amount || !currency || !addressId) {
      res.status(400).json({ ok: false, message: "Missing required fields" });
      return;
    }

    const numericAmount = Math.round(Number(amount));
    const targetOrderId = orderId || `MC-draft-${Date.now()}`;

    const stripeSecret = process.env.STRIPE_SECRET_KEY;
    const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

    if (provider === "stripe") {
      if (stripeSecret) {
        try {
          // 1. Create customer
          const customerRes = await fetch("https://api.stripe.com/v1/customers", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${stripeSecret}`,
              "Content-Type": "application/x-www-form-urlencoded"
            }
          });
          if (!customerRes.ok) {
            const errBody = await customerRes.text();
            throw new Error(`Stripe customer creation failed: ${errBody}`);
          }
          const customer: any = await customerRes.json();

          // 2. Create ephemeral key
          const ephemeralKeyRes = await fetch("https://api.stripe.com/v1/ephemeral_keys", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${stripeSecret}`,
              "Stripe-Version": "2020-08-27",
              "Content-Type": "application/x-www-form-urlencoded"
            },
            body: `customer=${customer.id}`
          });
          if (!ephemeralKeyRes.ok) {
            const errBody = await ephemeralKeyRes.text();
            throw new Error(`Stripe ephemeral key creation failed: ${errBody}`);
          }
          const ephemeralKey: any = await ephemeralKeyRes.json();

          // 3. Create payment intent
          const params = new URLSearchParams({
            amount: String(numericAmount * 100),
            currency: currency.toLowerCase(),
            customer: customer.id,
            "automatic_payment_methods[enabled]": "true"
          });
          const paymentIntentRes = await fetch("https://api.stripe.com/v1/payment_intents", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${stripeSecret}`,
              "Content-Type": "application/x-www-form-urlencoded"
            },
            body: params.toString()
          });
          if (!paymentIntentRes.ok) {
            const errBody = await paymentIntentRes.text();
            throw new Error(`Stripe payment intent creation failed: ${errBody}`);
          }
          const paymentIntent: any = await paymentIntentRes.json();

          res.json({
            ok: true,
            provider: "stripe",
            paymentIntentClientSecret: paymentIntent.client_secret,
            ephemeralKeySecret: ephemeralKey.secret,
            customerId: customer.id,
            publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
            amount: numericAmount,
            currency,
            orderId: targetOrderId,
            message: "Stripe payment intent created successfully."
          });
          return;
        } catch (error: any) {
          console.error("Stripe integration error, falling back to mock:", error.message);
        }
      }

      // Stripe Fallback Mock mode
      res.json({
        ok: true,
        provider: "stripe",
        paymentIntentClientSecret: "pi_mock_secret_12345",
        ephemeralKeySecret: "ek_mock_secret_12345",
        customerId: "cus_mock_12345",
        publishableKey: "pk_test_placeholder",
        amount: numericAmount,
        currency,
        orderId: targetOrderId,
        message: "Stripe session prepared in mock scaffold mode."
      });
    } else {
      if (razorpayKeyId && razorpayKeySecret) {
        try {
          const response = await fetch("https://api.razorpay.com/v1/orders", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Basic " + Buffer.from(`${razorpayKeyId}:${razorpayKeySecret}`).toString("base64")
            },
            body: JSON.stringify({
              amount: numericAmount * 100, // paise
              currency: currency.toUpperCase(),
              receipt: targetOrderId
            })
          });

          if (!response.ok) {
            const errBody = await response.text();
            throw new Error(`Razorpay order creation failed: ${errBody}`);
          }

          const rzpOrder: any = await response.json();
          res.json({
            ok: true,
            provider: "razorpay",
            razorpayOrderId: rzpOrder.id,
            razorpayKeyId,
            amount: numericAmount,
            currency,
            orderId: targetOrderId,
            message: "Razorpay order created successfully."
          });
          return;
        } catch (error: any) {
          console.error("Razorpay integration error, falling back to mock:", error.message);
        }
      }

      // Razorpay Fallback Mock mode
      res.json({
        ok: true,
        provider: "razorpay",
        razorpayOrderId: "order_mock_12345",
        razorpayKeyId: "rzp_test_placeholder",
        amount: numericAmount,
        currency,
        orderId: targetOrderId,
        message: "Razorpay order prepared in mock scaffold mode."
      });
    }
  } catch (error) {
    next(error);
  }
});

