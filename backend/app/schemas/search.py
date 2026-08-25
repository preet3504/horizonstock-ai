from pydantic import BaseModel


class StockSearchResult(BaseModel):
    """A single stock match from the search endpoint."""
    symbol: str            # e.g. "IRFC"
    company_name: str      # e.g. "Indian Railway Finance Corporation Limited"


class StockSearchResponse(BaseModel):
    """Response wrapper for the stock search API."""
    results: list[StockSearchResult]
    total: int
