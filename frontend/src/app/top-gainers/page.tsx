'use client';
import { useState, useEffect } from 'react';
import { useTopGainers } from '@/hooks/api/useTopGainers';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { RefreshCw, ArrowLeft, ChevronDown } from 'lucide-react';
import { SearchBar } from '@/components/features/search/SearchBar';

export default function TopGainersPage() {
  const [sliderValue, setSliderValue] = useState(5.0);
  const [apiMinGain, setApiMinGain] = useState(5.0);

  const [maLength, setMaLength] = useState(44);
  const [distanceSlider, setDistanceSlider] = useState(1.0);
  const [apiDistance, setApiDistance] = useState(1.0);

  const { data, isLoading, isError, refetch, isFetching } = useTopGainers(apiMinGain, maLength, apiDistance);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Debounce sliders to prevent UI lag and API spam, removing the need for onMouseUp
  useEffect(() => {
    const timer = setTimeout(() => {
      setApiMinGain(sliderValue);
    }, 200);
    return () => clearTimeout(timer);
  }, [sliderValue]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setApiDistance(distanceSlider);
    }, 200);
    return () => clearTimeout(timer);
  }, [distanceSlider]);

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
    <main className="h-screen bg-background text-foreground flex flex-col overflow-hidden">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-50 border-b border-border bg-background">
        <div className="max-w-[1700px] mx-auto px-4 h-16 flex items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="font-heading font-semibold text-xl tracking-tight text-foreground hidden sm:block">
              Live Top Gainers
            </h1>
          </div>
          
          <div className="flex-1 max-w-xl ml-auto flex justify-end">
            <div className="w-full max-w-md">
              <SearchBar />
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground tabular-nums shrink-0">
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-primary' : ''}`} />
            Updated {currentGainers[0]?.lastUpdateTime ? currentGainers[0].lastUpdateTime.split(' ')[1] : '...'}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 min-h-0 max-w-[1700px] w-full mx-auto px-4 py-6 flex flex-col">
        {/* Compact Toolbar */}
        <div className="mb-4 flex flex-wrap items-center gap-4 text-sm bg-muted/30 p-2 rounded-sm border border-border">
          <div className="flex items-center gap-2">
            <label className="text-muted-foreground font-medium">Min gain</label>
            <div className="flex items-center border border-border bg-background rounded-sm px-2 py-1">
              <span className="tabular-nums font-medium mr-1">{sliderValue}%</span>
              <input
                type="range"
                min="1"
                max="20"
                step="0.5"
                value={sliderValue}
                onChange={(e) => setSliderValue(parseFloat(e.target.value))}
                className="w-24 accent-primary cursor-pointer"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-muted-foreground font-medium">SMA</label>
            <input
              type="number"
              min="1"
              max="200"
              value={maLength}
              onChange={(e) => setMaLength(parseInt(e.target.value) || 44)}
              className="w-16 border border-border bg-background rounded-sm px-2 py-1 tabular-nums outline-none focus:border-primary"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-muted-foreground font-medium">Distance</label>
            <div className="flex items-center border border-border bg-background rounded-sm px-2 py-1">
              <span className="tabular-nums font-medium mr-1">{distanceSlider}%</span>
              <input
                type="range"
                min="0.1"
                max="10"
                step="0.1"
                value={distanceSlider}
                onChange={(e) => setDistanceSlider(parseFloat(e.target.value))}
                className="w-24 accent-primary cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className={`flex-1 min-h-0 border border-border rounded-sm bg-background overflow-y-auto relative transition-opacity duration-200 ${isFetching && currentGainers.length > 0 ? 'opacity-50' : 'opacity-100'}`}>
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-muted text-foreground border-b border-border sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-4 py-3 font-semibold cursor-pointer hover:bg-muted/80">Sym <ChevronDown className="inline w-3 h-3 text-muted-foreground" /></th>
                <th className="px-4 py-3 font-semibold text-right cursor-pointer hover:bg-muted/80">Last Price</th>
                <th className="px-4 py-3 font-semibold text-right cursor-pointer hover:bg-muted/80">Change</th>
                <th className="px-4 py-3 font-semibold text-right cursor-pointer hover:bg-muted/80">Gain %</th>
                <th className="px-4 py-3 font-semibold text-right cursor-pointer hover:bg-muted/80">SMA({maLength})</th>
                <th className="px-4 py-3 font-semibold text-right cursor-pointer hover:bg-muted/80">Dist %</th>
                <th className="px-4 py-3 font-semibold text-right cursor-pointer hover:bg-muted/80">Volume</th>
                <th className="px-4 py-3 font-semibold text-right">Upd</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading && !data ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary mr-2 align-middle"></div>
                    Loading market data...
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-loss font-medium">
                    Failed to fetch live market data.
                  </td>
                </tr>
              ) : totalItems === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                    No stocks currently match the filter criteria.
                  </td>
                </tr>
              ) : (
                currentGainers.map((stock, index) => (
                  <tr key={stock.symbol} className={index % 2 === 0 ? 'bg-background hover:bg-muted/30' : 'bg-muted/10 hover:bg-muted/30'}>
                    <td className="px-4 py-2 font-medium">
                      <Link href={`/stock/${stock.symbol}`} className="text-primary hover:underline">
                        {stock.symbol}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums">
                      {stock.lastPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums text-gain">
                      +{stock.change.toFixed(2)}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums text-gain font-medium">
                      +{stock.pChange.toFixed(2)}%
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums text-muted-foreground">
                      {stock.smaValue ? stock.smaValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums text-muted-foreground">
                      {stock.smaDistance !== undefined && stock.smaDistance !== null ? `${stock.smaDistance.toFixed(2)}%` : '-'}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums text-muted-foreground">
                      {stock.totalTradedVolume > 1000000
                        ? `${(stock.totalTradedVolume / 1000000).toFixed(2)}M`
                        : `${(stock.totalTradedVolume / 1000).toFixed(1)}k`}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums text-muted-foreground text-xs">
                      {stock.lastUpdateTime.split(' ')[1] || stock.lastUpdateTime}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-sm border border-border font-medium disabled:opacity-50 hover:bg-muted/30 transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-sm border border-border font-medium disabled:opacity-50 hover:bg-muted/30 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
