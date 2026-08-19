import express, {
  Application,
  Request,
  Response,
  NextFunction,
  json,
  urlencoded,
} from "express";
import cors from "cors";
import path from "path";
import { env } from "./config/env";
import routes from "./routes";
import { AppError } from "./utils/AppError";
import { normalizeError } from "./utils/errorHandler";

const app: Application = express();

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }
      if (env.corsOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(json({ limit: "1mb" }));
app.use(urlencoded({ extended: true }));

app.use("/uploads", express.static(path.resolve(process.cwd(), env.uploadDir)));

app.use("/api", routes);

app.get("/api", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "E-Commerce Vendor API",
    version: "1.0.0",
  });
});

app.use((_req: Request, _res: Response, next: NextFunction) => {
  next(new AppError("Route not found", 404));
});

app.use(
  (
    err: Error & { status?: number; body?: unknown },
    _req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    if (res.headersSent) {
      next(err);
      return;
    }

    if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
      res.status(400).json({
        success: false,
        message: "Invalid JSON payload",
      });
      return;
    }

    const normalized = normalizeError(err);
    const statusCode = normalized.statusCode;
    const message =
      normalized.isOperational || !env.isProduction
        ? normalized.message
        : "Internal server error";

    if (!env.isProduction) {
      console.error(err);
    }

    res.status(statusCode).json({
      success: false,
      message,
    });
  },
);
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`❌ 404 Hit on: [${req.method}] ${req.originalUrl}`);
  next(new AppError(`Route ${req.originalUrl} not found`, 404));
});

export default app;
