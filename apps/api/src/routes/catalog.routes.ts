import { Router, Request, Response, NextFunction } from "express";
import { getMedicine, listCategories, listMedicines } from "../services/catalog.service";

const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) => (req: Request, res: Response, next: NextFunction) => Promise.resolve(fn(req, res, next)).catch(next);
const getRouteParam = (value: string | string[] | undefined) => (typeof value === "string" ? value : "");

export const catalogRouter = Router();

catalogRouter.get("/categories", (_req, res) => {
  res.json(listCategories());
});

catalogRouter.get("/medicines", asyncHandler(async (req, res) => {
  const result = await listMedicines({
    q: typeof req.query.q === "string" ? req.query.q : undefined,
    category: typeof req.query.category === "string" ? req.query.category : undefined,
    tag: typeof req.query.tag === "string" ? req.query.tag : undefined,
    page: typeof req.query.page === "string" ? Number(req.query.page) : undefined,
    limit: typeof req.query.limit === "string" ? Number(req.query.limit) : undefined,
    sort: typeof req.query.sort === "string" ? (req.query.sort as "name" | "price-asc" | "price-desc") : undefined
  });

  if (req.query.includeMeta === "true") {
    res.json(result);
    return;
  }

  res.json(result.items);
}));

catalogRouter.get("/medicines/:id", asyncHandler(async (req, res) => {
  const medicine = await getMedicine(getRouteParam(req.params.id));

  if (!medicine) {
    res.status(404).json({ message: "Medicine not found" });
    return;
  }

  res.json(medicine);
}));
