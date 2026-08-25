'use client';

import React, { useEffect, useRef, useState, memo } from 'react';
import { createChart, ColorType, ISeriesApi, CandlestickSeries, LineSeries } from 'lightweight-charts';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { Loader2 } from 'lucide-react';

function calculateSMA(data: any[], length: number) {
  const smaData = [];
  for (let i = 0; i < data.length; i++) {
    if (i < length - 1) {
      continue; // Not enough data points
    }
    let sum = 0;
    for (let j = 0; j < length; j++) {
      sum += data[i - j].close;
    }
    smaData.push({ time: data[i].time, value: sum / length });
  }
  return smaData;
}

interface TradingViewWidgetProps {
  symbol: string;
  exchange?: 'NSE' | 'BSE';
}

const INTERVALS = [
  { label: '1m', value: '1m' },
  { label: '5m', value: '5m' },
  { label: '15m', value: '15m' },
  { label: '1H', value: '1h' },
  { label: '1D', value: '1d' },
  { label: '1W', value: '1wk' },
  { label: '1M', value: '1mo' },
];

const PERIODS = [
  { label: '1D', value: '1d' },
  { label: '5D', value: '5d' },
  { label: '1M', value: '1mo' },
  { label: '6M', value: '6mo' },
  { label: 'YTD', value: 'ytd' },
  { label: '1Y', value: '1y' },
  { label: '5Y', value: '5y' },
  { label: 'ALL', value: 'max' },
];

function TradingViewWidget({ symbol, exchange = 'NSE' }: TradingViewWidgetProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const maSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);

  const [interval, setInterval] = useState('1d');
  const [period, setPeriod] = useState('1y');
  const [maLength, setMaLength] = useState<number>(50);
  const [showMA, setShowMA] = useState<boolean>(true);

  // Fetch historical data
  const { data, isLoading, isError } = useQuery({
    queryKey: ['stockHistory', symbol, exchange, interval, period],
    queryFn: async () => {
      const res = await apiClient.get('/stocks/history', {
        params: { symbol, exchange, interval, period },
      });
      return res.data;
    },
    enabled: !!symbol,
  });

  // Initialize chart and resize observer
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#0a0e17' },
        textColor: '#6b7280',
        fontSize: 12,
      },
      grid: {
        vertLines: { color: 'rgba(255,255,255,0.03)' },
        horzLines: { color: 'rgba(255,255,255,0.03)' },
      },
      crosshair: {
        mode: 0,
        vertLine: {
          color: 'rgba(99,102,241,0.4)',
          labelBackgroundColor: '#4f46e5',
        },
        horzLine: {
          color: 'rgba(99,102,241,0.4)',
          labelBackgroundColor: '#4f46e5',
        },
      },
      timeScale: {
        borderColor: 'rgba(255,255,255,0.06)',
        timeVisible: true,
      },
      rightPriceScale: {
        borderColor: 'rgba(255,255,255,0.06)',
      },
      autoSize: true,
    });

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10b981',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444',
    });

    const maSeries = chart.addSeries(LineSeries, {
      color: '#f59e0b',
      lineWidth: 2,
      crosshairMarkerVisible: false,
      priceLineVisible: false,
    });

    chartRef.current = chart;
    seriesRef.current = candlestickSeries;
    maSeriesRef.current = maSeries;

    return () => {
      chart.remove();
    };
  }, []);

  // Update data when it changes
  useEffect(() => {
    if (seriesRef.current && data && Array.isArray(data)) {
      seriesRef.current.setData(data);
      
      if (maSeriesRef.current) {
        if (showMA && data.length > 0) {
          const smaData = calculateSMA(data, maLength);
          maSeriesRef.current.setData(smaData);
        } else {
          maSeriesRef.current.setData([]);
        }
      }

      if (chartRef.current) {
        chartRef.current.timeScale().fitContent();
      }
    }
  }, [data, maLength, showMA]);

  return (
    <div className="w-full flex flex-col bg-[#0a0e17] rounded-2xl overflow-hidden border border-white/[0.06]">
      
      {/* Unified Dark Toolbar */}
      <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
        
        {/* Interval Buttons */}
        <div className="flex items-center bg-white/[0.04] rounded-lg p-0.5">
          {INTERVALS.map((itv) => (
            <button
              key={itv.value}
              onClick={() => setInterval(itv.value)}
              className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all duration-150 ${
                interval === itv.value 
                  ? 'bg-indigo-500/20 text-indigo-400 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.04]'
              }`}
            >
              {itv.label}
            </button>
          ))}
        </div>

        <div className="w-px h-5 bg-white/10 mx-1" />
        
        {/* Period Buttons */}
        <div className="flex items-center gap-0.5">
          {PERIODS.map((per) => (
            <button
              key={per.value}
              onClick={() => setPeriod(per.value)}
              className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all duration-150 ${
                period === per.value 
                  ? 'text-white bg-white/[0.08]' 
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {per.label}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        {/* MA Toggle */}
        <div className="flex items-center gap-2 bg-white/[0.04] rounded-lg px-3 py-1.5">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <div 
              onClick={() => setShowMA(!showMA)}
              className={`w-8 h-4.5 rounded-full relative transition-colors duration-200 cursor-pointer ${showMA ? 'bg-amber-500/30' : 'bg-white/10'}`}
            >
              <div className={`absolute top-0.5 w-3.5 h-3.5 rounded-full transition-all duration-200 ${showMA ? 'left-[calc(100%-16px)] bg-amber-400' : 'left-0.5 bg-gray-500'}`} />
            </div>
            <span className="text-xs font-semibold text-gray-400">MA</span>
          </label>
          {showMA && (
            <input 
              type="number" 
              value={maLength}
              onChange={(e) => setMaLength(Math.max(1, parseInt(e.target.value) || 50))}
              className="bg-white/[0.06] text-amber-400 w-12 text-center text-xs font-mono font-bold outline-none rounded-md py-1 border border-white/[0.06] focus:border-amber-500/40"
              min="1"
              title="Moving Average Length"
            />
          )}
        </div>
      </div>

      {/* Chart Container */}
      <div className="w-full h-[420px] md:h-[500px] lg:h-[560px] relative">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[#0a0e17]/80 backdrop-blur-sm">
            <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
            <span className="text-xs text-gray-500 font-medium">Loading chart...</span>
          </div>
        )}
        {isError && (
          <div className="absolute inset-0 z-10 flex items-center justify-center text-sm text-rose-400 bg-[#0a0e17]/80 backdrop-blur-sm">
            Failed to load historical data.
          </div>
        )}
        {!isLoading && !isError && data && data.length === 0 && (
          <div className="absolute inset-0 z-10 flex items-center justify-center text-sm text-gray-500 bg-[#0a0e17]/80 backdrop-blur-sm">
            No data available for this period.
          </div>
        )}

        <div ref={chartContainerRef} className="absolute inset-0 w-full h-full" />
      </div>
    </div>
  );
}

export default memo(TradingViewWidget);