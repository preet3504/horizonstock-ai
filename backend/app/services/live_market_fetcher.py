import logging
import time
from datetime import datetime, time as dtime
from urllib.parse import quote
from zoneinfo import ZoneInfo

import pandas as pd
import requests
import yfinance as yf

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("live_market_fetcher")

BROWSER_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; rv:109.0) Gecko/20100101 Firefox/118.0"
    ),
    "Accept": "*/*",
    "Accept-Language": "en-US,en;q=0.5",
    "Accept-Encoding": "gzip, deflate",
    "Referer": "https://www.nseindia.com/get-quotes/equity?symbol=HDFCBANK",
}

NSE_LIVE_QUOTE_URL = "https://www.nseindia.com/api/equity-stock-indices?index={index}"
NSE_COOKIE_WARMUP_URL = "https://www.nseindia.com/option-chain"


def _warn_if_market_closed() -> None:
    """NSE cash market trades 09:15-15:30 IST, Mon-Fri."""
    ist_now = datetime.now(ZoneInfo("Asia/Kolkata"))
    is_open = ist_now.weekday() < 5 and dtime(9, 15) <= ist_now.time() <= dtime(15, 30)
    if not is_open:
        log.warning(
            "NSE market appears closed right now (IST: %s). Returned pChange "
            "is from the last completed session, not a live intraday move.",
            ist_now.strftime("%Y-%m-%d %H:%M:%S %a"),
        )


def fetch_live_quotes_via_api(
    index: str = "NIFTY 500", retries: int = 3, backoff: float = 2.0
) -> pd.DataFrame:
    """PRIMARY method for live data — NSE's own live quote endpoint"""
    session = requests.Session()
    session.headers.update(BROWSER_HEADERS)
    url = NSE_LIVE_QUOTE_URL.format(index=quote(index.upper()))

    last_err: Exception | None = None
    for attempt in range(1, retries + 1):
        try:
            session.get(NSE_COOKIE_WARMUP_URL, timeout=10)
            time.sleep(1)

            resp = session.get(url, timeout=10)
            resp.raise_for_status()

            try:
                payload = resp.json()
            except ValueError as e:
                log.error(
                    "200 OK but body isn't valid JSON. Content-Encoding: %s | body preview: %r",
                    resp.headers.get("Content-Encoding"),
                    resp.text[:300],
                )
                raise RuntimeError("Non-JSON response body from live quote endpoint") from e

            rows = payload.get("data", [])
            if not rows:
                raise RuntimeError("Empty 'data' array in live quote response")

            df = pd.DataFrame(rows)
            log.info("Fetched %d live quotes via raw API (attempt %d)", len(df), attempt)
            return df

        except (requests.RequestException, ValueError, RuntimeError) as e:
            last_err = e
            log.warning("Live quote fetch attempt %d/%d failed: %s", attempt, retries, e)
            time.sleep(backoff * attempt)

    raise RuntimeError(f"Live quote fetch failed after {retries} attempts") from last_err


def fetch_live_quotes_via_nse_package(index: str = "NIFTY 500") -> pd.DataFrame:
    """FALLBACK method for live data — using nse package"""
    from nse import NSE  # pip install nse

    with NSE(download_folder="./.nse_cache") as nse:
        payload = nse.listEquityStocksByIndex(index=index)

    rows = payload.get("data", [])
    if not rows:
        raise RuntimeError(f"`nse` package returned no rows for {index}")

    df = pd.DataFrame(rows)
    log.info("Fetched %d live quotes via `nse` package", len(df))
    return df


def get_top_gainers(
    index: str = "NIFTY 500",
    min_pct_gain: float = 5.0,
) -> pd.DataFrame:
    """
    Live top gainers: every stock in `index` currently up more than
    `min_pct_gain`% on the day, sorted highest gain first.
    """
    _warn_if_market_closed()

    try:
        df = fetch_live_quotes_via_api(index)
    except RuntimeError as e:
        log.warning("Raw API path failed (%s) — falling back to `nse` package", e)
        df = fetch_live_quotes_via_nse_package(index)

    if "meta" in df.columns:
        meta = df["meta"]
        df["company_name"] = meta.apply(lambda m: (m or {}).get("companyName"))
        df["industry"] = meta.apply(lambda m: (m or {}).get("industry"))

    required = {"symbol", "pChange", "lastPrice"}
    missing = required - set(df.columns)
    if missing:
        raise RuntimeError(
            f"Live quote response is missing expected fields: {missing}. "
            "NSE may have changed its response shape — inspect df.columns."
        )

    gainers = df[df["pChange"] > min_pct_gain].copy()
    gainers = gainers.sort_values("pChange", ascending=False).reset_index(drop=True)
    display_cols = [
        c
        for c in [
            "symbol",
            "identifier",
            "industry",
            "lastPrice",
            "previousClose",
            "change",
            "pChange",
            "totalTradedVolume",
            "lastUpdateTime",
        ]
        if c in gainers.columns
    ]
    return gainers[display_cols]

def filter_by_sma(gainers_df: pd.DataFrame, ma_length: int = 44, distance_pct: float = 1.0) -> pd.DataFrame:
    if gainers_df.empty:
        return gainers_df

    symbols = gainers_df['symbol'].tolist()
    tickers = [f"{sym}.NS" for sym in symbols]
    
    months = (ma_length // 21) + 2
    period_str = f"{months}mo"
    if months >= 12:
        period_str = f"{max(1, months//12 + 1)}y"
    if months > 120:
        period_str = "max"
        
    try:
        data = yf.download(tickers, period=period_str, progress=False)
        if data.empty or 'Close' not in data:
            return gainers_df
            
        close_data = data['Close']
        sma_data = close_data.rolling(window=ma_length).mean()
        
        sma_map = {}
        if isinstance(close_data, pd.DataFrame):
            latest_sma = sma_data.iloc[-1]
            for ticker, sma_val in latest_sma.items():
                sym = str(ticker).replace('.NS', '')
                sma_map[sym] = float(sma_val) if pd.notna(sma_val) else None
        else:
            latest_sma = sma_data.iloc[-1]
            sma_map[symbols[0]] = float(latest_sma) if pd.notna(latest_sma) else None
                
        gainers_df['smaValue'] = gainers_df['symbol'].map(sma_map)
        gainers_df['smaDistance'] = abs(gainers_df['lastPrice'] - gainers_df['smaValue']) / gainers_df['smaValue'] * 100
        
        # Filter for stocks within distance, or where SMA is not available
        filtered_df = gainers_df[gainers_df['smaDistance'] <= distance_pct].copy()
        return filtered_df.reset_index(drop=True)
    except Exception as e:
        log.error(f"Failed to calculate SMA: {e}")
        return gainers_df

