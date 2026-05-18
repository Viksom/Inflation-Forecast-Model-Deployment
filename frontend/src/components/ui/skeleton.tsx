import { type HTMLAttributes } from 'react';
import clsx from 'clsx';

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={clsx('animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-700', className)} {...props} />;
}
