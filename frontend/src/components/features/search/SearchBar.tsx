'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Loader2, TrendingUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { useStockSearch } from '@/hooks/api/useStockSearch';

const DEBOUNCE_MS = 300;

export function SearchBar() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce the query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  // Fetch search results
  const { data, isLoading, isFetching } = useStockSearch(debouncedQuery);
  const results = data?.results ?? [];

  // Show dropdown when we have a query and results (or loading)
  useEffect(() => {
    if (debouncedQuery.length >= 1 && isFocused) {
      setIsDropdownOpen(true);
    } else {
      setIsDropdownOpen(false);
    }
  }, [debouncedQuery, isFocused]);

  // Reset highlighted index when results change
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [results.length, debouncedQuery]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Navigate to a stock
  const navigateToStock = useCallback(
    (symbol: string) => {
      setQuery(symbol);
      setIsDropdownOpen(false);
      inputRef.current?.blur();
      router.push(`/stock/${symbol.toUpperCase()}`);
    },
    [router],
  );

  // Handle form submit (when user presses Enter without selecting a suggestion)
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (highlightedIndex >= 0 && highlightedIndex < results.length) {
      navigateToStock(results[highlightedIndex].symbol);
    } else if (query.trim()) {
      navigateToStock(query.trim().toUpperCase());
    }
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isDropdownOpen || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
        break;
      case 'Escape':
        setIsDropdownOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  // Highlight the matching prefix in the symbol
  const highlightMatch = (symbol: string, q: string) => {
    const upperQ = q.toUpperCase();
    if (symbol.startsWith(upperQ)) {
      return (
        <>
          <span className="text-primary font-black">{symbol.slice(0, upperQ.length)}</span>
          <span>{symbol.slice(upperQ.length)}</span>
        </>
      );
    }
    return <span>{symbol}</span>;
  };

  const showSpinner = isLoading || isFetching;

  return (
    <div ref={containerRef} className="relative w-full">
      <motion.form
        whileHover={{ scale: 1.01 }}
        onSubmit={handleSearch}
        className={`flex w-full items-center space-x-2 glass-panel p-1.5 rounded-xl transition-all duration-300 ${
          isFocused
            ? 'border-primary/50 shadow-[0_0_30px_-10px_var(--color-primary)] bg-card/80'
            : 'border-border hover:border-primary/30'
        }`}
      >
        <div className="relative w-full">
          <Search
            className={`absolute left-3.5 top-2.5 h-4 w-4 transition-colors duration-300 ${
              isFocused ? 'text-primary' : 'text-muted-foreground'
            }`}
          />
          <Input
            ref={inputRef}
            type="text"
            placeholder="Search NSE/BSE stocks (e.g., RELIANCE, TCS, IRFC)"
            className="w-full pl-10 h-10 bg-transparent border-none text-foreground text-sm md:text-base placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => {
              // Delay blur slightly so click on dropdown item registers first
              setTimeout(() => setIsFocused(false), 150);
            }}
            onKeyDown={handleKeyDown}
            autoComplete="off"
          />
        </div>
        <Button
          type="submit"
          className="h-10 px-6 rounded-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_10px_var(--color-primary)] opacity-90 hover:opacity-100 transition-all text-sm"
        >
          Analyze
        </Button>
      </motion.form>

      {/* ── Autocomplete Dropdown ── */}
      <AnimatePresence>
        {isDropdownOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 left-0 right-0 mt-2 rounded-xl border border-border/50 bg-card/95 backdrop-blur-2xl shadow-2xl shadow-black/30 overflow-hidden"
          >
            {/* Loading State */}
            {showSpinner && results.length === 0 && (
              <div className="flex items-center justify-center gap-2.5 py-5">
                <Loader2 className="w-4 h-4 text-primary animate-spin" />
                <span className="text-sm text-muted-foreground font-medium">Searching stocks...</span>
              </div>
            )}

            {/* Results */}
            {results.length > 0 && (
              <ul className="py-1.5 max-h-[320px] overflow-y-auto">
                {results.map((stock, idx) => (
                  <li key={stock.symbol}>
                    <button
                      type="button"
                      onClick={() => navigateToStock(stock.symbol)}
                      onMouseEnter={() => setHighlightedIndex(idx)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors duration-100 cursor-pointer ${
                        idx === highlightedIndex
                          ? 'bg-primary/10 text-foreground'
                          : 'text-foreground/80 hover:bg-muted/40'
                      }`}
                    >
                      {/* Stock Icon */}
                      <div
                        className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black tracking-tight ${
                          idx === highlightedIndex
                            ? 'bg-primary/20 text-primary'
                            : 'bg-muted/50 text-muted-foreground'
                        }`}
                      >
                        <TrendingUp className="w-3.5 h-3.5" />
                      </div>

                      {/* Symbol + Company Name */}
                      <div className="flex-1 min-w-0">
                        <div className="text-[14px] font-bold tracking-wide leading-tight">
                          {highlightMatch(stock.symbol, debouncedQuery)}
                        </div>
                        <div className="text-[11px] text-muted-foreground truncate leading-tight mt-0.5">
                          {stock.company_name}
                        </div>
                      </div>

                      {/* Exchange badge */}
                      <span className="shrink-0 text-[10px] font-semibold text-muted-foreground/50 bg-muted/30 px-2 py-0.5 rounded-md">
                        NSE
                      </span>
                    </button>
                  </li>
                ))}

                {/* Inline spinner when fetching new results but showing stale data */}
                {showSpinner && results.length > 0 && (
                  <li className="flex items-center justify-center py-2 border-t border-border/30">
                    <Loader2 className="w-3.5 h-3.5 text-primary/50 animate-spin" />
                  </li>
                )}
              </ul>
            )}

            {/* Empty State */}
            {!showSpinner && results.length === 0 && debouncedQuery.length >= 1 && (
              <div className="py-5 text-center">
                <p className="text-sm text-muted-foreground font-medium">
                  No stocks found for &ldquo;
                  <span className="text-foreground font-semibold">{debouncedQuery}</span>
                  &rdquo;
                </p>
                <p className="text-[11px] text-muted-foreground/50 mt-1">
                  Try a different symbol or company name
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
