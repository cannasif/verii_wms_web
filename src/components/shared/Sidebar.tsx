import { type ReactElement, useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useUIStore } from '@/stores/ui-store';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import v3riiWmsLogo from '@/assets/v3riiwms.png';
import v3logo from '@/assets/v3logo.png';

interface NavItem {
  title: string;
  href?: string;
  icon?: ReactElement;
  children?: NavItem[];
}

interface SidebarProps {
  items: NavItem[];
}

const iconTones = [
  'blue',
  'orange',
  'emerald',
  'pink',
  'amber',
  'cyan',
  'indigo',
  'violet',
] as const;

type IconTone = (typeof iconTones)[number];

const getToneByTitle = (title: string): IconTone => {
  const hash = title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return iconTones[hash % iconTones.length];
};

const toneClassMap: Record<IconTone, { idle: string; active: string }> = {
  blue: {
    idle: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300',
    active: 'bg-blue-200 text-blue-800 dark:bg-blue-500/30 dark:text-blue-200',
  },
  orange: {
    idle: 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300',
    active: 'bg-orange-200 text-orange-800 dark:bg-orange-500/30 dark:text-orange-200',
  },
  emerald: {
    idle: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
    active: 'bg-emerald-200 text-emerald-800 dark:bg-emerald-500/30 dark:text-emerald-200',
  },
  pink: {
    idle: 'bg-pink-100 text-pink-700 dark:bg-pink-500/20 dark:text-pink-300',
    active: 'bg-pink-200 text-pink-800 dark:bg-pink-500/30 dark:text-pink-200',
  },
  amber: {
    idle: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
    active: 'bg-amber-200 text-amber-800 dark:bg-amber-500/30 dark:text-amber-200',
  },
  cyan: {
    idle: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-300',
    active: 'bg-cyan-200 text-cyan-800 dark:bg-cyan-500/30 dark:text-cyan-200',
  },
  indigo: {
    idle: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300',
    active: 'bg-indigo-200 text-indigo-800 dark:bg-indigo-500/30 dark:text-indigo-200',
  },
  violet: {
    idle: 'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300',
    active: 'bg-violet-200 text-violet-800 dark:bg-violet-500/30 dark:text-violet-200',
  },
};

const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ı/g, 'i')
    .replace(/ş/g, 's')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/İ/g, 'i')
    .replace(/Ş/g, 's')
    .replace(/Ğ/g, 'g')
    .replace(/Ü/g, 'u')
    .replace(/Ö/g, 'o')
    .replace(/Ç/g, 'c');
};

function matchesQuery(title: string, searchQuery: string): boolean {
  if (!searchQuery.trim()) return true;

  const normalizedQuery = normalizeText(searchQuery);
  const queryWords = normalizedQuery.split(/\s+/).filter((word) => word.length > 0);
  if (queryWords.length === 0) return true;

  const normalizedTitle = normalizeText(title);
  const titleWords = normalizedTitle.split(/\s+/).filter((word) => word.length > 0);

  return queryWords.every((queryWord) => titleWords.some((titleWord) => titleWord.includes(queryWord)));
}

function nodeMatchesSearch(node: NavItem, searchQuery: string): boolean {
  if (matchesQuery(node.title, searchQuery)) {
    return true;
  }

  return node.children?.some((child) => nodeMatchesSearch(child, searchQuery)) ?? false;
}

function nodeHasActiveDescendant(node: NavItem, pathname: string): boolean {
  if (node.href && pathname === node.href) {
    return true;
  }

  return node.children?.some((child) => nodeHasActiveDescendant(child, pathname)) ?? false;
}

function NavItemComponent({
  item,
  searchQuery,
  expandedItemKeys,
  onToggle,
  level = 0,
}: {
  item: NavItem;
  searchQuery: string;
  expandedItemKeys: string[];
  onToggle: (key: string) => void;
  level?: number;
}): ReactElement {
  const location = useLocation();
  const { isSidebarOpen, setSidebarOpen } = useUIStore();
  const hasChildren = (item.children?.length ?? 0) > 0;
  const isActive = item.href ? location.pathname === item.href : false;
  const hasActiveChild = item.children?.some((child) => nodeHasActiveDescendant(child, location.pathname)) ?? false;
  const itemKey = item.href || `${level}:${item.title}`;
  const searchMatched = nodeMatchesSearch(item, searchQuery);
  const isExpanded = expandedItemKeys.includes(itemKey) || hasActiveChild || (Boolean(searchQuery.trim()) && hasChildren && searchMatched);
  const iconTone = getToneByTitle(item.title);
  const toneClasses = toneClassMap[iconTone];

  if (!searchMatched) {
    return <></>;
  }

  const handleIconClick = (e: React.MouseEvent): void => {
    if (!isSidebarOpen) {
      e.preventDefault();
      e.stopPropagation();
      setSidebarOpen(true);
      if (hasChildren) {
        onToggle(itemKey);
      }
    }
  };

  if (hasChildren) {
    return (
      <div className="space-y-1">
        <button
          type="button"
          onClick={() => {
            if (!isSidebarOpen) {
              setSidebarOpen(true);
              setTimeout(() => onToggle(itemKey), 100);
            } else {
              onToggle(itemKey);
            }
          }}
          className={cn(
            'flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors duration-200',
            'hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-white/10 dark:hover:text-white',
            (hasActiveChild || isActive)
              ? 'bg-slate-100 text-slate-900 dark:bg-white/10 dark:text-white'
              : 'text-slate-500 dark:text-slate-400',
            !isSidebarOpen && 'justify-center',
          )}
        >
          {item.icon && level === 0 ? (
            <span
              className={cn(
                'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-white/60 shadow-xs transition-all [&>svg]:h-[21px] [&>svg]:w-[21px] dark:border-white/10',
                (hasActiveChild || isActive) ? toneClasses.active : toneClasses.idle,
                !isSidebarOpen && 'mx-auto',
              )}
              onClick={handleIconClick}
            >
              {item.icon}
            </span>
          ) : null}
          {level > 0 && isSidebarOpen ? (
            <span className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-600" />
          ) : null}
          <span className={cn('flex-1 truncate text-left transition-opacity', !isSidebarOpen && 'hidden')}>
            {item.title}
          </span>
          {isSidebarOpen && (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={cn('text-slate-400 transition-transform dark:text-slate-500', isExpanded && 'rotate-90')}
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          )}
        </button>
        {isExpanded && isSidebarOpen ? (
          <div className={cn('space-y-1 border-l border-slate-200 dark:border-white/10', level === 0 ? 'ml-4 pl-4' : 'ml-3 pl-3')}>
            {item.children?.map((child) => (
              <NavItemComponent
                key={child.href || `${itemKey}:${child.title}`}
                item={child}
                searchQuery={searchQuery}
                expandedItemKeys={expandedItemKeys}
                onToggle={onToggle}
                level={level + 1}
              />
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  if (!item.href) {
    return <></>;
  }

  return (
    <Link
      to={item.href}
      className={cn(
        'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors duration-200',
        'hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-white/10 dark:hover:text-white',
        isActive
          ? 'bg-slate-100 text-slate-900 dark:bg-white/10 dark:text-white'
          : 'text-slate-500 dark:text-slate-400',
        !isSidebarOpen && 'justify-center',
      )}
      onClick={(e) => {
        if (!isSidebarOpen) {
          e.preventDefault();
          setSidebarOpen(true);
        } else if (window.innerWidth < 1024) {
          setSidebarOpen(false);
        }
      }}
    >
      {item.icon && level === 0 ? (
        <span
          className={cn(
            'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-white/60 shadow-xs transition-all [&>svg]:h-[21px] [&>svg]:w-[21px] dark:border-white/10',
            isActive ? toneClasses.active : toneClasses.idle,
            !isSidebarOpen && 'mx-auto',
          )}
          onClick={handleIconClick}
        >
          {item.icon}
        </span>
      ) : null}
      {level > 0 && isSidebarOpen ? <span className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-600" /> : null}
      <span className={cn('truncate transition-opacity', !isSidebarOpen && 'hidden')}>
        {item.title}
      </span>
    </Link>
  );
}

export function Sidebar({ items }: SidebarProps): ReactElement {
  const { isSidebarOpen, searchQuery } = useUIStore();
  const { t } = useTranslation();
  const [expandedItemKeys, setExpandedItemKeys] = useState<string[]>([]);

  useEffect(() => {
    if (!isSidebarOpen) {
      setExpandedItemKeys([]);
    }
  }, [isSidebarOpen]);

  const handleToggle = useCallback((key: string): void => {
    setExpandedItemKeys((prev) => (
      prev.includes(key)
        ? prev.filter((itemKey) => itemKey !== key)
        : [...prev, key]
    ));
  }, []);

  return (
    <>
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/45 backdrop-blur-[2px] lg:hidden"
          onClick={() => useUIStore.getState().setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'custom-scrollbar fixed left-0 top-0 bottom-0 z-50 flex w-[86vw] max-w-[320px] flex-col overflow-y-auto border-r border-slate-200/70 bg-white/80 backdrop-blur-xl transition-transform duration-300 ease-in-out dark:border-white/10 dark:bg-[#130822]/95 lg:w-72 lg:max-w-none lg:translate-x-0',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:w-20',
        )}
      >
        <div className="h-24 shrink-0 border-b border-slate-200/70 dark:border-white/5">
          <div className={cn('relative flex h-full items-center px-4', isSidebarOpen ? 'justify-center' : 'justify-center')}>
            {isSidebarOpen ? (
              <>
                <div className="flex items-center">
                  <img
                    src={v3riiWmsLogo}
                    alt="V3RII WMS"
                    decoding="async"
                    fetchPriority="high"
                    width={200}
                    height={120}
                    className="h-30 w-200 object-contain justify-center"
                  />
                </div>
                <button
                  onClick={() => useUIStore.getState().setSidebarOpen(false)}
                  className="absolute right-4 rounded-lg p-2 text-slate-500 transition-colors hover:text-red-500 lg:hidden"
                >
                  <X size={20} />
                </button>
              </>
            ) : (
              <img
                src={v3logo}
                alt="V3"
                decoding="async"
                width={40}
                height={40}
                className="h-10 w-auto object-contain scale-200"
              />
            )}
          </div>
        </div>
        <nav className="flex h-full flex-col gap-1 p-4">
          {isSidebarOpen && searchQuery.trim().length > 0 ? (
            <div className="mb-1 rounded-xl border border-pink-200/40 bg-pink-50/70 px-3 py-2 text-xs text-pink-700 dark:border-pink-500/20 dark:bg-pink-500/10 dark:text-pink-300">
              {t('sidebar.filterLabel')}: {searchQuery}
            </div>
          ) : null}
          {items.map((item, index) => (
            <NavItemComponent
              key={item.href || item.title || index}
              item={item}
              searchQuery={searchQuery}
              expandedItemKeys={expandedItemKeys}
              onToggle={handleToggle}
            />
          ))}
        </nav>
      </aside>
    </>
  );
}
