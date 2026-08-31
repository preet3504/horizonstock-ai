'use client';
import { SearchBar } from '@/components/features/search/SearchBar';
import Link from 'next/link';
import { useTopGainers } from '@/hooks/api/useTopGainers';
import { ArrowRight, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function Home() {
  const { data: gainersData, isLoading } = useTopGainers(1.0, 44, 1.0);
  const previewGainers = gainersData?.gainers?.slice(0, 5) || [];

  return (
    <main className="min-h-screen bg-background flex flex-col">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-50 border-b border-border bg-background">
        <div className="max-w-[1700px] mx-auto px-4 py-4 flex items-center justify-between gap-6">
          <div className="flex-shrink-0 font-heading font-bold text-2xl tracking-tight text-foreground">
            Fundoscope
          </div>
          <div className="flex-1 max-w-xl ml-auto flex justify-end">
            <div className="w-full max-w-md">
              <SearchBar />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 max-w-[1700px] w-full mx-auto px-4 py-8 md:py-12 flex flex-col">
        <div className="mb-12">
          <h1 className="font-heading text-4xl md:text-5xl font-semibold text-foreground leading-tight max-w-3xl">
            Institutional-grade equity research.
          </h1>
          <p className="mt-4 text-muted-foreground max-w-2xl text-lg">
            An advanced fundamental-analysis and screening platform for NSE/BSE-listed Indian equities.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Top Gainers Table */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Live Top Gainers
              </h2>
              <Link href="/top-gainers" className="text-sm text-primary hover:underline flex items-center gap-1 font-medium">
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="border border-border rounded-sm overflow-hidden bg-background">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted text-foreground border-b border-border">
                  <tr>
                    <th className="px-4 py-3 font-semibold w-1/4">Symbol</th>
                    <th className="px-4 py-3 font-semibold text-right">Last Price</th>
                    <th className="px-4 py-3 font-semibold text-right">Change</th>
                    <th className="px-4 py-3 font-semibold text-right">Gain %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                        <td className="px-4 py-3 text-right"><Skeleton className="h-4 w-16 ml-auto" /></td>
                        <td className="px-4 py-3 text-right"><Skeleton className="h-4 w-12 ml-auto" /></td>
                        <td className="px-4 py-3 text-right"><Skeleton className="h-4 w-10 ml-auto" /></td>
                      </tr>
                    ))
                  ) : previewGainers.length > 0 ? (
                    previewGainers.map((gainer, i) => (
                      <tr key={gainer.symbol} className={i % 2 === 0 ? 'bg-background' : 'bg-muted/30'}>
                        <td className="px-4 py-3 font-medium">
                          <Link href={`/stock/${gainer.symbol}`} className="text-primary hover:underline">
                            {gainer.symbol}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          ₹{gainer.lastPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-gain">
                          +{gainer.change.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-gain font-medium">
                          +{gainer.pChange.toFixed(2)}%
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                        No gainers data available.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Trending Searches Sidebar */}
          <div className="lg:col-span-4 space-y-4">
            <h2 className="font-semibold text-lg">Trending Searches</h2>
            <div className="flex flex-wrap gap-2">
              {['RELIANCE', 'TCS', 'HDFCBANK', 'IRFC', 'INFY', 'ITC'].map((symbol) => (
                <Link key={symbol} href={`/stock/${symbol}`}>
                  <div className="px-3 py-1.5 border border-border rounded-md text-sm font-medium hover:border-primary hover:text-primary transition-colors bg-muted/20">
                    {symbol}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
