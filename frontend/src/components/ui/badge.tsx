import { type HTMLAttributes } from 'react';
import clsx from 'clsx';

interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'outline' | 'success' | 'danger';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const base = 'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold';
  const styles = {
    default: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
    outline: 'border border-slate-200 text-slate-700 dark:border-slate-700 dark:text-slate-200',
    success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200',
    danger: 'bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-200',
  };
  return <div className={clsx(base, styles[variant], className)} {...props} />;
}
