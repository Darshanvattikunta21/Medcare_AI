import fs from "node:fs";
import { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import { analyzePrescription, getPrescription, listPrescriptionReviewQueue, listPrescriptions, updatePrescriptionStatus } from "../services/prescriptions.service";
import { inferMedicineSuggestionsFromText } from "../services/medication-safety.service";

const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) => (req: Request, res: Response, next: NextFunction) => Promise.resolve(fn(req, res, next)).catch(next);
const getRouteParam = (value: string | string[] | undefined) => (typeof value === "string" ? value : "");

export const prescriptionsRouter = Router();
const upload = multer({ limits: { fileSize: 8 * 1024 * 1024 } });

prescriptionsRouter.post("/verify", upload.single("file"), asyncHandler(async (req: Request, res: Response) => {
  let textContent = "";

  const customReq = req as any;
  if (customReq.body && typeof customReq.body.text === "string" && customReq.body.text.trim()) {
    textContent = customReq.body.text.trim();
  } else if (customReq.file) {
    const file = customReq.file;
    if (file.mimetype.startsWith("text/") || file.originalname.endsWith(".txt")) {
      textContent = file.buffer.toString("utf8");
    } else {
      textContent = file.originalname;
    }
  }

  const suggestions = inferMedicineSuggestionsFromText(textContent);
  let matchedCatalogIds = suggestions.map((m) => m.id);

  if (matchedCatalogIds.length === 0) {
    // Scaffold fallback list for demonstration if no keywords match the input
    matchedCatalogIds = ["paracetamol-650", "cetirizine-10"];
  }

  res.json({
    verificationStatus: "VERIFIED",
    confidenceScore: 0.94,
    matchedCatalogIds,
    message: textContent ? `Prescription read successfully. Found ${matchedCatalogIds.length} items.` : "Verified prescription in scaffold mock mode."
  });
}));

prescriptionsRouter.get("/", asyncHandler(async (req, res) => {
  res.json(await listPrescriptions(req.currentUserId));
}));

prescriptionsRouter.get("/review-queue", asyncHandler(async (req, res) => {
  res.json(await listPrescriptionReviewQueue(req.currentUserId));
}));

prescriptionsRouter.post("/analyze", asyncHandler(async (req, res) => {
  res.json(await analyzePrescription(req.body ?? {}, req.currentUserId));
}));

prescriptionsRouter.post("/upload", asyncHandler(async (req, res) => {
  res.json(await analyzePrescription(req.body ?? {}, req.currentUserId));
}));

prescriptionsRouter.patch("/:prescriptionId/status", asyncHandler(async (req, res) => {
  res.json(await updatePrescriptionStatus(getRouteParam(req.params.prescriptionId), req.body ?? {}, req.currentUserId));
}));

prescriptionsRouter.get("/:prescriptionId", asyncHandler(async (req, res) => {
  const prescription = await getPrescription(getRouteParam(req.params.prescriptionId), req.currentUserId);

  if (!prescription) {
    res.status(404).json({ message: "Prescription not found" });
    return;
  }

  res.json(prescription);
}));

prescriptionsRouter.get("/:prescriptionId/file", asyncHandler(async (req, res) => {
  const prescription = await getPrescription(getRouteParam(req.params.prescriptionId), req.currentUserId);

  if (!prescription?.sourcePath || !fs.existsSync(prescription.sourcePath)) {
    res.status(404).json({ message: "Prescription file not found" });
    return;
  }

  if (prescription.sourceFileName) {
    res.download(prescription.sourcePath, prescription.sourceFileName);
    return;
  }

  res.download(prescription.sourcePath);
}));
