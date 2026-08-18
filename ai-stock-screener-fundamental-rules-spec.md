# AI Stock Screener — Fundamental Rules Specification
### v1.0 — Implementation-Ready Rule Definitions

---

## 1. Purpose & Scope

This document defines the complete set of **fundamental rules** the AI stock screener will use to evaluate and score companies. Each rule is defined with: the data it needs, the exact formula/condition, and the Green/Yellow/Red logic the rule engine should implement.

**In scope:** Valuation & Return Ratios, Quarterly/Trailing Performance, Balance Sheet Strength, Cash Flow Quality, Governance & Ownership Signals, sector-specific overrides, composite scoring, and the data schema needed to power all of it.

**Out of scope (future documents):** Technical/chart-pattern rules, portfolio construction, position sizing, and entry/exit timing.

**Not investment advice.** This is an analytical rule engine — output should support human decision-making, not replace it.

---

## 2. Rule Categories at a Glance

| Category | Prefix | # Rules | What It Measures |
|----------|--------|---------|-------------------|
| Valuation & Return Ratios | `VAL` | 6 | Is the stock priced reasonably relative to its earnings, growth, and returns on capital? |
| Quarterly / Trailing Performance | `QTR` | 10 | Is the business actually growing, and is that growth clean (core-driven, not accounting-assisted)? |
| Balance Sheet Strength | `BAL` | 8 | Is the company's financial structure sound — low dilution risk, manageable debt, efficient assets? |
| Cash Flow Quality | `CF` | 4 | Is reported profit actually turning into cash? |
| Governance & Ownership Signals | `GOV` | 6 | Are insiders aligned with shareholders, and are there hidden risks in the fine print? |
| **Total** | | **34** | |

Each rule resolves to one of four flags: **🟢 GREEN** (passes), **🟡 YELLOW** (borderline/needs review), **🔴 RED** (fails), or **N/A** (rule doesn't apply to this company/sector).

---

## 3A. Valuation & Return Ratios (`VAL`)

| ID | Metric | Data Required | Formula / Condition | 🟢 Green | 🟡 Yellow | 🔴 Red |
|----|--------|----------------|----------------------|----------|-----------|--------|
| VAL-01 | P/E Ratio | EPS, Company P/E, Industry Avg P/E, Company 5yr Median P/E | `PE = Price / EPS` | EPS>0 **and** PE < Industry Avg **and** PE < 5yr Median | EPS>0 **and** PE below only one benchmark | PE above both benchmarks (or EPS≤0 → flag as **N/A**, not Red) |
| VAL-02 | Book Value Growth | Current Book Value, Book Value 5yrs ago | `Growth = (BV_now − BV_5y) / BV_5y` | BV positive **and** Growth > 0 | BV positive, Growth ≤ 0 | BV negative (negative net worth) |
| VAL-03 | Price-to-Book vs ROE | P/B ratio, ROE | P/B should be justified by ROE | P/B reasonable relative to ROE (high ROE justifies high P/B) | P/B moderately stretched vs ROE | P/B high with low/declining ROE |
| VAL-04 | ROCE | Current ROCE, Lowest ROCE in last 5yrs | — | ROCE > 15% **and** min 5yr ROCE > 10% | ROCE between 0–15% | ROCE ≤ 0% |
| VAL-05 | ROE (leverage-adjusted) | ROE, Debt-to-Equity | — | ROE ≥ 15% **and** D/E < 1 | ROE ≥ 15% with D/E ≥ 1 (leverage-driven), or 0 < ROE < 15% | ROE ≤ 0% |
| VAL-06 | PEG Ratio | P/E, Sustainable 3–5yr EPS Growth % | `PEG = PE / Growth%` | 0 < PEG < 1 | 1 ≤ PEG ≤ 1.5 | PEG > 1.5 (or Growth ≤ 0 → **N/A**) |

*Market Cap is captured as display-only metadata (used for large/mid/small-cap classification), not a pass/fail rule.*

---

## 3B. Quarterly / Trailing Performance (`QTR`)

| ID | Metric | Data Required | Formula / Condition | 🟢 Green | 🟡 Yellow | 🔴 Red |
|----|--------|----------------|----------------------|----------|-----------|--------|
| QTR-01 | Sales Growth | YoY Sales Growth % | — | Growth > 0 | Growth = 0 | Growth < 0 |
| QTR-02 | Expense Discipline | Sales Growth %, Expense Growth % | Compare growth rates | Expense growth < Sales growth | Expense growth = Sales growth | Expense growth > Sales growth |
| QTR-03 | Operating Profit Growth | Operating Profit Growth %, Sales Growth % | — | OP growth > 0 **and** > Sales growth | OP growth > 0 but ≤ Sales growth | OP growth ≤ 0 |
| QTR-04 | OPM Trend | OPM this quarter, OPM same quarter last year | YoY comparison | OPM improving YoY | OPM flat YoY | OPM declining YoY |
| QTR-05 | Other Income Share | Other Income, PBT | `% = Other Income / PBT × 100` | < 10% | 10–15% | > 15% |
| QTR-06 | Interest Coverage Ratio | EBIT, Interest Expense | `Coverage = EBIT / Interest` | > 4x | 1.5x – 4x | < 1.5x |
| QTR-07 | Depreciation vs Op. Profit | Depreciation Growth %, Operating Profit Growth % | Compare growth rates | Dep. growth < OP growth | Dep. growth = OP growth | Dep. growth > OP growth |
| QTR-08 | PBT Growth | PBT Growth % | — | > 0% | = 0% | < 0% |
| QTR-09 | Net Profit Growth (Quality-checked) | Net Profit Growth %, Core-driven flag | Exclude one-off items | Growth > 0 **and** core-operations driven | Growth > 0 but includes one-offs | Growth ≤ 0 |
| QTR-10 | Diluted EPS Growth | Diluted EPS Growth % | Adjusted for dilution | > 0% | = 0% | < 0% |

---

## 3C. Balance Sheet Strength (`BAL`)

| ID | Metric | Data Required | Formula / Condition | 🟢 Green | 🟡 Yellow | 🔴 Red |
|----|--------|----------------|----------------------|----------|-----------|--------|
| BAL-01 | Equity Capital Stability | Equity Capital Change %, Bonus/Split flag | — | No change | Change flagged as bonus/split | Change without bonus/split flag (dilution) |
| BAL-02 | Reserves Growth | Reserves Growth % | — | > 0% | = 0% | < 0% |
| BAL-03 | Current Ratio | Current Assets, Current Liabilities | `CR = CA / CL` | > 1.5 | 1.0 – 1.5 | < 1.0 |
| BAL-04 | Short-Term Borrowings Trend | Short-term Borrowings Growth % | — | ≤ 0% | 0–10% | > 10% |
| BAL-05 | Debt-to-Equity | Total Debt, Equity, Sector flag | Thresholds sector-adjusted (see §4) | < 0.5x (non-capital-intensive) / < 1.5x (capital-intensive) | 0.5–1x / 1.5–2.5x | > 1x / > 2.5x |
| BAL-06 | Asset Turnover Efficiency | Total Assets Growth %, Sales Growth % | Compare growth rates | Assets growth ≤ Sales growth | Assets growth ≤ 1.3× Sales growth | Assets growth > 1.3× Sales growth |
| BAL-07 | CWIP Conversion | Years CWIP rising consecutively, Gross Block growth same period | — | CWIP flat/converting into Gross Block (≥10% growth) | Early expansion phase, conversion not yet due | ≥5 consecutive years rising, Gross Block growth <10% (stalled) |
| BAL-08 | Investments Alignment | Related-party investment flag | Qualitative check against annual report notes | Investments serve core business/treasury | Undisclosed/unclear | Diverted to unrelated related parties |

---

## 3D. Cash Flow Quality (`CF`)

| ID | Metric | Data Required | Formula / Condition | 🟢 Green | 🟡 Yellow | 🔴 Red |
|----|--------|----------------|----------------------|----------|-----------|--------|
| CF-01 | Cash Flow Signature | Sign of CFO, CFI, CFF | 8-combination lookup (see below) | `(+ − −)` | `(+ − +)`, `(+ + −)`, `(+ + +)`, `(− − +)` if ≤3yrs | `(− + −)`, `(− + +)`, `(− − −)`, or `(− − +)` if >5yrs |
| CF-02 | CFO vs Net Profit | Cumulative CFO, Cumulative Net Profit (5–10yr) | `Ratio = CFO / Net Profit` | Ratio ≥ 0.8 | 0.5 ≤ Ratio < 0.8 | Ratio < 0.5 |
| CF-03 | Free Cash Flow Trend | CFO, Capex, company maturity stage | `FCF = CFO − Capex` | Positive and growing | Positive but flat, or negative at early growth stage | Negative and company is mature |
| CF-04 | CFO Consistency | Years CFO positive in last 10 | — | ≥ 7 of 10 years | 5–6 of 10 years | < 5 of 10 years |

**CF-01 Signature Lookup:**

| Signature | Flag | Meaning |
|:---:|:---:|---|
| `+ − −` | 🟢 | Mature, self-funding compounder |
| `+ − +` | 🟡 | Genuine growth stage, watch trend |
| `+ + −` | 🟡 | Asset sale funding returns — check what was sold |
| `+ + +` | 🟡 | All inflows positive — needs explanation |
| `− − +` | 🟡→🔴 | Early-stage burn; Red if it persists past 5 years |
| `− + −` | 🔴 | Distress ("melting ice cube") |
| `− + +` | 🔴 | Burning cash, selling assets, raising capital to survive |
| `− − −` | 🔴 | All negative — urgent scrutiny |

---

## 3E. Governance & Ownership Signals (`GOV`)

| ID | Metric | Data Required | Formula / Condition | 🟢 Green | 🟡 Yellow | 🔴 Red |
|----|--------|----------------|----------------------|----------|-----------|--------|
| GOV-01 | Promoter Holding Trend | Promoter Holding % (current, 3yr ago) | — | Stable or increasing | Marginal decline (<2 pts/yr) | Declining sharply |
| GOV-02 | Promoter Pledge | Pledged Shares % of Promoter Holding | — | 0% pledged | < 5% pledged | ≥ 5% pledged, or rising |
| GOV-03 | Working Capital Efficiency | Inventory Days, Receivable Days (trend) | Compare to sales growth | Stable or improving (decreasing) | Rising in line with sales | Rising faster than sales |
| GOV-04 | Contingent Liabilities | Contingent Liabilities as % of Net Worth | — | < 10% | 10–25% | > 25%, or rising sharply |
| GOV-05 | Related Party Transactions | RPT value as % of Revenue | — | < 2% | 2–5% | > 5%, or frequent/opaque |
| GOV-06 | Auditor Remarks | Auditor opinion type (clean / qualified / disclaimer) | — | Clean/unqualified opinion | Emphasis of matter (non-critical) | Qualified opinion, disclaimer, or auditor resignation |

---

## 4. Sector-Specific Rule Overrides

Applying the default rule set uniformly across all sectors produces false signals. The engine should detect sector classification and apply these overrides automatically:

| Sector | Overrides |
|--------|-----------|
| **Banks / NBFCs** | Disable `QTR-04` (OPM), `VAL-04` (ROCE) — not applicable to lending businesses. Add: NIM, GNPA/NNPA, CASA Ratio, Provision Coverage Ratio, Capital Adequacy Ratio (CAR). `BAL-05` (D/E) is not applicable — debt is their raw material. |
| **Insurance** | Add: Solvency Ratio, Combined Ratio, Persistency Ratio in place of standard margin rules. |
| **Capital-intensive (Infra / Power / Telecom)** | `BAL-05` thresholds relaxed to <1.5x / 1.5–2.5x / >2.5x. `BAL-07` (CWIP) tolerance extended — track project-level completion timelines rather than a flat year count. |
| **Asset-light (IT Services, Platforms, Brands)** | De-weight `VAL-02`/`VAL-03` (Book Value/P-B) in the composite score. Weight `VAL-04`/`VAL-05` (ROCE/ROE) and `CF` category more heavily. |

---

## 5. Composite Scoring Methodology

Each applicable rule contributes to a **0–100 composite score**:

```
Rule score:  GREEN = 1.0   YELLOW = 0.5   RED = 0.0   N/A = excluded

Category score = (Σ rule scores in category) / (# applicable rules in category) × 100

Composite score = weighted average of category scores
```

**Default category weights** (adjustable per screener strategy):

| Category | Weight |
|----------|--------|
| Valuation & Return Ratios | 25% |
| Quarterly Performance | 25% |
| Balance Sheet Strength | 20% |
| Cash Flow Quality | 20% |
| Governance & Ownership | 10% |

**Verdict bands:**

| Score | Verdict |
|-------|---------|
| ≥ 75 | Strong candidate — most rules pass cleanly |
| 45–74 | Watchlist — review yellow/red flags before deciding |
| < 45 | High risk — would need a strong qualitative override to proceed |

**Hard override:** Any single `RED` on `CF-01` (distress signatures), `GOV-06` (qualified auditor opinion), or `VAL-02` (negative book value) should cap the composite score at a maximum of 40, regardless of other category performance — these are the metrics most associated with fraud or insolvency risk, and shouldn't be averaged away by good numbers elsewhere.

---

## 6. Required Data Points (Master Schema)

For the AI/data layer to power every rule above, the following fields must be sourced per company (quarterly refresh minimum; annual fields updated at each results/annual-report release):

| Field | Type | Source Statement | Used By |
|-------|------|--------------------|---------|
| `eps` | float | P&L | VAL-01 |
| `price`, `pe`, `industryAvgPE`, `companyMedianPE5Y` | float | Market data | VAL-01, VAL-06 |
| `bookValue`, `bookValue5yAgo` | float | Balance Sheet | VAL-02, VAL-03 |
| `roce`, `roceMin5y` | float % | Computed | VAL-04 |
| `roe`, `debtToEquity` | float % / ratio | Computed / Balance Sheet | VAL-05, BAL-05 |
| `sustainableEpsGrowth3to5y` | float % | Estimates/computed | VAL-06 |
| `salesQuarterly`, `salesYoYGrowth` | float | P&L | QTR-01, QTR-02, QTR-03, BAL-06 |
| `expensesQuarterly`, `expenseGrowth` | float | P&L | QTR-02 |
| `operatingProfit`, `operatingProfitGrowth` | float | P&L | QTR-03, QTR-07 |
| `opmCurrent`, `opmYearAgo` | float % | P&L | QTR-04 |
| `otherIncome`, `pbt` | float | P&L | QTR-05, QTR-08 |
| `ebit`, `interestExpense` | float | P&L | QTR-06 |
| `depreciation`, `depreciationGrowth` | float | P&L | QTR-07 |
| `netProfit`, `netProfitGrowth`, `coreDrivenFlag` | float / bool | P&L | QTR-09 |
| `dilutedEPS`, `dilutedEPSGrowth` | float | P&L | QTR-10 |
| `equityCapital`, `equityCapitalChange`, `bonusOrSplitFlag` | float / bool | Balance Sheet | BAL-01 |
| `reserves`, `reservesGrowth` | float | Balance Sheet | BAL-02 |
| `currentAssets`, `currentLiabilities` | float | Balance Sheet | BAL-03 |
| `shortTermBorrowings`, `shortTermBorrowingsGrowth` | float | Balance Sheet | BAL-04 |
| `totalDebt`, `totalAssets`, `totalAssetsGrowth` | float | Balance Sheet | BAL-05, BAL-06 |
| `cwip`, `cwipRisingYears`, `grossBlock`, `grossBlockGrowth` | float / int | Balance Sheet | BAL-07 |
| `investments`, `relatedPartyInvestmentFlag` | float / enum | Balance Sheet + Notes | BAL-08 |
| `cfo`, `cfi`, `cff` | float | Cash Flow Statement | CF-01, CF-02, CF-04 |
| `cumulativeCFO5to10y`, `cumulativeNetProfit5to10y` | float | Computed | CF-02 |
| `capex`, `fcfTrendCategory`, `companyMaturityStage` | float / enum | Cash Flow / classified | CF-03 |
| `cfoPositiveYearsOf10` | int | Computed | CF-04 |
| `promoterHolding`, `promoterHolding3yAgo` | float % | Shareholding pattern | GOV-01 |
| `promoterPledgePct` | float % | Shareholding pattern | GOV-02 |
| `inventoryDays`, `receivableDays` (trend) | float | Computed | GOV-03 |
| `contingentLiabilities`, `netWorth` | float | Notes to Accounts | GOV-04 |
| `relatedPartyTransactionValue`, `revenue` | float | Notes to Accounts | GOV-05 |
| `auditorOpinionType` | enum | Auditor's Report | GOV-06 |
| `sectorClassification` | enum | Static metadata | §4 overrides |
| `marketCap` | float | Market data | Display only |

---

## 7. Rule Engine — Config Schema (Implementation Reference)

Rules should be config-driven, not hardcoded, so thresholds can be tuned without redeploying the app. Example JSON representations:

**Threshold-based rule (VAL-01):**
```json
{
  "ruleId": "VAL-01",
  "category": "Valuation & Return Ratios",
  "metric": "P/E Ratio",
  "inputs": ["eps", "pe", "industryAvgPE", "companyMedianPE5Y"],
  "logic": [
    { "if": "eps <= 0", "flag": "NA", "reason": "Loss-making — P/E not applicable" },
    { "if": "pe < industryAvgPE && pe < companyMedianPE5Y", "flag": "GREEN" },
    { "if": "pe < industryAvgPE || pe < companyMedianPE5Y", "flag": "YELLOW" },
    { "else": true, "flag": "RED" }
  ]
}
```

**Signature/lookup-based rule (CF-01):**
```json
{
  "ruleId": "CF-01",
  "category": "Cash Flow Quality",
  "metric": "Cash Flow Signature",
  "inputs": ["cfoSign", "cfiSign", "cffSign"],
  "logicType": "lookup",
  "key": "cfoSign + cfiSign + cffSign",
  "map": {
    "+--": { "flag": "GREEN", "reason": "Mature, self-funding compounder" },
    "+-+": { "flag": "YELLOW", "reason": "Growth stage — watch trend" },
    "++-": { "flag": "YELLOW", "reason": "Asset sale funding returns" },
    "+++": { "flag": "YELLOW", "reason": "All inflows positive — needs explanation" },
    "--+": { "flag": "YELLOW", "reason": "Early-stage burn", "escalateToRedAfterYears": 5 },
    "-+-": { "flag": "RED", "reason": "Distress signature" },
    "-++": { "flag": "RED", "reason": "Burning cash and raising capital to survive" },
    "---": { "flag": "RED", "reason": "All cash flows negative" }
  }
}
```

Every other rule in sections 3A–3E follows one of these two patterns (threshold-based or lookup-based), so the entire rule set can be expressed in a single JSON/YAML config file and evaluated by one generic engine function.

---

## 8. AI-Assisted Qualitative Layer

Since this is an **AI research** screener (not just a numeric rule engine), the quantitative rules above can be paired with an LLM-driven layer that reads unstructured sources and feeds qualitative signals into `GOV` category rules and the composite verdict:

- **Annual report / notes parsing** — extract contingent liabilities, related-party transaction details, and auditor's remarks language automatically (feeds `GOV-04`, `GOV-05`, `GOV-06`).
- **Concall/management-commentary summarization** — flag inconsistencies between what management guided and what results actually showed.
- **News & disclosure monitoring** — surface promoter pledge changes, credit rating actions, or regulatory notices between quarterly refreshes (feeds `GOV-01`, `GOV-02`).
- **Peer-context generation** — auto-generate the "industry average P/E" and "sector classification" inputs (`VAL-01`, §4) from a peer set rather than requiring manual entry.

Treat AI-extracted qualitative flags as **inputs to the rule engine**, not replacements for it — every AI-derived flag should still resolve to Green/Yellow/Red through the same rule structure, so the scoring logic stays consistent and auditable.

---

## 9. Master Rule Index

| ID | Metric | ID | Metric | ID | Metric |
|----|--------|----|--------|----|--------|
| VAL-01 | P/E Ratio | QTR-06 | Interest Coverage | BAL-07 | CWIP Conversion |
| VAL-02 | Book Value Growth | QTR-07 | Depreciation vs OP | BAL-08 | Investments Alignment |
| VAL-03 | P/B vs ROE | QTR-08 | PBT Growth | CF-01 | Cash Flow Signature |
| VAL-04 | ROCE | QTR-09 | Net Profit Growth | CF-02 | CFO vs Net Profit |
| VAL-05 | ROE (leverage-adj.) | QTR-10 | Diluted EPS Growth | CF-03 | FCF Trend |
| VAL-06 | PEG Ratio | BAL-01 | Equity Capital Stability | CF-04 | CFO Consistency |
| QTR-01 | Sales Growth | BAL-02 | Reserves Growth | GOV-01 | Promoter Holding |
| QTR-02 | Expense Discipline | BAL-03 | Current Ratio | GOV-02 | Promoter Pledge |
| QTR-03 | Operating Profit Growth | BAL-04 | ST Borrowings Trend | GOV-03 | Working Capital Days |
| QTR-04 | OPM Trend | BAL-05 | Debt-to-Equity | GOV-04 | Contingent Liabilities |
| QTR-05 | Other Income Share | BAL-06 | Asset Turnover | GOV-05 | Related Party Transactions |
| | | | | GOV-06 | Auditor Remarks |

---

*This specification is designed to be implemented directly: §6 defines the data pipeline, §7 defines the rule engine, and §3A–3E + §5 define the scoring logic end to end. Revisit thresholds periodically — they are general quality benchmarks, not fixed constants, and may need sector- or market-cycle-specific tuning as the screener accumulates real outcomes data.*
