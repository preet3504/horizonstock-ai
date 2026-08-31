import React from 'react';
import { FinalAIAnalysis, HorizonVerdict } from '@/types/stock';
import { CheckCircle2, XCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react';

const getVerdictStyle = (verdict: string) => {
  switch (verdict.toLowerCase()) {
    case 'buy': return { 
      badge: 'bg-gain/20 text-gain',
    };
    case 'avoid': return { 
      badge: 'bg-loss/20 text-loss',
    };
    case 'hold': return { 
      badge: 'bg-caution/20 text-caution',
    };
    default: return { 
      badge: 'bg-muted/50 text-muted-foreground',
    };
  }
};

const getVerdictIcon = (verdict: string) => {
  switch (verdict.toLowerCase()) {
    case 'buy': return <TrendingUp className="w-3.5 h-3.5" />;
    case 'avoid': return <TrendingDown className="w-3.5 h-3.5" />;
    case 'hold': return <Minus className="w-3.5 h-3.5" />;
    default: return null;
  }
};

/* ───────────── AI Composite Score ───────────── */
export const AIScore = ({ analysis }: { analysis: FinalAIAnalysis }) => {
  if (!analysis) return null;
  const score = analysis.category_flags.reduce((acc, f) => acc + (f.flag === 'GREEN' ? 1 : 0), 0);
  const total = analysis.category_flags.filter(f => f.flag !== 'N/A').length;
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
  
  const scoreColor = percentage >= 75 ? 'text-gain' : percentage >= 45 ? 'text-caution' : 'text-loss';

  // Category breakdown
  const categories = [
    { id: 'VAL', label: 'Valuation' },
    { id: 'QTR', label: 'Quarterly' },
    { id: 'BAL', label: 'Balance' },
    { id: 'CF', label: 'Cash Flow' },
    { id: 'GOV', label: 'Governance' },
  ];
  
  return (
    <div className="border border-border bg-background p-4 flex flex-col gap-4">
      <div className="flex items-end justify-between">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Composite Score</h3>
        <div className="flex items-baseline gap-1">
          <div className="flex mb-1">
            {Array.from({ length: 10 }).map((_, i) => (
              <div 
                key={i} 
                className={`w-2 h-4 mr-0.5 ${i < Math.round(percentage / 10) ? 'bg-primary' : 'bg-muted'}`}
              />
            ))}
          </div>
          <span className={`text-xl font-mono font-bold ml-2 ${scoreColor}`}>{percentage}/100</span>
        </div>
      </div>

      <div className="space-y-2">
        {categories.map(cat => {
          const catFlags = analysis.category_flags.filter(f => f.rule_id.startsWith(cat.id) && f.flag !== 'N/A');
          const green = catFlags.filter(f => f.flag === 'GREEN').length;
          const total = catFlags.length;
          const pct = total > 0 ? Math.round((green / total) * 100) : 0;
          
          const barColor = pct >= 75 ? 'bg-gain' : pct >= 45 ? 'bg-caution' : 'bg-loss';
          
          return (
            <div key={cat.id} className="flex items-center gap-3 text-sm">
              <div className="w-24 text-muted-foreground">{cat.label}</div>
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div className={`h-full ${barColor}`} style={{ width: `${pct}%` }} />
              </div>
              <div className="w-10 text-right font-mono text-xs font-semibold">{pct}%</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ───────────── Pros & Cons ───────────── */
export const AIProsCons = ({ analysis }: { analysis: FinalAIAnalysis }) => {
  if (!analysis) return null;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Strengths */}
      <div>
        <h3 className="text-sm font-bold text-gain flex items-center gap-2 mb-3 uppercase tracking-wider">
          <CheckCircle2 className="w-4 h-4" />
          Strengths
        </h3>
        <ul className="space-y-2">
          {analysis.overall_pros.map((pro, idx) => (
            <li key={idx} className="text-sm text-foreground flex items-start leading-snug">
              <span className="w-1.5 h-1.5 rounded-full bg-gain shrink-0 mt-1.5 mr-2" />
              <span>{pro}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Risks */}
      <div>
        <h3 className="text-sm font-bold text-loss flex items-center gap-2 mb-3 uppercase tracking-wider">
          <XCircle className="w-4 h-4" />
          Risks & Red Flags
        </h3>
        <ul className="space-y-2">
          {analysis.overall_cons.map((con, idx) => (
            <li key={idx} className="text-sm text-foreground flex items-start leading-snug">
              <span className="w-1.5 h-1.5 rounded-full bg-loss shrink-0 mt-1.5 mr-2" />
              <span>{con}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

/* ───────────── Horizon Badge ───────────── */
const HorizonRow = ({ title, data }: { title: string, data: HorizonVerdict }) => {
  const style = getVerdictStyle(data.verdict);
  
  return (
    <div className="flex items-start gap-4 py-3 border-b border-border last:border-0">
      <div className="w-20 pt-0.5">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</div>
      </div>
      <div className={`px-2 py-0.5 rounded-sm flex items-center gap-1 font-bold text-xs tracking-wider uppercase shrink-0 ${style.badge}`}>
        {getVerdictIcon(data.verdict)}
        {data.verdict}
      </div>
      <div className="text-sm text-foreground/90 leading-snug">
        {data.reason}
      </div>
    </div>
  );
};

/* ───────────── Investment Horizons ───────────── */
export const AIHorizons = ({ analysis }: { analysis: FinalAIAnalysis }) => {
  if (!analysis) return null;
  return (
    <div className="border border-border bg-background flex flex-col">
      <div className="px-4 py-2 border-b border-border bg-muted/20">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
          Horizons
        </h3>
      </div>
      <div className="px-4 flex flex-col">
        <HorizonRow title="Short" data={analysis.horizons.short_term} />
        <HorizonRow title="Medium" data={analysis.horizons.medium_term} />
        <HorizonRow title="Long" data={analysis.horizons.long_term} />
      </div>
    </div>
  );
};
