import { type ReactElement, useEffect, useMemo } from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';
import { useUIStore } from '@/stores/ui-store';
import { useNotificationConnection } from '@/features/notification/hooks/useNotificationConnection';
import { cn } from '@/lib/utils';
import { RoutePermissionGuard } from '@/features/access-control/components/RoutePermissionGuard';
import { useMyPermissionsQuery } from '@/features/access-control/hooks/useMyPermissionsQuery';
import { filterNavItemsByPermission } from '@/features/access-control/utils/filterNavItems';
import { WMS_NAV_ITEMS, type NavItem } from './nav-items';
import { logPerfDebug } from '@/lib/perf-debug';

interface MainLayoutProps {
  navItems?: NavItem[];
}

export function MainLayout({ navItems }: MainLayoutProps): ReactElement {
  const { data: permissions, isLoading, isError } = useMyPermissionsQuery();
  const baseItems = navItems ?? WMS_NAV_ITEMS;

  const items = useMemo(() => {
    if (isLoading) return baseItems;
    if (permissions) return filterNavItemsByPermission(baseItems, permissions);
    if (isError) return baseItems;
    return baseItems;
  }, [baseItems, isError, isLoading, permissions]);

  const { isSidebarOpen } = useUIStore();

  useNotificationConnection();

  useEffect(() => {
    logPerfDebug('main-layout:ready', {
      navItemCount: items.length,
      permissionsReady: !!permissions,
    });
  }, [items.length, permissions]);

  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-[#f8f9fc] transition-colors duration-300 dark:bg-[#090114]">
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute -left-[14%] -top-[14%] h-[720px] w-[720px] rounded-full bg-pink-300/25 blur-[120px] dark:bg-pink-600/5" />
        <div className="absolute -bottom-[14%] -right-[14%] h-[620px] w-[620px] rounded-full bg-orange-300/25 blur-[110px] dark:bg-orange-600/5" />
      </div>

      <div className="relative z-10 flex h-full overflow-hidden">
        <Sidebar items={items} />
        <div
          className={cn(
            'flex min-w-0 flex-1 flex-col overflow-hidden transition-all duration-300',
            isSidebarOpen ? 'lg:ml-72' : 'lg:ml-20',
          )}
        >
          <Navbar navItems={items} />
          <main className="custom-scrollbar crm-skin flex-1 overflow-y-auto pb-20 md:pb-16">
            <div className="w-full px-3 py-3 sm:px-4 sm:py-4">
              <RoutePermissionGuard />
            </div>
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
}
