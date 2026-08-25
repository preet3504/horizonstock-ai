import React from 'react';
import { FinalAIAnalysis, HorizonVerdict } from '@/types/stock';
import { CheckCircle2, XCircle, TrendingUp, TrendingDown, Minus, BrainCircuit, Target, Clock, Calendar, Gauge } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const getVerdictStyle = (verdict: string) => {
  switch (verdict.toLowerCase()) {
    case 'buy': return { 
      badge: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30',
      glow: 'shadow-[0_0_12px_rgba(16,185,129,0.15)]',
    };
    case 'avoid': return { 
      badge: 'bg-rose-500/15 text-rose-600 border-rose-500/30',
      glow: 'shadow-[0_0_12px_rgba(244,63,94,0.15)]',
    };
    case 'hold': return { 
      badge: 'bg-amber-500/15 text-amber-600 border-amber-500/30',
      glow: 'shadow-[0_0_12px_rgba(245,158,11,0.15)]',
    };
    default: return { 
      badge: 'bg-slate-500/15 text-slate-500 border-slate-500/30',
      glow: '',
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
  
  const scoreColor = percentage >= 75 ? 'text-emerald-500' : percentage >= 45 ? 'text-amber-500' : 'text-rose-500';
  const barColor = percentage >= 75 ? 'bg-emerald-500' : percentage >= 45 ? 'bg-amber-500' : 'bg-rose-500';
  const barGlow = percentage >= 75 ? 'shadow-[0_0_8px_rgba(16,185,129,0.4)]' : percentage >= 45 ? 'shadow-[0_0_8px_rgba(245,158,11,0.4)]' : 'shadow-[0_0_8px_rgba(244,63,94,0.4)]';

  // Category breakdown
  const categories = ['VAL', 'QTR', 'BAL', 'CF', 'GOV'];
  const catLabels: Record<string, string> = { VAL: 'Valuation', QTR: 'Quarterly', BAL: 'Balance Sheet', CF: 'Cash Flow', GOV: 'Governance' };
  
  return (
    <Card className="border-border/50 bg-card overflow-hidden rounded-2xl">
      <CardContent className="p-5 space-y-4">
        {/* Score Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
              <Gauge className="w-5 h-5 text-indigo-500" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground/70 uppercase tracking-widest">AI Health Score</p>
            </div>
          </div>
          <span className={`text-4xl font-black tracking-tight font-mono ${scoreColor}`}>
            {percentage}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
            className={`h-full rounded-full ${barColor} ${barGlow}`}
          />
        </div>

        {/* Mini Category Breakdown */}
        <div className="grid grid-cols-5 gap-1.5">
          {categories.map(cat => {
            const catFlags = analysis.category_flags.filter(f => f.rule_id.startsWith(cat) && f.flag !== 'N/A');
            const green = catFlags.filter(f => f.flag === 'GREEN').length;
            const total = catFlags.length;
            const pct = total > 0 ? Math.round((green / total) * 100) : 0;
            
            return (
              <div key={cat} className="text-center p-2 bg-muted/30 rounded-lg">
                <div className={`text-sm font-black font-mono ${pct >= 75 ? 'text-emerald-500' : pct >= 45 ? 'text-amber-500' : 'text-rose-500'}`}>
                  {pct}%
                </div>
                <div className="text-[9px] text-muted-foreground/60 font-semibold uppercase tracking-wider mt-0.5 truncate">
                  {catLabels[cat]?.split(' ')[0]}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

/* ───────────── Pros & Cons ───────────── */
export const AIProsCons = ({ analysis }: { analysis: FinalAIAnalysis }) => {
  if (!analysis) return null;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {/* Strengths */}
      <Card className="border-border/50 bg-card overflow-hidden rounded-2xl border-l-[3px] border-l-emerald-500/60">
        <CardContent className="p-5 md:p-6">
          <h3 className="text-sm font-bold text-emerald-600 flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-4 h-4" />
            Strengths
          </h3>
          <ul className="space-y-3">
            {analysis.overall_pros.map((pro, idx) => (
              <motion.li 
                initial={{ opacity: 0, x: -8 }} 
                animate={{ opacity: 1, x: 0 }} 
                transition={{ delay: 0.05 * idx }}
                key={idx} 
                className="text-sm text-foreground/85 flex items-start leading-relaxed"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/60 shrink-0 mt-2 mr-3"></span>
                <span>{pro}</span>
              </motion.li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Risks */}
      <Card className="border-border/50 bg-card overflow-hidden rounded-2xl border-l-[3px] border-l-rose-500/60">
        <CardContent className="p-5 md:p-6">
          <h3 className="text-sm font-bold text-rose-600 flex items-center gap-2 mb-4">
            <XCircle className="w-4 h-4" />
            Risks & Red Flags
          </h3>
          <ul className="space-y-3">
            {analysis.overall_cons.map((con, idx) => (
              <motion.li 
                initial={{ opacity: 0, x: -8 }} 
                animate={{ opacity: 1, x: 0 }} 
                transition={{ delay: 0.05 * idx }}
                key={idx} 
                className="text-sm text-foreground/85 flex items-start leading-relaxed"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500/60 shrink-0 mt-2 mr-3"></span>
                <span>{con}</span>
              </motion.li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

/* ───────────── Horizon Badge ───────────── */
const HorizonBadge = ({ title, data, delay, icon: Icon }: { title: string, data: HorizonVerdict, delay: number, icon: any }) => {
  const style = getVerdictStyle(data.verdict);
  
  const sentences = data.reason
    .split('. ')
    .filter(s => s.trim().length > 0)
    .map(s => {
      let text = s.trim();
      if (!text.endsWith('.')) text += '.';
      return text;
    });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.25 }}
      className="flex flex-col p-4 rounded-xl border border-border/40 bg-background/30 hover:bg-background/60 transition-all duration-200"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <Icon className="w-4 h-4 text-muted-foreground/60" />
          <span className="text-xs font-bold text-foreground/70 uppercase tracking-wider">{title}</span>
        </div>
        <div className={`px-3 py-1 rounded-full border flex items-center gap-1.5 font-bold text-[11px] tracking-wider ${style.badge} ${style.glow}`}>
          {getVerdictIcon(data.verdict)}
          {data.verdict.toUpperCase()}
        </div>
      </div>
      <ul className="space-y-2">
        {sentences.slice(0, 3).map((sentence, idx) => (
          <li key={idx} className="text-xs text-muted-foreground/80 flex items-start leading-relaxed">
            <span className="w-1 h-1 rounded-full bg-muted-foreground/30 shrink-0 mt-1.5 mr-2.5"></span>
            <span className="flex-1">{sentence}</span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
};

/* ───────────── Investment Horizons ───────────── */
export const AIHorizons = ({ analysis }: { analysis: FinalAIAnalysis }) => {
  if (!analysis) return null;
  return (
    <Card className="border-border/50 bg-card flex-1 rounded-2xl flex flex-col">
      <CardHeader className="pb-4 border-b border-border/30">
        <CardTitle className="text-sm font-bold flex items-center gap-2.5 text-foreground/80">
          <Target className="w-4 h-4 text-primary" />
          Investment Horizons
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-3 flex-1 overflow-y-auto">
        <HorizonBadge title="Short Term" data={analysis.horizons.short_term} delay={0.1} icon={Clock} />
        <HorizonBadge title="Medium Term" data={analysis.horizons.medium_term} delay={0.15} icon={Calendar} />
        <HorizonBadge title="Long Term" data={analysis.horizons.long_term} delay={0.2} icon={Target} />
      </CardContent>
    </Card>
  );
};
