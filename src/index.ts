// src/index.ts
import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import formsRouter         from "./routes/forms";
import registrationsRouter from "./routes/registrations";
import testsRouter         from "./routes/tests";
import { errorHandler }    from "./middleware/errorHandler";

const app = express();

// ── Global middleware ─────────────────────────────────────────────────────────

app.use(helmet());
app.use(
  cors({
    // Update origin to your frontend URL in production
    origin: process.env.FRONTEND_URL ?? "*",
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  })
);
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.json());

// ── Health check ──────────────────────────────────────────────────────────────

app.get("/health", (_req, res) => res.json({ status: "ok", ts: new Date() }));

// ── Routes ────────────────────────────────────────────────────────────────────

app.use("/api/forms",         formsRouter);
app.use("/api/registrations", registrationsRouter);
app.use("/api/tests",         testsRouter);

// 404 catch-all
app.use((_req, res) => res.status(404).json({ error: "Route not found" }));

// Central error handler (must be last)
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────────────────────

const PORT = Number(process.env.PORT) || 4000;
app.listen(PORT, () => {
  console.log(`🥋 Karate API running on http://localhost:${PORT}`);
});

export default app;
