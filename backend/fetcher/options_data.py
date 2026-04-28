import math
import random
from datetime import datetime, timedelta

def get_option_chain(symbol, current_price):
    """
    Returns a basic option chain for the given symbol.
    Due to NSE scraping limitations, this generates a realistic synthetic option chain 
    based on the current price. It creates strikes +/- 10% around ATM.
    """
    if not current_price or current_price <= 0:
        return {"error": "Invalid price to generate option chain"}
        
    # Determine strike interval based on price
    if current_price < 500:
        interval = 5
    elif current_price < 2000:
        interval = 10
    elif current_price < 5000:
        interval = 50
    else:
        interval = 100
        
    atm_strike = round(current_price / interval) * interval
    
    strikes = []
    # Generate 10 strikes below and 10 strikes above ATM
    for i in range(-10, 11):
        strike = atm_strike + (i * interval)
        if strike <= 0:
            continue
            
        # Distance from ATM
        distance_pct = abs(strike - current_price) / current_price
        
        # IV usually forms a smile (higher out of the money)
        base_iv = 25.0
        iv = base_iv + (distance_pct * 100) + random.uniform(-2, 2)
        
        # Open interest typically peaks near ATM and round numbers
        oi_factor = 1.0 if strike % (interval * 5) != 0 else 2.5
        oi_base = 100000 * math.exp(-distance_pct * 10) * oi_factor
        
        # Call and Put premiums using rough intrinsic + time value
        time_to_expiry_days = 15
        time_factor = math.sqrt(time_to_expiry_days / 365) * strike * (iv / 100) * 0.4
        
        call_intrinsic = max(0, current_price - strike)
        put_intrinsic = max(0, strike - current_price)
        
        call_ltp = call_intrinsic + time_factor
        put_ltp = put_intrinsic + time_factor
        
        call_oi = int(oi_base * random.uniform(0.5, 1.5))
        put_oi = int(oi_base * random.uniform(0.5, 1.5))
        
        # Skew: Puts often have higher OI below ATM, Calls higher OI above ATM
        if strike < current_price:
            put_oi = int(put_oi * 1.5)
        else:
            call_oi = int(call_oi * 1.5)
            
        strikes.append({
            "strike": strike,
            "call_oi": call_oi,
            "call_oi_chg": int(call_oi * random.uniform(-0.1, 0.1)),
            "call_ltp": round(call_ltp, 2),
            "call_iv": round(iv, 2),
            "put_iv": round(iv + random.uniform(-1, 1), 2),
            "put_ltp": round(put_ltp, 2),
            "put_oi_chg": int(put_oi * random.uniform(-0.1, 0.1)),
            "put_oi": put_oi,
        })
        
    expiry_date = datetime.now() + timedelta(days=15)
    
    return {
        "symbol": symbol,
        "current_price": current_price,
        "expiry": expiry_date.strftime("%d %b %Y"),
        "strikes": strikes
    }
