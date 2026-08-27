export interface TopGainerItem {
  symbol: string;
  identifier?: string;
  industry?: string;
  lastPrice: number;
  previousClose: number;
  change: number;
  pChange: number;
  totalTradedVolume: number;
  lastUpdateTime: string;
  smaValue?: number | null;
  smaDistance?: number | null;
}

export interface TopGainersResponse {
  index: string;
  min_pct_gain: number;
  count: number;
  gainers: TopGainerItem[];
}
