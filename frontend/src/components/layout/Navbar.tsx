'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Boxes,
  ChevronDown,
  LayoutDashboard,
  LineChart,
  Menu,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import type { ModelKey } from '@/types';

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Models', href: '/models', icon: Boxes },
  { label: 'Scenario Analysis', href: '/scenario', icon: SlidersHorizontal },
  { label: 'Variables', href: '/variables', icon: LineChart },
];

const modelOptions: ModelKey[] = ['ARIMA', 'CC-VAR', 'Ridge', 'LightGBM'];
const horizonOptions = ['1M', '3M', '12M'] as const;

export function Navbar() {
  const pathname = usePathname();
  const { selectedModel, forecastHorizon, setModel, setHorizon } = useAppStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileOpen]);

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
                  className="appearance-none bg-transparent py-1 pl-1 pr-6 text-sm font-medium text-slate-900 outline-none dark:text-slate-100 dark:[color-scheme:dark]"
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
              className="inline-flex items-center gap-2 rounded-full border border-base bg-slate-50 px-3 py-2 text-slate-700 transition hover:border-indigo-400 hover:text-slate-900 lg:hidden dark:bg-slate-900 dark:text-slate-200 dark:hover:text-white"
              aria-label={mobileOpen ? 'Fechar menu' : 'Abrir menu'}
              aria-expanded={mobileOpen}
            >
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                Menu
              </span>
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </div>

      {mobileOpen ? (
        <div className="lg:hidden">
          <button
            type="button"
            className="fixed inset-0 top-[73px] z-30 bg-slate-950/30 backdrop-blur-[2px]"
            aria-label="Fechar menu"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-x-0 top-full z-40 border-b border-base bg-[linear-gradient(180deg,rgba(248,250,252,0.98),rgba(241,245,249,0.98))] shadow-2xl dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(17,24,39,0.98))]">
            <div className="mx-auto max-w-screen-2xl px-4 pb-5 pt-3 sm:px-6">
              <div className="rounded-[28px] border border-slate-200/80 bg-white/90 p-3 shadow-[0_24px_60px_-32px_rgba(15,23,42,0.45)] dark:border-slate-700/80 dark:bg-slate-950/85">
                <div className="flex items-center justify-between rounded-2xl bg-slate-100/80 px-4 py-3 dark:bg-slate-900/80">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                      Navegação
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {navItems.find((item) => item.href === pathname)?.label ?? 'Plataforma de Inflação'}
                    </p>
                  </div>
                  <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
                    {forecastHorizon}
                  </div>
                </div>

                <nav className="mt-3 grid gap-2">
                  {navItems.map((item) => {
                    const active = pathname === item.href;
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium transition ${
                          active
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                            : 'bg-slate-50 text-slate-700 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'
                        }`}
                      >
                        <span className="flex items-center gap-3">
                          <span className={`inline-flex h-9 w-9 items-center justify-center rounded-2xl ${
                            active ? 'bg-white/15 text-white' : 'bg-white text-slate-600 dark:bg-slate-950 dark:text-slate-300'
                          }`}>
                            <Icon size={17} />
                          </span>
                          <span>{item.label}</span>
                        </span>
                        <ChevronDown size={16} className={`rotate-[-90deg] ${active ? 'text-white' : 'text-slate-400'}`} />
                      </Link>
                    );
                  })}
                </nav>

                <div className="mt-4 grid gap-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900">
                    <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                      Horizonte
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {horizonOptions.map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setHorizon(option)}
                          className={`rounded-2xl px-3 py-3 text-sm font-semibold transition ${
                            forecastHorizon === option
                              ? 'bg-indigo-600 text-white'
                              : 'bg-white text-slate-700 hover:bg-slate-100 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800'
                          }`}
                          aria-label={`Selecionar horizonte ${option}`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>

                  <label className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                    <span className="mb-3 block text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                      Modelo
                    </span>
                    <div className="relative rounded-2xl bg-white px-3 dark:bg-slate-950">
                      <select
                        value={selectedModel}
                        onChange={(event) => setModel(event.target.value as ModelKey)}
                        className="block min-w-0 w-full appearance-none bg-transparent py-3 pr-8 text-sm font-medium text-slate-900 outline-none dark:text-slate-100 dark:[color-scheme:dark]"
                        aria-label="Selecionar modelo"
                      >
                        {modelOptions.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                      <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
