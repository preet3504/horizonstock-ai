import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { StockSearchResponse } from '@/types/stock';

/**
 * Fetches stock search suggestions from the backend.
 * The query is the debounced search string — the caller is responsible
 * for debouncing before passing the query here.
 */
const fetchStockSearch = async (query: string): Promise<StockSearchResponse> => {
  const { data } = await apiClient.get<StockSearchResponse>('/stocks/search', {
    params: { q: query, limit: 10 },
  });
  return data;
};

export const useStockSearch = (query: string) => {
  return useQuery({
    queryKey: ['stock-search', query],
    queryFn: () => fetchStockSearch(query),
    enabled: query.length >= 1,
    staleTime: 5 * 60 * 1000,          // Cache for 5 minutes
    placeholderData: keepPreviousData,  // Keep showing old results while fetching new ones
  });
};
