import { Card } from '@/components/ui/card';
import { formatPercent } from '@/lib/utils';

interface DriverCardProps {
  variable: string;
  importance: number;
}

export function DriverCard({ variable, importance }: DriverCardProps) {
  const positive = importance >= 0;
  const width = Math.min(100, Math.abs(importance) * 120);
  return (
    <Card className="flex items-center gap-4 p-4">
      <div className="min-w-[110px] text-sm font-semibold text-slate-900 dark:text-slate-100">{variable}</div>
      <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div className={`h-full rounded-full ${positive ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ width: `${width}%` }} />
      </div>
      <div className={`w-14 text-right text-sm font-semibold ${positive ? 'text-emerald-700' : 'text-rose-600'}`}>
        {positive ? '+' : ''}{formatPercent(importance)}
      </div>
    </Card>
  );
}
