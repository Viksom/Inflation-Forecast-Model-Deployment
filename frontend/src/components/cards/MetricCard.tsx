import { Card } from '@/components/ui/card';

interface MetricCardProps {
  title: string;
  value: string;
  detail: string;
  accent?: string;
}

export function MetricCard({ title, value, detail, accent }: MetricCardProps) {
  return (
    <Card className="group overflow-hidden transition hover:shadow-md">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{title}</p>
          <p className="mt-3 text-3xl font-semibold text-slate-900 dark:text-slate-100">{value}</p>
        </div>
        <div className="rounded-2xl bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">{accent}</div>
      </div>
      <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">{detail}</p>
    </Card>
  );
}
