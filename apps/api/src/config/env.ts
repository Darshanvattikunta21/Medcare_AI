import path from "node:path";

export const env = {
  get rootDir() {
    return process.cwd();
  },
  get port() {
    return Number(process.env.PORT ?? 4000);
  },
  get appEnv() {
    return process.env.APP_ENV ?? "development";
  },
  get nodeEnv() {
    return process.env.NODE_ENV ?? "development";
  },
  get databaseUrl() {
    return process.env.DATABASE_URL ?? "";
  },
  get persistenceProvider() {
    return (process.env.PERSISTENCE_PROVIDER ?? "file").toLowerCase();
  },
  get useDatabase() {
    return this.persistenceProvider === "database";
  },
  get dataFile() {
    return process.env.API_DATA_FILE ?? path.resolve(process.cwd(), "data", "db.json");
  },
  get prescriptionUploadDir() {
    return process.env.PRESCRIPTION_UPLOAD_DIR ?? path.resolve(process.cwd(), "storage", "prescriptions");
  },
  get corsOrigin() {
    return process.env.CORS_ORIGIN ?? "*";
  },
  // Production settings
  get isProduction() {
    return (process.env.NODE_ENV ?? process.env.APP_ENV) === "production";
  },
  get requestTimeout() {
    return Number(process.env.REQUEST_TIMEOUT ?? 30000);
  },
  get maxRequestSize() {
    return process.env.MAX_REQUEST_SIZE ?? "10mb";
  },
  // Logging
  get logLevel() {
    return process.env.LOG_LEVEL ?? "info";
  },
  // API Configuration
  get apiPrefix() {
    return process.env.API_PREFIX ?? "/api";
  },
  get authSecret() {
    return process.env.AUTH_SECRET ?? "medicare-ai-dev-secret";
  }
};
