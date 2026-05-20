'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAppStore } from '@/lib/store';
import { getFeatureImportance, getInflationSeries, getModelMetrics } from '@/lib/api';
import { formatPercent, formatMonth, modelToSeriesKey } from '@/lib/utils';
import type { FeatureImportance, InflationDataPoint, ModelMetrics } from '@/types';

const DASHBOARD_REFERENCE_DATE = '2025-10';

function ForecastTooltip({ active, payload, label }: { active?: boolean; payload?: any; label?: string }) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-lg text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
      <div className="font-semibold">{formatMonth(label ?? '')}</div>
      {payload.map((entry: any) => (
        <div key={entry.dataKey} className="mt-2 flex items-center justify-between gap-3">
          <span className="text-slate-500">{entry.name}</span>
          <span className="font-semibold">{formatPercent(entry.value)}</span>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inflationSeries, setInflationSeries] = useState<InflationDataPoint[]>([]);
  const [modelMetrics, setModelMetrics] = useState<ModelMetrics[]>([]);
  const [featureImportance, setFeatureImportance] = useState<FeatureImportance[]>([]);
  const selectedModel = useAppStore((state) => state.selectedModel);
  const forecastHorizon = useAppStore((state) => state.forecastHorizon);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const importanceRequest = selectedModel === 'Ridge' || selectedModel === 'LightGBM'
      ? getFeatureImportance(selectedModel)
      : Promise.resolve([]);

    Promise.all([
      getInflationSeries(forecastHorizon, selectedModel),
      getModelMetrics(),
      importanceRequest,
    ])
      .then(([series, metrics, importance]) => {
        if (cancelled) return;
        setInflationSeries(series);
        setModelMetrics(metrics);
        setFeatureImportance(importance);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [forecastHorizon, selectedModel]);

  const latest = inflationSeries[inflationSeries.length - 1];
  const previous = inflationSeries[inflationSeries.length - 2];
  const selectedKey = modelToSeriesKey(selectedModel);

  const selectedValue = latest?.[selectedKey] ?? 0;
  const modelName = selectedModel;
  const bestModel = modelMetrics.reduce<ModelMetrics | null>((current, next) => (!current || next.rmse < current.rmse ? next : current), null);

  const changeValue = selectedValue - (previous?.[selectedKey] ?? selectedValue);

  const modelData = useMemo(
    () => inflationSeries.map((point) => ({
      date: point.date,
      actual: point.actual,
      selected: point[selectedKey],
      low: point.confidenceLow,
      high: point.confidenceHigh,
    })),
    [inflationSeries, selectedKey],
  );

  const activeImportance = useMemo(
    () => featureImportance.filter((item) => item.model === selectedModel).sort((a, b) => Math.abs(b.importance) - Math.abs(a.importance)),
    [featureImportance, selectedModel],
  );
  const hasReferenceDate = useMemo(() => modelData.some((point) => point.date === DASHBOARD_REFERENCE_DATE), [modelData]);

  return (
    <section className="mx-auto max-w-screen-2xl px-8 pb-10">
      {error ? (
        <div className="mb-6 rounded-3xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800 dark:border-rose-500/30 dark:bg-rose-950 dark:text-rose-100">
          {error}
        </div>
      ) : null}

      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Dashboard</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900 dark:text-slate-100">Perspetiva de inflação para Portugal</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
            Visão consolidada do ciclo de inflação, desempenho dos modelos e confiança das previsões para os próximos meses.
          </p>
        </div>
        <div className="rounded-3xl border border-base bg-surface p-4 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Horizonte selecionado</p>
          <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">{forecastHorizon}</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-32 rounded-3xl" />)
        ) : (
          <>
            <Card>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Previsão atual</p>
              <p className="mt-4 text-4xl font-semibold text-slate-900 dark:text-slate-100">{formatPercent(selectedValue)}</p>
              <p className="mt-3 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <span className={changeValue >= 0 ? 'text-rose-600' : 'text-emerald-600'}>{changeValue >= 0 ? '▲' : '▼'}</span>
                {formatPercent(changeValue)} desde o mês anterior
              </p>
            </Card>
            <Card>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Melhor modelo</p>
              <p className="mt-4 text-3xl font-semibold text-slate-900 dark:text-slate-100">{bestModel?.model ?? '-'}</p>
              <div className="mt-4 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <Badge variant="outline">RMSE</Badge>
                <span>{bestModel?.rmse.toFixed(2) ?? '-'}</span>
              </div>
            </Card>
            <Card>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Variação de previsão</p>
              <p className="mt-4 text-3xl font-semibold text-slate-900 dark:text-slate-100">{formatPercent(Math.abs(changeValue))}</p>
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Comparado com o período anterior</p>
            </Card>
            <Card>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Confiança</p>
              <p className="mt-4 text-3xl font-semibold text-slate-900 dark:text-slate-100">{latest ? formatPercent((latest.confidenceHigh ?? 0) - (latest.confidenceLow ?? 0)) : '-'}</p>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                <div className="h-full w-2/3 rounded-full bg-indigo-600" />
              </div>
            </Card>
          </>
        )}
      </div>

      <div className="mt-8 rounded-3xl border border-base bg-surface p-6 shadow-soft">
        {loading ? (
          <Skeleton className="h-[460px]" />
        ) : (
          <ResponsiveContainer width="100%" height={460}>
            <ComposedChart data={modelData} margin={{ top: 24, right: 24, bottom: 18, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={formatMonth} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip content={<ForecastTooltip />} />
              <Legend verticalAlign="top" align="right" height={40} />
              <Area type="monotone" dataKey="high" name="Interval superior" stroke="transparent" fill="rgba(59, 130, 246, 0.12)" activeDot={false} />
              <Area type="monotone" dataKey="low" name="Interval inferior" stroke="transparent" fill="rgba(59, 130, 246, 0.0)" activeDot={false} />
              <Line type="monotone" dataKey="actual" name="Histórico" stroke="#0f172a" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="selected" name={`${modelName} Forecast`} stroke="#4f46e5" strokeWidth={3} dot={false} strokeDasharray="5 5" />
              {hasReferenceDate ? <ReferenceLine x={DASHBOARD_REFERENCE_DATE} stroke="#64748b" strokeDasharray="3 3" label="Treino" /> : null}
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Desempenho dos modelos</p>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Comparação de métricas para cada abordagem.</p>
            </div>
          </div>
          {loading ? (
            <div className="mt-6 space-y-4">
              {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-12 rounded-3xl" />)}
            </div>
          ) : (
            <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-700">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Modelo</TableHead>
                    <TableHead>RMSE</TableHead>
                    <TableHead>MAE</TableHead>
                    <TableHead>RRMSE</TableHead>
                    <TableHead>RMAE</TableHead>
                    <TableHead>Categoria</TableHead>
                  </TableRow>
                </TableHeader>
                <tbody>
                  {modelMetrics.map((model) => (
                    <TableRow key={model.model} className={model.model === bestModel?.model ? 'bg-indigo-50 font-semibold dark:bg-slate-900' : ''}>
                      <TableCell>{model.model}</TableCell>
                      <TableCell>{model.rmse.toFixed(2)}</TableCell>
                      <TableCell>{model.mae.toFixed(2)}</TableCell>
                      <TableCell>{model.rrmse.toFixed(2)}</TableCell>
                      <TableCell>{model.rmae.toFixed(2)}</TableCell>
                      <TableCell><Badge variant="outline">{model.category}</Badge></TableCell>
                    </TableRow>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Drivers macroeconómicos</p>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Importância de cada variável no modelo selecionado.</p>
            </div>
          </div>
          {loading ? (
            <div className="mt-6 space-y-4">
              {Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-16 rounded-3xl" />)}
            </div>
          ) : selectedModel === 'Ridge' || selectedModel === 'LightGBM' ? (
            <div className="mt-6 space-y-3">
              {activeImportance.slice(0, 5).map((item) => (
                <div key={item.variable} className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
                  <div className="flex items-center justify-between gap-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
                    <span>{item.variable}</span>
                    <span className={item.importance >= 0 ? 'text-emerald-600' : 'text-rose-600'}>{formatPercent(item.importance)}</span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                    <div className={`h-full rounded-full ${item.importance >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ width: `${Math.min(100, Math.abs(item.importance) * 120)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-950 dark:text-amber-100">
              A análise de drivers não está disponível para modelos ARIMA ou CC-VAR. Selecione Ridge ou LightGBM para visualizar importância e sensibilidades das variáveis.
            </div>
          )}
        </Card>
      </div>
    </section>
  );
}
