import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { StockAnalysisResponse } from '@/types/stock';

export const fetchStockAnalysis = async (symbol: string): Promise<StockAnalysisResponse> => {
  const { data } = await apiClient.get<StockAnalysisResponse>(`/stocks/analyze`, {
    params: { symbol },
  });
  return data;
};

export const useStockAnalysis = (symbol: string, enabled = true) => {
  return useQuery({
    queryKey: ['stock-analysis', symbol],
    queryFn: () => fetchStockAnalysis(symbol),
    enabled: !!symbol && enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    retry: 1,
  });
};
