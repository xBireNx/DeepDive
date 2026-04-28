"""
Technical Analysis Engine.
Computes: MACD, RSI, Stochastic, ADX, Bollinger Bands, Volume analysis, Trend.
Returns signals, verdicts and a confluence score.
"""

import pandas as pd
import pandas_ta as ta
import numpy as np


def run_technical_analysis(hist: pd.DataFrame) -> dict:
    """
    hist: yfinance history DataFrame with OHLCV columns.
    Returns dict with all TA signals.
    """
    result = {
        "signals": [],
        "confluence_long": 0,
        "confluence_short": 0,
        "total_signals": 0,
        "trend": "Unknown",
        "rsi_val": None,
        "macd_verdict": None,
        "adx_val": None,
        "prediction_long_pct": 0,
        "price_vs_ma": {},
        "support_resistance": {},
        "volume_analysis": {},
        "narrative": "",
    }

    if hist is None or hist.empty or len(hist) < 30:
        result["narrative"] = "Insufficient price history for technical analysis."
        return result

    df = hist.copy()
    df.columns = [c.lower() for c in df.columns]
    df = df.dropna(subset=["close", "volume"])

    close = df["close"]
    high  = df["high"]
    low   = df["low"]
    volume = df["volume"]

    signals = []

    # ── RSI ──────────────────────────────────────────────────────────────────
    rsi = ta.rsi(close, length=14)
    rsi_val = round(float(rsi.iloc[-1]), 1) if rsi is not None and not rsi.empty else None
    result["rsi_val"] = rsi_val
    if rsi_val:
        if rsi_val < 30:
            sig = ("RSI", f"{rsi_val}", "Oversold — Bullish signal", "long")
        elif rsi_val > 70:
            sig = ("RSI", f"{rsi_val}", "Overbought — Caution", "short")
        elif 40 <= rsi_val <= 60:
            sig = ("RSI", f"{rsi_val}", "Neutral zone", "neutral")
        elif rsi_val > 60:
            sig = ("RSI", f"{rsi_val}", "Bullish momentum", "long")
        else:
            sig = ("RSI", f"{rsi_val}", "Bearish momentum", "short")
        signals.append(sig)

    # ── MACD ─────────────────────────────────────────────────────────────────
    macd_df = ta.macd(close, fast=12, slow=26, signal=9)
    macd_verdict = None
    if macd_df is not None and not macd_df.empty:
        cols = macd_df.columns.tolist()
        macd_line = macd_df.iloc[-1, 0]
        signal_line = macd_df.iloc[-1, 1] if len(cols) > 1 else None
        hist_val = macd_df.iloc[-1, 2] if len(cols) > 2 else None

        if macd_line is not None and signal_line is not None:
            if macd_line > signal_line:
                macd_verdict = "Bullish ✓"
                signals.append(("MACD", f"{round(macd_line,3)}", "Above signal — Bullish", "long"))
            else:
                macd_verdict = "Bearish"
                signals.append(("MACD", f"{round(macd_line,3)}", "Below signal — Bearish", "short"))
        result["macd_verdict"] = macd_verdict

    # ── Stochastic ────────────────────────────────────────────────────────────
    stoch = ta.stoch(high, low, close, k=14, d=3, smooth_k=3)
    if stoch is not None and not stoch.empty:
        stoch_k = float(stoch.iloc[-1, 0])
        stoch_d = float(stoch.iloc[-1, 1]) if stoch.shape[1] > 1 else stoch_k
        if stoch_k < 20:
            signals.append(("STOCH", f"K:{round(stoch_k,1)}", "Oversold — Bullish", "long"))
        elif stoch_k > 80:
            signals.append(("STOCH", f"K:{round(stoch_k,1)}", "Overbought — Caution", "short"))
        elif stoch_k > stoch_d:
            signals.append(("STOCH", f"K:{round(stoch_k,1)}", "K above D — Bullish", "long"))
        else:
            signals.append(("STOCH", f"K:{round(stoch_k,1)}", "K below D — Bearish", "short"))

    # ── ADX (Trend Strength) ──────────────────────────────────────────────────
    adx_df = ta.adx(high, low, close, length=14)
    adx_val = None
    if adx_df is not None and not adx_df.empty:
        adx_val = round(float(adx_df.iloc[-1, 0]), 1)
        result["adx_val"] = adx_val
        verdict = "Strong trend" if adx_val > 25 else "Moderate trend" if adx_val > 20 else "Weak / Choppy"
        signals.append(("ADX", f"{adx_val}", verdict, "neutral"))

    # ── Bollinger Bands ───────────────────────────────────────────────────────
    bb = ta.bbands(close, length=20, std=2)
    if bb is not None and not bb.empty:
        bb_lower = float(bb.iloc[-1, 0])
        bb_mid   = float(bb.iloc[-1, 1])
        bb_upper = float(bb.iloc[-1, 2])
        current  = float(close.iloc[-1])
        bb_pct   = round((current - bb_lower) / (bb_upper - bb_lower) * 100, 1) if (bb_upper - bb_lower) > 0 else 50
        if bb_pct < 20:
            signals.append(("Bollinger", f"{bb_pct}%B", "Near lower band — Possible bounce", "long"))
        elif bb_pct > 80:
            signals.append(("Bollinger", f"{bb_pct}%B", "Near upper band — Stretched", "short"))
        else:
            signals.append(("Bollinger", f"{bb_pct}%B", "Mid-band — Neutral", "neutral"))

    # ── Moving Averages ───────────────────────────────────────────────────────
    ma20  = ta.sma(close, length=20)
    ma50  = ta.sma(close, length=50)
    ma200 = ta.sma(close, length=200)
    current_price = float(close.iloc[-1])
    price_vs_ma = {}

    for label, ma in [("SMA20", ma20), ("SMA50", ma50), ("SMA200", ma200)]:
        if ma is not None and not ma.empty and not pd.isna(ma.iloc[-1]):
            val = round(float(ma.iloc[-1]), 2)
            pct_from = round((current_price - val) / val * 100, 1)
            price_vs_ma[label] = {"value": val, "pct_from_price": pct_from}
            if current_price > val:
                signals.append((label, f"₹{val:,.0f}", f"Price above {label} (+{pct_from}%) — Bullish", "long"))
            else:
                signals.append((label, f"₹{val:,.0f}", f"Price below {label} ({pct_from}%) — Bearish", "short"))

    result["price_vs_ma"] = price_vs_ma

    # ── Volume Analysis ───────────────────────────────────────────────────────
    avg_vol_20 = float(volume.iloc[-20:].mean()) if len(volume) >= 20 else float(volume.mean())
    latest_vol = float(volume.iloc[-1])
    vol_ratio  = round(latest_vol / avg_vol_20, 2) if avg_vol_20 > 0 else 1.0
    vol_verdict = "High volume" if vol_ratio > 1.5 else "Normal" if vol_ratio > 0.7 else "Low volume"
    signals.append(("Volume", f"{vol_ratio}x avg", vol_verdict, "neutral"))
    result["volume_analysis"] = {"ratio": vol_ratio, "verdict": vol_verdict}

    # ── Support & Resistance ──────────────────────────────────────────────────
    if len(close) >= 50:
        support  = round(float(low.iloc[-50:].min()), 2)
        resist   = round(float(high.iloc[-50:].max()), 2)
        result["support_resistance"] = {
            "support_50d": support,
            "resistance_50d": resist,
            "current": round(current_price, 2),
        }

    # ── Trend determination ───────────────────────────────────────────────────
    long_count  = sum(1 for s in signals if len(s) > 3 and s[3] == "long")
    short_count = sum(1 for s in signals if len(s) > 3 and s[3] == "short")
    total = long_count + short_count

    if total > 0:
        long_pct = round(long_count / total * 100)
    else:
        long_pct = 50

    if long_pct >= 70:
        trend = "Strong Uptrend"
    elif long_pct >= 55:
        trend = "Mild Uptrend"
    elif long_pct <= 30:
        trend = "Downtrend"
    elif long_pct <= 45:
        trend = "Mild Downtrend"
    else:
        trend = "Sideways / Consolidation"

    result.update({
        "signals": signals,
        "confluence_long": long_count,
        "confluence_short": short_count,
        "total_signals": len(signals),
        "trend": trend,
        "prediction_long_pct": long_pct,
        "narrative": _ta_narrative(trend, rsi_val, macd_verdict, adx_val, long_pct),
    })

    return result


def _ta_narrative(trend, rsi, macd, adx, long_pct):
    parts = []
    parts.append(f"Technical picture: {trend}.")
    if rsi:
        if rsi > 70:
            parts.append(f"RSI at {rsi} is overbought — short-term pullback risk is elevated.")
        elif rsi < 35:
            parts.append(f"RSI at {rsi} is oversold — potential bounce territory.")
        else:
            parts.append(f"RSI at {rsi} has room to run.")
    if macd:
        parts.append(f"MACD is {macd.lower().replace('✓', '').strip()}.")
    if adx:
        if adx > 30:
            parts.append(f"ADX at {adx} confirms a strong directional trend — not a false breakout.")
        elif adx < 20:
            parts.append(f"ADX at {adx} is weak — price movement lacks conviction.")
    parts.append(f"Overall {long_pct}% of signals are bullish.")
    return " ".join(parts)
