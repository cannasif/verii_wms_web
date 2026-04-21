export interface PrinterDefinition {
  id?: number | null;
  code: string;
  displayName: string;
  connectionType: string;
  outputType: string;
  host?: string | null;
  queueName?: string | null;
  description?: string | null;
  isActive: boolean;
  isDefault: boolean;
  supportsRawCommands: boolean;
  lastSeenAt?: string | null;
  branchCode: string;
}

export interface PrinterDefinitionUpsertRequest {
  code: string;
  displayName: string;
  connectionType: string;
  outputType: string;
  host?: string | null;
  queueName?: string | null;
  description?: string | null;
  isActive: boolean;
  isDefault: boolean;
  supportsRawCommands: boolean;
}

export interface PrintJob {
  id?: number | null;
  printerDefinitionId: number;
  printerProfileId?: number | null;
  barcodeTemplateId?: number | null;
  printerCode: string;
  printerDisplayName: string;
  printerConnectionType: string;
  printerHost?: string | null;
  printerQueueName?: string | null;
  printerSupportsRawCommands: boolean;
  printerProfileCode?: string | null;
  printerProfileDisplayName?: string | null;
  printerProfileDpi?: number | null;
  printerProfileWidth?: number | null;
  printerProfileHeight?: number | null;
  printerProfileTransportType?: string | null;
  jobName: string;
  outputFormat: string;
  copies: number;
  payloadJson: string;
  previewPayload?: string | null;
  renderedPayload?: string | null;
  status: string;
  requestedAt: string;
  processedAt?: string | null;
  completedAt?: string | null;
  errorMessage?: string | null;
  sourceModule?: string | null;
  sourceHeaderId?: number | null;
  sourceLineId?: number | null;
  branchCode: string;
}

export interface PrintJobCreateRequest {
  printerDefinitionId: number;
  printerProfileId?: number | null;
  barcodeTemplateId?: number | null;
  jobName: string;
  outputFormat: string;
  copies: number;
  payloadJson: string;
  previewPayload?: string | null;
  sourceModule?: string | null;
  sourceHeaderId?: number | null;
  sourceLineId?: number | null;
}

export interface PrinterProfile {
  id?: number | null;
  printerDefinitionId: number;
  printerCode: string;
  printerDisplayName: string;
  code: string;
  displayName: string;
  labelWidth: number;
  labelHeight: number;
  dpi: number;
  outputType: string;
  transportType: string;
  isActive: boolean;
  isDefault: boolean;
  description?: string | null;
  branchCode: string;
}

export interface PrinterProfileUpsertRequest {
  printerDefinitionId: number;
  code: string;
  displayName: string;
  labelWidth: number;
  labelHeight: number;
  dpi: number;
  outputType: string;
  transportType: string;
  isActive: boolean;
  isDefault: boolean;
  description?: string | null;
}

export interface BarcodeTemplatePrinterProfileMap {
  id?: number | null;
  barcodeTemplateId: number;
  printerProfileId: number;
  templateCode: string;
  templateDisplayName: string;
  printerProfileCode: string;
  printerProfileDisplayName: string;
  printerCode: string;
  isDefault: boolean;
  branchCode: string;
}

export interface BarcodeTemplatePrinterProfileMapUpsertRequest {
  barcodeTemplateId: number;
  printerProfileId: number;
  isDefault: boolean;
}
