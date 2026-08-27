import sys
import os

# Add backend dir to Python path so we can import app
sys.path.insert(0, os.path.abspath('.'))

from app.services.live_market_fetcher import get_top_gainers
import pandas as pd

if __name__ == "__main__":
    try:
        print("Fetching top gainers with > 3.0% gain...")
        df = get_top_gainers(min_pct_gain=3.0)
        print(df.to_string(index=False))
        print("Success!")
    except Exception as e:
        print(f"Failed: {e}")
