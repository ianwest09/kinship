import express from "express";
import { runAgent } from "./moment/agent.js";
export function createKinshipApiApp() {
  const app = express();
  app.use(express.json({ limit: "20kb" }));
  app.use((_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader(
      "Permissions-Policy",
      "camera=(), microphone=(), geolocation=()",
    );
    next();
  });
  app.get("/api/status", (_req, res) =>
    res.json({
      qlooConfigured: Boolean(process.env.QLOO_API_KEY),
      geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    }),
  );
  app.get("/api/health", (_req, res) => res.json({ ok: true }));
  app.post("/api/moment", async (req, res) => {
    res.setHeader("Content-Type", "application/x-ndjson; charset=utf-8");
    res.setHeader("Cache-Control", "no-store, no-transform");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();
    const send = (event: unknown) => {
      if (!res.destroyed) res.write(JSON.stringify(event) + "\n");
    };
    try {
      const moment = await runAgent(
        req.body?.profile,
        (p) => send({ type: "progress", ...p }),
        {
          skipQloo: req.body?.skipQloo === true,
          variantOffset: req.body?.alternate === true ? 1 : 0,
        },
      );
      send({ type: "result", moment });
    } catch (e) {
      send({
        type: "error",
        message:
          e instanceof Error
            ? e.message
            : "Something went wrong. Please try again.",
      });
    }
    res.end();
  });
  return app;
}
