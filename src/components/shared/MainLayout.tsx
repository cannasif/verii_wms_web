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

const sortNavItems = (items: NavItem[]): NavItem[] => (
  [...items].sort((a, b) => normalizeForSort(a.title).localeCompare(normalizeForSort(b.title), 'tr'))
);

export function MainLayout({ navItems }: MainLayoutProps): ReactElement {
  const { t } = useTranslation();
  const { data: permissions, isLoading, isError } = useMyPermissionsQuery();

  const defaultNavItems: NavItem[] = useMemo(() => {
    const dashboardItem: NavItem = {
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
    };

    const goodsReceiptModule: NavItem = {
      title: t('sidebar.goodsReceipt'),
      children: sortNavItems([
        { title: t('sidebar.goodsReceiptAssigned'), href: '/goods-receipt/assigned' },
        { title: t('sidebar.goodsReceiptApproval'), href: '/goods-receipt/approval' },
        { title: t('sidebar.goodsReceiptCreate'), href: '/goods-receipt/create' },
        { title: t('sidebar.goodsReceiptProcess'), href: '/goods-receipt/process' },
        { title: t('sidebar.goodsReceiptList'), href: '/goods-receipt/list' },
      ]),
    };

    const warehouseInboundModule: NavItem = {
      title: t('sidebar.warehouseInboundCreate'),
      children: sortNavItems([
        { title: t('sidebar.warehouseInboundAssigned'), href: '/warehouse/inbound/assigned' },
        { title: t('sidebar.warehouseInboundApproval'), href: '/warehouse/inbound/approval' },
        { title: t('sidebar.warehouseInboundCreate'), href: '/warehouse/inbound/create' },
        { title: t('sidebar.warehouseInboundProcess'), href: '/warehouse/inbound/process' },
        { title: t('sidebar.warehouseInboundList'), href: '/warehouse/inbound/list' },
      ]),
    };

    const subcontractingReceiptModule: NavItem = {
      title: t('sidebar.subcontractingReceiptCreate'),
      children: sortNavItems([
        { title: t('sidebar.subcontractingReceiptAssigned'), href: '/subcontracting/receipt/assigned' },
        { title: t('sidebar.subcontractingReceiptApproval'), href: '/subcontracting/receipt/approval' },
        { title: t('sidebar.subcontractingReceiptCreate'), href: '/subcontracting/receipt/create' },
        { title: t('sidebar.subcontractingReceiptProcess'), href: '/subcontracting/receipt/process' },
        { title: t('sidebar.subcontractingReceiptList'), href: '/subcontracting/receipt/list' },
      ]),
    };

    const transferModule: NavItem = {
      title: t('sidebar.transfer'),
      children: sortNavItems([
        { title: t('sidebar.transferAssigned'), href: '/transfer/assigned' },
        { title: t('sidebar.transferApproval'), href: '/transfer/approval' },
        { title: t('sidebar.transferCreate'), href: '/transfer/create' },
        { title: t('sidebar.transferProcess'), href: '/transfer/process' },
        { title: t('sidebar.transferList'), href: '/transfer/list' },
      ]),
    };

    const subcontractingIssueModule: NavItem = {
      title: t('sidebar.subcontractingIssueCreate'),
      children: sortNavItems([
        { title: t('sidebar.subcontractingIssueAssigned'), href: '/subcontracting/issue/assigned' },
        { title: t('sidebar.subcontractingIssueApproval'), href: '/subcontracting/issue/approval' },
        { title: t('sidebar.subcontractingIssueCreate'), href: '/subcontracting/issue/create' },
        { title: t('sidebar.subcontractingIssueProcess'), href: '/subcontracting/issue/process' },
        { title: t('sidebar.subcontractingIssueList'), href: '/subcontracting/issue/list' },
      ]),
    };

    const productionModule: NavItem = {
      title: t('sidebar.production'),
      children: sortNavItems([
        {
          title: t('sidebar.productionPlanningGroup'),
          children: sortNavItems([
            { title: t('sidebar.productionCreate'), href: '/production/create' },
            { title: t('sidebar.productionAssigned'), href: '/production/assigned' },
            { title: t('sidebar.productionApproval'), href: '/production/approval' },
            { title: t('sidebar.productionList'), href: '/production/list' },
          ]),
        },
      ]),
    };

    const productionTransferModule: NavItem = {
      title: t('sidebar.productionTransfer'),
      children: sortNavItems([
        { title: t('sidebar.productionTransferApproval'), href: '/production-transfer/approval' },
        { title: t('sidebar.productionTransferCreate'), href: '/production-transfer/create' },
        { title: t('sidebar.productionTransferList'), href: '/production-transfer/list' },
      ]),
    };

    const warehouseOutboundModule: NavItem = {
      title: t('sidebar.warehouseOutboundCreate'),
      children: sortNavItems([
        { title: t('sidebar.warehouseOutboundAssigned'), href: '/warehouse/outbound/assigned' },
        { title: t('sidebar.warehouseOutboundApproval'), href: '/warehouse/outbound/approval' },
        { title: t('sidebar.warehouseOutboundCreate'), href: '/warehouse/outbound/create' },
        { title: t('sidebar.warehouseOutboundProcess'), href: '/warehouse/outbound/process' },
        { title: t('sidebar.warehouseOutboundList'), href: '/warehouse/outbound/list' },
      ]),
    };

	    const shipmentModule: NavItem = {
	      title: t('sidebar.shipment'),
	      children: sortNavItems([
	        { title: t('sidebar.shipmentAssigned'), href: '/shipment/assigned' },
	        { title: t('sidebar.shipmentApproval'), href: '/shipment/approval' },
	        { title: t('sidebar.shipmentCreate'), href: '/shipment/create' },
	        { title: t('sidebar.shipmentProcess'), href: '/shipment/process' },
	        { title: t('sidebar.shipmentList'), href: '/shipment/list' },
	      ]),
	    };

    const serviceAllocationModule: NavItem = {
      title: t('sidebar.serviceAllocation'),
      children: sortNavItems([
        { title: t('sidebar.serviceAllocationAllocationQueue'), href: '/service-allocation/allocation-queue' },
        { title: t('sidebar.serviceAllocationCreate'), href: '/service-allocation/cases/new' },
        { title: t('sidebar.serviceAllocationCases'), href: '/service-allocation/cases' },
        { title: t('sidebar.serviceAllocationDocumentLinks'), href: '/service-allocation/document-links' },
        { title: t('sidebar.serviceAllocationReports'), href: '/service-allocation/reports' },
      ]),
    };

    const kkdModule: NavItem = {
      title: t('sidebar.kkd'),
      children: sortNavItems([
        {
          title: t('sidebar.kkdOperationsGroup'),
          children: sortNavItems([
            { title: t('sidebar.kkdOverview'), href: '/kkd' },
            { title: t('sidebar.kkdDistribution'), href: '/kkd/distribution' },
            { title: t('sidebar.kkdDistributionList'), href: '/kkd/distribution-list' },
          ]),
        },
        {
          title: t('sidebar.kkdMonitoringGroup'),
          children: sortNavItems([
            { title: t('sidebar.kkdRemainingEntitlements'), href: '/kkd/remaining-entitlements' },
            { title: t('sidebar.kkdEntitlementCheck'), href: '/kkd/entitlement-check' },
            { title: t('sidebar.kkdValidationLogs'), href: '/kkd/validation-logs' },
            {
              title: t('sidebar.kkdReportsGroup'),
              children: sortNavItems([
                { title: t('sidebar.kkdDepartmentReport'), href: '/kkd/reports/departments' },
                { title: t('sidebar.kkdRoleReport'), href: '/kkd/reports/roles' },
                { title: t('sidebar.kkdGroupReport'), href: '/kkd/reports/groups' },
              ]),
            },
          ]),
        },
      ]),
    };

    const packageModule: NavItem = {
      title: t('sidebar.package'),
      children: sortNavItems([
        { title: t('sidebar.packageCreate'), href: '/package/create' },
        { title: t('sidebar.packageList'), href: '/package/list' },
      ]),
    };

    const inventoryModule: NavItem = {
      title: t('sidebar.inventory'),
      children: sortNavItems([
        {
          title: t('sidebar.inventoryCount'),
          children: sortNavItems([
            { title: t('sidebar.inventoryCountCreate'), href: '/inventory-count/create' },
            { title: t('sidebar.inventoryCountAssigned'), href: '/inventory-count/assigned' },
            { title: t('sidebar.inventoryCountProcess'), href: '/inventory-count/process' },
            { title: t('sidebar.inventoryCountList'), href: '/inventory-count/list' },
          ]),
        },
        { title: t('sidebar.warehouse3d'), href: '/inventory/3d-warehouse' },
        { title: t('sidebar.warehouse3dOutside'), href: '/inventory/3d-outside-warehouse' },
      ]),
    };

    const reportsModule: NavItem = {
      title: t('sidebar.reports'),
      children: [{ title: t('sidebar.reports'), href: '/reports' }],
    };

    const erpModule: NavItem = {
      title: t('sidebar.erp'),
      children: sortNavItems([
        { title: t('sidebar.erpCustomers'), href: '/erp/customers' },
        { title: t('sidebar.erpStocks'), href: '/erp/stocks' },
        { title: t('sidebar.erpWarehouses'), href: '/erp/warehouses' },
        { title: t('sidebar.erpShelves', { defaultValue: 'Raf / Hucre Tanimlari' }), href: '/erp/shelves' },
        { title: t('sidebar.erpWarehouseStockBalance', { defaultValue: 'Depo Stok Bakiyesi' }), href: '/erp/warehouse-stock-balance' },
        { title: t('sidebar.erpWarehouseSerialBalance', { defaultValue: 'Depo Seri Bakiyesi' }), href: '/erp/warehouse-serial-balance' },
        { title: t('sidebar.erpYapKodlar'), href: '/erp/yapkodlar' },
        { title: t('sidebar.erpBarcodeDefinitions'), href: '/erp/barcodes' },
        {
          title: t('sidebar.erpBarcodeDesigner'),
          children: sortNavItems([
            { title: t('sidebar.erpBarcodeDesignerList'), href: '/erp/barcode-designer' },
            { title: t('sidebar.erpBarcodeDesignerCreate'), href: '/erp/barcode-designer/new' },
            { title: t('sidebar.erpPrinterManagement'), href: '/erp/printer-management' },
          ]),
        },
        {
          title: t('sidebar.kkd'),
          children: sortNavItems([
            {
              title: t('sidebar.kkdOrganizationGroup'),
              children: sortNavItems([
                { title: t('sidebar.kkdDepartments'), href: '/erp/kkd/departments' },
                { title: t('sidebar.kkdRoles'), href: '/erp/kkd/roles' },
                { title: t('sidebar.kkdEmployees'), href: '/erp/kkd/employees' },
              ]),
            },
            {
              title: t('sidebar.kkdRulesGroup'),
              children: sortNavItems([
                { title: t('sidebar.kkdEntitlements'), href: '/erp/kkd/entitlement-matrix' },
                { title: t('sidebar.kkdAdditionalEntitlements'), href: '/erp/kkd/manual-overrides' },
              ]),
            },
          ]),
        },
      ]),
    };

    const parametersModule: NavItem = {
      title: t('sidebar.parameters'),
      children: sortNavItems([
        { title: t('sidebar.parametersGr'), href: '/parameters/gr' },
        { title: t('sidebar.parametersWt'), href: '/parameters/wt' },
        { title: t('sidebar.parametersWo'), href: '/parameters/wo' },
        { title: t('sidebar.parametersWi'), href: '/parameters/wi' },
        { title: t('sidebar.parametersSh'), href: '/parameters/sh' },
        { title: t('sidebar.parametersSrt'), href: '/parameters/srt' },
        { title: t('sidebar.parametersSit'), href: '/parameters/sit' },
        { title: t('sidebar.parametersPt'), href: '/parameters/pt' },
        { title: t('sidebar.parametersPr'), href: '/parameters/pr' },
        { title: t('sidebar.parametersIc'), href: '/parameters/ic' },
        { title: t('sidebar.parametersP'), href: '/parameters/p' },
      ]),
    };

    const accessControlModule: NavItem = {
      title: t('sidebar.accessControl'),
      children: sortNavItems([
        {
          title: t('sidebar.accessControlManagementGroup'),
          children: sortNavItems([
            { title: t('sidebar.userManagement'), href: '/access-control/user-management' },
            { title: t('sidebar.userGroupAssignments'), href: '/access-control/user-group-assignments' },
            { title: t('sidebar.permissionGroups'), href: '/access-control/permission-groups' },
            { title: t('sidebar.permissionDefinitions'), href: '/access-control/permission-definitions' },
          ]),
        },
        {
          title: t('sidebar.accessControlSystemGroup'),
          children: sortNavItems([
            { title: t('sidebar.mailSettings'), href: '/users/mail-settings' },
            { title: t('sidebar.hangfireMonitoring'), href: '/hangfire-monitoring' },
          ]),
        },
      ]),
    };

    return [
      dashboardItem,
      {
        title: t('sidebar.operationsGroup'),
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
            <path d="M4 7h16" />
            <path d="M4 12h16" />
            <path d="M4 17h16" />
          </svg>
        ),
        children: sortNavItems([
          {
            title: t('sidebar.inboundOperationsGroup'),
            children: sortNavItems([goodsReceiptModule, warehouseInboundModule, subcontractingReceiptModule]),
          },
          {
            title: t('sidebar.transferOperationsGroup'),
            children: sortNavItems([transferModule, subcontractingIssueModule, productionTransferModule]),
          },
          {
            title: t('sidebar.outboundOperationsGroup'),
            children: sortNavItems([warehouseOutboundModule, shipmentModule, packageModule]),
          },
          {
            title: t('sidebar.serviceOperationsGroup'),
            children: sortNavItems([serviceAllocationModule, kkdModule]),
          },
          {
            title: t('sidebar.productionOperationsGroup'),
            children: sortNavItems([productionModule]),
          },
        ]),
      },
      {
        title: t('sidebar.inventoryGroup'),
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
        children: sortNavItems([inventoryModule]),
      },
      {
        title: t('sidebar.analyticsGroup'),
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
        children: sortNavItems([reportsModule]),
      },
      {
        title: t('sidebar.masterDataGroup'),
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
            <ellipse cx="12" cy="5" rx="9" ry="3" />
            <path d="M3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5" />
            <path d="M3 12c0 1.7 4 3 9 3s9-1.3 9-3" />
          </svg>
        ),
        children: sortNavItems([erpModule, parametersModule]),
      },
      {
        title: t('sidebar.systemGroup'),
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
        children: sortNavItems([accessControlModule]),
      },
    ];
  }, [t]);

  const sortedNavItems = useMemo(() => defaultNavItems, [defaultNavItems]);

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
