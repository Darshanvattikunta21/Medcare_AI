import cors from "cors";
import express from "express";
import { env } from "./config/env";
import { ApiError } from "./lib/errors";
import { attachCurrentUser, requireAuth } from "./middleware/auth";
import { apiRateLimit } from "./middleware/rate-limit";
import { appRouter } from "./routes/app.routes";
import { authRouter } from "./routes/auth.routes";
import { cartRouter } from "./routes/cart.routes";
import { catalogRouter } from "./routes/catalog.routes";
import { ordersRouter } from "./routes/orders.routes";
import { paymentsRouter } from "./routes/payments.routes";
import { prescriptionsRouter } from "./routes/prescriptions.routes";
import { profileRouter } from "./routes/profile.routes";
import { symptomsRouter } from "./routes/symptoms.routes";
import { symptomsAiRouter } from "./routes/symptoms-ai.routes";
import { adminRouter } from "./routes/admin.routes";

export function createApp() {
  const app = express();

  // Trust proxy in production
  if (env.appEnv === "production") {
    app.set("trust proxy", 1);
  }

  // CORS configuration
  const corsOptions = {
    origin: env.corsOrigin.split(",").map((o) => o.trim()),
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    maxAge: 86400, // 24 hours
  };
  app.use(cors(corsOptions));

  // Body parsing middleware
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ limit: "10mb", extended: true }));
  app.use(apiRateLimit);
  app.use(attachCurrentUser);

  // Security headers
  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    next();
  });

  // Request logging (basic)
  app.use((req, res, next) => {
    const start = Date.now();
    const requestId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    res.setHeader("X-Request-Id", requestId);
    console.log(`[${new Date().toISOString()}] ${requestId} -> ${req.method} ${req.path}`);
    res.on("finish", () => {
      const duration = Date.now() - start;
      console.log(`[${new Date().toISOString()}] ${requestId} <- ${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
    });
    next();
  });

  // Health check endpoint
  const healthHandler = (_req: express.Request, res: express.Response) => {
    res.json({ status: "ok", service: "medicare-ai-api", env: env.appEnv, timestamp: new Date().toISOString() });
  };
  app.get("/health", healthHandler);
  app.get("/api/health", healthHandler);

  // Ready check endpoint
  app.get("/ready", (_req, res) => {
    res.json({ ready: true, service: "medicare-ai-api" });
  });

  // API Routes
  app.use("/api/app", appRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/cart", requireAuth, cartRouter);
  app.use("/api/catalog", catalogRouter);
  app.use("/api/orders", requireAuth, ordersRouter);
  app.use("/api/payments", requireAuth, paymentsRouter);
  app.use("/api/v1/payments", requireAuth, paymentsRouter);
  app.use("/api/profile", requireAuth, profileRouter);
  app.use("/api/notifications", requireAuth, (req, res, next) => {
    req.url = "/notifications" + req.url.replace(/^\//, "");
    profileRouter(req, res, next);
  });
  app.use("/api/prescriptions", requireAuth, prescriptionsRouter);
  app.use("/api/v1/prescriptions", requireAuth, prescriptionsRouter);
  app.use("/api/symptoms", symptomsRouter);
  app.use("/api/symptoms/v2", symptomsAiRouter);   // Enhanced AI analyzer (v2 has its own internal check but this adds layers)
  app.use("/api/admin", adminRouter);             // Admin/Pharmacist Management has its own internal check

  // 404 handler
  app.use((_req, res) => {
    res.status(404).json({ error: "Not Found" });
  });

  // Error handling middleware
  app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const requestId = res.getHeader("X-Request-Id")?.toString();
    console.error("[api] unhandled error", {
      requestId,
      method: req.method,
      path: req.path,
      status: err instanceof ApiError ? err.status : err.status || 500,
      code: err instanceof ApiError ? err.code : "internal_error",
      message: err?.message ?? String(err)
    });
    const status = err instanceof ApiError ? err.status : err.status || 500;
    const message =
      err instanceof ApiError ? err.message : env.appEnv === "production" ? "Internal Server Error" : err.message;
    res.status(status).json({
      error: message,
      code: err instanceof ApiError ? err.code : "internal_error",
      requestId,
      ...(err instanceof ApiError && err.details ? { details: err.details } : {}),
      ...(env.appEnv === "development" && !(err instanceof ApiError) ? { stack: err.stack } : {})
    });
  });

  return app;
}
