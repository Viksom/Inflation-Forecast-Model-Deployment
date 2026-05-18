'use client';

import { type InputHTMLAttributes } from 'react';
import clsx from 'clsx';

interface SliderProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Slider({ className, label, ...props }: SliderProps) {
  return (
    <div className={clsx('space-y-2', className)}>
      {label ? <div className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</div> : null}
      <input
        type="range"
        className="w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-indigo-600 focus:outline-none dark:bg-slate-700"
        {...props}
      />
    </div>
  );
}
