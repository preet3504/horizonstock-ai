"""
In-memory cache of all NSE-listed equity symbols.

On server startup, downloads the official EQUITY_L.csv from NSE India,
parses it, and stores a sorted list of {symbol, company_name} dicts.
Provides a fast prefix-search function used by the /api/stocks/search endpoint.
"""

import csv
import io
import asyncio
import logging
from datetime import datetime, timedelta
from typing import Optional

from curl_cffi import requests as cffi_requests

logger = logging.getLogger(__name__)

# How often to re-download the master list (picks up new IPOs)
REFRESH_INTERVAL_HOURS = 24

# NSE endpoints
NSE_PAGE_URL = "https://www.nseindia.com/market-data/securities-available-for-trading"
NSE_CSV_URL = "https://nsearchives.nseindia.com/content/equities/EQUITY_L.csv"

# Browser-like headers required by NSE
_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept": (
        "text/html,application/xhtml+xml,application/xml;"
        "q=0.9,image/avif,image/webp,*/*;q=0.8"
    ),
    "Accept-Language": "en-US,en;q=0.5",
    "Referer": NSE_PAGE_URL,
}


def _download_nse_csv() -> list[dict]:
    """
    Downloads and parses the official NSE EQUITY_L.csv.
    Uses curl_cffi with Chrome TLS impersonation to bypass NSE's anti-bot checks.
    Returns a sorted list of {"symbol": ..., "company_name": ...} dicts.
    """
    session = cffi_requests.Session()

    # Step 1: Visit the page to establish session cookies
    try:
        session.get(NSE_PAGE_URL, headers=_HEADERS, impersonate="chrome", timeout=15)
    except Exception as e:
        logger.warning(f"Failed to fetch NSE landing page for cookies: {e}")
        # Continue anyway — sometimes the CSV endpoint works without cookies

    # Step 2: Download the CSV
    resp = session.get(NSE_CSV_URL, headers=_HEADERS, impersonate="chrome", timeout=30)
    resp.raise_for_status()

    # Step 3: Parse CSV
    stocks = []
    reader = csv.DictReader(io.StringIO(resp.text))

    for row in reader:
        symbol = row.get("SYMBOL", "").strip()
        # The column name in EQUITY_L.csv has a leading space: " NAME OF COMPANY"
        company_name = (
            row.get(" NAME OF COMPANY", "").strip()
            or row.get("NAME OF COMPANY", "").strip()
        )
        if symbol:
            stocks.append({
                "symbol": symbol,
                "company_name": company_name,
            })

    # Sort alphabetically by symbol for consistent results
    stocks.sort(key=lambda s: s["symbol"])
    return stocks


class StockListCache:
    """
    Singleton-style in-memory cache for the NSE stock list.
    """

    def __init__(self):
        self._stocks: list[dict] = []
        self._last_fetched: Optional[datetime] = None
        self._refresh_task: Optional[asyncio.Task] = None

    @property
    def is_loaded(self) -> bool:
        return len(self._stocks) > 0

    @property
    def stock_count(self) -> int:
        return len(self._stocks)

    async def initialize(self):
        """
        Called once on FastAPI startup.
        Downloads the CSV in a thread pool (blocking I/O) and starts the refresh loop.
        """
        await self._fetch()
        # Start background refresh loop
        self._refresh_task = asyncio.create_task(self._refresh_loop())

    async def _fetch(self):
        """Download and parse the CSV in a background thread."""
        loop = asyncio.get_running_loop()
        try:
            stocks = await loop.run_in_executor(None, _download_nse_csv)
            self._stocks = stocks
            self._last_fetched = datetime.now()
            logger.info(
                f"[StockListCache] Loaded {len(stocks)} NSE symbols. "
                f"Last fetched: {self._last_fetched.isoformat()}"
            )
        except Exception as e:
            logger.error(f"[StockListCache] Failed to download NSE stock list: {e}")
            if not self._stocks:
                logger.warning("[StockListCache] Cache is empty — will retry in 5 minutes.")

    async def _refresh_loop(self):
        """Periodically re-download the CSV to pick up new IPOs."""
        while True:
            await asyncio.sleep(REFRESH_INTERVAL_HOURS * 3600)
            logger.info("[StockListCache] Refreshing stock list...")
            await self._fetch()

    def search(self, query: str, limit: int = 10) -> list[dict]:
        """
        Search the cached stock list by prefix.

        Priority:
        1. Symbol starts with query (prefix match) — highest priority
        2. Company name contains query (substring match) — secondary

        Returns at most `limit` results.
        """
        if not query or not query.strip():
            return []

        q = query.strip().upper()
        limit = min(limit, 20)  # Hard cap to prevent abuse

        symbol_matches = []
        name_matches = []

        for stock in self._stocks:
            if stock["symbol"].startswith(q):
                symbol_matches.append(stock)
            elif q.lower() in stock["company_name"].lower():
                name_matches.append(stock)

            # Early exit: if we already have enough symbol matches, stop
            if len(symbol_matches) >= limit:
                break

        # Combine: symbol prefix matches first, then name substring matches
        combined = symbol_matches[:limit]
        remaining = limit - len(combined)
        if remaining > 0:
            combined.extend(name_matches[:remaining])

        return combined


# Module-level singleton instance
stock_cache = StockListCache()
