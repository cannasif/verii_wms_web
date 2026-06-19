import { type ReactElement, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Navbar } from '../Navbar';
import { Sidebar } from '../Sidebar';
import { Footer } from '../Footer';
import { RoutePermissionGuard } from '@/features/access-control/components/RoutePermissionGuard';
import { useUIStore } from '@/stores/ui-store';
import { cn } from '@/lib/utils';
import type { NavItem } from '../nav-items';

interface MainLayoutFrameProps {
  items: NavItem[];
}

export function MainLayoutFrame({ items }: MainLayoutFrameProps): ReactElement {
  const { isSidebarOpen } = useUIStore();
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, left: 0 });
  }, [location.key]);

  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-[#f8f9fc] transition-colors duration-300 dark:bg-[#090114]">
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute -left-[5%] -top-[1%] h-[720px] w-[720px] rounded-full bg-cyan-300/25 blur-[120px] dark:bg-cyan-600/5" />
        <div className="absolute -bottom-[7%] -right-[7%] h-[620px] w-[620px] rounded-full bg-orange-300/25 blur-[100px] dark:bg-orange-600/5" />
      </div>

      <div className="relative z-10 flex h-full overflow-hidden">
        <Sidebar items={items} />
        <div
          className={cn(
            'flex min-w-0 flex-1 flex-col overflow-hidden transition-[margin] duration-[260ms] ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none',
            isSidebarOpen ? 'lg:ml-72' : 'lg:ml-20',
          )}
        >
          <Navbar navItems={items} />
          <main
            ref={mainRef}
            className="custom-scrollbar crm-skin relative flex-1 overflow-y-auto pb-20 md:pb-16"
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 z-0 wms-ops-main-glow"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 z-0 wms-ops-grid-bg"
            />
            <div className="relative z-[1] w-full px-3 py-3 sm:px-4 sm:py-4">
              <RoutePermissionGuard />
            </div>
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
}
