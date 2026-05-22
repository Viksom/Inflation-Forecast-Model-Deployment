'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getCorrelationMatrix, getLagCorrelations, getMacroVariables, getTargetVariable } from '@/lib/api';
import { formatMonth } from '@/lib/utils';
import type { CorrelationMatrix, MacroVariable } from '@/types';

const rollingAverage = (series: { date: string; value: number }[], period: number) =>
  series.map((point, index) => {
    const window = series.slice(Math.max(0, index - period + 1), index + 1);
    const average = window.reduce((sum, item) => sum + item.value, 0) / window.length;
    return { date: point.date, value: Number(average.toFixed(2)) };
  });

const formatAxisTick = (value: number) => {
  const absoluteValue = Math.abs(value);
  if (absoluteValue >= 1000) {
    return new Intl.NumberFormat('pt-PT', {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  }
  if (absoluteValue >= 100) {
    return value.toLocaleString('pt-PT', { maximumFractionDigits: 0 });
  }
  if (absoluteValue >= 10) {
    return value.toLocaleString('pt-PT', { maximumFractionDigits: 1 });
  }
  return value.toLocaleString('pt-PT', { maximumFractionDigits: 2 });
};

const getAxisDomain = (values: Array<number | null | undefined>) => {
  const numericValues = values.filter((value): value is number => typeof value === 'number' && !Number.isNaN(value));
  if (numericValues.length === 0) return [0, 1] as [number, number];

  const min = Math.min(...numericValues);
  const max = Math.max(...numericValues);
  if (min === max) {
    const padding = Math.abs(min || 1) * 0.05;
    return [min - padding, max + padding] as [number, number];
  }

  const padding = (max - min) * 0.05;
  return [min, max + padding] as [number, number];
};

export default function VariablesPage() {
  const [macroVariables, setMacroVariables] = useState<MacroVariable[]>([]);
  const [targetVariable, setTargetVariable] = useState<MacroVariable | null>(null);
  const [correlationMatrix, setCorrelationMatrix] = useState<CorrelationMatrix>({ labels: [], values: [] });
  const [lagCorrelation, setLagCorrelation] = useState<{ lag: number; value: number | null }[]>([]);
  const [selectedVariable, setSelectedVariable] = useState<MacroVariable | null>(null);
  const [show3m, setShow3m] = useState(true);
  const [show12m, setShow12m] = useState(false);
  const [tab, setTab] = useState('time');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      setLoading(true);

      Promise.all([getMacroVariables(), getTargetVariable(), getCorrelationMatrix()])
        .then(([variables, target, matrix]) => {
          if (cancelled) return;
          setMacroVariables(variables);
          setTargetVariable(target);
          setCorrelationMatrix(matrix);
          setSelectedVariable((current) => current ? variables.find((variable) => variable.name === current.name) ?? variables[0] ?? null : variables[0] ?? null);
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

  useEffect(() => {
    if (!selectedVariable) return;

    let cancelled = false;
    getLagCorrelations(selectedVariable.name)
      .then((result) => {
        if (!cancelled) setLagCorrelation(result.values);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedVariable]);

  const average3m = useMemo(() => rollingAverage(selectedVariable?.series ?? [], 3), [selectedVariable]);
  const average12m = useMemo(() => rollingAverage(selectedVariable?.series ?? [], 12), [selectedVariable]);
  const comparisonChartData = useMemo(() => {
    if (!selectedVariable) return [];

    const targetByDate = new Map((targetVariable?.series ?? []).map((point) => [point.date, point.value]));
    return selectedVariable.series.map((point) => ({
      date: point.date,
      selected: point.value,
      target: targetByDate.get(point.date) ?? null,
    }));
  }, [selectedVariable, targetVariable]);
  const selectedAxisDomain = useMemo(
    () => getAxisDomain([
      ...comparisonChartData.map((point) => point.selected),
      ...(show3m ? average3m.map((point) => point.value) : []),
      ...(show12m ? average12m.map((point) => point.value) : []),
    ]),
    [average3m, average12m, comparisonChartData, show3m, show12m],
  );
  const targetAxisDomain = useMemo(
    () => getAxisDomain(comparisonChartData.map((point) => point.target)),
    [comparisonChartData],
  );

  return (
    <section className="mx-auto max-w-screen-2xl px-4 pb-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Variáveis</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900 dark:text-slate-100">Explorador de séries macroeconómicas</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
            Navegue por indicadores-chave e compare padrões temporais, defasagens e correlações com inflação.
          </p>
        </div>
      </div>

      {error ? (
        <div className="mb-6 rounded-3xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800 dark:border-rose-500/30 dark:bg-rose-950 dark:text-rose-100">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[240px_1fr]">
        <aside className="space-y-4 rounded-3xl border border-base bg-surface p-4 shadow-soft">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Seleção de variável</p>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
            {loading ? Array.from({ length: 8 }).map((_, index) => <Skeleton key={index} className="h-16 rounded-3xl" />) : macroVariables.map((variable) => (
              <button
                key={variable.name}
                type="button"
                onClick={() => setSelectedVariable(variable)}
                className={`w-full rounded-3xl px-4 py-3 text-left text-sm transition ${
                  selectedVariable?.name === variable.name ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-700 hover:bg-slate-100 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                <div className="font-semibold">{variable.name}</div>
                <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{variable.source}</div>
              </button>
            ))}
          </div>
        </aside>

        <div className="space-y-6">
          <Card>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">{targetVariable && selectedVariable ? `Evolução da ${targetVariable.name} face a ${selectedVariable.name}` : selectedVariable?.name ?? 'Variável'}</p>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Série histórica e médias móveis.</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShow3m((prev) => !prev)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold ${show3m ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'}`}
                >
                  3M
                </button>
                <button
                  type="button"
                  onClick={() => setShow12m((prev) => !prev)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold ${show12m ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'}`}
                >
                  12M
                </button>
              </div>
            </div>

            {loading || !selectedVariable ? (
              <Skeleton className="h-[340px] sm:h-[460px]" />
            ) : (
              <div className="h-[340px] sm:h-[460px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={comparisonChartData} margin={{ top: 24, right: 24, bottom: 18, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748b', fontSize: 11 }}
                      tickFormatter={formatMonth}
                      label={{ value: 'Mês Ano', position: 'insideBottom', offset: -10, fill: '#64748b', fontSize: 12 }}
                    />
                    <YAxis
                      yAxisId="selected"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748b', fontSize: 11 }}
                      tickFormatter={formatAxisTick}
                      domain={selectedAxisDomain}
                      width={48}
                      label={{ value: `${selectedVariable.name} (${selectedVariable.unit})`, angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 12 }}
                    />
                    <YAxis
                      yAxisId="target"
                      orientation="right"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#94a3b8', fontSize: 11 }}
                      tickFormatter={formatAxisTick}
                      domain={targetAxisDomain}
                      width={48}
                      label={{ value: `${targetVariable?.name ?? 'Variável-alvo'} (${targetVariable?.unit ?? '%'})`, angle: 90, position: 'insideRight', fill: '#94a3b8', fontSize: 12 }}
                    />
                    <Tooltip formatter={(value: number) => `${value.toFixed(2)} ${selectedVariable.unit}`} />
                    <Line yAxisId="target" type="monotone" dataKey="target" name={targetVariable?.name ?? 'Variável-alvo'} stroke="#94a3b8" strokeWidth={2} dot={false} />
                    <Line yAxisId="selected" type="monotone" dataKey="selected" name={selectedVariable.name} stroke="var(--chart-ink)" strokeWidth={2} dot={false} />
                    {show3m && <Line yAxisId="selected" type="monotone" data={average3m} dataKey="value" name="Média 3M" stroke="#2563eb" strokeWidth={2} dot={false} />}
                    {show12m && <Line yAxisId="selected" type="monotone" data={average12m} dataKey="value" name="Média 12M" stroke="#0ea5e9" strokeWidth={2} dot={false} />}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
              <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-900">Unidade: {selectedVariable?.unit ?? '-'}</span>
              <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-900">Fonte: {selectedVariable?.source ?? '-'}</span>
            </div>
          </Card>

          <Tabs value={tab} onValueChange={setTab}>
            <div className="rounded-3xl border border-base bg-surface p-6 shadow-soft">
              <TabsList>
                <TabsTrigger value="time">Série Temporal</TabsTrigger>
                <TabsTrigger value="lag">Análise de Defasagens</TabsTrigger>
                <TabsTrigger value="corr">Correlação</TabsTrigger>
              </TabsList>

              <TabsContent value="time">
                <div className="mt-6 h-[320px] rounded-3xl border border-slate-200 bg-slate-50 p-4 sm:h-[420px] dark:border-slate-700 dark:bg-slate-900">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={selectedVariable?.series ?? []} margin={{ top: 24, right: 24, bottom: 18, left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={formatMonth} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                      <Tooltip formatter={(value: number) => `${value.toFixed(2)} ${selectedVariable?.unit ?? ''}`} />
                      <Area type="monotone" dataKey="value" stroke="#4338ca" fill="rgba(67, 56, 202, 0.12)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>

              <TabsContent value="lag">
                <div className="mt-6 h-[320px] rounded-3xl border border-slate-200 bg-slate-50 p-4 sm:h-[420px] dark:border-slate-700 dark:bg-slate-900">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={lagCorrelation} margin={{ top: 24, right: 24, bottom: 18, left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="lag" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                      <Tooltip formatter={(value: number) => value.toFixed(2)} />
                      <Bar dataKey="value" fill="#2563eb" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="mt-4 text-sm text-slate-500 dark:text-slate-400">Barras acentuadas indicam autocorrelações da variável histórica até 12 meses.</div>
                </div>
              </TabsContent>

              <TabsContent value="corr">
                <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse text-sm">
                      <thead>
                        <tr>
                          <th className="border-b border-slate-200 px-4 py-3 text-left text-xs uppercase tracking-[0.2em] text-slate-500 dark:border-slate-700 dark:text-slate-400">Variável</th>
                          {correlationMatrix.labels.map((label) => (
                            <th key={label} className="border-b border-slate-200 px-4 py-3 text-left text-xs uppercase tracking-[0.2em] text-slate-500 dark:border-slate-700 dark:text-slate-400">{label}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {correlationMatrix.labels.map((rowLabel, rowIndex) => (
                          <tr key={rowLabel} className="border-b border-slate-100 dark:border-slate-700">
                            <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">{rowLabel}</td>
                            {correlationMatrix.values[rowIndex]?.map((value, cellIndex) => {
                              const numeric = value ?? 0;
                              const normalized = Math.abs(numeric);
                              const bg = numeric >= 0 ? `rgba(59, 130, 246, ${0.15 + normalized * 0.4})` : `rgba(244, 63, 94, ${0.15 + normalized * 0.4})`;
                              return (
                                <td key={cellIndex} className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-slate-100">
                                  <div className="inline-flex min-w-[80px] items-center justify-center rounded-2xl px-3 py-2" style={{ background: bg }}>
                                    {numeric.toFixed(2)}
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </section>
  );
}

