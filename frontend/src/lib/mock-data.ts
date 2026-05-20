import type { FeatureImportance, InflationDataPoint, MacroVariable, ModelMetrics, ScenarioVariables } from '@/types';

const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

function generateDates(startYear: number, endYear: number) {
  const result: string[] = [];
  for (let year = startYear; year <= endYear; year += 1) {
    for (let month = 1; month <= 12; month += 1) {
      result.push(`${year}-${month.toString().padStart(2, '0')}`);
    }
  }
  return result;
}

const dateSeries = generateDates(2018, 2025);

function actualValue(index: number) {
  const year = 2018 + Math.floor(index / 12);
  const season = Math.sin((index / 12) * Math.PI * 2) * 0.2;
  let base = 1.0;

  if (year >= 2020 && year < 2021) {
    base += 0.6 + index * 0.01;
  }
  if (year >= 2021 && year < 2023) {
    base += 0.8 + (index - 36) * 0.05;
  }
  if (year >= 2023) {
    base += 3.5 - Math.max(0, index - 60) * 0.08;
  }

  if (year === 2022) {
    base += 1.8;
  }

  if (year >= 2024) {
    base = 2.2 + season - Math.max(0, index - 72) * 0.02;
  }

  return Number(Math.max(0, base + season).toFixed(1));
}

function smoothing(value: number, drift: number) {
  return Number(Math.max(0, value + drift + (Math.random() - 0.5) * 0.3).toFixed(1));
}

export const inflationSeries: InflationDataPoint[] = dateSeries.map((date, index) => {
  const actual = actualValue(index);
  const arima = smoothing(actual, index < 72 ? 0.1 : -0.2);
  const variable = smoothing(actual, index < 72 ? 0.2 : -0.1);
  const ridge = smoothing(actual, index < 72 ? 0.05 : -0.15);
  const lgbm = smoothing(actual, index < 72 ? 0.0 : -0.12);
  const range = Math.min(1.4, Math.max(0.7, Math.abs(actual - 2.2) + 0.3));
  return {
    date,
    actual,
    arima,
    ccvar: variable,
    ridge,
    lgbm,
    confidenceLow: Number(Math.max(0, actual - range).toFixed(1)),
    confidenceHigh: Number((actual + range).toFixed(1)),
  };
});

export const modelMetrics: ModelMetrics[] = [
  { model: 'ARIMA', rmse: 0.92, mae: 0.74, rrmse: 0.56, rmae: 0.48, category: 'Classical', scenarioCompatible: 'No' },
  { model: 'CC-VAR', rmse: 0.85, mae: 0.69, rrmse: 0.52, rmae: 0.45, category: 'Classical', scenarioCompatible: 'No' },
  { model: 'Ridge', rmse: 0.36, mae: 0.31, rrmse: 0.69, rmae: 0.80, category: 'Machine Learning', scenarioCompatible: 'Partial' },
  { model: 'LightGBM', rmse: 0.61, mae: 0.50, rrmse: 0.38, rmae: 0.34, category: 'Machine Learning', scenarioCompatible: 'Yes' },
];

export const featureImportance: FeatureImportance[] = [
  { variable: 'PPI', importance: 0.62, model: 'LightGBM' },
  { variable: 'EPU', importance: 0.29, model: 'LightGBM' },
  { variable: 'Core Inflation', importance: 0.14, model: 'LightGBM' },
  { variable: 'Consumer Confidence', importance: -0.18, model: 'LightGBM' },
  { variable: 'HICP Total', importance: 0.33, model: 'Ridge' },
  { variable: 'PPI', importance: 0.27, model: 'Ridge' },
  { variable: 'EPU', importance: 0.18, model: 'Ridge' },
  { variable: 'Core Inflation', importance: 0.11, model: 'Ridge' },
  { variable: 'Consumer Confidence', importance: -0.22, model: 'Ridge' },
];

export const scenarioPresets: { key: 'Baseline' | 'Optimistic' | 'Pessimistic' | 'Energy Shock' | 'Monetary Tightening'; label: string; description: string; values: ScenarioVariables }[] = [
  { key: 'Baseline', label: 'Baseline', description: 'Historical trends continue', values: { hicp: 0, coreInflation: 0, ppi: 0, epu: 0, consumerConfidence: 0 } },
  { key: 'Optimistic', label: 'Optimistic', description: 'Easing energy preços, forte procura', values: { hicp: -0.8, coreInflation: -0.3, ppi: -3, epu: -20, consumerConfidence: 12 } },
  { key: 'Pessimistic', label: 'Pessimistic', description: 'Choques de oferta persistentes, confiança fraca', values: { hicp: 1.2, coreInflation: 0.8, ppi: 4, epu: 35, consumerConfidence: -15 } },
  { key: 'Energy Shock', label: 'Energy Shock', description: 'Aumento do preço do petróleo +40%, PPI em alta', values: { hicp: 1.8, coreInflation: 0.6, ppi: 8, epu: 18, consumerConfidence: -10 } },
  { key: 'Monetary Tightening', label: 'Monetary Tightening', description: 'Ciclo de subida de juros, crédito em contração', values: { hicp: 0.5, coreInflation: 0.3, ppi: 2, epu: 10, consumerConfidence: -8 } },
];

function variableSeries(base: number, volatility: number, drift: number) {
  return dateSeries.map((date, index) => ({ date, value: Number((base + Math.sin(index / 5) * volatility + drift * index / 24 + (Math.random() - 0.5) * 0.2).toFixed(1)) }));
}

export const macroVariables: MacroVariable[] = [
  { name: 'HICP Total', series: variableSeries(2.1, 0.6, 0.04), unit: '%', source: 'INE / Eurostat' },
  { name: 'HICP ex. Energy', series: variableSeries(1.8, 0.5, 0.03), unit: '%', source: 'INE / Eurostat' },
  { name: 'HICP ex. Energy & Food', series: variableSeries(1.6, 0.4, 0.02), unit: '%', source: 'INE / Eurostat' },
  { name: 'Producer Price Index', series: variableSeries(2.4, 0.8, 0.05), unit: 'Índice', source: 'Banco de Portugal' },
  { name: 'Economic Policy Uncertainty', series: variableSeries(95, 8, 0.2), unit: 'Índice', source: 'EPU Global' },
  { name: 'Consumer Confidence', series: variableSeries(110, 6, 0.3), unit: 'Índice', source: 'INE / GfK' },
  { name: 'PCEPI', series: variableSeries(2.2, 0.5, 0.04), unit: '%', source: 'Eurostat' },
  { name: 'Exports of Goods & Services', series: variableSeries(95, 7, 0.25), unit: 'Índice', source: 'INE' },
];

export const correlationMatrix = {
  labels: ['HICP Total', 'Core Inflation', 'PPI', 'EPU', 'Consumer Confidence'],
  values: [
    [1.0, 0.78, 0.55, 0.42, -0.34],
    [0.78, 1.0, 0.46, 0.34, -0.25],
    [0.55, 0.46, 1.0, 0.29, -0.18],
    [0.42, 0.34, 0.29, 1.0, -0.16],
    [-0.34, -0.25, -0.18, -0.16, 1.0],
  ],
};
