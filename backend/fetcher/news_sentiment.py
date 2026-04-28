"""
News & Sentiment Fetcher
Sources: Yahoo Finance news (yfinance), Google News RSS, NSE RSS
Sentiment scoring via keyword analysis — no paid APIs needed.
"""

import feedparser
import requests
from datetime import datetime
from bs4 import BeautifulSoup
import re

HEADERS = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}

POSITIVE = ["profit","growth","revenue","expansion","order","win","record","partnership",
            "approval","launch","dividend","buyback","acquisition","capacity","upgrade",
            "positive","strong","beat","exceed","outperform","surpass","milestone",
            "contract","export","margin","gains","recovery","bullish","investment","raise"]
NEGATIVE = ["loss","decline","declines","declining","fall","falls","drop","drops","debt","default","fraud","penalty","notice",
            "sebi","raid","investigation","legal","lawsuit","downgrade","sell","exit",
            "resign","weak","concern","risk","warning","miss","below","cut","fine",
            "ban","suspension","probe","allegation","shortfall","delay","cancel",
            "slow","slows","slowing","slowdown","pressure","compression","erosion"]
STRONG_NEG = {"fraud","sebi","raid","arrest","default","ban","suspension","probe","allegation","scam"}
STRONG_POS = {"record","milestone","beat","upgrade","dividend","buyback","order win"}


def _clean(text):
    if not text: return ""
    text = BeautifulSoup(text, "html.parser").get_text()
    return re.sub(r'\s+', ' ', text).strip()[:400]


def score_sentiment(text):
    t = text.lower()
    pos = sum(1 for w in POSITIVE if w in t)
    neg = sum(1 for w in NEGATIVE if w in t)
    strong_neg = any(w in t for w in STRONG_NEG)
    strong_pos = any(w in t for w in STRONG_POS)

    if strong_neg:
        score, label = -2, "Very Negative"
    elif strong_pos and pos > neg:
        score, label = 2, "Very Positive"
    elif pos > neg + 1:
        score, label = 1, "Positive"
    elif neg > pos + 1:
        score, label = -1, "Negative"
    else:
        score, label = 0, "Neutral"

    return {
        "score": score, "label": label,
        "posKeywords": [w for w in POSITIVE if w in t][:3],
        "negKeywords": [w for w in NEGATIVE if w in t][:3],
    }


def fetch_yfinance_news(ticker_obj):
    arts = []
    try:
        for item in (ticker_obj.news or [])[:12]:
            title = item.get("title", "")
            summary = _clean(item.get("summary", ""))
            ts = item.get("providerPublishTime", 0)
            pub = datetime.fromtimestamp(ts).strftime("%d %b %Y") if ts else ""
            if title:
                arts.append({"title": title[:120], "summary": summary[:200],
                             "url": item.get("link",""), "source": item.get("publisher","News"),
                             "published": pub, "sentiment": score_sentiment(title+" "+summary)})
    except Exception:
        pass
    return arts


def fetch_google_news(symbol, company_name=""):
    arts = []
    clean = symbol.replace(".NS","").replace(".BO","")
    queries = [f"{clean} NSE stock India", company_name[:25] if company_name else clean]
    for q in queries:
        try:
            url = f"https://news.google.com/rss/search?q={requests.utils.quote(q)}&hl=en-IN&gl=IN&ceid=IN:en"
            feed = feedparser.parse(url)
            for e in feed.entries[:8]:
                title = _clean(e.get("title",""))
                summary = _clean(e.get("summary",""))
                pub = e.get("published","")
                if title:
                    arts.append({"title": title[:120], "summary": summary[:200],
                                 "url": e.get("link",""), "source": "Google News",
                                 "published": pub, "sentiment": score_sentiment(title+" "+summary)})
        except Exception:
            pass
        if len(arts) >= 6: break
    return arts[:8]


def fetch_all_news(symbol, company_name="", ticker_obj=None):
    arts = []
    if ticker_obj:
        arts.extend(fetch_yfinance_news(ticker_obj))
    if len(arts) < 8:
        arts.extend(fetch_google_news(symbol, company_name))

    # Deduplicate
    seen, unique = set(), []
    for a in arts:
        k = a["title"][:40].lower()
        if k not in seen:
            seen.add(k); unique.append(a)
    unique = unique[:15]

    scores = [a["sentiment"]["score"] for a in unique]
    avg = sum(scores)/len(scores) if scores else 0
    pos = sum(1 for s in scores if s > 0)
    neg = sum(1 for s in scores if s < 0)

    overall = "Very Positive" if avg >= 1 else "Positive" if avg >= 0.3 else \
              "Very Negative" if avg <= -1 else "Negative" if avg <= -0.3 else "Neutral"

    return {
        "articles": unique,
        "sentiment": {"overall": overall, "score": round(avg,2),
                      "positive": pos, "negative": neg,
                      "neutral": len(scores)-pos-neg, "total": len(scores)},
        "fetchedAt": datetime.now().isoformat(),
    }


def aggregate_sentiment(articles):
    """Compute aggregate sentiment from a list of articles."""
    if not articles:
        return {"overall":"Neutral","score":0,"positive":0,"negative":0,"neutral":0,"total":0}
    scores = [a["sentiment"]["score"] for a in articles if "sentiment" in a]
    avg = sum(scores)/len(scores) if scores else 0
    pos = sum(1 for s in scores if s > 0)
    neg = sum(1 for s in scores if s < 0)
    neu = len(scores) - pos - neg
    overall = "Very Positive" if avg>=1 else "Positive" if avg>=0.3 else \
              "Very Negative" if avg<=-1 else "Negative" if avg<=-0.3 else "Neutral"
    return {"overall":overall,"score":round(avg,2),"positive":pos,"negative":neg,"neutral":neu,"total":len(scores)}
