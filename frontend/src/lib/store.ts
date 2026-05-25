import { create } from 'zustand';
import type { AppStore, ModelKey, ScenarioVariables } from '@/types';

const defaultScenario: ScenarioVariables = {};

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
  setScenario: (scenario) => set({ activeScenario: scenario }),
  setScenarioValues: (scenario, scenarioVariables) => set({ activeScenario: scenario, scenarioVariables }),
  setScenarioVariable: (key, value) =>
    set((state) => ({
      activeScenario: 'Custom',
      scenarioVariables: { ...state.scenarioVariables, [key]: value },
    })),
  resetScenario: () => set({ activeScenario: 'Baseline', scenarioVariables: defaultScenario }),
}));
