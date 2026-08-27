"""
nse_nifty500_fetcher.py
Fundoscope — NIFTY 500 Universe Fetcher

Fetches the official NIFTY 500 constituent list (the "top 500 NSE stocks"
universe) and normalizes it into the schema Fundoscope's rule engine expects
(see Section 6, Master Data Schema, of the Fundamental Rules Spec).

Two independent methods, PRIMARY + FALLBACK:

  1. PRIMARY   — raw CSV pulled straight from NSE's archive server
                 (nsearchives.nseindia.com). Zero extra dependencies, but
                 NSE blocks bare `requests.get()` calls with a 401/403
                 unless the request looks like it came from a browser
                 session — handled below via a cookie "warm-up" request.

  2. FALLBACK  — the `nse` package (`pip install nse`), which manages
                 NSE's session/cookie handshake and rate limiting for you.
                 Slower per-call but far more resilient — worth using as
                 the primary if you're deploying on a cloud IP (AWS/GCP
                 ranges are sometimes rate-limited/blocked by NSE's WAF
                 even with correct headers).

Both paths converge on the same normalized DataFrame:
    company_name | industry | symbol | series | isin | yf_symbol | sector_classification

Verified against NSE's live archive on 2026-08-25. Endpoint moved from
archives.nseindia.com -> nsearchives.nseindia.com in 2025; if this script
starts failing, that's the first thing to re-check.

LIVE GAINERS — 2026-08-26 fix:
NSE renamed its live quote endpoint from `equity-stockIndices` (camelCase,
what most tutorials still show) to `equity-stock-indices` (hyphenated).
Confirmed against the current source of the `nse` PyPI package. If
get_top_gainers() ever 404s again, re-check that same source first:
https://github.com/BennyThadikaran/NseIndiaApi/blob/main/src/nse/NSE.py

The `nse` package fallback requires `pip install nse` — without it,
fetch_live_quotes_via_nse_package() raises ModuleNotFoundError. It's a
fallback, not a hard requirement, since the raw endpoint above is primary.

Usage:
    python nse_nifty500_fetcher.py                  # full run
    python nse_nifty500_fetcher.py --check-api       # just test the live API
    python nse_nifty500_fetcher.py --min-gain 3      # custom threshold
"""

from __future__ import annotations

import logging
import time
from datetime import datetime, time as dtime
from io import StringIO
from pathlib import Path
from urllib.parse import quote
from zoneinfo import ZoneInfo

import pandas as pd
import requests

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("nifty500_fetcher")

NSE_HOME = "https://www.nseindia.com"
NIFTY500_CSV_URL = "https://nsearchives.nseindia.com/content/indices/ind_nifty500list.csv"

BROWSER_HEADERS = {
    # Mirrors the header set used by the actively-maintained `nse` PyPI
    # package (BennyThadikaran/NseIndiaApi), which is proven to work against
    # NSE's current anti-bot layer as of Jul 2026.
    #
    # Two changes from a "typical browser" header set, both deliberate:
    #   - Accept-Encoding has NO "br" (Brotli). If brotli/brotlicffi isn't
    #     installed locally, requests/urllib3 can silently fail to decode a
    #     Brotli response body, leaving you with an empty string that then
    #     fails resp.json() with "Expecting value: line 1 column 1 (char 0)"
    #     — status 200, empty/garbled body. That's the exact failure mode.
    #   - Accept is "*/*", matching what a real XHR/fetch call to a JSON API
    #     sends — not the HTML-navigation Accept header a full page load
    #     sends, which some bot-detection layers treat as a mismatch signal.
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; rv:109.0) Gecko/20100101 Firefox/118.0"
    ),
    "Accept": "*/*",
    "Accept-Language": "en-US,en;q=0.5",
    "Accept-Encoding": "gzip, deflate",
    "Referer": "https://www.nseindia.com/get-quotes/equity?symbol=HDFCBANK",
}


def fetch_via_csv(retries: int = 3, backoff: float = 2.0) -> pd.DataFrame:
    """
    PRIMARY method — official NIFTY 500 constituent CSV, straight from NSE.

    Columns as published by NSE: Company Name, Industry, Symbol, Series, ISIN Code
    """
    session = requests.Session()
    session.headers.update(BROWSER_HEADERS)

    last_err: Exception | None = None
    for attempt in range(1, retries + 1):
        try:
            # Step 1: warm-up hit on the homepage — this is what sets the
            # cookies (nsit, nseappid, etc.) NSE checks for on the next request.
            session.get(NSE_HOME, timeout=10)
            time.sleep(1)  # be polite, avoid tripping NSE's bot heuristics

            # Step 2: the real request, reusing the warmed-up session/cookies.
            resp = session.get(NIFTY500_CSV_URL, timeout=10)
            resp.raise_for_status()

            df = pd.read_csv(StringIO(resp.text))
            df.columns = [c.strip() for c in df.columns]
            log.info("Fetched %d rows via direct CSV (attempt %d)", len(df), attempt)
            return _normalize_csv(df)

        except (requests.RequestException, pd.errors.ParserError) as e:
            last_err = e
            log.warning("CSV fetch attempt %d/%d failed: %s", attempt, retries, e)
            time.sleep(backoff * attempt)

    raise RuntimeError(f"Direct CSV fetch failed after {retries} attempts") from last_err


def fetch_via_nse_package() -> pd.DataFrame:
    """
    FALLBACK method — the `nse` package (pip install nse). It handles NSE's
    cookie/session handshake and built-in 3 req/sec throttling for you.

    Bonus: the same library also exposes nse.shareholding() (feeds GOV-01),
    nse.actions() (bonus/split flag for BAL-01), and
    nse.financial_results() / nse.results_comparison() (QTR category) —
    worth reusing elsewhere in the Fundoscope data pipeline.
    """
    from nse import NSE  # pip install nse

    with NSE(download_folder="./.nse_cache") as nse:
        payload = nse.listEquityStocksByIndex(index="NIFTY 500")

    rows = payload.get("data", [])
    if not rows:
        raise RuntimeError("`nse` package returned no rows for NIFTY 500")

    df = pd.DataFrame(rows)

    # NSE's live-quote-style response nests company details under `meta`.
    # Field names have shifted between NSE API versions before — if this
    # breaks, print(rows[0]) once to confirm the current shape.
    meta = df.get("meta", pd.Series([{}] * len(df)))
    df["Company Name"] = meta.apply(lambda m: (m or {}).get("companyName"))
    df["Industry"] = meta.apply(lambda m: (m or {}).get("industry"))
    df["ISIN Code"] = meta.apply(lambda m: (m or {}).get("isin"))
    df["Series"] = df.get("series", "EQ")
    df = df.rename(columns={"symbol": "Symbol"})

    log.info("Fetched %d rows via `nse` package", len(df))
    return _normalize_csv(df)


def _normalize_csv(df: pd.DataFrame) -> pd.DataFrame:
    """Map either source's columns onto Fundoscope's canonical schema."""
    rename_map = {
        "Company Name": "company_name",
        "Industry": "industry",
        "Symbol": "symbol",
        "Series": "series",
        "ISIN Code": "isin",
    }
    df = df.rename(columns=rename_map)
    keep = ["company_name", "industry", "symbol", "series", "isin"]
    df = (
        df[[c for c in keep if c in df.columns]]
        .dropna(subset=["symbol"])
        .drop_duplicates("symbol")
        .reset_index(drop=True)
    )
    df["symbol"] = df["symbol"].str.strip()
    df["yf_symbol"] = df["symbol"] + ".NS"  # for yfinance / lightweight-charts OHLCV feed
    df["sector_classification"] = None  # populate downstream via your §4 sector-mapping step
    return df



# ---------------------------------------------------------------------------
# LIVE TOP GAINERS
# ---------------------------------------------------------------------------
# Unlike the constituent list above (static, refreshed twice a year), this
# section hits NSE's *live* quote feed and is meant to be called fresh every
# time — never cache these results.
#
# NOTE (2026-08-26): NSE renamed this endpoint. The old, widely-copied path
# `equity-stockIndices` (camelCase) now 404s. Verified against the current
# source of the actively-maintained `nse` PyPI package (BennyThadikaran/
# NseIndiaApi, updated Jul 2026), which computes the URL as:
#     endpoint = "equity-stock-indices"   # hyphenated, not camelCase
#     f"{base_url}/{endpoint}?index={index.upper()}"
# The cookie warm-up page also changed: the library hits `/option-chain`,
# not the homepage `/` — that's what's used below.

NSE_LIVE_QUOTE_URL = "https://www.nseindia.com/api/equity-stock-indices?index={index}"
NSE_COOKIE_WARMUP_URL = "https://www.nseindia.com/option-chain"


def probe_live_api(index: str = "NIFTY 500", timeout: int = 10) -> bool:
    """
    Standalone health check — confirms the live quote endpoint is reachable
    and returning the expected shape *before* anything else runs. Run this
    on its own first (`python nse_nifty500_fetcher.py --check-api`) any time
    you suspect NSE has changed something, rather than debugging a failure
    three layers deep in get_top_gainers().

    Returns True/False and logs exactly what it found either way.
    """
    session = requests.Session()
    session.headers.update(BROWSER_HEADERS)
    url = NSE_LIVE_QUOTE_URL.format(index=quote(index.upper()))

    try:
        warmup = session.get(NSE_COOKIE_WARMUP_URL, timeout=timeout)
        log.info("Cookie warm-up (%s): HTTP %d", NSE_COOKIE_WARMUP_URL, warmup.status_code)

        resp = session.get(url, timeout=timeout)
        log.info("Live quote endpoint (%s): HTTP %d", url, resp.status_code)

        if resp.status_code == 404:
            log.error(
                "404 — endpoint path itself is wrong/renamed. Check "
                "BennyThadikaran/NseIndiaApi's NSE.py on GitHub for the "
                "current `endpoint` string used by listEquityStocksByIndex()."
            )
            return False
        if resp.status_code in (401, 403):
            log.error(
                "%d — request was reached but rejected. Cookie/session "
                "handshake likely needs adjusting (anti-bot headers, "
                "warm-up page, or rate limiting).",
                resp.status_code,
            )
            return False
        resp.raise_for_status()

        try:
            payload = resp.json()
        except ValueError:
            # This is the failure mode that motivated this whole diagnostic
            # block: HTTP 200 but a body that isn't valid JSON (empty,
            # truncated, or an HTML interstitial/challenge page). Print
            # exactly what came back instead of guessing.
            log.error(
                "200 OK but body isn't valid JSON. Content-Type: %s | "
                "Content-Encoding: %s | Content-Length: %s | body preview: %r",
                resp.headers.get("Content-Type"),
                resp.headers.get("Content-Encoding"),
                resp.headers.get("Content-Length"),
                resp.text[:300],
            )
            return False

        rows = payload.get("data", [])
        if not rows:
            log.error("200 OK but 'data' array is empty — unexpected payload shape: %s", list(payload.keys()))
            return False

        sample = rows[0]
        has_expected_fields = {"symbol", "pChange", "lastPrice"}.issubset(sample.keys())
        log.info(
            "OK — %d rows returned. Sample symbol: %s, pChange: %s. Expected fields present: %s",
            len(rows), sample.get("symbol"), sample.get("pChange"), has_expected_fields,
        )
        return has_expected_fields

    except requests.RequestException as e:
        log.error("Request failed outright: %s", e)
        return False


def _warn_if_market_closed() -> None:
    """NSE cash market trades 09:15-15:30 IST, Mon-Fri. Outside that window,
    `pChange` just reflects the last session's close-to-close move, not a
    live intraday gain — worth flagging so it isn't mistaken for real-time."""
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
    """
    PRIMARY method for live data — NSE's own live quote endpoint
    (the same one www.nseindia.com's UI calls). Same cookie warm-up
    trick as the CSV fetch above.

    Returns one row per stock with fields including:
    symbol, lastPrice, previousClose, change, pChange, totalTradedVolume,
    dayHigh, dayLow, meta{companyName, industry, isin}.
    """
    session = requests.Session()
    session.headers.update(BROWSER_HEADERS)
    url = NSE_LIVE_QUOTE_URL.format(index=quote(index.upper()))

    last_err: Exception | None = None
    for attempt in range(1, retries + 1):
        try:
            # Cookie warm-up: /option-chain, not the homepage. NSE's own
            # frontend hits this page before calling equity-stock-indices,
            # and the homepage alone isn't reliably sufficient for it.
            session.get(NSE_COOKIE_WARMUP_URL, timeout=10)
            time.sleep(1)

            resp = session.get(url, timeout=10)
            resp.raise_for_status()

            try:
                payload = resp.json()
            except ValueError as e:
                log.error(
                    "200 OK but body isn't valid JSON. Content-Encoding: %s | "
                    "body preview: %r",
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
    """FALLBACK method for live data — same `nse` package as before, but
    called with no caching since these numbers move every few seconds."""
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

    Tries the raw NSE API first, falls back to the `nse` package if that
    fails (rate limit, transient block, etc.) — deliberately the reverse
    priority of get_nifty500_universe(), since the raw endpoint here is the
    live one NSE's own site polls and tends to be the fastest path.
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
    # log.info("Available columns: %s", df.columns)
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


def get_nifty500_universe(
    cache_path: str | Path = "nifty500_universe.csv",
    max_age_days: int = 7,
) -> pd.DataFrame:
    """
    Entry point for the Fundoscope pipeline.

    NIFTY 500 rebalances only twice a year (cutoff Jan 31 / Jul 31, effective
    ~4 weeks later), so there's no reason to hit NSE on every screener
    request. Cache locally (or in your existing Postgres `universe` table)
    and refresh on a schedule instead — e.g. a weekly cron / APScheduler job.
    """
    cache_path = Path(cache_path)
    if cache_path.exists():
        age_days = (time.time() - cache_path.stat().st_mtime) / 86400
        if age_days < max_age_days:
            log.info("Using cached universe (%.1f days old): %s", age_days, cache_path)
            return pd.read_csv(cache_path)

    try:
        df = fetch_via_csv()
    except RuntimeError as e:
        log.warning("Direct CSV path failed (%s) — falling back to `nse` package", e)
        df = fetch_via_nse_package()

    df.to_csv(cache_path, index=False)
    log.info("Cached %d rows -> %s", len(df), cache_path)
    return df


if __name__ == "__main__":
    import argparse
    import sys

    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--check-api",
        action="store_true",
        help="Only probe the live quote endpoint (no universe fetch, no gainers scan) and exit.",
    )
    parser.add_argument("--index", default="NIFTY 500", help="Index to scan. Default: NIFTY 500")
    parser.add_argument(
        "--min-gain", type=float, default=5.0, help="Minimum %% gain to include. Default: 5.0"
    )
    args = parser.parse_args()

    if args.check_api:
        # Step 1, exactly as requested: verify the API is alive on its own
        # before it's relied on anywhere else.
        ok = probe_live_api(index=args.index)
        print("\nAPI check:", "PASS" if ok else "FAIL")
        sys.exit(0 if ok else 1)

    # universe = get_nifty500_universe()
    # print(f"\nNIFTY 500 universe: {universe.shape[0]} rows, {universe.shape[1]} columns")
    # print(universe.head(10).to_string(index=False))

    print(f"\nLive {args.index} gainers > {args.min_gain}% today, sorted by pChange (desc):")
    gainers = get_top_gainers(index=args.index, min_pct_gain=args.min_gain)
    if gainers.empty:
        print(f"No stocks currently up more than {args.min_gain}%.")
    else:
        print(gainers.to_string(index=False))