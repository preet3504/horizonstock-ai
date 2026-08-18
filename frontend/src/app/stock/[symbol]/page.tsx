'use client';

import { use } from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { useStockAnalysis } from '@/hooks/api/useStockAnalysis';
import { MasterDataTable } from '@/components/features/dashboard/MasterDataTable';
import { HistoricalTable } from '@/components/features/dashboard/HistoricalTable';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

export default function StockDashboard({ params }: { params: Promise<{ symbol: string }> }) {
  const resolvedParams = use(params);
  const symbol = decodeURIComponent(resolvedParams.symbol).toUpperCase();

  const { data, isLoading, isError, error, refetch } = useStockAnalysis(symbol);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="space-y-1">
            <Link href="/" className="inline-flex items-center text-sm text-emerald-500 hover:text-emerald-400 mb-2 transition-colors">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back to Search
            </Link>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white">
              {symbol}
            </h1>
            <p className="text-slate-400">
              {data?.summary?.company_name || 'Loading company details...'}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
             <Button variant="outline" className="border-slate-800 bg-slate-900 text-slate-300" onClick={() => refetch()} disabled={isLoading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh Data
             </Button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-64 bg-slate-900 rounded-xl" />)}
            </div>
            <Skeleton className="h-96 w-full bg-slate-900 rounded-xl" />
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="p-6 bg-red-950/20 border border-red-900/50 rounded-xl text-center space-y-4">
            <p className="text-red-400 font-medium">Failed to fetch data for {symbol}</p>
            <p className="text-sm text-red-500/70">{error?.message}</p>
          </div>
        )}

        {/* Success State - Data Display */}
        {data && (
          <div className="space-y-12 animate-in fade-in duration-500">
            {/* Master Data Grid */}
            <section>
              <h2 className="text-2xl font-semibold mb-6 flex items-center">
                <span className="bg-emerald-500 w-2 h-6 rounded-full mr-3"></span>
                Key Fundamentals
              </h2>
              <MasterDataTable data={data.master_data} />
            </section>

            {/* Historical Tables */}
            <section className="space-y-8">
              <h2 className="text-2xl font-semibold mb-6 flex items-center">
                <span className="bg-blue-500 w-2 h-6 rounded-full mr-3"></span>
                Historical Data
              </h2>
              
              {data.fundamentals?.quarterly_results && (
                <HistoricalTable 
                  title="Quarterly Results" 
                  data={data.fundamentals.quarterly_results} 
                  dateKey="date" 
                />
              )}

              {data.fundamentals?.profit_loss && (
                <HistoricalTable 
                  title="Annual Profit & Loss" 
                  data={data.fundamentals.profit_loss} 
                  dateKey="year" 
                />
              )}

              {data.fundamentals?.balance_sheet && (
                <HistoricalTable 
                  title="Balance Sheet" 
                  data={data.fundamentals.balance_sheet} 
                  dateKey="year" 
                />
              )}

              {data.fundamentals?.cash_flow && (
                <HistoricalTable 
                  title="Cash Flows" 
                  data={data.fundamentals.cash_flow} 
                  dateKey="year" 
                />
              )}

              {data.fundamentals?.shareholding && (
                <HistoricalTable 
                  title="Shareholding Pattern" 
                  data={data.fundamentals.shareholding} 
                  dateKey="date" 
                />
              )}
            </section>
          </div>
        )}

      </div>
    </div>
  );
}
