export type ModelKey = 'ARIMA' | 'CC-VAR' | 'Ridge' | 'LightGBM';

export type InflationDataPoint = {
  date: string;
  actual: number;
  arima: number;
  ccvar: number;
  ridge: number;
  lgbm: number;
  confidenceLow: number;
  confidenceHigh: number;
};

export type ModelMetrics = {
  model: ModelKey;
  rmse: number;
  mae: number;
  rrmse: number;
  rmae: number;
  category: 'Classical' | 'Machine Learning';
  scenarioCompatible: 'Yes' | 'Partial' | 'No';
};

export type FeatureImportance = {
  variable: string;
  importance: number;
  model: 'Ridge' | 'LightGBM';
};

export type ScenarioVariables = {
  hicp: number;
  coreInflation: number;
  ppi: number;
  epu: number;
  consumerConfidence: number;
};

export type ScenarioVariableKey = keyof ScenarioVariables;

export type AppStore = {
  selectedModel: ModelKey;
  forecastHorizon: '1M' | '3M' | '12M';
  activeScenario: 'Baseline' | 'Optimistic' | 'Pessimistic' | 'Energy Shock' | 'Monetary Tightening' | 'Custom';
  scenarioVariables: ScenarioVariables;
  setModel: (model: ModelKey) => void;
  setHorizon: (horizon: '1M' | '3M' | '12M') => void;
  setScenario: (scenario: AppStore['activeScenario']) => void;
  setScenarioValues: (scenario: AppStore['activeScenario'], values: ScenarioVariables) => void;
  setScenarioVariable: (key: keyof ScenarioVariables, value: number) => void;
  resetScenario: () => void;
};

export type MacroVariable = {
  name: string;
  series: { date: string; value: number }[];
  unit: string;
  source: string;
};

export type ScenarioPreset = {
  key: 'Baseline' | 'Optimistic' | 'Pessimistic' | 'Energy Shock' | 'Monetary Tightening' | 'Custom';
  label: string;
  description: string;
  values: ScenarioVariables;
};

export type ScenarioControl = {
  key: ScenarioVariableKey;
  label: string;
  min: number;
  max: number;
  step: number;
  decimals: number;
};

export type SeriesPoint = { date: string; value: number | null };

export type ScenarioSimulation = {
  model: 'Ridge' | 'LightGBM';
  baselineSeries: SeriesPoint[];
  scenarioSeries: SeriesPoint[];
  delta: number;
  peakDate: string;
  robustnessEstimate: number;
  driverImpact: { label: string; value: number }[];
};

export type CorrelationMatrix = {
  labels: string[];
  values: (number | null)[][];
};

export type LagCorrelation = {
  variable: string;
  values: { lag: number; value: number | null }[];
};
