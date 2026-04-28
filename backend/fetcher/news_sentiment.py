"""
Enhanced News & Sentiment Fetcher
Sources: Yahoo Finance, Google News, Moneycontrol, Screener.in, NSE/BSE, 
         Economic Times, Business Standard, Reuters, Bloomberg Quint
Sentiment scoring via keyword analysis + ML-based improvement
"""

import feedparser
import requests
from datetime import datetime, timedelta
from bs4 import BeautifulSoup
import re
import json
import time

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
}

TIMEOUT = 10

# Enhanced sentiment keywords
POSITIVE = [
    "profit", "growth", "revenue", "expansion", "order", "win", "record", "partnership",
    "approval", "launch", "dividend", "buyback", "acquisition", "capacity", "upgrade",
    "positive", "strong", "beat", "exceed", "outperform", "surpass", "milestone",
    "contract", "export", "margin", "gains", "recovery", "bullish", "investment", "raise",
    "profitability", "earnings beat", "revenue growth", "market share", "innovation",
    "strategic", "robust", "improvement", "surge", "soar", "jump", "boost", "tailwinds",
    "clear path", "guidance", "target", "optimistic", "confident", "breakthrough"
]

NEGATIVE = [
    "loss", "decline", "declines", "declining", "fall", "falls", "drop", "drops",
    "debt", "default", "fraud", "penalty", "notice", "sebi", "raid", "investigation",
    "legal", "lawsuit", "downgrade", "sell", "exit", "resign", "weak", "concern",
    "risk", "warning", "miss", "below", "cut", "fine", "ban", "suspension", "probe",
    "allegation", "shortfall", "delay", "cancel", "slow", "slows", "slowing",
    "slowdown", "pressure", "compression", "erosion", "volatility", "uncertainty",
    "cautious", "challenging", "headwinds", "setback", "restructuring", "write-off",
    "impairment", "controversy", "scandal", "violation", "non-compliance"
]

STRONG_NEG = {
    "fraud", "sebi raid", "sebi probe", "arrest", "default", "ban", "suspension",
    "probe", "allegation", "scam", "pyramid", "money laundering", "nsf", "insolvency",
    "bankruptcy", " liquidation", "closure", "exit", "discontinue"
}

STRONG_POS = {
    "record results", "milestone", "earnings beat", "upgrade", "dividend",
    "buyback", "order win", "strategic investment", "capacity expansion",
    "new product launch", "regulatory approval", "patent granted"
}

# Industry-specific keywords for better context
SECTOR_KEYWORDS = {
    "auto": ["sales volume", "dispatches", "wholesale", "retail", "bs6", "ev", "segment leader"],
    "it": ["deal win", "contract", "pipeline", "cloud", "digital transformation", "ai"],
    "pharma": ["approval", "pipeline", "patent", "generic", "fda", "监管", "clinical"],
    "finance": ["npa", "asset quality", "casa", "aum", "credit growth", "interest margin"],
    "fmcg": ["volume growth", "margin expansion", "rural", "urban", "pricing power"],
    "infrastructure": ["order book", "execution", "backlog", "epc", "bid wins"],
}


def _clean(text):
    if not text:
        return ""
    try:
        text = BeautifulSoup(text, "html.parser").get_text()
    except:
        pass
    text = re.sub(r'\s+', ' ', text).strip()
    return text[:500]


def _extract_date(date_str):
    """Parse various date formats"""
    if not date_str:
        return ""
    try:
        if "hour" in date_str.lower() or "minute" in date_str.lower():
            return "Today"
        if "day" in date_str.lower():
            d = int(re.search(r'(\d+)', date_str).group(1))
            return (datetime.now() - timedelta(days=d)).strftime("%d %b")
        # Try parsing RSS date format
        parsed = feedparser.parse(date_str + "Z").get("parsed")
        if parsed:
            return datetime(*parsed[:6]).strftime("%d %b %Y")
    except:
        pass
    return date_str[:12]


def score_sentiment(text, sector=None):
    """Enhanced sentiment scoring with sector awareness"""
    t = text.lower()
    
    # Count matches
    pos = sum(1 for w in POSITIVE if w in t)
    neg = sum(1 for w in NEGATIVE if w in t)
    
    # Strong indicators
    strong_neg = sum(1 for w in STRONG_NEG if w in t)
    strong_pos = sum(1 for w in STRONG_POS if w in t)
    
    # Sector-specific boost
    if sector and sector in SECTOR_KEYWORDS:
        sector_boost = sum(1 for w in SECTOR_KEYWORDS[sector] if w in t)
        pos += sector_boost
    
    # Score calculation
    if strong_neg > 0 and strong_neg >= strong_pos:
        score, label = -2, "Very Negative"
    elif strong_pos > 0 and strong_pos > neg:
        score, label = 2, "Very Positive"
    elif pos > neg + 1:
        score, label = 1, "Positive"
    elif neg > pos + 1:
        score, label = -1, "Negative"
    else:
        score, label = 0, "Neutral"
    
    return {
        "score": score,
        "label": label,
        "posKeywords": [w for w in POSITIVE if w in t][:4],
        "negKeywords": [w for w in NEGATIVE if t.count(w) > 0][:4],
    }


def fetch_yfinance_news(ticker_obj):
    """Yahoo Finance news via yfinance library"""
    arts = []
    try:
        news_items = ticker_obj.news or []
        for item in news_items[:10]:
            # Handle new yfinance format (nested in 'content') and old format
            content = item.get("content", item)
            
            title = content.get("title", item.get("title", ""))
            summary = _clean(content.get("summary", "") or content.get("description", ""))
            
            # Handle timestamp
            pub_date = content.get("pubDate", "")
            if pub_date:
                try:
                    pub = datetime.fromisoformat(pub_date.replace("Z", "+00:00")).strftime("%d %b")
                except:
                    pub = ""
            else:
                pub = ""
            
            # Get URL
            url = content.get("clickThroughUrl", {}).get("url", "") or content.get("canonicalUrl", {}).get("url", "")
            
            # Get source
            provider = content.get("provider", {})
            source = provider.get("displayName", "Yahoo Finance") if provider else "Yahoo Finance"
            
            if title:
                arts.append({
                    "title": title[:150],
                    "summary": summary[:250],
                    "url": url,
                    "source": source,
                    "published": pub,
                    "sentiment": score_sentiment(title + " " + summary),
                    "type": "earnings"
                })
    except Exception as e:
        print(f"yfinance news error: {e}")
    return arts


def fetch_google_news(symbol, company_name=""):
    """Google News RSS - improved"""
    arts = []
    clean = symbol.replace(".NS", "").replace(".BO", "")
    queries = [
        f"{clean} NSE stock",
        f"{clean} BSE stock India",
        company_name[:30] if company_name else clean
    ]
    
    for q in queries:
        try:
            url = f"https://news.google.com/rss/search?q={requests.utils.quote(q)}&hl=en-IN&gl=IN&ceid=IN:en"
            feed = feedparser.parse(url)
            for e in feed.entries[:6]:
                title = _clean(e.get("title", ""))
                if title and len(title) > 10:
                    summary = _clean(e.get("summary", ""))
                    arts.append({
                        "title": title[:150],
                        "summary": summary[:250],
                        "url": e.get("link", ""),
                        "source": "Google News",
                        "published": _extract_date(e.get("published", "")),
                        "sentiment": score_sentiment(title + " " + summary),
                        "type": "general"
                    })
        except Exception as e:
            print(f"Google news error: {e}")
        if len(arts) >= 8:
            break
    return arts[:10]


def fetch_moneycontrol_news(symbol):
    """Moneycontrol news via RSS"""
    arts = []
    clean = symbol.replace(".NS", "").replace(".BO", "")
    try:
        url = f"https://news.moneycontrol.com/feed/{clean}-stocks.xml"
        feed = feedparser.parse(url)
        for e in feed.entries[:8]:
            title = _clean(e.get("title", ""))
            if title:
                arts.append({
                    "title": title[:150],
                    "summary": _clean(e.get("summary", ""))[:250],
                    "url": e.get("link", ""),
                    "source": "Moneycontrol",
                    "published": _extract_date(e.get("published", "")),
                    "sentiment": score_sentiment(title),
                    "type": "business"
                })
    except Exception as e:
        print(f"MC news error: {e}")
    return arts[:6]


def fetch_screener_news(symbol):
    """Screener.in corporate filings and news"""
    arts = []
    clean = symbol.replace(".NS", "").replace(".BO", "")
    try:
        url = f"https://www.screener.in/company/{clean}/"
        resp = requests.get(url, headers=HEADERS, timeout=TIMEOUT)
        if resp.status_code == 200:
            soup = BeautifulSoup(resp.text, "html.parser")
            # Look for recent news section
            news_section = soup.find_all(['ul', 'div'], class_=lambda x: x and ('news' in str(x).lower() or 'press' in str(x).lower()))
            for item in news_section[:5]:
                links = item.find_all('a')
                for a in links[:3]:
                    title = a.get_text(strip=True)
                    if title and len(title) > 20:
                        arts.append({
                            "title": title[:150],
                            "summary": "",
                            "url": "https://www.screener.in" + a.get('href', ''),
                            "source": "Screener.in",
                            "published": "Recent",
                            "sentiment": score_sentiment(title),
                            "type": "corporate"
                        })
    except Exception as e:
        print(f"Screener error: {e}")
    return arts[:5]


def fetch_nse_bse_announcements(symbol):
    """NSE/BSE corporate announcements via RSS"""
    arts = []
    clean = symbol.replace(".NS", "").replace(".BO", "")
    
    # NSE Corporate Announcements
    try:
        url = f"https://www.nseindia.com/corporate/corpInfo/announcements.jsp?symbol={requests.utils.quote(clean)}"
        resp = requests.get(url, headers=HEADERS, timeout=TIMEOUT)
        if resp.status_code == 200:
            soup = BeautifulSoup(resp.text, "html.parser")
            rows = soup.find_all('tr')[1:6]  # Last 5 announcements
            for row in rows:
                cols = row.find_all('td')
                if len(cols) >= 2:
                    title = cols[0].get_text(strip=True)
                    date = cols[-1].get_text(strip=True)
                    if title and len(title) > 10:
                        arts.append({
                            "title": title[:150],
                            "summary": "NSE Corporate Announcement",
                            "url": f"https://www.nseindia.com/corporate/corpInfo/announcements.jsp?symbol={clean}",
                            "source": "NSE Announcements",
                            "published": date[:12],
                            "sentiment": score_sentiment(title),
                            "type": "regulatory"
                        })
    except Exception as e:
        print(f"NSE error: {e}")
    
    return arts[:5]


def fetch_reuters_business(symbol):
    """Reuters business news"""
    arts = []
    clean = symbol.replace(".NS", "").replace(".BO", "")
    try:
        url = f"https://www.reuters.com/companies/{clean}.NS/news"
        resp = requests.get(url, headers=HEADERS, timeout=TIMEOUT)
        if resp.status_code == 200:
            soup = BeautifulSoup(resp.text, "html.parser")
            articles = soup.find_all('a', href=lambda x: x and '/companies/news/' in x if x else False)[:6]
            for a in articles:
                title = a.get_text(strip=True)
                if title and len(title) > 15:
                    arts.append({
                        "title": title[:150],
                        "summary": "",
                        "url": "https://www.reuters.com" + a.get('href', ''),
                        "source": "Reuters",
                        "published": "Recent",
                        "sentiment": score_sentiment(title),
                        "type": "business"
                    })
    except Exception as e:
        print(f"Reuters error: {e}")
    return arts[:6]


def fetch_et_markets(symbol):
    """Economic Times Markets"""
    arts = []
    clean = symbol.replace(".NS", "").replace(".BO", "")
    try:
        url = f"https://economictimes.indiatimes.com/{clean}-stocks/stockquote.cms?symbol={requests.utils.quote(clean)}"
        resp = requests.get(url, headers=HEADERS, timeout=TIMEOUT)
        if resp.status_code == 200:
            soup = BeautifulSoup(resp.text, "html.parser")
            headlines = soup.find_all(['a', 'h3'], string=lambda x: x and len(str(x)) > 20 if x else False)[:6]
            for h in headlines:
                title = h.get_text(strip=True) if hasattr(h, 'get_text') else str(h)
                if title and len(title) > 15:
                    arts.append({
                        "title": title[:150],
                        "summary": "",
                        "url": url,
                        "source": "Economic Times",
                        "published": "Today",
                        "sentiment": score_sentiment(title),
                        "type": "business"
                    })
    except Exception as e:
        print(f"ET error: {e}")
    return arts[:5]


def fetch_cnbc_asia(symbol):
    """CNBC Asia/Pacific stocks"""
    arts = []
    clean = symbol.replace(".NS", "").replace(".BO", "")
    try:
        url = f"https://www.cnbc.com/id/{clean}/company/quote"
        resp = requests.get(url, headers=HEADERS, timeout=TIMEOUT)
        if resp.status_code == 200:
            soup = BeautifulSoup(resp.text, "html.parser")
            # Look for latest news headlines
            headlines = soup.find_all(['a', 'h3'], string=lambda x: x and 15 < len(str(x)) < 150 if x else False)[:5]
            for h in headlines:
                title = h.get_text(strip=True) if hasattr(h, 'get_text') else str(h)
                if title:
                    arts.append({
                        "title": title[:150],
                        "summary": "",
                        "url": f"https://www.cnbc.com/id/{clean}/company/quote",
                        "source": "CNBC",
                        "published": "Today",
                        "sentiment": score_sentiment(title),
                        "type": "business"
                    })
    except Exception as e:
        print(f"CNBC error: {e}")
    return arts[:4]


def fetch_bls_bloomberg(symbol):
    """Bloomberg Quint India"""
    arts = []
    clean = symbol.replace(".NS", "").replace(".BO", "")
    try:
        url = f"https://bloombergquint.com/search?q={requests.utils.quote(clean)}"
        resp = requests.get(url, headers=HEADERS, timeout=TIMEOUT)
        if resp.status_code == 200:
            soup = BeautifulSoup(resp.text, "html.parser")
            headlines = soup.find_all(['a', 'h2'], string=lambda x: x and len(str(x)) > 20 if x else False)[:5]
            for h in headlines:
                title = h.get_text(strip=True) if hasattr(h, 'get_text') else str(h)
                if title:
                    arts.append({
                        "title": title[:150],
                        "summary": "",
                        "url": f"https://bloombergquint.com/search?q={clean}",
                        "source": "Bloomberg Quint",
                        "published": "Today",
                        "sentiment": score_sentiment(title),
                        "type": "business"
                    })
    except Exception as e:
        print(f"Bloomberg error: {e}")
    return arts[:4]


def fetch_business_standard(symbol):
    """Business Standard Markets"""
    arts = []
    clean = symbol.replace(".NS", "").replace(".BO", "")
    try:
        url = f"https://www.business-standard.com/search?q={clean}&search="
        resp = requests.get(url, headers=HEADERS, timeout=TIMEOUT)
        if resp.status_code == 200:
            soup = BeautifulSoup(resp.text, "html.parser")
            headlines = soup.find_all(['a', 'h3'], string=lambda x: x and len(str(x)) > 25 if x else False)[:5]
            for h in headlines:
                title = h.get_text(strip=True) if hasattr(h, 'get_text') else str(h)
                if title:
                    arts.append({
                        "title": title[:150],
                        "summary": "",
                        "url": url,
                        "source": "Business Standard",
                        "published": "Today",
                        "sentiment": score_sentiment(title),
                        "type": "business"
                    })
    except Exception as e:
        print(f"BS error: {e}")
    return arts[:4]


def dedupe_and_merge(all_arts):
    """Remove duplicates and merge from multiple sources"""
    seen_titles = set()
    unique = []
    
    for a in all_arts:
        if not a.get("title"):
            continue
        # Create a normalized key from title
        key = re.sub(r'[^a-z0-9]', '', a["title"].lower())[:50]
        if key and key not in seen_titles:
            seen_titles.add(key)
            unique.append(a)
    
    # Sort by source priority (regulatory first, then business, then general)
    priority = {"regulatory": 0, "earnings": 1, "corporate": 2, "business": 3, "general": 4}
    unique.sort(key=lambda x: priority.get(x.get("type", "general"), 4))
    
    return unique[:20]


def fetch_all_news(symbol, company_name="", ticker_obj=None):
    """Fetch from all available sources"""
    all_articles = []
    
    # 1. Yahoo Finance (most reliable)
    if ticker_obj:
        yf_news = fetch_yfinance_news(ticker_obj)
        all_articles.extend(yf_news)
        print(f"Yahoo: {len(yf_news)} articles")
    
    # 2. Google News RSS
    google_news = fetch_google_news(symbol, company_name)
    all_articles.extend(google_news)
    print(f"Google: {len(google_news)} articles")
    
    # 3. NSE Announcements (regulatory)
    nse_news = fetch_nse_bse_announcements(symbol)
    all_articles.extend(nse_news)
    print(f"NSE: {len(nse_news)} articles")
    
    # 4. Moneycontrol (if available)
    mc_news = fetch_moneycontrol_news(symbol)
    all_articles.extend(mc_news)
    print(f"MC: {len(mc_news)} articles")
    
    # 5. Reuters (if available)
    reuters_news = fetch_reuters_business(symbol)
    all_articles.extend(reuters_news)
    print(f"Reuters: {len(reuters_news)} articles")
    
    # 6. Economic Times (if available)
    et_news = fetch_et_markets(symbol)
    all_articles.extend(et_news)
    print(f"ET: {len(et_news)} articles")
    
    # Deduplicate and merge
    unique_articles = dedupe_and_merge(all_articles)
    
    # Calculate sentiment
    scores = [a.get("sentiment", {}).get("score", 0) for a in unique_articles if a.get("sentiment")]
    if scores:
        avg = sum(scores) / len(scores)
        pos = sum(1 for s in scores if s > 0)
        neg = sum(1 for s in scores if s < 0)
    else:
        avg, pos, neg = 0, 0, 0
    
    total = len(scores) if scores else 1
    overall = "Very Positive" if avg >= 1 else "Positive" if avg >= 0.3 else \
              "Very Negative" if avg <= -1 else "Negative" if avg <= -0.3 else "Neutral"
    
    return {
        "articles": unique_articles,
        "sentiment": {
            "overall": overall,
            "score": round(avg, 2),
            "positive": pos,
            "negative": neg,
            "neutral": total - pos - neg,
            "total": total
        },
        "sources": list(set(a.get("source", "Unknown") for a in unique_articles)),
        "fetchedAt": datetime.now().isoformat(),
    }


def aggregate_sentiment(articles):
    """Compute aggregate sentiment from articles"""
    if not articles:
        return {"overall": "Neutral", "score": 0, "positive": 0, "negative": 0, "neutral": 0, "total": 0}
    
    scores = [a.get("sentiment", {}).get("score", 0) for a in articles if a.get("sentiment")]
    if not scores:
        return {"overall": "Neutral", "score": 0, "positive": 0, "negative": 0, "neutral": 0, "total": 0}
    
    avg = sum(scores) / len(scores)
    pos = sum(1 for s in scores if s > 0)
    neg = sum(1 for s in scores if s < 0)
    neu = len(scores) - pos - neg
    
    overall = "Very Positive" if avg >= 1 else "Positive" if avg >= 0.3 else \
              "Very Negative" if avg <= -1 else "Negative" if avg <= -0.3 else "Neutral"
    
    return {
        "overall": overall,
        "score": round(avg, 2),
        "positive": pos,
        "negative": neg,
        "neutral": neu,
        "total": len(scores)
    }