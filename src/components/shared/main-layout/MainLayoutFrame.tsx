import { type ReactElement, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Navbar } from '../Navbar';
import { Sidebar } from '../Sidebar';
import { PremiumTopNav } from '../PremiumTopNav';
import { RoutePermissionGuard } from '@/features/access-control/components/RoutePermissionGuard';
import { useTheme } from '@/components/theme-provider';
import { useUIStore } from '@/stores/ui-store';
import { cn } from '@/lib/utils';
import type { NavItem } from '../nav-items';

interface MainLayoutFrameProps {
  items: NavItem[];
}

export function MainLayoutFrame({ items }: MainLayoutFrameProps): ReactElement {
  const { isSidebarOpen } = useUIStore();
  const { skin } = useTheme();
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const isPremium = skin === 'premium';

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, left: 0 });
  }, [location.key]);

  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-[var(--wms-app-background)] transition-colors duration-300">
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        {!isPremium ? (
          <>
            <div className="absolute -left-[5%] -top-[1%] h-[720px] w-[720px] rounded-full bg-[var(--wms-app-aura-start)] blur-[120px]" />
            <div className="absolute -bottom-[7%] -right-[7%] h-[620px] w-[620px] rounded-full bg-[var(--wms-app-aura-end)] blur-[100px]" />
          </>
        ) : (
          <div aria-hidden className="absolute inset-0 wms-ops-main-glow wms-premium-shell-glow" />
        )}
      </div>

      <div className="relative z-10 flex h-full overflow-hidden">
        {!isPremium && <Sidebar items={items} />}
        <div
          className={cn(
            'app-main-panel',
            'flex min-w-0 flex-1 flex-col overflow-hidden transition-[margin] duration-[260ms] ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none',
            !isPremium && (isSidebarOpen ? 'lg:ml-72' : 'lg:ml-20'),
          )}
        >
          <Navbar navItems={items} />
          {isPremium && <PremiumTopNav items={items} />}
          <main
            ref={mainRef}
            className="wms-ops-scrollbar custom-scrollbar crm-skin relative flex-1 overflow-y-auto"
          >
            {!isPremium ? (
              <>
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 z-0 wms-ops-main-glow"
                />
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 z-0 wms-ops-grid-bg"
                />
              </>
            ) : null}
            <div
              className={cn(
                'relative z-[1] w-full',
                isPremium
                  ? 'mx-auto max-w-[1560px] px-4 py-5 sm:px-6 sm:py-6 lg:px-8'
                  : 'px-3 py-3 sm:px-4 sm:py-4',
              )}
            >
              <RoutePermissionGuard />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
