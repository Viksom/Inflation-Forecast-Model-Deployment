'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Area,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Slider } from '@/components/ui/slider';
import { useAppStore } from '@/lib/store';
import { getScenarioPresets, simulateScenario } from '@/lib/api';
import { formatDecimal, formatPercent, formatMonth } from '@/lib/utils';
import type { ScenarioPreset, ScenarioSimulation } from '@/types';

export default function ScenarioPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scenarioPresets, setScenarioPresets] = useState<ScenarioPreset[]>([]);
  const [scenarioResult, setScenarioResult] = useState<ScenarioSimulation | null>(null);
  const selectedModel = useAppStore((state) => state.selectedModel);
  const forecastHorizon = useAppStore((state) => state.forecastHorizon);
  const activeScenario = useAppStore((state) => state.activeScenario);
  const scenarioVariables = useAppStore((state) => state.scenarioVariables);
  const setScenarioValues = useAppStore((state) => state.setScenarioValues);
  const setScenarioVariable = useAppStore((state) => state.setScenarioVariable);
  const resetScenario = useAppStore((state) => state.resetScenario);

  useEffect(() => {
    let cancelled = false;
    getScenarioPresets()
      .then((presets) => {
        if (!cancelled) setScenarioPresets(presets);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (selectedModel === 'ARIMA' || selectedModel === 'VAR') {
      setLoading(false);
      setScenarioResult(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    simulateScenario(selectedModel, forecastHorizon, activeScenario, scenarioVariables)
      .then((result) => {
        if (!cancelled) setScenarioResult(result);
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
  }, [activeScenario, forecastHorizon, scenarioVariables, selectedModel]);

  const baselineSeries = scenarioResult?.baselineSeries ?? [];
  const scenarioSeries = scenarioResult?.scenarioSeries ?? [];
  const delta = scenarioResult?.delta ?? 0;

  const driverList = useMemo(
    () => (scenarioResult?.driverImpact ?? []).map((driver) => ({
      ...driver,
      color: driver.value >= 0 ? 'emerald' : 'rose',
    })),
    [scenarioResult],
  );

  return (
    <section className="mx-auto max-w-screen-2xl px-8 pb-10">
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

      {selectedModel === 'ARIMA' || selectedModel === 'VAR' ? (
        <Alert variant="warning">
          <div className="flex flex-col gap-3">
            <div className="text-base font-semibold">Cenário não disponível para modelos clássicos</div>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              A análise de cenários não está disponível para modelos autoregressivos clássicos (ARIMA, VAR). Estes modelos extrapolam padrões históricos e não expõem entradas estruturais. Selecione Ridge ou LightGBM para simular cenários interactivos.
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
                    <span className="font-semibold">{preset.label}</span>
                    <Badge variant="outline">{preset.key === 'Baseline' ? 'Base' : 'Cenário'}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{preset.description}</p>
                </button>
              ))}
            </div>

            <div className="space-y-5 rounded-3xl border border-base bg-surface p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Controles de cenário</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Ajuste os choques macroeconómicos em tempo real.</p>
                </div>
                <Button type="button" onClick={resetScenario}>Redefinir</Button>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm font-medium text-slate-700 dark:text-slate-200">
                    <span>HICP Delta (%)</span>
                    <span>{scenarioVariables.hicp.toFixed(1)}</span>
                  </div>
                  <Slider min={-5} max={5} step={0.1} value={scenarioVariables.hicp} onChange={(event) => setScenarioVariable('hicp', Number(event.target.value))} />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm font-medium text-slate-700 dark:text-slate-200">
                    <span>Core Inflation Delta</span>
                    <span>{scenarioVariables.coreInflation.toFixed(1)}</span>
                  </div>
                  <Slider min={-3} max={3} step={0.1} value={scenarioVariables.coreInflation} onChange={(event) => setScenarioVariable('coreInflation', Number(event.target.value))} />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm font-medium text-slate-700 dark:text-slate-200">
                    <span>PPI Delta</span>
                    <span>{scenarioVariables.ppi.toFixed(1)}</span>
                  </div>
                  <Slider min={-10} max={10} step={0.5} value={scenarioVariables.ppi} onChange={(event) => setScenarioVariable('ppi', Number(event.target.value))} />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm font-medium text-slate-700 dark:text-slate-200">
                    <span>EPU Index Delta</span>
                    <span>{scenarioVariables.epu.toFixed(0)}</span>
                  </div>
                  <Slider min={-50} max={50} step={1} value={scenarioVariables.epu} onChange={(event) => setScenarioVariable('epu', Number(event.target.value))} />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm font-medium text-slate-700 dark:text-slate-200">
                    <span>Consumer Confidence Delta</span>
                    <span>{scenarioVariables.consumerConfidence.toFixed(0)}</span>
                  </div>
                  <Slider min={-20} max={20} step={1} value={scenarioVariables.consumerConfidence} onChange={(event) => setScenarioVariable('consumerConfidence', Number(event.target.value))} />
                </div>
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
              {loading ? (
                <Skeleton className="h-[420px]" />
              ) : (
                <div className="h-[420px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={baselineSeries} margin={{ top: 24, right: 24, bottom: 18, left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={(value) => value.slice(2)} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                      <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                      <Line
                        type="monotone"
                        data={baselineSeries}
                        dataKey="value"
                        name="Baseline"
                        stroke="#475569"
                        strokeWidth={3}
                        dot={false}
                        strokeDasharray="5 5"
                      />
                      <Line type="monotone" data={scenarioSeries} dataKey="value" name="Scenario" stroke="#4f46e5" strokeWidth={3} dot={false} />
                      <Area type="monotone" data={scenarioSeries} dataKey="value" name="Intervalo" stroke="transparent" fill="rgba(79, 70, 229, 0.12)" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>

            <div className="grid gap-6 lg:grid-cols-3">
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
                  <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Impacto dos drivers</p>
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
