"""
Fundamental Analysis Engine — Buffett / Rakesh Jhunjhunwala style.

Scores the stock across:
1. Business Quality (moat, margins, ROCE)
2. Financial Health (debt, liquidity, FCF)
3. Growth Quality (revenue, profit, EPS CAGR)
4. Valuation (P/E, P/B, PEG vs growth)
5. Earnings Quality (Beneish M-Score, FCF/PAT, accruals)
6. Management Quality (promoter stake, debt usage, capex discipline)
"""

import pandas as pd
import numpy as np
from dataclasses import dataclass, field


@dataclass
class ScoreCard:
    category: str
    score: int          # 0–10
    max_score: int = 10
    signals: list = field(default_factory=list)   # list of (label, value, verdict)
    narrative: str = ""


def _safe_latest(series):
    """Return most recent non-null, non-NaN value from a pandas Series. Never raises."""
    try:
        if series is None: return None
        if not hasattr(series, 'dropna'): return float(series) if series else None
        s = series.dropna()
        if s.empty: return None
        v = float(s.iloc[0])
        return None if (v != v) else v  # NaN check
    except Exception:
        return None


def _cagr(series, years=3):
    """Compute CAGR over 'years' from a time-indexed Series (newest first). Never raises."""
    try:
        if series is None or not hasattr(series, 'dropna'): return None
        s = series.dropna()
        # Also filter out any infinite or NaN float values
        import numpy as np
        s = s[np.isfinite(s.astype(float))]
        if len(s) < years + 1: return None
        end = float(s.iloc[0])
        start = float(s.iloc[years])
        if start <= 0 or end <= 0 or end != end or start != start: return None
        return round(((end / start) ** (1 / years) - 1) * 100, 2)
    except Exception:
        return None


def _pct_change_yoy(series):
    """YoY % change: latest vs prior year. Never raises."""
    try:
        if series is None or not hasattr(series, 'dropna'): return None
        s = series.dropna()
        if len(s) < 2: return None
        return round((float(s.iloc[0]) / float(s.iloc[1]) - 1) * 100, 2)
    except Exception:
        return None


# ─────────────────────────────────────────────────────────────────────────────
# 1. BUSINESS QUALITY
# ─────────────────────────────────────────────────────────────────────────────

def score_business_quality(fin: dict, ratios: dict) -> ScoreCard:
    score = 0
    signals = []

    # ROCE proxy: EBIT / (Total Assets - Current Liabilities)
    ebit = _safe_latest(fin.get("op_income"))
    assets = _safe_latest(fin.get("total_assets"))
    cur_liab = _safe_latest(fin.get("current_liab"))
    roce = None
    if ebit and assets and cur_liab:
        capital_employed = assets - cur_liab
        if capital_employed > 0:
            roce = round(ebit / capital_employed * 100, 2)

    if roce:
        verdict = "Excellent" if roce > 25 else "Good" if roce > 15 else "Average" if roce > 10 else "Weak"
        sc = 3 if roce > 25 else 2 if roce > 15 else 1 if roce > 10 else 0
        score += sc
        signals.append(("ROCE", f"{roce}%", verdict))
    else:
        signals.append(("ROCE", "N/A", "—"))

    # ROE
    roe = ratios.get("roe")
    if roe:
        verdict = "Excellent" if roe > 20 else "Good" if roe > 15 else "Average" if roe > 10 else "Poor"
        sc = 2 if roe > 20 else 1 if roe > 12 else 0
        score += sc
        signals.append(("ROE", f"{roe}%", verdict))

    # Gross Margin
    gm = ratios.get("gross_margin")
    if gm:
        verdict = "Strong" if gm > 30 else "Moderate" if gm > 15 else "Thin"
        sc = 2 if gm > 30 else 1 if gm > 15 else 0
        score += sc
        signals.append(("Gross Margin", f"{gm}%", verdict))

    # Operating Margin
    om = ratios.get("op_margin")
    if om:
        verdict = "Strong" if om > 20 else "Moderate" if om > 10 else "Thin"
        sc = 2 if om > 20 else 1 if om > 10 else 0
        score += sc
        signals.append(("Operating Margin", f"{om}%", verdict))

    # Revenue CAGR 3Y
    rev_cagr = _cagr(fin.get("revenue", pd.Series(dtype=float)), 3) if fin else None
    if rev_cagr:
        verdict = "Rapid" if rev_cagr > 25 else "Healthy" if rev_cagr > 15 else "Moderate" if rev_cagr > 8 else "Slow"
        sc = 1 if rev_cagr > 15 else 0
        score += sc
        signals.append(("Revenue CAGR (3Y)", f"{rev_cagr}%", verdict))

    narrative = _business_narrative(roce, roe, gm, om, rev_cagr)
    return ScoreCard("Business Quality", min(score, 10), 10, signals, narrative)


def _business_narrative(roce, roe, gm, om, rev_cagr):
    parts = []
    if roce and roce > 20:
        parts.append(f"The business generates an exceptional ROCE of {roce}%, indicating it creates significant value on every rupee of capital deployed — a hallmark of wide-moat businesses.")
    elif roce:
        parts.append(f"ROCE of {roce}% suggests {'reasonable' if roce > 12 else 'below-average'} capital efficiency.")
    if roe and roe > 18:
        parts.append(f"ROE of {roe}% demonstrates management's ability to compound shareholder equity effectively.")
    if gm and gm < 15:
        parts.append("Thin gross margins indicate limited pricing power — the business is vulnerable to raw material cost spikes.")
    if rev_cagr and rev_cagr > 20:
        parts.append(f"Revenue growing at {rev_cagr}% CAGR over 3 years points to strong underlying demand and market share gains.")
    return " ".join(parts) if parts else "Insufficient data for full business quality assessment."


# ─────────────────────────────────────────────────────────────────────────────
# 2. FINANCIAL HEALTH
# ─────────────────────────────────────────────────────────────────────────────

def score_financial_health(fin: dict, ratios: dict) -> ScoreCard:
    score = 0
    signals = []

    # Debt to Equity
    de = ratios.get("debt_to_equity")
    if de is not None:
        de_val = de / 100 if de > 10 else de   # yfinance sometimes returns as percentage
        verdict = "Debt-Free" if de_val < 0.1 else "Conservative" if de_val < 0.5 else "Moderate" if de_val < 1.0 else "Leveraged"
        sc = 3 if de_val < 0.1 else 2 if de_val < 0.5 else 1 if de_val < 1.0 else 0
        score += sc
        signals.append(("Debt/Equity", f"{round(de_val, 2)}x", verdict))

    # Current Ratio
    cr = ratios.get("current_ratio")
    if cr:
        verdict = "Strong" if cr > 2 else "Adequate" if cr > 1.2 else "Tight"
        sc = 2 if cr > 2 else 1 if cr > 1.2 else 0
        score += sc
        signals.append(("Current Ratio", f"{round(cr, 2)}x", verdict))

    # FCF quality
    fcf = _safe_latest(fin.get("fcf"))
    pat = _safe_latest(fin.get("net_profit"))
    fcf_pat = None
    if fcf and pat and pat != 0:
        fcf_pat = round(fcf / pat * 100, 1)
        verdict = "Excellent" if fcf_pat > 80 else "Good" if fcf_pat > 50 else "Moderate" if fcf_pat > 20 else "Poor"
        sc = 3 if fcf_pat > 80 else 2 if fcf_pat > 50 else 1 if fcf_pat > 20 else 0
        score += sc
        signals.append(("FCF/PAT", f"{fcf_pat}%", verdict))

    # Interest Coverage
    ebit = _safe_latest(fin.get("op_income"))
    interest = _safe_latest(fin.get("interest_exp"))
    if ebit and interest and interest != 0:
        ic = round(abs(ebit / interest), 1)
        verdict = "Excellent" if ic > 10 else "Good" if ic > 5 else "Acceptable" if ic > 3 else "Risky"
        sc = 2 if ic > 10 else 1 if ic > 5 else 0
        score += sc
        signals.append(("Interest Coverage", f"{ic}x", verdict))

    narrative = _health_narrative(de, cr, fcf_pat)
    return ScoreCard("Financial Health", min(score, 10), 10, signals, narrative)


def _health_narrative(de, cr, fcf_pat):
    parts = []
    de_val = (de / 100 if de and de > 10 else de) if de else None
    if de_val is not None and de_val < 0.15:
        parts.append("The company is essentially debt-free — a fortress balance sheet that gives management flexibility to invest aggressively in downturns.")
    elif de_val and de_val > 1:
        parts.append(f"Debt/Equity of {round(de_val,1)}x is elevated. Monitor interest coverage carefully.")
    if fcf_pat and fcf_pat > 75:
        parts.append("Free cash flow closely tracks reported profits — strong earnings quality with minimal accruals.")
    elif fcf_pat and fcf_pat < 20:
        parts.append("FCF significantly lags net profit — working capital consumption or aggressive capex is masking true cash generation.")
    return " ".join(parts) if parts else "Balance sheet appears stable."


# ─────────────────────────────────────────────────────────────────────────────
# 3. GROWTH QUALITY
# ─────────────────────────────────────────────────────────────────────────────

def score_growth(fin: dict, ratios: dict) -> ScoreCard:
    score = 0
    signals = []

    rev_cagr_3 = _cagr(fin.get("revenue", pd.Series(dtype=float)), 3) if fin else None
    pat_cagr_3 = _cagr(fin.get("net_profit", pd.Series(dtype=float)), 3) if fin else None
    rev_yoy    = _pct_change_yoy(fin.get("revenue", pd.Series(dtype=float))) if fin else None
    pat_yoy    = _pct_change_yoy(fin.get("net_profit", pd.Series(dtype=float))) if fin else None
    eps_growth = ratios.get("earnings_growth")

    for label, val in [("Revenue CAGR 3Y", rev_cagr_3), ("PAT CAGR 3Y", pat_cagr_3)]:
        if val is not None:
            verdict = "Hyper-growth" if val > 30 else "Strong" if val > 20 else "Healthy" if val > 12 else "Slow"
            sc = 3 if val > 30 else 2 if val > 20 else 1 if val > 12 else 0
            score += sc
            signals.append((label, f"{val}%", verdict))

    for label, val in [("Revenue YoY", rev_yoy), ("PAT YoY", pat_yoy)]:
        if val is not None:
            verdict = "Accelerating" if val > 30 else "Growing" if val > 15 else "Slowing" if val > 0 else "Declining"
            sc = 1 if val > 15 else 0
            score += sc
            signals.append((label, f"{val}%", verdict))

    # Consistency: profit growing faster than revenue = operating leverage
    if rev_cagr_3 and pat_cagr_3 and pat_cagr_3 > rev_cagr_3:
        score += 1
        signals.append(("Profit > Revenue Growth", "Yes", "Operating Leverage ✓"))

    narrative = _growth_narrative(rev_cagr_3, pat_cagr_3, rev_yoy)
    return ScoreCard("Growth Quality", min(score, 10), 10, signals, narrative)


def _growth_narrative(rev_cagr, pat_cagr, rev_yoy):
    parts = []
    if rev_cagr and rev_cagr > 20:
        parts.append(f"Revenue compounding at {rev_cagr}% over 3 years is exceptional — the business is clearly in a structural growth phase, not a cyclical uptick.")
    if pat_cagr and rev_cagr and pat_cagr > rev_cagr:
        parts.append(f"Profits growing faster ({pat_cagr}%) than revenue ({rev_cagr}%) signals operating leverage — fixed costs are being absorbed as scale increases, which is a powerful margin expansion driver.")
    if rev_yoy and rev_yoy < 10 and rev_cagr and rev_cagr > 20:
        parts.append("Recent YoY growth has decelerated — worth monitoring whether this is seasonal or a structural slowdown.")
    return " ".join(parts) if parts else "Growth metrics are being assessed."


# ─────────────────────────────────────────────────────────────────────────────
# 4. VALUATION
# ─────────────────────────────────────────────────────────────────────────────

def score_valuation(ratios: dict, fin: dict) -> ScoreCard:
    score = 0
    signals = []

    pe = ratios.get("pe")
    pb = ratios.get("pb")
    peg = ratios.get("peg")
    ev_ebitda = ratios.get("ev_ebitda")
    rev_growth = ratios.get("revenue_growth")  # YoY %

    if pe:
        verdict = "Cheap" if pe < 15 else "Fair" if pe < 30 else "Premium" if pe < 60 else "Priced for perfection"
        sc = 3 if pe < 15 else 2 if pe < 25 else 1 if pe < 40 else 0
        score += sc
        signals.append(("P/E Ratio", f"{round(pe, 1)}x", verdict))

    if pb:
        verdict = "Undervalued" if pb < 2 else "Fair" if pb < 5 else "Premium" if pb < 10 else "Expensive"
        sc = 2 if pb < 2 else 1 if pb < 5 else 0
        score += sc
        signals.append(("P/B Ratio", f"{round(pb, 1)}x", verdict))

    if peg:
        verdict = "Cheap vs Growth" if peg < 1 else "Fair" if peg < 2 else "Expensive vs Growth"
        sc = 2 if peg < 1 else 1 if peg < 2 else 0
        score += sc
        signals.append(("PEG Ratio", f"{round(peg, 2)}x", verdict))

    if ev_ebitda:
        verdict = "Cheap" if ev_ebitda < 10 else "Fair" if ev_ebitda < 20 else "Premium"
        sc = 2 if ev_ebitda < 10 else 1 if ev_ebitda < 20 else 0
        score += sc
        signals.append(("EV/EBITDA", f"{round(ev_ebitda, 1)}x", verdict))

    if pe and rev_growth:
        implied_peg = pe / max(rev_growth, 1)
        signals.append(("P/E to Growth (implied)", f"{round(implied_peg, 2)}x", "Justify with growth" if implied_peg < 3 else "Stretched"))

    narrative = _valuation_narrative(pe, pb, peg, ev_ebitda)
    return ScoreCard("Valuation", min(score, 10), 10, signals, narrative)


def _valuation_narrative(pe, pb, peg, ev_ebitda):
    parts = []
    if pe and pe > 80:
        parts.append(f"At {round(pe,0)}x P/E, the stock is pricing in significant future growth. Any earnings miss or macro headwind could trigger sharp derating — this is priced for perfection.")
    elif pe and pe < 20:
        parts.append(f"P/E of {round(pe,0)}x looks attractive in absolute terms — but verify the earnings base is sustainable and not cyclically inflated.")
    if peg and peg < 1:
        parts.append(f"PEG ratio below 1 ({round(peg,2)}x) suggests the stock may be undervalued relative to its growth rate — a classic Buffett-style find.")
    if pb and pb > 8:
        parts.append(f"P/B of {round(pb,1)}x demands consistently high ROE to justify. If ROE falters, book value destruction becomes a real risk.")
    return " ".join(parts) if parts else "Valuation appears to reflect current fundamentals."


# ─────────────────────────────────────────────────────────────────────────────
# 5. BENEISH M-SCORE (Earnings Manipulation Check)
# ─────────────────────────────────────────────────────────────────────────────

def compute_beneish_mscore(fin: dict) -> dict:
    """
    8-variable Beneish M-Score.
    Score > -1.78 = suspicious/manipulator.
    Score < -2.22 = likely clean.
    """
    result = {"score": None, "verdict": "Insufficient data", "components": {}}

    try:
        rev   = fin.get("revenue", pd.Series(dtype=float)).dropna()
        pat   = fin.get("net_profit", pd.Series(dtype=float)).dropna()
        recv  = fin.get("receivables", pd.Series(dtype=float)).dropna()
        assets= fin.get("total_assets", pd.Series(dtype=float)).dropna()
        gp    = fin.get("gross_profit", pd.Series(dtype=float)).dropna()
        capex = fin.get("capex", pd.Series(dtype=float)).dropna()
        debt  = fin.get("total_debt", pd.Series(dtype=float)).dropna()
        cur_a = fin.get("current_assets", pd.Series(dtype=float)).dropna()
        cur_l = fin.get("current_liab", pd.Series(dtype=float)).dropna()
        cfo   = fin.get("cfo", pd.Series(dtype=float)).dropna()

        if len(rev) < 2 or len(assets) < 2:
            return result

        # Year t = index 0 (most recent), t-1 = index 1
        def v(s, i): return float(s.iloc[i]) if len(s) > i else None

        rev_t, rev_t1 = v(rev,0), v(rev,1)
        recv_t, recv_t1 = v(recv,0), v(recv,1)
        assets_t, assets_t1 = v(assets,0), v(assets,1)
        gp_t, gp_t1 = v(gp,0), v(gp,1)
        capex_t = abs(v(capex,0)) if v(capex,0) else None
        debt_t, debt_t1 = v(debt,0) or 0, v(debt,1) or 0
        cur_a_t = v(cur_a,0)
        cur_l_t = v(cur_l,0)
        cfo_t   = v(cfo,0)
        pat_t   = v(pat,0)

        components = {}

        # DSRI: Days Sales Receivable Index
        if recv_t and recv_t1 and rev_t and rev_t1 and rev_t1 != 0 and recv_t1 != 0:
            dsri = (recv_t / rev_t) / (recv_t1 / rev_t1)
            components["DSRI"] = round(dsri, 3)

        # GMI: Gross Margin Index
        if gp_t and gp_t1 and rev_t and rev_t1 and rev_t != 0 and rev_t1 != 0:
            gmi = (gp_t1 / rev_t1) / (gp_t / rev_t)
            components["GMI"] = round(gmi, 3)

        # AQI: Asset Quality Index
        if assets_t and assets_t1 and cur_a_t and capex_t is not None:
            non_ca_t = 1 - ((cur_a_t + capex_t) / assets_t)
            cur_a_t1 = v(cur_a,1)
            capex_t1 = abs(v(capex,1)) if v(capex,1) else 0
            if cur_a_t1 and assets_t1:
                non_ca_t1 = 1 - ((cur_a_t1 + capex_t1) / assets_t1)
                if non_ca_t1 != 0:
                    aqi = non_ca_t / non_ca_t1
                    components["AQI"] = round(aqi, 3)

        # SGI: Sales Growth Index
        if rev_t and rev_t1 and rev_t1 != 0:
            sgi = rev_t / rev_t1
            components["SGI"] = round(sgi, 3)

        # DEPI: Depreciation Index (skip — needs PPE detail)

        # SGAI: SG&A Index (skip — needs SG&A)

        # Leverage Index
        if debt_t is not None and debt_t1 is not None and assets_t and assets_t1:
            levi = (debt_t / assets_t) / max(debt_t1 / assets_t1, 0.001)
            components["LEVI"] = round(levi, 3)

        # TATA: Total Accruals to Total Assets
        if cfo_t and pat_t and assets_t:
            tata = (pat_t - cfo_t) / assets_t
            components["TATA"] = round(tata, 4)

        if not components:
            return result

        # Simplified M-Score using available components
        # Coefficients from Beneish (1999)
        score = -4.84
        if "DSRI" in components: score += 0.920 * components["DSRI"]
        if "GMI"  in components: score += 0.528 * components["GMI"]
        if "AQI"  in components: score += 0.404 * components["AQI"]
        if "SGI"  in components: score += 0.892 * components["SGI"]
        if "LEVI" in components: score += 0.115 * components["LEVI"]
        if "TATA" in components: score += 4.679 * components["TATA"]

        score = round(score, 3)
        # Fast-growing companies naturally have high SGI (Sales Growth Index > 1),
        # which inflates the M-Score. If SGI > 1.3 AND score is only marginally above
        # -1.78, label it as a growth-driven false positive rather than manipulation.
        if score > -1.78 and "SGI" in components and components["SGI"] > 1.3:
            sgi_contribution = 0.892 * components["SGI"]
            score_ex_sgi = score - sgi_contribution + 0.892  # normalise SGI to 1.0
            if score_ex_sgi < -2.0:
                verdict = "⚠ Elevated by high revenue growth (SGI) — not necessarily manipulation"
            else:
                verdict = "⚠ Suspicious — possible manipulation"
        else:
            verdict = "⚠ Suspicious — possible manipulation" if score > -1.78 else \
                      "Borderline" if score > -2.22 else "✓ Clean — unlikely manipulation"

        result = {"score": score, "verdict": verdict, "components": components}
    except Exception as e:
        result["verdict"] = f"Could not compute ({e})"

    return result


# ─────────────────────────────────────────────────────────────────────────────
# 6. ALTMAN Z-SCORE (Bankruptcy Risk)
# ─────────────────────────────────────────────────────────────────────────────

def compute_altman_zscore(fin: dict, market_cap_cr: float) -> dict:
    result = {"score": None, "verdict": "Insufficient data"}
    try:
        cur_a  = _safe_latest(fin.get("current_assets"))
        cur_l  = _safe_latest(fin.get("current_liab"))
        assets = _safe_latest(fin.get("total_assets"))
        ret_earn = _safe_latest(fin.get("net_profit"))   # approximation
        ebit   = _safe_latest(fin.get("op_income"))
        debt   = _safe_latest(fin.get("total_debt")) or 0
        equity = _safe_latest(fin.get("total_equity"))
        rev    = _safe_latest(fin.get("revenue"))

        if not all([cur_a, cur_l, assets, ebit, rev]):
            return result

        wc = cur_a - cur_l
        mve = market_cap_cr  # both mve and financials are in Cr

        x1 = wc / assets
        x2 = (ret_earn or 0) / assets
        x3 = ebit / assets
        x4 = mve / max(debt, 1)
        x5 = rev / assets

        z = round(1.2*x1 + 1.4*x2 + 3.3*x3 + 0.6*x4 + 1.0*x5, 2)

        verdict = "✓ Safe Zone (>2.99)" if z > 2.99 else \
                  "⚠ Grey Zone (1.81–2.99)" if z > 1.81 else \
                  "✗ Distress Zone (<1.81)"

        result = {"score": z, "verdict": verdict}
    except Exception as e:
        result["verdict"] = f"Could not compute ({e})"
    return result


# ─────────────────────────────────────────────────────────────────────────────
# 7. MANAGEMENT QUALITY
# ─────────────────────────────────────────────────────────────────────────────

def score_management(holders: dict, screener: dict, ratios: dict, fin: dict) -> ScoreCard:
    score = 0
    signals = []

    # Promoter stake
    promoter_pct = holders.get("promoter_pct") or screener.get("shareholding", {}).get("promoter")
    if promoter_pct:
        if isinstance(promoter_pct, str):
            try: promoter_pct = float(str(promoter_pct).replace("%",""))
            except: promoter_pct = None
    if promoter_pct:
        verdict = "Very High Conviction" if promoter_pct > 65 else "High" if promoter_pct > 50 else "Moderate" if promoter_pct > 35 else "Low"
        sc = 3 if promoter_pct > 65 else 2 if promoter_pct > 50 else 1 if promoter_pct > 35 else 0
        score += sc
        signals.append(("Promoter Stake", f"{promoter_pct}%", verdict))

    # Promoter trend
    ph = screener.get("promoter_history", [])
    if len(ph) >= 4:
        pct_vals = [p.get("pct") for p in ph[:4] if p.get("pct") is not None]
        if len(pct_vals) >= 2:
            trend = pct_vals[0] - pct_vals[-1]
            if trend > 1:
                sc, verdict = 1, "Increasing ↑"
            elif trend < -2:
                sc, verdict = -1, "Decreasing ↓ (watch)"
            else:
                sc, verdict = 0, "Stable →"
            score += sc
            signals.append(("Promoter Trend", f"{round(trend,1)}pp over last {len(pct_vals)}Q", verdict))

    # Ace investors present
    ace = screener.get("ace_investors", [])
    if ace:
        score += 2
        signals.append(("Ace Investors", ", ".join(ace[:3]), "Smart money present ✓"))

    # FII trend
    fii = screener.get("shareholding", {}).get("fii")
    if fii:
        verdict = "High FII Interest" if fii > 15 else "Moderate" if fii > 5 else "Low FII"
        sc = 1 if fii > 10 else 0
        score += sc
        signals.append(("FII Holding", f"{fii}%", verdict))

    # Working Capital Days (Debtor + Inventory days - Creditor days)
    rev   = _safe_latest(fin.get("revenue"))
    recv  = _safe_latest(fin.get("receivables"))
    inv   = _safe_latest(fin.get("inventory"))
    cur_l = _safe_latest(fin.get("current_liab"))
    if rev and recv and rev > 0:
        debtor_days = round(recv / rev * 365, 1)
        verdict = "Efficient" if debtor_days < 45 else "Moderate" if debtor_days < 90 else "High — cash tied up"
        signals.append(("Debtor Days", f"{debtor_days}d", verdict))
    if rev and inv and rev > 0:
        inv_days = round(inv / rev * 365, 1)
        verdict = "Lean" if inv_days < 30 else "Moderate" if inv_days < 60 else "Heavy inventory"
        signals.append(("Inventory Days", f"{inv_days}d", verdict))

    # Capex discipline: capex / revenue
    capex = abs(_safe_latest(fin.get("capex")) or 0)
    rev   = _safe_latest(fin.get("revenue")) or 1
    if capex and rev:
        capex_pct = round(capex / rev * 100, 1)
        verdict = "Light Capex" if capex_pct < 5 else "Moderate" if capex_pct < 15 else "Heavy Capex"
        signals.append(("Capex / Revenue", f"{capex_pct}%", verdict))

    narrative = _mgmt_narrative(promoter_pct, ace, ph)
    return ScoreCard("Management Quality", min(max(score, 0), 10), 10, signals, narrative)


def _mgmt_narrative(promoter_pct, ace, ph):
    parts = []
    if promoter_pct and promoter_pct > 60:
        parts.append(f"Promoter holding at {promoter_pct}% indicates strong founder conviction — skin in the game is a key Buffett/RJ criterion.")
    elif promoter_pct and promoter_pct < 35:
        parts.append(f"Low promoter holding ({promoter_pct}%) warrants scrutiny — alignment of management incentives with minority shareholders is unclear.")
    if ace:
        parts.append(f"Presence of ace investors ({', '.join(ace)}) signals that sophisticated, long-term money has validated the thesis.")
    if len(ph) >= 4:
        vals = [p.get("pct") for p in ph[:4] if p.get("pct") is not None]
        if vals and vals[0] < vals[-1] - 2:
            parts.append("Promoter has been reducing stake over recent quarters — a yellow flag requiring investigation.")
    return " ".join(parts) if parts else "Management quality analysis pending shareholder data."


# ─────────────────────────────────────────────────────────────────────────────
# MASTER RUNNER
# ─────────────────────────────────────────────────────────────────────────────

def _safe_score(fn, *args):
    """Run a scoring function, return zero-score card on error."""
    try:
        return fn(*args)
    except Exception as e:
        import inspect
        name = fn.__name__.replace("score_","").replace("_"," ").title()
        return ScoreCard(name, 0, 10, [], f"Could not compute: {e}")

def run_fundamental_analysis(fin: dict, ratios: dict, holders: dict, screener: dict, market_cap_cr: float) -> dict:
    # Ensure fin is always a dict with at least empty Series values
    if not fin:
        fin = {}
    import pandas as pd
    for k in ["revenue","net_profit","ebitda","gross_profit","op_income","interest_exp",
              "total_assets","total_equity","total_debt","current_assets","current_liab",
              "inventory","receivables","cash","cfo","capex","fcf"]:
        if k not in fin or fin[k] is None:
            fin[k] = pd.Series(dtype=float)

    biz    = _safe_score(score_business_quality, fin, ratios)
    health = _safe_score(score_financial_health, fin, ratios)
    growth = _safe_score(score_growth, fin, ratios)
    val    = _safe_score(score_valuation, ratios, fin)
    mgmt   = _safe_score(score_management, holders, screener, ratios, fin)
    try:
        beneish = compute_beneish_mscore(fin)
    except Exception as e:
        beneish = {"score": None, "verdict": f"Could not compute ({e})", "components": {}}
    try:
        altman = compute_altman_zscore(fin, market_cap_cr)
    except Exception as e:
        altman = {"score": None, "verdict": f"Could not compute ({e})"}

    cards = [biz, health, growth, val, mgmt]
    total = sum(c.score for c in cards)
    max_total = sum(c.max_score for c in cards)
    overall_pct = round(total / max_total * 100)

    if overall_pct >= 75:
        grade = "A — High Quality"
    elif overall_pct >= 60:
        grade = "B — Good Quality"
    elif overall_pct >= 45:
        grade = "C — Average"
    elif overall_pct >= 30:
        grade = "D — Below Average"
    else:
        grade = "F — Poor"

    return {
        "scorecards": cards,
        "total_score": total,
        "max_total": max_total,
        "overall_pct": overall_pct,
        "grade": grade,
        "beneish": beneish,
        "altman": altman,
    }
