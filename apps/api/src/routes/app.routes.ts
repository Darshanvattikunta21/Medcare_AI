import { Router, Request, Response, NextFunction } from "express";
import { getAppSnapshot } from "../services/app.service";

const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) => (req: Request, res: Response, next: NextFunction) => Promise.resolve(fn(req, res, next)).catch(next);

export const appRouter = Router();

appRouter.get("/snapshot", asyncHandler(async (req, res) => {
  res.json(await getAppSnapshot(req.currentUserId));
}));
