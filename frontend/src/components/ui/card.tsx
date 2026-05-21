import { type HTMLAttributes } from 'react';
import clsx from 'clsx';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={clsx('rounded-2xl border border-base bg-surface p-4 shadow-soft sm:rounded-3xl sm:p-6', className)} {...props} />;
}
