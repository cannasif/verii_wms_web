import { type ReactElement, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';
import { useUIStore } from '@/stores/ui-store';
import { useNotificationConnection } from '@/features/notification/hooks/useNotificationConnection';
import { cn } from '@/lib/utils';
import { RoutePermissionGuard } from '@/features/access-control/components/RoutePermissionGuard';
import { useMyPermissionsQuery } from '@/features/access-control/hooks/useMyPermissionsQuery';
import { filterNavItemsByPermission } from '@/features/access-control/utils/filterNavItems';

interface NavItem {
  title: string;
  href?: string;
  icon?: ReactElement;
  children?: NavItem[];
}

interface MainLayoutProps {
  navItems?: NavItem[];
}

const normalizeForSort = (text: string): string => {
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

export function MainLayout({ navItems }: MainLayoutProps): ReactElement {
  const { t } = useTranslation();
  const { data: permissions, isLoading, isError } = useMyPermissionsQuery();

  const defaultNavItems: NavItem[] = useMemo(() => [
    {
      title: t('sidebar.dashboard'),
      href: '/dashboard',
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect width="7" height="9" x="3" y="3" rx="1" />
          <rect width="7" height="5" x="14" y="3" rx="1" />
          <rect width="7" height="9" x="14" y="12" rx="1" />
          <rect width="7" height="5" x="3" y="16" rx="1" />
        </svg>
      ),
    },
    {
      title: t('sidebar.goodsReceipt'),
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
      children: [
        {
          title: t('sidebar.goodsReceiptAssigned'),
          href: '/goods-receipt/assigned',
        },
        {
          title: t('sidebar.goodsReceiptCreate'),
          href: '/goods-receipt/create',
        },
        {
          title: t('sidebar.goodsReceiptList'),
          href: '/goods-receipt/list',
        },
      ].sort((a, b) => normalizeForSort(a.title).localeCompare(normalizeForSort(b.title), 'tr')),
    },
    {
      title: t('sidebar.inventory'),
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
          <path d="M3 6h18" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
      ),
      children: [
        {
          title: t('sidebar.warehouse3d'),
          href: '/inventory/3d-warehouse',
        },
        {
          title: t('sidebar.warehouse3dOutside'),
          href: '/inventory/3d-outside-warehouse',
        },
      ],
    },
    {
      title: t('sidebar.reports'),
      href: '/reports',
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6" />
          <path d="M16 13H8" />
          <path d="M16 17H8" />
          <path d="M10 9H8" />
        </svg>
      ),
    },
    {
      title: t('sidebar.package'),
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
      ),
      children: [
        {
          title: t('sidebar.packageCreate'),
          href: '/package/create',
        },
        {
          title: t('sidebar.packageList'),
          href: '/package/list',
        },
      ].sort((a, b) => normalizeForSort(a.title).localeCompare(normalizeForSort(b.title), 'tr')),
    },
    {
      title: t('sidebar.transfer'),
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 8L17 12M17 12L21 16M17 12H3M3 16L7 12M7 12L3 8" />
        </svg>
      ),
      children: [
        {
          title: t('sidebar.transferAssigned'),
          href: '/transfer/assigned',
        },
        {
          title: t('sidebar.transferApproval'),
          href: '/transfer/approval',
        },
        {
          title: t('sidebar.transferCreate'),
          href: '/transfer/create',
        },
        {
          title: t('sidebar.transferList'),
          href: '/transfer/list',
        },
      ].sort((a, b) => normalizeForSort(a.title).localeCompare(normalizeForSort(b.title), 'tr')),
    },
    {
      title: t('sidebar.subcontracting'),
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      ),
      children: [
        {
          title: t('sidebar.subcontractingIssueAssigned'),
          href: '/subcontracting/issue/assigned',
        },
        {
          title: t('sidebar.subcontractingIssueApproval'),
          href: '/subcontracting/issue/approval',
        },
        {
          title: t('sidebar.subcontractingIssueCreate'),
          href: '/subcontracting/issue/create',
        },
        {
          title: t('sidebar.subcontractingIssueList'),
          href: '/subcontracting/issue/list',
        },
        {
          title: t('sidebar.subcontractingReceiptAssigned'),
          href: '/subcontracting/receipt/assigned',
        },
        {
          title: t('sidebar.subcontractingReceiptApproval'),
          href: '/subcontracting/receipt/approval',
        },
        {
          title: t('sidebar.subcontractingReceiptCreate'),
          href: '/subcontracting/receipt/create',
        },
        {
          title: t('sidebar.subcontractingReceiptList'),
          href: '/subcontracting/receipt/list',
        },
      ].sort((a, b) => normalizeForSort(a.title).localeCompare(normalizeForSort(b.title), 'tr')),
    },
    {
      title: t('sidebar.warehouse'),
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M22 8.35V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8.35l8 2.8 8-2.8z" />
          <path d="M6 18h12" />
          <path d="M6 14h12" />
          <path d="M22 8.35l-10-3.57L2 8.35" />
        </svg>
      ),
      children: [
        {
          title: t('sidebar.warehouseInboundAssigned'),
          href: '/warehouse/inbound/assigned',
        },
        {
          title: t('sidebar.warehouseInboundApproval'),
          href: '/warehouse/inbound/approval',
        },
        {
          title: t('sidebar.warehouseInboundCreate'),
          href: '/warehouse/inbound/create',
        },
        {
          title: t('sidebar.warehouseInboundList'),
          href: '/warehouse/inbound/list',
        },
        {
          title: t('sidebar.warehouseOutboundAssigned'),
          href: '/warehouse/outbound/assigned',
        },
        {
          title: t('sidebar.warehouseOutboundApproval'),
          href: '/warehouse/outbound/approval',
        },
        {
          title: t('sidebar.warehouseOutboundCreate'),
          href: '/warehouse/outbound/create',
        },
        {
          title: t('sidebar.warehouseOutboundList'),
          href: '/warehouse/outbound/list',
        },
      ].sort((a, b) => normalizeForSort(a.title).localeCompare(normalizeForSort(b.title), 'tr')),
    },
    {
      title: t('sidebar.shipment'),
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 18H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3.19M5 18l6-6M5 18v-5a2 2 0 0 1 2-2h5" />
          <path d="m13 6 4 4-4 4" />
          <path d="M17 10h5" />
        </svg>
      ),
      children: [
        {
          title: t('sidebar.shipmentAssigned'),
          href: '/shipment/assigned',
        },
        {
          title: t('sidebar.shipmentApproval'),
          href: '/shipment/approval',
        },
        {
          title: t('sidebar.shipmentCreate'),
          href: '/shipment/create',
        },
        {
          title: t('sidebar.shipmentList'),
          href: '/shipment/list',
        },
      ].sort((a, b) => normalizeForSort(a.title).localeCompare(normalizeForSort(b.title), 'tr')),
    },
    {
      title: t('sidebar.accessControl'),
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 3l7 4v6c0 5-3.5 8-7 9-3.5-1-7-4-7-9V7l7-4z" />
          <path d="M9.5 11.5a2.5 2.5 0 1 1 5 0v1" />
          <rect x="8.5" y="12.5" width="7" height="5" rx="1" />
        </svg>
      ),
      children: [
        {
          title: t('sidebar.userManagement'),
          href: '/access-control/user-management',
        },
        {
          title: t('sidebar.permissionDefinitions'),
          href: '/access-control/permission-definitions',
        },
        {
          title: t('sidebar.permissionGroups'),
          href: '/access-control/permission-groups',
        },
        {
          title: t('sidebar.userGroupAssignments'),
          href: '/access-control/user-group-assignments',
        },
        {
          title: t('sidebar.mailSettings'),
          href: '/users/mail-settings',
        },
        {
          title: t('sidebar.hangfireMonitoring'),
          href: '/hangfire-monitoring',
        },
      ].sort((a, b) => normalizeForSort(a.title).localeCompare(normalizeForSort(b.title), 'tr')),
    },
    {
      title: t('sidebar.parameters'),
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      ),
      children: [
        {
          title: t('sidebar.parametersGr'),
          href: '/parameters/gr',
        },
        {
          title: t('sidebar.parametersWt'),
          href: '/parameters/wt',
        },
        {
          title: t('sidebar.parametersWo'),
          href: '/parameters/wo',
        },
        {
          title: t('sidebar.parametersWi'),
          href: '/parameters/wi',
        },
        {
          title: t('sidebar.parametersSh'),
          href: '/parameters/sh',
        },
        {
          title: t('sidebar.parametersSrt'),
          href: '/parameters/srt',
        },
        {
          title: t('sidebar.parametersSit'),
          href: '/parameters/sit',
        },
        {
          title: t('sidebar.parametersPt'),
          href: '/parameters/pt',
        },
        {
          title: t('sidebar.parametersPr'),
          href: '/parameters/pr',
        },
        {
          title: t('sidebar.parametersIc'),
          href: '/parameters/ic',
        },
        {
          title: t('sidebar.parametersP'),
          href: '/parameters/p',
        },
      ].sort((a, b) => normalizeForSort(a.title).localeCompare(normalizeForSort(b.title), 'tr')),
    },
  ], [t]);

  const sortedNavItems = useMemo(() => {
    const dashboard = defaultNavItems.find((item) => item.href === '/dashboard');
    const others = defaultNavItems.filter((item) => item.href !== '/dashboard');
    
    const sortedOthers = [...others].sort((a, b) => 
      normalizeForSort(a.title).localeCompare(normalizeForSort(b.title), 'tr')
    );
    
    return dashboard ? [dashboard, ...sortedOthers] : sortedOthers;
  }, [defaultNavItems]);

  const items = useMemo(() => {
    const rawItems = navItems ?? sortedNavItems;
    if (isLoading) return rawItems;
    if (permissions) return filterNavItemsByPermission(rawItems, permissions);
    if (isError) return rawItems;
    return rawItems;
  }, [navItems, sortedNavItems, isLoading, permissions, isError]);

  const { isSidebarOpen } = useUIStore();
  
  useNotificationConnection();

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
            isSidebarOpen ? 'lg:ml-72' : 'lg:ml-20'
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
