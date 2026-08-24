import asyncio
from app.schemas.master import StockMasterData
from app.services.ai_analyzer import AIAnalyzerService

async def main():
    analyzer = AIAnalyzerService()
    # Mock some data so Pydantic doesn't fail
    data = StockMasterData(**{
        'eps': 10.0, 'price': 100.0, 'pe': 10.0, 'industryAvgPE': 15.0, 'companyMedianPE5Y': 12.0,
        'bookValue': None, 'bookValue5yAgo': None, 'roce': None, 'roceMin5y': None, 'roe': None,
        'debtToEquity': None, 'sustainableEpsGrowth3to5y': None, 'salesQuarterly': None,
        'salesYoYGrowth': None, 'expensesQuarterly': None, 'expenseGrowth': None,
        'operatingProfit': None, 'operatingProfitGrowth': None, 'opmCurrent': None,
        'opmYearAgo': None, 'otherIncome': None, 'pbt': None, 'ebit': None,
        'interestExpense': None, 'depreciation': None, 'depreciationGrowth': None,
        'netProfit': None, 'netProfitGrowth': None, 'coreDrivenFlag': None,
        'dilutedEPS': None, 'dilutedEPSGrowth': None, 'equityCapital': None,
        'equityCapitalChange': None, 'bonusOrSplitFlag': None, 'reserves': None,
        'reservesGrowth': None, 'currentAssets': None, 'currentLiabilities': None,
        'shortTermBorrowings': None, 'shortTermBorrowingsGrowth': None, 'totalDebt': None,
        'totalAssets': None, 'totalAssetsGrowth': None, 'cwip': None, 'cwipRisingYears': None,
        'grossBlock': None, 'grossBlockGrowth': None, 'investments': None,
        'relatedPartyInvestmentFlag': None, 'cfo': None, 'cfi': None, 'cff': None,
        'cumulativeCFO5to10y': None, 'cumulativeNetProfit5to10y': None, 'capex': None,
        'fcfTrendCategory': None, 'companyMaturityStage': None, 'cfoPositiveYearsOf10': None,
        'promoterHolding': None, 'promoterHolding3yAgo': None, 'promoterPledgePct': None,
        'inventoryDays': None, 'receivableDays': None, 'contingentLiabilities': None,
        'netWorth': None, 'relatedPartyTransactionValue': None, 'revenue': None,
        'auditorOpinionType': None, 'sectorClassification': None, 'marketCap': None
    })
    try:
        res = await analyzer.analyze(data)
        print("Analysis successful!")
        print(res.model_dump_json(indent=2))
    except Exception as e:
        print(f"Failed with exception: {e}")

if __name__ == "__main__":
    asyncio.run(main())
