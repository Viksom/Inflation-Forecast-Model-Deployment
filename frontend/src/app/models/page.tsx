'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ModelCard } from '@/components/cards/ModelCard';
import { LoadingStage } from '@/components/ui/loading-stage';
import { getCurrentInflation, getInflationSeries, getModelMetrics } from '@/lib/api';
import { formatMonth, modelToSeriesKey } from '@/lib/utils';
import type { InflationDataPoint, ModelKey, ModelMetrics, SeriesPoint } from '@/types';

const defaultModels: ModelKey[] = ['ARIMA', 'CC-VAR', 'Ridge', 'LightGBM'];
const MODELS_REFERENCE_DATE = '2025-10';

export default function ModelsPage() {
  const [visibleModels, setVisibleModels] = useState<ModelKey[]>(defaultModels);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inflationSeries, setInflationSeries] = useState<InflationDataPoint[]>([]);
  const [currentInflation, setCurrentInflation] = useState<SeriesPoint[]>([]);
  const [modelMetrics, setModelMetrics] = useState<ModelMetrics[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      setLoading(true);
      setError(null);

      Promise.all([getInflationSeries('12M', 'LightGBM'), getCurrentInflation(), getModelMetrics()])
        .then(([series, currentSeries, metrics]) => {
          if (cancelled) return;
          setInflationSeries(series);
          setCurrentInflation(currentSeries);
          setModelMetrics(metrics);
        })
        .catch((err: Error) => {
          if (!cancelled) setError(err.message);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') load();
    };

    load();
    window.addEventListener('focus', load);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      cancelled = true;
      window.removeEventListener('focus', load);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  const toggleModel = (model: ModelKey) => {
    setVisibleModels((current) =>
      current.includes(model) ? current.filter((value) => value !== model) : [...current, model],
    );
  };

  const overlayData = useMemo(
    () => {
      const actualByDate = new Map(currentInflation.map((point) => [point.date, point.value]));
      return inflationSeries.map((item) => ({
        date: item.date,
        actual: actualByDate.get(item.date) ?? item.actual,
        arima: item.arima,
        ccvar: item.ccvar,
        ridge: item.ridge,
        lgbm: item.lgbm,
      }));
    },
    [currentInflation, inflationSeries],
  );
  const hasReferenceDate = useMemo(() => overlayData.some((point) => point.date === MODELS_REFERENCE_DATE), [overlayData]);

  const residualData = useMemo(
    () => {
      const actualByDate = new Map(currentInflation.map((point) => [point.date, point.value]));
      return inflationSeries
        .map((point) => {
          const actual = actualByDate.get(point.date) ?? point.actual;
          return { point, actual };
        })
        .filter(({ actual }) => actual !== null && actual !== undefined)
        .map(({ point, actual }) => ({
          date: point.date,
          ARIMA: (actual ?? 0) - (point.arima ?? 0),
          'CC-VAR': (actual ?? 0) - (point.ccvar ?? 0),
          Ridge: (actual ?? 0) - (point.ridge ?? 0),
          LightGBM: (actual ?? 0) - (point.lgbm ?? 0),
          arimaFitted: point.arima,
          ccvarFitted: point.ccvar,
          ridgeFitted: point.ridge,
          lgbmFitted: point.lgbm,
        }));
    },
    [currentInflation, inflationSeries],
  );

  const errorSeries = modelMetrics.map((metric) => ({
    model: metric.model,
    rmse: metric.rmse,
    mae: metric.mae,
  }));

  return (
    <section className="relative mx-auto max-w-screen-2xl px-4 pb-10 sm:px-6 lg:px-8">
      {loading ? <LoadingStage label="A comparar modelos" detail="A reunir previsões, resíduos e desempenho." /> : null}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Modelos</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900 dark:text-slate-100">Arquiteturas e desempenho</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
            Análise comparativa dos modelos de previsão, eficiência métrica e qualidade dos resíduos.
          </p>
        </div>
      </div>

      {error ? (
        <div className="mb-6 rounded-3xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800 dark:border-rose-500/30 dark:bg-rose-950 dark:text-rose-100">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-4">
        {loading ? Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="h-[340px]" />
        )) : modelMetrics.map((model) => (
          <ModelCard key={model.model} model={model} data={inflationSeries.slice(-18)} />
        ))}
      </div>

      <Card className="mt-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Sobreposição de previsões</p>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Selecione modelos para comparar as trajetórias de previsão e histórica.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {defaultModels.map((model) => (
              <label key={model} className="inline-flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                <Checkbox checked={visibleModels.includes(model)} onChange={() => toggleModel(model)} />
                {model}
              </label>
            ))}
          </div>
        </div>
        <div className="mt-6 h-[340px] sm:h-[420px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={overlayData} margin={{ top: 24, right: 24, bottom: 18, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={formatMonth} minTickGap={24} />
              <YAxis tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: 10, borderColor: '#e2e8f0', backgroundColor: '#fff' }} formatter={(value: number) => `${value.toFixed(1)}%`} />
              <Legend verticalAlign="top" height={40} />
              <Line dataKey="actual" name="Histórico" stroke="var(--chart-ink)" strokeWidth={2} dot={false} />
              {visibleModels.includes('ARIMA') && <Line dataKey="arima" name="ARIMA" stroke="#4f46e5" dot={false} />}
              {visibleModels.includes('CC-VAR') && <Line dataKey="ccvar" name="CC-VAR" stroke="#0ea5e9" dot={false} />}
              {visibleModels.includes('Ridge') && <Line dataKey="ridge" name="Ridge" stroke="#14b8a6" dot={false} />}
              {visibleModels.includes('LightGBM') && <Line dataKey="lgbm" name="LightGBM" stroke="#d97706" dot={false} />}
              {hasReferenceDate ? <ReferenceLine x={MODELS_REFERENCE_DATE} stroke="#64748b" strokeDasharray="3 3" label="Treino" /> : null}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <Card>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Comparação de erro</p>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">RMSE e MAE lado a lado por modelo.</p>
          <div className="mt-6 h-[280px] sm:h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={errorSeries} margin={{ top: 24, right: 24, bottom: 18, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="model" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                <Tooltip formatter={(value: number) => value.toFixed(2)} />
                <Legend verticalAlign="top" height={40} />
                <Bar dataKey="rmse" name="RMSE" fill="#4338ca" radius={[8, 8, 0, 0]} />
                <Bar dataKey="mae" name="MAE" fill="#0f766e" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Análise de resíduos</p>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Resíduos versus valores ajustados para cada modelo.</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 sm:gap-6">
            {(['ARIMA', 'CC-VAR', 'Ridge', 'LightGBM'] as ModelKey[]).map((model) => (
              <div key={model} className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{model}</p>
                <div className="mt-4 h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis
                        dataKey={`${modelToSeriesKey(model)}Fitted`}
                        name="Ajustado"
                        tick={{ fill: '#64748b', fontSize: 10 }}
                        tickFormatter={(value: number) => value.toFixed(2)}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis dataKey={model} name="Resíduo" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip formatter={(value: number) => `${value.toFixed(2)}%`} cursor={{ strokeDasharray: '3 3' }} />
                      <Scatter data={residualData} fill={model === 'LightGBM' ? '#d97706' : model === 'Ridge' ? '#14b8a6' : model === 'ARIMA' ? '#4f46e5' : '#0ea5e9'} name={model} />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </section>
  );
}
