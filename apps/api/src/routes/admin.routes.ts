import { Router, Request, Response, NextFunction } from "express";
import { readDb, writeDb } from "../lib/file-db";
import { unauthorized, forbidden, badRequest } from "../lib/errors";
import { getUserById } from "../services/data.service";
import { medicines } from "@medicare/core";

export const adminRouter = Router();

const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch(next);

// Authentication & Role check middleware
function requireAdminOrPharmacist(req: Request, _res: Response, next: NextFunction) {
  if (!req.currentUserId) {
    return next(unauthorized("Authentication required."));
  }

  const db = readDb();
  const user = getUserById(req.currentUserId, db);
  if (!user || (user.role !== "admin" && user.role !== "pharmacist")) {
    return next(forbidden("Access denied. Admin or Pharmacist role required."));
  }

  next();
}

// Apply check to all admin routes
adminRouter.use(requireAdminOrPharmacist);

adminRouter.get(
  "/settings",
  asyncHandler(async (_req: Request, res: Response) => {
    const db = readDb();
    
    // Return all medicines from core catalog with their custom stock statuses
    const stocks = db.medicineStocks ?? {};
    const catalogMedicines = medicines.map((med) => ({
      id: med.id,
      name: med.name,
      brand: med.brand,
      category: med.category,
      price: med.price,
      tag: med.tag,
      stockStatus: stocks[med.id] || (med.tag.toLowerCase() === "rx" ? "limited" : "in_stock")
    }));

    res.json({
      deliveryBaseCharge: db.deliveryBaseCharge ?? 20,
      deliveryRatePerKm: db.deliveryRatePerKm ?? 5,
      medicines: catalogMedicines
    });
  })
);

adminRouter.put(
  "/settings",
  asyncHandler(async (req: Request, res: Response) => {
    const { deliveryBaseCharge, deliveryRatePerKm } = req.body ?? {};

    if (typeof deliveryBaseCharge !== "number" || typeof deliveryRatePerKm !== "number") {
      throw badRequest("deliveryBaseCharge and deliveryRatePerKm must be numbers.");
    }

    const db = readDb();
    db.deliveryBaseCharge = deliveryBaseCharge;
    db.deliveryRatePerKm = deliveryRatePerKm;
    writeDb(db);

    res.json({
      ok: true,
      message: "Delivery settings updated successfully.",
      deliveryBaseCharge: db.deliveryBaseCharge,
      deliveryRatePerKm: db.deliveryRatePerKm
    });
  })
);

adminRouter.put(
  "/stock",
  asyncHandler(async (req: Request, res: Response) => {
    const { medicineId, stockStatus } = req.body ?? {};

    if (!medicineId || !stockStatus) {
      throw badRequest("medicineId and stockStatus are required.");
    }

    if (stockStatus !== "in_stock" && stockStatus !== "out_of_stock" && stockStatus !== "limited") {
      throw badRequest("Invalid stockStatus. Must be 'in_stock', 'out_of_stock', or 'limited'.");
    }

    const db = readDb();
    db.medicineStocks = db.medicineStocks ?? {};
    db.medicineStocks[medicineId] = stockStatus;
    writeDb(db);

    res.json({
      ok: true,
      message: `Stock status for ${medicineId} updated to ${stockStatus}.`,
      medicineId,
      stockStatus
    });
  })
);
