import { create } from 'zustand';
import type { AppStore, ModelKey, ScenarioVariables } from '@/types';

const defaultScenario: ScenarioVariables = {
  hicp: 0,
  coreInflation: 0,
  ppi: 0,
  epu: 0,
  consumerConfidence: 0,
};

export const initialModel: ModelKey = 'LightGBM';
export const initialHorizon = '3M';
export const initialScenario = 'Baseline';

export const useAppStore = create<AppStore>((set) => ({
  selectedModel: initialModel,
  forecastHorizon: initialHorizon,
  activeScenario: initialScenario,
  scenarioVariables: defaultScenario,
  setModel: (model) => set({ selectedModel: model }),
  setHorizon: (forecastHorizon) => set({ forecastHorizon }),
  setScenario: (scenario) => {
    const presets: Record<string, ScenarioVariables> = {
      Baseline: defaultScenario,
      Optimistic: { hicp: -0.8, coreInflation: -0.3, ppi: -3, epu: -20, consumerConfidence: 12 },
      Pessimistic: { hicp: 1.2, coreInflation: 0.8, ppi: 4, epu: 35, consumerConfidence: -15 },
      'Energy Shock': { hicp: 1.8, coreInflation: 0.6, ppi: 8, epu: 18, consumerConfidence: -10 },
      'Monetary Tightening': { hicp: 0.5, coreInflation: 0.3, ppi: 2, epu: 10, consumerConfidence: -8 },
      Custom: defaultScenario,
    };
    set({ activeScenario: scenario, scenarioVariables: presets[scenario] ?? defaultScenario });
  },
  setScenarioValues: (scenario, scenarioVariables) => set({ activeScenario: scenario, scenarioVariables }),
  setScenarioVariable: (key, value) =>
    set((state) => ({
      activeScenario: 'Custom',
      scenarioVariables: { ...state.scenarioVariables, [key]: value },
    })),
  resetScenario: () => set({ activeScenario: 'Baseline', scenarioVariables: defaultScenario }),
}));
