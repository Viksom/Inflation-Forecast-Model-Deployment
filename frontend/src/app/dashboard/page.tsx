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
import { LoadingStage } from '@/components/ui/loading-stage';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAppStore } from '@/lib/store';
import { getCurrentInflation, getFeatureImportance, getInflationSeries, getModelMetrics } from '@/lib/api';
import { formatPercent, formatMonth, modelToSeriesKey } from '@/lib/utils';
import type { FeatureImportance, InflationDataPoint, ModelMetrics, SeriesPoint } from '@/types';

const DASHBOARD_REFERENCE_DATE = '2025-10';
const FORECAST_START_DATE = '2025-10';
const HORIZON_STEPS = {
  '1M': 1,
  '3M': 3,
  '12M': 12,
} as const;

function addMonths(dateKey: string, monthsToAdd: number) {
  const [year, month] = dateKey.split('-').map(Number);
  const date = new Date(year, month - 1 + monthsToAdd, 1);
  const nextYear = date.getFullYear();
  const nextMonth = String(date.getMonth() + 1).padStart(2, '0');
  return `${nextYear}-${nextMonth}`;
}

function formatModelCategory(category: string) {
  if (category === 'Classical') return 'Clássico';
  if (category === 'Machine Learning') return 'Aprendizagem Automática';
  return category;
}

function formatRelativeMetric(value: number) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '-';
  return `${(value * 100).toFixed(1)}%`;
}

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

function ChartLegend({ payload }: { payload?: Array<{ color?: string; value?: string }> }) {
  const visibleEntries = (payload ?? []).filter(
    (entry) => entry.value !== 'Interval superior' && entry.value !== 'Interval inferior',
  );

  if (visibleEntries.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center justify-start gap-x-4 gap-y-2 pb-3 text-xs text-slate-600 dark:text-slate-300 sm:justify-end sm:text-sm">
      {visibleEntries.map((entry) => (
        <div key={`${entry.value}-${entry.color}`} className="flex min-w-0 items-center gap-2">
          <span className="h-2.5 w-2.5 flex-none rounded-full" style={{ backgroundColor: entry.color ?? '#64748b' }} />
          <span className="truncate">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inflationSeries, setInflationSeries] = useState<InflationDataPoint[]>([]);
  const [currentInflation, setCurrentInflation] = useState<SeriesPoint[]>([]);
  const [modelMetrics, setModelMetrics] = useState<ModelMetrics[]>([]);
  const [featureImportance, setFeatureImportance] = useState<FeatureImportance[]>([]);
  const selectedModel = useAppStore((state) => state.selectedModel);
  const forecastHorizon = useAppStore((state) => state.forecastHorizon);
  const maxVisibleDate = addMonths(FORECAST_START_DATE, HORIZON_STEPS[forecastHorizon]);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      setLoading(true);
      setError(null);

      const importanceRequest = selectedModel === 'Ridge' || selectedModel === 'LightGBM'
        ? getFeatureImportance(selectedModel)
        : Promise.resolve([]);

      Promise.all([
        getInflationSeries(forecastHorizon, selectedModel),
        getCurrentInflation(),
        getModelMetrics(),
        importanceRequest,
      ])
        .then(([series, currentSeries, metrics, importance]) => {
          if (cancelled) return;
          setInflationSeries(series);
          setCurrentInflation(currentSeries);
          setModelMetrics(metrics);
          setFeatureImportance(importance);
        })
        .catch((err: Error) => {
          if (!cancelled) setError(err.message);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [forecastHorizon, selectedModel]);

  const selectedKey = modelToSeriesKey(selectedModel);
  const visibleInflationSeries = useMemo(
    () => inflationSeries.filter((point) => point.date <= maxVisibleDate),
    [inflationSeries, maxVisibleDate],
  );
  const latest = visibleInflationSeries[visibleInflationSeries.length - 1];
  const previous = visibleInflationSeries[visibleInflationSeries.length - 2];

  const selectedValue = latest?.[selectedKey] ?? 0;
  const modelName = selectedModel;
  const bestModel = modelMetrics.reduce<ModelMetrics | null>((current, next) => (!current || next.rmse < current.rmse ? next : current), null);

  const changeValue = selectedValue - (previous?.[selectedKey] ?? selectedValue);

  const modelData = useMemo(
    () => {
      const actualByDate = new Map(currentInflation.map((point) => [point.date, point.value]));
      return visibleInflationSeries
        .map((point) => ({
          date: point.date,
          actual: actualByDate.get(point.date) ?? point.actual,
          selected: point[selectedKey],
          low: point.confidenceLow,
          high: point.confidenceHigh,
        }));
    },
    [currentInflation, selectedKey, visibleInflationSeries],
  );

  const activeImportance = useMemo(
    () => featureImportance.filter((item) => item.model === selectedModel).sort((a, b) => Math.abs(b.importance) - Math.abs(a.importance)),
    [featureImportance, selectedModel],
  );
  const hasReferenceDate = useMemo(() => modelData.some((point) => point.date === DASHBOARD_REFERENCE_DATE), [modelData]);
  const showLoadingStage = loading && inflationSeries.length === 0 && modelMetrics.length === 0;

  return (
    <section className="relative mx-auto max-w-screen-2xl px-4 pb-10 sm:px-6 lg:px-8">
      {showLoadingStage ? <LoadingStage label="A compor o painel" detail="A alinhar histórico, previsões e métricas." /> : null}
      {error ? (
        <div className="mb-6 rounded-3xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800 dark:border-rose-500/30 dark:bg-rose-950 dark:text-rose-100">
          {error}
        </div>
      ) : null}

      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Painel</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900 dark:text-slate-100">Perspetiva de inflação para Portugal</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
            Visão consolidada do ciclo de inflação, desempenho dos modelos e confiança das previsões para os próximos meses.
          </p>
        </div>
        <div className="w-full rounded-3xl border border-base bg-surface p-4 shadow-sm md:w-auto">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Horizonte selecionado</p>
          <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">{forecastHorizon}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-32 rounded-3xl" />)
        ) : (
          <>
            <Card>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Previsão atual</p>
              <p className="mt-4 break-words text-3xl font-semibold text-slate-900 dark:text-slate-100 sm:text-4xl">{formatPercent(selectedValue)}</p>
              <p className="mt-3 flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                <span className={changeValue >= 0 ? 'text-rose-600' : 'text-emerald-600'}>{changeValue >= 0 ? '▲' : '▼'}</span>
                {formatPercent(changeValue)} desde o mês anterior
              </p>
            </Card>
            <Card>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Melhor modelo</p>
              <p className="mt-4 break-words text-2xl font-semibold text-slate-900 dark:text-slate-100 sm:text-3xl">{bestModel?.model ?? '-'}</p>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">RMSE</div>
                    <div className="text-base font-semibold text-slate-900 dark:text-slate-100">{bestModel?.rmse.toFixed(2) ?? '-'}</div>
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">MAE</div>
                    <div className="text-base font-semibold text-slate-900 dark:text-slate-100">{bestModel?.mae.toFixed(2) ?? '-'}</div>
                  </div>
                </div>
              </div>
            </Card>
            <Card>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Variação de previsão</p>
              <p className="mt-4 break-words text-2xl font-semibold text-slate-900 dark:text-slate-100 sm:text-3xl">{formatPercent(Math.abs(changeValue))}</p>
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Comparado com o período anterior</p>
            </Card>
            <Card>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Confiança</p>
              <p className="mt-4 break-words text-2xl font-semibold text-slate-900 dark:text-slate-100 sm:text-3xl">{latest ? formatPercent((latest.confidenceHigh ?? 0) - (latest.confidenceLow ?? 0)) : '-'}</p>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                <div className="h-full w-2/3 rounded-full bg-indigo-600" />
              </div>
            </Card>
          </>
        )}
      </div>

      <div className="mt-8 rounded-3xl border border-base bg-surface p-4 shadow-soft sm:p-6">
        {loading ? (
          <Skeleton className="h-[360px] sm:h-[460px]" />
        ) : (
          <ResponsiveContainer width="100%" height={360}>
            <ComposedChart data={modelData} margin={{ top: 12, right: 12, bottom: 18, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={formatMonth} minTickGap={24} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip content={<ForecastTooltip />} />
              <Legend verticalAlign="top" align="left" height={56} content={<ChartLegend />} />
              <Area type="monotone" dataKey="high" name="Interval superior" legendType="none" stroke="transparent" fill="rgba(59, 130, 246, 0.12)" activeDot={false} />
              <Area type="monotone" dataKey="low" name="Interval inferior" legendType="none" stroke="transparent" fill="rgba(59, 130, 246, 0.0)" activeDot={false} />
              <Line type="monotone" dataKey="actual" name="Histórico" stroke="var(--chart-ink)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="selected" name={`Previsão ${modelName}`} stroke="#4f46e5" strokeWidth={3} dot={false} strokeDasharray="5 5" />
              {hasReferenceDate ? <ReferenceLine x={DASHBOARD_REFERENCE_DATE} stroke="#64748b" strokeDasharray="3 3" label="Treino" /> : null}
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <Card className="min-w-0 overflow-hidden">
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
            <div className="mt-6 space-y-3">
              <div className="max-w-full overflow-x-auto rounded-3xl border border-slate-200 dark:border-slate-700">
                <Table className="min-w-[36rem]">
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
                        <TableCell>{formatRelativeMetric(model.rrmse)}</TableCell>
                        <TableCell>{formatRelativeMetric(model.rmae)}</TableCell>
                        <TableCell><Badge variant="outline">{formatModelCategory(model.category)}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </tbody>
                </Table>
              </div>
              <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
                RRMSE e RMAE são calculados relativamente a um modelo Naive que usa a média histórica como previsão.
                100.0% significa desempenho igual ao Naive; abaixo de 100.0% significa melhor desempenho.
              </p>
            </div>
          )}
        </Card>

        <Card className="min-w-0 overflow-hidden">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Determinantes macroeconómicos</p>
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
                <div key={item.variable} className="min-w-0 rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
                  <div className="flex min-w-0 flex-col items-start gap-1 text-sm font-semibold text-slate-900 dark:text-slate-100 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                    <span className="w-full break-words">{item.variable}</span>
                    <span className={item.importance >= 0 ? 'shrink-0 text-emerald-600' : 'shrink-0 text-rose-600'}>{formatPercent(item.importance)}</span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                    <div className={`h-full rounded-full ${item.importance >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ width: `${Math.min(100, Math.abs(item.importance) * 120)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-950 dark:text-amber-100">
              A análise de determinantes não está disponível para modelos ARIMA ou CC-VAR. Selecione Ridge ou LightGBM para visualizar importância e sensibilidades das variáveis.
            </div>
          )}
        </Card>
      </div>
    </section>
  );
}
