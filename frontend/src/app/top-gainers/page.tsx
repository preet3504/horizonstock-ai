'use client';
import { useState, useEffect } from 'react';
import { useTopGainers } from '@/hooks/api/useTopGainers';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { RefreshCw } from 'lucide-react';

export default function TopGainersPage() {
  const [sliderValue, setSliderValue] = useState(5.0); // For UI update
  const [apiMinGain, setApiMinGain] = useState(5.0);   // For API trigger
  
  const [maLength, setMaLength] = useState(44);
  const [distanceSlider, setDistanceSlider] = useState(1.0); // For UI update
  const [apiDistance, setApiDistance] = useState(1.0);       // For API trigger

  const { data, isLoading, isError, refetch, isFetching } = useTopGainers(apiMinGain, maLength, apiDistance);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Reset page when new data is fetched
  useEffect(() => {
    setCurrentPage(1);
  }, [apiMinGain, maLength, apiDistance]);

  const totalItems = data?.gainers.length || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const currentGainers = data?.gainers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  ) || [];

  return (
    <main className="min-h-screen bg-background text-foreground p-6 md:p-12 relative overflow-hidden">
      {/* Background Glowing Orbs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />

      <div className="max-w-6xl mx-auto space-y-8 z-10 relative">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div>
            <Link href="/" className="text-muted-foreground hover:text-primary transition-colors text-sm mb-2 inline-flex items-center gap-1">
              ← Back to Home
            </Link>
            <div className="flex items-center gap-4">
              <h1 className="text-3xl md:text-5xl font-bold tracking-tight mt-2 flex items-center gap-3">
                🔥 Live Top Gainers
              </h1>
              <button 
                onClick={() => refetch()} 
                disabled={isFetching}
                className="mt-2 p-2.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 shadow-sm transition-all disabled:opacity-50"
                title="Refresh Live Data"
              >
                <RefreshCw className={`w-5 h-5 ${isFetching ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <p className="text-muted-foreground mt-2">
              NIFTY 500 stocks currently surging in the live market session.
            </p>
          </div>

          {/* Customization Controls */}
          <div className="flex flex-col gap-3">
            <div className="glass-panel p-3 md:p-4 rounded-xl flex flex-wrap items-center gap-3 border border-border/50">
              <span className="text-sm font-medium whitespace-nowrap w-24">Min Gain %:</span>
              <input
                type="range"
                min="1"
                max="20"
                step="0.5"
                value={sliderValue}
                onChange={(e) => setSliderValue(parseFloat(e.target.value))}
                onMouseUp={() => setApiMinGain(sliderValue)}
                onTouchEnd={() => setApiMinGain(sliderValue)}
                className="w-32 md:w-40 accent-primary cursor-pointer"
              />
              <span className="w-12 text-right font-mono text-primary font-bold">{sliderValue}%</span>
            </div>

            <div className="glass-panel p-3 md:p-4 rounded-xl flex flex-wrap items-center gap-3 border border-border/50">
              <span className="text-sm font-medium whitespace-nowrap w-24">SMA Period:</span>
              <input
                type="number"
                min="1"
                max="200"
                value={maLength}
                onChange={(e) => setMaLength(parseInt(e.target.value) || 44)}
                className="w-16 bg-background border border-border/50 rounded-md px-2 py-1 text-sm font-mono text-primary outline-none focus:border-primary/50"
              />
              
              <div className="w-px h-6 bg-border/50 mx-2 hidden sm:block"></div>

              <span className="text-sm font-medium whitespace-nowrap">Distance %:</span>
              <input
                type="range"
                min="0.1"
                max="10"
                step="0.1"
                value={distanceSlider}
                onChange={(e) => setDistanceSlider(parseFloat(e.target.value))}
                onMouseUp={() => setApiDistance(distanceSlider)}
                onTouchEnd={() => setApiDistance(distanceSlider)}
                className="w-24 md:w-32 accent-primary cursor-pointer"
              />
              <span className="w-12 text-right font-mono text-primary font-bold">{distanceSlider}%</span>
            </div>
          </div>
        </div>

        {/* Data Table Area */}
        <div className="glass-panel rounded-2xl border border-border/40 overflow-hidden shadow-xl bg-card/30 backdrop-blur-sm">
          {isLoading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : isError ? (
            <div className="h-64 flex items-center justify-center text-red-400">
              Failed to fetch live market data. Please try again.
            </div>
          ) : totalItems === 0 ? (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              No NIFTY 500 stocks currently have a gain above {apiMinGain}%.
            </div>
          ) : (
            <div className="flex flex-col">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-muted/20 border-b border-border/40">
                    <tr>
                      <th className="px-6 py-4 font-semibold tracking-wider">Symbol</th>
                      <th className="px-6 py-4 font-semibold tracking-wider">Last Price</th>
                      <th className="px-6 py-4 font-semibold tracking-wider">Change</th>
                      <th className="px-6 py-4 font-semibold tracking-wider">Gain %</th>
                      <th className="px-6 py-4 font-semibold tracking-wider">SMA ({maLength})</th>
                      <th className="px-6 py-4 font-semibold tracking-wider">Dist %</th>
                      <th className="px-6 py-4 font-semibold tracking-wider">Volume</th>
                      <th className="px-6 py-4 font-semibold tracking-wider text-right">Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentGainers.map((stock, index) => (
                      <motion.tr
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        key={stock.symbol}
                        className="border-b border-border/20"
                      >
                        <td className="px-6 py-4">
                          <div className="font-bold text-foreground">{stock.symbol}</div>
                          {stock.industry && <div className="text-xs text-muted-foreground truncate max-w-[200px]">{stock.industry}</div>}
                        </td>
                        <td className="px-6 py-4 font-mono">₹{stock.lastPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td className="px-6 py-4 font-mono text-green-400">+{stock.change.toFixed(2)}</td>
                        <td className="px-6 py-4 font-mono font-bold text-green-400">+{stock.pChange.toFixed(2)}%</td>
                        <td className="px-6 py-4 font-mono text-muted-foreground">
                          {stock.smaValue ? `₹${stock.smaValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'N/A'}
                        </td>
                        <td className="px-6 py-4 font-mono text-muted-foreground">
                          {stock.smaDistance !== undefined && stock.smaDistance !== null ? `${stock.smaDistance.toFixed(2)}%` : 'N/A'}
                        </td>
                        <td className="px-6 py-4 font-mono text-muted-foreground">
                          {stock.totalTradedVolume > 1000000
                            ? `${(stock.totalTradedVolume / 1000000).toFixed(2)}M`
                            : `${(stock.totalTradedVolume / 1000).toFixed(1)}k`}
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-muted-foreground text-right">
                          {stock.lastUpdateTime.split(' ')[1] || stock.lastUpdateTime}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-border/40 bg-muted/10">
                  <span className="text-sm text-muted-foreground">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 rounded-lg border border-border/50 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted/30 transition-colors text-foreground"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 rounded-lg border border-border/50 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted/30 transition-colors text-foreground"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
