'use client';

export function LoadingStage({
  label = 'A sincronizar com o backend',
  detail = 'A preparar séries, métricas e cenários.',
}: {
  label?: string;
  detail?: string;
}) {
  return (
    <div className="absolute inset-0 z-20 overflow-hidden rounded-[2rem] bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.14),transparent_34%),linear-gradient(180deg,rgba(248,250,252,0.96),rgba(241,245,249,0.92))] px-6 py-10 backdrop-blur-md dark:bg-[radial-gradient(circle_at_top,rgba(96,165,250,0.16),transparent_34%),linear-gradient(180deg,rgba(15,23,42,0.96),rgba(17,24,39,0.94))]">
      <div className="loading-orb absolute left-[-5rem] top-[-4rem] h-40 w-40 rounded-full bg-sky-300/20 blur-3xl dark:bg-sky-500/20" />
      <div className="loading-orb absolute bottom-[-6rem] right-[-3rem] h-48 w-48 rounded-full bg-indigo-400/20 blur-3xl [animation-delay:900ms] dark:bg-indigo-500/20" />

      <div className="mx-auto flex h-full max-w-4xl items-start justify-center pt-10 sm:pt-14">
        <div className="grid w-full gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="relative overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/80 p-6 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.55)] dark:border-slate-700/80 dark:bg-slate-950/75">
            <div className="loading-scan absolute inset-0 opacity-70" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Backend handshake
              </div>
              <h2 className="mt-4 text-2xl font-semibold text-slate-900 dark:text-slate-100 sm:text-3xl">
                {label}
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                {detail}
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/90 p-4 dark:border-slate-700/80 dark:bg-slate-900/80">
                  <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Séries</div>
                  <div className="mt-3 flex items-end gap-1">
                    <span className="loading-bar h-7 w-2 rounded-full bg-indigo-500" />
                    <span className="loading-bar h-11 w-2 rounded-full bg-indigo-400 [animation-delay:120ms]" />
                    <span className="loading-bar h-8 w-2 rounded-full bg-sky-500 [animation-delay:240ms]" />
                    <span className="loading-bar h-12 w-2 rounded-full bg-sky-400 [animation-delay:360ms]" />
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/90 p-4 dark:border-slate-700/80 dark:bg-slate-900/80">
                  <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Métricas</div>
                  <div className="mt-3 space-y-2">
                    <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800">
                      <div className="loading-progress h-full w-2/3 rounded-full bg-amber-400" />
                    </div>
                    <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800">
                      <div className="loading-progress h-full w-1/2 rounded-full bg-emerald-500 [animation-delay:240ms]" />
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/90 p-4 dark:border-slate-700/80 dark:bg-slate-900/80">
                  <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Cenários</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-xs text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-200">Base</span>
                    <span className="rounded-full bg-sky-100 px-2.5 py-1 text-xs text-sky-700 dark:bg-sky-500/15 dark:text-sky-200">Stress</span>
                    <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200">Choques</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-[2rem] border border-slate-200/80 bg-white/80 p-5 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.45)] dark:border-slate-700/80 dark:bg-slate-950/75">
              <div className="flex items-center justify-between">
                <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Fluxo de dados</div>
                <div className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600 dark:bg-slate-900 dark:text-slate-300">live</div>
              </div>
              <div className="mt-5 space-y-3">
                {['Raw data', 'Model registry', 'Forecast engine', 'UI hydration'].map((step, index) => (
                  <div key={step} className="flex items-center gap-3">
                    <span className={`loading-dot h-2.5 w-2.5 rounded-full bg-indigo-500`} style={{ animationDelay: `${index * 140}ms` }} />
                    <span className="text-sm text-slate-700 dark:text-slate-200">{step}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200/80 bg-slate-950 p-5 text-white shadow-[0_30px_80px_-40px_rgba(15,23,42,0.65)] dark:border-slate-700/80">
              <div className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Telemetry</div>
              <div className="mt-4 grid grid-cols-12 items-end gap-2">
                {[44, 52, 38, 64, 58, 70, 62, 78, 60, 68, 54, 74].map((height, index) => (
                  <span
                    key={height + index}
                    className="loading-bar rounded-t-full bg-gradient-to-t from-sky-400 via-indigo-400 to-emerald-300"
                    style={{ height: `${height}px`, animationDelay: `${index * 90}ms` }}
                  />
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                <span>A processar pedidos</span>
                <span>Latência estabilizada</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
