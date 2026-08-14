import { Request, Response } from "express";
import crypto from "crypto";
import { User } from "../models/User";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/AppError";
import { logActivity } from "../utils/activityLogger";
import { sanitizeUser, signToken } from "../utils/jwt";

interface RegisterBody {
  name: string;
  email: string;
  password: string;
}

interface LoginBody {
  email: string;
  password: string;
}

interface GoogleAuthBody {
  googleIdToken: string;
  email: string;
  name: string;
}

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password } = req.body as RegisterBody;

  if (!name || typeof name !== "string") {
    throw new AppError("Name is required", 400);
  }

  if (!email || typeof email !== "string") {
    throw new AppError("Email is required", 400);
  }

  if (!password || typeof password !== "string" || password.length < 6) {
    throw new AppError("Password must be at least 6 characters", 400);
  }

  const existingUser = await User.findOne({ email: email.trim().toLowerCase() });

  if (existingUser) {
    throw new AppError("Email is already registered", 409);
  }

  const user = await User.create({
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password,
    role: "CUSTOMER",
    authProvider: "LOCAL",
  });

  await logActivity("USER", `New user registered: ${user.email}`, {
    userId: user._id,
  });

  const token = signToken({
    _id: user._id.toString(),
    id:user._id.toString(),
    role: user.role,
  });

  res.status(201).json({
    success: true,
    data: {
      message: "Registration successful",
      token,
      user: sanitizeUser(user),
    },
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body as LoginBody;

  if (!email || !password) {
    throw new AppError("Email and password are required", 400);
  }

  const user = await User.findOne({ email: email.trim().toLowerCase() }).select(
    "+password"
  );

  if (!user || user.authProvider === "GOOGLE" || !(await user.comparePassword(password))) {
    throw new AppError("Invalid email or password", 401);
  }

  const token = signToken({
    _id: user._id.toString(),
    role: user.role,
    id:user._id.toString(),
  });

  res.status(200).json({
    success: true,
    data: {
      message: "Login successful",
      token,
      user: sanitizeUser(user),
    },
  });
});

export const googleAuth = asyncHandler(async (req: Request, res: Response) => {
  const { googleIdToken, email, name } = req.body as GoogleAuthBody;

  if (!googleIdToken || typeof googleIdToken !== "string") {
    throw new AppError("googleIdToken is required", 400);
  }

  if (!email || typeof email !== "string") {
    throw new AppError("Email is required", 400);
  }

  if (!name || typeof name !== "string") {
    throw new AppError("Name is required", 400);
  }

  const normalizedEmail = email.trim().toLowerCase();

  let user = await User.findOne({
    $or: [{ googleId: googleIdToken }, { email: normalizedEmail }],
  }).select("+password");

  if (user) {
    user.name = name.trim();
    user.email = normalizedEmail;
    user.googleId = googleIdToken;
    user.authProvider = "GOOGLE";
    await user.save();
  } else {
    user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      googleId: googleIdToken,
      authProvider: "GOOGLE",
      password: crypto.randomBytes(32).toString("hex"),
      role: "CUSTOMER",
    });

    await logActivity("USER", `Google user registered: ${user.email}`, {
      userId: user._id,
    });
  }

  const token = signToken({
    _id: user._id.toString(),
    role: user.role,
    id:user._id.toString(),
  });

  res.status(200).json({
    success: true,
    data: {
      message: "Google login successful",
      token,
      user: sanitizeUser(user),
    },
  });
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("Authentication required", 401);
  }

  const user = await User.findById(req.user.id);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  res.status(200).json({
    success: true,
    data: sanitizeUser(user),
  });
});
