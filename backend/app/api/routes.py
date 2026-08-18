from fastapi import APIRouter, HTTPException
from app.schemas.stock import StockAnalysisResponse
from app.services.data_fetcher import fetch_stock_fundamentals

router = APIRouter()

@router.get("/stocks/analyze", response_model=StockAnalysisResponse)
async def analyze_stock(symbol: str):
    try:
        data = fetch_stock_fundamentals(symbol)
        return StockAnalysisResponse(
            symbol=symbol,
            summary=data.get("summary", {}),
            fundamentals=data
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
