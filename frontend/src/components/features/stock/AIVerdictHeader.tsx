import React from 'react';
import { FinalAIAnalysis, HorizonVerdict } from '@/types/stock';
import { CheckCircle2, XCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';

interface AIVerdictHeaderProps {
  analysis: FinalAIAnalysis;
}

const getVerdictColor = (verdict: string) => {
  switch (verdict.toLowerCase()) {
    case 'buy': return 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30';
    case 'avoid': return 'bg-rose-500/15 text-rose-500 border-rose-500/30';
    case 'hold': return 'bg-amber-500/15 text-amber-500 border-amber-500/30';
    default: return 'bg-slate-500/15 text-slate-500 border-slate-500/30';
  }
};

const getVerdictIcon = (verdict: string) => {
  switch (verdict.toLowerCase()) {
    case 'buy': return <TrendingUp className="w-4 h-4 mr-1.5" />;
    case 'avoid': return <TrendingDown className="w-4 h-4 mr-1.5" />;
    case 'hold': return <Minus className="w-4 h-4 mr-1.5" />;
    default: return null;
  }
};

const HorizonBadge = ({ title, data }: { title: string, data: HorizonVerdict }) => (
  <div className="flex flex-col items-center p-4 rounded-xl glass-panel border border-border/50 bg-background/40 hover:bg-background/60 transition-all duration-300">
    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">{title}</span>
    <div className={`px-4 py-1.5 rounded-full border flex items-center justify-center font-bold text-sm tracking-wide ${getVerdictColor(data.verdict)}`}>
      {getVerdictIcon(data.verdict)}
      {data.verdict.toUpperCase()}
    </div>
    <p className="text-[11px] text-muted-foreground/80 mt-3 text-center leading-relaxed max-w-[140px]">
      {data.reason}
    </p>
  </div>
);

export function AIVerdictHeader({ analysis }: AIVerdictHeaderProps) {
  if (!analysis) return null;

  const score = analysis.category_flags.reduce((acc, f) => acc + (f.flag === 'GREEN' ? 1 : 0), 0);
  const total = analysis.category_flags.filter(f => f.flag !== 'N/A').length;
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full space-y-6"
    >
      <div className="flex items-center gap-4 mb-2">
        <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center">
          <span className="bg-primary/20 p-2 rounded-lg mr-3">
            <span className="bg-primary w-2 h-2 rounded-full block animate-pulse shadow-[0_0_10px_var(--color-primary)]"></span>
          </span>
          AI Fundamental Analysis
        </h2>
        <div className="ml-auto flex items-center gap-2 px-3 py-1 bg-muted/30 rounded-full border border-border/50">
          <span className="text-xs text-muted-foreground font-medium">Rule Score:</span>
          <span className={`text-sm font-bold ${percentage >= 75 ? 'text-emerald-500' : percentage >= 45 ? 'text-amber-500' : 'text-rose-500'}`}>
            {percentage}/100
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Horizons Card */}
        <Card className="col-span-1 lg:col-span-5 border-border/50 bg-gradient-to-br from-background to-muted/20 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-32 bg-primary/5 rounded-full blur-[100px] -mr-16 -mt-16 pointer-events-none"></div>
          <CardContent className="p-6 relative z-10">
            <h3 className="text-sm font-semibold text-foreground/80 mb-5 flex items-center">
              Holding Horizons
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <HorizonBadge title="Short" data={analysis.horizons.short_term} />
              <HorizonBadge title="Medium" data={analysis.horizons.medium_term} />
              <HorizonBadge title="Long" data={analysis.horizons.long_term} />
            </div>
          </CardContent>
        </Card>

        {/* Pros & Cons Card */}
        <Card className="col-span-1 lg:col-span-7 border-border/50 bg-background shadow-lg">
          <CardContent className="p-6 h-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full">
              
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-emerald-500 flex items-center">
                  <CheckCircle2 className="w-4 h-4 mr-2" /> Structural Strengths
                </h3>
                <ul className="space-y-3">
                  {analysis.overall_pros.map((pro, idx) => (
                    <motion.li 
                      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 * idx }}
                      key={idx} className="text-sm text-muted-foreground flex items-start"
                    >
                      <span className="text-emerald-500/50 mr-2 mt-0.5">•</span>
                      <span className="leading-relaxed">{pro}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>

              <div className="space-y-4 relative">
                <div className="absolute -left-4 top-0 bottom-0 w-px bg-border/50 hidden md:block"></div>
                <h3 className="text-sm font-semibold text-rose-500 flex items-center">
                  <XCircle className="w-4 h-4 mr-2" /> Key Risks & Red Flags
                </h3>
                <ul className="space-y-3">
                  {analysis.overall_cons.map((con, idx) => (
                    <motion.li 
                      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 * idx }}
                      key={idx} className="text-sm text-muted-foreground flex items-start"
                    >
                      <span className="text-rose-500/50 mr-2 mt-0.5">•</span>
                      <span className="leading-relaxed">{con}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>

            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
