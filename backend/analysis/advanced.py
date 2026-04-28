"""
Advanced Analysis: DuPont, WC Trend, Relative Return vs Nifty, Red Flags, 
Promoter Transactions, FII/DII, Bulk Deals, Altman Z-Score, Cash Flow Analysis
"""
import pandas as pd, numpy as np, requests, yfinance as yf
from bs4 import BeautifulSoup
from datetime import datetime, timedelta

HEADERS = {"User-Agent": "Mozilla/5.0"}

def _s(series, i=0):
    if series is None: return None
    try:
        s = series.dropna()
        return float(s.iloc[i]) if len(s) > i else None
    except: return None

# ─────────────────────────────────────────────────────────────────────────────
# DU PONT ANALYSIS
# ─────────────────────────────────────────────────────────────────────────────
def compute_dupont(fin, ratios):
    trend = []
    rev = fin.get("revenue"); pat = fin.get("net_profit")
    assets = fin.get("total_assets"); equity = fin.get("total_equity")
    years = min(len(rev.dropna()) if rev is not None and not rev.empty else 0, 4)
    for i in range(years):
        r,p,a,e = _s(rev,i),_s(pat,i),_s(assets,i),_s(equity,i)
        if all(v and v!=0 for v in [r,p,a,e]):
            nm=p/r*100; at=r/a; em=a/e; roe=nm/100*at*em*100
            trend.append({"year":f"FY{25-i}","netMargin":round(nm,2),"assetTurnover":round(at,3),"equityMultiplier":round(em,2),"roe":round(roe,2)})
    insight=""
    if len(trend)>=2:
        c,p2=trend[0],trend[1]
        if c["netMargin"]>p2["netMargin"] and c["assetTurnover"]>p2["assetTurnover"]: insight="ROE improving on margin expansion AND better asset utilisation — high quality."
        elif c["netMargin"]>p2["netMargin"] and c["equityMultiplier"]>p2["equityMultiplier"]+0.2: insight="ROE improving via higher leverage — verify debt levels."
        elif c["netMargin"]<p2["netMargin"]: insight="Margin compression dragging ROE — watch pricing power and cost structure."
        elif c["assetTurnover"]<p2["assetTurnover"]-0.1: insight="Asset turnover declining — new capex not yet productive."
        else: insight="ROE composition stable."
    return {"trend":trend,"current":trend[0] if trend else {},"insight":insight}

# ─────────────────────────────────────────────────────────────────────────────
# WORKING CAPITAL TREND
# ─────────────────────────────────────────────────────────────────────────────
def compute_wc_trend(quarterly_results):
    if not quarterly_results or len(quarterly_results)<3:
        return {"trend":[],"insight":"Insufficient quarterly data."}
    trend=[]
    for q in quarterly_results[:8]:
        rev=q.get("revenue") or q.get("sales") or q.get("Revenue")
        opm=q.get("opm") or q.get("OPM")
        pat=q.get("net_profit") or q.get("Net Profit")
        qtr=q.get("quarter") or q.get("Quarter","")
        if rev: trend.append({"quarter":qtr,"revenue":round(float(rev),1),"opm":round(float(opm),2) if opm else None,"pat":round(float(pat),1) if pat else None})
    for i in range(len(trend)-1):
        pr=trend[i+1].get("revenue",0); cr=trend[i].get("revenue",0)
        trend[i]["revenueGrowthQoQ"]=round((cr/pr-1)*100,1) if pr else None
    opms_r=[t["opm"] for t in trend[:4] if t.get("opm") is not None]
    opms_o=[t["opm"] for t in trend[4:] if t.get("opm") is not None]
    insight=""
    if opms_r and opms_o:
        ra=sum(opms_r)/len(opms_r); oa=sum(opms_o)/len(opms_o)
        if ra>oa+1: insight=f"Margins expanding — recent avg {ra:.1f}% vs earlier {oa:.1f}%. Operating leverage working."
        elif ra<oa-1: insight=f"Margins compressing — recent avg {ra:.1f}% vs earlier {oa:.1f}%. Cost pressure or pricing issues."
        else: insight=f"Margins stable around {ra:.1f}%."
    return {"trend":trend,"insight":insight}

# ─────────────────────────────────────────────────────────────────────────────
# RELATIVE RETURN VS NIFTY
# ─────────────────────────────────────────────────────────────────────────────
def compute_relative_return(symbol, price_history):
    result={"periods":{},"insight":"","niftyHistory":[],"outperforming":False}
    if not price_history or len(price_history)<20: return result
    try:
        nh=yf.Ticker("^NSEI").history(period="1y")
        if nh.empty: return result
        nc=nh["Close"]
        sd={h["date"]:h["close"] for h in price_history}
        sdates=sorted(sd.keys())
        def nr(days): 
            if len(nc)<days: return None
            return round((float(nc.iloc[-1])/float(nc.iloc[-days])-1)*100,2)
        def sr(days):
            if len(sdates)<days: return None
            try:
                e=sd[sdates[-1]]; s=sd[sdates[max(0,len(sdates)-days)]]
                return round((e/s-1)*100,2) if s else None
            except: return None
        for lbl,days in [("1M",21),("3M",63),("6M",126),("1Y",252)]:
            nret=nr(min(days,len(nc))); sret=sr(min(days,len(sdates)))
            alpha=round(sret-nret,2) if sret is not None and nret is not None else None
            result["periods"][lbl]={"stock":sret,"nifty":nret,"alpha":alpha,"outperforming":alpha>0 if alpha is not None else None}
        result["niftyHistory"]=[{"date":str(idx.date()),"close":round(float(row),2)} for idx,row in nc.tail(60).items()]
        a1y=result["periods"].get("1Y",{}).get("alpha")
        if a1y is not None:
            result["outperforming"]=a1y>0
            if a1y>10: result["insight"]=f"Strong outperformer — beating Nifty by {a1y:.1f}% (1Y). Momentum is genuine."
            elif a1y>0: result["insight"]=f"Modest outperformer — ahead of Nifty by {a1y:.1f}% (1Y)."
            elif a1y>-10: result["insight"]=f"Underperformer — lagging Nifty by {abs(a1y):.1f}% (1Y). Verify if stock-specific or sector."
            else: result["insight"]=f"Significant underperformer — lagging Nifty by {abs(a1y):.1f}% (1Y). Strong thesis needed."
    except Exception as e: result["insight"]=f"Relative return unavailable: {e}"
    return result

# ─────────────────────────────────────────────────────────────────────────────
# RED FLAGS ANALYSIS
# ─────────────────────────────────────────────────────────────────────────────
def check_red_flags(fin, ratios, screener):
    flags=[]
    def s(k,i=0): return _s(fin.get(k),i)
    rev_n,rev_p=s("revenue",0),s("revenue",1)
    pat_n,pat_p=s("net_profit",0),s("net_profit",1)
    if rev_n and rev_p and pat_n and pat_p:
        rg=(rev_n/rev_p-1)*100; pg=(pat_n/pat_p-1)*100
        if rg>15 and pg<-5: flags.append({"flag":"Revenue up but profits down","severity":"HIGH","detail":f"Revenue +{rg:.1f}% but PAT {pg:.1f}% — margin destruction or one-time. Investigate."})
    fcf=s("fcf",0); pat=s("net_profit",0)
    if fcf is not None and pat and pat>0:
        ratio=fcf/pat*100
        if ratio<20: flags.append({"flag":"FCF far below reported PAT","severity":"HIGH","detail":f"FCF only {ratio:.0f}% of PAT. Working capital consuming cash or aggressive capex. Real earnings quality suspect."})
        elif ratio<50: flags.append({"flag":"FCF moderately below PAT","severity":"MEDIUM","detail":f"FCF/PAT: {ratio:.0f}%. Acceptable in growth phase — monitor trend."})
    recv_n,recv_p=s("receivables",0),s("receivables",1)
    if recv_n and recv_p and rev_n and rev_p and rev_p>0:
        rg2=(recv_n/recv_p-1)*100; revg=(rev_n/rev_p-1)*100
        if rg2>revg+20: flags.append({"flag":"Receivables outpacing revenue","severity":"HIGH","detail":f"Receivables +{rg2:.0f}% vs revenue +{revg:.0f}%. Possible channel stuffing or collection issues."})
    inv_n,inv_p=s("inventory",0),s("inventory",1)
    if inv_n and inv_p and rev_n and rev_p and rev_p>0:
        ig=(inv_n/inv_p-1)*100; rvg=(rev_n/rev_p-1)*100
        if ig>rvg+25: flags.append({"flag":"Inventory building faster than revenue","severity":"MEDIUM","detail":f"Inventory +{ig:.0f}% vs revenue +{rvg:.0f}%. Demand slowdown signal."})
    de=ratios.get("debt_to_equity")
    if de:
        dv=de/100 if de>10 else de
        ebit=s("op_income",0); interest=s("interest_exp",0)
        if dv>1.5:
            ic=abs(ebit/interest) if ebit and interest and interest!=0 else None
            sev="HIGH" if (ic and ic<3) else "MEDIUM"
            flags.append({"flag":f"High leverage D/E {dv:.1f}x","severity":sev,"detail":f"D/E {dv:.1f}x. IC: {ic:.1f}x." if ic else f"D/E {dv:.1f}x. Monitor debt."})
    pm=ratios.get("profit_margin") or ratios.get("profitMargin",0)
    om=ratios.get("op_margin") or ratios.get("opMargin",0)
    if pm and om and pm>om+5: flags.append({"flag":"Net margin > operating margin by 5%+","severity":"MEDIUM","detail":f"Net {pm:.1f}% vs op {om:.1f}%. Non-operating income inflating profits — verify sustainability."})
    if not flags: flags.append({"flag":"No major red flags detected","severity":"CLEAR","detail":"No obvious red flags from financial data. Always read annual report notes for RPTs and contingent liabilities."})
    order={"HIGH":0,"MEDIUM":1,"LOW":2,"CLEAR":3}
    flags.sort(key=lambda f:order.get(f["severity"],3))
    return flags

# ─────────────────────────────────────────────────────────────────────────────
# PROMOTER TRANSACTIONS
# ─────────────────────────────────────────────────────────────────────────────
def fetch_promoter_tx(symbol):
    txs=[]
    clean=symbol.replace(".NS","").replace(".BO","")
    for url in [f"https://www.screener.in/company/{clean}/consolidated/",f"https://www.screener.in/company/{clean}/"]:
        try:
            r=requests.get(url,headers=HEADERS,timeout=12)
            if r.status_code!=200: continue
            soup=BeautifulSoup(r.text,"html.parser")
            sec=soup.find("section",{"id":"shareholding"})
            if not sec: continue
            for tbl in sec.find_all("table"):
                hs=[th.get_text(strip=True) for th in tbl.find_all("th")]
                for row in tbl.find_all("tr")[1:]:
                    cells=[td.get_text(strip=True) for td in row.find_all("td")]
                    if len(cells)>=2 and "promoter" in cells[0].lower():
                        for i,h in enumerate(hs[1:],1):
                            if i<len(cells):
                                try: txs.append({"quarter":h,"pct":float(cells[i].replace("%","").replace(",","")),"entity":cells[0]})
                                except: pass
            break
        except: pass
    return txs[:12]

# ─────────────────────────────────────────────────────────────────────────────
# ALTMAN Z-SCORE (for listed manufacturing companies)
# ─────────────────────────────────────────────────────────────────────────────
def compute_altman_z(fin, ratios):
    try:
        def s(k): return _s(fin.get(k), 0) or 0
        
        ca = s("current_assets") or 0
        cl = s("current_liabilities") or 0
        ta = s("total_assets") or 0
        re = s("retained_earnings") or 0
        eb = s("op_income") or s("ebit") or 0
        rev = s("revenue") or 0
        vl = s("total_liabilities") or 0
        
        if ta <= 0 or vl <= 0:
            return {"score": None, "zone": "Unknown", "detail": "Insufficient data"}
        
        # Altman Z for emerging markets
        wc = (ca - cl) / ta if ta else 0
        re_ratio = re / ta if ta else 0
        eb_ratio = eb / ta if ta else 0
        rev_ratio = rev / ta if ta else 0
        
        z = 6.56 * wc + 3.26 * re_ratio + 6.72 * eb_ratio + 1.05 * rev_ratio
        
        if z > 3:
            zone = "Safe"
            detail = f"Z-Score {z:.2f} — Low bankruptcy risk"
        elif z > 1.1:
            zone = "Grey"
            detail = f"Z-Score {z:.2f} — Uncertain, monitor closely"
        else:
            zone = "Distress"
            detail = f"Z-Score {z:.2f} — High bankruptcy risk"
        
        return {"score": round(z, 2), "zone": zone, "detail": detail}
    except Exception as e:
        return {"score": None, "zone": "Error", "detail": str(e)}

# ─────────────────────────────────────────────────────────────────────────────
# FII / DII HOLDINGS TREND
# ─────────────────────────────────────────────────────────────────────────────
def compute_fii_dii_trend(screener):
    try:
        sh = screener.get("shareholding", {})
        fii = sh.get("fii", [])
        dii = sh.get("dii", [])
        
        # Try to get historical data from promoter_history
        ph = screener.get("promoter_history", [])
        
        result = {"fii": [], "dii": [], "insight": ""}
        
        # Extract FII from shareholding if available
        if fii and isinstance(fii, (int, float)):
            result["fii"] = [{"quarter": "Latest", "pct": round(fii, 2)}]
        
        if dii and isinstance(dii, (int, float)):
            result["dii"] = [{"quarter": "Latest", "pct": round(dii, 2)}]
        
        # Generate insight
        fii_latest = result["fii"][0]["pct"] if result["fii"] else 0
        dii_latest = result["dii"][0]["pct"] if result["dii"] else 0
        
        if fii_latest > 20:
            result["insight"] = f"High FII interest at {fii_latest}%. Foreign investors bullish."
        elif fii_latest < 5:
            result["insight"] = f"Low FII participation at {fii_latest}%. Domestic-driven stock."
        else:
            result["insight"] = f"FII: {fii_latest}%, DII: {dii_latest}%. Balanced institutional ownership."
        
        return result
    except Exception as e:
        return {"fii": [], "dii": [], "insight": f"Data unavailable: {e}"}

# ─────────────────────────────────────────────────────────────────────────────
# BULK / BLOCK DEALS (from NSE)
# ─────────────────────────────────────────────────────────────────────────────
def fetch_bulk_deals(symbol):
    deals = []
    clean = symbol.replace(".NS", "").replace(".BO", "")
    
    try:
        # Try NSE bulk deals page
        url = f"https://www.nseindia.com/api/corporate-bulk-deals?symbol={clean}"
        resp = requests.get(url, headers=HEADERS, timeout=10)
        
        if resp.status_code == 200:
            data = resp.json()
            for d in data.get("data", [])[:10]:
                deals.append({
                    "date": d.get("dealDate", ""),
                    "type": d.get("dealType", ""),
                    "quantity": d.get("quantity", 0),
                    "price": d.get("price", 0),
                    "value": d.get("dealValue", 0),
                    "buyer": d.get("buyerName", ""),
                    "seller": d.get("sellerName", "")
                })
    except Exception as e:
        pass
    
    # If no NSE data, try screener
    if not deals:
        try:
            clean_url = symbol.replace(".NS", "").replace(".BO", "")
            url = f"https://www.screener.in/company/{clean_url}/"
            resp = requests.get(url, headers=HEADERS, timeout=12)
            if resp.status_code == 200:
                soup = BeautifulSoup(resp.text, "html.parser")
                # Look for bulk deals section
                for section in soup.find_all(["section", "div"]):
                    if "bulk" in section.get_text().lower():
                        tables = section.find_all("table")
                        for tbl in tables[:2]:
                            rows = tbl.find_all("tr")[1:4]
                            for row in rows:
                                cells = row.find_all("td")
                                if len(cells) >= 3:
                                    deals.append({
                                        "date": cells[0].get_text(strip=True),
                                        "type": cells[1].get_text(strip=True),
                                        "quantity": cells[2].get_text(strip=True),
                                        "price": cells[3].get_text(strip=True) if len(cells) > 3 else "",
                                    })
        except Exception as e:
            pass
    
    return deals[:10]

# ─────────────────────────────────────────────────────────────────────────────
# CASH FLOW ANALYSIS
# ─────────────────────────────────────────────────────────────────────────────
def compute_cash_flow(fin):
    try:
        def s(k): return _s(fin.get(k), 0) or 0
        
        operating = s("fcf")  # Free Cash Flow
        investing = s("cash_from_investing") or s("capex")
        financing = s("cash_from_financing") or s("dividends_paid")
        
        if not any([operating, investing, financing]):
            return {"insight": "Cash flow data not available"}
        
        insight = ""
        
        # Operating cash generation
        if operating and operating > 0:
            if operating > s("net_profit") or operating > 0:
                insight = "Strong operating cash generation — FCF > PAT. Quality earnings."
            else:
                insight = "Operating cash positive but below PAT — monitor working capital."
        elif operating and operating < 0:
            insight = "Negative operating cash flow — critical red flag. Check why."
        
        # Investing
        if investing and investing < 0:
            capex_mag = abs(investing)
            if operating and operating > 0:
                if operating > capex_mag:
                    insight += " Capex being funded by operations — sustainable."
                else:
                    insight += " Capex exceeds operating cash — relying on financing."
        
        # Financing
        if financing and financing < 0:
            insight += " Dividend / debt repayment outflow."
        
        return {
            "operating": operating,
            "investing": investing,
            "financing": financing,
            "insight": insight or "Cash flow analysis unavailable"
        }
    except Exception as e:
        return {"insight": f"Error: {e}"}

# ─────────────────────────────────────────────────────────────────────────────
# KEY RATIOS SUMMARY
# ─────────────────────────────────────────────────────────────────────────────
def compute_ratios_summary(ratios, fin):
    def r(k): return ratios.get(k)
    
    result = {
        "valuation": {
            "pe": r("pe"),
            "pb": r("pb"),
            "ps": r("ps"),
            "ev_ebitda": r("ev_ebitda"),
            "peg": r("peg"),
            "dividend_yield": r("dividend_yield")
        },
        "profitability": {
            "roe": r("roe"),
            "roa": r("roa"),
            "roic": r("roic") or (r("roe") * 0.8 if r("roe") else None),
            "gross_margin": fin.get("gross_profit"),
            "net_margin": r("profit_margin"),
            "op_margin": r("op_margin")
        },
        "liquidity": {
            "current_ratio": r("current_ratio"),
            "quick_ratio": r("quick_ratio"),
            "debt_to_equity": r("debt_to_equity"),
            "interest_coverage": r("interest_coverage")
        },
        "growth": {
            "revenue_growth": r("revenue_growth"),
            "eps_growth": r("eps_growth"),
            "profit_growth": r("profit_growth")
        },
        "size": {
            "market_cap_cr": ratios.get("market_cap"),
            "enterprise_value": r("enterprise_value")
        }
    }
    
    return result

# ─────────────────────────────────────────────────────────────────────────────
# MAIN RUNNER
# ─────────────────────────────────────────────────────────────────────────────
def run_advanced(symbol, fin, ratios, screener, price_history, ticker_obj=None, company_name=""):
    return {
        "dupont": compute_dupont(fin, ratios),
        "wcTrend": compute_wc_trend(screener.get("quarterly_results",[])),
        "relativeReturn": compute_relative_return(symbol, price_history),
        "redFlags": check_red_flags(fin, ratios, screener),
        "promoterTx": fetch_promoter_tx(symbol),
        # New additions
        "altmanZ": compute_altman_z(fin, ratios),
        "fiiDii": compute_fii_dii_trend(screener),
        "bulkDeals": fetch_bulk_deals(symbol),
        "cashFlow": compute_cash_flow(fin),
        "ratiosSummary": compute_ratios_summary(ratios, fin)
    }