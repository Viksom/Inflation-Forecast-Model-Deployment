import { type HTMLAttributes } from 'react';
import clsx from 'clsx';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={clsx('rounded-3xl border border-base bg-surface p-6 shadow-soft', className)} {...props} />;
}
