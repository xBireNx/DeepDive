# DeepDive — Retail Stock Analysis Platform

**A complete, free, end-to-end stock analysis workstation for Indian retail investors.**
Fundamental analysis done the Buffett / Rakesh Jhunjhunwala way. No paid APIs. No subscriptions.

---

## Quickstart

```bash
pip install -r requirements.txt
python server.py
# Open browser → http://localhost:5000
# Type KRN → Click ▶ Analyse → Full analysis in 20–30 sec
```

---

## Features — 12-Tab Investor Workstation

| Tab | What It Does |
|---|---|
| **◈ Overview** | Price, charts (price/quarterly/shareholding/radar), all fundamental scorecards, Beneish M-Score, Altman Z-Score, technical signals |
| **◉ News** | Live news from Yahoo Finance + Google News, per-article sentiment scoring, keyword extraction, overall sentiment meter |
| **⊗ Advanced** | DuPont decomposition (4Y trend), Relative Return vs Nifty 50 with chart overlay, Working Capital margin trend, Annual Report red flags, Promoter transaction history |
| **⊞ Peers** | Peer table from Screener.in, metric bar comparison, head-to-head analyser (type any peer for live comparison) |
| **⊛ DCF** | 7 sliders (growth, margin, WACC, terminal growth, MOS), live intrinsic value, Bear/Base/Bull scenarios, value decomposition |
| **✓ Checklist** | 20-question Buffett/RJ pre-buy checklist, readiness score, persists per stock |
| **◉ Size** | Position sizing via Fixed Fractional + Kelly Criterion with full breakdown |
| **⊡ Screen** | Filter all analysed stocks by P/E, ROE, D/E, growth, grade, trend — ranked by score |
| **◫ Portfolio** | Holdings with live P&L, sector donut, grade mix, concentration risk |
| **◩ Journal** | Trade log with behavioral emotion tracker (FOMO vs Disciplined pattern) |
| **◎ Alerts** | Buy Zone / Target / Stop-Loss price ladder per stock, auto-triggered alerts |
| **◧ Notes** | Per-stock investment thesis notepad, format buttons, persists in localStorage |

Plus: **PDF Export** (browser print → Save as PDF), **Conviction Level** tagging per watchlist stock.

---

## Fundamental Scoring (Buffett / RJ Style)

5 dimensions scored 0–10 each (50 total):

- **Business Quality** — ROCE, ROE, gross/op margins, revenue CAGR
- **Financial Health** — D/E, current ratio, FCF/PAT, interest coverage
- **Growth Quality** — Revenue & PAT CAGR 3Y, YoY, operating leverage check
- **Valuation** — P/E, P/B, PEG, EV/EBITDA
- **Management** — Promoter stake/trend, ace investors, FII, debtor days

Plus: Beneish M-Score (manipulation) + Altman Z-Score (bankruptcy risk)

---

## Architecture

```
deepdive/
├── dashboard.html          ← Complete frontend (12 tabs, all JS inline)
├── server.py               ← Flask API backend
├── main.py                 ← CLI: python main.py KRN
├── batch.py                ← Batch: python batch.py KRN RELIANCE ...
├── requirements.txt
│
├── fetcher/
│   ├── yfinance_data.py    ← Price, financials, ratios, holders
│   ├── screener_data.py    ← Peers, quarterly, promoter (Screener.in)
│   └── news_sentiment.py  ← News + keyword sentiment scoring
│
├── analysis/
│   ├── fundamental.py      ← Buffett/RJ scoring + Beneish + Altman
│   ├── technical.py        ← MACD, RSI, ADX, Bollinger, SMA (pandas-ta)
│   └── advanced.py         ← DuPont, WC trend, Nifty alpha, red flags
│
└── report/
    └── html_generator.py   ← Standalone HTML report (CLI mode)
```

### API Endpoints

| Endpoint | Description |
|---|---|
| `GET /api/status` | Health check |
| `GET /api/analyse/<symbol>` | Full analysis (cached 15 min) |
| `GET /api/news/<symbol>` | News + sentiment (cached 10 min) |
| `GET /api/price/<symbol>` | Quick price |
| `POST /api/screen` | Filter stocks in cache |
| `POST /api/batch` | Analyse multiple tickers |

---

## Data Sources — All Free

| Source | Data |
|---|---|
| Yahoo Finance (yfinance) | Price, financials, ratios, holders, news |
| Screener.in (scraped) | Peers, quarterly results, promoter history |
| Google News RSS | News articles |
| pandas-ta | Technical indicators (local computation) |

**Total running cost: ₹0.**

---

## CLI Mode

```bash
# Single stock → HTML report saved to reports/
python main.py KRN
python main.py "Tata Motors"

# Multiple stocks → individual reports + comparison table
python batch.py KRN RELIANCE HDFCBANK BLUESTAR
python batch.py --file watchlist.txt
```

---

## Known Limitations

| Issue | Notes |
|---|---|
| Screener.in may block scraping | Use CLI tool for more reliable peer/quarterly data |
| Yahoo Finance rate limits | Add delay between batch calls if needed |
| News sentiment is keyword-based | Not AI — always read full articles for context |
| No real-time streaming | Prices refresh on demand only |
| Concall transcripts | Not automated — manual reading required |
| Beneish needs 2Y data | New companies may show "Insufficient data" |

---

## Can You Monetise This?

Yes. Clear paths exist:

**SaaS Subscription (Fastest)**
Host on Railway/Render (~₹800/month). Charge ₹299–499/month per user.
Target audience: retail investors paying for Tickertape, Trendlyne, Stockal.
India has 13 crore+ demat accounts — even 1,000 subscribers = ₹3–5L/month revenue.

**White-Label for SEBI RIAs**
Registered Investment Advisers need research tools.
₹2,000–5,000/month per advisor. SEBI has 1,300+ registered RIAs.

**Freemium**
Free: 5 stocks, basic analysis.
Pro (₹299/month): Unlimited stocks, screener, PDF reports, portfolio sync.

**Content + Tool Bundle**
YouTube/newsletter teaching Buffett-style investing using this as demonstration.
Tool drives audience, audience drives affiliate/course revenue.

**What's needed to launch paid:**
- User auth: Firebase (free tier)
- Database: Supabase (free tier)  
- Payments: Razorpay (free until transactions)
- Hosting: Railway.app (~₹800/month)
- SEBI compliance disclaimer pages

**Estimated time to paid product: 2–3 weeks.**

---

## Disclaimer

For educational and research purposes only. Not investment advice.
Always do your own due diligence before investing.

Data: Yahoo Finance · Screener.in · Google News
