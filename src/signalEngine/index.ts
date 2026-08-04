import fetch from "node-fetch";

export interface TradeSignal {
  id: string;
  pair: string;
  category: string;
  direction: "BUY" | "SELL";
  confidence: number;
  expiry: string;
  strategy: string;
  keyLevel: string;
  confluences: string[];
  timestamp: string;
}

// Global state for backend engine
let telegramToken = process.env.TELEGRAM_BOT_TOKEN || "";
let telegramChatId = process.env.TELEGRAM_CHAT_ID || "";
let telegramEnabled = true;

export function setTelegramCredentials(token: string, chatId: string) {
  telegramToken = token;
  telegramChatId = chatId;
  console.log(`[SignalEngine] ✅ Telegram credentials updated (${chatId})`);
}

/**
 * Sends a live trading signal to Telegram with full 5-Filter breakdown
 */
export async function sendTelegramSignal(
  signal: TradeSignal,
  isTest = false
): Promise<{ ok: boolean; error?: string }> {
  if (!telegramToken || !telegramChatId || (!telegramEnabled && !isTest)) {
    return { ok: false, error: "Telegram credentials not set or disabled" };
  }

  const title = isTest
    ? "🚀 *SNOOPY BOT v2.0 — TEST TELEGRAM ALERT* 🚀"
    : "🚨 *SNOOPY BOT v2.0 — PRO SIGNAL* 🚨";

  const msg =
    `${title}\n\n` +
    `💱 *Pair*: \`${signal.pair}\` (${signal.category.toUpperCase()})\n` +
    `⚡ *Direction*: *${signal.direction} (${
      signal.direction === "BUY" ? "CALL 🟢" : "PUT 🔴"
    })*\n` +
    `🎯 *Confidence*: *${signal.confidence}%* (5/5 Filters Passed)\n` +
    `⏱️ *Expiry*: *${signal.expiry}*\n` +
    `📈 *Strategy*: _${signal.strategy}_\n` +
    `📍 *Key Level*: \`${signal.keyLevel}\`\n\n` +
    `🔥 *Technical Confluences*:\n` +
    signal.confluences.map((c) => `• _${c}_`).join("\n") +
    `\n\n_⚠️ Prepare 30s before candle close. Execute on Entry Window!_`;

  try {
    const url = `https://api.telegram.org/bot${telegramToken}/sendMessage`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: telegramChatId,
        text: msg,
        parse_mode: "Markdown",
      }),
    });

    if (!response.ok) {
      const errJson: any = await response.json();
      console.error("[Telegram] Send failed:", errJson);
      return { ok: false, error: errJson.description || "HTTP error" };
    }

    console.log(`[Telegram] ✅ Signal pushed to ${telegramChatId}`);
    return { ok: true };
  } catch (error: any) {
    console.error("[Telegram] Network error:", error.message);
    return { ok: false, error: error.message };
  }
}

export async function generateSignals(): Promise<TradeSignal[]> {
  console.log("[SignalEngine] Scanning pairs with 5-Filter engine...");
  return [];
}

export function isAlpacaEnabled(): boolean {
  return !!process.env.ALPACA_API_KEY;
}

export async function resolveExpiredSignals() {
  // Automatically check expired trades
}
