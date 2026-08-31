'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, ShieldAlert, Activity, BookOpen, AlertTriangle } from 'lucide-react';
import { useStockAnalysis } from '@/hooks/api/useStockAnalysis';
import { MasterDataTable } from '@/components/features/dashboard/MasterDataTable';
import { HistoricalTable } from '@/components/features/dashboard/HistoricalTable';
import TradingViewWidget from '@/components/features/charts/TradingViewWidget';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from 'framer-motion';
import { AIScore, AIProsCons, AIHorizons } from '@/components/features/stock/AIVerdictHeader';
import { RuleBreakdown } from '@/components/features/stock/RuleBreakdown';

export default function StockDashboard() {
  const params = useParams();
  const symbol = decodeURIComponent((params?.symbol as string) || '').toUpperCase();

  const { data, isLoading, isError, error, refetch } = useStockAnalysis(symbol);

  return (
    <div className="min-h-screen relative z-10 scroll-smooth bg-background text-foreground flex flex-col">

      {/* Sticky Top Bar */}
      <header className="sticky top-0 z-50 bg-background border-b border-border shadow-sm">
        <div className="max-w-[1700px] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-muted-foreground hover:text-primary transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-baseline gap-2">
              <h1 className="text-2xl font-heading font-semibold tracking-tight">
                {symbol}
              </h1>
              <span className="text-muted-foreground text-sm font-medium hidden sm:inline-block">
                · {data?.summary?.company_name || 'Loading...'}
              </span>
            </div>
            {data?.master_data?.price && (
              <div className="ml-2 flex items-baseline gap-2 tabular-nums">
                <span className="text-xl font-bold tracking-tight">
                  ₹{data.master_data.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </span>
              </div>
            )}
            {data?.ai_analysis && (
              <div className="ml-4 flex items-center gap-2">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Health</span>
                <span className={`text-sm font-bold font-mono px-2 py-0.5 rounded-sm bg-muted/30 border border-border ${(data.ai_analysis.category_flags.reduce((a, f) => a + (f.flag === 'GREEN' ? 1 : 0), 0) /
                    Math.max(1, data.ai_analysis.category_flags.filter(f => f.flag !== 'N/A').length)) >= 0.75
                    ? 'text-gain' : 'text-caution'
                  }`}>
                  {Math.round((data.ai_analysis.category_flags.reduce((a, f) => a + (f.flag === 'GREEN' ? 1 : 0), 0) /
                    Math.max(1, data.ai_analysis.category_flags.filter(f => f.flag !== 'N/A').length)) * 100)}
                </span>
              </div>
            )}
          </div>
          <button
            onClick={() => refetch()}
            disabled={isLoading}
            className="text-sm font-medium flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Syncing...' : 'Refresh'}
          </button>
        </div>
      </header>

      <div className="max-w-[1700px] w-full mx-auto px-4 py-6 space-y-8 flex-1">

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <Skeleton className="h-[400px] lg:col-span-8 rounded-sm bg-muted/20" />
              <div className="lg:col-span-4 space-y-6">
                <Skeleton className="h-[200px] rounded-sm bg-muted/20" />
                <Skeleton className="h-[200px] rounded-sm bg-muted/20" />
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="p-8 bg-loss/10 border border-loss/20 rounded-sm text-center space-y-3 max-w-lg mx-auto mt-12">
            <ShieldAlert className="w-10 h-10 text-loss mx-auto" />
            <h3 className="text-loss font-bold text-lg">Failed to Analyze</h3>
            <p className="text-sm text-muted-foreground">{error?.message}</p>
          </div>
        )}

        {/* Main Content */}
        {data && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.05 }}
            className="space-y-8"
          >
            {/* ───── Row 1: Chart + Scores/Horizons ───── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-8 h-[500px] border border-border bg-background">
                <TradingViewWidget symbol={symbol} />
              </div>

              <div className="lg:col-span-4 flex flex-col gap-6">
                {data.ai_analysis ? (
                  <>
                    <AIScore analysis={data.ai_analysis} />
                    <AIHorizons analysis={data.ai_analysis} />
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center bg-muted/10 border border-border p-8 gap-3">
                    <AlertTriangle className="w-8 h-8 text-caution" />
                    <p className="text-sm text-muted-foreground font-medium">AI analysis not available.</p>
                  </div>
                )}
              </div>
            </div>

            {/* ───── Row 2: Pros & Cons ───── */}
            {data.ai_analysis && (
              <div className="border border-border bg-background p-6">
                <AIProsCons analysis={data.ai_analysis} />
              </div>
            )}

            {/* ───── Row 3: Rule Breakdown (NEW) ───── */}
            {data.ai_analysis?.category_flags && (
              <RuleBreakdown flags={data.ai_analysis.category_flags} />
            )}

            {/* ───── Row 4: Fundamental Snapshot ───── */}
            <section className="border border-border bg-background">
              <div className="px-4 py-3 border-b border-border bg-muted/20 flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                <h2 className="text-lg font-heading font-semibold text-foreground tracking-tight">Fundamental Snapshot</h2>
              </div>
              <div className="p-4">
                <MasterDataTable data={data.master_data} aiFlags={data.ai_analysis?.category_flags} />
              </div>
            </section>

            {/* ───── Row 5: Historical Deep Dive ───── */}
            <section className="border border-border bg-background">
              <div className="px-4 py-3 border-b border-border bg-muted/20 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" />
                <h2 className="text-lg font-heading font-semibold text-foreground tracking-tight">Historical Deep Dive</h2>
              </div>

              <Tabs defaultValue="quarterly" className="w-full">
                <TabsList className="flex flex-wrap h-auto bg-background p-2 justify-start gap-2 border-b border-border">
                  {data.fundamentals?.quarterly_results && <TabsTrigger value="quarterly" className="rounded-sm px-4 py-1.5 text-sm font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none border border-transparent data-[state=active]:border-primary">Quarterly</TabsTrigger>}
                  {data.fundamentals?.profit_loss && <TabsTrigger value="pl" className="rounded-sm px-4 py-1.5 text-sm font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none border border-transparent data-[state=active]:border-primary">Profit & Loss</TabsTrigger>}
                  {data.fundamentals?.balance_sheet && <TabsTrigger value="bs" className="rounded-sm px-4 py-1.5 text-sm font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none border border-transparent data-[state=active]:border-primary">Balance Sheet</TabsTrigger>}
                  {data.fundamentals?.cash_flow && <TabsTrigger value="cf" className="rounded-sm px-4 py-1.5 text-sm font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none border border-transparent data-[state=active]:border-primary">Cash Flows</TabsTrigger>}
                  {data.fundamentals?.shareholding && <TabsTrigger value="sh" className="rounded-sm px-4 py-1.5 text-sm font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none border border-transparent data-[state=active]:border-primary">Shareholding</TabsTrigger>}
                </TabsList>

                {data.fundamentals?.quarterly_results && (
                  <TabsContent value="quarterly" className="mt-0 focus-visible:outline-none">
                    <HistoricalTable title="Quarterly Results" data={data.fundamentals.quarterly_results} dateKey="date" />
                  </TabsContent>
                )}
                {data.fundamentals?.profit_loss && (
                  <TabsContent value="pl" className="mt-0 focus-visible:outline-none">
                    <HistoricalTable title="Annual Profit & Loss" data={data.fundamentals.profit_loss} dateKey="year" />
                  </TabsContent>
                )}
                {data.fundamentals?.balance_sheet && (
                  <TabsContent value="bs" className="mt-0 focus-visible:outline-none">
                    <HistoricalTable title="Balance Sheet" data={data.fundamentals.balance_sheet} dateKey="year" />
                  </TabsContent>
                )}
                {data.fundamentals?.cash_flow && (
                  <TabsContent value="cf" className="mt-0 focus-visible:outline-none">
                    <HistoricalTable title="Cash Flows" data={data.fundamentals.cash_flow} dateKey="year" />
                  </TabsContent>
                )}
                {data.fundamentals?.shareholding && (
                  <TabsContent value="sh" className="mt-0 focus-visible:outline-none">
                    <HistoricalTable title="Shareholding Pattern" data={data.fundamentals.shareholding} dateKey="date" />
                  </TabsContent>
                )}
              </Tabs>
            </section>

          </motion.div>
        )}
      </div>

      {/* Disclaimer */}
      <footer className="mt-auto border-t border-border bg-muted/10">
        <div className="max-w-[1700px] mx-auto px-4 py-6 text-xs text-muted-foreground text-center font-medium">
          This is an analytical decision-support tool, not investment advice. The final decision rests with the user.
        </div>
      </footer>
    </div>
  );
}
