'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import type { ModelKey } from '@/types';

const navItems = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Models', href: '/models' },
  { label: 'Scenario Analysis', href: '/scenario' },
  { label: 'Variables', href: '/variables' },
];

const modelOptions: ModelKey[] = ['ARIMA', 'CC-VAR', 'Ridge', 'LightGBM'];
const horizonOptions = ['1M', '3M', '12M'] as const;

export function Navbar() {
  const pathname = usePathname();
  const { selectedModel, forecastHorizon, setModel, setHorizon } = useAppStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-base bg-surface/95 backdrop-blur-xl">
      <div className="mx-auto max-w-screen-2xl px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-soft">DS</div>
            <div>
              <p className="hidden text-sm font-medium uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400 sm:block">Data Science Group</p>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 sm:text-base">Plataforma de Inflação</p>
            </div>
          </div>

          <nav className="hidden items-center gap-6 lg:flex">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`pb-1 text-sm font-medium transition-colors ${
                    active ? 'border-b-2 border-indigo-600 text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-900 dark:text-slate-300'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 lg:gap-3">
            <div className="hidden items-center gap-3 lg:flex">
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
            </div>

            <ThemeToggle />

            <button
              type="button"
              onClick={() => setMobileOpen((prev) => !prev)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-base bg-slate-50 text-slate-700 lg:hidden dark:bg-slate-900 dark:text-slate-200"
              aria-label={mobileOpen ? 'Fechar menu' : 'Abrir menu'}
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {mobileOpen ? (
          <div className="mt-4 space-y-4 border-t border-base pt-4 lg:hidden">
            <nav className="grid gap-2">
              {navItems.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${
                      active ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-700 dark:bg-slate-900 dark:text-slate-200'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="grid gap-3">
              <div className="inline-flex overflow-hidden rounded-2xl border border-base bg-slate-50 text-sm text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                {horizonOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setHorizon(option)}
                    className={`flex-1 px-3 py-3 transition ${
                      forecastHorizon === option ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                    }`}
                    aria-label={`Selecionar horizonte ${option}`}
                  >
                    {option}
                  </button>
                ))}
              </div>

              <label className="flex items-center rounded-2xl border border-base bg-slate-50 px-3 text-sm text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                <span className="mr-3 text-xs uppercase tracking-[0.15em] text-slate-500">Modelo</span>
                <select
                  value={selectedModel}
                  onChange={(event) => setModel(event.target.value as ModelKey)}
                  className="min-w-0 flex-1 bg-transparent py-3 text-sm font-medium outline-none"
                  aria-label="Selecionar modelo"
                >
                  {modelOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}
