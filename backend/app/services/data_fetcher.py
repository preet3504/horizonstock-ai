from openscreener import Stock
import logging

logger = logging.getLogger(__name__)

def fetch_stock_fundamentals(symbol: str) -> dict:
    """
    Fetches stock fundamentals using openscreener safely.
    """
    try:
        stock = Stock(symbol, consolidated=True)
        # Check if consolidated data exists. If not, fallback to standalone.
        if not stock.profit_loss():
            logger.info(f"No consolidated data found for {symbol}, falling back to standalone.")
            stock = Stock(symbol, consolidated=False)
    except Exception as e:
        logger.error(f"Failed to initialize Stock for {symbol}: {e}")
        raise e

    data = {}
    
    def safe_fetch(method_name, default=None):
        try:
            return getattr(stock, method_name)()
        except Exception as e:
            logger.warning(f"Failed to fetch {method_name} for {symbol}: {e}")
            return default if default is not None else {}

    data["summary"] = safe_fetch("summary")
    data["pros_cons"] = safe_fetch("pros_cons")
    data["peers"] = safe_fetch("peers")
    data["quarterly_results"] = safe_fetch("quarterly_results", [])
    data["profit_loss"] = safe_fetch("profit_loss", [])
    data["balance_sheet"] = safe_fetch("balance_sheet", [])
    data["cash_flow"] = safe_fetch("cash_flow", [])
    data["ratios"] = safe_fetch("ratios", [])
    data["shareholding"] = safe_fetch("shareholding", [])

    return data