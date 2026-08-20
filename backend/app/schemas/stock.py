from pydantic import BaseModel
from typing import Any, Dict, Optional, List
from app.schemas.master import StockMasterData
from app.schemas.ai_analysis import FinalAIAnalysis

class StockAnalysisRequest(BaseModel):
    symbol: str

class StockAnalysisResponse(BaseModel):
    symbol: str
    summary: Optional[Dict[str, Any]] = None
    fundamentals: Optional[Dict[str, Any]] = None
    master_data: Optional[StockMasterData] = None
    ai_analysis: Optional[FinalAIAnalysis] = None
