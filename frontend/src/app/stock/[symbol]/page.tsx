'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, Activity, ShieldAlert, BookOpen, AlertTriangle } from 'lucide-react';
import { useStockAnalysis } from '@/hooks/api/useStockAnalysis';
import { MasterDataTable } from '@/components/features/dashboard/MasterDataTable';
import { HistoricalTable } from '@/components/features/dashboard/HistoricalTable';
import TradingViewWidget from '@/components/features/charts/TradingViewWidget';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from 'framer-motion';
import { AIScore, AIProsCons, AIHorizons } from '@/components/features/stock/AIVerdictHeader';

export default function StockDashboard() {
  const params = useParams();
  const symbol = decodeURIComponent((params?.symbol as string) || '').toUpperCase();

  const { data, isLoading, isError, error, refetch } = useStockAnalysis(symbol);

  return (
    <div className="min-h-screen relative z-10 scroll-smooth bg-background">
      
      {/* Compact Top Bar */}
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/40"
      >
        <div className="max-w-[1600px] mx-auto px-4 md:px-6 lg:px-8 py-3 flex items-center justify-between">
          
          <div className="flex items-center gap-4 md:gap-6">
            <Link href="/" className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors p-2 -ml-2 rounded-lg hover:bg-primary/5">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            
            <div className="flex items-baseline gap-3">
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-foreground leading-none">
                {symbol}
              </h1>
              <span className="text-muted-foreground text-sm font-medium hidden sm:inline-block">
                {data?.summary?.company_name || ''}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {data?.master_data?.price && (
              <div className="flex items-baseline gap-2">
                <span className="text-2xl md:text-3xl font-black text-foreground font-mono tracking-tight leading-none">
                  ₹{data.master_data.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </span>
              </div>
            )}
            <Button 
              variant="outline" 
              size="sm"
              className="font-semibold rounded-lg border-border/50 hover:bg-primary/5 hover:text-primary hover:border-primary/30 transition-all h-9 px-3" 
              onClick={() => refetch()} 
              disabled={isLoading}
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Syncing' : 'Refresh'}
            </Button>
          </div>
        </div>
      </motion.header>

      <div className="max-w-[1600px] mx-auto px-4 md:px-6 lg:px-8 py-6 space-y-8">
        
        {/* Loading State */}
        {isLoading && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
              <Skeleton className="h-[560px] xl:col-span-8 rounded-2xl" />
              <div className="xl:col-span-4 space-y-6">
                <Skeleton className="h-[100px] rounded-2xl" />
                <Skeleton className="h-[440px] rounded-2xl" />
              </div>
            </div>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
            </div>
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="p-8 bg-rose-500/5 border border-rose-500/20 rounded-2xl text-center space-y-3 max-w-lg mx-auto mt-12">
            <ShieldAlert className="w-10 h-10 text-rose-500 mx-auto" />
            <h3 className="text-rose-500 font-bold text-lg">Failed to Analyze</h3>
            <p className="text-sm text-muted-foreground">{error?.message}</p>
          </div>
        )}

        {/* Main Content */}
        {data && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.05 }}
            className="space-y-10"
          >
            {/* ───── Row 1: Chart + AI Sidebar ───── */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
              
              {/* Chart — Full width on mobile, 8 cols on desktop */}
              <div className="xl:col-span-8">
                <TradingViewWidget symbol={symbol} />
              </div>

              {/* AI Sidebar — Score + Horizons stacked */}
              <div className="xl:col-span-4 flex flex-col gap-5">
                {data.ai_analysis ? (
                  <>
                    <AIScore analysis={data.ai_analysis} />
                    <AIHorizons analysis={data.ai_analysis} />
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center bg-card border border-border/50 rounded-2xl p-8 gap-3">
                    <AlertTriangle className="w-8 h-8 text-amber-500/60" />
                    <p className="text-sm text-muted-foreground font-medium">AI analysis not available for this stock.</p>
                  </div>
                )}
              </div>
            </div>

            {/* ───── Row 2: AI Pros & Cons (full width) ───── */}
            {data.ai_analysis && (
              <AIProsCons analysis={data.ai_analysis} />
            )}

            {/* ───── Row 3: Fundamental Metrics ───── */}
            <section className="space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-primary/10 rounded-lg text-primary border border-primary/20">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-foreground tracking-tight leading-none">Fundamental Snapshot</h2>
                  <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">Latest quarter & annual key metrics</p>
                </div>
              </div>
              <MasterDataTable data={data.master_data} aiFlags={data.ai_analysis?.category_flags} />
            </section>

            {/* ───── Row 4: Historical Data Tables ───── */}
            <section className="space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-primary/10 rounded-lg text-primary border border-primary/20">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-foreground tracking-tight leading-none">Historical Deep Dive</h2>
                  <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">Multi-year financial statements</p>
                </div>
              </div>
              
              <Tabs defaultValue="quarterly" className="w-full">
                <TabsList className="flex flex-wrap h-auto bg-muted/40 p-0.5 rounded-lg justify-start gap-0.5 border border-border/30">
                  {data.fundamentals?.quarterly_results && <TabsTrigger value="quarterly" className="rounded-md px-3.5 py-1.5 text-[13px] font-semibold data-[state=active]:shadow-sm">Quarterly</TabsTrigger>}
                  {data.fundamentals?.profit_loss && <TabsTrigger value="pl" className="rounded-md px-3.5 py-1.5 text-[13px] font-semibold data-[state=active]:shadow-sm">Profit & Loss</TabsTrigger>}
                  {data.fundamentals?.balance_sheet && <TabsTrigger value="bs" className="rounded-md px-3.5 py-1.5 text-[13px] font-semibold data-[state=active]:shadow-sm">Balance Sheet</TabsTrigger>}
                  {data.fundamentals?.cash_flow && <TabsTrigger value="cf" className="rounded-md px-3.5 py-1.5 text-[13px] font-semibold data-[state=active]:shadow-sm">Cash Flows</TabsTrigger>}
                  {data.fundamentals?.shareholding && <TabsTrigger value="sh" className="rounded-md px-3.5 py-1.5 text-[13px] font-semibold data-[state=active]:shadow-sm">Shareholding</TabsTrigger>}
                </TabsList>

                {data.fundamentals?.quarterly_results && (
                  <TabsContent value="quarterly" className="mt-3 focus-visible:outline-none focus-visible:ring-0">
                    <HistoricalTable 
                      title="Quarterly Results" 
                      data={data.fundamentals.quarterly_results} 
                      dateKey="date" 
                    />
                  </TabsContent>
                )}

                {data.fundamentals?.profit_loss && (
                  <TabsContent value="pl" className="mt-3 focus-visible:outline-none focus-visible:ring-0">
                    <HistoricalTable 
                      title="Annual Profit & Loss" 
                      data={data.fundamentals.profit_loss} 
                      dateKey="year" 
                    />
                  </TabsContent>
                )}

                {data.fundamentals?.balance_sheet && (
                  <TabsContent value="bs" className="mt-3 focus-visible:outline-none focus-visible:ring-0">
                    <HistoricalTable 
                      title="Balance Sheet" 
                      data={data.fundamentals.balance_sheet} 
                      dateKey="year" 
                    />
                  </TabsContent>
                )}

                {data.fundamentals?.cash_flow && (
                  <TabsContent value="cf" className="mt-3 focus-visible:outline-none focus-visible:ring-0">
                    <HistoricalTable 
                      title="Cash Flows" 
                      data={data.fundamentals.cash_flow} 
                      dateKey="year" 
                    />
                  </TabsContent>
                )}

                {data.fundamentals?.shareholding && (
                  <TabsContent value="sh" className="mt-3 focus-visible:outline-none focus-visible:ring-0">
                    <HistoricalTable 
                      title="Shareholding Pattern" 
                      data={data.fundamentals.shareholding} 
                      dateKey="date" 
                    />
                  </TabsContent>
                )}
              </Tabs>
            </section>

            {/* Disclaimer */}
            <div className="text-[11px] text-muted-foreground/50 text-center py-6 border-t border-border/30 font-medium">
              This is an analytical decision-support tool, not investment advice. The final decision rests with the user.
            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
}
