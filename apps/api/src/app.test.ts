import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createApp } from "./app";
import { createSeedDatabase } from "./seed";

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "medicare-api-test-"));
const dataFile = path.join(tempDir, "db.json");

process.env.API_DATA_FILE = dataFile;
process.env.AUTH_SECRET = "test-secret";
process.env.CORS_ORIGIN = "http://localhost:3000";

fs.writeFileSync(dataFile, JSON.stringify(createSeedDatabase(), null, 2), "utf8");

function authHeader(token?: string): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function withServer(run: (baseUrl: string) => Promise<void>) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise<void>((resolve) => server.once("listening", () => resolve()));
  const address = server.address();
  if (!address || typeof address === "string") {
    server.close();
    throw new Error("Unable to determine test server port");
  }

  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    await run(baseUrl);
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
}

test("login returns signed token and authenticated profile access works", async () => {
  await withServer(async (baseUrl) => {
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "ravi@email.com", password: "demo123" })
    });

    assert.equal(loginResponse.status, 200);
    const loginBody = (await loginResponse.json()) as { token?: string; user?: { email?: string } };
    assert.ok(loginBody.token);
    assert.equal(loginBody.user?.email, "ravi@email.com");

    const profileResponse = await fetch(`${baseUrl}/api/auth/me`, {
      headers: authHeader(loginBody.token)
    });

    assert.equal(profileResponse.status, 200);
    const profileBody = (await profileResponse.json()) as { email?: string };
    assert.equal(profileBody.email, "ravi@email.com");
  });
});

test("checkout blocks prescription-required items without a verified prescription", async () => {
  fs.writeFileSync(dataFile, JSON.stringify(createSeedDatabase(), null, 2), "utf8");

  await withServer(async (baseUrl) => {
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "ravi@email.com", password: "demo123" })
    });
    const loginBody = (await loginResponse.json()) as { token?: string };
    assert.ok(loginBody.token);

    const clearCartResponse = await fetch(`${baseUrl}/api/cart`, {
      method: "DELETE",
      headers: authHeader(loginBody.token)
    });
    assert.equal(clearCartResponse.status, 200);

    const addCartResponse = await fetch(`${baseUrl}/api/cart/items`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeader(loginBody.token)
      },
      body: JSON.stringify({ medicineId: "amoxicillin-500", quantity: 1 })
    });
    assert.equal(addCartResponse.status, 200);

    const checkoutResponse = await fetch(`${baseUrl}/api/orders/checkout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeader(loginBody.token)
      },
      body: JSON.stringify({ paymentMethod: "Razorpay", addressId: "addr-1" })
    });

    assert.equal(checkoutResponse.status, 400);
    const checkoutBody = (await checkoutResponse.json()) as { error?: string; code?: string };
    assert.match(checkoutBody.error ?? "", /verified prescription/i);
    assert.equal(checkoutBody.code, "bad_request");
  });
});

test("checkout selects a smart pharmacy and returns ETA details", async () => {
  fs.writeFileSync(dataFile, JSON.stringify(createSeedDatabase(), null, 2), "utf8");

  await withServer(async (baseUrl) => {
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "ravi@email.com", password: "demo123" })
    });
    const loginBody = (await loginResponse.json()) as { token?: string };
    assert.ok(loginBody.token);

    const checkoutResponse = await fetch(`${baseUrl}/api/orders/checkout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeader(loginBody.token)
      },
      body: JSON.stringify({ paymentMethod: "Razorpay", addressId: "addr-1" })
    });

    assert.equal(checkoutResponse.status, 200);
    const checkoutBody = (await checkoutResponse.json()) as { ok?: boolean; order?: { pharmacy?: string; eta?: string; deliveryStage?: string }; message?: string };
    assert.equal(checkoutBody.ok, true);
    assert.equal(checkoutBody.message, "Order placed successfully");
    assert.ok(checkoutBody.order?.pharmacy);
    assert.ok(checkoutBody.order?.eta?.startsWith("ETA "));
    assert.equal(checkoutBody.order?.deliveryStage, "Confirmed");
  });
});

test("payment failure returns a non-successful checkout result with payment details", async () => {
  fs.writeFileSync(dataFile, JSON.stringify(createSeedDatabase(), null, 2), "utf8");

  await withServer(async (baseUrl) => {
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "ravi@email.com", password: "demo123" })
    });
    const loginBody = (await loginResponse.json()) as { token?: string };
    assert.ok(loginBody.token);

    const checkoutResponse = await fetch(`${baseUrl}/api/orders/checkout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeader(loginBody.token)
      },
      body: JSON.stringify({ paymentMethod: "Razorpay", paymentSimulation: "failure", addressId: "addr-1" })
    });

    assert.equal(checkoutResponse.status, 200);
    const checkoutBody = (await checkoutResponse.json()) as {
      ok?: boolean;
      message?: string;
      order?: { paymentStatus?: string; paymentFailureReason?: string };
    };
    assert.equal(checkoutBody.ok, false);
    assert.equal(checkoutBody.order?.paymentStatus, "failed");
    assert.match(checkoutBody.message ?? "", /declined/i);
  });
});

test("symptom analysis returns enriched safety checks", async () => {
  fs.writeFileSync(dataFile, JSON.stringify(createSeedDatabase(), null, 2), "utf8");

  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/symptoms/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        symptoms: ["Fever", "Headache"],
        duration: "2-3 days",
        severity: 6,
        notes: "Need something for quick relief"
      })
    });

    assert.equal(response.status, 200);
    const body = (await response.json()) as {
      result?: { safetyChecks?: Array<{ type?: string; message?: string }> };
    };
    assert.ok(body.result?.safetyChecks?.length);
  });
});

test("prescription upload returns OCR metadata and validation issues", async () => {
  fs.writeFileSync(dataFile, JSON.stringify(createSeedDatabase(), null, 2), "utf8");

  await withServer(async (baseUrl) => {
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "ravi@email.com", password: "demo123" })
    });
    const loginBody = (await loginResponse.json()) as { token?: string };
    assert.ok(loginBody.token);

    const fileContentBase64 = Buffer.from("Patient Ravi\nDr. Mehta\nParacetamol 650mg after meals", "utf8").toString("base64");
    const response = await fetch(`${baseUrl}/api/prescriptions/upload`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeader(loginBody.token)
      },
      body: JSON.stringify({
        fileName: "prescription.txt",
        fileType: "application/pdf",
        fileContentBase64
      })
    });

    assert.equal(response.status, 200);
    const body = (await response.json()) as {
      extractedFields?: { ocrStatus?: string; dosageSummary?: string[]; validationIssues?: string[] };
    };
    assert.ok(body.extractedFields?.ocrStatus);
    assert.ok(body.extractedFields?.dosageSummary?.length);
  });
});
