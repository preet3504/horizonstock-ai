import logging
from app.schemas.master import StockMasterData

logger = logging.getLogger(__name__)

def safe_float(val):
    if val is None or val == "":
        return None
    try:
        return float(str(val).replace(",", ""))
    except Exception:
        return None

def calculate_growth(current, previous):
    if not current or not previous or previous == 0:
        return None
    return ((current - previous) / previous) * 100

def map_raw_to_master(raw_data: dict) -> StockMasterData:
    summary = raw_data.get("summary", {})
    ratios = summary.get("ratios", {}) if isinstance(summary, dict) else {}
    qtr = raw_data.get("quarterly_results", [])
    pl = raw_data.get("profit_loss", [])
    bs = raw_data.get("balance_sheet", [])
    cf = raw_data.get("cash_flow", [])

    data = StockMasterData()

    # Meta
    data.marketCap = safe_float(ratios.get("market_cap"))
    
    # Valuation
    data.price = safe_float(summary.get("current_price")) if isinstance(summary, dict) else None
    data.pe = safe_float(ratios.get("stock_p_e"))
    data.bookValue = safe_float(ratios.get("book_value"))
    data.roce = safe_float(ratios.get("roce_percent"))
    data.roe = safe_float(ratios.get("roe_percent"))
    
    # EBIT logic (Op profit + other income)
    # ROCE Minimum 5y
    if len(pl) > 0:
        roce_list = []
        for year_data in pl[-6:]: # Last 5 years + TTM
            om = safe_float(year_data.get("operating_margin_percent"))
            # approximation since true ROCE historical isn't in PL array natively, 
            # we'd rely on openscreener 'ratios' method if it didn't fail.
            pass

    # Quarterly performance (latest)
    if isinstance(qtr, list) and len(qtr) > 0:
        latest_qtr = qtr[-1]
        data.salesQuarterly = safe_float(latest_qtr.get("sales"))
        data.expensesQuarterly = safe_float(latest_qtr.get("expenses"))
        data.operatingProfit = safe_float(latest_qtr.get("operating_profit"))
        data.opmCurrent = safe_float(latest_qtr.get("operating_margin_percent"))
        data.otherIncome = safe_float(latest_qtr.get("other_income"))
        data.pbt = safe_float(latest_qtr.get("profit_before_tax"))
        data.interestExpense = safe_float(latest_qtr.get("interest"))
        data.depreciation = safe_float(latest_qtr.get("depreciation"))
        data.netProfit = safe_float(latest_qtr.get("net_profit"))
        data.eps = safe_float(latest_qtr.get("eps"))
        data.ebit = (data.operatingProfit or 0) + (data.otherIncome or 0)
        
        # YoY Growth
        if len(qtr) >= 5: # Compare with 4 quarters ago
            prev_year_qtr = qtr[-5]
            data.salesYoYGrowth = calculate_growth(data.salesQuarterly, safe_float(prev_year_qtr.get("sales")))
            data.expenseGrowth = calculate_growth(data.expensesQuarterly, safe_float(prev_year_qtr.get("expenses")))
            data.operatingProfitGrowth = calculate_growth(data.operatingProfit, safe_float(prev_year_qtr.get("operating_profit")))
            data.opmYearAgo = safe_float(prev_year_qtr.get("operating_margin_percent"))
            data.depreciationGrowth = calculate_growth(data.depreciation, safe_float(prev_year_qtr.get("depreciation")))
            data.netProfitGrowth = calculate_growth(data.netProfit, safe_float(prev_year_qtr.get("net_profit")))
            data.dilutedEPS = data.eps
            data.dilutedEPSGrowth = calculate_growth(data.eps, safe_float(prev_year_qtr.get("eps")))

    # Balance Sheet (latest)
    if isinstance(bs, list) and len(bs) > 0:
        latest_bs = bs[-1]
        data.equityCapital = safe_float(latest_bs.get("equity_capital"))
        data.reserves = safe_float(latest_bs.get("reserves"))
        data.currentLiabilities = safe_float(latest_bs.get("other_liabilities")) 
        data.shortTermBorrowings = safe_float(latest_bs.get("borrowings"))
        data.totalDebt = safe_float(latest_bs.get("borrowings"))
        data.totalAssets = safe_float(latest_bs.get("total_assets"))
        data.cwip = safe_float(latest_bs.get("capital_work_in_progress"))
        data.grossBlock = safe_float(latest_bs.get("fixed_assets"))
        data.investments = safe_float(latest_bs.get("investments"))
        
        if data.totalDebt is not None and data.equityCapital is not None and data.reserves is not None:
            net_worth = data.equityCapital + data.reserves
            if net_worth > 0:
                data.debtToEquity = data.totalDebt / net_worth

        if len(bs) >= 2:
            prev_bs = bs[-2]
            data.reservesGrowth = calculate_growth(data.reserves, safe_float(prev_bs.get("reserves")))
            data.totalAssetsGrowth = calculate_growth(data.totalAssets, safe_float(prev_bs.get("total_assets")))
            data.shortTermBorrowingsGrowth = calculate_growth(data.shortTermBorrowings, safe_float(prev_bs.get("borrowings")))
            data.grossBlockGrowth = calculate_growth(data.grossBlock, safe_float(prev_bs.get("fixed_assets")))

        if len(bs) >= 6:
            prev_5y = bs[-6]
            bv_latest = (data.equityCapital or 0) + (data.reserves or 0)
            bv_5y = safe_float(prev_5y.get("equity_capital", 0)) + safe_float(prev_5y.get("reserves", 0))
            data.bookValue5yAgo = bv_5y
    
    # Cash Flow (latest)
    if isinstance(cf, list) and len(cf) > 0:
        latest_cf = cf[-1]
        data.cfo = safe_float(latest_cf.get("operating_cash_flow"))
        data.cfi = safe_float(latest_cf.get("investing_cash_flow"))
        data.cff = safe_float(latest_cf.get("financing_cash_flow"))
        
        # CFO Consistency (10 years)
        positive_years = 0
        cumulative_cfo = 0
        for year_data in cf[-10:]:
            val = safe_float(year_data.get("operating_cash_flow"))
            if val and val > 0:
                positive_years += 1
            if val:
                cumulative_cfo += val
        data.cfoPositiveYearsOf10 = positive_years
        data.cumulativeCFO5to10y = cumulative_cfo
        
    # Cumulative Net Profit for comparison
    if isinstance(pl, list) and len(pl) > 0:
        cumulative_np = 0
        for year_data in pl[-10:]:
            val = safe_float(year_data.get("net_profit"))
            if val:
                cumulative_np += val
        data.cumulativeNetProfit5to10y = cumulative_np

    return data
