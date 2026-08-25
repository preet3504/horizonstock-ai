from concurrent.futures import ProcessPoolExecutor
from fastapi import APIRouter, HTTPException, Query
import asyncio

from app.schemas.master import StockMasterData
from app.schemas.stock import StockAnalysisResponse
from app.schemas.search import StockSearchResult, StockSearchResponse
from app.services.data_fetcher import fetch_stock_fundamentals
from app.services.data_mapper import map_raw_to_master
from app.services.history_fetcher import fetch_stock_history
from app.services.ai_analyzer import AIAnalyzerService
from app.services.stock_list_cache import stock_cache

router = APIRouter()
pool = ProcessPoolExecutor(max_workers=2)

@router.get("/stocks/search", response_model=StockSearchResponse)
async def search_stocks(
    q: str = Query("", description="Search query (symbol prefix or company name)"),
    limit: int = Query(10, ge=1, le=20, description="Max results to return"),
):
    """Search NSE-listed stocks by symbol prefix or company name."""
    results = stock_cache.search(q, limit=limit)
    return StockSearchResponse(
        results=[StockSearchResult(**r) for r in results],
        total=len(results),
    )

@router.get("/stocks/analyze", response_model=StockAnalysisResponse)
async def analyze_stock(symbol: str):
    try:
        print(f"[{symbol}] Starting stock analysis process...")
        loop = asyncio.get_running_loop()
        
        print(f"[{symbol}] Fetching raw fundamental data...")
        raw_data = await loop.run_in_executor(pool, fetch_stock_fundamentals, symbol)
        
        print(f"[{symbol}] Raw data fetched. Mapping to Master Data...")
        master_data = map_raw_to_master(raw_data)
        
        try:
            print(f"[{symbol}] Data mapped. Starting AI Analysis...")
            # Instantiate AIAnalyzerService
            analyzer = AIAnalyzerService()
            ai_analysis = await analyzer.analyze(master_data)
            print(f"[{symbol}] AI Analysis complete.")
        except Exception as e:
            print(f"[{symbol}] AI Analysis failed: {e}")
            ai_analysis = None
        
        return StockAnalysisResponse(
            symbol=symbol,
            summary=raw_data.get("summary", {}),
            fundamentals=raw_data,
            master_data=master_data,
            ai_analysis=ai_analysis
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stocks/history")
async def get_stock_history(
    symbol: str, 
    exchange: str = "NSE", 
    interval: str = "1d", 
    period: str = "2y"
):
    try:
        loop = asyncio.get_running_loop()
        # yfinance can block the event loop, so run it in the process pool
        # For simplicity we'll just run it in a thread pool as it's I/O bound
        from concurrent.futures import ThreadPoolExecutor
        with ThreadPoolExecutor(max_workers=2) as t_pool:
            history_data = await loop.run_in_executor(
                t_pool, 
                fetch_stock_history, 
                symbol, 
                exchange, 
                interval, 
                period
            )
            
        return history_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
