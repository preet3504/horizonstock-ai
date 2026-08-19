'use client';

import { use } from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, BarChart2, TrendingUp, DollarSign, Activity } from 'lucide-react';
import { useStockAnalysis } from '@/hooks/api/useStockAnalysis';
import { MasterDataTable } from '@/components/features/dashboard/MasterDataTable';
import { HistoricalTable } from '@/components/features/dashboard/HistoricalTable';
import TradingViewWidget from '@/components/features/charts/TradingViewWidget';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from 'framer-motion';

export default function StockDashboard({ params }: { params: Promise<{ symbol: string }> }) {
  const resolvedParams = use(params);
  const symbol = decodeURIComponent(resolvedParams.symbol).toUpperCase();

  const { data, isLoading, isError, error, refetch } = useStockAnalysis(symbol);

  return (
    <div className="min-h-screen p-4 md:p-6 lg:px-8 lg:py-6 relative z-10 scroll-smooth">
      <div className="max-w-[1600px] mx-auto space-y-6">
        
        {/* Minimal Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-4 mb-2 border-b border-border/60"
        >
          <div className="flex flex-col">
            <Link href="/" className="inline-flex items-center text-xs text-muted-foreground hover:text-primary transition-colors font-medium mb-3">
              <ArrowLeft className="w-3 h-3 mr-1" /> Back to search
            </Link>
            <div className="flex items-baseline gap-4">
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
                {symbol}
              </h1>
              <span className="text-muted-foreground text-sm font-medium hidden sm:inline-block">
                {data?.summary?.company_name || 'Loading...'}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            {data?.master_data?.price && (
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">CMP</span>
                <span className="text-2xl font-black text-emerald-600 font-mono tracking-tight leading-none">
                  ₹{data.master_data.price}
                </span>
              </div>
            )}
            <div className="h-8 w-px bg-border/60 hidden md:block"></div>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors rounded-lg h-9 px-4" onClick={() => refetch()} disabled={isLoading}>
              <RefreshCw className={`w-3.5 h-3.5 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Sync
            </Button>
          </div>
        </motion.div>

        {/* Sticky Navigation Removed - Using Tabs instead */}

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-40 glass-card rounded-2xl" />)}
            </div>
            <Skeleton className="h-96 w-full glass-card rounded-2xl" />
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="p-6 bg-destructive/20 backdrop-blur-md border border-destructive/50 rounded-2xl text-center space-y-4 shadow-2xl">
            <p className="text-destructive-foreground font-medium text-lg">Failed to fetch data for {symbol}</p>
            <p className="text-sm text-destructive-foreground/70">{error?.message}</p>
          </div>
        )}

        {/* Success State - Data Display */}
        {data && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="space-y-16"
          >
            {/* Interactive Chart */}
            <section className="pt-8">
              <TradingViewWidget symbol={symbol} />
            </section>

            {/* Master Data Grid */}
            <section>
              <MasterDataTable data={data.master_data} />
            </section>

            {/* Historical Tables */}
            <section className="space-y-6 pt-12 border-t border-border" id="historical-data">
              <h2 className="text-3xl font-bold mb-6 flex items-center text-foreground drop-shadow-sm">
                <span className="bg-primary w-2 h-8 rounded-full mr-4 shadow-[0_0_15px_var(--color-primary)]"></span>
                Historical Data Deep Dive
              </h2>
              
              <Tabs defaultValue="quarterly" className="w-full">
                <TabsList className="mb-6 flex flex-wrap h-auto bg-muted/50 p-1 justify-start">
                  {data.fundamentals?.quarterly_results && <TabsTrigger value="quarterly">Quarterly</TabsTrigger>}
                  {data.fundamentals?.profit_loss && <TabsTrigger value="pl">Profit & Loss</TabsTrigger>}
                  {data.fundamentals?.balance_sheet && <TabsTrigger value="bs">Balance Sheet</TabsTrigger>}
                  {data.fundamentals?.cash_flow && <TabsTrigger value="cf">Cash Flows</TabsTrigger>}
                  {data.fundamentals?.shareholding && <TabsTrigger value="sh">Shareholding</TabsTrigger>}
                </TabsList>

                {data.fundamentals?.quarterly_results && (
                  <TabsContent value="quarterly" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                    <HistoricalTable 
                      title="Quarterly Results" 
                      data={data.fundamentals.quarterly_results} 
                      dateKey="date" 
                    />
                  </TabsContent>
                )}

                {data.fundamentals?.profit_loss && (
                  <TabsContent value="pl" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                    <HistoricalTable 
                      title="Annual Profit & Loss" 
                      data={data.fundamentals.profit_loss} 
                      dateKey="year" 
                    />
                  </TabsContent>
                )}

                {data.fundamentals?.balance_sheet && (
                  <TabsContent value="bs" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                    <HistoricalTable 
                      title="Balance Sheet" 
                      data={data.fundamentals.balance_sheet} 
                      dateKey="year" 
                    />
                  </TabsContent>
                )}

                {data.fundamentals?.cash_flow && (
                  <TabsContent value="cf" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                    <HistoricalTable 
                      title="Cash Flows" 
                      data={data.fundamentals.cash_flow} 
                      dateKey="year" 
                    />
                  </TabsContent>
                )}

                {data.fundamentals?.shareholding && (
                  <TabsContent value="sh" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                    <HistoricalTable 
                      title="Shareholding Pattern" 
                      data={data.fundamentals.shareholding} 
                      dateKey="date" 
                    />
                  </TabsContent>
                )}
              </Tabs>
            </section>
          </motion.div>
        )}

      </div>
    </div>
  );
}
