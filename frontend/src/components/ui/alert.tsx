import { type HTMLAttributes } from 'react';
import clsx from 'clsx';

interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'warning';
}

export function Alert({ className, variant = 'default', ...props }: AlertProps) {
  const styles = {
    default: 'border border-slate-200 bg-slate-50 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100',
    warning: 'border border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-950 dark:text-amber-200',
  };
  return <div className={clsx('rounded-3xl p-5', styles[variant], className)} {...props} />;
}
