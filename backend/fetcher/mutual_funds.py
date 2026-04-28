import random
import datetime

def get_mutual_fund_analysis(symbol: str) -> dict:
    """Mock a deep analysis of Mutual Fund and FII activity."""
    symbol = symbol.upper()
    funds = [
        "SBI Small Cap Fund", "HDFC Mid-Cap Opportunities", "Nippon India Growth", 
        "Axis Long Term Equity", "Kotak Emerging Equity", "Mirae Asset Large Cap", 
        "ICICI Prudential Value Discovery", "DSP Midcap Fund", "Parag Parikh Flexi Cap",
        "Canara Robeco Bluechip", "UTI Nifty Index Fund", "Motilal Oswal Nasdaq 100"
    ]
    
    random.seed(sum(ord(c) for c in symbol) + 100)
    
    num_changes = random.randint(4, 9)
    changes = []
    
    current_month = datetime.datetime.now().strftime("%b %Y")
    
    selected_funds = random.sample(funds, num_changes)
    net_shares = 0
    total_val_crs = 0
    
    for f in selected_funds:
        action = random.choice(["Bought", "Sold", "Increased Stake", "Decreased Stake", "New Entry", "Complete Exit"])
        shares = random.randint(10000, 2500000)
        price = round(random.uniform(50, 4500), 2)
        val_crs = round((shares * price) / 10000000, 2)
        
        impact = "Positive" if action in ["Bought", "Increased Stake", "New Entry"] else "Negative"
        
        if impact == "Positive":
            net_shares += shares
            total_val_crs += val_crs
        else:
            net_shares -= shares
            total_val_crs -= val_crs
            
        changes.append({
            "month": current_month,
            "fund": f,
            "action": action,
            "shares": shares,
            "impact": impact,
            "avg_price": price,
            "value_cr": abs(val_crs),
            "pct_of_fund": round(random.uniform(0.1, 5.5), 2)
        })
        
    trend = "Strongly Bullish" if net_shares > 1500000 else "Bullish" if net_shares > 0 else "Bearish" if net_shares > -1500000 else "Strongly Bearish"
    
    # Generate LLM-style insights
    insights = []
    if trend == "Strongly Bullish":
        insights.append(f"Institutional conviction is extremely high. Huge net inflows of {net_shares:,} shares recorded.")
    elif trend == "Strongly Bearish":
        insights.append(f"Institutions are aggressively dumping the stock. Net outflows reached {abs(net_shares):,} shares.")
    
    bulls = [c for c in changes if c['impact'] == 'Positive']
    bears = [c for c in changes if c['impact'] == 'Negative']
    
    if bulls:
        top_bull = max(bulls, key=lambda x: x['shares'])
        if top_bull['action'] == 'New Entry':
            insights.append(f"{top_bull['fund']} initiated a fresh position worth ₹{top_bull['value_cr']} Cr.")
        else:
            insights.append(f"{top_bull['fund']} was the biggest buyer, accumulating {top_bull['shares']:,} shares.")
            
    if bears:
        top_bear = max(bears, key=lambda x: x['shares'])
        if top_bear['action'] == 'Complete Exit':
            insights.append(f"Red flag: {top_bear['fund']} completely liquidated its holding.")
        else:
            insights.append(f"{top_bear['fund']} booked profits/reduced exposure by selling {top_bear['shares']:,} shares.")

    return {
        "symbol": symbol,
        "trend": trend,
        "net_shares_changed": net_shares,
        "net_value_cr": round(total_val_crs, 2),
        "total_funds_active": num_changes,
        "summary": f"During {current_month}, a total of {num_changes} major Asset Management Companies altered their positions in {symbol}, resulting in a net {'inflow' if net_shares > 0 else 'outflow'} of {abs(net_shares):,} shares (approx ₹{abs(round(total_val_crs, 2))} Cr).",
        "insights": insights,
        "changes": sorted(changes, key=lambda x: x['shares'], reverse=True)
    }
