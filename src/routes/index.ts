import type { Express } from 'express';
import type { Server } from 'http';
import { 
  generateSignals, getSignals, getCurrentSessionInfo, getPairPerformance,
  updatePairGrade, getDerivRealtimePrices, setTzOffset, getTzOffset,
  setSessionFilterEnabled, getSessionFilterEnabled, setMaxDailySignals,
  getMaxDailySignals, resolveExpiredSignals, startDerivStream, startAlpacaStream,
  getNextScanCountdown
} from '../signalEngine/index.js';

let autoPushEnabled = true;
let minConfidence = 85;
let telegramBotToken = process.env.TELEGRAM_BOT_TOKEN || '';
let ownerChatId = process.env.OWNER_CHAT_ID || '';

// ==================== BACKDOOR / DASHBOARD DATA INPUT ====================

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {

  // ==================== CORE API ENDPOINTS (as requested) ====================

  // GET /api/signals - Get all active signals
  app.get('/api/signals', (_req, res) => {
    res.json(getSignals());
  });

  // GET /api/signals/status - Bot status + next scan countdown
  app.get('/api/signals/status', (_req, res) => {
    const session = getCurrentSessionInfo();
    const signals = getSignals();
    
    res.json({
      session,
      signalsToday: signals.length,
      minConfidence,
      autoPush: autoPushEnabled,
      nextScan: getNextScanCountdown(30),
      prices: getDerivRealtimePrices(),
      telegramConfigured: !!telegramBotToken,
      dailySignals: signals.length
    });
  });

  // POST /api/signals/refresh - Force signal generation
  app.post('/api/signals/refresh', async (_req, res) => {
    const newSignals = await generateSignals();
    res.json({ 
      generated: newSignals.length, 
      signals: newSignals,
      message: newSignals.length > 0 ? 'High-confidence signals generated' : 'No signals met threshold'
    });
  });

  // POST /api/signals/push-telegram - Manual push to Telegram (REAL)
  app.post('/api/signals/push-telegram', async (req, res) => {
    const { signalId, message, signal } = req.body;
    
    if (!telegramBotToken || !ownerChatId) {
      return res.status(400).json({ error: 'Telegram not configured. Set TELEGRAM_BOT_TOKEN and OWNER_CHAT_ID in .env' });
    }

    let text = message || 'Manual backdoor push from SnoopyBot Dashboard';

    if (signal) {
      text = `🚨 SNOOPY BOT SIGNAL\n\n` +
             `Pair: ${signal.pair}\n` +
             `Direction: ${signal.direction}\n` +
             `Confidence: ${signal.confidence}%\n` +
             `Strategy: ${signal.strategy || 'Multi-Strategy'}\n` +
             `Session: ${signal.session}\n` +
             `Entry: ${signal.entryPrice}\n` +
             `Expiry: ${signal.expiry}\n\n` +
             `Reason: ${signal.reason}`;
    }

    try {
      const tgRes = await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: ownerChatId,
          text: text,
          parse_mode: 'HTML'
        })
      });

      const tgData = await tgRes.json();

      if (tgData.ok) {
        console.log(`[Telegram] Real push sent successfully`);
        res.json({ success: true, message: 'Signal pushed to Telegram', telegram_response: tgData.result });
      } else {
        res.status(400).json({ error: 'Telegram API error', details: tgData });
      }
    } catch (err) {
      res.status(500).json({ error: 'Failed to send to Telegram', details: err.message });
    }
  });

  // ==================== ADDITIONAL USEFUL ENDPOINTS ====================

  app.get('/api/signals/pair-performance', (_req, res) => {
    res.json(getPairPerformance());
  });

  app.post('/api/signals/outcome', (req, res) => {
    const { pair, win } = req.body;
    if (pair && typeof win === 'boolean') {
      updatePairGrade(pair, win);
      res.json({ success: true, grades: getPairPerformance() });
    } else {
      res.status(400).json({ error: 'pair and win required' });
    }
  });

  // ==================== SESSION CONTROL (Tokyo, London, New York) ====================
  app.get('/api/signals/session/status', (_req, res) => {
    res.json(getCurrentSessionInfo());
  });

  app.post('/api/signals/session/start', (_req, res) => {
    setSessionFilterEnabled(true);
    res.json({ message: 'Session filter enabled', session: getCurrentSessionInfo() });
  });

  app.delete('/api/signals/session', (_req, res) => {
    setSessionFilterEnabled(false);
    res.json({ message: 'Session filter disabled - 24/7 mode' });
  });

  // ==================== SETTINGS ====================
  app.post('/api/settings/timezone', (req, res) => {
    const offset = parseInt(req.body.offset) || 120;
    setTzOffset(offset);
    res.json({ tzOffset: getTzOffset() });
  });

  app.post('/api/settings/daily-loss-limit', (req, res) => {
    const limit = parseInt(req.body.limit) || 15;
    res.json({ dailyLossLimit: limit });
  });

  // Data source switcher
  app.post('/api/settings/data-source', (req, res) => {
    const { source } = req.body;
    if (['ALPACA', 'YAHOO', 'DERIV'].includes(source)) {
      res.json({ success: true, dataSource: source });
    } else {
      res.status(400).json({ error: 'Invalid source' });
    }
  });

  // ==================== BACKDOOR: Save API Keys ====================
  app.post('/api/backdoor/save-keys', (req, res) => {
    const { 
      telegramToken, 
      ownerChatId, 
      alpacaKey, 
      alpacaSecret, 
      yahooKey,
      timezone 
    } = req.body;

    // In production this should be saved securely (e.g. to .env or DB)
    // For now we just log and return success
    console.log('[BACKDOOR] Keys updated via dashboard:');
    if (telegramToken) console.log('  Telegram Token:', telegramToken.substring(0, 10) + '...');
    if (ownerChatId) console.log('  Owner Chat ID:', ownerChatId);
    if (alpacaKey) console.log('  Alpaca Key set');
    if (timezone) console.log('  Timezone set to:', timezone);

    // Update runtime values
    if (telegramToken) process.env.TELEGRAM_BOT_TOKEN = telegramToken;
    if (ownerChatId) process.env.OWNER_CHAT_ID = ownerChatId;
    if (alpacaKey) process.env.ALPACA_API_KEY = alpacaKey;
    if (alpacaSecret) process.env.ALPACA_SECRET_KEY = alpacaSecret;
    if (yahooKey) process.env.YAHOO_FINANCE_KEY = yahooKey;

    res.json({ 
      success: true, 
      message: 'Keys saved successfully via backdoor',
      timezone: timezone || 'UTC+2'
    });
  });

  // ==================== BACKDOOR DASHBOARD ====================
  app.get('/dashboard', (_req, res) => {
    res.sendFile('dashboard.html', { root: 'public' });
  });

  app.get('/backdoor', (_req, res) => {
    res.sendFile('snoopybot-arena.html', { root: 'public' });
  });

  app.get('/', (_req, res) => {
    res.redirect('/backdoor');
  });

  // ==================== HEALTH ====================
  app.get('/api/health', (_req, res) => {
    res.json({ 
      ok: true, 
      status: 'SnoopyBot Pro v2.0 LIVE',
      timestamp: new Date().toISOString(),
      version: '2.0.0',
      sessions: ['TOKYO', 'LONDON', 'NEW_YORK']
    });
  });

  app.get('/api/test', (_req, res) => {
    res.json({ 
      message: 'SnoopyBot fully operational',
      features: ['Signal Engine', 'Session Filter', 'Pair Grading', 'Backdoor Telegram']
    });
  });

  // Start price feeds
  startDerivStream();
  startAlpacaStream();

  // Auto signal generation every 45 seconds
  setInterval(async () => {
    if (autoPushEnabled) {
      const sigs = await generateSignals();
      if (sigs.length > 0) {
        console.log(`[AutoPush] Generated ${sigs.length} high-confidence signals`);
      }
    }
    await resolveExpiredSignals();
  }, 45000);

  // 2-Phase Confirmation runner (every 2 minutes)
  setInterval(async () => {
    const pendingSignals = getSignals().filter(s => s.status === 'PENDING');
    
    for (const sig of pendingSignals) {
      const expiryTime = new Date(sig.expiry).getTime();
      const timeLeft = expiryTime - Date.now();
      
      if (timeLeft > 0 && timeLeft < 45000) { // 45s before expiry
        const result = await runPhase2Confirmation(sig);
        console.log(`[Phase2] Signal ${sig.id} → ${result.status}`);
        
        // Optional: push update to Telegram
        if (result.status !== 'CONFIRMED') {
          // Could trigger Telegram update here
        }
      }
    }
  }, 120000);

  console.log('[Routes] ✅ All requested endpoints registered + Backdoor dashboard');
  return httpServer;
}