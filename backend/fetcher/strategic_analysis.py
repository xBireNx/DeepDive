"""
Enhanced Strategic Analysis
- Moat & Edge Assessment
- Industry Landscape
- Growth Catalysts
- SWOT Analysis (NEW)
- Porter's Five Forces (NEW)
- Competitive Positioning (NEW)
- Management Assessment (NEW)
- ESG Overview (NEW)
"""
import os
import json
import random
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent / ".env")

from fetcher.yfinance_data import resolve_ticker

# Cache setup
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
        except:
            pass
    return None

def _write_cache(symbol: str, data: dict):
    try:
        _cache_key(symbol).write_text(json.dumps(data, ensure_ascii=False, indent=2))
    except:
        pass


# ─────────────────────────────────────────────────────────────────────────────
# GROQ AI CALL
# ─────────────────────────────────────────────────────────────────────────────
def _call_groq(symbol: str, company: str, sector: str, industry: str,
               description: str, market_cap, revenue, employees, 
               peers: list = None, promoter_pct: float = None,
               roe: float = None, de: float = None) -> dict:
    from groq import Groq
    
    api_key = os.getenv("GROQ_API_KEY", "").strip()
    if not api_key:
        raise ValueError("GROQ_API_KEY not set")
    
    client = Groq(api_key=api_key)
    
    mcap_str = f"₹{round(market_cap/1e7):,} Cr" if market_cap else "N/A"
    rev_str = f"₹{round(revenue/1e7):,} Cr" if revenue else "N/A"
    peers_str = ", ".join(peers[:3]) if peers else "N/A"
    
    # Additional metrics for enhanced analysis
    promoter_str = f"{promoter_pct:.1f}%" if promoter_pct else "N/A"
    roe_str = f"{roe*100:.1f}%" if roe else "N/A"
    de_str = f"{de:.2f}x" if de else "N/A"
    
    prompt = f"""You are a senior equity research analyst at a top Indian investment bank.
Analyse **{company} ({symbol})** — a {sector} / {industry} company listed on NSE.

KEY FINANCIALS:
- Market Cap: {mcap_str}
- Revenue: {rev_str}  
- Employees: {employees:, if employees else 'N/A'}
- Promoter Holding: {promoter_str}
- ROE: {roe_str}
- Debt/Equity: {de_str}
- Top Peers: {peers_str}

Business description: {description[:400]}

Generate a COMPREHENSIVE strategic analysis in JSON format (no markdown, exact structure):

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
    "description": "<2-3 sentences on WHY this company has/lacks a moat>",
    "risk": "<1-2 sentences on biggest moat risk>"
  }},
  "landscape": {{
    "market_size": "<TAM with context>",
    "growth_rate": "<CAGR with timeframe>",
    "penetration": "<India vs global benchmark>",
    "key_drivers": ["<4 specific drivers>"],
    "risks": ["<3-4 risks>"],
    "tailwinds": ["<3-4 tailwinds>"]
  }},
  "catalysts": [
    {{"catalyst": "<name>", "impact": "<High|Medium|Low>", "timeline": "<timeframe>", "detail": "<2-3 sentences>"}}
  ],
  "swot": {{
    "strengths": ["<4-5 internal strengths>"],
    "weaknesses": ["<4-5 internal weaknesses>"],
    "opportunities": ["<4-5 external opportunities>"],
    "threats": ["<4-5 external threats>"]
  }},
  "porters": {{
    "rivalry": <int 1-5>,
    "rivalry_detail": "<1 sentence on competitive intensity>",
    "threat_new": <int 1-5>,
    "threat_new_detail": "<1 sentence on new entrant threat>",
    "threat_sub": <int 1-5>,
    "threat_sub_detail": "<1 sentence on substitute threat>",
    "bargaining_buyer": <int 1-5>,
    "bargaining_buyer_detail": "<1 sentence on buyer power>",
    "bargaining_supplier": <int 1-5>,
    "bargaining_supplier_detail": "<1 sentence on supplier power>"
  }},
  "management": {{
    "score": <int 1-5>,
    "promoter_skin": <int 1-5>,
    "promoter_detail": "<1 sentence on promoter alignment>",
    "exec_quality": <int 1-5>,
    "exec_detail": "<1 sentence on management quality>",
    "capital_allocation": <int 1-5>,
    "capital_detail": "<1 sentence on allocation track record>",
    "esg_score": <float 0-100>,
    "esg_detail": "<1-2 sentences on ESG profile>"
  }},
  "competitive": {{
    "market_share": "<estimated market share if known>",
    "position": "<Leader|Challenger|Niche Player|Disrupter>",
    "advantages": ["<3-4 competitive advantages>"],
    "vs_peers": {{"strength": "<how better than peers>", "weakness": "<how worse than peers>"}}
  }}
}}

Rules:
- Be SPECIFIC to {company}, not generic boilerplate
- catalysts: exactly 4 items
- swot, key_drivers, risks, tailwinds: 4-5 items each
- overall_score = average of 5 moat scores rounded to 1 decimal
- Return ONLY valid JSON"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        max_tokens=2000,
    )
    
    text = response.choices[0].message.content.strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
    return json.loads(text.strip().rstrip("```").strip())


# ─────────────────────────────────────────────────────────────────────────────
# FALLBACK TEMPLATES (Enhanced with new sections)
# ─────────────────────────────────────────────────────────────────────────────
_FALLBACK = {
    "Financial Services": {
        "moat": {
            "label": "Wide Moat", "overall_score": 4.0,
            "scores": {"network_effects": 4, "switching_costs": 5, "cost_advantage": 3, "intangible_assets": 4, "efficient_scale": 4},
            "description": "Large Indian banks have structural advantages via massive branch networks, CASA deposits, and RBI licensing barriers.",
            "risk": "Fintech disruption and UPI-driven payment disintermediation are primary moat erosion risks.",
        },
        "landscape": {
            "market_size": "₹220 Lakh Cr banking credit",
            "growth_rate": "12–15% CAGR",
            "penetration": "India credit-to-GDP at ~55% vs 120%+ in developed markets",
            "key_drivers": ["MSME formalization", "Digital lending", "Insurance boom", "Affordable housing"],
            "risks": ["NPA cycle", "RBI tightening", "NBFC competition"],
            "tailwinds": ["JAM infrastructure", "UPI penetration", "Govt infra spend"],
        },
        "catalysts": [
            {"catalyst": "Credit-to-GDP expansion", "impact": "High", "timeline": "5-7 years", "detail": "GDP growth drives proportional credit market expansion."},
            {"catalyst": "MSME credit gap closure", "impact": "High", "timeline": "3-5 years", "detail": "GST data enables lending to previously excluded SMEs."},
            {"catalyst": "Wealth management shift", "impact": "Medium", "timeline": "3-5 years", "detail": "Affluent class shifting from FDs to MFs and insurance."},
            {"catalyst": "Affordable housing boom", "impact": "Medium", "timeline": "3-7 years", "detail": "PM Awas Yojana driving 15%+ CAGR in home loans."},
        ],
        "swot": {
            "strengths": ["Massive branch network", "CASA deposit advantage", "RBI licensing barrier", "Strong brand trust", "Diversified revenue"],
            "weaknesses": ["Legacy IT systems", "High NPA provisions", "Slow digital innovation vs fintech", "Regulatory constraints", "Fixed cost branch network"],
            "opportunities": ["Rural penetration", "Cross-sell insurance & MF", "Digital lending expansion", "SME financing gap", "Wealth management"],
            "threats": ["UPI/fintech disruption", "RBI rate volatility", "Global bank entry", "Private sector competition", "Cyber security risks"]
        },
        "porters": {
            "rivalry": 4, "rivalry_detail": "High competition among PSU banks, private banks, and fintech",
            "threat_new": 2, "threat_new_detail": "RBI licensing makes entry difficult but neo-banks finding ways",
            "threat_sub": 5, "threat_sub_detail": "UPI/digital payments rapidly substituting traditional banking",
            "bargaining_buyer": 3, "bargaining_buyer_detail": "Retail customers have low power, corporate has some leverage",
            "bargaining_supplier": 2, "bargaining_supplier_detail": "Depositors have minimal power, large depositors have some"
        },
        "management": {
            "score": 3.5, "promoter_skin": 4, "promoter_detail": "PSU banks have government backing, private banks have promoter alignment",
            "exec_quality": 4, "exec_detail": "Experienced senior management with regulatory familiarity",
            "capital_allocation": 3, "capital_detail": "Regulatory constraints limit capital flexibility",
            "esg_score": 65, "esg_detail": "Moderate ESG - strong governance but environmental exposure via physical assets"
        },
        "competitive": {
            "market_share": "Top 3 in India", "position": "Leader",
            "advantages": ["Largest branch network", "CASA franchise", "RBI regulatory moat", "Brand trust"],
            "vs_peers": {"strength": "Scale and reach", "weakness": "Digital innovation speed"}
        }
    },
    "Technology": {
        "moat": {
            "label": "Wide Moat", "overall_score": 4.0,
            "scores": {"network_effects": 2, "switching_costs": 5, "cost_advantage": 5, "intangible_assets": 4, "efficient_scale": 4},
            "description": "Multi-year client contracts with deep data lock-in and 50-60% cost arbitrage vs Western peers.",
            "risk": "AI automation could reduce headcount-per-revenue ratio, eroding cost advantage.",
        },
        "landscape": {
            "market_size": "$227B exports + $350B domestic",
            "growth_rate": "13–17% CAGR",
            "penetration": "55% of global IT outsourcing - already dominant",
            "key_drivers": ["GenAI services", "Cloud migration", "GCC expansion", "Domestic IT spend"],
            "risks": ["H-1B visa issues", "Wage inflation", "AI automation"],
            "tailwinds": ["Cost arbitrage", "China+1 trend", "Digital India policy"],
        },
        "catalysts": [
            {"catalyst": "GenAI services wave", "impact": "High", "timeline": "2-4 years", "detail": "Every Fortune 500 needs GenAI - Indian IT is delivery partner."},
            {"catalyst": "Cloud migration backlog", "impact": "High", "timeline": "3-5 years", "detail": "70% enterprise workloads not yet migrated."},
            {"catalyst": "GCC expansion", "impact": "Medium", "timeline": "3-5 years", "detail": "MNCs setting up high-value R&D centers in India."},
            {"catalyst": "Domestic IT boom", "impact": "Medium", "timeline": "2-4 years", "detail": "Indian enterprises accelerating ERP, cybersecurity spend."},
        ],
        "swot": {
            "strengths": ["Large talent pool", "Cost arbitrage", "Client relationships", "Scale delivery", "Domain expertise"],
            "weaknesses": ["Wage inflation", "Visa dependency", "Concentration risk", "Limited IP/brand", "Middle management churn"],
            "opportunities": ["GenAI transformation", "Cloud migration", "GCC offshoring", "Domestic market", "Digital transformation"],
            "threats": ["Automation AI", "H-1B restrictions", "China competition", "In-house IT", "Economic slowdown"]
        },
        "porters": {
            "rivalry": 3, "rivalry_detail": "Strong competition among Indian majors and global consultancies",
            "threat_new": 3, "threat_new_detail": "Low - high barriers via talent and relationships",
            "threat_sub": 4, "threat_sub_detail": "AI tools becoming alternatives to traditional services",
            "bargaining_buyer": 4, "bargaining_buyer_detail": "Large enterprise clients have significant pricing power",
            "bargaining_supplier": 2, "bargaining_supplier_detail": "Abundant talent supply limits supplier power"
        },
        "management": {
            "score": 4.5, "promoter_skin": 5, "promoter_detail": "Strong promoter alignment with equity stake",
            "exec_quality": 4, "exec_detail": "Experienced leadership with long tenure",
            "capital_allocation": 4, "capital_detail": "Consistent dividend and buyback track record",
            "esg_score": 75, "esg_detail": "Good ESG - high governance scores, diverse workforce"
        },
        "competitive": {
            "market_share": "Top 3 in IT services", "position": "Leader",
            "advantages": ["Talent scale", "Cost advantage", "Client relationships", "Delivery excellence"],
            "vs_peers": {"strength": "Scale and pricing", "weakness": "Innovation vs startups"}
        }
    },
}

_DEFAULT = {
    "moat": {
        "label": "Narrow Moat", "overall_score": 3.0,
        "scores": {"network_effects": 3, "switching_costs": 3, "cost_advantage": 3, "intangible_assets": 3, "efficient_scale": 3},
        "description": "Moderate competitive advantages via customer relationships and operational expertise.",
        "risk": "Better-capitalized entrants or tech disruption could erode position.",
    },
    "landscape": {
        "market_size": "Multi-billion dollar market",
        "growth_rate": "12–18% CAGR",
        "penetration": "India underpenetrated vs global",
        "key_drivers": ["Domestic demand", "Policy support", "Rising incomes", "Digital adoption"],
        "risks": ["Regulatory changes", "Macro headwinds", "Input costs"],
        "tailwinds": ["India growth story", "Demographics", "Infrastructure spend"],
    },
    "catalysts": [
        {"catalyst": "India GDP expansion", "impact": "High", "timeline": "5+ years", "detail": "Economic growth lifts sector demand."},
        {"catalyst": "Govt capex push", "impact": "Medium", "timeline": "2-4 years", "detail": "Public spend creates downstream demand."},
        {"catalyst": "Export gains", "impact": "Medium", "timeline": "3-5 years", "detail": "China+1 strategy benefits India."},
        {"catalyst": "Operating leverage", "impact": "Medium", "timeline": "2-3 years", "detail": "Revenue grows faster than costs."},
    ],
    "swot": {
        "strengths": ["Established brand", "Distribution network", "Experienced management", "Market position", "Financial strength"],
        "weaknesses": ["Limited innovation", "High debt", "Regulatory dependency", "Legacy systems", "Geographic concentration"],
        "opportunities": ["Market expansion", "New products", "Digital transformation", "Acquisitions", "Rural reach"],
        "threats": ["Competition", "Policy changes", "Input inflation", "Technology disruption", "Economic slowdown"]
    },
    "porters": {
        "rivalry": 3, "rivalry_detail": "Moderate competition in the sector",
        "threat_new": 3, "threat_new_detail": "Some barriers but capital is available",
        "threat_sub": 3, "threat_sub_detail": "Alternative solutions exist",
        "bargaining_buyer": 3, "bargaining_buyer_detail": "Buyers have moderate power",
        "bargaining_supplier": 3, "bargaining_supplier_detail": "Supplier power varies by input"
    },
    "management": {
        "score": 3, "promoter_skin": 3, "promoter_detail": "Varies by company - check promoter holdings",
        "exec_quality": 3, "exec_detail": "Management quality varies",
        "capital_allocation": 3, "capital_detail": "Track record depends on company",
        "esg_score": 60, "esg_detail": "Moderate ESG - company specific assessment needed"
    },
    "competitive": {
        "market_share": "Mid-tier", "position": "Challenger",
        "advantages": ["Local knowledge", "Distribution", "Cost advantage", "Customer relationships"],
        "vs_peers": {"strength": "Flexibility", "weakness": "Scale vs leaders"}
    }
}

# Add Consumer sectors
_FALLBACK["Consumer Cyclical"] = _FALLBACK["Consumer Defensive"] = {
    "moat": {"label": "Narrow Moat", "overall_score": 3.2, "scores": {"network_effects": 2, "switching_costs": 2, "cost_advantage": 3, "intangible_assets": 5, "efficient_scale": 4}, "description": "Strong brands and distribution create durable moats.", "risk": "D2C and private labels can erode pricing power."},
    "landscape": {"market_size": "₹90 Lakh Cr", "growth_rate": "10–14% CAGR", "penetration": "India per-capita $2,200 vs US $45,000", "key_drivers": ["Middle class 500M", "Urbanization", "Premiumization", "E-commerce"], "risks": ["Rural slowdown", "Input costs", "D2C disruption"], "tailwinds": ["Demographics", "Women workforce", "Aspiration"]},
    "catalysts": [{"catalyst": "Premiumization", "impact": "High", "timeline": "5-10 years", "detail": "Rising incomes drive branded purchases."}, {"catalyst": "Rural formalization", "impact": "Medium", "timeline": "3-7 years", "detail": "Commerce expansion reaches Tier 3/4."}, {"catalyst": "Demographic dividend", "impact": "High", "timeline": "5-10 years", "detail": "World's largest working-age population."}, {"catalyst": "Quick-commerce", "impact": "Medium", "timeline": "2-4 years", "detail": "10-min delivery changes buying patterns."}],
    "swot": {"strengths": ["Strong brands", "Distribution reach", "Consumer trust", "Cash flow", "Pricing power"], "weaknesses": ["Slow innovation", "High marketing costs", "Input volatility", "SKU complexity", "Rural reach gap"], "opportunities": ["Rural expansion", "New categories", "E-commerce", "Premiumization", "Acquisitions"], "threats": ["D2C brands", "Private labels", "Input inflation", "Regulatory", "Competition"]},
    "porters": {"rivalry": 4, "rivalry_detail": "Fierce competition among FMCG/consumer companies", "threat_new": 3, "threat_new_detail": "Low barriers attract new entrants", "threat_sub": 4, "threat_sub_detail": "Store brands and D2C are substitutes", "bargaining_buyer": 2, "bargaining_buyer_detail": "Individual buyers have low power", "bargaining_supplier": 2, "bargaining_supplier_detail": "Multiple suppliers available"},
    "management": {"score": 4, "promoter_skin": 4, "promoter_detail": "Family-run businesses with skin in game", "exec_quality": 4, "exec_detail": "Professional management with legacy", "capital_allocation": 4, "capital_detail": "Disciplined capital allocation", "esg_score": 70, "esg_detail": "Good ESG - environmental footprint manageable"},
    "competitive": {"market_share": "Top 5 in segments", "position": "Leader", "advantages": ["Brand equity", "Distribution", "Consumer trust", "Supply chain"], "vs_peers": {"strength": "Brand power", "weakness": "Digital speed"}}
}

# Healthcare
_FALLBACK["Healthcare"] = {
    "moat": {"label": "Wide Moat", "overall_score": 4.0, "scores": {"network_effects": 2, "switching_costs": 5, "cost_advantage": 3, "intangible_assets": 5, "efficient_scale": 4}, "description": "Regulatory approvals and IP create strong moats. Doctor trust and brand loyalty drive repeat business.", "risk": "Price control regulations and generic penetration can erode margins."},
    "landscape": {"market_size": "₹14 Lakh Cr", "growth_rate": "12–15% CAGR", "penetration": "India per-capita $80 vs US $1,400", "key_drivers": ["Lifestyle diseases", "Insurance penetration", "Ayushman Bharat", "Medical tourism"], "risks": ["Price controls", "Generic competition", "Regulatory delays"], "tailwinds": ["Demographics", "Chronic disease burden", "Medical value travel"]},
    "catalysts": [{"catalyst": "Ayushman Bharat scale", "impact": "High", "timeline": "3-5 years", "detail": "World's largest health insurance scheme drives volume."}, {"catalyst": "Chronic disease surge", "impact": "High", "timeline": "5-10 years", "detail": "Diabetes, cardiac issues create long-term demand."}, {"catalyst": "Generic exports", "impact": "Medium", "timeline": "3-7 years", "detail": "US FDA approvals enable global generic play."}, {"catalyst": "Consolidation", "impact": "Medium", "timeline": "2-4 years", "detail": "M&A creates integrated healthcare players."}],
    "swot": {"strengths": ["Regulatory moat", "Strong brands", "Distribution network", "R&D capabilities", "Doctor relationships"], "weaknesses": ["Price control exposure", "Input cost volatility", "API dependency", "Legacy IT", "Geographic concentration"], "opportunities": ["Chronic disease market", "Rural healthcare", "Biosimilars", "Medical tourism", "Digital health"], "threats": ["NPPA price cuts", "Generic competition", "Chinese API imports", "Regulatory changes", "Insurance pressure"]},
    "porters": {"rivalry": 4, "rivalry_detail": "Fragmented industry with numerous players", "threat_new": 2, "threat_new_detail": "High regulatory barriers deter entry", "threat_sub": 4, "threat_sub_detail": "Generic substitutes are common", "bargaining_buyer": 3, "bargaining_buyer_detail": "Hospitals have some power, individuals don't", "bargaining_supplier": 3, "bargaining_supplier_detail": "API suppliers are consolidated"},
    "management": {"score": 4, "promoter_skin": 3, "promoter_detail": "Professional management with promoter stake", "exec_quality": 4, "exec_detail": "Experienced pharma executives", "capital_allocation": 4, "capital_detail": "R&D investment track record", "esg_score": 65, "esg_detail": "Moderate ESG - governance improving"},
    "competitive": {"market_share": "Top 5 in India", "position": "Leader", "advantages": ["Regulatory expertise", "Brand trust", "Distribution reach", "R&D pipeline"], "vs_peers": {"strength": "Portfolio breadth", "weakness": "Price control exposure"}}
}

# Metals & Mining
_FALLBACK["Metals & Mining"] = {
    "moat": {"label": "Wide Moat", "overall_score": 4.2, "scores": {"network_effects": 1, "switching_costs": 5, "cost_advantage": 5, "intangible_assets": 5, "efficient_scale": 5}, "description": "Resource endowments and captive mines create structural cost advantages. Railway linkages and port access amplify moat.", "risk": "Commodity price volatility and regulatory/environmental constraints."},
    "landscape": {"market_size": "₹18 Lakh Cr steel + minerals", "growth_rate": "8–12% CAGR", "penetration": "India per-capita steel 75kg vs global 150kg", "key_drivers": ["Infrastructure push", "Housing demand", "Metro projects", "Defense production"], "risks": ["China supply", "Iron ore bans", "Environmental clearances", "Power costs"], "tailwinds": ["Govt capex", "PLI schemes", "China+1", "Renewable demand"]},
    "catalysts": [{"catalyst": "Infrastructure capex", "impact": "High", "timeline": "3-7 years", "detail": "Govt spends ₹100L Cr on infra over 5 years."}, {"catalyst": "Housing demand", "impact": "High", "timeline": "5-10 years", "detail": "Urban housing shortage drives steel demand."}, {"catalyst": "PLI for metals", "impact": "Medium", "timeline": "2-5 years", "detail": "Production-linked incentives boost capacity."}, {"catalyst": "Green steel transition", "impact": "Medium", "timeline": "5-10 years", "detail": "DRI technology creates new opportunities."}],
    "swot": {"strengths": ["Resource rich", "Cost advantage", "Captive mines", "Railway integration", "Scale"], "weaknesses": ["High carbon footprint", "Input cost exposure", "Regulatory risk", "Power costs", "Global competition"], "opportunities": ["Infrastructure push", "Defense sector", "Metro rail", "Exports", "Green steel"], "threats": ["Chinese oversupply", "Environmental regs", "Carbon tax", "Power shortages", "Export duties"]},
    "porters": {"rivalry": 3, "rivalry_detail": "Oligopolistic with large players", "threat_new": 2, "threat_new_detail": "High capital and environmental barriers", "threat_sub": 3, "threat_sub_detail": "Aluminum composites as substitutes", "bargaining_buyer": 3, "bargaining_buyer_detail": "OEMs have some leverage", "bargaining_supplier": 2, "bargaining_supplier_detail": "Few iron ore suppliers"},
    "management": {"score": 3.5, "promoter_skin": 4, "promoter_detail": "Promoter-driven with deep sector knowledge", "exec_quality": 3, "exec_detail": "Operations-focused management", "capital_allocation": 3, "capital_detail": "Capex-heavy with Cycles", "esg_score": 45, "esg_detail": "Environmental challenges - improving"},
    "competitive": {"market_share": "Top 3 in India", "position": "Leader", "advantages": ["Captive mines", "Rail connectivity", "Scale", "Low-cost iron ore"], "vs_peers": {"strength": "Cost leadership", "weakness": "Carbon intensity"}}
}

# Energy
_FALLBACK["Energy"] = {
    "moat": {"label": "Wide Moat", "overall_score": 4.5, "scores": {"network_effects": 3, "switching_costs": 5, "cost_advantage": 5, "intangible_assets": 4, "efficient_scale": 5}, "description": "Monopoly/oligopoly distribution networks create unbeatable advantages. Subsidy and regulatory capture protect market share.", "risk": "Renewable disruption and transition risks."},
    "landscape": {"market_size": "₹25 Lakh Cr", "growth_rate": "6–10% CAGR", "penetration": "100% electrification target", "key_drivers": ["EV adoption", "Data centers", "Manufacturing", "Rural electrification"], "risks": ["Renewable shift", "Regulatory tariffs", "Fuel availability", "Circular economy"], "tailwinds": ["Green targets", "PLI manufacturing", "Data center boom", "Export potential"]},
    "catalysts": [{"catalyst": "EV charging infra", "impact": "High", "timeline": "3-7 years", "detail": "EV penetration creates new demand."}, {"catalyst": "Data center boom", "impact": "High", "timeline": "3-5 years", "detail": "Hyperscalers expanding India presence."}, {"catalyst": "Renewable integration", "impact": "Medium", "timeline": "5-10 years", "detail": "Grid modernization requires investment."}, {"catalyst": "Discom privatization", "impact": "Medium", "timeline": "3-5 years", "detail": "Privatized discoms improve efficiency."}],
    "swot": {"strengths": ["Natural monopoly", "Regulatory moat", "Cash flow", "Distribution network", "Cross-subsidy"], "weaknesses": ["AT&T losses", "Renewable transition", "Regulatory delays", "Debt burden", "Labor unions"], "opportunities": ["Renewable integration", "Smart meters", "Data centers", "EV charging", "Discom M&A"], "threats": ["Renewables", "Storage tech", "Regulatory changes", "Distributed generation", "Climate policy"]},
    "porters": {"rivalry": 2, "rivalry_detail": "Regulated monopoly/oligopoly", "threat_new": 1, "threat_new_detail": "High regulatory barriers prevent entry", "threat_sub": 4, "threat_sub_detail": "renewables are substitutes", "bargaining_buyer": 2, "bargaining_buyer_detail": "Consumers have little power", "bargaining_supplier": 3, "bargaining_supplier_detail": "Fuel suppliers are limited"},
    "management": {"score": 3, "promoter_skin": 3, "promoter_detail": "Government ownership limits alignment", "exec_quality": 3, "exec_detail": "Bureaucratic decision-making", "capital_allocation": 2, "capital_detail": "Regulatory constraints limit flexibility", "esg_score": 55, "esg_detail": "Environmental transition risk"},
    "competitive": {"market_share": "Regional monopoly", "position": "Leader", "advantages": ["Monopolyfranchise", "Cash flow", "Regulatory capture", "Land bank"], "vs_peers": {"strength": "Territory control", "weakness": "Renewable exposure"}}
}

# Real Estate
_FALLBACK["Real Estate"] = {
    "moat": {"label": "Narrow Moat", "overall_score": 2.8, "scores": {"network_effects": 2, "switching_costs": 3, "cost_advantage": 2, "intangible_assets": 4, "efficient_scale": 3}, "description": "Land bank and brand credibility create competitive advantages. Execution track record matters for pre-sales.", "risk": "Regulatory changes and economic downturns can destroy demand."},
    "landscape": {"market_size": "₹65 Lakh Cr", "growth_rate": "10–15% CAGR", "penetration": "Urban housing shortage 19M units", "key_drivers": ["Urbanization", "Mortgage penetration", "NRI investments", "Co-working/ living"], "risks": ["Interest rates", "Regulatory delays", "Construction costs", "Liquidity crunch"], "tailwinds": ["PM Awas", "RERA clarity", "Smart cities", "REITs"]},
    "catalysts": [{"catalyst": "PM Awas Yojana", "impact": "High", "timeline": "3-7 years", "detail": "Affordable housing gets subsidy push."}, {"catalyst": "Mortgage penetration", "impact": "High", "timeline": "5-10 years", "detail": "From 8% to 20% credit-to-GDP."}, {"catalyst": "REIT listing", "impact": "Medium", "timeline": "2-4 years", "detail": "REITs unlock land bank value."}, {"catalyst": "Grade A consolidation", "impact": "Medium", "timeline": "3-5 years", "detail": "Large players acquire smaller ones."}],
    "swot": {"strengths": ["Land bank", "Brand recognition", "Execution capability", "Financial engineering", "Distribution"], "weaknesses": ["High debt", "Cyclical exposure", "Construction delays", "Regulatory risk", "Land acquisition"], "opportunities": ["Affordable housing", "Grade A office", "Warehousing", "Co-living", "Tier 2/3 cities"], "threats": ["Interest rates", "RERA competition", "Economic slowdown", "Input costs", "Liquidity stress"]},
    "porters": {"rivalry": 4, "rivalry_detail": "Fragmented with thousands of builders", "threat_new": 3, "threat_new_detail": "Low barriers but capital intensive", "threat_sub": 3, "threat_sub_detail": "Rental market is substitute", "bargaining_buyer": 4, "bargaining_buyer_detail": "Homebuyers have information asymmetry", "bargaining_supplier": 2, "bargaining_supplier_detail": "Land owners are numerous"},
    "management": {"score": 3, "promoter_skin": 4, "promoter_detail": "Promoter-driven with equity at stake", "exec_quality": 3, "exec_detail": "Execution varies by company", "capital_allocation": 3, "capital_detail": "Land acquisition track record", "esg_score": 50, "esg_detail": "Moderate - carbon in operations"},
    "competitive": {"market_share": "Top 10 in India", "position": "Leader", "advantages": ["Land bank", "Brand", "Execution", "Access to capital"], "vs_peers": {"strength": "Execution track record", "weakness": "Debt levels"}}
}

# Automobiles
_FALLBACK["Automobiles"] = {
    "moat": {"label": "Wide Moat", "overall_score": 3.8, "scores": {"network_effects": 3, "switching_costs": 4, "cost_advantage": 4, "intangible_assets": 4, "efficient_scale": 4}, "description": "Manufacturing scale, dealer network, and brand trust create durable advantages. Supply chain integration amplifies cost benefits.", "risk": "EV disruption and policy shifts can rapidly change competitive dynamics."},
    "landscape": {"market_size": "₹7.5 Lakh Cr auto", "growth_rate": "8–12% CAGR", "penetration": "India per-capita 25 cars vs US 900", "key_drivers": ["EV transition", "Premiumization", "Rural income", "Export"], "risks": ["EV disruption", "Interest rates", "Fuel prices", "Regulatory BSVI"], "tailwinds": ["PLI scheme", "China+1", "Export potential", "Shared mobility"]},
    "catalysts": [{"catalyst": "EV transition", "impact": "High", "timeline": "5-10 years", "detail": "30% EV target by 2030."}, {"catalyst": "Export scale-up", "impact": "High", "timeline": "3-7 years", "detail": "India becomes export hub."}, {"catalyst": "Premiumization", "impact": "Medium", "timeline": "5-10 years", "detail": "Rising incomes drive SUV/UV demand."}, {"catalyst": "Shared mobility", "impact": "Medium", "timeline": "3-5 years", "detail": "Fleet sales to aggregators."}],
    "swot": {"strengths": ["Manufacturing scale", "Dealer network", "Brand trust", "Supply chain", "Cost efficiency"], "weaknesses": ["EV playbook", "High capex", "Technology gap", "Vendor dependency", "Margin pressure"], "opportunities": ["EV leadership", "Export markets", "Premium SUV", "Rural expansion", "Connected cars"], "threats": ["Chinese EVs", "Tesla entry", "Battery costs", "Policy uncertainty", "Ride-sharing"]},
    "porters": {"rivalry": 4, "rivalry_detail": "Oligopoly with 5-6 major players", "threat_new": 2, "threat_new_detail": "High capex deters new entrants", "threat_sub": 5, "threat_sub_detail": "Public transport and ride-sharing", "bargaining_buyer": 3, "bargaining_buyer_detail": "Fleet buyers have power", "bargaining_supplier": 3, "bargaining_supplier_detail": "Tier 1 vendors are consolidated"},
    "management": {"score": 4, "promoter_skin": 4, "promoter_detail": "Promoter families with long-term view", "exec_quality": 4, "exec_detail": "Experienced automotive executives", "capital_allocation": 4, "capital_detail": "Capex for EV transition", "esg_score": 60, "esg_detail": "ESG improving with EV roadmap"},
    "competitive": {"market_share": "Top 3 in segments", "position": "Leader", "advantages": ["Scale", "Dealer network", "Brand", "Cost efficiency"], "vs_peers": {"strength": "Market share", "weakness": "EV readiness"}}
}


# ─────────────────────────────────────────────────────────────────────────────
# MAIN FUNCTION
# ─────────────────────────────────────────────────────────────────────────────
def get_strategic_analysis(symbol: str, extra_data: dict = None) -> dict:
    """
    extra_data can contain: peers, promoter_pct, roe, de, etc.
    """
    symbol = symbol.upper()
    
    # Check cache
    cached = _read_cache(symbol)
    if cached:
        return cached
    
    # Gather data
    try:
        _, ticker_sym = resolve_ticker(symbol)
        import yfinance as yf
        info = yf.Ticker(ticker_sym).info
        
        sector = info.get("sector", "")
        industry = info.get("industry", "")
        company = info.get("longName") or info.get("shortName") or symbol
        description = info.get("longBusinessSummary") or f"{company} listed on NSE."
        market_cap = info.get("marketCap")
        revenue = info.get("totalRevenue")
        employees = info.get("fullTimeEmployees")
        website = info.get("website", "")
        
        # Extract extra data if provided
        peers = extra_data.get("peers", []) if extra_data else []
        promoter_pct = extra_data.get("promoter_pct") if extra_data else None
        roe = info.get("returnOnEquity")
        de = info.get("debtToEquity")
        
    except:
        sector = industry = company = symbol
        description = f"{symbol} is a listed Indian company."
        market_cap = revenue = employees = None
        website = ""
        peers = []
        promoter_pct = None
        roe = None
        de = None
    
    # Sector mapping
    if not sector:
        _MAP = {
            **{k: "Financial Services" for k in ["HDFCBANK","ICICIBANK","SBIN","AXISBANK","KOTAKBANK","INDUSIND","BAJFINANCE","MUTHOOTFIN","BANDHANBANK","IDFCFIRSTB","FEDERALBANK","RBLBANK","AUBANK","YESBANK","PNB","UNIONBANK"]},
            **{k: "Technology" for k in ["TCS","INFY","WIPRO","HCLTECH","TECHM","LTIM","MPHASIS","PERSISTENT","LTIINDUSTRIES","COFORGE","SONATA","ZENSARTECH","AFFLE"]},
            **{k: "Consumer Cyclical" for k in ["MARUTI","TATAMOTORS","M&M","BAJAJ-AUTO","HEROMOTOCO","ZOMATO","DMART","EICHERMOT","ASHOKLEY","TATASTEEL","JSWSTEEL","VEDL","HINDALCO","NATIONALUM","COALINDIA","ADANIENT","ADANIPOWER"]},
            **{k: "Consumer Defensive" for k in ["HINDUNILVR","ITC","NESTLEIND","BRITANNIA","DABUR","MARICO","GODREJCP","COLGATE","DETERGENT","WIPROCONS","BATAINDIA","Titan","TCNS","SHEELA"]},
            **{k: "Healthcare" for k in ["SUNPHARMA","DRREDDY","CIPLA","DIVISLAB","APLLTD","CAPPL","GLAND","TORNTPHARM","GLS","LAXMAN","AJANTPHARM","MERCK","LUPIN","BIOCON","FIVEPL","STRIDES","PANACEA"]},
            **{k: "Metals & Mining" for k in ["TATASTEEL","JSWSTEEL","SAIL","VEDL","HINDALCO","NATIONALUM","COALINDIA","NMDC","ADANIENT","RATHISTEEL","WELSPUN","JSPL","AKSTEEL","CENTURYEXT","TITANIA","MMTC"]},
            **{k: "Energy" for k in ["RELIANCE","BPCL","HPCL","IOC","ONGC","GAIL","OIL","PETRONET","IGX","GUJGAS","GASGLOW","ADANIGAS","MPGAS","SABARIVAS","PNCINFRA","KOGAS"]},
            **{k: "Real Estate" for k in ["DLF","GODREJPROP","PRESTIGE","OBEROI","BRIGADE","SOBHA","PHOENIXLTD","RUNWAY","KAILASH","SHANKARA","GUTS","PRIMELIFE","ASHIANA","BOHRA","SETU","AIPL"]},
            **{k: "Automobiles" for k in ["MARUTI","TATAMOTORS","M&M","BAJAJ-AUTO","HEROMOTOCO","EICHERMOT","ASHOKLEY","FORCEMOT","CEAT","APOLLOTYRE","MRF","BANDHAN","SHREE","JKTYRE","ALOKIN","BALKRISHNA","TATASTEEL","TATAMOTORS","AUTOCORP"]},
        }
        sector = _MAP.get(symbol, "")
    
    # Try Groq
    ai_result = None
    try:
        ai_result = _call_groq(symbol, company, sector, industry, description,
                               market_cap, revenue, employees, peers, promoter_pct, roe, de)
    except ValueError:
        pass
    except Exception as e:
        print(f"[Strategic] Groq error: {e}")
    
    # Build response
    if ai_result:
        moat = ai_result["moat"]
        landscape = ai_result["landscape"]
        catalysts = ai_result["catalysts"]
        swot = ai_result.get("swot", _DEFAULT["swot"])
        porters = ai_result.get("porters", _DEFAULT["porters"])
        mgmt = ai_result.get("management", _DEFAULT["management"])
        comp = ai_result.get("competitive", _DEFAULT["competitive"])
        source = "groq"
    else:
        tmpl = _FALLBACK.get(sector, _DEFAULT)
        
        # Add random variation
        random.seed(sum(ord(c) for c in symbol))
        base = tmpl["moat"]["scores"]
        varied = {k: min(5, max(1, v + random.randint(-1, 1))) for k, v in base.items()}
        overall = round(sum(varied.values()) / len(varied), 1)
        
        moat = {**tmpl["moat"], "scores": varied, "overall_score": overall,
                "label": "Wide Moat" if overall >= 4 else "Narrow Moat" if overall >= 2.5 else "No Moat"}
        landscape = tmpl["landscape"]
        catalysts = tmpl["catalysts"]
        swot = tmpl.get("swot", _DEFAULT["swot"])
        porters = tmpl.get("porters", _DEFAULT["porters"])
        mgmt = tmpl.get("management", _DEFAULT["management"])
        comp = tmpl.get("competitive", _DEFAULT["competitive"])
        source = "template"
    
    result = {
        "symbol": symbol,
        "company": company,
        "sector": sector or "—",
        "industry": industry or "—",
        "description": description[:700],
        "market_cap": market_cap,
        "revenue": revenue,
        "employees": employees,
        "website": website,
        "source": source,
        "moat": moat,
        "landscape": landscape,
        "catalysts": catalysts,
        "swot": swot,
        "porters": porters,
        "management": mgmt,
        "competitive": comp,
    }
    
    _write_cache(symbol, result)
    return result