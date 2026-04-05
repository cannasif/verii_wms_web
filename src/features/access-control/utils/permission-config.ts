export const ROUTE_PERMISSION_MAP: Record<string, string> = {
  '/dashboard': 'dashboard.view',
  '/goods-receipt/create': 'wms.goods-receipt.create',
  '/goods-receipt/list': 'wms.goods-receipt.view',
  '/goods-receipt/assigned': 'wms.goods-receipt.view',
  '/transfer/create': 'wms.transfer.create',
  '/transfer/list': 'wms.transfer.view',
  '/transfer/assigned': 'wms.transfer.view',
  '/transfer/approval': 'wms.transfer.update',
  '/subcontracting/issue/create': 'wms.subcontracting.issue.create',
  '/subcontracting/issue/list': 'wms.subcontracting.issue.view',
  '/subcontracting/issue/assigned': 'wms.subcontracting.issue.view',
  '/subcontracting/issue/approval': 'wms.subcontracting.issue.update',
  '/subcontracting/receipt/create': 'wms.subcontracting.receipt.create',
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
  '/shipment/list': 'wms.shipment.view',
  '/shipment/assigned': 'wms.shipment.view',
  '/shipment/approval': 'wms.shipment.update',
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
  '/package/list': 'wms.package.view',
  '/access-control/user-management': 'access-control.user-management.view',
  '/access-control/permission-definitions': 'access-control.permission-definitions.view',
  '/access-control/permission-groups': 'access-control.permission-groups.view',
  '/access-control/user-group-assignments': 'access-control.user-management.view',
  '/users/mail-settings': 'access-control.mail-settings.view',
  '/hangfire-monitoring': 'access-control.hangfire-monitoring.view',
  '/erp/customers': 'access-control.hangfire-monitoring.view',
  '/erp/stocks': 'access-control.hangfire-monitoring.view',
  '/erp/warehouses': 'access-control.hangfire-monitoring.view',
  '/erp/yapkodlar': 'access-control.hangfire-monitoring.view',
};

export const PATH_TO_PERMISSION_PATTERNS: Array<{ pattern: RegExp; permission: string }> = [
  { pattern: /^\/dashboard(\/|$)/, permission: 'dashboard.view' },
  { pattern: /^\/goods-receipt\/create(\/|$)/, permission: 'wms.goods-receipt.create' },
  { pattern: /^\/goods-receipt(\/|$)/, permission: 'wms.goods-receipt.view' },
  { pattern: /^\/transfer\/create(\/|$)/, permission: 'wms.transfer.create' },
  { pattern: /^\/transfer\/approval(\/|$)/, permission: 'wms.transfer.update' },
  { pattern: /^\/transfer(\/|$)/, permission: 'wms.transfer.view' },
  { pattern: /^\/subcontracting\/issue\/create(\/|$)/, permission: 'wms.subcontracting.issue.create' },
  { pattern: /^\/subcontracting\/issue\/approval(\/|$)/, permission: 'wms.subcontracting.issue.update' },
  { pattern: /^\/subcontracting\/issue(\/|$)/, permission: 'wms.subcontracting.issue.view' },
  { pattern: /^\/subcontracting\/receipt\/create(\/|$)/, permission: 'wms.subcontracting.receipt.create' },
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
  { pattern: /^\/shipment\/approval(\/|$)/, permission: 'wms.shipment.update' },
  { pattern: /^\/shipment(\/|$)/, permission: 'wms.shipment.view' },
  { pattern: /^\/inventory(\/|$)/, permission: 'wms.inventory-count.view' },
  { pattern: /^\/reports(\/|$)/, permission: 'wms.reports.view' },
  { pattern: /^\/parameters(\/|$)/, permission: 'wms.parameters.gr.view' },
  { pattern: /^\/package\/create(\/|$)/, permission: 'wms.package.create' },
  { pattern: /^\/package(\/|$)/, permission: 'wms.package.view' },
  { pattern: /^\/access-control\/user-management(\/|$)/, permission: 'access-control.user-management.view' },
  { pattern: /^\/access-control\/permission-definitions(\/|$)/, permission: 'access-control.permission-definitions.view' },
  { pattern: /^\/access-control\/permission-groups(\/|$)/, permission: 'access-control.permission-groups.view' },
  { pattern: /^\/access-control\/user-group-assignments(\/|$)/, permission: 'access-control.user-management.view' },
  { pattern: /^\/users\/mail-settings(\/|$)/, permission: 'access-control.mail-settings.view' },
  { pattern: /^\/hangfire-monitoring(\/|$)/, permission: 'access-control.hangfire-monitoring.view' },
  { pattern: /^\/erp\/customers(\/|$)/, permission: 'access-control.hangfire-monitoring.view' },
  { pattern: /^\/erp\/stocks(\/|$)/, permission: 'access-control.hangfire-monitoring.view' },
  { pattern: /^\/erp\/warehouses(\/|$)/, permission: 'access-control.hangfire-monitoring.view' },
  { pattern: /^\/erp\/yapkodlar(\/|$)/, permission: 'access-control.hangfire-monitoring.view' },
];

const PERMISSION_ACTIONS = ['view', 'create', 'update'] as const;

type PermissionAction = (typeof PERMISSION_ACTIONS)[number];

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
] as const;

export const RBAC_FALLBACK_PERMISSION = 'access-control.permission-definitions.view' as const;

export const ACCESS_CONTROL_ADMIN_FALLBACK_TO_SYSTEM_ADMIN = true as const;

export const ACCESS_CONTROL_ADMIN_ONLY_PATTERNS: RegExp[] = [];

export const PERMISSION_CODE_DISPLAY: Record<string, { key: string; fallback: string }> = {
  'dashboard.view': { key: 'sidebar.dashboard', fallback: 'Dashboard' },
  'wms.goods-receipt.view': { key: 'sidebar.goodsReceiptList', fallback: 'Mal Kabul' },
  'wms.goods-receipt.create': { key: 'sidebar.goodsReceiptCreate', fallback: 'Mal Kabul Oluştur' },
  'wms.goods-receipt.update': { key: 'sidebar.goodsReceiptApproval', fallback: 'Mal Kabul Güncelle' },
  'wms.transfer.view': { key: 'sidebar.transferList', fallback: 'Transfer' },
  'wms.transfer.create': { key: 'sidebar.transferCreate', fallback: 'Transfer Oluştur' },
  'wms.transfer.update': { key: 'sidebar.transferApproval', fallback: 'Transfer Güncelle' },
  'wms.subcontracting.issue.view': { key: 'sidebar.subcontractingIssueList', fallback: 'Fason Çıkış' },
  'wms.subcontracting.issue.create': { key: 'sidebar.subcontractingIssueCreate', fallback: 'Fason Çıkış Oluştur' },
  'wms.subcontracting.issue.update': { key: 'sidebar.subcontractingIssueApproval', fallback: 'Fason Çıkış Güncelle' },
  'wms.subcontracting.receipt.view': { key: 'sidebar.subcontractingReceiptList', fallback: 'Fason Giriş' },
  'wms.subcontracting.receipt.create': { key: 'sidebar.subcontractingReceiptCreate', fallback: 'Fason Giriş Oluştur' },
  'wms.subcontracting.receipt.update': { key: 'sidebar.subcontractingReceiptApproval', fallback: 'Fason Giriş Güncelle' },
  'wms.warehouse.inbound.view': { key: 'sidebar.warehouseInboundList', fallback: 'Ambar Giriş' },
  'wms.warehouse.inbound.create': { key: 'sidebar.warehouseInboundCreate', fallback: 'Ambar Giriş Oluştur' },
  'wms.warehouse.inbound.update': { key: 'sidebar.warehouseInboundApproval', fallback: 'Ambar Giriş Güncelle' },
  'wms.warehouse.outbound.view': { key: 'sidebar.warehouseOutboundList', fallback: 'Ambar Çıkış' },
  'wms.warehouse.outbound.create': { key: 'sidebar.warehouseOutboundCreate', fallback: 'Ambar Çıkış Oluştur' },
  'wms.warehouse.outbound.update': { key: 'sidebar.warehouseOutboundApproval', fallback: 'Ambar Çıkış Güncelle' },
  'wms.shipment.view': { key: 'sidebar.shipmentList', fallback: 'Sevkiyat' },
  'wms.shipment.create': { key: 'sidebar.shipmentCreate', fallback: 'Sevkiyat Oluştur' },
  'wms.shipment.update': { key: 'sidebar.shipmentApproval', fallback: 'Sevkiyat Güncelle' },
  'wms.inventory-count.view': { key: 'sidebar.warehouse3d', fallback: 'Envanter' },
  'wms.inventory-count.create': { key: 'sidebar.warehouse3d', fallback: 'Envanter Oluştur' },
  'wms.inventory-count.update': { key: 'sidebar.warehouse3d', fallback: 'Envanter Güncelle' },
  'wms.reports.view': { key: 'sidebar.reports', fallback: 'Raporlar' },
  'wms.package.view': { key: 'sidebar.packageList', fallback: 'Paketleme' },
  'wms.package.create': { key: 'sidebar.packageCreate', fallback: 'Paketleme Oluştur' },
  'wms.package.update': { key: 'sidebar.packageList', fallback: 'Paketleme Güncelle' },
  'wms.parameters.gr.view': { key: 'sidebar.parametersGr', fallback: 'Mal Kabul Parametreleri' },
  'wms.parameters.gr.update': { key: 'sidebar.parametersGr', fallback: 'Mal Kabul Parametrelerini Güncelle' },
  'wms.parameters.wt.view': { key: 'sidebar.parametersWt', fallback: 'Transfer Parametreleri' },
  'wms.parameters.wt.update': { key: 'sidebar.parametersWt', fallback: 'Transfer Parametrelerini Güncelle' },
  'wms.parameters.wo.view': { key: 'sidebar.parametersWo', fallback: 'Depo Çıkış Parametreleri' },
  'wms.parameters.wo.update': { key: 'sidebar.parametersWo', fallback: 'Depo Çıkış Parametrelerini Güncelle' },
  'wms.parameters.wi.view': { key: 'sidebar.parametersWi', fallback: 'Depo Giriş Parametreleri' },
  'wms.parameters.wi.update': { key: 'sidebar.parametersWi', fallback: 'Depo Giriş Parametrelerini Güncelle' },
  'wms.parameters.sh.view': { key: 'sidebar.parametersSh', fallback: 'Sevkiyat Parametreleri' },
  'wms.parameters.sh.update': { key: 'sidebar.parametersSh', fallback: 'Sevkiyat Parametrelerini Güncelle' },
  'wms.parameters.srt.view': { key: 'sidebar.parametersSrt', fallback: 'Taşeron Giriş Parametreleri' },
  'wms.parameters.srt.update': { key: 'sidebar.parametersSrt', fallback: 'Taşeron Giriş Parametrelerini Güncelle' },
  'wms.parameters.sit.view': { key: 'sidebar.parametersSit', fallback: 'Taşeron Çıkış Parametreleri' },
  'wms.parameters.sit.update': { key: 'sidebar.parametersSit', fallback: 'Taşeron Çıkış Parametrelerini Güncelle' },
  'wms.parameters.pt.view': { key: 'sidebar.parametersPt', fallback: 'Üretim Transfer Parametreleri' },
  'wms.parameters.pt.update': { key: 'sidebar.parametersPt', fallback: 'Üretim Transfer Parametrelerini Güncelle' },
  'wms.parameters.pr.view': { key: 'sidebar.parametersPr', fallback: 'Üretim Parametreleri' },
  'wms.parameters.pr.update': { key: 'sidebar.parametersPr', fallback: 'Üretim Parametrelerini Güncelle' },
  'wms.parameters.ic.view': { key: 'sidebar.parametersIc', fallback: 'Sayım Parametreleri' },
  'wms.parameters.ic.update': { key: 'sidebar.parametersIc', fallback: 'Sayım Parametrelerini Güncelle' },
  'wms.parameters.p.view': { key: 'sidebar.parametersP', fallback: 'Paket Parametreleri' },
  'wms.parameters.p.update': { key: 'sidebar.parametersP', fallback: 'Paket Parametrelerini Güncelle' },
  'access-control.user-management.view': { key: 'sidebar.userManagement', fallback: 'Kullanıcı Yönetimi' },
  'access-control.user-management.create': { key: 'sidebar.userManagement', fallback: 'Kullanıcı Oluştur' },
  'access-control.user-management.update': { key: 'sidebar.userManagement', fallback: 'Kullanıcı Güncelle' },
  'access-control.permission-definitions.view': { key: 'sidebar.permissionDefinitions', fallback: 'İzin Tanımları' },
  'access-control.permission-definitions.create': { key: 'sidebar.permissionDefinitions', fallback: 'İzin Tanımı Oluştur' },
  'access-control.permission-definitions.update': { key: 'sidebar.permissionDefinitions', fallback: 'İzin Tanımı Güncelle' },
  'access-control.permission-groups.view': { key: 'sidebar.permissionGroups', fallback: 'İzin Grupları' },
  'access-control.permission-groups.create': { key: 'sidebar.permissionGroups', fallback: 'İzin Grubu Oluştur' },
  'access-control.permission-groups.update': { key: 'sidebar.permissionGroups', fallback: 'İzin Grubu Güncelle' },
  'access-control.mail-settings.view': { key: 'sidebar.mailSettings', fallback: 'Mail Ayarları' },
  'access-control.mail-settings.update': { key: 'sidebar.mailSettings', fallback: 'Mail Ayarlarını Güncelle' },
  'access-control.hangfire-monitoring.view': { key: 'sidebar.hangfireMonitoring', fallback: 'Hangfire İzleme' },
};

export const PERMISSION_SCOPE_DISPLAY: Record<string, { key: string; fallback: string }> = {
  dashboard: { key: 'sidebar.dashboard', fallback: 'Dashboard' },
  'wms.goods-receipt': { key: 'sidebar.goodsReceipt', fallback: 'Mal Kabul' },
  'wms.transfer': { key: 'sidebar.transfer', fallback: 'Transfer' },
  'wms.subcontracting.issue': { key: 'sidebar.subcontractingIssueCreate', fallback: 'Fason Çıkış' },
  'wms.subcontracting.receipt': { key: 'sidebar.subcontractingReceiptCreate', fallback: 'Fason Giriş' },
  'wms.warehouse.inbound': { key: 'sidebar.warehouseInboundCreate', fallback: 'Ambar Giriş' },
  'wms.warehouse.outbound': { key: 'sidebar.warehouseOutboundCreate', fallback: 'Ambar Çıkış' },
  'wms.shipment': { key: 'sidebar.shipment', fallback: 'Sevkiyat' },
  'wms.package': { key: 'sidebar.package', fallback: 'Paketleme' },
  'wms.inventory-count': { key: 'sidebar.inventory', fallback: 'Envanter' },
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
  'access-control.mail-settings': { key: 'sidebar.mailSettings', fallback: 'Mail Ayarları' },
  'access-control.hangfire-monitoring': { key: 'sidebar.hangfireMonitoring', fallback: 'Hangfire İzleme' },
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
