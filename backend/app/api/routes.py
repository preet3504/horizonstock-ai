from concurrent.futures import ProcessPoolExecutor
from fastapi import APIRouter, HTTPException
import asyncio

from app.schemas.master import StockMasterData
from app.schemas.stock import StockAnalysisResponse
from app.services.data_fetcher import fetch_stock_fundamentals
from app.services.data_mapper import map_raw_to_master

router = APIRouter()
pool = ProcessPoolExecutor(max_workers=2)

@router.get("/stocks/analyze", response_model=StockAnalysisResponse)
async def analyze_stock(symbol: str):
    try:
        loop = asyncio.get_running_loop()
        raw_data = await loop.run_in_executor(pool, fetch_stock_fundamentals, symbol)
        
        master_data = map_raw_to_master(raw_data)
        
        return StockAnalysisResponse(
            symbol=symbol,
            summary=raw_data.get("summary", {}),
            fundamentals=raw_data,
            master_data=master_data
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
