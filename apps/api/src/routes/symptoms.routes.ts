import { Router, Request, Response, NextFunction } from "express";
import { analyzeSymptoms, listSymptomAssessments } from "../services/symptoms.service";
import { requireAuth } from "../middleware/auth";

export const symptomsRouter = Router();
const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch(next);

symptomsRouter.post("/analyze", asyncHandler(async (req, res) => {
  res.json(await analyzeSymptoms(req.body ?? {}, req.currentUserId));
}));

symptomsRouter.get("/history", requireAuth, asyncHandler(async (req, res) => {
  res.json(await listSymptomAssessments(req.currentUserId));
}));
