import type { Express, Request, Response } from "express";
import type { Server } from "http";
import fetch from "node-fetch";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // 1. Server-side Yahoo Finance Proxy Endpoint for OHLC Bars
  // This ensures the frontend dashboard can fetch live candles even if browser CORS proxies fail
  app.get("/api/market/bars", async (req: Request, res: Response) => {
    const symbol = (req.query.symbol as string) || "EURUSD=X";
    const interval = (req.query.interval as string) || "5m";
    const range = (req.query.range as string) || "5d";

    try {
      const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
        symbol
      )}?interval=${encodeURIComponent(interval)}&range=${encodeURIComponent(
        range
      )}`;
      const response = await fetch(yahooUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      });

      if (!response.ok) {
        return res.status(response.status).json({
          ok: false,
          error: `Yahoo Finance API HTTP ${response.status}`,
        });
      }

      const data = await response.json();
      return res.json({
        ok: true,
        symbol,
        interval,
        data,
      });
    } catch (error: any) {
      console.error("[API] /api/market/bars error:", error.message);
      return res.status(500).json({
        ok: false,
        error: error.message || "Failed to fetch market bars",
      });
    }
  });

  // 2. Bot Status & 5-Filter Engine Verification Info
  app.get("/api/status", (_req: Request, res: Response) => {
    res.json({
      ok: true,
      botVersion: "2.0.0-PRO-REBUILD",
      engine: "5-Filter Technical Engine",
      filters: [
        "EMA 200 Trend Alignment",
        "ADX > 25 Strength",
        "Candle Body > 30% Anti-Doji",
        "Confirmation Candle Rule",
        "Support/Resistance Zone Filter",
      ],
      sessions: {
        london: "08:00 - 17:00 UTC",
        newYork: "13:00 - 22:00 UTC",
        tokyo: "00:00 - 09:00 UTC",
        sydney: "22:00 - 07:00 UTC",
      },
      timestamp: new Date().toISOString(),
    });
  });

  // 3. Trade Execution Bridge Endpoint
  app.post("/api/trade/execute", (req: Request, res: Response) => {
    const { pair, direction, duration, stake, broker, isDemo } = req.body;
    console.log(
      `[TRADE] Execution request: ${direction} ${pair} for ${duration} (${broker}) - Stake: $${stake}`
    );

    res.json({
      ok: true,
      tradeId: `TRD-${Date.now()}`,
      pair,
      direction,
      duration,
      stake: Number(stake) || 100,
      broker: broker || "Pocket Option",
      isDemo: isDemo ?? true,
      status: "EXECUTED",
      timestamp: new Date().toISOString(),
    });
  });


  // 5. Direct Backend Telegram Send Endpoint (Zero CORS Restrictions!)
  app.post("/api/telegram/send", async (req: Request, res: Response) => {
    const { token, chatId, text } = req.body;
    if (!token || !chatId || !text) {
      return res.status(400).json({ ok: false, error: "Missing token, chatId, or text" });
    }
    try {
      const tgUrl = `https://api.telegram.org/bot${token}/sendMessage`;
      const tgRes = await fetch(tgUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" }),
      });
      const tgJson: any = await tgRes.json();
      return res.status(tgRes.status).json(tgJson);
    } catch (err: any) {
      return res.status(500).json({ ok: false, error: err.message });
    }
  });

  // 6. Direct Backend Telegram Auto-Detect Updates Endpoint
  app.get("/api/telegram/updates", async (req: Request, res: Response) => {
    const token = req.query.token as string;
    if (!token) return res.status(400).json({ ok: false, error: "Missing token" });
    try {
      const tgUrl = `https://api.telegram.org/bot${token}/getUpdates?limit=5`;
      const tgRes = await fetch(tgUrl);
      const tgJson: any = await tgRes.json();
      return res.status(tgRes.status).json(tgJson);
    } catch (err: any) {
      return res.status(500).json({ ok: false, error: err.message });
    }
  });

  // 4. Test endpoint
  app.get("/api/test", (_req: Request, res: Response) => {
    res.json({
      ok: true,
      message: "SNOOPY BOT v2.0 API is online and ready.",
    });
  });

  return httpServer;
}
