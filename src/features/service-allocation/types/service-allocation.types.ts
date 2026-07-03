export type ServiceCaseRow = {
  id: number;
  caseNo: string;
  requestSource?: number;
  requestReference?: string;
  customerCode: string;
  customerId?: number;
  incomingStockCode?: string;
  incomingStockId?: number;
  incomingSerialNo?: string;
  barcode?: string;
  saleDate?: string;
  warrantyPeriodMonths?: number;
  warrantyCheckedAt?: string;
  systemWarrantyStatus?: number;
  warrantyManuallyOverridden?: boolean;
  intakeWarehouseId?: number;
  currentWarehouseId?: number;
  serviceWarehouseId?: number;
  serviceShelfId?: number;
  customerComplaint?: string;
  faultDescription?: string;
  diagnosisNote?: string;
  resolutionNote?: string;
  warrantyStatus?: number;
  decisionType?: number;
  decisionReason?: string;
  assignedTechnicianUserId?: number;
  assignedTechnicianUserEmail?: string;
  decisionAt?: string;
  expectedReturnDate?: string;
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

export type ServiceCaseMediaRow = {
  id: number;
  serviceCaseId: number;
  workSessionId?: number;
  mediaType: number;
  mediaPhase: number;
  fileName: string;
  fileUrl: string;
  contentType?: string;
  fileSize: number;
  caption?: string;
  sortOrder: number;
  isRequired: boolean;
  capturedAt?: string;
};

export type ServiceCaseAssignmentRow = {
  id: number;
  serviceCaseId: number;
  assignedBranchCode: string;
  assignedUserId?: number;
  assignedUserEmail?: string;
  status: number;
  assignedAt: string;
  acceptedAt?: string;
  startedAt?: string;
  completedAt?: string;
  note?: string;
};

export type ServiceCaseWorkSessionRow = {
  id: number;
  serviceCaseId: number;
  assignmentId: number;
  technicianUserId: number;
  technicianUserEmail?: string;
  startedAt: string;
  finishedAt?: string;
  durationSeconds?: number;
  status: number;
  startNote?: string;
  completionNote?: string;
};

export type ServiceCaseWarrantyOverrideLogRow = {
  id: number;
  serviceCaseId: number;
  systemWarrantyStatus: number;
  userSelectedWarrantyStatus: number;
  reason?: string;
  changedByUserId?: number;
  changedByUserEmail?: string;
  changedAt: string;
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
  media: ServiceCaseMediaRow[];
  assignments: ServiceCaseAssignmentRow[];
  workSessions: ServiceCaseWorkSessionRow[];
  warrantyOverrideLogs: ServiceCaseWarrantyOverrideLogRow[];
  timeline: ServiceCaseTimelineEvent[];
};

export type ServiceCaseDispositionPlan = {
  serviceCaseId: number;
  caseNo: string;
  decisionType: number;
  currentStatus: number;
  isReadyForDisposition: boolean;
  hasCompletedWorkSession: boolean;
  hasCompletionVideo: boolean;
  hasDispositionDocument: boolean;
  requiredDocumentModule?: string | number | null;
  requiredLinkPurpose?: string | number | null;
  requiredAction: string;
  fromWarehouseId?: number | null;
  toWarehouseId?: number | null;
  message: string;
  existingLinks: BusinessDocumentLinkRow[];
};

export type CreateServiceCaseRequest = {
  caseNo: string;
  requestSource?: number;
  requestReference?: string;
  customerCode: string;
  customerId?: number;
  incomingStockCode?: string;
  incomingStockId?: number;
  incomingSerialNo?: string;
  barcode?: string;
  saleDate?: string;
  warrantyPeriodMonths?: number;
  forceWarrantyOverride?: boolean;
  warrantyOverrideReason?: string;
  intakeWarehouseId?: number;
  currentWarehouseId?: number;
  serviceWarehouseId?: number;
  serviceShelfId?: number;
  customerComplaint?: string;
  faultDescription?: string;
  diagnosisNote?: string;
  resolutionNote?: string;
  warrantyStatus?: number;
  assignedTechnicianUserId?: number;
  assignedTechnicianUserEmail?: string;
  expectedReturnDate?: string;
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

export type AssignServiceCaseRequest = {
  assignedBranchCode: string;
  assignedUserId?: number;
  assignedUserEmail?: string;
  note?: string;
};

export type StartServiceCaseWorkRequest = {
  assignmentId: number;
  startNote?: string;
  beforeRepairPhotos: File[];
};

export type CompleteServiceCaseWorkRequest = {
  workSessionId: number;
  decisionType: number;
  decisionReason?: string;
  resolutionNote?: string;
  completionNote?: string;
  completionMedia: File[];
};
