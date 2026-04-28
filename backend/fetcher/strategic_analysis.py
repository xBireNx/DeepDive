"""
Strategic Analysis: Moat & Edge, Industry Landscape, Growth Catalysts.
Calls Google Gemini to generate real AI-powered qualitative analysis.
Falls back to sector templates if GEMINI_API_KEY is not set.
"""
import os
import json
import random
import hashlib
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent / ".env")

from fetcher.yfinance_data import resolve_ticker

# ── simple disk cache (24h TTL) ──────────────────────────────────────────────
_CACHE_DIR = Path(__file__).parent.parent / "__pycache__" / "strategic_cache"
_CACHE_DIR.mkdir(parents=True, exist_ok=True)
_CACHE_TTL = 86400  # 24 hours


def _cache_key(symbol: str) -> Path:
    return _CACHE_DIR / f"{symbol}.json"


def _read_cache(symbol: str):
    import time
    p = _cache_key(symbol)
    if p.exists() and (time.time() - p.stat().st_mtime) < _CACHE_TTL:
        try:
            return json.loads(p.read_text())
        except Exception:
            pass
    return None


def _write_cache(symbol: str, data: dict):
    try:
        _cache_key(symbol).write_text(json.dumps(data, ensure_ascii=False, indent=2))
    except Exception:
        pass


# ── Groq call ─────────────────────────────────────────────────────────────────
def _call_groq(symbol: str, company: str, sector: str, industry: str,
               description: str, market_cap, revenue, employees) -> dict:
    """Call Groq (llama-3.3-70b-versatile) for structured strategic analysis."""
    from groq import Groq

    api_key = os.getenv("GROQ_API_KEY", "").strip()
    if not api_key:
        raise ValueError("GROQ_API_KEY not set")

    client = Groq(api_key=api_key)

    mcap_str = f"₹{round(market_cap/1e7):,} Cr" if market_cap else "N/A"
    rev_str  = f"₹{round(revenue/1e7):,} Cr"   if revenue   else "N/A"
    emp_str  = f"{employees:,}"                  if employees else "N/A"

    prompt = f"""You are a senior equity research analyst at a top Indian investment bank.
Analyse **{company} ({symbol})** — a {sector} / {industry} company listed on NSE.

Key financials: Market Cap {mcap_str} | Revenue {rev_str} | Employees {emp_str}
Business description: {description[:500]}

Return ONLY valid JSON with EXACTLY this structure (no markdown, no explanation):

{{
  "moat": {{
    "label": "<Wide Moat | Narrow Moat | No Moat>",
    "overall_score": <float 1-5>,
    "scores": {{
      "network_effects": <int 1-5>,
      "switching_costs": <int 1-5>,
      "cost_advantage": <int 1-5>,
      "intangible_assets": <int 1-5>,
      "efficient_scale": <int 1-5>
    }},
    "description": "<2-3 sentences explaining WHY this company has or lacks a moat — be specific to this company>",
    "risk": "<1-2 sentences on the biggest risk to the moat>"
  }},
  "landscape": {{
    "market_size": "<TAM in Indian Rupees or USD with context>",
    "growth_rate": "<CAGR estimate with timeframe>",
    "penetration": "<current penetration vs global benchmark — 1-2 sentences>",
    "key_drivers": ["<driver 1>", "<driver 2>", "<driver 3>", "<driver 4>"],
    "risks": ["<risk 1>", "<risk 2>", "<risk 3>"],
    "tailwinds": ["<tailwind 1>", "<tailwind 2>", "<tailwind 3>"]
  }},
  "catalysts": [
    {{
      "catalyst": "<specific catalyst name>",
      "impact": "<High | Medium | Low>",
      "timeline": "<e.g. 2-4 years>",
      "detail": "<2-3 sentences explaining why this is a real catalyst for THIS specific company>"
    }}
  ]
}}

Rules:
- Be SPECIFIC to {company}, not generic India boilerplate.
- catalysts array must have exactly 4 items.
- key_drivers, risks, tailwinds must each have 3-4 items.
- overall_score = average of the 5 moat dimension scores rounded to 1 decimal.
- Respond ONLY with the JSON object, nothing else, no markdown fences."""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        max_tokens=1500,
    )

    text = response.choices[0].message.content.strip()

    # Strip markdown code fences if the model adds them
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
    text = text.strip().rstrip("```").strip()

    return json.loads(text)


# ── Fallback templates ────────────────────────────────────────────────────────
_FALLBACK = {
    "Financial Services": {
        "moat": {
            "label": "Wide Moat", "overall_score": 4.0,
            "scores": {"network_effects": 4, "switching_costs": 5, "cost_advantage": 3, "intangible_assets": 4, "efficient_scale": 4},
            "description": "Large Indian banks possess structural advantages via massive branch networks, CASA deposit franchises, and RBI licensing barriers that are nearly impossible for new entrants to replicate.",
            "risk": "Fintech disruption in retail banking and UPI-driven payment disintermediation are the primary moat erosion risks.",
        },
        "landscape": {
            "market_size": "₹220 Lakh Cr total banking credit",
            "growth_rate": "12–15% CAGR",
            "penetration": "India credit-to-GDP at ~55% vs 120%+ in developed markets — massive room to grow",
            "key_drivers": ["Rising MSME formalization via GST", "Digital lending via AA framework", "Insurance & wealth management boom", "Affordable housing finance push"],
            "risks": ["NPA cycle risk", "RBI regulatory tightening", "Competition from NBFCs & fintechs"],
            "tailwinds": ["JAM (Jan Dhan-Aadhaar-Mobile) infra", "UPI penetration driving deposits", "Government infra spend boosting credit demand"],
        },
        "catalysts": [
            {"catalyst": "India credit-to-GDP expansion", "impact": "High", "timeline": "5-7 years", "detail": "As India's GDP approaches $5T the formalized credit market grows proportionally."},
            {"catalyst": "MSME credit gap closure", "impact": "High", "timeline": "3-5 years", "detail": "GST data enables lenders to underwrite SMEs previously shut out of formal credit."},
            {"catalyst": "Wealth management shift", "impact": "Medium", "timeline": "3-5 years", "detail": "India's affluent class moving savings from FDs to mutual funds and insurance products."},
            {"catalyst": "Affordable housing loan growth", "impact": "Medium", "timeline": "3-7 years", "detail": "PM Awas Yojana and urbanisation driving 15%+ CAGR in home loans."},
        ],
    },
    "Technology": {
        "moat": {
            "label": "Wide Moat", "overall_score": 4.0,
            "scores": {"network_effects": 2, "switching_costs": 5, "cost_advantage": 5, "intangible_assets": 4, "efficient_scale": 4},
            "description": "Indian IT majors have multi-year client contracts with deep data and process lock-in, making switching extremely costly. India's labour cost arbitrage provides a sustainable 50-60% cost advantage vs Western peers.",
            "risk": "AI-driven automation could reduce the headcount-per-revenue ratio, potentially eroding cost arbitrage advantages.",
        },
        "landscape": {
            "market_size": "$227B IT exports + $350B domestic market",
            "growth_rate": "13–17% CAGR",
            "penetration": "India supplies 55% of global IT outsourcing — already dominant",
            "key_drivers": ["GenAI services demand from global enterprises", "Cloud migration backlog (30% migrated)", "Engineering R&D offshoring (GCCs)", "Domestic enterprise IT spend"],
            "risks": ["US H-1B visa restrictions", "Wage inflation at senior levels", "AI automating low-complexity work"],
            "tailwinds": ["Cost arbitrage vs US/Europe", "Digital India 2.0 policy", "China+1 offshoring trend benefiting India"],
        },
        "catalysts": [
            {"catalyst": "Generative AI services wave", "impact": "High", "timeline": "2-4 years", "detail": "Every Fortune 500 company needs GenAI integration — Indian IT firms are the delivery partners."},
            {"catalyst": "Cloud migration backlog", "impact": "High", "timeline": "3-5 years", "detail": "Only ~30% of enterprise workloads on cloud — the remaining migration is multi-year work."},
            {"catalyst": "GCC expansion in India", "impact": "Medium", "timeline": "3-5 years", "detail": "Global Capability Centres set up by MNCs create high-value R&D work for Indian talent."},
            {"catalyst": "Domestic IT spend boom", "impact": "Medium", "timeline": "2-4 years", "detail": "Indian enterprises accelerating ERP, cybersecurity, and analytics spend."},
        ],
    },
}
_FALLBACK["Consumer Cyclical"] = _FALLBACK["Consumer Defensive"] = {
    "moat": {
        "label": "Narrow Moat", "overall_score": 3.2,
        "scores": {"network_effects": 2, "switching_costs": 2, "cost_advantage": 3, "intangible_assets": 5, "efficient_scale": 4},
        "description": "Established consumer brands with strong distribution and retailer shelf space enjoy durable intangible asset moats — very hard for new entrants to build in 5-7 years.",
        "risk": "D2C brands and private labels on e-commerce platforms can erode pricing power in commoditized sub-categories.",
    },
    "landscape": {
        "market_size": "₹90 Lakh Cr total consumption economy",
        "growth_rate": "10–14% CAGR",
        "penetration": "India per-capita consumption at $2,200 vs $45,000+ in the US",
        "key_drivers": ["Rising middle class reaching 500M by 2030", "Urbanization from 35% to 50%", "Premiumization trend", "E-commerce penetration in Tier 2/3"],
        "risks": ["Rural consumption slowdown", "Input cost inflation", "D2C competitive disruption"],
        "tailwinds": ["Median age of 28 — peak consumption ahead", "Women workforce participation rising", "Aspiration economy driving branded purchase shift"],
    },
    "catalysts": [
        {"catalyst": "India's premiumization wave", "impact": "High", "timeline": "5-10 years", "detail": "Rising incomes push consumers to upgrade to branded premium products across every category."},
        {"catalyst": "Rural market formalization", "impact": "Medium", "timeline": "3-7 years", "detail": "Road and mobile commerce expansion brings branded FMCG to Tier 3/4 markets."},
        {"catalyst": "Demographic dividend", "impact": "High", "timeline": "5-10 years", "detail": "India will have the world's largest working-age population — decades of consumption growth ahead."},
        {"catalyst": "Quick-commerce expansion", "impact": "Medium", "timeline": "2-4 years", "detail": "10-minute delivery normalising impulse purchases, increasing basket size for branded goods."},
    ],
}

_DEFAULT_FALLBACK = {
    "moat": {
        "label": "Narrow Moat", "overall_score": 3.0,
        "scores": {"network_effects": 3, "switching_costs": 3, "cost_advantage": 3, "intangible_assets": 3, "efficient_scale": 3},
        "description": "The company operates in a moderately competitive market with established customer relationships and operational expertise providing some differentiation.",
        "risk": "Better-capitalised entrants or disruptive technology could erode existing market position.",
    },
    "landscape": {
        "market_size": "Multi-billion dollar addressable market",
        "growth_rate": "12–18% CAGR (sector estimate)",
        "penetration": "India's market significantly underpenetrated vs global benchmarks",
        "key_drivers": ["Growing domestic demand", "Government policy support", "Rising disposable incomes", "Digital adoption"],
        "risks": ["Regulatory changes", "Global macro headwinds", "Input cost volatility"],
        "tailwinds": ["India growth story", "Demographic dividend", "Infrastructure investment cycle"],
    },
    "catalysts": [
        {"catalyst": "India's GDP expansion to $5T", "impact": "High", "timeline": "5+ years", "detail": "India's broader economic growth lifts sectoral demand across the board."},
        {"catalyst": "Government capital expenditure", "impact": "Medium", "timeline": "2-4 years", "detail": "Record public capex creates downstream demand for goods and services."},
        {"catalyst": "Export market share gains", "impact": "Medium", "timeline": "3-5 years", "detail": "India gaining share in global value chains through China+1 strategy."},
        {"catalyst": "Operational leverage at scale", "impact": "Medium", "timeline": "2-3 years", "detail": "Revenue growth faster than cost growth drives margin expansion."},
    ],
}


# ── main public function ──────────────────────────────────────────────────────
def get_strategic_analysis(symbol: str) -> dict:
    symbol = symbol.upper()

    # Check disk cache first
    cached = _read_cache(symbol)
    if cached:
        return cached

    # Gather company data from yfinance
    try:
        _, ticker_sym = resolve_ticker(symbol)
        import yfinance as yf
        info = yf.Ticker(ticker_sym).info
        sector      = info.get("sector", "")
        industry    = info.get("industry", "")
        company     = info.get("longName") or info.get("shortName") or symbol
        description = info.get("longBusinessSummary") or f"{company} is listed on NSE."
        market_cap  = info.get("marketCap")
        revenue     = info.get("totalRevenue")
        employees   = info.get("fullTimeEmployees")
        website     = info.get("website", "")
    except Exception:
        sector = industry = ""; company = symbol
        description = f"{symbol} is a listed Indian company."
        market_cap = revenue = employees = None; website = ""

    # Symbol-based sector fallback
    if not sector:
        _MAP = {
            **{k: "Financial Services" for k in ["HDFCBANK","ICICIBANK","SBIN","AXISBANK","KOTAKBANK","INDUSIND","BANDHANBNK","FEDERALBNK","IDFCFIRSTB","PNB","CANBK","BAJFINANCE","BAJAJFINSV","MUTHOOTFIN","CHOLAFIN","PAYTM","HDFCAMC"]},
            **{k: "Technology"          for k in ["TCS","INFY","WIPRO","HCLTECH","TECHM","LTIM","MPHASIS","COFORGE","PERSISTENT","KPITTECH","TATAELXSI"]},
            **{k: "Consumer Cyclical"   for k in ["MARUTI","TATAMOTORS","M&M","BAJAJ-AUTO","HEROMOTOCO","EICHERMOT","TVSMOTOR","ZOMATO","NYKAA","DMART"]},
            **{k: "Consumer Defensive"  for k in ["HINDUNILVR","ITC","NESTLEIND","BRITANNIA","DABUR","MARICO","GODREJCP","COLPAL","TATACONSUM"]},
        }
        sector = _MAP.get(symbol, "")

    # ── Try Groq first ───────────────────────────────────────────────────────
    ai_result = None
    try:
        ai_result = _call_groq(symbol, company, sector, industry, description,
                               market_cap, revenue, employees)
    except ValueError:
        pass  # API key not set — fall through to templates silently
    except Exception as e:
        print(f"[Strategic] Groq error for {symbol}: {e}")

    # ── Assemble final response ───────────────────────────────────────────────
    if ai_result:
        moat_data      = ai_result["moat"]
        landscape_data = ai_result["landscape"]
        catalysts_data = ai_result["catalysts"]
        source         = "groq"
    else:
        # Fallback to hardcoded sector templates
        tmpl           = _FALLBACK.get(sector, _DEFAULT_FALLBACK)
        random.seed(sum(ord(c) for c in symbol))
        base_scores    = tmpl["moat"]["scores"]
        varied         = {k: min(5, max(1, v + random.randint(-1, 1))) for k, v in base_scores.items()}
        overall        = round(sum(varied.values()) / len(varied), 1)
        moat_data      = {**tmpl["moat"], "scores": varied, "overall_score": overall,
                          "label": "Wide Moat" if overall >= 4 else "Narrow Moat" if overall >= 2.5 else "No Moat"}
        landscape_data = tmpl["landscape"]
        catalysts_data = tmpl["catalysts"]
        source         = "template"

    result = {
        "symbol":      symbol,
        "company":     company,
        "sector":      sector or "—",
        "industry":    industry or "—",
        "description": description[:700],
        "market_cap":  market_cap,
        "revenue":     revenue,
        "employees":   employees,
        "website":     website,
        "source":      source,   # "gemini" or "template"
        "moat":        moat_data,
        "landscape":   landscape_data,
        "catalysts":   catalysts_data,
    }

    _write_cache(symbol, result)
    return result
