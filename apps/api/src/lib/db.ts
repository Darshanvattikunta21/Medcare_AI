import { PrismaClient } from "@prisma/client";

declare global {
  var __medicarePrisma__: PrismaClient | undefined;
}

export const prisma =
  globalThis.__medicarePrisma__ ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"]
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__medicarePrisma__ = prisma;
}
