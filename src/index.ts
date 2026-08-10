import express from "express";
import cors from "cors";
import { createServer } from "http";
import dotenv from "dotenv";
import { registerRoutes } from "./routes/index.js";
import { initializeDatabase } from "./storage/index.js";

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Health check
app.get("/health", (_req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

// Initialize database and register routes
(async () => {
  try {
    await initializeDatabase();
    console.log("[DB] ✅ Database initialized");
    
    await registerRoutes(httpServer, app);
    console.log("[API] ✅ Routes registered");
    
    const PORT = Number(process.env.PORT || 5000);
    httpServer.listen(PORT, '0.0.0.0', () => {
      console.log(`\n🐾 SNOOPY BOT v2.0 running on port ${PORT}`);
      console.log(`📡 API: http://localhost:${PORT}/api`);
      console.log(`🤖 NODE_ENV: ${process.env.NODE_ENV || "development"}\n`);
    });
  } catch (err: any) {
    console.error("[FATAL] Startup error:", err.message);
    process.exit(1);
  }
})();

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("[SHUTDOWN] SIGTERM received — closing server");
  httpServer.close(() => {
    console.log("[SHUTDOWN] ✅ Server closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("[SHUTDOWN] SIGINT received — closing server");
  httpServer.close(() => {
    console.log("[SHUTDOWN] ✅ Server closed");
    process.exit(0);
  });
});
