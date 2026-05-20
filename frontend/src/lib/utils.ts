import type { InflationDataPoint, ModelKey } from '@/types';

export const chartConfig = {
  margin: { top: 10, right: 20, bottom: 20, left: 10 },
  grid: { strokeDasharray: '3 3', stroke: '#e2e8f0' },
  axisStyle: { fontSize: 11, fill: '#94a3b8' },
  tooltipStyle: {
    backgroundColor: 'white',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: 12,
  },
};

export function formatPercent(value: number) {
  if (typeof value !== 'number' || isNaN(value)) return '0.0%';
  return `${value.toFixed(1)}%`;
}

export function formatNumber(value: number) {
  if (typeof value !== 'number' || isNaN(value)) return '0';
  return value.toLocaleString('pt-PT', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export function formatDecimal(value: number) {
  if (typeof value !== 'number' || isNaN(value)) return '0.0';
  return value.toLocaleString('pt-PT', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

export function formatMonth(date: string) {
  const [year, month] = date.split('-');
  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return `${monthNames[Number(month) - 1]} ${year}`;
}

export function getTodayLabel(series: InflationDataPoint[]) {
  return series[series.length - 1]?.date ?? '';
}

export function modelToSeriesKey(model: ModelKey): 'arima' | 'ccvar' | 'ridge' | 'lgbm' {
  if (model === 'CC-VAR') return 'ccvar';
  if (model === 'LightGBM') return 'lgbm';
  return model.toLowerCase() as 'arima' | 'ridge';
}
