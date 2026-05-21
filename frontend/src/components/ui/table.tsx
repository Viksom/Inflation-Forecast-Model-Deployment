import { type HTMLAttributes } from 'react';
import clsx from 'clsx';

export function Table({ className, ...props }: HTMLAttributes<HTMLTableElement>) {
  return <table className={clsx('w-full border-collapse text-sm', className)} {...props} />;
}

export function TableHeader({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={clsx('border-b border-slate-200 text-left text-xs uppercase tracking-[0.15em] text-slate-500 dark:border-slate-700 dark:text-slate-400', className)} {...props} />;
}

export function TableRow({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={clsx('border-b border-slate-100 dark:border-slate-800', className)} {...props} />;
}

export function TableHead({ className, ...props }: HTMLAttributes<HTMLTableCellElement>) {
  return <th className={clsx('px-2 py-3 font-semibold sm:px-4', className)} {...props} />;
}

export function TableCell({ className, ...props }: HTMLAttributes<HTMLTableCellElement>) {
  return <td className={clsx('px-2 py-4 align-top text-sm text-slate-700 dark:text-slate-200 sm:px-4', className)} {...props} />;
}
