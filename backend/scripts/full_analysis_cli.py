#!/usr/bin/env python3
"""Full analysis CLI for a single ticker.

Usage: python stock_xray/scripts/full_analysis_cli.py KRN
"""
import sys
import json
import sys
import json
import os
from unittest.mock import MagicMock

# ── Numba Mock for Python 3.14 compatibility ──────────────────────────────────
mock_numba = MagicMock()
mock_numba.njit = lambda *args, **kwargs: (lambda f: f)
mock_numba.jit = lambda *args, **kwargs: (lambda f: f)
sys.modules["numba"] = mock_numba

# Fix path to allow importing from parent
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fetcher.yfinance_data import (
    resolve_ticker, get_price_data, get_company_info,
    get_financials, get_valuation_ratios, get_holders
)
from fetcher.screener_data import scrape_screener
from analysis.fundamental import run_fundamental_analysis
from analysis.technical import run_technical_analysis
from analysis.advanced import run_advanced

def main(ticker_input: str):
    ticker_str, ticker = resolve_ticker(ticker_input)
    symbol = ticker_str.replace('.NS','').replace('.BO','')

    company = get_company_info(ticker) or {"name": symbol, "market_cap_cr": 0}
    price = get_price_data(ticker) or {}
    fin = get_financials(ticker) or {}
    ratios = get_valuation_ratios(ticker) or {}
    holders = get_holders(ticker) or {"promoter_pct": None, "institution_pct": None, "top_institutions": []}
    screener = scrape_screener(symbol) or {"shareholding": {}, "promoter_history": [], "quarterly_results": [], "peers": [], "ace_investors": []}

    fundamental = run_fundamental_analysis(fin or {}, ratios or {}, holders, screener, company.get('market_cap_cr', 0))
    hist = price.get('hist_1y') if price else None
    technical = run_technical_analysis(hist)

    # Build price history snippet similar to server.py
    price_hist = []
    if hist is not None and hasattr(hist, 'tail'):
        for idx, row in hist.tail(60).iterrows():
            try:
                c = float(row.get('Close'))
                h = float(row.get('High'))
                l = float(row.get('Low'))
                v = float(row.get('Volume', 0) or 0)
                price_hist.append({"date": str(idx.date()), "close": c, "high": h, "low": l, "volume": int(v)})
            except Exception:
                pass

    adv = {
        "dupont": {}, "wcTrend": {}, "relativeReturn": {}, "redFlags": [], "promoterTx": []
    }
    try:
        adv = run_advanced(symbol, fin or {}, ratios or {}, screener or {}, price_hist, ticker_obj=ticker, company_name=company.get('name',''))
    except Exception:
        adv = adv

    data = {
        "ticker": ticker_str, "symbol": symbol,
        "company": company,
        "price": price,
        "ratios": ratios,
        "fundamental": fundamental,
        "technical": technical,
        "shareholding": screener.get('shareholding', {}),
        "promoterHistory": screener.get('promoter_history', []),
        "aceInvestors": screener.get('ace_investors', []),
        "holders": holders,
        "quarterly": screener.get('quarterly_results', []),
        "peers": screener.get('peers', []),
        "priceHistory": price_hist,
        "dupont": adv.get('dupont', {}),
        "wcTrend": adv.get('wcTrend', {}),
        "relativeReturn": adv.get('relativeReturn', {}),
        "redFlags": adv.get('redFlags', []),
        "promoterTx": adv.get('promoterTx', []),
    }
    print(json.dumps(data, default=str, indent=2))

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: full_analysis_cli.py <TICKER>")
        sys.exit(1)
    main(sys.argv[1])
