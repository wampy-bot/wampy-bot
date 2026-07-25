# 🐾 SNOOPY BOT PRO v2.0

**Professional Trading Signal Engine** with AI Auto-Push, Real-Time Price Feeds, and Automated Broker Execution

---

## 🎯 Features

### ✅ Signal Generation
- **Live Price Feeds**: Alpaca (crypto) + Deriv (OTC forex)
- **Real-Time Analysis**: EMA 200, SMA 20/50 crossovers, ADX momentum confirmation
- **Smart Filtering**: Confluence scoring, trend alignment, reversal detection
- **Multi-Session**: London, New York, Tokyo, Weekend trading awareness

### ✅ AI Auto-Push (Telegram)
- **Intelligent Delivery**: 85%+ confidence filtering, 2 signals/cycle max
- **2-Phase Confirmation**: 30s-before-candle rescan with CONFIRMED/UPDATED/CANCELLED outcomes
- **One-Tap Trading**: Inline WIN/LOSS buttons for manual record-keeping
- **News Awareness**: Forex Factory integration blocks high-impact economic events
- **Pair Performance Feedback**: Dynamic grading (🔥 HOT → 🚫 FROZEN) based on recent win rates

### ✅ Broker Integration
- **Pocket Option**: Live WebSocket auto-execution
- **IQ Option**: Session-based auto-trading
- **Position Sizing**: Fixed $10 stake, martingale progression ready
- **Demo Mode**: Test executions before live trading

### ✅ Session Scheduler
- **15-Minute Slots**: Fire 1 best signal per slot, 2 min pre-alert
- **Active Hours Control**: User timezone + custom trading windows
- **Daily Loss Limits**: Automatic signal block after N manual losses
- **Cooldown Management**: Per-pair re-send protection (survives server restarts)

### ✅ Performance Tracking
- **Per-Pair Win Rates**: Last 20 trades with auto-unfreeze after 7 days
- **Live Dashboard**: Real-time signal history, accuracy stats, broker status
- **Outcome Recording**: Auto-resolve for live signals, manual buttons for OTC
- **Trade Journal**: Full entry/exit timestamps, confluence, results

---

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+**
- **npm** or **yarn**
- Telegram Bot (from @BotFather)
- Alpaca API key (optional, for live crypto)
- Deriv / Pocket Option / IQ Option accounts

### 1. Clone & Install

```bash
git clone https://github.com/wampy-bot/wampy-bot.git
cd wampy-bot
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your API keys:
- Telegram bot token & chat ID
- Alpaca API credentials
- Broker SSID tokens
- Database path

### 3. Run Locally

```bash
npm run dev  # Development with auto-reload
```

Server runs on `http://localhost:5000`

### 4. Deploy to Railway (Recommended)

#### Option A: Via CLI

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login & deploy
railway login
railway init
railway up
```

#### Option B: Via GitHub

1. Push repo to GitHub
2. Go to [railway.app](https://railway.app)
3. Click "New Project" → "Deploy from GitHub repo"
4. Select `wampy-bot/wampy-bot`
5. Add environment variables in Railway dashboard
6. Deploy ✅

Your bot will be live at: `https://your-project-name.railway.app`

---

## 📡 API Endpoints

### Signals
- `GET  /api/signals` - Get all active signals
- `GET  /api/signals/status` - Bot status + next scan countdown
- `POST /api/signals/refresh` - Force signal generation
- `POST /api/signals/push-telegram` - Manual push to Telegram

### AI Auto-Push
- `GET  /api/signals/auto-push` - Current config
- `POST /api/signals/auto-push/toggle` - Enable/disable + settings

### Sessions
- `POST /api/signals/session/start` - Begin 15-min slot trading
- `DELETE /api/signals/session` - Stop session
- `GET  /api/signals/session/status` - Session state

### Broker
- `GET  /api/broker/status` - Connection status (PO + IQ)
- `POST /api/broker/ssid` - Connect broker with SSID token
- `GET  /api/broker/auto-execute` - Auto-exec mode status
- `POST /api/broker/auto-execute` - Toggle auto-execution
- `POST /api/broker/test-trade` - Place demo order

### Analytics
- `GET  /api/accuracy` - Overall win/loss stats
- `GET  /api/accuracy/by-pair` - Per-pair performance
- `GET  /api/accuracy/today` - Today's results (local timezone)
- `GET  /api/signals/pair-performance` - Grade report (🔥 HOT → 🚫 FROZEN)

### Settings
- `POST /api/settings/timezone` - Set user timezone offset
- `POST /api/settings/active-hours` - Trading window (HH:MM format)
- `POST /api/settings/daily-loss-limit` - Max manual losses before stop
- `POST /api/settings/session-filter` - Enable session filtering
- `POST /api/telegram/test` - Send test message

---

## 🎓 How It Works

### Signal Flow

```
1. Price Update (Real-time WS or 60s poll)
   ↓
2. Signal Engine Scan
   - EMA200 trend check
   - SMA20/50 crossover
   - ADX > 25 confirmation
   ↓
3. Confidence Scoring (confluence %)
   - Base: 70-80%
   - Bonus: +10% if ADX > 40
   - Penalty: -5% if reversal
   ↓
4. Filter Gates
   - Min confidence threshold (85% for live, 80% for OTC)
   - Pair performance check (if FROZEN, skip)
   - News event blocking (high-impact within 5 min)
   - Active hours + daily loss limit
   ↓
5. Cooldown Check
   - Per-pair + direction (survives restarts)
   - Block re-sends until candle exit time + 10s
   ↓
6. Telegram Push
   - Full signal detail with timing
   - Inline WIN/LOSS buttons (OTC outcomes)
   ↓
7. Auto-Execution Scheduled
   - Fire trade at exact candle open
   - Broker SSID required
   ↓
8. 2-Phase Confirmation
   - 30s before candle open: rescan fresh
   - Send CONFIRMED / UPDATED / CANCELLED
   ↓
9. Outcome Resolution
   - Live signals: auto-resolve via Alpaca
   - OTC signals: manual WIN/LOSS buttons
   ↓
10. Pair Performance Update
    - Grade assigned (🔥 HOT to 🚫 FROZEN)
    - Future signals adjusted by win rate
```

### Pair Grading System

Based on last 20 resolved outcomes:

| Trades | Win Rate | Grade | Required Confluence | Action |
|--------|----------|-------|--------------------|---------|
| < 5    | N/A      | 🆕 NEW | 80% | Send normally |
| 5+     | ≥ 65%    | 🔥 HOT | 80% | Send ✅ |
| 5+     | 55-64%   | ✅ GOOD | 82% | Send ✅ |
| 5+     | 45-54%   | ⚠️ WEAK | 90% | Require high confluence |
| 5+     | 35-44%   | 🔴 COLD | 93% | Require very high confluence |
| 5+     | < 35%    | 🚫 FROZEN | — | Skip entirely (alert sent once) |

**Auto-Unfreeze**: FROZEN pairs unfreeze after 7 days of improved trading or inactivity.

---

## 🛡️ Risk Management

✅ **Built-In Protections**
- Daily loss limit (auto-stop signals after N manual losses)
- News event detection (blocks high-impact events within 5 min)
- Per-pair performance tracking (downgrades weak pairs)
- Reversal signal penalty (-5% confluence for counter-trend)
- Active hours window (skip outside trading times)

⚠️ **Your Responsibility**
- **Test in DEMO mode first** (set `isDemo: true` in auto-execute)
- **Validate signals for 48-72 hours** before live money
- **Position size appropriately** (start with $1-5, scale gradually)
- **Monitor broker connection** before enabling auto-execute
- **Override when needed** (markets change, adapt your strategy)

---

## 📊 Dashboard

Access web dashboard at: `http://localhost:5000/dashboard` (coming soon)

Shows:
- Live signal feed (real-time)
- Current market session + timezone
- Broker connection status
- Today's P&L + accuracy stats
- Pair performance grades
- Session scheduler status

---

## 🔧 Configuration

### Environment Variables

```env
# Telegram (required for auto-push)
TELEGRAM_BOT_TOKEN=...
OWNER_CHAT_ID=...

# Alpaca (optional, live crypto)
ALPACA_API_KEY=...
ALPACA_SECRET_KEY=...

# Deriv (required for OTC forex)
DERIV_APP_ID=...
DERIV_API_TOKEN=...

# Broker SSIDs (set via API, not env)
# → POST /api/broker/ssid

# Signal tuning
MIN_CONFIDENCE=85        # Only push ≥85%
MAX_SIGNALS_PER_CYCLE=2  # Max 2 signals per 30s
LIVE_SIGNALS_ONLY=false  # true = OTC only

# Trading windows
ACTIVE_HOURS_START=06:00
ACTIVE_HOURS_END=22:00
DAILY_LOSS_LIMIT=15      # 0 = disabled
```

---

## 🚨 Troubleshooting

### Bot not sending Telegram signals
- ❌ Check `TELEGRAM_BOT_TOKEN` is correct (no quotes)
- ❌ Verify `OWNER_CHAT_ID` is numeric (no `@` symbols)
- ✅ Test: `POST /api/telegram/test`
- ✅ Check server logs for permission errors

### Broker SSID connection fails
- ❌ SSID expired or incorrect
- ✅ Re-authenticate via dashboard
- ✅ Verify broker account is active
- ✅ Check IP whitelist (some brokers require it)

### Signals not being generated
- ❌ Market outside active hours
- ❌ No new candles closed (wait for next candle close)
- ❌ Price feed unavailable
- ✅ Check `/api/signals/status` for data source errors
- ✅ Force refresh: `POST /api/signals/refresh`

### Database locked / SQLite errors
- ✅ Stop all server instances
- ✅ Delete `.db-shm` and `.db-wal` files
- ✅ Restart server

---

## 📈 Performance Tips

1. **Signal Quality > Quantity**
   - Keep `MIN_CONFIDENCE` high (85%+)
   - Limit to 2 signals per cycle
   - Monitor pair grades, disable FROZEN pairs

2. **Trade Active Hours Only**
   - Major volume: London 8am-1pm, NY 9:30am-4pm UTC
   - Avoid overnight chop (thin liquidity)
   - Set active hours to your prime trading time

3. **Let Confirmation Work**
   - 2-phase scan catches market reversals
   - Don't ignore CANCELLED messages
   - Manual override only on high-confluence setups

4. **Review Your Pair Selection**
   - Check `/api/signals/pair-performance` daily
   - Temporarily skip COLD pairs
   - Focus on HOT pairs with 60%+ recent win rate

5. **Demo Before Live**
   - Set broker to demo mode first
   - Validate auto-execution timing
   - Confirm signal timing matches broker candles

---

## 🐛 Reporting Issues

Found a bug? Open an issue on GitHub:
- Description of the problem
- Server logs (sanitize API keys)
- Steps to reproduce
- Expected vs actual behavior

---

## 📄 License

MIT — Use for personal trading only. No warranty.

---

## 🎯 Roadmap

- [ ] React dashboard (signals, settings, analytics)
- [ ] Backtesting module (test strategies on historical data)
- [ ] Advanced position sizing (Kelly criterion, volatility scaling)
- [ ] Multi-account support (trade multiple brokers simultaneously)
- [ ] Slack integration (alternative to Telegram)
- [ ] Machine learning pair selection (replace manual grade thresholds)
- [ ] Risk heat-map (identify high-risk pairs early)

---

**Remember**: The goal is protecting signal quality so full-time trading becomes inevitable. Trust the system, discipline your entries, execute your 10%. 🎯

🤖 **SNOOPY BOT v2.0** · *SNOOPY VIP*
