export const ROUTE_PERMISSION_MAP: Record<string, string> = {
  '/dashboard': 'dashboard.view',
  '/goods-receipt/create': 'wms.goods-receipt.create',
  '/goods-receipt/approval': 'wms.goods-receipt.update',
  '/goods-receipt/list': 'wms.goods-receipt.view',
  '/goods-receipt/assigned': 'wms.goods-receipt.view',
  '/transfer/create': 'wms.transfer.create',
  '/transfer/list': 'wms.transfer.view',
  '/transfer/assigned': 'wms.transfer.view',
  '/transfer/approval': 'wms.transfer.update',
  '/subcontracting/issue/create': 'wms.subcontracting.issue.create',
  '/subcontracting/issue/process': 'wms.subcontracting.issue.create',
  '/subcontracting/issue/list': 'wms.subcontracting.issue.view',
  '/subcontracting/issue/assigned': 'wms.subcontracting.issue.view',
  '/subcontracting/issue/approval': 'wms.subcontracting.issue.update',
  '/subcontracting/receipt/create': 'wms.subcontracting.receipt.create',
  '/subcontracting/receipt/process': 'wms.subcontracting.receipt.create',
  '/subcontracting/receipt/list': 'wms.subcontracting.receipt.view',
  '/subcontracting/receipt/assigned': 'wms.subcontracting.receipt.view',
  '/subcontracting/receipt/approval': 'wms.subcontracting.receipt.update',
  '/warehouse/inbound/create': 'wms.warehouse.inbound.create',
  '/warehouse/inbound/list': 'wms.warehouse.inbound.view',
  '/warehouse/inbound/assigned': 'wms.warehouse.inbound.view',
  '/warehouse/inbound/approval': 'wms.warehouse.inbound.update',
  '/warehouse/outbound/create': 'wms.warehouse.outbound.create',
  '/warehouse/outbound/process': 'wms.warehouse.outbound.create',
  '/warehouse/outbound/list': 'wms.warehouse.outbound.view',
  '/warehouse/outbound/assigned': 'wms.warehouse.outbound.view',
  '/warehouse/outbound/approval': 'wms.warehouse.outbound.update',
  '/shipment/create': 'wms.shipment.create',
  '/shipment/process': 'wms.shipment.create',
  '/shipment/list': 'wms.shipment.view',
  '/shipment/assigned': 'wms.shipment.view',
  '/shipment/approval': 'wms.shipment.update',
  '/service-allocation/allocation-queue': 'wms.service-allocation.view',
  '/service-allocation/cases/new': 'wms.service-allocation.create',
  '/service-allocation/cases': 'wms.service-allocation.view',
  '/service-allocation/cases/:id/edit': 'wms.service-allocation.update',
  '/service-allocation/document-links': 'wms.service-allocation.view',
  '/service-allocation/reports': 'wms.service-allocation.view',
  '/production/create': 'wms.production.create',
  '/production/detail': 'wms.production.view',
  '/production/process': 'wms.production.view',
  '/production/assigned': 'wms.production.view',
  '/production/approval': 'wms.production.update',
  '/production/list': 'wms.production.view',
  '/production-transfer/create': 'wms.production-transfer.create',
  '/production-transfer/detail': 'wms.production-transfer.view',
  '/production-transfer/approval': 'wms.production-transfer.update',
  '/production-transfer/list': 'wms.production-transfer.view',
  '/inventory-count/create': 'wms.inventory-count.create',
  '/inventory-count/process': 'wms.inventory-count.update',
  '/inventory-count/list': 'wms.inventory-count.view',
  '/inventory-count/assigned': 'wms.inventory-count.view',
  '/inventory/3d-warehouse': 'wms.inventory-count.view',
  '/inventory/3d-outside-warehouse': 'wms.inventory-count.view',
  '/reports': 'wms.reports.view',
  '/parameters/gr': 'wms.parameters.gr.view',
  '/parameters/wt': 'wms.parameters.wt.view',
  '/parameters/wo': 'wms.parameters.wo.view',
  '/parameters/wi': 'wms.parameters.wi.view',
  '/parameters/sh': 'wms.parameters.sh.view',
  '/parameters/srt': 'wms.parameters.srt.view',
  '/parameters/sit': 'wms.parameters.sit.view',
  '/parameters/pt': 'wms.parameters.pt.view',
  '/parameters/pr': 'wms.parameters.pr.view',
  '/parameters/ic': 'wms.parameters.ic.view',
  '/parameters/p': 'wms.parameters.p.view',
  '/package/create': 'wms.package.create',
  '/package/edit/:id': 'wms.package.update',
  '/package/detail/:id': 'wms.package.view',
  '/package/package-detail/:id': 'wms.package.view',
  '/package/list': 'wms.package.view',
  '/access-control/user-management': 'access-control.user-management.view',
  '/access-control/permission-definitions': 'access-control.permission-definitions.view',
  '/access-control/permission-groups': 'access-control.permission-groups.view',
  '/access-control/user-group-assignments': 'access-control.user-group-assignments.view',
  '/users/mail-settings': 'access-control.mail-settings.view',
  '/hangfire-monitoring': 'access-control.hangfire-monitoring.view',
  '/erp/customers': 'wms.print-management.view',
  '/erp/stocks': 'wms.print-management.view',
  '/erp/warehouses': 'wms.print-management.view',
  '/erp/yapkodlar': 'wms.print-management.view',
  '/erp/barcodes': 'wms.print-management.view',
  '/erp/barcode-designer': 'wms.print-management.view',
  '/erp/barcode-designer/new': 'wms.print-management.create',
  '/erp/barcode-designer/:id/edit': 'wms.print-management.update',
  '/erp/barcode-designer/:id/print': 'wms.print-management.view',
  '/erp/printer-management': 'wms.print-management.view',
};

export const PATH_TO_PERMISSION_PATTERNS: Array<{ pattern: RegExp; permission: string }> = [
  { pattern: /^\/dashboard(\/|$)/, permission: 'dashboard.view' },
  { pattern: /^\/goods-receipt\/create(\/|$)/, permission: 'wms.goods-receipt.create' },
  { pattern: /^\/goods-receipt\/approval(\/|$)/, permission: 'wms.goods-receipt.update' },
  { pattern: /^\/goods-receipt(\/|$)/, permission: 'wms.goods-receipt.view' },
  { pattern: /^\/transfer\/create(\/|$)/, permission: 'wms.transfer.create' },
  { pattern: /^\/transfer\/approval(\/|$)/, permission: 'wms.transfer.update' },
  { pattern: /^\/transfer(\/|$)/, permission: 'wms.transfer.view' },
  { pattern: /^\/subcontracting\/issue\/create(\/|$)/, permission: 'wms.subcontracting.issue.create' },
  { pattern: /^\/subcontracting\/issue\/process(\/|$)/, permission: 'wms.subcontracting.issue.create' },
  { pattern: /^\/subcontracting\/issue\/approval(\/|$)/, permission: 'wms.subcontracting.issue.update' },
  { pattern: /^\/subcontracting\/issue(\/|$)/, permission: 'wms.subcontracting.issue.view' },
  { pattern: /^\/subcontracting\/receipt\/create(\/|$)/, permission: 'wms.subcontracting.receipt.create' },
  { pattern: /^\/subcontracting\/receipt\/process(\/|$)/, permission: 'wms.subcontracting.receipt.create' },
  { pattern: /^\/subcontracting\/receipt\/approval(\/|$)/, permission: 'wms.subcontracting.receipt.update' },
  { pattern: /^\/subcontracting\/receipt(\/|$)/, permission: 'wms.subcontracting.receipt.view' },
  { pattern: /^\/warehouse\/inbound\/create(\/|$)/, permission: 'wms.warehouse.inbound.create' },
  { pattern: /^\/warehouse\/inbound\/approval(\/|$)/, permission: 'wms.warehouse.inbound.update' },
  { pattern: /^\/warehouse\/inbound(\/|$)/, permission: 'wms.warehouse.inbound.view' },
  { pattern: /^\/warehouse\/outbound\/create(\/|$)/, permission: 'wms.warehouse.outbound.create' },
  { pattern: /^\/warehouse\/outbound\/process(\/|$)/, permission: 'wms.warehouse.outbound.create' },
  { pattern: /^\/warehouse\/outbound\/approval(\/|$)/, permission: 'wms.warehouse.outbound.update' },
  { pattern: /^\/warehouse\/outbound(\/|$)/, permission: 'wms.warehouse.outbound.view' },
  { pattern: /^\/shipment\/create(\/|$)/, permission: 'wms.shipment.create' },
  { pattern: /^\/shipment\/process(\/|$)/, permission: 'wms.shipment.create' },
  { pattern: /^\/shipment\/approval(\/|$)/, permission: 'wms.shipment.update' },
  { pattern: /^\/shipment(\/|$)/, permission: 'wms.shipment.view' },
  { pattern: /^\/service-allocation\/cases\/new(\/|$)/, permission: 'wms.service-allocation.create' },
  { pattern: /^\/service-allocation\/cases\/\d+\/edit(\/|$)/, permission: 'wms.service-allocation.update' },
  { pattern: /^\/service-allocation(\/|$)/, permission: 'wms.service-allocation.view' },
  { pattern: /^\/production\/create(\/|$)/, permission: 'wms.production.create' },
  { pattern: /^\/production\/approval(\/|$)/, permission: 'wms.production.update' },
  { pattern: /^\/production(\/|$)/, permission: 'wms.production.view' },
  { pattern: /^\/production-transfer\/create(\/|$)/, permission: 'wms.production-transfer.create' },
  { pattern: /^\/production-transfer\/approval(\/|$)/, permission: 'wms.production-transfer.update' },
  { pattern: /^\/production-transfer(\/|$)/, permission: 'wms.production-transfer.view' },
  { pattern: /^\/inventory-count\/create(\/|$)/, permission: 'wms.inventory-count.create' },
  { pattern: /^\/inventory-count\/process(\/|$)/, permission: 'wms.inventory-count.update' },
  { pattern: /^\/inventory-count(\/|$)/, permission: 'wms.inventory-count.view' },
  { pattern: /^\/inventory(\/|$)/, permission: 'wms.inventory-count.view' },
  { pattern: /^\/reports(\/|$)/, permission: 'wms.reports.view' },
  { pattern: /^\/parameters(\/|$)/, permission: 'wms.parameters.gr.view' },
  { pattern: /^\/package\/create(\/|$)/, permission: 'wms.package.create' },
  { pattern: /^\/package\/edit\/\d+(\/|$)/, permission: 'wms.package.update' },
  { pattern: /^\/package(\/|$)/, permission: 'wms.package.view' },
  { pattern: /^\/access-control\/user-management(\/|$)/, permission: 'access-control.user-management.view' },
  { pattern: /^\/access-control\/permission-definitions(\/|$)/, permission: 'access-control.permission-definitions.view' },
  { pattern: /^\/access-control\/permission-groups(\/|$)/, permission: 'access-control.permission-groups.view' },
  { pattern: /^\/access-control\/user-group-assignments(\/|$)/, permission: 'access-control.user-group-assignments.view' },
  { pattern: /^\/users\/mail-settings(\/|$)/, permission: 'access-control.mail-settings.view' },
  { pattern: /^\/hangfire-monitoring(\/|$)/, permission: 'access-control.hangfire-monitoring.view' },
  { pattern: /^\/erp\/customers(\/|$)/, permission: 'wms.print-management.view' },
  { pattern: /^\/erp\/stocks(\/|$)/, permission: 'wms.print-management.view' },
  { pattern: /^\/erp\/warehouses(\/|$)/, permission: 'wms.print-management.view' },
  { pattern: /^\/erp\/yapkodlar(\/|$)/, permission: 'wms.print-management.view' },
  { pattern: /^\/erp\/barcodes(\/|$)/, permission: 'wms.print-management.view' },
  { pattern: /^\/erp\/barcode-designer\/new(\/|$)/, permission: 'wms.print-management.create' },
  { pattern: /^\/erp\/barcode-designer\/\d+\/edit(\/|$)/, permission: 'wms.print-management.update' },
  { pattern: /^\/erp\/barcode-designer\/\d+\/print(\/|$)/, permission: 'wms.print-management.view' },
  { pattern: /^\/erp\/barcode-designer(\/|$)/, permission: 'wms.print-management.view' },
  { pattern: /^\/erp\/printer-management(\/|$)/, permission: 'wms.print-management.view' },
];

const PERMISSION_ACTIONS = ['view', 'create', 'update', 'delete'] as const;

type PermissionAction = (typeof PERMISSION_ACTIONS)[number];
type PermissionScopeDisplay = { key: string; fallback: string };

export function isLeafPermissionCode(code: string): boolean {
  if (code === 'dashboard.view' || code === 'wms.reports.view') return true;
  const parts = code.split('.').filter(Boolean);
  const last = parts[parts.length - 1];
  return !!last && PERMISSION_ACTIONS.includes(last as PermissionAction);
}

export const ACCESS_CONTROL_ADMIN_PERMISSIONS = [
  'access-control.permission-definitions.view',
  'access-control.permission-groups.view',
  'access-control.user-management.view',
  'access-control.user-group-assignments.view',
] as const;

export const RBAC_FALLBACK_PERMISSION = 'access-control.permission-definitions.view' as const;

export const ACCESS_CONTROL_ADMIN_FALLBACK_TO_SYSTEM_ADMIN = true as const;

export const ACCESS_CONTROL_ADMIN_ONLY_PATTERNS: RegExp[] = [];

export const PERMISSION_CODE_ALIASES: Record<string, string[]> = {
  'access-control.user-group-assignments.view': ['access-control.user-management.view'],
  'access-control.user-group-assignments.update': ['access-control.user-management.update'],
};

export const PERMISSION_SCOPE_DISPLAY: Record<string, PermissionScopeDisplay> = {
  dashboard: { key: 'sidebar.dashboard', fallback: 'Dashboard' },
  'wms.goods-receipt': { key: 'sidebar.goodsReceipt', fallback: 'Mal Kabul' },
  'wms.transfer': { key: 'sidebar.transfer', fallback: 'Transfer' },
  'wms.subcontracting.issue': { key: 'sidebar.subcontractingIssueCreate', fallback: 'Fason Çıkış' },
  'wms.subcontracting.receipt': { key: 'sidebar.subcontractingReceiptCreate', fallback: 'Fason Giriş' },
  'wms.warehouse.inbound': { key: 'sidebar.warehouseInboundCreate', fallback: 'Ambar Giriş' },
  'wms.warehouse.outbound': { key: 'sidebar.warehouseOutboundCreate', fallback: 'Ambar Çıkış' },
  'wms.shipment': { key: 'sidebar.shipment', fallback: 'Sevkiyat' },
  'wms.service-allocation': { key: 'sidebar.serviceAllocation', fallback: 'Servis ve Hakediş' },
  'wms.production': { key: 'sidebar.production', fallback: 'Üretim' },
  'wms.production-transfer': { key: 'sidebar.productionTransfer', fallback: 'Üretim Transferi' },
  'wms.package': { key: 'sidebar.package', fallback: 'Paketleme' },
  'wms.print-management': { key: 'sidebar.erpPrinterManagement', fallback: 'Yazıcılar ve Baskı İşleri' },
  'wms.inventory-count': { key: 'sidebar.inventoryCount', fallback: 'Sayım' },
  'wms.reports': { key: 'sidebar.reports', fallback: 'Raporlar' },
  'wms.parameters.gr': { key: 'sidebar.parametersGr', fallback: 'Mal Kabul Parametreleri' },
  'wms.parameters.wt': { key: 'sidebar.parametersWt', fallback: 'Transfer Parametreleri' },
  'wms.parameters.wo': { key: 'sidebar.parametersWo', fallback: 'Depo Çıkış Parametreleri' },
  'wms.parameters.wi': { key: 'sidebar.parametersWi', fallback: 'Depo Giriş Parametreleri' },
  'wms.parameters.sh': { key: 'sidebar.parametersSh', fallback: 'Sevkiyat Parametreleri' },
  'wms.parameters.srt': { key: 'sidebar.parametersSrt', fallback: 'Taşeron Giriş Parametreleri' },
  'wms.parameters.sit': { key: 'sidebar.parametersSit', fallback: 'Taşeron Çıkış Parametreleri' },
  'wms.parameters.pt': { key: 'sidebar.parametersPt', fallback: 'Üretim Transfer Parametreleri' },
  'wms.parameters.pr': { key: 'sidebar.parametersPr', fallback: 'Üretim Parametreleri' },
  'wms.parameters.ic': { key: 'sidebar.parametersIc', fallback: 'Sayım Parametreleri' },
  'wms.parameters.p': { key: 'sidebar.parametersP', fallback: 'Paket Parametreleri' },
  'access-control.user-management': { key: 'sidebar.userManagement', fallback: 'Kullanıcı Yönetimi' },
  'access-control.permission-definitions': { key: 'sidebar.permissionDefinitions', fallback: 'İzin Tanımları' },
  'access-control.permission-groups': { key: 'sidebar.permissionGroups', fallback: 'İzin Grupları' },
  'access-control.user-group-assignments': { key: 'sidebar.userGroupAssignments', fallback: 'Kullanıcı Grup Atamaları' },
  'access-control.mail-settings': { key: 'sidebar.mailSettings', fallback: 'Mail Ayarları' },
  'access-control.hangfire-monitoring': { key: 'sidebar.hangfireMonitoring', fallback: 'Hangfire İzleme' },
};

const ACTION_FALLBACKS: Record<PermissionAction, string> = {
  view: 'Görüntüle',
  create: 'Oluştur',
  update: 'Güncelle',
  delete: 'Sil',
};

function buildCrudPermissionDisplay(
  scope: string,
  meta: PermissionScopeDisplay,
): Record<string, PermissionScopeDisplay> {
  return Object.fromEntries(
    PERMISSION_ACTIONS.map((action) => [
      `${scope}.${action}`,
      {
        key: meta.key,
        fallback: `${meta.fallback} ${ACTION_FALLBACKS[action]}`,
      },
    ]),
  );
}

const CRUD_SCOPE_CODES = Object.keys(PERMISSION_SCOPE_DISPLAY).filter(
  (scope) => scope !== 'dashboard' && scope !== 'wms.reports',
);

export const PERMISSION_CODE_DISPLAY: Record<string, PermissionScopeDisplay> = {
  'dashboard.view': { key: 'sidebar.dashboard', fallback: 'Dashboard' },
  'wms.reports.view': { key: 'sidebar.reports', fallback: 'Raporları Görüntüle' },
  ...Object.fromEntries(
    CRUD_SCOPE_CODES.flatMap((scope) => Object.entries(buildCrudPermissionDisplay(scope, PERMISSION_SCOPE_DISPLAY[scope]))),
  ),
};

export function getPermissionDisplayMeta(code: string): { key: string; fallback: string } | null {
  return PERMISSION_CODE_DISPLAY[code] ?? null;
}

export function getPermissionScope(code: string): string {
  const parts = code.split('.').filter(Boolean);
  const last = parts[parts.length - 1];
  if (last && PERMISSION_ACTIONS.includes(last as PermissionAction)) {
    return parts.slice(0, -1).join('.');
  }
  return code;
}

export function getPermissionScopeDisplayMeta(scope: string): { key: string; fallback: string } | null {
  return PERMISSION_SCOPE_DISPLAY[scope] ?? null;
}

export function getPermissionModuleDisplayMeta(prefix: string): { key: string; fallback: string } | null {
  if (prefix === 'access-control') {
    return { key: 'sidebar.accessControl', fallback: 'Access Control' };
  }
  if (prefix === 'wms') {
    return { key: 'sidebar.dashboard', fallback: 'WMS' };
  }
  if (prefix === 'dashboard') {
    return { key: 'sidebar.dashboard', fallback: 'Dashboard' };
  }
  return null;
}

export function getPermissionActionLabel(code: string): { key: string; fallback: string } {
  const parts = code.split('.').filter(Boolean);
  const action = parts[parts.length - 1];
  switch (action) {
    case 'create':
      return { key: 'common.create', fallback: 'Create' };
    case 'update':
      return { key: 'common.update', fallback: 'Update' };
    case 'delete':
      return { key: 'common.delete', fallback: 'Delete' };
    case 'view':
    default:
      return { key: 'common.view', fallback: 'View' };
  }
}

export const PERMISSION_CODE_CATALOG: string[] = Array.from(
  new Set(
    [...Object.values(ROUTE_PERMISSION_MAP), ...Object.keys(PERMISSION_CODE_DISPLAY)]
      .filter((code) => code && code !== 'admin-only')
      .map((code) => code.trim())
  )
).sort((a, b) => a.localeCompare(b));

export function getRoutesForPermissionCode(code: string): string[] {
  return Object.entries(ROUTE_PERMISSION_MAP)
    .filter(([, permission]) => permission === code)
    .map(([route]) => route)
    .sort((a, b) => a.localeCompare(b));
}
