export interface StockMasterData {
  // Valuation
  eps: number | null;
  price: number | null;
  pe: number | null;
  industryAvgPE: number | null;
  companyMedianPE5Y: number | null;
  bookValue: number | null;
  bookValue5yAgo: number | null;
  roce: number | null;
  roceMin5y: number | null;
  roe: number | null;
  debtToEquity: number | null;
  sustainableEpsGrowth3to5y: number | null;

  // Quarterly
  salesQuarterly: number | null;
  salesYoYGrowth: number | null;
  expensesQuarterly: number | null;
  expenseGrowth: number | null;
  operatingProfit: number | null;
  operatingProfitGrowth: number | null;
  opmCurrent: number | null;
  opmYearAgo: number | null;
  otherIncome: number | null;
  pbt: number | null;
  ebit: number | null;
  interestExpense: number | null;
  depreciation: number | null;
  depreciationGrowth: number | null;
  netProfit: number | null;
  netProfitGrowth: number | null;
  coreDrivenFlag: boolean | null;
  dilutedEPS: number | null;
  dilutedEPSGrowth: number | null;

  // Balance Sheet
  equityCapital: number | null;
  equityCapitalChange: number | null;
  bonusOrSplitFlag: boolean | null;
  reserves: number | null;
  reservesGrowth: number | null;
  currentAssets: number | null;
  currentLiabilities: number | null;
  shortTermBorrowings: number | null;
  shortTermBorrowingsGrowth: number | null;
  totalDebt: number | null;
  totalAssets: number | null;
  totalAssetsGrowth: number | null;
  cwip: number | null;
  cwipRisingYears: number | null;
  grossBlock: number | null;
  grossBlockGrowth: number | null;
  investments: number | null;
  relatedPartyInvestmentFlag: string | null;

  // Cash Flow
  cfo: number | null;
  cfi: number | null;
  cff: number | null;
  cumulativeCFO5to10y: number | null;
  cumulativeNetProfit5to10y: number | null;
  capex: number | null;
  fcfTrendCategory: string | null;
  companyMaturityStage: string | null;
  cfoPositiveYearsOf10: number | null;

  // Governance
  promoterHolding: number | null;
  promoterHolding3yAgo: number | null;
  promoterPledgePct: number | null;
  inventoryDays: number | null;
  receivableDays: number | null;
  contingentLiabilities: number | null;
  netWorth: number | null;
  relatedPartyTransactionValue: number | null;
  revenue: number | null;
  auditorOpinionType: string | null;

  // Meta
  sectorClassification: string | null;
  marketCap: number | null;
}

export interface StockAnalysisResponse {
  symbol: string;
  summary: Record<string, any>;
  fundamentals: Record<string, any>;
  master_data: StockMasterData;
}
