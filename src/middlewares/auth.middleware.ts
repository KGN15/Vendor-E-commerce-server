import { Request, Response, NextFunction, RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { User, UserRole } from "../models/User";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../utils/asyncHandler";

export interface AuthTokenPayload {
  id: string;
  role: UserRole;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthTokenPayload;
    }
  }
}

const getBearerToken = (req: Request): string | null => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  return authHeader.slice(7).trim();
};

export const protect: RequestHandler = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    const token = getBearerToken(req);

    if (!token) {
      throw new AppError("Authentication required", 401);
    }

    try {
      const decoded = jwt.verify(token, env.jwtSecret) as AuthTokenPayload;
      const user = await User.findById(decoded.id).select("_id role");

      if (!user) {
        throw new AppError("User no longer exists", 401);
      }

      req.user = {
        id: user._id.toString(),
        role: user.role,
      };

      next();
    } catch {
      throw new AppError("Invalid or expired token", 401);
    }
  }
);

export const authorize =
  (...roles: UserRole[]): RequestHandler =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    if (!roles.includes(req.user.role)) {
      throw new AppError("You do not have permission to perform this action", 403);
    }

    next();
  };

export const optionalProtect: RequestHandler = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    const token = getBearerToken(req);

    if (!token) {
      return next();
    }

    try {
      const decoded = jwt.verify(token, env.jwtSecret) as AuthTokenPayload;
      const user = await User.findById(decoded.id).select("_id role");

      if (user) {
        req.user = {
          id: user._id.toString(),
          role: user.role,
        };
      }
    } catch {
      // Ignore invalid optional tokens for public routes
    }

    next();
  }
);
