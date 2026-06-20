import { type ReactElement, useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HugeiconsIcon } from '@hugeicons/react';
import { Cancel01Icon } from '@hugeicons/core-free-icons';
import { useUIStore } from '@/stores/ui-store';
import { cn } from '@/lib/utils';
import v3riiWmsLogo from '@/assets/v3riiwms.png';
import v3logo from '@/assets/v3logo.png';
import type { NavItem } from './nav-items';
import { SidebarNavItem } from './sidebar/SidebarNavItem';
import { collectActiveAncestorKeys, resolveExpandedKeysAfterToggle } from './sidebar/sidebar-utils';
import { sidebarMotionClassName, sidebarShellClassName } from './sidebar/sidebar-styles';
import { TooltipProvider } from '@/components/ui/tooltip';

interface SidebarProps {
  items: NavItem[];
}

export function Sidebar({ items }: SidebarProps): ReactElement {
  const { isSidebarOpen, searchQuery } = useUIStore();
  const { t } = useTranslation();
  const location = useLocation();
  const [expandedItemKeys, setExpandedItemKeys] = useState<string[]>([]);
  const resolveTitle = useCallback(
    (item: NavItem): string => t(item.title, { defaultValue: item.titleFallback ?? item.title }),
    [t],
  );

  useEffect(() => {
    if (!isSidebarOpen) {
      setExpandedItemKeys([]);
    }
  }, [isSidebarOpen]);

  useEffect(() => {
    if (searchQuery.trim()) {
      return;
    }
    const activeAncestorKeys = collectActiveAncestorKeys(items, location.pathname);
    setExpandedItemKeys(activeAncestorKeys);
  }, [items, location.pathname, searchQuery]);

  const handleToggle = useCallback((key: string): void => {
    setExpandedItemKeys((prev) => resolveExpandedKeysAfterToggle(prev, key, items, location.pathname));
  }, [items, location.pathname]);

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/50 backdrop-blur-[1px] transition-opacity duration-[260ms] ease-[cubic-bezier(0.4,0,0.2,1)] lg:hidden',
          isSidebarOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={() => useUIStore.getState().setSidebarOpen(false)}
        aria-hidden={!isSidebarOpen}
      />

      <aside
        data-sidebar-open={isSidebarOpen ? 'true' : 'false'}
        className={cn(
          'app-sidebar-panel custom-scrollbar fixed bottom-0 left-0 top-0 z-50 flex h-dvh flex-col border-r',
          sidebarShellClassName,
          sidebarMotionClassName,
          'w-72',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          isSidebarOpen ? 'lg:w-72' : 'lg:w-20',
          isSidebarOpen ? 'overflow-y-auto' : 'lg:overflow-hidden',
        )}
      >
        <div className="z-10 h-36 shrink-0 overflow-visible border-b border-slate-200/70 dark:border-white/5">
          <div
            className={cn(
              'relative flex h-full items-center justify-center',
              isSidebarOpen ? 'px-3' : 'px-0.5',
            )}
          >
            <img
              src={v3riiWmsLogo}
              alt="V3RII WMS"
              decoding="async"
              fetchPriority="high"
              width={320}
              height={160}
              className={cn(
                'h-32 w-auto max-w-[min(100%,17.5rem)] object-contain transition-opacity duration-[260ms] ease-[cubic-bezier(0.4,0,0.2,1)]',
                isSidebarOpen ? 'opacity-100' : 'pointer-events-none absolute opacity-0',
              )}
            />
            <img
              src={v3logo}
              alt="V3"
              decoding="async"
              width={128}
              height={128}
              className={cn(
                'object-contain transition-[opacity,transform] duration-[260ms] ease-[cubic-bezier(0.4,0,0.2,1)]',
                isSidebarOpen
                  ? 'pointer-events-none absolute h-32 w-auto opacity-0'
                  : 'h-16 w-16 origin-center scale-[2.35] opacity-100',
              )}
            />
            <button
              type="button"
              onClick={() => useUIStore.getState().setSidebarOpen(false)}
              className={cn(
                'absolute right-3 rounded-xl p-2 text-slate-500 transition-colors duration-300 hover:text-cyan-600 lg:hidden',
                'rtl:right-auto rtl:left-3',
                !isSidebarOpen && 'pointer-events-none opacity-0',
              )}
              aria-label={t('common.close', { defaultValue: 'Close' })}
            >
              <HugeiconsIcon icon={Cancel01Icon} size={20} strokeWidth={1.75} />
            </button>
          </div>
        </div>

        <TooltipProvider delayDuration={400}>
          <nav className={cn('flex flex-1 flex-col gap-0.5 p-3', !isSidebarOpen && 'lg:overflow-hidden')}>
            {isSidebarOpen && searchQuery.trim().length > 0 ? (
              <div className="mb-1 rounded-xl border border-cyan-200/50 bg-cyan-50/80 px-3 py-2 text-xs text-cyan-800 dark:border-cyan-500/25 dark:bg-cyan-500/10 dark:text-cyan-300">
                {t('sidebar.filterLabel')}: {searchQuery}
              </div>
            ) : null}
            {items.map((item, index) => (
              <div
                key={item.href || item.title || index}
                className={cn(index > 0 && 'mt-2 border-t border-slate-200/50 pt-2 dark:border-white/5')}
              >
                <SidebarNavItem
                  item={item}
                  searchQuery={searchQuery}
                  expandedItemKeys={expandedItemKeys}
                  onToggle={handleToggle}
                  resolveTitle={resolveTitle}
                />
              </div>
            ))}
          </nav>
        </TooltipProvider>
      </aside>
    </>
  );
}
