"""
Fetches price, financials, holders, and company info via yfinance.
Handles both NSE symbol (e.g. KRN) and full name lookup.
Bulletproof against missing/malformed data from yfinance for any stock.
"""

import yfinance as yf
import pandas as pd
import numpy as np
import requests
import math


NSE_SUFFIX = ".NS"
BSE_SUFFIX = ".BO"


def resolve_ticker(input_str: str):
    """Given a stock symbol or company name, return (ticker_str, yf.Ticker).
    Handles: 'KRN', 'KRN.NS', 'ICICI Bank', 'Tata Motors', etc.
    """
    raw = input_str.strip()
    upper = raw.upper().replace(" ", "")  # remove spaces for ticker attempt

    # Name → NSE ticker shortcut map (common Indian stocks)
    NAME_MAP = {
        "ICICIBANK": "ICICIBANK", "ICICIBANKLTD": "ICICIBANK", "ICICIBANK": "ICICIBANK",
        "HDFCBANK": "HDFCBANK", "HDFCBANKLTD": "HDFCBANK",
        "SBI": "SBIN", "STATEBANKOFINDIA": "SBIN", "STATEBANKOFINDIA": "SBIN",
        "AXISBANK": "AXISBANK", "KOTAKBANK": "KOTAKBANK", "KOTAKMAHINDRABANK": "KOTAKBANK",
        "TATAMOTORS": "TATAMOTORS", "TCS": "TCS", "TATACONSULTANCY": "TCS",
        "INFOSYS": "INFY", "WIPRO": "WIPRO", "HCLTECHNOLOGIES": "HCLTECH", "HCLTECH": "HCLTECH",
        "HINDUNILVR": "HINDUNILVR", "HUL": "HINDUNILVR", "HINDUSTANUNILEVER": "HINDUNILVR",
        "BAJAJFINANCE": "BAJFINANCE", "MARUTISUZUKI": "MARUTI", "MARUTI": "MARUTI",
        "ASIANPAINTS": "ASIANPAINT", "TITAN": "TITAN", "NESTLE": "NESTLEIND",
        "BHARTIAIRTEL": "BHARTIARTL", "AIRTEL": "BHARTIARTL",
        "SUNPHARMA": "SUNPHARMA", "DRREDDY": "DRREDDY", "CIPLA": "CIPLA",
        "L&T": "LT", "LARSENANDTOUBRO": "LT", "NTPC": "NTPC", "ONGC": "ONGC",
        "POWERGRID": "POWERGRID", "COALINDIA": "COALINDIA", "ITC": "ITC",
        "ULTRACEMCO": "ULTRACEMCO", "ULTRATECHCEMENT": "ULTRACEMCO",
        "ADANIPORTS": "ADANIPORTS", "ADANIENT": "ADANIENT", "ADANIENTERPRISES": "ADANIENT",
        "BLUESTAR": "BLUESTARCO", "BLUESTARLTD": "BLUESTARCO",
        "KRN": "KRN", "KRNHEAT": "KRN", "KRNHEATEXCHANGER": "KRN",
        "VOLTAS": "VOLTAS", "AMBERENTERPRISES": "AMBER",
        "TATAPOWER": "TATAPOWER", "RELIANCE": "RELIANCE", "RELIANCEINDUSTRIES": "RELIANCE",
    }

    # Try mapped name first
    mapped = NAME_MAP.get(upper) or NAME_MAP.get(raw.upper())
    candidates = []
    if mapped:
        candidates = [f"{mapped}{NSE_SUFFIX}", f"{mapped}{BSE_SUFFIX}"]
    candidates += [f"{upper}{NSE_SUFFIX}", f"{upper}{BSE_SUFFIX}", upper, raw]

    for ticker_str in candidates:
        try:
            t = yf.Ticker(ticker_str)
            info = t.info or {}
            if info.get("regularMarketPrice") or info.get("currentPrice") or info.get("previousClose"):
                return ticker_str, t
        except Exception:
            continue

    # Fuzzy search via Yahoo Finance (handles "ICICI Bank", "Tata Motors" etc.)
    try:
        resp = requests.get(
            f"https://query1.finance.yahoo.com/v1/finance/search?q={requests.utils.quote(raw)}&lang=en-US&region=IN&quotesCount=8&newsCount=0",
            headers={"User-Agent": "Mozilla/5.0"}, timeout=8
        )
        for r in resp.json().get("quotes", []):
            sym = r.get("symbol", "")
            if sym.endswith(".NS") or sym.endswith(".BO"):
                try:
                    t = yf.Ticker(sym)
                    info = t.info or {}
                    if info.get("regularMarketPrice") or info.get("previousClose"):
                        return sym, t
                except Exception:
                    continue
    except Exception:
        pass

    raise ValueError(f"Could not resolve '{input_str}'. Use NSE ticker directly, e.g. ICICIBANK, HDFCBANK, TCS")


def _safe_series(df, *keys) -> pd.Series:
    """Try multiple row labels; return first match or empty Series."""
    if df is None or df.empty:
        return pd.Series(dtype=float)
    for k in keys:
        try:
            if k in df.index:
                row = df.loc[k]
                # row may be a Series (cols = fiscal years) or scalar
                if isinstance(row, pd.Series):
                    return pd.to_numeric(row, errors="coerce").dropna()
                else:
                    return pd.Series([float(row)], dtype=float)
        except Exception:
            continue
    return pd.Series(dtype=float)


def _to_cr(series: pd.Series) -> pd.Series:
    """Convert raw values (in rupees) to crores."""
    if series.empty:
        return series
    return (series / 1e7).round(2)


def get_price_data(ticker: yf.Ticker) -> dict:
    try:
        info = ticker.info or {}
    except Exception:
        info = {}

    try:
        hist_1y = ticker.history(period="1y")
    except Exception:
        hist_1y = pd.DataFrame()
    try:
        hist_5y = ticker.history(period="5y")
    except Exception:
        hist_5y = pd.DataFrame()

    current_price = (info.get("currentPrice") or info.get("regularMarketPrice")
                     or info.get("previousClose") or 0)
    week52_high = info.get("fiftyTwoWeekHigh", 0)
    week52_low  = info.get("fiftyTwoWeekLow", 0)

    ret_1m = ret_1y = ret_5y = None
    if not hist_1y.empty and "Close" in hist_1y.columns:
        close = hist_1y["Close"].dropna()
        if len(close) >= 21:
            ret_1m = round((float(close.iloc[-1]) / float(close.iloc[-21]) - 1) * 100, 2)
        if len(close) > 1:
            ret_1y = round((float(close.iloc[-1]) / float(close.iloc[0]) - 1) * 100, 2)
    if not hist_5y.empty and "Close" in hist_5y.columns:
        close5 = hist_5y["Close"].dropna()
        if len(close5) > 1:
            ret_5y = round((float(close5.iloc[-1]) / float(close5.iloc[0]) - 1) * 100, 2)

    return {
        "current_price": round(float(current_price), 2),
        "week52_high": week52_high,
        "week52_low": week52_low,
        "ret_1m": ret_1m,
        "ret_1y": ret_1y,
        "ret_5y": ret_5y,
        "hist_1y": hist_1y,
        "hist_5y": hist_5y,
    }


def get_company_info(ticker: yf.Ticker) -> dict:
    try:
        info = ticker.info or {}
    except Exception:
        info = {}
    mcap = info.get("marketCap", 0) or 0
    return {
        "name": info.get("longName") or info.get("shortName", "N/A"),
        "sector": info.get("sector", "N/A"),
        "industry": info.get("industry", "N/A"),
        "market_cap": mcap,
        "market_cap_cr": round(mcap / 1e7, 1) if mcap else 0,
        "description": (info.get("longBusinessSummary") or "")[:600],
        "website": info.get("website", ""),
        "employees": info.get("fullTimeEmployees", "N/A"),
        "country": info.get("country", "India"),
        "exchange": info.get("exchange", "NSE"),
    }


def get_financials(ticker: yf.Ticker) -> dict:
    """
    Extract income statement, balance sheet, cash flow.
    Returns Cr-denominated Series indexed by fiscal year.
    Robust to missing rows, transposed DataFrames, and different yfinance versions.
    """
    income = balance = cashflow = None
    try:
        income   = ticker.financials
        balance  = ticker.balance_sheet
        cashflow = ticker.cashflow
    except Exception:
        pass

    # yfinance sometimes returns transposed (rows=years, cols=metrics)
    # Normalise: we want rows=metrics, cols=years
    def normalise(df):
        if df is None or df.empty:
            return None
        # If columns are strings (metric names) and index is dates → transpose
        if df.index.dtype == 'datetime64[ns]' or (len(df.index) > 0 and hasattr(df.index[0], 'year')):
            df = df.T
        return df

    income   = normalise(income)
    balance  = normalise(balance)
    cashflow = normalise(cashflow)

    def s(*keys):
        return _to_cr(_safe_series(income, *keys))

    def b(*keys):
        return _to_cr(_safe_series(balance, *keys))

    def c(*keys):
        return _to_cr(_safe_series(cashflow, *keys))

    return {
        "revenue":        s("Total Revenue", "Revenue"),
        "net_profit":     s("Net Income", "Net Income Common Stockholders", "Net Income From Continuing Operations"),
        "ebitda":         s("EBITDA", "Normalized EBITDA"),
        "gross_profit":   s("Gross Profit"),
        "op_income":      s("Operating Income", "EBIT", "Operating Revenue"),
        "interest_exp":   s("Interest Expense", "Net Interest Income"),
        "total_assets":   b("Total Assets"),
        "total_equity":   b("Stockholders Equity", "Total Equity Gross Minority Interest",
                            "Common Stock Equity", "Total Stockholder Equity"),
        "total_debt":     b("Total Debt", "Long Term Debt", "Long Term Debt And Capital Lease Obligation"),
        "current_assets": b("Current Assets"),
        "current_liab":   b("Current Liabilities"),
        "inventory":      b("Inventory"),
        "receivables":    b("Receivables", "Net Receivables", "Accounts Receivable"),
        "cash":           b("Cash And Cash Equivalents", "Cash", "Cash Cash Equivalents And Short Term Investments"),
        "cfo":            c("Operating Cash Flow", "Cash From Operations"),
        "capex":          c("Capital Expenditure", "Purchase Of Plant And Equipment",
                            "Capital Expenditures Reported"),
        "fcf":            c("Free Cash Flow"),
    }


def get_valuation_ratios(ticker: yf.Ticker) -> dict:
    try:
        info = ticker.info or {}
    except Exception:
        info = {}

    def pct(key):
        v = info.get(key)
        return round(float(v) * 100, 2) if v else None

    return {
        "pe":             info.get("trailingPE"),
        "forward_pe":     info.get("forwardPE"),
        "pb":             info.get("priceToBook"),
        "ps":             info.get("priceToSalesTrailing12Months"),
        "ev_ebitda":      info.get("enterpriseToEbitda"),
        "ev_revenue":     info.get("enterpriseToRevenue"),
        "roe":            pct("returnOnEquity"),
        "roa":            pct("returnOnAssets"),
        "debt_to_equity": info.get("debtToEquity"),
        "current_ratio":  info.get("currentRatio"),
        "quick_ratio":    info.get("quickRatio"),
        "dividend_yield": info.get("dividendYield"),
        "beta":           info.get("beta"),
        "eps":            info.get("trailingEps"),
        "book_value":     info.get("bookValue"),
        "peg":            info.get("pegRatio"),
        "profit_margin":  pct("profitMargins"),
        "op_margin":      pct("operatingMargins"),
        "gross_margin":   pct("grossMargins"),
        "revenue_growth": pct("revenueGrowth"),
        "earnings_growth":pct("earningsGrowth"),
        # aliases used by dashboard JS
        "netMargin":      pct("profitMargins"),
        "opMargin":       pct("operatingMargins"),
        "revGrowth":      pct("revenueGrowth"),
        "de":             info.get("debtToEquity"),
        "evEbitda":       info.get("enterpriseToEbitda"),
    }


def get_holders(ticker: yf.Ticker) -> dict:
    promoter_pct = institution_pct = None
    top_institutions = []
    try:
        major = ticker.major_holders
        if major is not None and not major.empty:
            for _, row in major.iterrows():
                try:
                    label = str(row.iloc[1]).lower()
                    val   = row.iloc[0]
                    if "insiders" in label or "promoter" in label:
                        promoter_pct = val
                    elif "institution" in label:
                        institution_pct = val
                except Exception:
                    pass
    except Exception:
        pass

    try:
        inst = ticker.institutional_holders
        if inst is not None and not inst.empty:
            for _, row in inst.head(10).iterrows():
                try:
                    name  = row.get("Holder") or (row.iloc[0] if len(row) > 0 else "")
                    pct_v = row.get("% Out") or (row.iloc[2] if len(row) > 2 else None)
                    top_institutions.append({
                        "name":   str(name),
                        "pct":    round(float(pct_v) * 100, 2) if pct_v is not None else None,
                        "shares": int(row.get("Shares") or row.iloc[1]) if len(row) > 1 else None,
                    })
                except Exception:
                    pass
    except Exception:
        pass

    return {
        "promoter_pct":    promoter_pct,
        "institution_pct": institution_pct,
        "top_institutions": top_institutions,
    }


def get_dividend_history(ticker: yf.Ticker, years: int = 10) -> list[dict]:
    """Get dividend history for the ticker - shows management discipline."""
    dividends = []
    try:
        divs = ticker.dividends
        if divs is None or divs.empty:
            return []

        cutoff = pd.Timestamp.now() - pd.DateOffset(years=years)
        for date, row in divs.iterrows():
            if date < cutoff:
                continue
            try:
                dividends.append({
                    "date": date.strftime("%Y-%m-%d"),
                    "amount": float(row.iloc[0]) if len(row) > 0 else None,
                    "yield": None,
                })
            except Exception:
                continue
    except Exception:
        pass

    return dividends


def get_dividend_analysis(ticker: yf.Ticker) -> dict:
    """Analyze dividend payout consistency - Buffett indicator."""
    try:
        divs = ticker.dividends
        if divs is None or divs.empty:
            return {"has_dividends": False, "track_record": [], "payout_frequency": None, "avg_yield": None}

        div_list = []
        for date, row in divs.iterrows():
            try:
                amt = float(row.iloc[0]) if len(row) > 0 else 0
                if amt > 0:
                    div_list.append({"date": date, "amount": amt})
            except Exception:
                continue

        if not div_list:
            return {"has_dividends": False, "track_record": [], "payout_frequency": None, "avg_yield": None}

        div_list.sort(key=lambda x: x["date"], reverse=True)
        last_5 = div_list[:5]
        years_span = None
        if len(div_list) >= 2:
            first = div_list[-1]["date"]
            last = div_list[0]["date"]
            years_span = (last - first).days / 365.0 if years_span else 1

        frequency = "Annual"
        if len(div_list) >= 4:
            years_span = (div_list[0]["date"] - div_list[-1]["date"]).days / 365.0
            avg_years = years_span / len(div_list) if len(div_list) > 1 and years_span > 0 else 1
            if avg_years < 0.5:
                frequency = "Quarterly"
            elif avg_years < 1.5:
                frequency = "Semi-Annual"
            else:
                frequency = "Annual"

        total_div = sum(d["amount"] for d in last_5)
        avg_div = total_div / len(last_5) if last_5 else 0

        return {
            "has_dividends": True,
            "track_record": [{"date": d["date"].strftime("%Y-%m-%d"), "amount": round(d["amount"], 2)} for d in div_list[:10]],
            "last_payout": div_list[0]["amount"] if div_list else None,
            "avg_payout_5y": round(avg_div, 2),
            "payout_frequency": frequency,
            "total_payouts": len(div_list),
        }
    except Exception:
        return {"has_dividends": False, "track_record": [], "payout_frequency": None, "avg_yield": None}

def get_earnings_history(ticker: yf.Ticker) -> list[dict]:
    """Get earnings estimates vs actuals to show beat/miss history."""
    try:
        ed = ticker.earnings_dates
        if ed is None or ed.empty:
            return []
            
        history = []
        for date, row in ed.iterrows():
            if date > pd.Timestamp.now(tz=date.tzinfo):
                continue # Skip future dates
            try:
                estimate = float(row.get("EPS Estimate"))
                reported = float(row.get("Reported EPS"))
                surprise = float(row.get("Surprise(%)"))
                
                if math.isnan(estimate) or math.isnan(reported):
                    continue
                    
                history.append({
                    "date": date.strftime("%b %Y"),
                    "estimate": round(estimate, 2),
                    "reported": round(reported, 2),
                    "surprise_pct": round(surprise * 100, 2)
                })
            except Exception:
                continue
                
        return history[:8] # Last 8 quarters
    except Exception:
        return []
