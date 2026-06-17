import { type ReactElement, Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Cancel01Icon,
  Mic01Icon,
  Search01Icon,
  SidebarLeft01Icon,
} from '@hugeicons/core-free-icons';
import { useAuthStore } from '@/stores/auth-store';
import { useUIStore } from '@/stores/ui-store';
import { NotificationIcon } from '@/features/notification/components/NotificationIcon';
import { NavbarGradientIcon, NavbarIconGradientDefs, navbarIconButtonClassName } from '@/components/shared/NavbarGradientIcon';
import { cn } from '@/lib/utils';
import { useVoiceSearch } from '@/hooks/useVoiceSearch';
import type { NavItem } from './nav-items';

const UserProfileModal = lazy(() =>
  import('@/features/user-detail').then((module) => ({
    default: module.UserProfileModal,
  })),
);

interface SearchTarget {
  title: string;
  subtitle: string;
  href: string;
}

interface NavbarProps {
  navItems?: NavItem[];
}

const normalizeText = (text: string): string =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ı/g, 'i')
    .replace(/ş/g, 's')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c');

const flattenSearchTargets = (items: NavItem[], resolveTitle: (item: NavItem) => string): SearchTarget[] => {
  const targets: SearchTarget[] = [];
  for (const item of items) {
    if (item.href) {
      const title = resolveTitle(item);
      targets.push({ title, subtitle: title, href: item.href });
    }
    if (item.children?.length) {
      for (const child of item.children) {
        if (!child.href) continue;
        const parentTitle = resolveTitle(item);
        const childTitle = resolveTitle(child);
        targets.push({
          title: childTitle,
          subtitle: `${parentTitle} / ${childTitle}`,
          href: child.href,
        });
      }
    }
  }
  return targets;
};

const searchInputClassName = (isFocused: boolean): string =>
  cn(
    'w-full rounded-2xl border py-2.5 pl-11 pr-20 text-sm font-medium outline-none transition-all duration-300',
    'border-slate-200 bg-slate-100/60 text-slate-900 placeholder:text-slate-500',
    isFocused
      ? 'border-cyan-400/40 bg-white ring-4 ring-cyan-400/15 shadow-[0_4px_24px_rgba(34,211,238,0.08)]'
      : '',
    'dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-500',
    isFocused ? 'dark:border-cyan-500/35 dark:bg-[#150a25] dark:ring-cyan-500/10' : '',
  );

export function Navbar({ navItems = [] }: NavbarProps): ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { user, branch } = useAuthStore();
  const { toggleSidebar, searchQuery, setSearchQuery, setSidebarOpen } = useUIStore();
  const [userProfileModalOpen, setUserProfileModalOpen] = useState(false);
  const [isSearchFocus, setIsSearchFocus] = useState(false);
  const resolveTitle = useMemo(
    () => (item: NavItem): string => t(item.title, { defaultValue: item.titleFallback ?? item.title }),
    [t],
  );

  const { isListening, isSupported, startListening } = useVoiceSearch({
    onResult: (text) => {
      setSearchQuery(text);
      if (text.trim().length > 0) {
        setSidebarOpen(true);
        setIsSearchFocus(true);
      }
    },
  });

  const searchTargets = useMemo(() => flattenSearchTargets(navItems, resolveTitle), [navItems, resolveTitle]);
  const quickResults = useMemo(() => {
    const q = normalizeText(searchQuery.trim());
    if (!q) return [] as SearchTarget[];
    return searchTargets
      .filter((item) => normalizeText(item.subtitle).includes(q))
      .slice(0, 5);
  }, [searchQuery, searchTargets]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSidebarOpen(true);
        requestAnimationFrame(() => {
          searchInputRef.current?.focus();
          searchInputRef.current?.select();
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setSidebarOpen]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const val = e.target.value;
    setSearchQuery(val);
    if (val.trim().length > 0) {
      setSidebarOpen(true);
    }
  };

  const handleSearchNavigate = (target: SearchTarget): void => {
    setSearchQuery(target.title);
    setSidebarOpen(true);
    setIsSearchFocus(false);
    navigate(target.href);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter' && quickResults.length > 0) {
      e.preventDefault();
      handleSearchNavigate(quickResults[0]);
    }
  };

  const displayName = user?.name || user?.email || t('common.user');
  const displayInitial = displayName.charAt(0).toUpperCase();
  const navbarBranchCodeTrimmed = branch?.code?.trim();
  const navbarBranchCodePrefix =
    navbarBranchCodeTrimmed && navbarBranchCodeTrimmed.toLowerCase() !== '0'
      ? `${navbarBranchCodeTrimmed} • `
      : '';

  const renderSearchResults = (): ReactElement | null => {
    if (!isSearchFocus || !searchQuery.trim().length) return null;

    return (
      <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 p-2 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-[#130822]/95">
        {quickResults.length > 0 ? (
          quickResults.map((item) => (
            <button
              key={item.href}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSearchNavigate(item)}
              className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition hover:bg-slate-100 dark:hover:bg-white/10"
            >
              <span className="truncate text-sm font-medium text-slate-700 dark:text-slate-100">{item.title}</span>
              <span className="ml-3 truncate text-xs text-slate-400">{item.subtitle}</span>
            </button>
          ))
        ) : (
          <p className="px-3 py-2 text-sm text-slate-500 dark:text-slate-400">{t('common.notFound')}</p>
        )}
      </div>
    );
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/75 px-3 pt-[max(0.5rem,env(safe-area-inset-top))] shadow-[0_1px_0_rgba(15,23,42,0.04)] backdrop-blur-xl transition-all duration-300 dark:border-white/5 dark:bg-[#0c0516]/80 dark:shadow-[0_1px_0_rgba(255,255,255,0.04)] sm:px-6">
        <NavbarIconGradientDefs />
        <div className="flex h-20 items-center justify-between gap-3 sm:gap-4">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={toggleSidebar}
              className={navbarIconButtonClassName}
              aria-label={t('navbar.toggleSidebar', { defaultValue: 'Toggle sidebar' })}
            >
              <NavbarGradientIcon icon={SidebarLeft01Icon} size={24} />
            </button>

            <div className="relative hidden w-[min(100%,20rem)] shrink-0 md:block lg:w-80">
              {isSearchFocus && (
                <div
                  aria-hidden
                  className="pointer-events-none absolute -inset-1 -z-10 rounded-[1.25rem] bg-gradient-to-r from-cyan-400/25 via-sky-400/20 to-teal-400/25 opacity-80 blur-2xl transition-opacity duration-300"
                />
              )}
              <HugeiconsIcon
                icon={Search01Icon}
                size={18}
                strokeWidth={1.75}
                className={cn(
                  'pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-300',
                  isSearchFocus ? 'text-cyan-500' : 'text-slate-400',
                )}
              />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={handleSearch}
                onKeyDown={handleSearchKeyDown}
                onFocus={() => setIsSearchFocus(true)}
                onBlur={() => setTimeout(() => setIsSearchFocus(false), 120)}
                placeholder={t('navbar.search_placeholder')}
                className={searchInputClassName(isSearchFocus)}
              />
              <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
                {isSupported && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setIsSearchFocus(true);
                      startListening();
                    }}
                    className={cn(
                      'rounded-xl p-1.5 transition-all duration-300',
                      isListening
                        ? 'animate-pulse bg-cyan-500/10 text-cyan-500'
                        : 'text-slate-400 hover:bg-slate-200/80 hover:text-cyan-500 dark:hover:bg-white/10',
                    )}
                    title={t('voiceSearch.start')}
                  >
                    <HugeiconsIcon icon={Mic01Icon} size={16} strokeWidth={1.75} />
                  </button>
                )}
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="rounded-full p-1 text-slate-400 transition-colors duration-300 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-white/20 dark:hover:text-white"
                  >
                    <HugeiconsIcon icon={Cancel01Icon} size={13} strokeWidth={1.75} />
                  </button>
                )}
              </div>

              {renderSearchResults()}
            </div>

            {isSupported && (
              <button
                type="button"
                onClick={() => startListening()}
                className={cn(
                  navbarIconButtonClassName,
                  'md:hidden',
                  isListening && 'shadow-[0_0_12px_rgba(14,165,233,0.28),0_0_22px_rgba(251,146,60,0.16)]',
                )}
                title={t('voiceSearch.start')}
                aria-label={t('voiceSearch.start')}
              >
                <NavbarGradientIcon icon={Mic01Icon} size={22} className={isListening ? 'animate-pulse' : undefined} />
              </button>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-4">
            <NotificationIcon />

            {user && <div className="hidden h-8 w-px bg-slate-200/80 dark:bg-white/10 sm:block" />}

            {user && (
              <button
                type="button"
                onClick={() => setUserProfileModalOpen(true)}
                className="group flex items-center gap-3 rounded-xl transition-all duration-300"
              >
                <div className="hidden text-right lg:block">
                  <p className="max-w-[190px] truncate text-sm font-semibold text-slate-700 dark:text-slate-100">
                    {navbarBranchCodePrefix}
                    {displayName}
                  </p>
                  <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                    {branch?.name || t('roles.admin')}
                  </p>
                </div>
                <div
                  className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-b from-sky-300 via-sky-400 to-orange-400 p-[2px]',
                    'transition-[box-shadow,filter] duration-300 ease-out',
                    'group-hover:shadow-[0_0_12px_rgba(14,165,233,0.28),0_0_26px_rgba(251,146,60,0.18),0_0_40px_rgba(56,189,248,0.1)]',
                    'group-hover:brightness-[1.03]',
                    'dark:from-sky-400 dark:via-sky-500 dark:to-orange-400',
                    'dark:group-hover:shadow-[0_0_14px_rgba(56,189,248,0.22),0_0_28px_rgba(251,146,60,0.15),0_0_42px_rgba(34,211,238,0.08)]',
                  )}
                >
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-white text-xs font-bold text-orange-600 dark:bg-[#0c0516] dark:text-orange-400">
                    {displayInitial}
                  </div>
                </div>
              </button>
            )}
          </div>
        </div>
      </header>

      <Suspense fallback={null}>
        {userProfileModalOpen ? (
          <UserProfileModal
            open={userProfileModalOpen}
            onOpenChange={setUserProfileModalOpen}
            onOpenProfileDetails={() => {
              setUserProfileModalOpen(false);
              navigate('/profile');
            }}
          />
        ) : null}
      </Suspense>
    </>
  );
}
