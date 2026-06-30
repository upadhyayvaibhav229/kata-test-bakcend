import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";

// import formRoutes from "./routes/form.routes";
import kataTestRoutes from "./routes/katatest.routes";
// import sessionRoutes from "./routes/session.routes";
import scoreRoutes from "./routes/score.routes";
import resultRoutes from "./routes/result.routes";
import authRoutes from "./routes/auth.routes";
import { errorMiddleware } from "./middlewares/error.middleware";
import dashboardRoutes from "./routes/dashboard.routes";
import profileRoutes from "./routes/profile.routes";
import adminRoutes from "./routes/admin.routes";

const app = express();

app.use(helmet());
// CORS: explicit allowlist to avoid reflecting arbitrary origins with credentials
const allowedOrigins = [
  process.env.CORS_ORIGIN,
  ...(process.env.NODE_ENV !== "production" ? ["http://localhost:8080"] : []),
].filter(Boolean) as string[];

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // allow requests with no origin (e.g. curl, server-to-server, mobile apps)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(cookieParser());

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

// ─── Health Check ─────────────────────────────────────────────────────────────

app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Kata Tournament API is running",
    timestamp: new Date().toISOString(),
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────

const API_PREFIX = "/api/v1";

// app.use(`${API_PREFIX}/forms`, formRoutes);
app.use(`${API_PREFIX}/kata-test`, kataTestRoutes);
app.use("/api/registrations", kataTestRoutes);
app.use(`${API_PREFIX}/scores`, scoreRoutes);
// app.use(`${API_PREFIX}/sessions`, sessionRoutes);
// app.use(`${API_PREFIX}/scores`, scoreRoutes);
app.use(`${API_PREFIX}/results`, resultRoutes);
app.use(`${API_PREFIX}/dashboard`, dashboardRoutes);
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/profile`, profileRoutes);
app.use(`${API_PREFIX}/admin`, adminRoutes);

//

// ─── 404 Handler ─────────────────────────────────────────────────────────────

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    data: null,
  });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────

app.use(errorMiddleware);

export { app };
