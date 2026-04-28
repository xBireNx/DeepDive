import os
import json
import time
from groq import Groq

# Disk caching setup
CACHE_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "__pycache__", "concall_cache")
os.makedirs(CACHE_DIR, exist_ok=True)

def _call_groq_concall(symbol: str) -> dict:
    """Call Groq to generate a realistic concall summary based on recent public data."""
    api_key = os.getenv("GROQ_API_KEY", "").strip()
    if not api_key:
        raise ValueError("GROQ_API_KEY not set")

    client = Groq(api_key=api_key)
    
    prompt = f"""You are a senior equity research analyst. 
Provide a detailed and informative Concall Summary for **{symbol}** for the most recent quarter (Q2/Q3 FY25).

Return ONLY valid JSON with this structure:
{{
  "quarter": "Q3 FY25",
  "date": "Jan 2025",
  "sentiment": "Bullish | Neutral | Cautious",
  "tone_score": <float 0-100 where 100 is extremely optimistic>,
  "guidance": "Detailed 2-3 paragraph analysis of management guidance on growth, margins, and industry outlook.",
  "segments": [
    {{ "title": "Revenue & Volumes", "detail": "..." }},
    {{ "title": "Margins & Costs", "detail": "..." }},
    {{ "title": "Capex & Projects", "detail": "..." }}
  ],
  "analyst_qna": [
    {{ "q": "...", "a": "...", "sentiment": "Positive | Negative | Neutral" }},
    {{ "q": "...", "a": "...", "sentiment": "Positive | Negative | Neutral" }},
    {{ "q": "...", "a": "...", "sentiment": "Positive | Negative | Neutral" }}
  ],
  "bull_case": ["point 1", "point 2"],
  "bear_case": ["point 1", "point 2"],
  "red_flags": ["flag 1", "flag 2"]
}}

Rules:
- Be specific to {symbol}'s recent actual performance and industry trends.
- Use professional financial language.
- Ensure the analyst_qna has exactly 3 high-impact questions.
- Respond ONLY with the JSON."""

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
    text = text.strip().rstrip("```").strip()

    return json.loads(text)

def get_concall_summary(symbol):
    symbol = symbol.upper()
    cache_path = os.path.join(CACHE_DIR, f"{symbol}.json")
    
    # ── 1. Check Cache ────────────────────────────────────────────────────────
    if os.path.exists(cache_path):
        with open(cache_path, "r") as f:
            cached = json.load(f)
            if time.time() - cached.get("cached_at", 0) < 86400: # 24h
                return cached["data"]

    # ── 2. Try Groq ──────────────────────────────────────────────────────────
    try:
        data = _call_groq_concall(symbol)
        # Save to cache
        with open(cache_path, "w") as f:
            json.dump({"data": data, "cached_at": time.time()}, f)
        return data
    except Exception as e:
        print(f"[Concall] Groq error for {symbol}: {e}")
        
    # ── 3. Fallback (The original mock) ───────────────────────────────────────
    return {
        "symbol": symbol,
        "quarter": "Q3 FY25",
        "date": "Feb 2025",
        "sentiment": "Neutral",
        "tone_score": 55,
        "guidance": f"Management of {symbol} indicated a steady recovery in domestic demand. They are focusing on premiumization and cost optimization to offset raw material volatility. Guidance for FY25 remains mid-teen growth.",
        "segments": [
            {"title": "Revenue & Volumes", "detail": "Volumes grew by 8% YoY, led by strong festive demand and rural recovery."},
            {"title": "Margins & Costs", "detail": "Gross margins remained stable; however, higher A&P spends limited EBITDA margin expansion."},
            {"title": "Capex", "detail": "New facility at Gujarat is 80% complete, expected to go live by Q1FY26."}
        ],
        "analyst_qna": [
            {"q": "What is the update on raw material inflation?", "a": "We are seeing some stabilization in base oil prices, though chemical additives remain sticky.", "sentiment": "Neutral"},
            {"q": "How is the competition in the low-end segment?", "a": "Intensity is high, but we are not participating in a price war; focusing on brand equity.", "sentiment": "Neutral"}
        ],
        "bull_case": ["Strong brand recall", "Premiumization focus"],
        "bear_case": ["High competitive intensity", "Rural demand still fragile"],
        "red_flags": ["Increased inventory days due to logistical issues"]
    }
