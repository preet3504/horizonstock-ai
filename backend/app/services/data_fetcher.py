from openscreener import Stock
import logging

logger = logging.getLogger(__name__)

def fetch_stock_fundamentals(symbol: str) -> dict:
    """
    Fetches stock fundamentals using openscreener.
    """
    try:
        stock = Stock(symbol, consolidated=True)
        return {
            "summary": stock.summary(),
            "pros_cons": stock.pros_cons(),
            "peers": stock.peers(),
            "quarterly_results": stock.quarterly_results(),
            "profit_loss": stock.profit_loss(),
            "balance_sheet": stock.balance_sheet(),
            "cash_flow": stock.cash_flow(),
            "ratios": stock.ratios(),
            "shareholding": stock.shareholding(frequency="quarterly"),
        }
    except Exception as e:
        logger.error(f"Error fetching data for {symbol}: {e}")
        raise e