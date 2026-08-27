import { Router, Request, Response, NextFunction } from "express";
import { forgotPassword, getAuthMe, login, resetPassword, signUp, verifyOtp } from "../services/auth.service";

const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) => (req: Request, res: Response, next: NextFunction) => Promise.resolve(fn(req, res, next)).catch(next);

export const authRouter = Router();

authRouter.post("/login", asyncHandler(async (req, res) => {
  res.json(await login(req.body ?? {}));
}));

authRouter.post("/signup", asyncHandler(async (req, res) => {
  res.json(await signUp(req.body ?? {}));
}));

authRouter.post("/forgot-password", asyncHandler(async (req, res) => {
  const result = await forgotPassword(req.body ?? {});
  res.status(result.ok ? 200 : 404).json(result);
}));

authRouter.post("/verify-otp", asyncHandler(async (req, res) => {
  const result = await verifyOtp(req.body ?? {});
  res.status(result.ok ? 200 : 400).json(result);
}));

authRouter.post("/reset-password", asyncHandler(async (req, res) => {
  const result = await resetPassword(req.body ?? {});
  res.status(result.ok ? 200 : 400).json(result);
}));

import { requireAuth } from "../middleware/auth";

authRouter.get("/me", requireAuth, asyncHandler(async (req, res) => {
  res.json(await getAuthMe(req.currentUserId));
}));

authRouter.get("/profile", requireAuth, asyncHandler(async (req, res) => {
  res.json(await getAuthMe(req.currentUserId));
}));
