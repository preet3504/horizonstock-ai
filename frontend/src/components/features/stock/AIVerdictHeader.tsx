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
    case 'buy': return 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30';
    case 'avoid': return 'bg-rose-500/15 text-rose-600 border-rose-500/30';
    case 'hold': return 'bg-amber-500/15 text-amber-600 border-amber-500/30';
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

const HorizonBadge = ({ title, data, delay }: { title: string, data: HorizonVerdict, delay: number }) => {
  // Split into sentences for bullet points, cleaning up periods
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
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="flex flex-col h-full p-5 md:p-6 rounded-2xl glass-panel border border-border/50 bg-background/50 hover:bg-background/80 hover:shadow-md transition-all duration-300"
    >
      <div className="flex items-center justify-between mb-5 pb-4 border-b border-border/40">
        <div className="flex flex-col">
          <span className="text-sm font-bold text-foreground/80 uppercase tracking-widest">{title}</span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">Horizon</span>
        </div>
        <div className={`px-4 py-1.5 rounded-full border flex items-center justify-center font-bold text-sm tracking-wide ${getVerdictColor(data.verdict)}`}>
          {getVerdictIcon(data.verdict)}
          {data.verdict.toUpperCase()}
        </div>
      </div>
      <div className="flex-1">
        <ul className="space-y-3">
          {sentences.map((sentence, idx) => (
            <li key={idx} className="text-sm text-foreground/90 flex items-start leading-relaxed">
              <span className="text-primary/60 mr-2.5 mt-2 w-1.5 h-1.5 rounded-full bg-current shrink-0"></span>
              <span className="flex-1">{sentence}</span>
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
};

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
      className="w-full space-y-8"
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-2 justify-between pb-2">
        <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center">
          <span className="bg-primary/20 p-2 rounded-lg mr-3">
            <span className="bg-primary w-2 h-2 rounded-full block animate-pulse shadow-[0_0_10px_var(--color-primary)]"></span>
          </span>
          AI Fundamental Analysis
        </h2>
        <div className="flex items-center gap-3 px-4 py-2 bg-muted/40 rounded-xl border border-border/50">
          <span className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Composite Score:</span>
          <span className={`text-xl font-black ${percentage >= 75 ? 'text-emerald-500' : percentage >= 45 ? 'text-amber-500' : 'text-rose-500'}`}>
            {percentage}/100
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        
        {/* Pros & Cons Card */}
        <Card className="border-border/50 bg-background shadow-md overflow-hidden rounded-2xl">
          <CardContent className="p-0">
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border/50">
              
              <div className="p-6 sm:p-8 space-y-6 bg-emerald-500/5">
                <h3 className="text-base font-bold text-emerald-600 flex items-center tracking-wide">
                  <CheckCircle2 className="w-5 h-5 mr-2.5" /> STRUCTURAL STRENGTHS
                </h3>
                <ul className="space-y-4">
                  {analysis.overall_pros.map((pro, idx) => (
                    <motion.li 
                      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 * idx }}
                      key={idx} className="text-base text-foreground/90 flex items-start leading-relaxed"
                    >
                      <span className="text-emerald-500 mr-3 mt-1 text-lg leading-none shrink-0">•</span>
                      <span>{pro}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>

              <div className="p-6 sm:p-8 space-y-6 bg-rose-500/5">
                <h3 className="text-base font-bold text-rose-600 flex items-center tracking-wide">
                  <XCircle className="w-5 h-5 mr-2.5" /> KEY RISKS & RED FLAGS
                </h3>
                <ul className="space-y-4">
                  {analysis.overall_cons.map((con, idx) => (
                    <motion.li 
                      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 * idx }}
                      key={idx} className="text-base text-foreground/90 flex items-start leading-relaxed"
                    >
                      <span className="text-rose-500 mr-3 mt-1 text-lg leading-none shrink-0">•</span>
                      <span>{con}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>

            </div>
          </CardContent>
        </Card>

        {/* Horizons Card */}
        <Card className="border-border/50 bg-gradient-to-br from-background to-muted/20 shadow-md relative overflow-hidden rounded-2xl">
          <div className="absolute top-0 right-0 p-40 bg-primary/5 rounded-full blur-[120px] -mr-20 -mt-20 pointer-events-none"></div>
          <CardContent className="p-6 sm:p-8 relative z-10">
            <h3 className="text-lg font-bold text-foreground mb-6 flex items-center">
              Investment Horizons
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <HorizonBadge title="Short Term" data={analysis.horizons.short_term} delay={0.1} />
              <HorizonBadge title="Medium Term" data={analysis.horizons.medium_term} delay={0.2} />
              <HorizonBadge title="Long Term" data={analysis.horizons.long_term} delay={0.3} />
            </div>
          </CardContent>
        </Card>

      </div>
    </motion.div>
  );
}
