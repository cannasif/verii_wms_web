import { cn } from '@/lib/utils';

export const sidebarMotionClassName = cn(
  'will-change-[width,transform]',
  'transition-[width,transform] duration-[260ms] ease-[cubic-bezier(0.4,0,0.2,1)]',
  'motion-reduce:transition-none',
);

export const sidebarShellClassName = cn(
  'border-slate-200/70 bg-white/75 backdrop-blur-xl',
  'dark:border-white/5 dark:bg-[#0c0516]/80',
  'shadow-[1px_0_0_rgba(15,23,42,0.04)] dark:shadow-[1px_0_0_rgba(255,255,255,0.04)]',
);

export const sidebarLabelClassName = (isOpen: boolean): string =>
  cn(
    'overflow-hidden whitespace-nowrap text-start transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]',
    isOpen ? 'max-w-[12rem] opacity-100' : 'max-w-0 opacity-0',
  );

export const sidebarItemHoverClassName =
  'hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-white/5 dark:hover:text-white';

export const sidebarActiveParentClassName =
  'bg-cyan-50 text-cyan-900 dark:bg-cyan-500/10 dark:text-white';

export const sidebarActiveLeafClassName =
  'bg-cyan-50 font-semibold text-cyan-800 dark:bg-cyan-500/10 dark:text-white';

export const sidebarIconBoxClassName = (isActive: boolean, idleToneClass: string): string =>
  cn(
    'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border shadow-xs transition-all duration-200',
    'border-slate-200 dark:border-slate-800',
    isActive
      ? 'border-cyan-200 bg-cyan-100 text-cyan-700 dark:border-cyan-500/30 dark:bg-cyan-500/20 dark:text-cyan-400'
      : idleToneClass,
  );

export const sidebarLeafAccentClassName = cn(
  'relative ps-4',
  'before:absolute before:start-0 before:top-1/2 before:h-6 before:w-1 before:-translate-y-1/2 before:rounded-e-full',
  'before:bg-linear-to-b before:from-cyan-500 before:to-sky-400 before:content-[""]',
);

export const sidebarActiveDotClassName = 'size-2 shrink-0 rounded-full bg-cyan-500 dark:bg-cyan-400';
