import { Router, Request, Response, NextFunction } from "express";
import {
  addAddress,
  checkout,
  deleteAddress,
  getOrder,
  listAddresses,
  listOrders,
  reportOrderIssue,
  updateOrderStatus,
  updateAddress
} from "../services/orders.service";

const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) => (req: Request, res: Response, next: NextFunction) => Promise.resolve(fn(req, res, next)).catch(next);
const getRouteParam = (value: string | string[] | undefined) => (typeof value === "string" ? value : "");

export const ordersRouter = Router();

ordersRouter.get("/", asyncHandler(async (req, res) => {
  res.json(await listOrders(req.currentUserId));
}));

ordersRouter.post("/checkout", asyncHandler(async (req, res) => {
  res.json(await checkout(req.body ?? {}, req.currentUserId));
}));

ordersRouter.post("/addresses", asyncHandler(async (req, res) => {
  res.json(await addAddress(req.body ?? {}, req.currentUserId));
}));

ordersRouter.get("/addresses", asyncHandler(async (req, res) => {
  res.json(await listAddresses(req.currentUserId));
}));

ordersRouter.put("/addresses/:addressId", asyncHandler(async (req, res) => {
  res.json(await updateAddress(getRouteParam(req.params.addressId), req.body ?? {}, req.currentUserId));
}));

ordersRouter.delete("/addresses/:addressId", asyncHandler(async (req, res) => {
  res.json(await deleteAddress(getRouteParam(req.params.addressId), req.currentUserId));
}));

ordersRouter.get("/:orderId", asyncHandler(async (req, res) => {
  const order = await getOrder(getRouteParam(req.params.orderId), req.currentUserId);

  if (!order) {
    res.status(404).json({ message: "Order not found" });
    return;
  }

  res.json(order);
}));

ordersRouter.post("/:orderId/issue", asyncHandler(async (req, res) => {
  const result = await reportOrderIssue(getRouteParam(req.params.orderId), req.body ?? {}, req.currentUserId);

  if (!result) {
    res.status(404).json({ message: "Order not found" });
    return;
  }

  res.json(result);
}));

ordersRouter.patch("/:orderId/status", asyncHandler(async (req, res) => {
  res.json(await updateOrderStatus(getRouteParam(req.params.orderId), req.body ?? {}, req.currentUserId));
}));
