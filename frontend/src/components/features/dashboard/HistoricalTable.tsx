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
import { motion } from "framer-motion"

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

  // Reverse data so the most recent year/period is on the left
  const displayData = [...data].reverse();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.5 }}
    >
      <Card className="overflow-hidden mt-6 rounded-2xl bg-card border-border shadow-md">
        <CardHeader className="border-b border-border bg-muted/50 pb-4">
          <CardTitle className="text-xl font-semibold text-foreground drop-shadow-sm">{title}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="w-full whitespace-nowrap">
            <Table>
              <TableHeader className="bg-muted">
                <TableRow className="border-b border-border hover:bg-transparent">
                  <TableHead className="w-[250px] font-bold text-foreground bg-muted sticky left-0 shadow-[4px_0_12px_-4px_rgba(0,0,0,0.1)] z-20 py-4 px-6 tracking-wide">Metric</TableHead>
                  {displayData.map((col, idx) => (
                    <TableHead key={idx} className="text-right text-muted-foreground font-mono font-semibold py-4 px-6">
                      {col[dateKey] || `Period ${idx + 1}`}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {allKeys.map((key) => (
                  <TableRow key={key} className="border-b border-border hover:bg-muted/50 transition-colors group">
                    <TableCell className="font-medium text-muted-foreground group-hover:text-foreground transition-colors bg-card sticky left-0 shadow-[4px_0_12px_-4px_rgba(0,0,0,0.1)] z-10 py-4 px-6 border-r border-border">
                      {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </TableCell>
                    {displayData.map((col, idx) => {
                      const val = col[key];
                      const isNum = typeof val === 'number';
                      const isNegative = isNum && val < 0;
                      
                      return (
                        <TableCell key={idx} className={`text-right font-mono font-medium py-4 px-6 ${isNegative ? 'text-destructive' : 'text-foreground/90'}`}>
                          {val !== null && val !== undefined ? 
                            (isNum ? (val % 1 === 0 ? val.toLocaleString() : val.toFixed(2)) : val)
                            : '-'}
                        </TableCell>
                      )
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <ScrollBar orientation="horizontal" className="bg-white/5" />
          </ScrollArea>
        </CardContent>
      </Card>
    </motion.div>
  );
}
