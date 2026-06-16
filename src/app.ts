import express from "express";
import cors from "cors";

// import formRoutes from "./routes/form.routes";
import kataTestRoutes from "./routes/katatest.routes";
// import sessionRoutes from "./routes/session.routes";
import scoreRoutes from "./routes/score.routes";
import resultRoutes from "./routes/result.routes";
import { errorMiddleware } from "./middlewares/error.middleware";

const app = express();

// ─── Core Middleware ──────────────────────────────────────────────────────────

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    credentials: true,
  })
);

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
