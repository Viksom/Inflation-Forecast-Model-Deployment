'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import type { ModelKey } from '@/types';

const navItems = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Models', href: '/models' },
  { label: 'Scenario Analysis', href: '/scenario' },
  { label: 'Variables', href: '/variables' },
];

const modelOptions: ModelKey[] = ['ARIMA', 'VAR', 'Ridge', 'LightGBM'];
const horizonOptions = ['1M', '3M', '12M'] as const;

export function Navbar() {
  const pathname = usePathname();
  const { selectedModel, forecastHorizon, setModel, setHorizon } = useAppStore();

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-base bg-surface/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-screen-2xl items-center justify-between px-8 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-soft">DS</div>
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Data Science Group</p>
            <p className="text-base font-semibold text-slate-900 dark:text-slate-100">Plataforma de Inflação</p>
          </div>
        </div>

        <nav className="hidden items-center gap-6 lg:flex">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-medium transition-colors ${
                  active ? 'border-b-2 border-indigo-600 text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-900 dark:text-slate-300'
                } pb-1`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <div className="inline-flex overflow-hidden rounded-full border border-base bg-slate-50 text-sm text-slate-700 dark:bg-slate-900 dark:text-slate-200">
            {horizonOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setHorizon(option)}
                className={`px-3 py-2 transition ${
                  forecastHorizon === option ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
                aria-label={`Selecionar horizonte ${option}`}
              >
                {option}
              </button>
            ))}
          </div>

          <label className="relative inline-flex items-center rounded-full border border-base bg-slate-50 px-3 text-sm text-slate-700 dark:bg-slate-900 dark:text-slate-200">
            <span className="mr-2 text-xs uppercase tracking-[0.15em] text-slate-500">Modelo</span>
            <select
              value={selectedModel}
              onChange={(event) => setModel(event.target.value as ModelKey)}
              className="bg-transparent py-1 pl-1 pr-6 text-sm font-medium outline-none"
              aria-label="Selecionar modelo"
            >
              {modelOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
