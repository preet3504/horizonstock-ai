'use client';
import { useState } from 'react';
import { useTopGainers } from '@/hooks/api/useTopGainers';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function TopGainersPage() {
  const [minGain, setMinGain] = useState(5.0);
  const { data, isLoading, isError } = useTopGainers(minGain);

  return (
    <main className="min-h-screen bg-background text-foreground p-6 md:p-12 relative overflow-hidden">
      {/* Background Glowing Orbs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />

      <div className="max-w-6xl mx-auto space-y-8 z-10 relative">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <Link href="/" className="text-muted-foreground hover:text-primary transition-colors text-sm mb-2 inline-flex items-center gap-1">
              ← Back to Home
            </Link>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight mt-2 flex items-center gap-3">
              🔥 Live Top Gainers
            </h1>
            <p className="text-muted-foreground mt-2">
              NIFTY 500 stocks currently surging in the live market session.
            </p>
          </div>
          
          {/* Customization Control */}
          <div className="glass-card p-4 rounded-xl flex items-center gap-4 border border-border/50">
            <span className="text-sm font-medium whitespace-nowrap">Min Gain %:</span>
            <input 
              type="range" 
              min="1" 
              max="20" 
              step="0.5" 
              value={minGain} 
              onChange={(e) => setMinGain(parseFloat(e.target.value))}
              className="w-32 md:w-48 accent-primary"
            />
            <span className="w-12 text-right font-mono text-primary font-bold">{minGain}%</span>
          </div>
        </div>

        {/* Data Table Area */}
        <div className="glass-card rounded-2xl border border-border/40 overflow-hidden shadow-xl bg-card/30 backdrop-blur-sm">
          {isLoading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : isError ? (
            <div className="h-64 flex items-center justify-center text-red-400">
              Failed to fetch live market data. Please try again.
            </div>
          ) : !data || data.gainers.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              No NIFTY 500 stocks currently have a gain above {minGain}%.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/20 border-b border-border/40">
                  <tr>
                    <th className="px-6 py-4 font-semibold tracking-wider">Symbol</th>
                    <th className="px-6 py-4 font-semibold tracking-wider">Last Price</th>
                    <th className="px-6 py-4 font-semibold tracking-wider">Change</th>
                    <th className="px-6 py-4 font-semibold tracking-wider">Gain %</th>
                    <th className="px-6 py-4 font-semibold tracking-wider">Volume</th>
                    <th className="px-6 py-4 font-semibold tracking-wider text-right">Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {data.gainers.map((stock, index) => (
                    <motion.tr 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      key={stock.symbol} 
                      className="border-b border-border/20 hover:bg-muted/10 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="font-bold text-foreground">{stock.symbol}</div>
                        {stock.industry && <div className="text-xs text-muted-foreground truncate max-w-[200px]">{stock.industry}</div>}
                      </td>
                      <td className="px-6 py-4 font-mono">₹{stock.lastPrice.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                      <td className="px-6 py-4 font-mono text-green-400">+{stock.change.toFixed(2)}</td>
                      <td className="px-6 py-4 font-mono font-bold text-green-400">+{stock.pChange.toFixed(2)}%</td>
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
          )}
        </div>
      </div>
    </main>
  );
}
