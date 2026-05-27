'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Area,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LoadingStage } from '@/components/ui/loading-stage';
import { Skeleton } from '@/components/ui/skeleton';
import { Slider } from '@/components/ui/slider';
import { useAppStore } from '@/lib/store';
import { getCurrentInflation, getScenarioControls, getScenarioPresets, simulateScenario } from '@/lib/api';
import { formatDecimal, formatPercent, formatMonth } from '@/lib/utils';
import type { ScenarioControl, ScenarioPreset, ScenarioSimulation, SeriesPoint } from '@/types';

const SCENARIO_REFERENCE_DATE = '2025-10';

function formatScenarioLabel(label: string) {
  if (label === 'Baseline') return 'Base';
  if (label === 'Optimistic') return 'Otimista';
  if (label === 'Pessimistic') return 'Pessimista';
  if (label === 'Energy Shock') return 'Choque Energético';
  if (label === 'Monetary Tightening') return 'Aperto Monetário';
  if (label === 'Custom') return 'Personalizado';
  return label;
}

function formatScenarioDescription(label: string, description: string) {
  if (label === 'Baseline') return 'Continuação das tendências históricas.';
  if (label === 'Optimistic') return 'Menor pressão inflacionista e confiança mais forte.';
  if (label === 'Pessimistic') return 'Choques de oferta persistentes e confiança fraca.';
  if (label === 'Energy Shock') return 'Choque no petróleo e nos preços no produtor.';
  if (label === 'Monetary Tightening') return 'Taxas mais altas e condições de crédito mais fracas.';
  if (label === 'Custom') return 'Cenário ajustado manualmente.';
  return description;
}

export default function ScenarioPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scenarioPresets, setScenarioPresets] = useState<ScenarioPreset[]>([]);
  const [scenarioControls, setScenarioControls] = useState<ScenarioControl[]>([]);
  const [scenarioResult, setScenarioResult] = useState<ScenarioSimulation | null>(null);
  const [currentInflation, setCurrentInflation] = useState<SeriesPoint[]>([]);
  const selectedModel = useAppStore((state) => state.selectedModel);
  const forecastHorizon = useAppStore((state) => state.forecastHorizon);
  const activeScenario = useAppStore((state) => state.activeScenario);
  const scenarioVariables = useAppStore((state) => state.scenarioVariables);
  const setScenarioValues = useAppStore((state) => state.setScenarioValues);
  const setScenarioVariable = useAppStore((state) => state.setScenarioVariable);
  const resetScenario = useAppStore((state) => state.resetScenario);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      const scenarioModel = selectedModel === 'LightGBM' ? 'LightGBM' : 'Ridge';

      Promise.all([getScenarioPresets(scenarioModel), getScenarioControls(scenarioModel), getCurrentInflation()])
        .then(([presets, controls, currentSeries]) => {
          if (cancelled) return;
          setScenarioPresets(presets);
          setScenarioControls(controls);
          setCurrentInflation(currentSeries);
          const activePreset = presets.find((preset) => preset.key === activeScenario) ?? presets[0] ?? null;
          if (activePreset && activeScenario !== 'Custom') {
            setScenarioValues(activePreset.key, activePreset.values);
          }
        })
        .catch((err: Error) => {
          if (!cancelled) setError(err.message);
        });
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [activeScenario, selectedModel, setScenarioValues]);

  useEffect(() => {
    if (selectedModel === 'ARIMA' || selectedModel === 'CC-VAR') {
      setLoading(false);
      setRefreshing(false);
      setScenarioResult(null);
      return;
    }

    let cancelled = false;
    const shouldShowLoading = scenarioResult === null;
    if (shouldShowLoading) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    setError(null);

    simulateScenario(selectedModel, forecastHorizon, activeScenario, scenarioVariables)
      .then((result) => {
        if (!cancelled) setScenarioResult(result);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) {
          if (shouldShowLoading) setLoading(false);
          setRefreshing(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeScenario, forecastHorizon, scenarioVariables, selectedModel]);

  const baselineSeries = scenarioResult?.baselineSeries ?? [];
  const scenarioSeries = scenarioResult?.scenarioSeries ?? [];
  const delta = scenarioResult?.delta ?? 0;
  const scenarioChartData = useMemo(() => {
    const actualByDate = new Map(currentInflation.map((point) => [point.date, point.value]));
    const scenarioByDate = new Map(scenarioSeries.map((point) => [point.date, point.value]));

    return baselineSeries.map((point) => ({
      date: point.date,
      actual: actualByDate.get(point.date) ?? null,
      baseline: point.value,
      scenario: scenarioByDate.get(point.date) ?? null,
    }));
  }, [baselineSeries, currentInflation, scenarioSeries]);

  const driverList = useMemo(
    () => (scenarioResult?.driverImpact ?? []).map((driver) => ({
      ...driver,
      color: driver.value >= 0 ? 'emerald' : 'rose',
    })),
    [scenarioResult],
  );
  const hasReferenceDate = useMemo(
    () => scenarioChartData.some((point) => point.date === SCENARIO_REFERENCE_DATE),
    [scenarioChartData],
  );
  const showLoadingStage = loading && scenarioResult === null && currentInflation.length === 0;
  const showInitialScenarioLoading = loading && scenarioResult === null;

  return (
    <section className="relative mx-auto max-w-screen-2xl px-4 pb-10 sm:px-6 lg:px-8">
      {showLoadingStage ? <LoadingStage label="A simular cenários" detail="A calibrar choques, baseline e resposta do modelo." /> : null}
      <div className="mb-6">
        <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Análise de cenário</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900 dark:text-slate-100">Simulação de choques macroeconómicos</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
          Compare como choques estruturais podem alterar a trajetória prevista de inflação com o modelo atualmente selecionado.
        </p>
      </div>

      {error ? (
        <div className="mb-6 rounded-3xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800 dark:border-rose-500/30 dark:bg-rose-950 dark:text-rose-100">
          {error}
        </div>
      ) : null}

      {selectedModel === 'ARIMA' || selectedModel === 'CC-VAR' ? (
        <Alert variant="warning">
          <div className="flex flex-col gap-3">
            <div className="text-base font-semibold">Cenário não disponível para modelos clássicos</div>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              A análise de cenários não está disponível para modelos autoregressivos clássicos (ARIMA, CC-VAR). Estes modelos extrapolam padrões históricos e não expõem entradas estruturais. Selecione Ridge ou LightGBM para simular cenários interactivos.
            </p>
          </div>
        </Alert>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
          <div className="space-y-6">
            <div className="space-y-4">
              {scenarioPresets.map((preset) => (
                <button
                  key={preset.key}
                  type="button"
                  onClick={() => setScenarioValues(preset.key, preset.values)}
                  className={`w-full rounded-3xl border px-5 py-4 text-left transition ${
                    activeScenario === preset.key
                      ? 'border-indigo-600 bg-indigo-50 text-slate-900 dark:bg-slate-900 dark:text-white'
                      : 'border-base bg-surface text-slate-700 hover:border-indigo-500 hover:bg-slate-50 dark:bg-slate-950 dark:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold">{formatScenarioLabel(preset.label)}</span>
                    <Badge variant="outline">{preset.key === 'Baseline' ? 'Base' : 'Cenário'}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{formatScenarioDescription(preset.label, preset.description)}</p>
                </button>
              ))}
            </div>

            <div className="space-y-5 rounded-3xl border border-base bg-surface p-4 shadow-sm sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Controles de cenário</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Ajuste os choques macroeconómicos em tempo real.</p>
                </div>
                <Button type="button" onClick={resetScenario}>Redefinir</Button>
              </div>

              <div className="space-y-6">
                {scenarioControls.map((control) => (
                  <div key={control.key} className="space-y-2">
                    <div className="flex items-center justify-between gap-3 text-sm font-medium text-slate-700 dark:text-slate-200">
                      <span className="min-w-0 flex-1">{control.label} Delta</span>
                      <span>{(scenarioVariables[control.key] ?? 0).toFixed(control.decimals)}</span>
                    </div>
                    <Slider
                      min={control.min}
                      max={control.max}
                      step={control.step}
                      value={scenarioVariables[control.key] ?? 0}
                      onChange={(event) => setScenarioVariable(control.key, Number(event.target.value))}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <Card>
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Previsão de cenário</p>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Comparação entre a linha de base e o cenário atual.</p>
                </div>
                <div className="rounded-3xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                  Modelo: {selectedModel}
                </div>
              </div>
              {showInitialScenarioLoading ? (
                <Skeleton className="h-[340px] sm:h-[420px]" />
              ) : (
                <div className="relative h-[340px] sm:h-[420px]">
                  {refreshing ? (
                    <div className="absolute right-3 top-3 z-10 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/90 dark:text-slate-300">
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-500 dark:border-slate-600 dark:border-t-indigo-300" />
                      A atualizar
                    </div>
                  ) : null}
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={scenarioChartData} margin={{ top: 24, right: 24, bottom: 18, left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={formatMonth} minTickGap={24} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                      <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                      <Line
                        type="monotone"
                        dataKey="actual"
                        name="Histórico"
                        stroke="var(--chart-ink)"
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="baseline"
                        name="Base"
                        stroke="#475569"
                        strokeWidth={3}
                        dot={false}
                        strokeDasharray="5 5"
                      />
                      <Line type="monotone" dataKey="scenario" name="Cenário" stroke="#4f46e5" strokeWidth={3} dot={false} />
                      <Area type="monotone" dataKey="scenario" name="Intervalo" stroke="transparent" fill="rgba(79, 70, 229, 0.12)" />
                      {hasReferenceDate ? <ReferenceLine x={SCENARIO_REFERENCE_DATE} stroke="#64748b" strokeDasharray="3 3" label="Treino" /> : null}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 sm:gap-6">
              <Card>
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Delta da previsão</p>
                <p className="mt-4 text-3xl font-semibold text-slate-900 dark:text-slate-100">{delta >= 0 ? '+' : '-'}{formatPercent(Math.abs(delta))}</p>
                <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Variação do cenário em relação à linha de base no último período.</p>
              </Card>
              <Card>
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Data de pico prevista</p>
                <p className="mt-4 text-3xl font-semibold text-slate-900 dark:text-slate-100">{scenarioResult ? formatMonth(scenarioResult.peakDate) : '-'}</p>
                <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Presumido pelo perfil do cenário atual.</p>
              </Card>
              <Card>
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Estimativa de robustez</p>
                <p className="mt-4 text-3xl font-semibold text-slate-900 dark:text-slate-100">{formatDecimal(scenarioResult?.robustnessEstimate ?? 0)}</p>
                <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">RMSE aproximado do cenário ajustado.</p>
              </Card>
            </div>

            <Card>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Impacto dos determinantes</p>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Variáveis com maior contribuição para a direção do cenário.</p>
                </div>
              </div>
              <div className="mt-6 space-y-4">
                {driverList.map((driver) => (
                  <div key={driver.label} className="space-y-2">
                    <div className="flex items-center justify-between text-sm font-medium text-slate-700 dark:text-slate-200">
                      <span>{driver.label}</span>
                      <span className={driver.color === 'emerald' ? 'text-emerald-700' : 'text-rose-600'}>{driver.value >= 0 ? '+' : ''}{driver.value}</span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                      <div className={`h-full rounded-full ${driver.color === 'emerald' ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ width: `${Math.min(100, Math.abs(driver.value) * 2)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}
    </section>
  );
}
