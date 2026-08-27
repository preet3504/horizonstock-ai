import sys
import os
sys.path.insert(0, os.path.abspath('.'))

from app.services.live_market_fetcher import get_top_gainers, filter_by_sma

if __name__ == "__main__":
    print("Fetching top gainers...")
    gainers = get_top_gainers(min_pct_gain=1.0)
    print(f"Found {len(gainers)} top gainers > 1.0%")
    
    if not gainers.empty:
        print("Filtering by SMA 44 and distance 1.0%...")
        filtered = filter_by_sma(gainers, ma_length=44, distance_pct=1.0)
        
        if filtered.empty:
            print("No stocks matched the SMA criteria.")
        else:
            print(f"Matched {len(filtered)} stocks!")
            display_cols = ['symbol', 'lastPrice', 'pChange', 'smaValue', 'smaDistance']
            print(filtered[display_cols].to_string(index=False))
