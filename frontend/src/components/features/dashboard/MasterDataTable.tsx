import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { StockMasterData } from "@/types/stock"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function MasterDataTable({ data }: { data: StockMasterData }) {
  // Convert object to array of key-value pairs for easy rendering
  const entries = Object.entries(data).filter(([key, value]) => value !== null);

  // Grouping keys logically
  const groups = {
    Valuation: ['price', 'pe', 'bookValue', 'roce', 'roe', 'debtToEquity'],
    Quarterly: ['salesQuarterly', 'salesYoYGrowth', 'operatingProfit', 'netProfit', 'eps'],
    BalanceSheet: ['equityCapital', 'reserves', 'totalDebt', 'totalAssets'],
    CashFlow: ['cfo', 'cfi', 'cff', 'cumulativeCFO5to10y']
  };

  const renderTable = (title: string, keys: string[]) => {
    const filteredEntries = entries.filter(([key]) => keys.includes(key));
    if (filteredEntries.length === 0) return null;

    return (
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-slate-400 uppercase tracking-wider">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableBody>
              {filteredEntries.map(([key, value]) => (
                <TableRow key={key} className="border-b-slate-800 hover:bg-slate-800/50">
                  <TableCell className="font-medium text-slate-300 w-1/2">
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </TableCell>
                  <TableCell className="text-right font-mono text-emerald-400">
                    {typeof value === 'number' ? 
                      (value % 1 === 0 ? value.toLocaleString() : value.toFixed(2)) 
                      : value?.toString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {renderTable('Valuation', groups.Valuation)}
      {renderTable('Quarterly', groups.Quarterly)}
      {renderTable('Balance Sheet', groups.BalanceSheet)}
      {renderTable('Cash Flow', groups.CashFlow)}
    </div>
  );
}
