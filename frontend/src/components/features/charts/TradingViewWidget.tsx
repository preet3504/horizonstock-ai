'use client';

import React, { useEffect, useRef, useState, memo } from 'react';
import { createChart, ColorType, ISeriesApi, CandlestickSeries } from 'lightweight-charts';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

interface TradingViewWidgetProps {
  symbol: string;
  exchange?: 'NSE' | 'BSE';
}

const INTERVAL_GROUPS = [
  {
    label: 'MINUTES',
    options: [
      { label: '1 minute', value: '1m' },
      { label: '5 minutes', value: '5m' },
      { label: '15 minutes', value: '15m' },
      { label: '30 minutes', value: '30m' },
    ],
  },
  {
    label: 'HOURS',
    options: [
      { label: '1 hour', value: '1h' },
    ],
  },
  {
    label: 'DAYS',
    options: [
      { label: '1 day', value: '1d' },
      { label: '1 week', value: '1wk' },
      { label: '1 month', value: '1mo' },
      { label: '3 months', value: '3mo' },
    ],
  },
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

  const [interval, setInterval] = useState('1d');
  const [period, setPeriod] = useState('2y');

  // Fetch historical data
  const { data, isLoading, isError } = useQuery({
    queryKey: ['stockHistory', symbol, exchange, interval, period],
    queryFn: async () => {
      // Assuming Next.js proxies or the backend runs on localhost:8000
      // We'll use the absolute URL for safety during development
      const url = `http://localhost:8000/api/stocks/history?symbol=${symbol}&exchange=${exchange}&interval=${interval}&period=${period}`;
      const res = await axios.get(url);
      return res.data;
    },
    enabled: !!symbol,
  });

  // Initialize chart and resize observer
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#d1d5db',
      },
      grid: {
        vertLines: { color: 'rgba(242, 242, 242, 0.06)' },
        horzLines: { color: 'rgba(242, 242, 242, 0.06)' },
      },
      crosshair: {
        mode: 0, // Normal mode
      },
      timeScale: {
        borderColor: 'rgba(242, 242, 242, 0.1)',
      },
      autoSize: true, // This enables internal resize observer in newer versions
    });

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });

    chartRef.current = chart;
    seriesRef.current = candlestickSeries;

    return () => {
      chart.remove();
    };
  }, []);

  // Update data when it changes
  useEffect(() => {
    if (seriesRef.current && data && Array.isArray(data)) {
      // Data should be correctly formatted by the backend
      seriesRef.current.setData(data);
      if (chartRef.current) {
        chartRef.current.timeScale().fitContent();
      }
    }
  }, [data]);

  return (
    <div className="w-full rounded-xl overflow-hidden border border-border/40 shadow-xl relative flex flex-col bg-[#131722]">
      
      {/* TradingView-style Toolbar */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2 border-b border-border/20 text-sm">
        <div className="flex items-center gap-1">
          <select 
            value={interval}
            onChange={(e) => setInterval(e.target.value)}
            className="bg-transparent text-[#d1d4dc] hover:text-white hover:bg-white/5 cursor-pointer outline-none border-none py-1 px-2 rounded transition-colors font-medium appearance-none"
            style={{ WebkitAppearance: 'none' }}
          >
            {INTERVAL_GROUPS.map((group) => (
              <optgroup key={group.label} label={group.label} className="bg-[#1e222d] text-muted-foreground font-semibold">
                {group.options.map((opt) => (
                  <option key={opt.value} value={opt.value} className="text-[#d1d4dc] bg-[#131722] font-normal">
                    {opt.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <div className="w-[1px] h-4 bg-border/30 mx-2" />
        </div>
        
        <div className="flex items-center gap-1">
          {PERIODS.map((per) => (
            <button
              key={per.value}
              onClick={() => setPeriod(per.value)}
              className={`px-2 py-1 rounded transition-colors font-medium ${
                period === per.value 
                  ? 'text-[#2962ff]' 
                  : 'text-[#d1d4dc] hover:text-white hover:bg-white/5'
              }`}
            >
              {per.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Container */}
      <div className="w-full h-[500px] lg:h-[600px] relative">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center text-sm text-muted-foreground bg-background/50 backdrop-blur-sm">
            Loading chart data...
          </div>
        )}
        {isError && (
          <div className="absolute inset-0 z-10 flex items-center justify-center text-sm text-destructive bg-background/50 backdrop-blur-sm">
            Failed to load historical data.
          </div>
        )}
        {!isLoading && !isError && data && data.length === 0 && (
          <div className="absolute inset-0 z-10 flex items-center justify-center text-sm text-muted-foreground bg-background/50 backdrop-blur-sm">
            No historical data available for this period.
          </div>
        )}

        <div ref={chartContainerRef} className="absolute inset-0 w-full h-full" />
      </div>
    </div>
  );
}

export default memo(TradingViewWidget);