import yfinance as yf
import pandas as pd

SECTORS = {
    "NIFTY BANK": "^NSEBANK",
    "NIFTY IT": "^CNXIT",
    "NIFTY AUTO": "^CNXAUTO",
    "NIFTY PHARMA": "^CNXPHARMA",
    "NIFTY FMCG": "^CNXFMCG",
    "NIFTY METAL": "^CNXMETAL",
    "NIFTY ENERGY": "^CNXENERGY",
}

def get_sector_rotation():
    results = []
    for name, ticker in SECTORS.items():
        try:
            t = yf.Ticker(ticker)
            hist = t.history(period="3mo")
            if not hist.empty and len(hist) > 20:
                current = float(hist["Close"].iloc[-1])
                month_ago = float(hist["Close"].iloc[-21])
                three_months_ago = float(hist["Close"].iloc[0])
                
                ret_1m = (current / month_ago - 1) * 100
                ret_3m = (current / three_months_ago - 1) * 100
                
                results.append({
                    "sector": name,
                    "ret_1m": round(ret_1m, 2),
                    "ret_3m": round(ret_3m, 2),
                    "trend": "Bullish" if ret_1m > 0 and ret_3m > 0 else "Bearish" if ret_1m < 0 and ret_3m < 0 else "Neutral"
                })
        except Exception as e:
            continue
            
    results.sort(key=lambda x: x["ret_1m"], reverse=True)
    return results
