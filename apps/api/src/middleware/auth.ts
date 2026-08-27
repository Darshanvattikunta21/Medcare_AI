import type { NextFunction, Request, Response } from "express";
import { readAuthToken } from "../lib/auth";
import { env } from "../config/env";
import { getUserById as getUserByIdFromDb } from "../services/database.service";
import { getUserById } from "../services/data.service";
import { unauthorized } from "../lib/errors";

declare global {
  namespace Express {
    interface Request {
      currentUserId?: string;
    }
  }
}

export async function attachCurrentUser(req: Request, _res: Response, next: NextFunction) {
  try {
    const authorization = req.header("authorization");
    const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : undefined;
    const payload = token ? readAuthToken(token) : null;

    if (payload?.sub) {
      const user = env.useDatabase ? await getUserByIdFromDb(payload.sub) : getUserById(payload.sub);
      if (user) {
        req.currentUserId = payload.sub;
      }
    }

    next();
  } catch (error) {
    next(error);
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  if (!req.currentUserId) {
    return next(unauthorized("Authentication required. Please log in."));
  }
  next();
}
