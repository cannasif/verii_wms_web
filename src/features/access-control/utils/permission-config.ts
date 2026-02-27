export const ROUTE_PERMISSION_MAP: Record<string, string> = {
  '/': 'dashboard.view',
  '/goods-receipt/create': 'wms.goods-receipt.create.view',
  '/goods-receipt/list': 'wms.goods-receipt.list.view',
  '/goods-receipt/assigned': 'wms.goods-receipt.assigned.view',
  '/transfer/create': 'wms.transfer.create.view',
  '/transfer/list': 'wms.transfer.list.view',
  '/transfer/assigned': 'wms.transfer.assigned.view',
  '/transfer/approval': 'wms.transfer.approval.view',
  '/subcontracting/issue/create': 'wms.subcontracting.issue.create.view',
  '/subcontracting/issue/list': 'wms.subcontracting.issue.list.view',
  '/subcontracting/issue/assigned': 'wms.subcontracting.issue.assigned.view',
  '/subcontracting/issue/approval': 'wms.subcontracting.issue.approval.view',
  '/subcontracting/receipt/create': 'wms.subcontracting.receipt.create.view',
  '/subcontracting/receipt/list': 'wms.subcontracting.receipt.list.view',
  '/subcontracting/receipt/assigned': 'wms.subcontracting.receipt.assigned.view',
  '/subcontracting/receipt/approval': 'wms.subcontracting.receipt.approval.view',
  '/warehouse/inbound/create': 'wms.warehouse.inbound.create.view',
  '/warehouse/inbound/list': 'wms.warehouse.inbound.list.view',
  '/warehouse/inbound/assigned': 'wms.warehouse.inbound.assigned.view',
  '/warehouse/inbound/approval': 'wms.warehouse.inbound.approval.view',
  '/warehouse/outbound/create': 'wms.warehouse.outbound.create.view',
  '/warehouse/outbound/list': 'wms.warehouse.outbound.list.view',
  '/warehouse/outbound/assigned': 'wms.warehouse.outbound.assigned.view',
  '/warehouse/outbound/approval': 'wms.warehouse.outbound.approval.view',
  '/shipment/create': 'wms.shipment.create.view',
  '/shipment/list': 'wms.shipment.list.view',
  '/shipment/assigned': 'wms.shipment.assigned.view',
  '/shipment/approval': 'wms.shipment.approval.view',
  '/inventory/3d-warehouse': 'wms.inventory.3d-warehouse.view',
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
  '/package/create': 'wms.package.create.view',
  '/package/list': 'wms.package.list.view',
  '/access-control/user-management': 'access-control.user-management.view',
  '/access-control/permission-definitions': 'access-control.permission-definitions.view',
  '/access-control/permission-groups': 'access-control.permission-groups.view',
  '/access-control/user-group-assignments': 'access-control.user-group-assignments.view',
  '/users/mail-settings': 'access-control.mail-settings.view',
  '/hangfire-monitoring': 'access-control.hangfire-monitoring.view',
};

export const PATH_TO_PERMISSION_PATTERNS: Array<{ pattern: RegExp; permission: string }> = [
  { pattern: /^\/$/, permission: 'dashboard.view' },
  { pattern: /^\/goods-receipt(\/|$)/, permission: 'wms.goods-receipt.list.view' },
  { pattern: /^\/transfer(\/|$)/, permission: 'wms.transfer.list.view' },
  { pattern: /^\/subcontracting\/issue(\/|$)/, permission: 'wms.subcontracting.issue.list.view' },
  { pattern: /^\/subcontracting\/receipt(\/|$)/, permission: 'wms.subcontracting.receipt.list.view' },
  { pattern: /^\/warehouse\/inbound(\/|$)/, permission: 'wms.warehouse.inbound.list.view' },
  { pattern: /^\/warehouse\/outbound(\/|$)/, permission: 'wms.warehouse.outbound.list.view' },
  { pattern: /^\/shipment(\/|$)/, permission: 'wms.shipment.list.view' },
  { pattern: /^\/inventory(\/|$)/, permission: 'wms.inventory.3d-warehouse.view' },
  { pattern: /^\/reports(\/|$)/, permission: 'wms.reports.view' },
  { pattern: /^\/parameters(\/|$)/, permission: 'wms.parameters.gr.view' },
  { pattern: /^\/package(\/|$)/, permission: 'wms.package.list.view' },
  { pattern: /^\/access-control\/user-management(\/|$)/, permission: 'access-control.user-management.view' },
  { pattern: /^\/access-control\/permission-definitions(\/|$)/, permission: 'access-control.permission-definitions.view' },
  { pattern: /^\/access-control\/permission-groups(\/|$)/, permission: 'access-control.permission-groups.view' },
  { pattern: /^\/access-control\/user-group-assignments(\/|$)/, permission: 'access-control.user-group-assignments.view' },
  { pattern: /^\/users\/mail-settings(\/|$)/, permission: 'access-control.mail-settings.view' },
  { pattern: /^\/hangfire-monitoring(\/|$)/, permission: 'access-control.hangfire-monitoring.view' },
];

export function isLeafPermissionCode(code: string): boolean {
  if (code === 'dashboard.view') return true;
  return code.split('.').filter(Boolean).length >= 3;
}

export const ACCESS_CONTROL_ADMIN_PERMISSIONS = [
  'access-control.permission-definitions.view',
  'access-control.permission-groups.view',
  'access-control.user-group-assignments.view',
] as const;

export const RBAC_FALLBACK_PERMISSION = 'access-control.permission-definitions.view' as const;

export const ACCESS_CONTROL_ADMIN_FALLBACK_TO_SYSTEM_ADMIN = true as const;

export const ACCESS_CONTROL_ADMIN_ONLY_PATTERNS: RegExp[] = [
  /^\/access-control(\/|$)/,
];

export const PERMISSION_CODE_DISPLAY: Record<string, { key: string; fallback: string }> = {
  'dashboard.view': { key: 'sidebar.dashboard', fallback: 'Dashboard' },
  'wms.goods-receipt.create.view': { key: 'sidebar.goodsReceiptCreate', fallback: 'Mal Kabul Oluştur' },
  'wms.goods-receipt.list.view': { key: 'sidebar.goodsReceiptList', fallback: 'Mal Kabul Listesi' },
  'wms.goods-receipt.assigned.view': { key: 'sidebar.goodsReceiptAssigned', fallback: 'Atanmış Mal Kabul Emirleri' },
  'wms.transfer.create.view': { key: 'sidebar.transferCreate', fallback: 'Transfer Oluştur' },
  'wms.transfer.list.view': { key: 'sidebar.transferList', fallback: 'Transfer Listesi' },
  'wms.transfer.assigned.view': { key: 'sidebar.transferAssigned', fallback: 'Atanmış Transfer Emirleri' },
  'wms.transfer.approval.view': { key: 'sidebar.transferApproval', fallback: 'Transfer Onayı' },
  'wms.subcontracting.issue.assigned.view': { key: 'sidebar.subcontractingIssueAssigned', fallback: 'Atanmış Fason Çıkış Emirleri' },
  'wms.subcontracting.issue.approval.view': { key: 'sidebar.subcontractingIssueApproval', fallback: 'Onay Bekleyen Fason Çıkış Emirleri' },
  'wms.subcontracting.issue.create.view': { key: 'sidebar.subcontractingIssueCreate', fallback: 'Fason Çıkış Emri' },
  'wms.subcontracting.issue.list.view': { key: 'sidebar.subcontractingIssueList', fallback: 'Fason Çıkış Listesi' },
  'wms.subcontracting.receipt.assigned.view': { key: 'sidebar.subcontractingReceiptAssigned', fallback: 'Atanmış Fason Giriş Emirleri' },
  'wms.subcontracting.receipt.approval.view': { key: 'sidebar.subcontractingReceiptApproval', fallback: 'Onay Bekleyen Fason Giriş Emirleri' },
  'wms.subcontracting.receipt.create.view': { key: 'sidebar.subcontractingReceiptCreate', fallback: 'Fason Giriş Emri' },
  'wms.subcontracting.receipt.list.view': { key: 'sidebar.subcontractingReceiptList', fallback: 'Fason Giriş Listesi' },
  'wms.warehouse.inbound.assigned.view': { key: 'sidebar.warehouseInboundAssigned', fallback: 'Atanmış Ambar Giriş Emirleri' },
  'wms.warehouse.inbound.approval.view': { key: 'sidebar.warehouseInboundApproval', fallback: 'Onay Bekleyen Ambar Giriş Emirleri' },
  'wms.warehouse.inbound.create.view': { key: 'sidebar.warehouseInboundCreate', fallback: 'Ambar Giriş Emri' },
  'wms.warehouse.inbound.list.view': { key: 'sidebar.warehouseInboundList', fallback: 'Ambar Giriş Listesi' },
  'wms.warehouse.outbound.assigned.view': { key: 'sidebar.warehouseOutboundAssigned', fallback: 'Atanmış Ambar Çıkış Emirleri' },
  'wms.warehouse.outbound.approval.view': { key: 'sidebar.warehouseOutboundApproval', fallback: 'Onay Bekleyen Ambar Çıkış Emirleri' },
  'wms.warehouse.outbound.create.view': { key: 'sidebar.warehouseOutboundCreate', fallback: 'Ambar Çıkış Emri' },
  'wms.warehouse.outbound.list.view': { key: 'sidebar.warehouseOutboundList', fallback: 'Ambar Çıkış Listesi' },
  'wms.shipment.assigned.view': { key: 'sidebar.shipmentAssigned', fallback: 'Atanmış Sevkiyat Emirleri' },
  'wms.shipment.approval.view': { key: 'sidebar.shipmentApproval', fallback: 'Onay Bekleyen Sevkiyat Emirleri' },
  'wms.shipment.create.view': { key: 'sidebar.shipmentCreate', fallback: 'Sevkiyat Emri' },
  'wms.shipment.list.view': { key: 'sidebar.shipmentList', fallback: 'Sevkiyat Emri Listesi' },
  'wms.inventory.3d-warehouse.view': { key: 'sidebar.warehouse3d', fallback: '3D Depo' },
  'wms.reports.view': { key: 'sidebar.reports', fallback: 'Raporlar' },
  'wms.parameters.gr.view': { key: 'sidebar.parametersGr', fallback: 'Mal Kabul Parametreleri' },
  'wms.parameters.wt.view': { key: 'sidebar.parametersWt', fallback: 'Depo Transfer Parametreleri' },
  'wms.parameters.wo.view': { key: 'sidebar.parametersWo', fallback: 'Depo Çıkış Parametreleri' },
  'wms.parameters.wi.view': { key: 'sidebar.parametersWi', fallback: 'Depo Giriş Parametreleri' },
  'wms.parameters.sh.view': { key: 'sidebar.parametersSh', fallback: 'Sevkiyat Parametreleri' },
  'wms.parameters.srt.view': { key: 'sidebar.parametersSrt', fallback: 'Taşeron Alış Transfer Parametreleri' },
  'wms.parameters.sit.view': { key: 'sidebar.parametersSit', fallback: 'Taşeron Çıkış Transfer Parametreleri' },
  'wms.parameters.pt.view': { key: 'sidebar.parametersPt', fallback: 'Üretim Transfer Parametreleri' },
  'wms.parameters.pr.view': { key: 'sidebar.parametersPr', fallback: 'Üretim Parametreleri' },
  'wms.parameters.ic.view': { key: 'sidebar.parametersIc', fallback: 'Sayım Parametreleri' },
  'wms.parameters.p.view': { key: 'sidebar.parametersP', fallback: 'Paket Parametreleri' },
  'wms.package.create.view': { key: 'sidebar.packageCreate', fallback: 'Yeni Paketleme' },
  'wms.package.list.view': { key: 'sidebar.packageList', fallback: 'Paketleme Listesi' },
  'access-control.user-management.view': { key: 'sidebar.userManagement', fallback: 'Kullanıcı Yönetimi' },
  'access-control.permission-definitions.view': { key: 'sidebar.permissionDefinitions', fallback: 'İzin Tanımları' },
  'access-control.permission-groups.view': { key: 'sidebar.permissionGroups', fallback: 'İzin Grupları' },
  'access-control.user-group-assignments.view': { key: 'sidebar.userGroupAssignments', fallback: 'Kullanıcı Grup Atamaları' },
  'access-control.mail-settings.view': { key: 'sidebar.mailSettings', fallback: 'Mail Ayarları' },
  'access-control.hangfire-monitoring.view': { key: 'sidebar.hangfireMonitoring', fallback: 'Hangfire İzleme' },
};

export function getPermissionDisplayMeta(code: string): { key: string; fallback: string } | null {
  return PERMISSION_CODE_DISPLAY[code] ?? null;
}

export const PERMISSION_MODULE_DISPLAY: Record<string, { key: string; fallback: string }> = {
  dashboard: { key: 'sidebar.dashboard', fallback: 'Dashboard' },
  wms: { key: 'sidebar.dashboard', fallback: 'WMS' },
  'access-control': { key: 'sidebar.accessControl', fallback: 'Access Control' },
};

export function getPermissionModuleDisplayMeta(prefix: string): { key: string; fallback: string } | null {
  return PERMISSION_MODULE_DISPLAY[prefix] ?? null;
}

export const PERMISSION_CODE_CATALOG: string[] = Array.from(
  new Set(
    Object.values(ROUTE_PERMISSION_MAP)
      .filter((code) => code && code !== 'admin-only')
      .map((code) => code.trim())
  )
)
  .sort((a, b) => a.localeCompare(b));

export function getRoutesForPermissionCode(code: string): string[] {
  return Object.entries(ROUTE_PERMISSION_MAP)
    .filter(([, permission]) => permission === code)
    .map(([route]) => route)
    .sort((a, b) => a.localeCompare(b));
}
