import { Router, Request, Response, NextFunction } from "express";
import { addCartItem, clearCart, getCart, removeCartItem, updateCartItem } from "../services/cart.service";

const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) => (req: Request, res: Response, next: NextFunction) => Promise.resolve(fn(req, res, next)).catch(next);
const getRouteParam = (value: string | string[] | undefined) => (typeof value === "string" ? value : "");

export const cartRouter = Router();

cartRouter.get("/", asyncHandler(async (req, res) => {
  res.json(await getCart(req.currentUserId));
}));

cartRouter.post("/items", asyncHandler(async (req, res) => {
  const result = await addCartItem(req.body ?? {}, req.currentUserId);
  res.json(result);
}));

cartRouter.patch("/items/:medicineId", asyncHandler(async (req, res) => {
  const result = await updateCartItem(getRouteParam(req.params.medicineId), req.body ?? {}, req.currentUserId);

  if (!result) {
    res.status(404).json({ message: "Cart item not found" });
    return;
  }

  res.json(result);
}));

cartRouter.delete("/items/:medicineId", asyncHandler(async (req, res) => {
  const result = await removeCartItem(getRouteParam(req.params.medicineId), req.currentUserId);

  if (!result) {
    res.status(404).json({ message: "Cart item not found" });
    return;
  }

  res.json(result);
}));

cartRouter.delete("/", asyncHandler(async (req, res) => {
  res.json(await clearCart(req.currentUserId));
}));
