export const SHIPMENT_QUERY_KEYS = {
  ORDERS: 'shipment.orders',
  ORDER_ITEMS: 'shipment.orderItems',
  HEADERS: 'shipment.headers',
  HEADERS_PAGED: 'shipment.headersPaged',
  ASSIGNED_HEADERS: 'shipment.assignedHeaders',
  ASSIGNED_ORDER_LINES: 'shipment.assignedOrderLines',
  LINES: 'shipment.lines',
  LINE_SERIALS: 'shipment.lineSerials',
  AWAITING_APPROVAL_HEADERS: 'shipment.awaitingApprovalHeaders',
} as const;
