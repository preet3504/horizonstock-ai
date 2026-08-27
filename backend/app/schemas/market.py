from pydantic import BaseModel
from typing import List, Optional

class TopGainerItem(BaseModel):
    symbol: str
    identifier: Optional[str] = None
    industry: Optional[str] = None
    lastPrice: float
    previousClose: float
    change: float
    pChange: float
    totalTradedVolume: int
    lastUpdateTime: str
    smaValue: Optional[float] = None
    smaDistance: Optional[float] = None

class TopGainersResponse(BaseModel):
    index: str
    min_pct_gain: float
    count: int
    gainers: List[TopGainerItem]
