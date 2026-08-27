import { Router, Request, Response, NextFunction } from "express";
import { getNotifications, getProfile, getSettings, updateProfile, updateSettings } from "../services/profile.service";

const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) => (req: Request, res: Response, next: NextFunction) => Promise.resolve(fn(req, res, next)).catch(next);

export const profileRouter = Router();

profileRouter.get("/", asyncHandler(async (req, res) => {
  res.json(await getProfile(req.currentUserId));
}));

profileRouter.put("/", asyncHandler(async (req, res) => {
  res.json(await updateProfile(req.body ?? {}, req.currentUserId));
}));

profileRouter.get("/settings", asyncHandler(async (req, res) => {
  res.json(await getSettings(req.currentUserId));
}));

profileRouter.put("/settings", asyncHandler(async (req, res) => {
  res.json(await updateSettings(req.body ?? {}, req.currentUserId));
}));

profileRouter.get("/notifications", asyncHandler(async (req, res) => {
  res.json(await getNotifications(req.currentUserId));
}));
