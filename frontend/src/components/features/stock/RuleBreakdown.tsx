import React, { useState } from 'react';
import { RuleFlag } from '@/types/stock';
import { ChevronDown, ChevronRight, AlertTriangle } from 'lucide-react';

const CATEGORY_MAP: Record<string, string> = {
  VAL: 'Valuation & Return Ratios',
  QTR: 'Quarterly & Trailing Performance',
  BAL: 'Balance Sheet Strength',
  CF: 'Cash Flow Quality',
  GOV: 'Governance & Ownership',
};

const CATEGORIES = ['VAL', 'QTR', 'BAL', 'CF', 'GOV'];

const getFlagStyle = (flag: string) => {
  switch (flag) {
    case 'GREEN': return 'bg-gain';
    case 'YELLOW': return 'bg-caution';
    case 'RED': return 'bg-loss';
    default: return 'bg-muted';
  }
};

const extractMetric = (reasoning: string) => {
  // Simple heuristic: Take the first part of the calculation reasoning before numbers if possible, 
  // or just return a default text. Since we only have rule_id, we just use rule_id as ID and calculation as the value/reasoning.
  // We'll show the reasoning in the Value/Why columns.
  const parts = reasoning.split('. ');
  return parts[0] || reasoning;
};

export function RuleBreakdown({ flags }: { flags: RuleFlag[] }) {
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({});

  const toggleCat = (cat: string) => {
    setExpandedCats(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  const hasHardOverride = flags.some(f => f.flag === 'RED' && ['CF-01', 'GOV-06', 'VAL-02'].includes(f.rule_id));

  return (
    <div className="border border-border bg-background flex flex-col mt-8">
      <div className="px-4 py-3 border-b border-border bg-muted/20 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-heading font-semibold text-foreground tracking-tight">Rule Breakdown</h2>
          <p className="text-xs text-muted-foreground mt-1">All 34 deterministic fundamental rules evaluated</p>
        </div>
      </div>

      {hasHardOverride && (
        <div className="px-4 py-3 border-b border-loss/20 bg-loss/5 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-loss shrink-0 mt-0.5" />
          <p className="text-sm font-medium text-loss">
            Critical override triggered: A severe red flag (Distress/Qualified Opinion/Negative Equity) has capped the overall composite score.
          </p>
        </div>
      )}

      <div className="flex flex-col">
        {CATEGORIES.map(cat => {
          const catFlags = flags.filter(f => f.rule_id.startsWith(cat));
          if (catFlags.length === 0) return null;
          
          const isExpanded = expandedCats[cat] === undefined ? false : expandedCats[cat];

          return (
            <div key={cat} className="border-b border-border last:border-0">
              <button 
                onClick={() => toggleCat(cat)}
                className="w-full flex items-center justify-between px-4 py-3 bg-muted/5 hover:bg-muted/20 transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                  <span className="font-semibold text-sm">{CATEGORY_MAP[cat]}</span>
                </div>
                <div className="flex gap-1">
                  {['GREEN', 'YELLOW', 'RED'].map(flagType => {
                    const count = catFlags.filter(f => f.flag === flagType).length;
                    if (count === 0) return null;
                    return (
                      <span key={flagType} className={`px-1.5 py-0.5 text-[10px] font-bold rounded-sm text-background ${getFlagStyle(flagType)}`}>
                        {count}
                      </span>
                    );
                  })}
                </div>
              </button>
              
              {isExpanded && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left whitespace-nowrap">
                    <thead className="bg-background text-muted-foreground border-y border-border text-xs uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-2 font-semibold">ID</th>
                        <th className="px-4 py-2 font-semibold">Flag</th>
                        <th className="px-4 py-2 font-semibold min-w-[200px]">Calculation / Value</th>
                        <th className="px-4 py-2 font-semibold min-w-[300px]">Why</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {catFlags.map(f => (
                        <tr key={f.rule_id} className="hover:bg-muted/10">
                          <td className="px-4 py-3 font-mono text-xs font-semibold">{f.rule_id}</td>
                          <td className="px-4 py-3">
                            {f.flag !== 'N/A' ? (
                              <span className={`inline-block w-2.5 h-2.5 rounded-full ${getFlagStyle(f.flag)}`} title={f.flag} />
                            ) : (
                              <span className="text-xs text-muted-foreground font-medium">N/A</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-foreground/80 font-mono text-xs whitespace-normal line-clamp-2" title={f.calculation_reasoning}>
                            {f.calculation_reasoning || '-'}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground whitespace-normal text-xs" title={f.plain_language_reason}>
                            {f.plain_language_reason || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
