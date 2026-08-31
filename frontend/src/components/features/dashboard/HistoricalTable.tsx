import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { motion } from "framer-motion"

interface HistoricalTableProps {
  title: string;
  data: Record<string, any>[];
  dateKey: string;
}

// Clean metric labels: snake_case → human-readable
function formatMetricLabel(key: string): string {
  const overrides: Record<string, string> = {
    sales: 'Sales / Revenue',
    expenses: 'Total Expenses',
    operating_profit: 'Operating Profit',
    operating_margin_percent: 'OPM %',
    other_income: 'Other Income',
    interest: 'Interest',
    depreciation: 'Depreciation',
    profit_before_tax: 'Profit Before Tax',
    tax_percent: 'Tax %',
    net_profit: 'Net Profit',
    eps: 'EPS',
    dividend_payout_percent: 'Dividend Payout %',
    equity_capital: 'Equity Capital',
    reserves: 'Reserves',
    borrowings: 'Borrowings',
    other_liabilities: 'Other Liabilities',
    total_liabilities: 'Total Liabilities',
    fixed_assets: 'Fixed Assets',
    capital_work_in_progress: 'CWIP',
    investments: 'Investments',
    other_assets: 'Other Assets',
    total_assets: 'Total Assets',
    operating_cash_flow: 'Cash from Operations',
    investing_cash_flow: 'Cash from Investing',
    financing_cash_flow: 'Cash from Financing',
    net_cash_flow: 'Net Cash Flow',
    free_cash_flow: 'Free Cash Flow',
    cfo_op: 'CFO / OP',
    promoter_holding: 'Promoter Holding %',
    pledged_percent: 'Pledged %',
    dii_holding: 'DII Holding %',
    fii_holding: 'FII Holding %',
    public_holding: 'Public Holding %',
    government_holding: 'Govt Holding %',
    no_of_shareholders: 'No. of Shareholders',
  };
  if (overrides[key]) return overrides[key];
  return key
    .replace(/_/g, ' ')
    .replace(/\bpercent\b/i, '%')
    .replace(/\b\w/g, l => l.toUpperCase());
}

// Format cell values with smart precision
function formatCellValue(val: any, key: string): { text: string; isEmpty: boolean } {
  if (val === null || val === undefined || val === '') return { text: '—', isEmpty: true };
  if (typeof val !== 'number') return { text: String(val), isEmpty: false };

  const isPct = key.includes('percent') || key.includes('margin') || key.includes('holding') || key.includes('pledged');
  if (isPct) return { text: val.toFixed(1), isEmpty: false };
  if (key === 'eps' || key === 'cfo_op') return { text: val.toFixed(2), isEmpty: false };

  // For large numbers, use Indian locale formatting
  if (Number.isInteger(val) || Math.abs(val) >= 10) {
    return { text: val.toLocaleString('en-IN'), isEmpty: false };
  }
  return { text: val.toFixed(2), isEmpty: false };
}

// Determine if a metric row is a "key" metric for slight visual emphasis
const KEY_METRICS = new Set([
  'sales', 'operating_profit', 'net_profit', 'eps', 'total_assets',
  'operating_cash_flow', 'free_cash_flow', 'net_cash_flow',
  'promoter_holding', 'borrowings', 'reserves',
]);

export function HistoricalTable({ title, data, dateKey }: HistoricalTableProps) {
  if (!data || data.length === 0) return null;

  const allKeys = Array.from(
    new Set(data.flatMap(item => Object.keys(item).filter(k => k !== dateKey && k !== 'raw_pdf')))
  );

  const displayData = [...data].reverse();
  const latestIdx = 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.3 }}
    >
      <div className="overflow-hidden rounded-xl bg-card border border-border/50 shadow-sm">
        <ScrollArea className="w-full whitespace-nowrap">
          <Table>
            {/* ── Column Header Row ── */}
            <TableHeader>
              <TableRow className="border-b-2 border-primary/15 hover:bg-transparent">
                {/* Sticky label column header */}
                <TableHead 
                  className="w-[200px] min-w-[200px] bg-muted/50 sticky left-0 z-20 py-3 px-5 shadow-[3px_0_8px_-3px_rgba(0,0,0,0.08)]"
                >
                  {/* intentionally empty — the column is self-explanatory */}
                </TableHead>
                {/* Period columns */}
                {displayData.map((col, idx) => (
                  <TableHead
                    key={idx}
                    className={`text-right font-mono py-3 px-4 min-w-[95px] whitespace-nowrap tracking-wide ${
                      idx === latestIdx
                        ? 'text-primary text-sm font-extrabold bg-primary/[0.06]'
                        : 'text-muted-foreground/60 text-[13px] font-semibold bg-muted/20'
                    }`}
                  >
                    {col[dateKey] || `Period ${idx + 1}`}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>

            {/* ── Data Rows ── */}
            <TableBody>
              {allKeys.map((key, rowIdx) => {
                const isKey = KEY_METRICS.has(key);

                return (
                  <TableRow
                    key={key}
                    className={`
                      border-b transition-colors duration-75 group
                      ${isKey ? 'border-border bg-muted/10' : 'border-border/50'}
                      ${rowIdx % 2 === 1 && !isKey ? 'bg-muted/5' : ''}
                      hover:bg-muted/20
                    `}
                  >
                    {/* Sticky metric label */}
                    <TableCell
                      className={`
                        sticky left-0 z-10 bg-card py-2.5 px-5
                        shadow-[3px_0_8px_-3px_rgba(0,0,0,0.06)]
                        group-hover:text-foreground transition-colors
                        text-sm whitespace-nowrap
                        ${isKey 
                          ? 'font-bold text-foreground/85' 
                          : 'font-medium text-muted-foreground/75'}
                      `}
                    >
                      {formatMetricLabel(key)}
                    </TableCell>

                    {/* Data cells */}
                    {displayData.map((col, idx) => {
                      const val = col[key];
                      const isNum = typeof val === 'number';
                      const isNegative = isNum && val < 0;
                      const isLatest = idx === latestIdx;
                      const { text, isEmpty } = formatCellValue(val, key);

                      return (
                        <TableCell
                          key={idx}
                          className={`
                            text-right font-mono py-2.5 px-4 tabular-nums text-sm transition-colors
                            ${isEmpty
                              ? 'text-muted-foreground/30'
                              : isNegative
                                ? 'text-loss font-semibold'
                                : isLatest
                                  ? `text-foreground ${isKey ? 'font-bold' : 'font-semibold'}`
                                  : 'text-foreground/80 font-normal'
                            }
                            ${isLatest && !isEmpty ? 'bg-muted/10' : ''}
                          `}
                        >
                          {text}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <ScrollBar orientation="horizontal" className="bg-muted/30 h-2" />
        </ScrollArea>
      </div>
    </motion.div>
  );
}
