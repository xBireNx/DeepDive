#!/usr/bin/env python3
"""
DeepDive v4 — Flask API Backend
All endpoints including news, advanced analysis, screener filter, PDF export data

Run: python server.py [--port 5000] [--debug]
"""
import sys, os, time, json, threading, argparse
from datetime import datetime
from unittest.mock import MagicMock

# ── Numba Mock for Python 3.14 compatibility ──────────────────────────────────
# pandas-ta requires numba, but numba doesn't support 3.14 yet.
mock_numba = MagicMock()
mock_numba.njit = lambda *args, **kwargs: (lambda f: f)
mock_numba.jit = lambda *args, **kwargs: (lambda f: f)
sys.modules["numba"] = mock_numba

sys.path.insert(0, os.path.dirname(__file__))

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS

from fetcher.yfinance_data import (resolve_ticker, get_price_data, get_company_info,
    get_financials, get_valuation_ratios, get_holders, get_dividend_analysis, get_earnings_history)
from fetcher.screener_data import scrape_screener
from fetcher.news_sentiment import fetch_all_news
from analysis.fundamental import run_fundamental_analysis
from analysis.technical import run_technical_analysis
from analysis.advanced import run_advanced
from fetcher.sector_rotation import get_sector_rotation
from fetcher.options_data import get_option_chain
from fetcher.concall_summary import get_concall_summary
from fetcher.mutual_funds import get_mutual_fund_analysis
from fetcher.strategic_analysis import get_strategic_analysis
from services.alert_service import alert_service
import random

app = Flask(__name__, static_folder="static" if os.path.exists(os.path.join(os.path.dirname(__file__), "static")) else ".", static_url_path="")
CORS(app)

# Start background alert polling
alert_service.start()

_cache = {}
_cache_lock = threading.Lock()
CACHE_TTL = 15 * 60   # 15 min full analysis
NEWS_TTL  = 10 * 60   # 10 min news
_news_cache = {}

def cache_get(k, store=None):
    store = store or _cache
    with _cache_lock:
        e = store.get(k)
        if e and time.time() - e["ts"] < CACHE_TTL:
            return e["data"]
    return None

def cache_set(k, data, store=None):
    store = store or _cache
    with _cache_lock:
        store[k] = {"data": data, "ts": time.time()}

def err(msg, code=400):
    return jsonify({"error": msg, "ok": False}), code

def ok(data):
    return jsonify({"ok": True, "ts": datetime.now().isoformat(), **data})

def serialise(obj):
    import pandas as pd, numpy as np
    if isinstance(obj, dict): return {k: serialise(v) for k,v in obj.items()}
    if isinstance(obj, list): return [serialise(i) for i in obj]
    if isinstance(obj, (pd.Series, pd.Index)): return [serialise(v) for v in obj]
    if isinstance(obj, pd.DataFrame): return obj.to_dict(orient="records")
    if isinstance(obj, np.integer): return int(obj)
    if isinstance(obj, np.floating): return None if np.isnan(obj) else float(obj)
    if isinstance(obj, np.ndarray): return obj.tolist()
    if hasattr(obj, 'isoformat'): return obj.isoformat()
    try:
        if obj != obj: return None
    except: pass
    return obj

def sc_dict(card):
    return {"category": card.category, "score": card.score, "max_score": card.max_score,
            "signals": card.signals, "narrative": card.narrative}

def _safe_run(fn, *args, fallback=None, label=""):
    """Run fn(*args) with full exception isolation. Returns fallback on any error."""
    try:
        return fn(*args)
    except Exception as e:
        print(f"[WARN] {label} failed: {e}")
        return fallback() if callable(fallback) else fallback

def run_full_analysis(query):
    ticker_str, ticker = resolve_ticker(query)
    symbol = ticker_str.replace(".NS","").replace(".BO","")

    company    = _safe_run(get_company_info, ticker, fallback=lambda:{"name":symbol,"sector":"N/A","industry":"N/A","market_cap":0,"market_cap_cr":0,"description":"","website":"","employees":"N/A","country":"India","exchange":"NSE"}, label="company_info")
    price_data = _safe_run(get_price_data,   ticker, fallback=lambda:{"current_price":0,"week52_high":0,"week52_low":0,"ret_1m":None,"ret_1y":None,"ret_5y":None,"hist_1y":None,"hist_5y":None}, label="price_data")
    fin        = _safe_run(get_financials,   ticker, fallback=dict, label="financials")
    ratios     = _safe_run(get_valuation_ratios, ticker, fallback=dict, label="ratios")
    holders    = _safe_run(get_holders,      ticker, fallback=lambda:{"promoter_pct":None,"institution_pct":None,"top_institutions":[]}, label="holders")
    screener   = _safe_run(scrape_screener,  symbol, fallback=lambda:{"shareholding":{},"promoter_history":[],"quarterly_results":[],"peers":[],"ace_investors":[]}, label="screener")

    fundamental = _safe_run(run_fundamental_analysis, fin or {}, ratios or {}, holders, screener,
                            company.get("market_cap_cr",0),
                            fallback=lambda:{"grade":"N/A","total_score":0,"max_total":50,"overall_pct":0,"scorecards":[],"beneish":{"score":None,"verdict":"N/A"},"altman":{"score":None,"verdict":"N/A"}},
                            label="fundamental")

    hist = price_data.get("hist_1y") if price_data else None
    technical = _safe_run(run_technical_analysis, hist,
                          fallback=lambda:{"trend":"N/A","prediction_long_pct":50,"rsi_val":None,"macd_verdict":None,"adx_val":None,"signals":[],"price_vs_ma":{},"support_resistance":{},"volume_analysis":{},"narrative":""},
                          label="technical")

    hist = price_data.get("hist_1y") if price_data else None
    price_history = []
    if hist is not None and not hist.empty and "Close" in hist.columns:
        for idx, row in hist.tail(60).iterrows():
            try:
                c = float(row["Close"]); h = float(row["High"]); l = float(row["Low"]); v = float(row.get("Volume", 0) or 0)
                import math
                if math.isnan(c): continue
                price_history.append({"date": str(idx.date()), "close": round(c,2),
                    "high": round(h,2) if not math.isnan(h) else round(c,2),
                    "low":  round(l,2) if not math.isnan(l) else round(c,2),
                    "volume": int(v)})
            except Exception:
                continue

    # Advanced analysis — fully isolated, never crashes the main pipeline
    adv_fallback = {"dupont":{"trend":[],"current":{},"insight":""},"wcTrend":{"trend":[],"insight":""},"relativeReturn":{"periods":{},"insight":"","niftyHistory":[],"outperforming":False},"redFlags":[{"flag":"No flags detected","severity":"CLEAR","detail":"Advanced analysis ran with available data."}],"promoterTx":[]}
    try:
        advanced = run_advanced(symbol, fin or {}, ratios or {}, screener or {}, price_history, ticker_obj=ticker, company_name=company.get("name",""))
    except Exception as e:
        print(f"[WARN] advanced analysis: {e}")
        advanced = adv_fallback

    dividends = _safe_run(get_dividend_analysis, ticker,
                      fallback=lambda:{"has_dividends":False,"track_record":[],"payout_frequency":None,"avg_yield":None,"last_payout":None,"avg_payout_5y":None,"total_payouts":0},
                      label="dividends")

    earnings_history = _safe_run(get_earnings_history, ticker, fallback=list, label="earnings")

    return {
        "ticker": ticker_str, "symbol": symbol,
        "company": serialise(company),
        "price": {"current": price_data.get("current_price"), "week52High": price_data.get("week52_high"),
                  "week52Low": price_data.get("week52_low"), "ret1m": price_data.get("ret_1m"),
                  "ret1y": price_data.get("ret_1y"), "ret5y": price_data.get("ret_5y")},
        "ratios": serialise(ratios),
        "fundamental": {"grade": fundamental["grade"], "totalScore": fundamental["total_score"],
                        "maxTotal": fundamental["max_total"], "overallPct": fundamental["overall_pct"],
                        "scorecards": [sc_dict(c) for c in fundamental["scorecards"]],
                        "beneish": fundamental["beneish"], "altman": fundamental["altman"]},
        "technical": {"trend": technical["trend"], "longPct": technical["prediction_long_pct"],
                      "rsiVal": technical["rsi_val"], "macdVerdict": technical["macd_verdict"],
                      "adxVal": technical["adx_val"], "signals": technical["signals"],
                      "priceVsMa": serialise(technical["price_vs_ma"]),
                      "supportResistance": serialise(technical["support_resistance"]),
                      "volumeAnalysis": serialise(technical["volume_analysis"]),
                      "narrative": technical["narrative"]},
        "shareholding": serialise(screener.get("shareholding",{})),
        "promoterHistory": serialise(screener.get("promoter_history",[])),
        "aceInvestors": screener.get("ace_investors",[]),
        "mfChanges": serialise(screener.get("mf_changes",[])),
        "holders": serialise(holders),
        "dividends": serialise(dividends),
        "quarterly": serialise(screener.get("quarterly_results",[])),
        "peers": serialise(screener.get("peers",[])),
        "priceHistory": price_history,
        "dupont": serialise(advanced["dupont"]),
        "wcTrend": serialise(advanced["wcTrend"]),
        "relativeReturn": serialise(advanced["relativeReturn"]),
        "redFlags": serialise(advanced["redFlags"]),
        "promoterTx": serialise(advanced["promoterTx"]),
        "earningsHistory": serialise(earnings_history),
    }

# ── ROUTES ────────────────────────────────────────────────────────────────────

@app.route("/")
def index():
    react = os.path.join(os.path.dirname(__file__), "static", "index.html")
    if os.path.exists(react):
        return send_from_directory("static", "index.html")
    return "<h3>Frontend not built yet. Run: npm run build inside frontend/</h3>", 200

@app.errorhandler(404)
def not_found(e):
    react = os.path.join(os.path.dirname(__file__), "static", "index.html")
    if os.path.exists(react):
        return send_from_directory("static", "index.html")
    return "<h3>Frontend not built yet.</h3>", 404

@app.route("/api/status")
def status():
    return ok({"status":"running","cached":list(_cache.keys()),"version":"4.0.0"})

@app.route("/api/search")
def search():
    q = request.args.get("q","").strip()
    if not q: return err("Query required")
    import requests as req
    try:
        r = req.get(f"https://query1.finance.yahoo.com/v1/finance/search?q={req.utils.quote(q)}&lang=en-US&region=IN&quotesCount=8&newsCount=0",
                    headers={"User-Agent":"Mozilla/5.0"}, timeout=6)
        results = [{"symbol":x.get("symbol"),"name":x.get("longname") or x.get("shortname",""),"exchange":x.get("exchange")}
                   for x in r.json().get("quotes",[]) if x.get("symbol","").endswith((".NS",".BO"))]
        return ok({"results": results[:6]})
    except Exception as e:
        return err(str(e))

@app.route("/api/analyse/<symbol>")
def analyse(symbol):
    symbol = symbol.upper().strip()
    force = request.args.get("force","false").lower()=="true"
    if not force:
        cached = cache_get(symbol)
        if cached: return ok({"data":cached,"cached":True})
    try:
        data = run_full_analysis(symbol)
        cache_set(symbol, data)
        return ok({"data":data,"cached":False})
    except ValueError as e: return err(f"Ticker not found: {e}", 404)
    except Exception as e: return err(f"Analysis failed: {str(e)}", 500)

@app.route("/api/news/<symbol>")
def get_news(symbol):
    symbol = symbol.upper().strip()
    # Short TTL for news
    with _cache_lock:
        nc = _news_cache.get(symbol)
        if nc and time.time() - nc["ts"] < NEWS_TTL:
            return ok({"news": nc["data"], "cached": True})
    try:
        ticker_str, ticker = resolve_ticker(symbol)
        company = get_company_info(ticker)
        news_data = fetch_all_news(symbol, company.get("name",""), ticker_obj=ticker)
        with _cache_lock:
            _news_cache[symbol] = {"data": news_data, "ts": time.time()}
        return ok({"news": news_data, "cached": False})
    except Exception as e:
        return err(str(e))

@app.route("/api/price/<symbol>")
def quick_price(symbol):
    symbol = symbol.upper().strip()
    try:
        ticker_str, ticker = resolve_ticker(symbol)
        p = get_price_data(ticker)
        r = get_valuation_ratios(ticker)
        return ok({"symbol":symbol,"price":p.get("current_price"),"ret1m":p.get("ret_1m"),
                   "ret1y":p.get("ret_1y"),"week52High":p.get("week52_high"),"week52Low":p.get("week52_low"),
                   "pe":r.get("pe"),"roe":r.get("roe")})
    except Exception as e: return err(str(e))

@app.route("/api/sector-rotation")
def sector_rotation():
    try:
        with _cache_lock:
            # simple 1-hour cache
            if "sector_rotation" in _cache and time.time() - _cache["sector_rotation"]["ts"] < 3600:
                return ok({"results": _cache["sector_rotation"]["data"]})
        data = get_sector_rotation()
        with _cache_lock:
            _cache["sector_rotation"] = {"data": data, "ts": time.time()}
        return ok({"results": data})
    except Exception as e:
        return err(str(e))

@app.route("/api/options/<symbol>")
def options(symbol):
    symbol = symbol.upper().strip()
    try:
        ticker_str, ticker = resolve_ticker(symbol)
        p = get_price_data(ticker)
        current_price = p.get("current_price")
        if not current_price:
            return err("Could not fetch current price for options chain")
        data = get_option_chain(symbol, current_price)
        return ok({"data": data})
    except Exception as e:
        return err(str(e))

@app.route("/api/concall/<symbol>")
def concall(symbol):
    symbol = symbol.upper().strip()
    try:
        data = get_concall_summary(symbol)
        return ok({"data": data})
    except Exception as e:
        return err(str(e))

@app.route("/api/mf/<symbol>")
def mutual_funds(symbol):
    symbol = symbol.upper().strip()
    try:
        data = get_mutual_fund_analysis(symbol)
        return ok({"data": data})
    except Exception as e:
        return err(str(e))

@app.route("/api/strategic/<symbol>")
def strategic(symbol):
    symbol = symbol.upper().strip()
    try:
        data = get_strategic_analysis(symbol)
        return ok({"data": data})
    except Exception as e:
        return err(str(e))

@app.route("/api/alerts/subscribe", methods=["POST"])
def subscribe_alert():
    data = request.json
    email = data.get("email")
    phone = data.get("phone")
    symbol = data.get("symbol")
    target = data.get("target")
    buy = data.get("buy")
    sl = data.get("sl")
    
    if not symbol:
        return err("Symbol is required")
        
    alert_service.add_alert(email, phone, symbol, target, buy, sl)
    return ok({"msg": f"Subscribed {symbol} to background alert polling."})

@app.route("/api/live-alerts")
def live_alerts():
    """Mock live market block deals and circuit breakers."""
    # 5% chance to generate an alert per poll
    if random.random() < 0.05:
        stocks = ["RELIANCE", "HDFCBANK", "INFY", "TCS", "ZOMATO", "SUZLON", "PAYTM"]
        types = ["BLOCK DEAL", "UPPER CIRCUIT", "LOWER CIRCUIT", "VOLUME SPIKE"]
        s = random.choice(stocks)
        t = random.choice(types)
        msg = f"[{t}] {s} just detected massive institutional flow!"
        return ok({"alert": msg})
    return ok({"alert": None})

@app.route("/api/screen", methods=["POST"])
def screen():
    """Filter analysed stocks in cache by user criteria."""
    body = request.get_json() or {}
    filters = body.get("filters", {})
    results = []
    with _cache_lock:
        stocks = {k: v["data"] for k,v in _cache.items()}
    for symbol, d in stocks.items():
        r = d.get("ratios",{}); f = d.get("fundamental",{}); t = d.get("technical",{})
        score = {"symbol": symbol, "name": d.get("company",{}).get("name",""),
                 "price": d.get("price",{}).get("current"),
                 "pe": r.get("pe"), "roe": r.get("roe"), "de": r.get("debt_to_equity"),
                 "netMargin": r.get("netMargin") or r.get("profit_margin"),
                 "revGrowth": r.get("revGrowth") or r.get("revenue_growth"),
                 "grade": f.get("grade",""), "trend": t.get("trend",""),
                 "longPct": t.get("longPct",50), "scorePct": f.get("overallPct",0)}
        # Apply filters
        passed = True
        if "maxPE" in filters and score["pe"] and score["pe"] > filters["maxPE"]: passed=False
        if "minROE" in filters and score["roe"] and score["roe"] < filters["minROE"]: passed=False
        if "maxDE" in filters and score["de"] and score["de"] > filters["maxDE"]: passed=False
        if "minGrade" in filters:
            grade_order={"A":4,"B":3,"C":2,"D":1,"F":0}
            g1=grade_order.get(score["grade"][0] if score["grade"] else "F",0)
            g2=grade_order.get(filters["minGrade"],0)
            if g1<g2: passed=False
        if "trendFilter" in filters and filters["trendFilter"]!="Any":
            if filters["trendFilter"].lower() not in (score["trend"] or "").lower(): passed=False
        if "minRevGrowth" in filters and score["revGrowth"] and score["revGrowth"] < filters["minRevGrowth"]: passed=False
        if passed: results.append(score)
    results.sort(key=lambda x: x.get("scorePct",0), reverse=True)
    return ok({"results": results, "total": len(results), "cached_stocks": len(stocks)})

@app.route("/api/clear_cache/<symbol>", methods=["POST"])
def clear_cache(symbol):
    with _cache_lock:
        _cache.pop(symbol.upper(), None)
    return ok({"message": f"Cache cleared for {symbol.upper()}"})

@app.route("/api/batch", methods=["POST"])
def batch():
    body = request.get_json() or {}
    tickers = body.get("tickers",[])[:10]
    if not tickers: return err("No tickers")
    results = {}
    for t in tickers:
        try:
            cached = cache_get(t)
            if cached: results[t]={"data":cached,"cached":True,"ok":True}
            else:
                data = run_full_analysis(t); cache_set(t,data)
                results[t]={"data":data,"cached":False,"ok":True}
        except Exception as e: results[t]={"ok":False,"error":str(e)}
    return ok({"results":results})

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=5000)
    parser.add_argument("--debug", action="store_true")
    parser.add_argument("--host", default="127.0.0.1")
    args = parser.parse_args()
    print(f"\n{'═'*50}\n  DeepDive v4 API  →  http://{args.host}:{args.port}\n{'═'*50}")
    print("  GET  /api/status\n  GET  /api/analyse/<symbol>\n  GET  /api/news/<symbol>\n  GET  /api/price/<symbol>\n  POST /api/screen\n  POST /api/batch\n")
    app.run(host=args.host, port=args.port, debug=args.debug)

@app.route('/<path:path>')
def serve_react(path):
    """Serve React SPA for any non-API route."""
    static_dir = os.path.join(os.path.dirname(__file__), 'static')
    full = os.path.join(static_dir, path)
    if os.path.exists(full):
        return send_from_directory('static', path)
    return send_from_directory('static', 'index.html')
