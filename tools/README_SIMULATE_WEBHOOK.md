Simulate Razorpay webhook

Usage:

Set environment variables or pass args:

```powershell
# Using args:
node tools/simulate_razorpay_webhook.js https://your-staging.example/api/payments/webhooks/razorpay your_webhook_secret MC-000123

# Or using env vars:
set TARGET_URL=https://your-staging.example/api/payments/webhooks/razorpay
set RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
node tools/simulate_razorpay_webhook.js
```

What it does:
- Builds a `payment.captured` payload with a notes.orderId containing the provided order id.
- Computes HMAC-SHA256 signature using the provided secret and sends `x-razorpay-signature` header.

Note: Run this from a machine that can reach your staging API endpoint. Ensure staging accepts requests from your IP or use a tunnel (ngrok) if needed.
