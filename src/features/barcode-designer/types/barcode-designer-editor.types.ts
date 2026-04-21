export type BarcodeDesignerElementType = 'text' | 'barcode' | 'line' | 'rect' | 'image';
export type BarcodeSymbology = 'code128' | 'qrcode' | 'datamatrix';

export interface BarcodeDesignerCanvasSettings {
  unit: 'mm';
  width: number;
  height: number;
  dpi: number;
}

export interface BarcodeDesignerElementBase {
  id: string;
  type: BarcodeDesignerElementType;
  x: number;
  y: number;
}

export interface BarcodeDesignerTextElement extends BarcodeDesignerElementBase {
  type: 'text';
  text: string;
  width: number;
  height: number;
  fontSize: number;
}

export interface BarcodeDesignerBarcodeElement extends BarcodeDesignerElementBase {
  type: 'barcode';
  barcodeType: BarcodeSymbology;
  binding: string;
  width: number;
  height: number;
}

export interface BarcodeDesignerLineElement extends BarcodeDesignerElementBase {
  type: 'line';
  points: number[];
}

export interface BarcodeDesignerRectElement extends BarcodeDesignerElementBase {
  type: 'rect';
  width: number;
  height: number;
}

export interface BarcodeDesignerImageElement extends BarcodeDesignerElementBase {
  type: 'image';
  width: number;
  height: number;
  src: string;
}

export type BarcodeDesignerElement =
  | BarcodeDesignerTextElement
  | BarcodeDesignerBarcodeElement
  | BarcodeDesignerLineElement
  | BarcodeDesignerRectElement
  | BarcodeDesignerImageElement;

export interface BarcodeDesignerTemplateDocument {
  canvas: BarcodeDesignerCanvasSettings;
  elements: BarcodeDesignerElement[];
  bindings: Record<string, string>;
}

export interface BarcodeTemplate {
  id?: number | null;
  templateCode: string;
  displayName: string;
  labelType: string;
  width: number;
  height: number;
  dpi: number;
  engineType: string;
  isActive: boolean;
  draftVersionId?: number | null;
  publishedVersionId?: number | null;
  branchCode: string;
}

export interface BarcodeTemplateUpsertRequest {
  templateCode: string;
  displayName: string;
  labelType: string;
  width: number;
  height: number;
  dpi: number;
  engineType: string;
  isActive: boolean;
}

export interface BarcodeTemplateDraft {
  id?: number | null;
  templateId: number;
  versionNo: number;
  isPublished?: boolean;
  notes?: string;
  templateJson: string;
}

export interface BarcodeTemplateVersion {
  id?: number | null;
  templateId: number;
  versionNo: number;
  isPublished?: boolean;
  notes?: string;
  templateJson: string;
}

export interface BarcodeComplianceIssue {
  level: string;
  elementId: string;
  code: string;
  message: string;
}

export interface BarcodeComplianceReport {
  canPublish: boolean;
  labelType: string;
  barcodeCount: number;
  hasGs1Barcode: boolean;
  hasGs1HumanReadableText: boolean;
  summary: string;
  issues: BarcodeComplianceIssue[];
}

export interface BarcodeBindingField {
  key: string;
  label: string;
  path: string;
  sampleValue: string;
  targetType: 'text' | 'barcode' | 'image';
  sourceType: string;
  providerKey: string;
  providerLabel: string;
}

export interface BarcodeBindingCatalogGroup {
  groupKey: string;
  groupLabel: string;
  fields: BarcodeBindingField[];
}

export interface BarcodeBindingCatalogRequest {
  sourceModule?: string | null;
  sourceHeaderId?: number | null;
  sourceLineId?: number | null;
  printMode?: string | null;
}

export interface BarcodeSchemaEntity {
  entityKey: string;
  entityLabel: string;
  entityType: string;
  iconKey: string;
  fields: BarcodeBindingField[];
}

export interface BarcodeSchemaMetadata {
  processKey: string;
  processLabel: string;
  entities: BarcodeSchemaEntity[];
  frequentFields: BarcodeBindingField[];
}

export interface BarcodeDesignerPreviewRequest {
  templateId?: number | null;
  templateVersionId?: number | null;
  templateJson: string;
  sourceModule?: string | null;
  sourceHeaderId?: number | null;
  sourceLineId?: number | null;
  printMode?: 'manual' | 'document-line' | 'document-all';
  sampleData: Record<string, string>;
}

export interface BarcodeDesignerPreviewResult {
  engineType: string;
  outputFormat: string;
  previewPayload: string;
  debugMessage?: string | null;
}

export interface Gs1ElementInput {
  applicationIdentifier: string;
  value: string;
}

export interface Gs1BuildRequest {
  elements: Gs1ElementInput[];
}

export interface Gs1BuildResult {
  isValid: boolean;
  barcodeValue: string;
  humanReadable: string;
  errors: string[];
  warnings: string[];
}

export interface BarcodePrintSourceItem {
  sourceModule: string;
  sourceHeaderId?: number | null;
  sourceLineId?: number | null;
  documentNo?: string | null;
  documentDate?: string | null;
  customerCode?: string | null;
  projectCode?: string | null;
  headerDescription1?: string | null;
  headerDescription2?: string | null;
  sourceWarehouseCode?: string | null;
  targetWarehouseCode?: string | null;
  status?: string | null;
  trackingNo?: string | null;
  packingNo?: string | null;
  sourceType?: string | null;
  stockCode?: string | null;
  stockName?: string | null;
  serialNo?: string | null;
  yapKod?: string | null;
  quantity?: number | null;
  unit?: string | null;
  erpOrderNo?: string | null;
  erpOrderId?: string | null;
  description?: string | null;
}

export type BarcodePrintSourceModule =
  | 'goods-receipt'
  | 'transfer'
  | 'warehouse-inbound'
  | 'warehouse-outbound'
  | 'shipment'
  | 'subcontracting-issue'
  | 'subcontracting-receipt'
  | 'package'
  | 'production-transfer';

export interface BarcodeSourceHeaderOption {
  id: number;
  sourceModule: BarcodePrintSourceModule;
  title: string;
  subtitle?: string | null;
  status?: string | null;
  documentDate?: string | null;
}

export interface BarcodeSourceLineOption {
  id: number;
  headerId: number;
  sourceModule: BarcodePrintSourceModule;
  title: string;
  subtitle?: string | null;
  quantity?: number | null;
  stockCode?: string | null;
  serialNo?: string | null;
}

export interface BarcodeSourcePackageOption {
  id: number;
  headerId: number;
  sourceModule: 'package';
  title: string;
  subtitle?: string | null;
  barcode?: string | null;
  status?: string | null;
}
