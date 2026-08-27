#!/usr/bin/env node
const https = require("https");
const { URL } = require("url");
const crypto = require("crypto");

function usage() {
  console.log("Usage: node simulate_razorpay_webhook.js <targetUrl> <webhookSecret> [orderId]");
  console.log("Or set TARGET_URL and RAZORPAY_WEBHOOK_SECRET environment variables.");
}

const target = process.argv[2] || process.env.TARGET_URL;
const secret = process.argv[3] || process.env.RAZORPAY_WEBHOOK_SECRET;
const orderId = process.argv[4] || process.env.ORDER_ID || `MC-${String(Math.floor(1000 + Math.random() * 9000))}`;

if (!target || !secret) {
  usage();
  process.exit(1);
}

const paymentId = `pay_${Date.now()}`;
const body = {
  entity: {
    account_id: "acct_test",
  },
  event: "payment.captured",
  payload: {
    payment: {
      entity: {
        id: paymentId,
        entity: "payment",
        amount: 10000,
        currency: "INR",
        status: "captured",
        order_id: `order_${Date.now()}`,
        notes: { orderId },
      }
    }
  }
};

const payload = JSON.stringify(body);
const signature = crypto.createHmac("sha256", secret).update(payload).digest("hex");

const url = new URL(target);
const options = {
  hostname: url.hostname,
  port: url.port || (url.protocol === "https:" ? 443 : 80),
  path: url.pathname + (url.search || ""),
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(payload),
    "x-razorpay-signature": signature
  }
};

console.log(`Sending simulated event to ${target}`);

const req = https.request(options, (res) => {
  let data = "";
  res.on("data", (chunk) => (data += chunk));
  res.on("end", () => {
    console.log(`Status: ${res.statusCode}`);
    console.log("Response:", data);
  });
});

req.on("error", (err) => {
  console.error("Request error:", err);
});

req.write(payload);
req.end();
