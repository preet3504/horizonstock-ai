import { StockMasterData, RuleFlag } from "@/types/stock"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { motion } from "framer-motion"
import { Activity, Briefcase, TrendingUp, DollarSign } from "lucide-react"

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

export function MasterDataTable({ data, aiFlags = [] }: { data: StockMasterData, aiFlags?: RuleFlag[] }) {
  const entries = Object.entries(data).filter(([key, value]) => value !== null);

  const groups = {
    Valuation: { keys: ['price', 'pe', 'bookValue', 'roce', 'roe', 'debtToEquity'], icon: Activity },
    Quarterly: { keys: ['salesQuarterly', 'salesYoYGrowth', 'operatingProfit', 'netProfit', 'eps'], icon: TrendingUp },
    BalanceSheet: { keys: ['equityCapital', 'reserves', 'totalDebt', 'totalAssets'], icon: Briefcase },
    CashFlow: { keys: ['cfo', 'cfi', 'cff', 'cumulativeCFO5to10y'], icon: DollarSign }
  };

  const renderSection = (title: string, groupData: { keys: string[], icon: any }) => {
    const filteredEntries = entries.filter(([key]) => groupData.keys.includes(key));
    if (filteredEntries.length === 0) return null;
    const Icon = groupData.icon;

    return (
      <div className="space-y-3" id={title.toLowerCase().replace(' ', '-')}>
        <h3 className="text-lg font-bold flex items-center text-foreground gap-2">
          <div className="p-1.5 bg-primary/10 rounded-md text-primary ring-1 ring-primary/20">
            <Icon className="w-4 h-4" />
          </div>
          {title}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {filteredEntries.map(([key, value], idx) => {
            const numValue = typeof value === 'number' ? value : parseFloat(value as string);
            const isGrowth = key.toLowerCase().includes('growth') || key.toLowerCase().includes('roce') || key.toLowerCase().includes('roe');
            const isNegative = isGrowth && numValue < 0;
            const isPositive = isGrowth && numValue > 0;
            
            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                whileHover={{ scale: 1.02 }}
                className="glass-card p-3 rounded-xl flex flex-col justify-between overflow-hidden relative group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-muted-foreground block truncate">
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </span>
                  
                  {/* AI Flag Indicator */}
                  {(() => {
                    const mappedRule = KEY_TO_RULE_MAP[key];
                    const flag = aiFlags.find(f => f.rule_id === mappedRule && f.flag !== 'N/A');
                    if (!flag) return null;
                    
                    const colorClass = flag.flag === 'GREEN' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 
                                       flag.flag === 'RED' ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]' : 
                                       'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]';
                                       
                    return (
                      <div 
                        className={`w-2 h-2 rounded-full ${colorClass} cursor-help`}
                        title={flag.plain_language_reason}
                      />
                    );
                  })()}
                </div>
                <span className={`text-lg font-bold tracking-tight font-mono truncate ${
                  isPositive ? 'text-emerald-600' : 
                  isNegative ? 'text-destructive' : 
                  'text-foreground'
                }`}>
                  {typeof value === 'number' ? 
                    (value % 1 === 0 ? value.toLocaleString() : value.toFixed(2)) 
                    : value?.toString()}
                </span>
              </motion.div>
            )
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      {renderSection('Valuation', groups.Valuation)}
      {renderSection('Quarterly', groups.Quarterly)}
      {renderSection('Balance Sheet', groups.BalanceSheet)}
      {renderSection('Cash Flow', groups.CashFlow)}
    </div>
  );
}
