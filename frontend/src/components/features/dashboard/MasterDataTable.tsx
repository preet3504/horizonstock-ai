import { StockMasterData, RuleFlag } from "@/types/stock"
import { motion } from "framer-motion"
import { Activity, Briefcase, TrendingUp, DollarSign, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react"

const KEY_TO_RULE_MAP: Record<string, string> = {
  'pe': 'VAL-01',
  'bookValue': 'VAL-02',
  'roce': 'VAL-04',
  'roe': 'VAL-05',
  'salesYoYGrowth': 'QTR-01',
  'operatingProfitGrowth': 'QTR-03',
  'netProfitGrowth': 'QTR-09',
  'debtToEquity': 'BAL-05',
  'cfo': 'CF-01',
};

// Human-friendly labels for each key
const LABEL_MAP: Record<string, string> = {
  price: 'Current Price',
  pe: 'P/E Ratio',
  bookValue: 'Book Value',
  roce: 'ROCE',
  roe: 'ROE',
  debtToEquity: 'Debt / Equity',
  marketCap: 'Market Cap',
  salesQuarterly: 'Revenue',
  salesYoYGrowth: 'Revenue Growth',
  expensesQuarterly: 'Total Expenses',
  expenseGrowth: 'Expense Growth',
  operatingProfit: 'Operating Profit',
  operatingProfitGrowth: 'Op. Profit Growth',
  opmCurrent: 'OPM (Current)',
  opmYearAgo: 'OPM (Year Ago)',
  netProfit: 'Net Profit',
  netProfitGrowth: 'Net Profit Growth',
  eps: 'EPS',
  dilutedEPSGrowth: 'EPS Growth',
  otherIncome: 'Other Income',
  pbt: 'PBT',
  interestExpense: 'Interest',
  depreciation: 'Depreciation',
  ebit: 'EBIT',
  equityCapital: 'Equity Capital',
  reserves: 'Reserves',
  totalDebt: 'Total Borrowings',
  totalAssets: 'Total Assets',
  currentAssets: 'Current Assets',
  currentLiabilities: 'Current Liabilities',
  grossBlock: 'Fixed Assets',
  investments: 'Investments',
  cwip: 'CWIP',
  reservesGrowth: 'Reserves Growth',
  totalAssetsGrowth: 'Assets Growth',
  shortTermBorrowingsGrowth: 'ST Borrowing Growth',
  grossBlockGrowth: 'Fixed Assets Growth',
  cfo: 'Cash from Operations',
  cfi: 'Cash from Investing',
  cff: 'Cash from Financing',
  cumulativeCFO5to10y: 'Cumulative CFO (10Y)',
  cumulativeNetProfit5to10y: 'Cumulative NP (10Y)',
  cfoPositiveYearsOf10: 'CFO Positive Years',
  promoterHolding: 'Promoter Holding',
  promoterPledgePct: 'Promoter Pledge',
};

// Format values with proper units
const formatValue = (key: string, value: number): string => {
  const pctKeys = [
    'salesYoYGrowth', 'operatingProfitGrowth', 'netProfitGrowth', 
    'roce', 'roe', 'opmCurrent', 'opmYearAgo', 'expenseGrowth',
    'dilutedEPSGrowth', 'depreciationGrowth', 'reservesGrowth',
    'totalAssetsGrowth', 'shortTermBorrowingsGrowth', 'grossBlockGrowth',
    'promoterHolding', 'promoterPledgePct',
  ];
  
  if (pctKeys.includes(key)) {
    const prefix = value > 0 ? '+' : '';
    return `${prefix}${value.toFixed(1)}%`;
  }
  if (key === 'debtToEquity') return value.toFixed(2) + 'x';
  if (key === 'pe' || key === 'eps') return value.toFixed(2);
  if (key === 'cfoPositiveYearsOf10') return `${value} / 10`;
  
  // Currency values — use compact notation for large numbers
  if (key === 'price' || key === 'bookValue') {
    return `₹${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  }
  if (key === 'marketCap') {
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L Cr`;
    if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K Cr`;
    return `₹${value.toLocaleString()} Cr`;
  }
  // General ₹ values
  if (Math.abs(value) >= 100000) return `₹${(value / 100000).toFixed(2)}L Cr`;
  if (Math.abs(value) >= 1000) return `₹${(value / 1000).toFixed(1)}K Cr`;
  return `₹${value % 1 === 0 ? value.toLocaleString() : value.toFixed(2)}`;
};

// Determine if a key represents a growth/rate metric
const isGrowthKey = (key: string): boolean => {
  return key.toLowerCase().includes('growth') || key === 'roce' || key === 'roe';
};

interface SectionConfig {
  title: string;
  keys: string[];
  icon: any;
  accentClass: string; // tailwind color class prefix
}

// A single metric row inside a section card
function MetricRow({ 
  label, value, numValue, keyName, flag, isLast 
}: { 
  label: string; 
  value: string; 
  numValue: number; 
  keyName: string; 
  flag?: RuleFlag;
  isLast: boolean;
}) {
  const growth = isGrowthKey(keyName);
  const positive = growth && numValue > 0;
  const negative = growth && numValue < 0;

  const valueColor = positive
    ? 'text-emerald-600 dark:text-emerald-400'
    : negative
    ? 'text-rose-600 dark:text-rose-400'
    : 'text-foreground';

  // Flag dot colors
  const flagDot = flag && flag.flag !== 'N/A' ? (
    <span
      className={`inline-block w-[6px] h-[6px] rounded-full shrink-0 ${
        flag.flag === 'GREEN' ? 'bg-emerald-500' :
        flag.flag === 'RED' ? 'bg-rose-500' :
        'bg-amber-500'
      }`}
      title={flag.plain_language_reason}
    />
  ) : null;

  return (
    <div className={`flex items-center justify-between py-[7px] px-0 gap-3 ${!isLast ? 'border-b border-border/40' : ''}`}>
      {/* Label + Flag */}
      <div className="flex items-center gap-2 min-w-0">
        {flagDot}
        <span className="text-[13px] text-muted-foreground truncate leading-tight">{label}</span>
      </div>
      {/* Value + Arrow */}
      <div className="flex items-center gap-1.5 shrink-0">
        {growth && (
          <span className={`${positive ? 'text-emerald-500' : negative ? 'text-rose-500' : 'text-muted-foreground/30'}`}>
            {positive ? <ArrowUpRight className="w-3 h-3" /> : negative ? <ArrowDownRight className="w-3 h-3" /> : <Minus className="w-3 h-3 opacity-30" />}
          </span>
        )}
        <span className={`text-[13px] font-semibold font-mono tabular-nums tracking-tight ${valueColor}`}>
          {value}
        </span>
      </div>
    </div>
  );
}

export function MasterDataTable({ data, aiFlags = [] }: { data: StockMasterData, aiFlags?: RuleFlag[] }) {
  const allEntries = Object.entries(data).filter(([, v]) => v !== null && v !== undefined);
  
  const sections: SectionConfig[] = [
    {
      title: 'Valuation & Returns',
      keys: ['price', 'marketCap', 'pe', 'bookValue', 'roce', 'roe', 'debtToEquity'],
      icon: Activity,
      accentClass: 'indigo',
    },
    {
      title: 'Quarterly Performance',
      keys: [
        'salesQuarterly', 'salesYoYGrowth', 'expensesQuarterly', 'expenseGrowth',
        'operatingProfit', 'operatingProfitGrowth', 'opmCurrent', 'opmYearAgo',
        'netProfit', 'netProfitGrowth', 'eps', 'dilutedEPSGrowth',
        'otherIncome', 'pbt', 'interestExpense', 'depreciation', 'ebit',
      ],
      icon: TrendingUp,
      accentClass: 'teal',
    },
    {
      title: 'Balance Sheet',
      keys: [
        'equityCapital', 'reserves', 'reservesGrowth',
        'totalDebt', 'totalAssets', 'totalAssetsGrowth',
        'currentAssets', 'currentLiabilities',
        'grossBlock', 'grossBlockGrowth', 'investments', 'cwip',
        'shortTermBorrowingsGrowth',
      ],
      icon: Briefcase,
      accentClass: 'violet',
    },
    {
      title: 'Cash Flow',
      keys: [
        'cfo', 'cfi', 'cff',
        'cumulativeCFO5to10y', 'cumulativeNetProfit5to10y',
        'cfoPositiveYearsOf10',
      ],
      icon: DollarSign,
      accentClass: 'amber',
    },
  ];

  // Accent color map for Tailwind classes
  const accentColors: Record<string, { iconBg: string; iconText: string; border: string }> = {
    indigo: { iconBg: 'bg-indigo-500/10', iconText: 'text-indigo-500', border: 'border-indigo-500/20' },
    teal:   { iconBg: 'bg-teal-500/10',   iconText: 'text-teal-500',   border: 'border-teal-500/20' },
    violet: { iconBg: 'bg-violet-500/10',  iconText: 'text-violet-500',  border: 'border-violet-500/20' },
    amber:  { iconBg: 'bg-amber-500/10',   iconText: 'text-amber-500',   border: 'border-amber-500/20' },
  };

  const renderSection = (section: SectionConfig, sectionIdx: number) => {
    const filteredEntries = allEntries.filter(([key]) => section.keys.includes(key));
    // Sort by the order defined in section.keys
    filteredEntries.sort((a, b) => section.keys.indexOf(a[0]) - section.keys.indexOf(b[0]));
    
    if (filteredEntries.length === 0) return null;

    const Icon = section.icon;
    const colors = accentColors[section.accentClass];

    return (
      <motion.div
        key={section.title}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: sectionIdx * 0.06, duration: 0.35 }}
        className="flex flex-col bg-card rounded-xl border border-border/50 overflow-hidden hover:border-border/80 transition-colors duration-200"
      >
        {/* Section Header */}
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border/40 bg-muted/20">
          <div className={`p-1.5 rounded-lg ${colors.iconBg} border ${colors.border}`}>
            <Icon className={`w-3.5 h-3.5 ${colors.iconText}`} />
          </div>
          <h3 className="text-[13px] font-bold text-foreground/85 tracking-wide">{section.title}</h3>
          <span className="ml-auto text-[10px] text-muted-foreground/50 font-medium tabular-nums">{filteredEntries.length} metrics</span>
        </div>

        {/* Metric Rows */}
        <div className="px-4 py-1">
          {filteredEntries.map(([key, value], idx) => {
            const numValue = typeof value === 'number' ? value : parseFloat(value as string);
            const mappedRule = KEY_TO_RULE_MAP[key];
            const flag = aiFlags.find(f => f.rule_id === mappedRule && f.flag !== 'N/A');
            const formattedVal = typeof value === 'number' ? formatValue(key, value) : String(value);

            return (
              <MetricRow
                key={key}
                label={LABEL_MAP[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}
                value={formattedVal}
                numValue={numValue}
                keyName={key}
                flag={flag}
                isLast={idx === filteredEntries.length - 1}
              />
            );
          })}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {sections.map((section, idx) => renderSection(section, idx))}
    </div>
  );
}
