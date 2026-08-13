import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { AuthTokenPayload } from "../middlewares/auth.middleware";
import { UserRole, AuthProvider } from "../models/User";

const JWT_EXPIRES_IN = "7d";

export const signToken = (payload: AuthTokenPayload): string =>
  jwt.sign(payload, env.jwtSecret, { expiresIn: JWT_EXPIRES_IN });

export const sanitizeUser = (user: {
  _id: { toString(): string };
  name: string;
  email: string;
  role: UserRole;
  authProvider?: AuthProvider;
  createdAt?: Date;
  updatedAt?: Date;
}) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  role: user.role,
  authProvider: user.authProvider ?? "LOCAL",
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});
