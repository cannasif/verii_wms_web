import type { ReactElement } from 'react';

export interface NavItem {
  title: string;
  titleFallback?: string;
  href?: string;
  icon?: ReactElement;
  children?: NavItem[];
}

const dashboardIcon = (
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
);

const operationsIcon = (
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
);

const inventoryIcon = (
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
);

const analyticsIcon = (
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
);

const masterDataIcon = (
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
);

const systemIcon = (
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
);

export const WMS_NAV_ITEMS: NavItem[] = [
  {
    title: 'sidebar.dashboard',
    titleFallback: 'Dashboard',
    href: '/dashboard',
    icon: dashboardIcon,
  },
  {
    title: 'sidebar.operationsGroup',
    titleFallback: 'Operasyonlar',
    icon: operationsIcon,
    children: [
      {
        title: 'sidebar.inboundOperationsGroup',
        titleFallback: 'Giriş Operasyonları',
        children: [
          {
            title: 'sidebar.goodsReceipt',
            titleFallback: 'Mal Kabul',
            children: [
              { title: 'sidebar.goodsReceiptAssigned', titleFallback: 'Mal Kabul Atananlar', href: '/goods-receipt/assigned' },
              { title: 'sidebar.goodsReceiptApproval', titleFallback: 'Mal Kabul Onay', href: '/goods-receipt/approval' },
              { title: 'sidebar.goodsReceiptCreate', titleFallback: 'Mal Kabul Oluştur', href: '/goods-receipt/create' },
              { title: 'sidebar.goodsReceiptProcess', titleFallback: 'Mal Kabul İşlem', href: '/goods-receipt/process' },
              { title: 'sidebar.goodsReceiptList', titleFallback: 'Mal Kabul Listesi', href: '/goods-receipt/list' },
            ],
          },
          {
            title: 'sidebar.warehouseInboundCreate',
            titleFallback: 'Depo Giriş',
            children: [
              { title: 'sidebar.warehouseInboundAssigned', titleFallback: 'Depo Giriş Atananlar', href: '/warehouse/inbound/assigned' },
              { title: 'sidebar.warehouseInboundApproval', titleFallback: 'Depo Giriş Onay', href: '/warehouse/inbound/approval' },
              { title: 'sidebar.warehouseInboundCreate', titleFallback: 'Depo Giriş Oluştur', href: '/warehouse/inbound/create' },
              { title: 'sidebar.warehouseInboundProcess', titleFallback: 'Depo Giriş İşlem', href: '/warehouse/inbound/process' },
              { title: 'sidebar.warehouseInboundList', titleFallback: 'Depo Giriş Listesi', href: '/warehouse/inbound/list' },
            ],
          },
          {
            title: 'sidebar.subcontractingReceiptCreate',
            titleFallback: 'Fason Giriş',
            children: [
              { title: 'sidebar.subcontractingReceiptAssigned', titleFallback: 'Fason Giriş Atananlar', href: '/subcontracting/receipt/assigned' },
              { title: 'sidebar.subcontractingReceiptApproval', titleFallback: 'Fason Giriş Onay', href: '/subcontracting/receipt/approval' },
              { title: 'sidebar.subcontractingReceiptCreate', titleFallback: 'Fason Giriş Oluştur', href: '/subcontracting/receipt/create' },
              { title: 'sidebar.subcontractingReceiptProcess', titleFallback: 'Fason Giriş İşlem', href: '/subcontracting/receipt/process' },
              { title: 'sidebar.subcontractingReceiptList', titleFallback: 'Fason Giriş Listesi', href: '/subcontracting/receipt/list' },
            ],
          },
        ],
      },
      {
        title: 'sidebar.transferOperationsGroup',
        titleFallback: 'Transfer Operasyonları',
        children: [
          {
            title: 'sidebar.transfer',
            titleFallback: 'Transfer',
            children: [
              { title: 'sidebar.transferAssigned', titleFallback: 'Transfer Atananlar', href: '/transfer/assigned' },
              { title: 'sidebar.transferApproval', titleFallback: 'Transfer Onay', href: '/transfer/approval' },
              { title: 'sidebar.transferCreate', titleFallback: 'Transfer Oluştur', href: '/transfer/create' },
              { title: 'sidebar.transferProcess', titleFallback: 'Transfer İşlem', href: '/transfer/process' },
              { title: 'sidebar.transferList', titleFallback: 'Transfer Listesi', href: '/transfer/list' },
            ],
          },
          {
            title: 'sidebar.subcontractingIssueCreate',
            titleFallback: 'Fason Çıkış',
            children: [
              { title: 'sidebar.subcontractingIssueAssigned', titleFallback: 'Fason Çıkış Atananlar', href: '/subcontracting/issue/assigned' },
              { title: 'sidebar.subcontractingIssueApproval', titleFallback: 'Fason Çıkış Onay', href: '/subcontracting/issue/approval' },
              { title: 'sidebar.subcontractingIssueCreate', titleFallback: 'Fason Çıkış Oluştur', href: '/subcontracting/issue/create' },
              { title: 'sidebar.subcontractingIssueProcess', titleFallback: 'Fason Çıkış İşlem', href: '/subcontracting/issue/process' },
              { title: 'sidebar.subcontractingIssueList', titleFallback: 'Fason Çıkış Listesi', href: '/subcontracting/issue/list' },
            ],
          },
          {
            title: 'sidebar.productionTransfer',
            titleFallback: 'Üretim Transfer',
            children: [
              { title: 'sidebar.productionTransferApproval', titleFallback: 'Üretim Transfer Onay', href: '/production-transfer/approval' },
              { title: 'sidebar.productionTransferCreate', titleFallback: 'Üretim Transfer Oluştur', href: '/production-transfer/create' },
              { title: 'sidebar.productionTransferList', titleFallback: 'Üretim Transfer Listesi', href: '/production-transfer/list' },
            ],
          },
        ],
      },
      {
        title: 'sidebar.outboundOperationsGroup',
        titleFallback: 'Çıkış Operasyonları',
        children: [
          {
            title: 'sidebar.warehouseOutboundCreate',
            titleFallback: 'Depo Çıkış',
            children: [
              { title: 'sidebar.warehouseOutboundAssigned', titleFallback: 'Depo Çıkış Atananlar', href: '/warehouse/outbound/assigned' },
              { title: 'sidebar.warehouseOutboundApproval', titleFallback: 'Depo Çıkış Onay', href: '/warehouse/outbound/approval' },
              { title: 'sidebar.warehouseOutboundCreate', titleFallback: 'Depo Çıkış Oluştur', href: '/warehouse/outbound/create' },
              { title: 'sidebar.warehouseOutboundProcess', titleFallback: 'Depo Çıkış İşlem', href: '/warehouse/outbound/process' },
              { title: 'sidebar.warehouseOutboundList', titleFallback: 'Depo Çıkış Listesi', href: '/warehouse/outbound/list' },
            ],
          },
          {
            title: 'sidebar.shipment',
            titleFallback: 'Sevkiyat',
            children: [
              { title: 'sidebar.shipmentAssigned', titleFallback: 'Sevkiyat Atananlar', href: '/shipment/assigned' },
              { title: 'sidebar.shipmentApproval', titleFallback: 'Sevkiyat Onay', href: '/shipment/approval' },
              { title: 'sidebar.shipmentCreate', titleFallback: 'Sevkiyat Oluştur', href: '/shipment/create' },
              { title: 'sidebar.shipmentProcess', titleFallback: 'Sevkiyat İşlem', href: '/shipment/process' },
              { title: 'sidebar.shipmentList', titleFallback: 'Sevkiyat Listesi', href: '/shipment/list' },
            ],
          },
          {
            title: 'sidebar.package',
            titleFallback: 'Paket',
            children: [
              { title: 'sidebar.packageCreate', titleFallback: 'Paket Oluştur', href: '/package/create' },
              { title: 'sidebar.packageList', titleFallback: 'Paket Listesi', href: '/package/list' },
            ],
          },
        ],
      },
      {
        title: 'sidebar.serviceOperationsGroup',
        titleFallback: 'Servis Operasyonları',
        children: [
          {
            title: 'sidebar.serviceAllocation',
            titleFallback: 'Servis Atama',
            children: [
              { title: 'sidebar.serviceAllocationAllocationQueue', titleFallback: 'Atama Kuyruğu', href: '/service-allocation/allocation-queue' },
              { title: 'sidebar.serviceAllocationCreate', titleFallback: 'Servis Kaydı Oluştur', href: '/service-allocation/cases/new' },
              { title: 'sidebar.serviceAllocationCases', titleFallback: 'Servis Kayıtları', href: '/service-allocation/cases' },
              { title: 'sidebar.serviceAllocationDocumentLinks', titleFallback: 'Belge Bağlantıları', href: '/service-allocation/document-links' },
              { title: 'sidebar.serviceAllocationReports', titleFallback: 'Servis Raporları', href: '/service-allocation/reports' },
            ],
          },
          {
            title: 'sidebar.kkd',
            titleFallback: 'KKD',
            children: [
              {
                title: 'sidebar.kkdOrganizationGroup',
                titleFallback: 'Organizasyon',
                children: [
                  { title: 'sidebar.kkdDepartments', titleFallback: 'KKD Bölümler', href: '/erp/kkd/departments' },
                  { title: 'sidebar.kkdRoles', titleFallback: 'KKD Görevler', href: '/erp/kkd/roles' },
                  { title: 'sidebar.kkdEmployees', titleFallback: 'KKD Çalışanlar', href: '/erp/kkd/employees' },
                ],
              },
              {
                title: 'sidebar.kkdRulesGroup',
                titleFallback: 'Hak ve İstisna Kuralları',
                children: [
                  { title: 'sidebar.kkdEntitlements', titleFallback: 'KKD Hak Matrisi', href: '/erp/kkd/entitlement-matrix' },
                  { title: 'sidebar.kkdAdditionalEntitlements', titleFallback: 'KKD Manuel İstisna', href: '/erp/kkd/manual-overrides' },
                ],
              },
              {
                title: 'sidebar.kkdOperationsGroup',
                titleFallback: 'Operasyon',
                children: [
                  { title: 'sidebar.kkdOverview', titleFallback: 'KKD Genel Bakış', href: '/kkd' },
                  { title: 'sidebar.kkdInitialOrder', titleFallback: 'KKD İlk Giriş', href: '/kkd/initial-order' },
                  { title: 'sidebar.kkdDistribution', titleFallback: 'KKD Dağıtım', href: '/kkd/distribution' },
                  { title: 'sidebar.kkdDistributionList', titleFallback: 'KKD Dağıtım Listesi', href: '/kkd/distribution-list' },
                ],
              },
              {
                title: 'sidebar.kkdMonitoringGroup',
                titleFallback: 'Sorgu ve İzleme',
                children: [
                  { title: 'sidebar.kkdRemainingEntitlements', titleFallback: 'Kalan Haklar', href: '/kkd/remaining-entitlements' },
                  { title: 'sidebar.kkdEntitlementCheck', titleFallback: 'Hak Sorgulama', href: '/kkd/entitlement-check' },
                  { title: 'sidebar.kkdValidationLogs', titleFallback: 'Validation Kayıtları', href: '/kkd/validation-logs' },
                  {
                    title: 'sidebar.kkdReportsGroup',
                    titleFallback: 'Raporlar',
                    children: [
                      { title: 'sidebar.kkdDepartmentReport', titleFallback: 'Bölüm Raporu', href: '/kkd/reports/departments' },
                      { title: 'sidebar.kkdRoleReport', titleFallback: 'Görev Raporu', href: '/kkd/reports/roles' },
                      { title: 'sidebar.kkdGroupReport', titleFallback: 'Grup Raporu', href: '/kkd/reports/groups' },
                    ],
                  },
                ],
              },
            ],
          },
          {
            title: 'sidebar.sacMalKabul',
            titleFallback: 'Sac Mal Kabul',
            children: [
              { title: 'sidebar.sacMalKabulVehicleCheckIn', titleFallback: 'Araç Kontrol', href: '/vehicle-check-in' },
              { title: 'sidebar.sacMalKabulVehicleCheckInList', titleFallback: 'Araç Kontrol Listesi', href: '/vehicle-check-in/list' },
              { title: 'sidebar.sacMalKabulImport', titleFallback: 'Excel Aktarım', href: '/sac-mal-kabul/import' },
              { title: 'sidebar.sacMalKabulList', titleFallback: 'Beklenen Levha Listesi', href: '/sac-mal-kabul/list' },
              { title: 'sidebar.sacMalKabulInspection', titleFallback: 'Kabul Kontrol', href: '/sac-mal-kabul/inspection' },
              { title: 'sidebar.sacMalKabulReceipt', titleFallback: 'Alış İrsaliyesi Oluşturma', href: '/sac-mal-kabul/receipt' },
              { title: 'sidebar.sacMalKabulPlacement', titleFallback: 'Yerleştirme', href: '/sac-mal-kabul/placement' },
            ],
          },
        ],
      },
      {
        title: 'sidebar.productionOperationsGroup',
        titleFallback: 'Üretim Operasyonları',
        children: [
          {
            title: 'sidebar.production',
            titleFallback: 'Üretim',
            children: [
              {
                title: 'sidebar.productionPlanningGroup',
                titleFallback: 'Üretim Planlama',
                children: [
                  { title: 'sidebar.productionCreate', titleFallback: 'Üretim Oluştur', href: '/production/create' },
                  { title: 'sidebar.productionAssigned', titleFallback: 'Üretim Atananlar', href: '/production/assigned' },
                  { title: 'sidebar.productionApproval', titleFallback: 'Üretim Onay', href: '/production/approval' },
                  { title: 'sidebar.productionList', titleFallback: 'Üretim Listesi', href: '/production/list' },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    title: 'sidebar.inventoryGroup',
    titleFallback: 'Envanter',
    icon: inventoryIcon,
    children: [
      {
        title: 'sidebar.inventory',
        titleFallback: 'Envanter',
        children: [
          {
            title: 'sidebar.inventoryCount',
            titleFallback: 'Sayım',
            children: [
              { title: 'sidebar.inventoryCountCreate', titleFallback: 'Sayım Oluştur', href: '/inventory-count/create' },
              { title: 'sidebar.inventoryCountAssigned', titleFallback: 'Sayım Atananlar', href: '/inventory-count/assigned' },
              { title: 'sidebar.inventoryCountProcess', titleFallback: 'Sayım İşlem', href: '/inventory-count/process' },
              { title: 'sidebar.inventoryCountList', titleFallback: 'Sayım Listesi', href: '/inventory-count/list' },
            ],
          },
          { title: 'sidebar.warehouse3d', titleFallback: '3D Depo', href: '/inventory/3d-warehouse' },
          { title: 'sidebar.warehouse3dOutside', titleFallback: '3D Dış Saha', href: '/inventory/3d-outside-warehouse' },
        ],
      },
    ],
  },
  {
    title: 'sidebar.analyticsGroup',
    titleFallback: 'Analitik',
    icon: analyticsIcon,
    children: [
      {
        title: 'sidebar.reports',
        titleFallback: 'Raporlar',
        children: [{ title: 'sidebar.reports', titleFallback: 'Raporlar', href: '/reports' }],
      },
    ],
  },
  {
    title: 'sidebar.masterDataGroup',
    titleFallback: 'Ana Veri ve Tanımlar',
    icon: masterDataIcon,
    children: [
      {
        title: 'sidebar.erp',
        titleFallback: 'ERP',
        children: [
          { title: 'sidebar.erpCustomers', titleFallback: 'Cariler', href: '/erp/customers' },
          { title: 'sidebar.erpStocks', titleFallback: 'Stoklar', href: '/erp/stocks' },
          { title: 'sidebar.erpWarehouses', titleFallback: 'Depolar', href: '/erp/warehouses' },
          { title: 'sidebar.erpShelves', titleFallback: 'Raf / Hücreler', href: '/erp/shelves' },
          { title: 'sidebar.erpWarehouseStockBalance', titleFallback: 'Depo Stok Bakiyesi', href: '/erp/warehouse-stock-balance' },
          { title: 'sidebar.erpWarehouseSerialBalance', titleFallback: 'Depo Seri Bakiyesi', href: '/erp/warehouse-serial-balance' },
          { title: 'sidebar.erpYapKodlar', titleFallback: 'YapKodlar', href: '/erp/yapkodlar' },
          { title: 'sidebar.erpBarcodeDefinitions', titleFallback: 'Barkod Tanımları', href: '/erp/barcodes' },
          {
            title: 'sidebar.erpBarcodeDesigner',
            titleFallback: 'Barkod Tasarımları',
            children: [
              { title: 'sidebar.erpBarcodeDesignerList', titleFallback: 'Barkod Tasarım Listesi', href: '/erp/barcode-designer' },
              { title: 'sidebar.erpBarcodeDesignerCreate', titleFallback: 'Barkod Tasarım Oluştur', href: '/erp/barcode-designer/new' },
              { title: 'sidebar.erpPrinterManagement', titleFallback: 'Yazıcı Yönetimi', href: '/erp/printer-management' },
            ],
          },
        ],
      },
      {
        title: 'sidebar.parameters',
        titleFallback: 'Parametreler',
        children: [
          { title: 'sidebar.parametersGr', titleFallback: 'GR', href: '/parameters/gr' },
          { title: 'sidebar.parametersWt', titleFallback: 'WT', href: '/parameters/wt' },
          { title: 'sidebar.parametersWo', titleFallback: 'WO', href: '/parameters/wo' },
          { title: 'sidebar.parametersWi', titleFallback: 'WI', href: '/parameters/wi' },
          { title: 'sidebar.parametersSh', titleFallback: 'SH', href: '/parameters/sh' },
          { title: 'sidebar.parametersSrt', titleFallback: 'SRT', href: '/parameters/srt' },
          { title: 'sidebar.parametersSit', titleFallback: 'SIT', href: '/parameters/sit' },
          { title: 'sidebar.parametersPt', titleFallback: 'PT', href: '/parameters/pt' },
          { title: 'sidebar.parametersPr', titleFallback: 'PR', href: '/parameters/pr' },
          { title: 'sidebar.parametersIc', titleFallback: 'IC', href: '/parameters/ic' },
          { title: 'sidebar.parametersP', titleFallback: 'P', href: '/parameters/p' },
        ],
      },
    ],
  },
  {
    title: 'sidebar.systemGroup',
    titleFallback: 'Sistem ve Yetki',
    icon: systemIcon,
    children: [
      {
        title: 'sidebar.accessControl',
        titleFallback: 'Sistem ve Yetki',
        children: [
          {
            title: 'sidebar.accessControlManagementGroup',
            titleFallback: 'Yetki ve Kullanıcı Yönetimi',
            children: [
              { title: 'sidebar.userManagement', titleFallback: 'Kullanıcı Yönetimi', href: '/access-control/user-management' },
              { title: 'sidebar.userGroupAssignments', titleFallback: 'Kullanıcı Grup Atamaları', href: '/access-control/user-group-assignments' },
              { title: 'sidebar.permissionGroups', titleFallback: 'Yetki Grupları', href: '/access-control/permission-groups' },
              { title: 'sidebar.permissionDefinitions', titleFallback: 'Yetki Tanımları', href: '/access-control/permission-definitions' },
            ],
          },
          {
            title: 'sidebar.accessControlSystemGroup',
            titleFallback: 'Sistem Araçları',
            children: [
              { title: 'sidebar.mailSettings', titleFallback: 'Mail Ayarları', href: '/users/mail-settings' },
              { title: 'sidebar.hangfireMonitoring', titleFallback: 'Hangfire İzleme', href: '/hangfire-monitoring' },
            ],
          },
        ],
      },
    ],
  },
];
