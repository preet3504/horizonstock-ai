import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { TopGainersResponse } from '@/types/market';

export const useTopGainers = (minPctGain: number = 5.0, maLength: number = 44, maDistancePct: number = 1.0) => {
  return useQuery({
    queryKey: ['topGainers', minPctGain, maLength, maDistancePct],
    queryFn: async (): Promise<TopGainersResponse> => {
      const response = await apiClient.get('/stocks/top-gainers', {
        params: { 
          min_pct_gain: minPctGain,
          ma_length: maLength,
          ma_distance_pct: maDistancePct
        },
      });
      return response.data;
    },
    staleTime: 60 * 1000, // 1 minute
  });
};
