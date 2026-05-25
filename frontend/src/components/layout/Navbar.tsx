'use client';

import { useEffect, useRef, useState } from 'react';
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
  { label: 'Painel', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Modelos', href: '/models', icon: Boxes },
  { label: 'Análise de Cenários', href: '/scenario', icon: SlidersHorizontal },
  { label: 'Variáveis', href: '/variables', icon: LineChart },
];

const modelOptions: ModelKey[] = ['ARIMA', 'CC-VAR', 'Ridge', 'LightGBM'];
const horizonOptions = ['1M', '3M', '12M'] as const;

const modelDescriptions: Record<ModelKey, string> = {
  ARIMA: 'Modelo clássico univariado',
  'CC-VAR': 'Modelo clássico multivariado',
  Ridge: 'Regressão regularizada',
  LightGBM: 'Gradient boosting',
};

function ModelSelector({
  selectedModel,
  onChange,
  onSelect,
  mobile = false,
}: {
  selectedModel: ModelKey;
  onChange: (model: ModelKey) => void;
  onSelect?: () => void;
  mobile?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [open]);

  return (
    <div ref={containerRef} className={`relative ${mobile ? 'w-full' : 'min-w-[240px]'}`}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`flex w-full items-center justify-between gap-3 rounded-2xl border border-base bg-slate-50 px-4 py-3 text-left transition hover:border-indigo-400 hover:bg-white dark:bg-slate-900 dark:hover:bg-slate-950 ${
          mobile ? 'dark:border-slate-700' : ''
        }`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Selecionar modelo"
      >
        <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
            Modelo
          </div>
          <div className="mt-1 truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{selectedModel}</div>
        </div>
        <ChevronDown size={16} className={`shrink-0 text-slate-400 transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open ? (
        <div
          className={`mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_60px_-32px_rgba(15,23,42,0.45)] dark:border-slate-700 dark:bg-slate-950 ${
            mobile ? 'relative' : 'absolute right-0 z-50 w-[280px]'
          }`}
          role="listbox"
        >
          <div className={`overflow-y-auto p-2 ${mobile ? 'max-h-64' : 'max-h-[min(18rem,calc(100vh-9rem))]'}`}>
            {modelOptions.map((option) => {
              const active = option === selectedModel;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    onChange(option);
                    setOpen(false);
                    onSelect?.();
                  }}
                  className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-3 text-left transition ${
                    active
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900'
                  }`}
                  role="option"
                  aria-selected={active}
                >
                  <div className="min-w-0">
                    <div className="font-semibold">{option}</div>
                    <div className={`mt-1 text-xs ${active ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'}`}>
                      {modelDescriptions[option]}
                    </div>
                  </div>
                  <span className={`h-2.5 w-2.5 rounded-full ${active ? 'bg-white' : 'bg-slate-300 dark:bg-slate-600'}`} />
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

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
              <p className="hidden text-sm font-medium uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400 sm:block">Grupo de Ciência de Dados</p>
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

              <ModelSelector selectedModel={selectedModel} onChange={setModel} />
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
          <div className="absolute inset-x-0 top-full z-40 max-h-[calc(100vh-73px)] overflow-y-auto border-b border-base bg-[linear-gradient(180deg,rgba(248,250,252,0.98),rgba(241,245,249,0.98))] shadow-2xl dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(17,24,39,0.98))]">
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
                          onClick={() => {
                            setHorizon(option);
                            setMobileOpen(false);
                          }}
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

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                    <ModelSelector selectedModel={selectedModel} onChange={setModel} onSelect={() => setMobileOpen(false)} mobile />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
