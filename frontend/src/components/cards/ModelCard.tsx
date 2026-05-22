import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import type { InflationDataPoint, ModelMetrics } from '@/types';
import { modelToSeriesKey } from '@/lib/utils';

function formatModelCategory(category: string) {
  if (category === 'Classical') return 'Clássico';
  if (category === 'Machine Learning') return 'Aprendizagem Automática';
  return category;
}

interface ModelCardProps {
  model: ModelMetrics;
  data: InflationDataPoint[];
}

export function ModelCard({ model, data }: ModelCardProps) {
  const [open, setOpen] = useState(false);
  const trendData = useMemo(
    () => data.slice(-12).map((point) => ({ date: point.date, value: point[modelToSeriesKey(model.model)] })),
    [data, model.model],
  );

  return (
    <Card className="group min-h-[340px] flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{model.model}</p>
            <Badge variant={model.category === 'Classical' ? 'outline' : 'default'} className="mt-2">{formatModelCategory(model.category)}</Badge>
          </div>
        </div>

        <div className="mt-6 space-y-3 text-sm text-slate-500 dark:text-slate-400">
          <div className="flex items-center justify-between">
            <span>RMSE</span>
            <span>{model.rmse.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>MAE</span>
            <span>{model.mae.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="mt-5 h-24 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trendData}>
            <Line type="monotone" dataKey="value" stroke="#3730a3" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="mt-4 inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-indigo-500 hover:text-indigo-700 dark:border-slate-700 dark:text-slate-200 dark:hover:text-indigo-300"
      >
        {open ? 'Fechar detalhes' : 'Ver detalhes'}
      </button>
      {open ? (
        <div className="mt-4 rounded-3xl bg-slate-50 p-4 text-sm text-slate-600 dark:bg-slate-900 dark:text-slate-300">
          Previsão e análise histórica para {model.model}. A eficiência do modelo reflete a qualidade ajustada da previsão e a compatibilidade com cenários.
        </div>
      ) : null}
    </Card>
  );
}
