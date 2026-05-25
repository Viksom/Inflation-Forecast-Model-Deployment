import type {
  CorrelationMatrix,
  FeatureImportance,
  InflationDataPoint,
  LagCorrelation,
  MacroVariable,
  ModelKey,
  ModelMetrics,
  SeriesPoint,
  ScenarioPreset,
  ScenarioControl,
  ScenarioSimulation,
  ScenarioVariables,
} from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:8000';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(payload.detail ?? 'Erro ao carregar dados da API');
  }

  return response.json() as Promise<T>;
}

export function getInflationSeries(horizon: '1M' | '3M' | '12M', model: ModelKey) {
  const params = new URLSearchParams({ horizon, model });
  return request<InflationDataPoint[]>(`/api/inflation-series?${params.toString()}`);
}

export function getModelMetrics() {
  return request<ModelMetrics[]>('/api/model-metrics');
}

export function getCurrentInflation() {
  return request<SeriesPoint[]>('/api/current-inflation');
}

export function getFeatureImportance(model: ModelKey) {
  const params = new URLSearchParams({ model });
  return request<FeatureImportance[]>(`/api/feature-importance?${params.toString()}`);
}

export function getScenarioPresets(model: ModelKey) {
  const params = new URLSearchParams({ model });
  return request<ScenarioPreset[]>(`/api/scenario-presets?${params.toString()}`);
}

export function getScenarioControls(model: ModelKey) {
  const params = new URLSearchParams({ model });
  return request<ScenarioControl[]>(`/api/scenario-controls?${params.toString()}`);
}

export function simulateScenario(
  model: ModelKey,
  horizon: '1M' | '3M' | '12M',
  scenarioKey: string,
  variables: ScenarioVariables,
) {
  return request<ScenarioSimulation>('/api/scenarios/simulate', {
    method: 'POST',
    body: JSON.stringify({ model, horizon, scenarioKey, variables }),
  });
}

export function getMacroVariables(model: ModelKey) {
  const params = new URLSearchParams({ model });
  return request<MacroVariable[]>(`/api/macro-variables?${params.toString()}`);
}

export function getTargetVariable() {
  return request<MacroVariable>('/api/target-variable');
}

export function getCorrelationMatrix() {
  return request<CorrelationMatrix>('/api/correlation-matrix');
}

export function getLagCorrelations(variable: string, nlags = 12) {
  const params = new URLSearchParams({ variable, nlags: String(nlags) });
  return request<LagCorrelation>(`/api/lag-correlations?${params.toString()}`);
}

