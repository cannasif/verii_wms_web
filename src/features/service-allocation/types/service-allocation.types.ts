export type ServiceCaseRow = {
  id: number;
  caseNo: string;
  customerCode: string;
  customerId?: number;
  incomingStockCode?: string;
  incomingStockId?: number;
  incomingSerialNo?: string;
  intakeWarehouseId?: number;
  currentWarehouseId?: number;
  diagnosisNote?: string;
  status: number;
  receivedAt?: string;
  closedAt?: string;
};

export type ServiceCaseLineRow = {
  id: number;
  serviceCaseId: number;
  lineType: number;
  processType: number;
  stockCode?: string;
  stockId?: number;
  quantity: number;
  unit?: string;
  erpOrderNo?: string;
  erpOrderId?: string;
  description?: string;
};

export type ServiceCaseTimelineEvent = {
  documentLinkId: number;
  documentModule: string | number;
  documentHeaderId: number;
  documentLineId?: number;
  linkPurpose: string | number;
  sequenceNo: number;
  fromWarehouseId?: number;
  toWarehouseId?: number;
  note?: string;
  linkedAt: string;
};

export type AllocationRecomputeLine = {
  allocationLineId: number;
  erpOrderNo: string;
  erpOrderId: string;
  requestedQuantity: number;
  fulfilledQuantity: number;
  allocatedQuantity: number;
  status: string | number;
  priorityNo: number;
};

export type AllocationRecomputeResponse = {
  stockId: number;
  availableQuantity: number;
  remainingQuantity: number;
  processedLineCount: number;
  lines: AllocationRecomputeLine[];
};

export type AllocationQueueRow = {
  id: number;
  stockCode: string;
  stockId: number;
  erpOrderNo: string;
  erpOrderId: string;
  customerCode: string;
  customerId?: number;
  processType: number;
  requestedQuantity: number;
  allocatedQuantity: number;
  reservedQuantity: number;
  fulfilledQuantity: number;
  priorityNo: number;
  status: string | number;
  sourceModule?: string;
  sourceHeaderId?: number;
  sourceLineId?: number;
};

export type BusinessDocumentLinkRow = {
  id: number;
  businessEntityType: string | number;
  businessEntityId: number;
  serviceCaseId?: number;
  orderAllocationLineId?: number;
  documentModule: string | number;
  documentHeaderId: number;
  documentLineId?: number;
  linkPurpose: string | number;
  sequenceNo: number;
  fromWarehouseId?: number;
  toWarehouseId?: number;
  note?: string;
  linkedAt: string;
};

export type ServiceCaseTimelineResponse = {
  serviceCase: ServiceCaseRow;
  lines: ServiceCaseLineRow[];
  timeline: ServiceCaseTimelineEvent[];
};

export type CreateServiceCaseRequest = {
  caseNo: string;
  customerCode: string;
  customerId?: number;
  incomingStockCode?: string;
  incomingStockId?: number;
  incomingSerialNo?: string;
  intakeWarehouseId?: number;
  currentWarehouseId?: number;
  diagnosisNote?: string;
  status: number;
  receivedAt?: string;
  closedAt?: string;
  branchCode?: string;
};

export type UpdateServiceCaseRequest = Partial<CreateServiceCaseRequest>;

export type CreateServiceCaseLineRequest = {
  serviceCaseId: number;
  lineType: number;
  processType: number;
  stockCode?: string;
  stockId?: number;
  quantity: number;
  unit?: string;
  erpOrderNo?: string;
  erpOrderId?: string;
  description?: string;
  branchCode?: string;
};
