from pydantic import BaseModel
from typing import Any, Dict, Optional, List

class StockAnalysisRequest(BaseModel):
    symbol: str

class StockAnalysisResponse(BaseModel):
    symbol: str
    summary: Optional[Dict[str, Any]] = None
    fundamentals: Optional[Dict[str, Any]] = None
