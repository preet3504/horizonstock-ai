import yfinance as yf
import pandas as pd
import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

def fetch_stock_history(symbol: str, exchange: str = "NSE", interval: str = "1d", period: str = "2y") -> List[Dict[str, Any]]:
    """
    Fetches historical stock price data using yfinance.
    
    Args:
        symbol: The stock symbol (e.g., RELIANCE).
        exchange: The exchange (NSE or BSE).
        interval: Data interval (1d, 1wk, 1mo, etc.).
        period: Time period (1mo, 6mo, 1y, 2y, 5y, max).
        
    Returns:
        A list of dictionaries suitable for Lightweight Charts:
        [{"time": "YYYY-MM-DD", "open": O, "high": H, "low": L, "close": C}, ...]
    """
    try:
        # Map exchange to yfinance suffix
        suffix = ".NS" if exchange.upper() == "NSE" else ".BO"
        ticker = f"{symbol}{suffix}"
        
        logger.info(f"Fetching {period} historical data for {ticker} at {interval} interval")
        
        stock = yf.Ticker(ticker)
        df = stock.history(period=period, interval=interval)
        
        if df.empty:
            logger.warning(f"No historical data found for {ticker}")
            return []
            
        # Format the data for Lightweight Charts
        formatted_data = []
        for index, row in df.iterrows():
            # Yfinance returns timezone-aware datetime index, we need just the date string (YYYY-MM-DD)
            # Or a timestamp. Lightweight charts expects date string for daily/weekly, and timestamp for intraday.
            if interval in ["1d", "1wk", "1mo", "3mo"]:
                time_val = index.strftime("%Y-%m-%d")
            else:
                # For intraday (e.g., 1m, 5m, 1h), Lightweight Charts needs UNIX timestamps in seconds
                time_val = int(index.timestamp())
                
            formatted_data.append({
                "time": time_val,
                "open": round(row['Open'], 2),
                "high": round(row['High'], 2),
                "low": round(row['Low'], 2),
                "close": round(row['Close'], 2)
            })
            
        return formatted_data
    except Exception as e:
        logger.error(f"Error fetching historical data for {symbol}: {e}")
        return []
