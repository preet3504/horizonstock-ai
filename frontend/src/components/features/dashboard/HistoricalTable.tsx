import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"

interface HistoricalTableProps {
  title: string;
  data: Record<string, any>[];
  dateKey: string; // usually 'date' or 'year'
}

export function HistoricalTable({ title, data, dateKey }: HistoricalTableProps) {
  if (!data || data.length === 0) return null;

  // Extract all unique keys except the dateKey
  const allKeys = Array.from(
    new Set(data.flatMap(item => Object.keys(item).filter(k => k !== dateKey && k !== 'raw_pdf')))
  );

  return (
    <Card className="bg-slate-900 border-slate-800 overflow-hidden mt-6">
      <CardHeader>
        <CardTitle className="text-xl text-slate-200">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="w-full whitespace-nowrap rounded-md border-t border-slate-800">
          <Table>
            <TableHeader className="bg-slate-950/50">
              <TableRow className="border-b-slate-800 hover:bg-transparent">
                <TableHead className="w-[200px] font-bold text-slate-300 bg-slate-900 sticky left-0 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)] z-10">Metric</TableHead>
                {data.map((col, idx) => (
                  <TableHead key={idx} className="text-right text-slate-400 font-mono">
                    {col[dateKey] || `Period ${idx + 1}`}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {allKeys.map((key) => (
                <TableRow key={key} className="border-b-slate-800/50 hover:bg-slate-800/50">
                  <TableCell className="font-medium text-slate-400 bg-slate-900 sticky left-0 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)] z-10">
                    {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </TableCell>
                  {data.map((col, idx) => (
                    <TableCell key={idx} className="text-right font-mono text-slate-300">
                      {col[key] !== null && col[key] !== undefined ? 
                        (typeof col[key] === 'number' ? (col[key] % 1 === 0 ? col[key].toLocaleString() : col[key].toFixed(2)) : col[key])
                        : '-'}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
