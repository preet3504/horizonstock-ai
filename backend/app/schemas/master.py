from pydantic import BaseModel
from typing import Optional

class StockMasterData(BaseModel):
    # Valuation
    eps: Optional[float] = None
    price: Optional[float] = None
    pe: Optional[float] = None
    industryAvgPE: Optional[float] = None
    companyMedianPE5Y: Optional[float] = None
    bookValue: Optional[float] = None
    bookValue5yAgo: Optional[float] = None
    roce: Optional[float] = None
    roceMin5y: Optional[float] = None
    roe: Optional[float] = None
    debtToEquity: Optional[float] = None
    sustainableEpsGrowth3to5y: Optional[float] = None
    
    # Quarterly
    salesQuarterly: Optional[float] = None
    salesYoYGrowth: Optional[float] = None
    expensesQuarterly: Optional[float] = None
    expenseGrowth: Optional[float] = None
    operatingProfit: Optional[float] = None
    operatingProfitGrowth: Optional[float] = None
    opmCurrent: Optional[float] = None
    opmYearAgo: Optional[float] = None
    otherIncome: Optional[float] = None
    pbt: Optional[float] = None
    ebit: Optional[float] = None
    interestExpense: Optional[float] = None
    depreciation: Optional[float] = None
    depreciationGrowth: Optional[float] = None
    netProfit: Optional[float] = None
    netProfitGrowth: Optional[float] = None
    coreDrivenFlag: Optional[bool] = None
    dilutedEPS: Optional[float] = None
    dilutedEPSGrowth: Optional[float] = None
    
    # Balance Sheet
    equityCapital: Optional[float] = None
    equityCapitalChange: Optional[float] = None
    bonusOrSplitFlag: Optional[bool] = None
    reserves: Optional[float] = None
    reservesGrowth: Optional[float] = None
    currentAssets: Optional[float] = None
    currentLiabilities: Optional[float] = None
    shortTermBorrowings: Optional[float] = None
    shortTermBorrowingsGrowth: Optional[float] = None
    totalDebt: Optional[float] = None
    totalAssets: Optional[float] = None
    totalAssetsGrowth: Optional[float] = None
    cwip: Optional[float] = None
    cwipRisingYears: Optional[int] = None
    grossBlock: Optional[float] = None
    grossBlockGrowth: Optional[float] = None
    investments: Optional[float] = None
    relatedPartyInvestmentFlag: Optional[str] = None
    
    # Cash Flow
    cfo: Optional[float] = None
    cfi: Optional[float] = None
    cff: Optional[float] = None
    cumulativeCFO5to10y: Optional[float] = None
    cumulativeNetProfit5to10y: Optional[float] = None
    capex: Optional[float] = None
    fcfTrendCategory: Optional[str] = None
    companyMaturityStage: Optional[str] = None
    cfoPositiveYearsOf10: Optional[int] = None
    
    # Governance
    promoterHolding: Optional[float] = None
    promoterHolding3yAgo: Optional[float] = None
    promoterPledgePct: Optional[float] = None
    inventoryDays: Optional[float] = None
    receivableDays: Optional[float] = None
    contingentLiabilities: Optional[float] = None
    netWorth: Optional[float] = None
    relatedPartyTransactionValue: Optional[float] = None
    revenue: Optional[float] = None
    auditorOpinionType: Optional[str] = None
    
    # Meta
    sectorClassification: Optional[str] = None
    marketCap: Optional[float] = None
