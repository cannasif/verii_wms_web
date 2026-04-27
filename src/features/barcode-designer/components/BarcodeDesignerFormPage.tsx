import { Suspense, lazy, type ReactElement, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Barcode, ChevronDown, ChevronRight, Copy, Download, FileJson2, Image as ImageIcon, Layers3, Package2, Plus, Save, ScanLine, Sparkles, Trash2, Type } from 'lucide-react';
import type { Stage as KonvaStage } from 'konva/lib/Stage';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useUIStore } from '@/stores/ui-store';
import { loadJsPdfModule } from '@/lib/lazy-vendors';
import { useRouteScreenReady } from '@/routes/RouteRuntimeBoundary';
import { printerManagementApi } from '@/features/printer-management/api/printer-management.api';
import { useCrudPermission } from '@/features/access-control/hooks/useCrudPermission';
import { barcodeDesignerApi } from '../api/barcode-designer.api';
import { BarcodeTemplatePresetThumbnail } from './BarcodeTemplatePresetThumbnail';
import { ARCHITECTURE_GROUPS, DELIVERY_PHASES, STACK_OPTIONS } from '../constants/barcode-designer-plan';
import type {
  BarcodeBindingField,
  BarcodeSchemaEntity,
  BarcodeDesignerElement,
  BarcodeDesignerTemplateDocument,
  BarcodePrintSourceModule,
  BarcodeSourceHeaderOption,
  BarcodeSourceLineOption,
  BarcodeSourcePackageOption,
  BarcodeTemplateUpsertRequest,
} from '../types/barcode-designer-editor.types';
import { BARCODE_BINDING_FIELDS, BARCODE_TEMPLATE_PRESETS, DEFAULT_TEMPLATE_DOCUMENT, cmToMm, cmToPx, getRecommendedBindingTarget, getSuggestedBarcodeSymbology, getSuggestedElementLayout, mmToCm, parseTemplateDocument, pxToCm, snapToGridPx, stringifyTemplateDocument } from '../utils/barcode-designer-document';
import { loadBarcodeDesignerDefaults, saveBarcodeDesignerDefaults } from '../utils/barcode-designer-defaults';
import { validateBarcodeTemplate } from '../utils/barcode-designer-validation';

const BarcodeDesignerCanvas = lazy(async () => {
  const module = await import('./BarcodeDesignerCanvas');
  return { default: module.BarcodeDesignerCanvas };
});

const BarcodePrintSourcePickerDialog = lazy(async () => {
  const module = await import('./BarcodePrintSourcePickerDialog');
  return { default: module.BarcodePrintSourcePickerDialog };
});

const DEFAULT_GS1_ELEMENTS = [
  { applicationIdentifier: '00', value: '' },
  { applicationIdentifier: '01', value: '' },
  { applicationIdentifier: '10', value: '' },
  { applicationIdentifier: '17', value: '' },
  { applicationIdentifier: '21', value: '' },
];

const DEFAULT_LOGISTIC_WIZARD = {
  sscc: '01234567890123456',
  gtin: '0869990001234',
  lotNo: 'LOT001',
  expiryDate: '260630',
  serialNo: 'SRL-0001',
  shipTo: '8699990000000',
  count: '48',
  shipmentNo: 'SHIP-2026-0001',
  warehouseCode: 'ANA',
  locationCode: 'A-01-02',
  customerName: 'Lojistik Musteri',
  stockName: 'Karisik Sevkiyat Birimi',
};

const DEFAULT_TEMPLATE_REQUEST: BarcodeTemplateUpsertRequest = {
  templateCode: 'PRODUCT_LABEL',
  displayName: 'Urun Etiketi',
  labelType: 'product',
  width: 100,
  height: 150,
  dpi: 203,
  engineType: 'konva+bwip',
  isActive: true,
};

const DEFAULT_RECOMMENDATION_CONTEXT = {
  branchCode: '0',
  customerType: 'standard',
  processType: 'warehouse-inbound',
};

const QUICK_INSERT_FIELDS = [
  { key: 'stockCode', label: 'Stok Kodu', path: 'stock > identity > stockCode', sampleValue: 'STK-2026-001', targetType: 'text' as const },
  { key: 'stockName', label: 'Stok Adi', path: 'stock > identity > stockName', sampleValue: 'Camasir Makinesi Motor', targetType: 'text' as const },
  { key: 'stock.barcode', label: 'Stok Barkodu', path: 'stock > barcode > primary', sampleValue: '{{stockCode}}', targetType: 'barcode' as const },
  { key: 'customerName', label: 'Musteri Adi', path: 'customer > identity > customerName', sampleValue: 'V3rii Musteri', targetType: 'text' as const },
  { key: 'companyName', label: 'Firma Adi', path: 'company > identity > companyName', sampleValue: 'V3rii A.S.', targetType: 'text' as const },
  { key: 'stockMainImageUrl', label: 'Stok Gorseli', path: 'stock > media > mainImageUrl', sampleValue: 'https://placehold.co/320x200/png', targetType: 'image' as const },
];

function describeElement(element: BarcodeDesignerElement | undefined): string {
  if (!element) return 'Eleman secili degil';
  switch (element.type) {
    case 'barcode':
      return `${element.barcodeType.toUpperCase()} · ${element.binding}`;
    case 'text':
      return `Text · ${element.text}`;
    case 'image':
      return `Image · ${element.src || 'Kaynak yok'}`;
    case 'rect':
      return 'Frame / Rectangle';
    case 'line':
      return 'Line';
  }
}

function toNumber(value: string, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function getTreeNodeSegments(path: string): string[] {
  return path.split('>').map((segment) => segment.trim()).filter(Boolean);
}

function getTargetBadgeTone(targetType: 'text' | 'barcode' | 'image'): 'default' | 'secondary' | 'outline' {
  if (targetType === 'barcode') return 'default';
  if (targetType === 'image') return 'secondary';
  return 'outline';
}

interface BindingFieldTreeNode {
  key: string;
  label: string;
  children: BindingFieldTreeNode[];
  field?: BarcodeBindingField;
}

function buildBindingFieldTree(fields: BarcodeBindingField[]): BindingFieldTreeNode[] {
  const root = new Map<string, BindingFieldTreeNode>();

  for (const field of fields) {
    const segments = getTreeNodeSegments(field.path);
    let current = root;
    let currentNode: BindingFieldTreeNode | null = null;

    segments.forEach((segment, index) => {
      const nodeKey = currentNode ? `${currentNode.key}>${segment}` : segment;
      const existing = current.get(nodeKey);
      const node = existing ?? {
        key: nodeKey,
        label: segment,
        children: [],
      };

      if (!existing) {
        current.set(nodeKey, node);
        if (currentNode) {
          currentNode.children.push(node);
        }
      }

      if (index === segments.length - 1) {
        node.field = field;
      }

      currentNode = node;
      current = new Map(node.children.map((child) => [child.key, child]));
    });
  }

  const sortNodes = (nodes: BindingFieldTreeNode[]): BindingFieldTreeNode[] =>
    [...nodes]
      .sort((left, right) => left.label.localeCompare(right.label, 'tr'))
      .map((node) => ({ ...node, children: sortNodes(node.children) }));

  return sortNodes(Array.from(root.values()).filter((node) => !node.key.includes('>')));
}

function createBoundElementFromField(
  document: BarcodeDesignerTemplateDocument,
  field: Pick<BarcodeBindingField, 'key' | 'label' | 'path' | 'sampleValue' | 'targetType'>,
  desiredX?: number,
  desiredY?: number,
): BarcodeDesignerElement {
  const targetType = getRecommendedBindingTarget(field);
  const nextId = `${targetType}-schema-${Date.now()}`;
  const layout = getSuggestedElementLayout(document, targetType, desiredX, desiredY);

  if (targetType === 'barcode') {
    return {
      id: nextId,
      type: 'barcode',
      x: layout.x,
      y: layout.y,
      width: layout.width,
      height: layout.height,
      barcodeType: getSuggestedBarcodeSymbology(field),
      binding: field.key,
    };
  }

  if (targetType === 'image') {
    return {
      id: nextId,
      type: 'image',
      x: layout.x,
      y: layout.y,
      width: layout.width,
      height: layout.height,
      src: `{{${field.key}}}`,
    };
  }

  return {
    id: nextId,
    type: 'text',
    x: layout.x,
    y: layout.y,
    width: layout.width,
    height: layout.height,
    fontSize: layout.fontSize ?? 14,
    text: `{{${field.key}}}`,
  };
}

function getElementBox(element: BarcodeDesignerElement): { x: number; y: number; width: number; height: number } {
  if ('width' in element && 'height' in element) {
    return { x: element.x, y: element.y, width: element.width, height: element.height };
  }

  if (element.type === 'line') {
    const xPoints = element.points.filter((_, index) => index % 2 === 0);
    const yPoints = element.points.filter((_, index) => index % 2 === 1);
    return {
      x: element.x,
      y: element.y,
      width: Math.max(...xPoints, 0),
      height: Math.max(...yPoints, 0),
    };
  }

  return { x: 0, y: 0, width: 120, height: 48 };
}

function getSmartPlacementFromSelection(
  document: BarcodeDesignerTemplateDocument,
  selectedElement: BarcodeDesignerElement | undefined,
  targetType: 'text' | 'barcode' | 'image',
): { x?: number; y?: number } {
  if (!selectedElement) {
    return {};
  }

  const selectedBox = getElementBox(selectedElement);
  const suggestion = getSuggestedElementLayout(document, targetType);
  const canvasWidth = cmToPx(mmToCm(document.canvas.width));
  const canvasHeight = cmToPx(mmToCm(document.canvas.height));

  const preferBelowY = selectedBox.y + selectedBox.height + cmToPx(0.4);
  if (preferBelowY + suggestion.height <= canvasHeight - cmToPx(0.2)) {
    return {
      x: selectedBox.x,
      y: preferBelowY,
    };
  }

  const preferRightX = selectedBox.x + selectedBox.width + cmToPx(0.4);
  if (preferRightX + suggestion.width <= canvasWidth - cmToPx(0.2)) {
    return {
      x: preferRightX,
      y: selectedBox.y,
    };
  }

  return {};
}

interface SchemaFieldNodeProps {
  node: BindingFieldTreeNode;
  level?: number;
  expandedNodes: Record<string, boolean>;
  onToggleNode: (key: string) => void;
  onApplyField: (field: BarcodeBindingField) => void;
  onCreateField: (field: BarcodeBindingField) => void;
}

function SchemaFieldNode({
  node,
  level = 0,
  expandedNodes,
  onToggleNode,
  onApplyField,
  onCreateField,
}: SchemaFieldNodeProps): ReactElement {
  const isExpanded = expandedNodes[node.key] ?? true;
  const hasChildren = node.children.length > 0;

  if (node.field) {
    const recommendedTarget = getRecommendedBindingTarget(node.field);
    return (
      <div
        draggable
        onDragStart={(event) => {
          event.dataTransfer.setData('application/vnd.v3rii.binding-field', JSON.stringify({
            key: node.field!.key,
            label: node.field!.label,
            path: node.field!.path,
            sampleValue: node.field!.sampleValue,
            targetType: node.field!.targetType,
          }));
          event.dataTransfer.effectAllowed = 'copy';
        }}
        onDoubleClick={() => onCreateField(node.field!)}
        className="rounded-xl border border-slate-200/80 bg-slate-50/80 px-3 py-2 text-sm transition hover:border-slate-300 dark:border-white/10 dark:bg-slate-900/30"
        style={{ marginLeft: `${level * 16}px` }}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {recommendedTarget === 'barcode' ? <ScanLine className="size-4 text-sky-600 dark:text-sky-300" /> : null}
              {recommendedTarget === 'text' ? <Type className="size-4 text-slate-600 dark:text-slate-300" /> : null}
              {recommendedTarget === 'image' ? <ImageIcon className="size-4 text-violet-600 dark:text-violet-300" /> : null}
              <div className="font-medium text-slate-900 dark:text-white">{node.field.label}</div>
              <Badge variant={getTargetBadgeTone(recommendedTarget)}>Oneri: {recommendedTarget}</Badge>
              <Badge variant="secondary">{node.field.providerLabel}</Badge>
            </div>
            <div className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
              {node.field.key} · {node.field.sourceType} · {node.field.targetType}
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onApplyField(node.field!)}>
              Bagla
            </Button>
            <Button type="button" size="sm" onClick={() => onCreateField(node.field!)}>
              Ekle
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginLeft: `${level * 12}px` }}>
      <button
        type="button"
        className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/[0.04]"
        onClick={() => onToggleNode(node.key)}
      >
        {hasChildren ? (isExpanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />) : <Package2 className="size-4" />}
        <span className="font-medium">{node.label}</span>
        {hasChildren ? <Badge variant="outline">{node.children.length}</Badge> : null}
      </button>
      {isExpanded ? (
        <div className="mt-1 space-y-2">
          {node.children.map((child) => (
            <SchemaFieldNode
              key={child.key}
              node={child}
              level={level + 1}
              expandedNodes={expandedNodes}
              onToggleNode={onToggleNode}
              onApplyField={onApplyField}
              onCreateField={onCreateField}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function BarcodeDesignerFormPage(): ReactElement {
  const { t } = useTranslation('common');
  const { id } = useParams();
  const navigate = useNavigate();
  const { setPageTitle } = useUIStore();
  const permission = useCrudPermission('wms.print-management');
  const queryClient = useQueryClient();
  const stageRef = useRef<KonvaStage | null>(null);

  const activeTemplateId = id ? Number(id) : null;
  const isEditMode = !!activeTemplateId;
  const canManageTemplate = isEditMode ? permission.canUpdate : permission.canCreate;
  const readOnlyClassName = !canManageTemplate ? 'pointer-events-none opacity-75' : undefined;

  const [templateRequest, setTemplateRequest] = useState<BarcodeTemplateUpsertRequest>(DEFAULT_TEMPLATE_REQUEST);
  const [documentState, setDocumentState] = useState<BarcodeDesignerTemplateDocument>(DEFAULT_TEMPLATE_DOCUMENT);
  const [jsonValue, setJsonValue] = useState<string>(stringifyTemplateDocument(DEFAULT_TEMPLATE_DOCUMENT));
  const [selectedElementId, setSelectedElementId] = useState<string | null>(DEFAULT_TEMPLATE_DOCUMENT.elements[0]?.id ?? null);
  const [selectedElementIds, setSelectedElementIds] = useState<string[]>(DEFAULT_TEMPLATE_DOCUMENT.elements[0]?.id ? [DEFAULT_TEMPLATE_DOCUMENT.elements[0].id] : []);
  const [selectedPrinterProfileId, setSelectedPrinterProfileId] = useState<string>('');
  const [arrangementGuides, setArrangementGuides] = useState<{ x: number[]; y: number[] }>({ x: [], y: [] });
  const [gs1Elements, setGs1Elements] = useState(DEFAULT_GS1_ELEMENTS);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('product-basic');
  const [selectedPresetCategory, setSelectedPresetCategory] = useState<'product' | 'carton' | 'pallet' | 'logistic'>('product');
  const [logisticWizard, setLogisticWizard] = useState(DEFAULT_LOGISTIC_WIZARD);
  const [recommendationContext, setRecommendationContext] = useState(DEFAULT_RECOMMENDATION_CONTEXT);
  const [bindingContext, setBindingContext] = useState({
    sourceModule: 'goods-receipt' as BarcodePrintSourceModule,
    sourceHeaderId: '',
    sourceLineId: '',
  });
  const [bindingPickerOpen, setBindingPickerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'designer' | 'json' | 'preview' | 'plan'>('designer');
  const { reportScreenReady } = useRouteScreenReady();
  const screenReadyReportedRef = useRef(false);
  const [printerProfilesExpanded, setPrinterProfilesExpanded] = useState(false);
  const [versioningExpanded, setVersioningExpanded] = useState(false);
  const [deferredInsightsEnabled, setDeferredInsightsEnabled] = useState(false);
  const [selectedBindingHeader, setSelectedBindingHeader] = useState<BarcodeSourceHeaderOption | null>(null);
  const [selectedBindingLine, setSelectedBindingLine] = useState<BarcodeSourceLineOption | null>(null);
  const [selectedBindingPackage, setSelectedBindingPackage] = useState<BarcodeSourcePackageOption | null>(null);
  const [schemaSearch, setSchemaSearch] = useState('');
  const [expandedBindingGroups, setExpandedBindingGroups] = useState<Record<string, boolean>>({});
  const [expandedBindingNodes, setExpandedBindingNodes] = useState<Record<string, boolean>>({});
  const [lastComplianceReport, setLastComplianceReport] = useState<null | {
    versionNo?: number | null;
    summary: string;
    canPublish: boolean;
    labelType: string;
    barcodeCount: number;
    hasGs1HumanReadableText: boolean;
    issues: { level: string; elementId: string; code: string; message: string }[];
  }>(null);

  const templateQuery = useQuery({
    queryKey: ['barcode-designer-template', activeTemplateId],
    queryFn: ({ signal }) => barcodeDesignerApi.getTemplate(activeTemplateId!, { signal }),
    enabled: isEditMode,
  });

  const draftQuery = useQuery({
    queryKey: ['barcode-designer-draft', activeTemplateId],
    queryFn: ({ signal }) => barcodeDesignerApi.getDraft(activeTemplateId!, { signal }),
    enabled: isEditMode,
  });

  const versionsQuery = useQuery({
    queryKey: ['barcode-designer-versions', activeTemplateId],
    queryFn: ({ signal }) => barcodeDesignerApi.getVersions(activeTemplateId!, { signal }),
    enabled: isEditMode && versioningExpanded,
  });

  const bindingCatalogQuery = useQuery({
    queryKey: ['barcode-designer-binding-catalog', bindingContext.sourceModule, bindingContext.sourceHeaderId, bindingContext.sourceLineId],
    queryFn: ({ signal }) => barcodeDesignerApi.getBindingCatalog({
      sourceModule: bindingContext.sourceModule,
      sourceHeaderId: bindingContext.sourceHeaderId.trim() ? Number(bindingContext.sourceHeaderId) : null,
      sourceLineId: bindingContext.sourceLineId.trim() ? Number(bindingContext.sourceLineId) : null,
      printMode: bindingContext.sourceLineId.trim() ? 'document-line' : 'document-all',
    }, { signal }),
    enabled: activeTab === 'designer',
  });
  const schemaMetadataQuery = useQuery({
    queryKey: ['barcode-designer-schema-metadata', bindingContext.sourceModule, bindingContext.sourceHeaderId, bindingContext.sourceLineId],
    queryFn: ({ signal }) => barcodeDesignerApi.getSchemaMetadata({
      sourceModule: bindingContext.sourceModule,
      sourceHeaderId: bindingContext.sourceHeaderId.trim() ? Number(bindingContext.sourceHeaderId) : null,
      sourceLineId: bindingContext.sourceLineId.trim() ? Number(bindingContext.sourceLineId) : null,
      printMode: bindingContext.sourceLineId.trim() ? 'document-line' : 'document-all',
    }, { signal }),
    enabled: activeTab === 'designer',
  });

  const printJobsQuery = useQuery({
    queryKey: ['printer-management-print-jobs-for-barcode-recommendation'],
    queryFn: ({ signal }) => printerManagementApi.getPrintJobs(200, { signal }),
    enabled: deferredInsightsEnabled,
  });

  const printerProfilesQuery = useQuery({
    queryKey: ['printer-management-profiles-for-template-mapping'],
    queryFn: ({ signal }) => printerManagementApi.getProfiles(undefined, { signal }),
    enabled: isEditMode && printerProfilesExpanded,
  });

  const templatePrinterProfilesQuery = useQuery({
    queryKey: ['barcode-designer-template-printer-profiles', activeTemplateId],
    queryFn: ({ signal }) => printerManagementApi.getTemplatePrinterProfiles(activeTemplateId!, { signal }),
    enabled: isEditMode && printerProfilesExpanded,
  });

  useEffect(() => {
    if (screenReadyReportedRef.current || activeTab !== 'designer') {
      return;
    }

    const designerBindingsReady = !bindingCatalogQuery.isLoading && !schemaMetadataQuery.isLoading;
    const editPayloadReady = !isEditMode || (!templateQuery.isLoading && !draftQuery.isLoading);

    if (!designerBindingsReady || !editPayloadReady) {
      return;
    }

    screenReadyReportedRef.current = true;
    reportScreenReady('initial-screen');
  }, [
    activeTab,
    bindingCatalogQuery.isLoading,
    draftQuery.isLoading,
    isEditMode,
    reportScreenReady,
    schemaMetadataQuery.isLoading,
    templateQuery.isLoading,
  ]);

  useEffect(() => {
    setPageTitle(
      isEditMode
        ? t('sidebar.erpBarcodeDesignerEdit', { defaultValue: 'Missing translation' })
        : t('sidebar.erpBarcodeDesignerCreate', { defaultValue: 'Missing translation' }),
    );
    return () => setPageTitle(null);
  }, [isEditMode, setPageTitle, t]);

  useEffect(() => {
    const template = templateQuery.data?.data;
    if (!template) return;

    setTemplateRequest({
      templateCode: template.templateCode,
      displayName: template.displayName,
      labelType: template.labelType,
      width: template.width,
      height: template.height,
      dpi: template.dpi,
      engineType: template.engineType,
      isActive: template.isActive,
    });
  }, [templateQuery.data?.data]);

  useEffect(() => {
    setDocumentState((current) => {
      if (
        current.canvas.width === templateRequest.width
        && current.canvas.height === templateRequest.height
        && current.canvas.dpi === templateRequest.dpi
      ) {
        return current;
      }

      const nextDocument = {
        ...current,
        canvas: {
          ...current.canvas,
          width: templateRequest.width,
          height: templateRequest.height,
          dpi: templateRequest.dpi,
        },
      };
      setJsonValue(stringifyTemplateDocument(nextDocument));
      return nextDocument;
    });
  }, [templateRequest.dpi, templateRequest.height, templateRequest.width]);

  useEffect(() => {
    const draftJson = draftQuery.data?.data?.templateJson;
    if (!draftJson) return;
    try {
      const parsed = parseTemplateDocument(draftJson);
      setDocumentState(parsed);
      setJsonValue(stringifyTemplateDocument(parsed));
    } catch {
      setDocumentState(DEFAULT_TEMPLATE_DOCUMENT);
      setJsonValue(stringifyTemplateDocument(DEFAULT_TEMPLATE_DOCUMENT));
    }
  }, [draftQuery.data?.data?.templateJson]);

  useEffect(() => {
    const saved = loadBarcodeDesignerDefaults();
    if (!saved) {
      return;
    }

    setRecommendationContext({
      branchCode: saved.branchCode || DEFAULT_RECOMMENDATION_CONTEXT.branchCode,
      customerType: saved.customerType || DEFAULT_RECOMMENDATION_CONTEXT.customerType,
      processType: saved.processType || DEFAULT_RECOMMENDATION_CONTEXT.processType,
    });

    if (saved.preferredPresetId) {
      const preset = BARCODE_TEMPLATE_PRESETS.find((item) => item.id === saved.preferredPresetId);
      if (preset) {
        setSelectedPresetCategory(preset.category);
        setSelectedPresetId(preset.id);
      }
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDeferredInsightsEnabled(true);
    }, 600);

    return () => window.clearTimeout(timer);
  }, []);

  const selectedElement = useMemo(
    () => documentState.elements.find((item) => item.id === selectedElementId),
    [documentState.elements, selectedElementId],
  );
  const selectedElements = useMemo(
    () => documentState.elements.filter((item) => selectedElementIds.includes(item.id)),
    [documentState.elements, selectedElementIds],
  );

  useEffect(() => {
    const validIds = new Set(documentState.elements.map((item) => item.id));
    setSelectedElementIds((current) => {
      return current.filter((id) => validIds.has(id));
    });

    if (selectedElementId == null) {
      return;
    }

    if (validIds.has(selectedElementId)) {
      return;
    }

    setSelectedElementId(documentState.elements[0]?.id ?? null);
  }, [documentState.elements, selectedElementId]);

  const filteredPresets = useMemo(
    () => BARCODE_TEMPLATE_PRESETS.filter((item) => item.category === selectedPresetCategory),
    [selectedPresetCategory],
  );

  const recommendedPresets = useMemo(() => {
    const printJobs = printJobsQuery.data?.data ?? [];
    const usageMap = new Map<string, number>();
    for (const job of printJobs) {
      if (!job.sourceModule) {
        continue;
      }
      usageMap.set(job.sourceModule, (usageMap.get(job.sourceModule) ?? 0) + 1);
    }

    const scorePreset = (presetId: string): number => {
      let score = 0;

      if (recommendationContext.processType === 'shipment' && (presetId === 'sscc-pallet' || presetId === 'logistic-unit')) {
        score += 3;
      }

      if (recommendationContext.processType === 'warehouse-inbound' && presetId === 'product-basic') {
        score += 3;
      }

      if (recommendationContext.processType === 'transfer' && presetId === 'logistic-unit') {
        score += 3;
      }

      if (recommendationContext.customerType === 'gs1' && (presetId === 'gs1-carton' || presetId === 'sscc-pallet')) {
        score += 4;
      }

      if (recommendationContext.customerType === 'retail' && presetId === 'gs1-carton') {
        score += 2;
      }

      if (recommendationContext.branchCode !== '0' && presetId === 'logistic-unit') {
        score += 1;
      }

      if (presetId === 'product-basic') {
        score += usageMap.get('goods-receipt') ?? 0;
        score += usageMap.get('warehouse-inbound') ?? 0;
      }

      if (presetId === 'logistic-unit') {
        score += usageMap.get('transfer') ?? 0;
        score += usageMap.get('warehouse-outbound') ?? 0;
      }

      if (presetId === 'sscc-pallet') {
        score += usageMap.get('shipment') ?? 0;
        score += usageMap.get('package') ?? 0;
      }

      if (presetId === 'gs1-carton') {
        score += usageMap.get('shipment') ?? 0;
        score += usageMap.get('subcontracting-issue') ?? 0;
      }

      const savedDefaults = loadBarcodeDesignerDefaults();
      if (savedDefaults?.preferredPresetId === presetId) {
        score += 5;
      }

      return score;
    };

    return BARCODE_TEMPLATE_PRESETS
      .map((item) => ({ ...item, score: scorePreset(item.id) }))
      .sort((left, right) => right.score - left.score)
      .slice(0, 3);
  }, [printJobsQuery.data?.data, recommendationContext]);

  const activePreset = useMemo(
    () => BARCODE_TEMPLATE_PRESETS.find((item) => item.id === selectedPresetId) ?? BARCODE_TEMPLATE_PRESETS[0],
    [selectedPresetId],
  );

  const validationIssues = useMemo(
    () => validateBarcodeTemplate(documentState),
    [documentState],
  );
  const hasBlockingValidationIssue = useMemo(
    () => validationIssues.some((item) => item.level === 'error'),
    [validationIssues],
  );
  const bindingCatalogGroups = useMemo(() => {
    if ((schemaMetadataQuery.data?.data?.entities ?? []).length > 0) {
      return schemaMetadataQuery.data!.data!.entities.map((entity) => ({
        groupKey: entity.entityKey,
        groupLabel: entity.entityLabel,
        fields: entity.fields,
      }));
    }

    if ((bindingCatalogQuery.data?.data ?? []).length > 0) {
      return bindingCatalogQuery.data?.data ?? [];
    }

    return [
      {
        groupKey: 'fallback',
        groupLabel: 'Hazir Alanlar',
        fields: BARCODE_BINDING_FIELDS.map((item) => ({
          key: item.key,
          label: item.label,
          path: item.path,
          sampleValue: item.sample,
          targetType: item.target,
          sourceType: 'fallback',
          providerKey: 'fallback-provider',
          providerLabel: 'Fallback Provider',
        })),
      },
    ];
  }, [bindingCatalogQuery.data?.data, schemaMetadataQuery.data?.data?.entities]);
  const selectedElementTarget = useMemo<'text' | 'barcode' | 'image' | null>(() => {
    if (!selectedElement) {
      return null;
    }

    if (selectedElement.type === 'text') return 'text';
    if (selectedElement.type === 'barcode') return 'barcode';
    if (selectedElement.type === 'image') return 'image';
    return null;
  }, [selectedElement]);
  const filteredBindingExplorerGroups = useMemo(() => {
    return bindingCatalogGroups
      .map((group) => ({
        ...group,
        fields: group.fields.filter((field) => {
          const matchesTarget = !selectedElementTarget || field.targetType === selectedElementTarget;
          const matchesSearch = !schemaSearch.trim()
            || field.label.toLocaleLowerCase('tr-TR').includes(schemaSearch.trim().toLocaleLowerCase('tr-TR'))
            || field.key.toLocaleLowerCase('tr-TR').includes(schemaSearch.trim().toLocaleLowerCase('tr-TR'))
            || field.path.toLocaleLowerCase('tr-TR').includes(schemaSearch.trim().toLocaleLowerCase('tr-TR'));
          return matchesTarget && matchesSearch;
        }),
      }))
      .filter((group) => group.fields.length > 0);
  }, [bindingCatalogGroups, schemaSearch, selectedElementTarget]);
  const bindingExplorerTrees = useMemo(() => {
    return filteredBindingExplorerGroups.map((group) => ({
      ...group,
      tree: buildBindingFieldTree(group.fields),
    }));
  }, [filteredBindingExplorerGroups]);
  const schemaEntities = useMemo<BarcodeSchemaEntity[]>(() => {
    return schemaMetadataQuery.data?.data?.entities ?? [];
  }, [schemaMetadataQuery.data?.data?.entities]);
  const frequentFields = useMemo<BarcodeBindingField[]>(() => {
    return schemaMetadataQuery.data?.data?.frequentFields ?? [];
  }, [schemaMetadataQuery.data?.data?.frequentFields]);
  const fieldTargetHint = useMemo(() => {
    return selectedElementTarget
      ? `Secili ${selectedElementTarget} elemana gore alanlar filtreleniyor.`
      : 'Her alan icin en uygun text / barcode / image tipi otomatik onerilir.';
  }, [selectedElementTarget]);

  const createTemplateMutation = useMutation({
    mutationFn: async () => await barcodeDesignerApi.createTemplate(templateRequest),
    onSuccess: (response) => {
      const nextId = response.data?.id ? Number(response.data.id) : null;
      toast.success(response.message || 'Template olusturuldu');
      void queryClient.invalidateQueries({ queryKey: ['barcode-designer-templates'] });
      if (nextId) {
        navigate(`/erp/barcode-designer/${nextId}/edit`);
      } else {
        navigate('/erp/barcode-designer');
      }
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Template olusturulamadi');
    },
  });

  const updateTemplateMutation = useMutation({
    mutationFn: async () => await barcodeDesignerApi.updateTemplate(activeTemplateId!, templateRequest),
    onSuccess: (response) => {
      toast.success(response.message || 'Template guncellendi');
      void queryClient.invalidateQueries({ queryKey: ['barcode-designer-templates'] });
      void queryClient.invalidateQueries({ queryKey: ['barcode-designer-template', activeTemplateId] });
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Template guncellenemedi');
    },
  });

  const saveDraftMutation = useMutation({
    mutationFn: async () => {
      if (!activeTemplateId) {
        throw new Error('Once template olusturulmasi gerekiyor.');
      }

      return await barcodeDesignerApi.saveDraft(activeTemplateId, {
        templateId: activeTemplateId,
        versionNo: draftQuery.data?.data?.versionNo ?? 0,
        templateJson: jsonValue,
        notes: 'Designer draft save',
      });
    },
    onSuccess: (response) => {
      toast.success(response.message || 'Draft kaydedildi');
      void queryClient.invalidateQueries({ queryKey: ['barcode-designer-draft', activeTemplateId] });
      void queryClient.invalidateQueries({ queryKey: ['barcode-designer-templates'] });
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Draft kaydedilemedi');
    },
  });

  const previewMutation = useMutation({
    mutationFn: async () => await barcodeDesignerApi.preview({
      templateId: activeTemplateId,
      templateJson: jsonValue,
      sampleData: {
        stockCode: documentState.bindings.stockCode ?? 'STK-2026-001',
        stockName: documentState.bindings.stockName ?? 'Camasir Makinesi Motor',
        serialNo: documentState.bindings.serialNo ?? 'SN-000245',
      },
    }),
    onSuccess: (response) => {
      toast.success(response.message || 'Preview hazirlandi');
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Preview hazirlanamadi');
    },
  });

  const publishMutation = useMutation({
    mutationFn: async (versionId: number) => await barcodeDesignerApi.publishVersion(activeTemplateId!, versionId),
    onSuccess: (response) => {
      toast.success(response.message || 'Versiyon yayınlandı');
      void queryClient.invalidateQueries({ queryKey: ['barcode-designer-versions', activeTemplateId] });
      void queryClient.invalidateQueries({ queryKey: ['barcode-designer-template', activeTemplateId] });
      void queryClient.invalidateQueries({ queryKey: ['barcode-designer-templates'] });
      if (response.data?.id) {
        complianceReportMutation.mutate(Number(response.data.id));
      }
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Versiyon yayınlanamadı');
    },
  });

  const complianceReportMutation = useMutation({
    mutationFn: async (versionId: number) => await barcodeDesignerApi.getComplianceReport(activeTemplateId!, versionId),
    onSuccess: (response) => {
      if (response.data) {
        setLastComplianceReport(response.data);
      }
      toast.success(response.message || 'Uyum raporu uretildi');
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Uyum raporu uretilemedi');
    },
  });

  const upsertTemplateProfileMutation = useMutation({
    mutationFn: async (payload: { printerProfileId: number; isDefault: boolean }) =>
      await printerManagementApi.upsertTemplatePrinterProfile({
        barcodeTemplateId: activeTemplateId!,
        printerProfileId: payload.printerProfileId,
        isDefault: payload.isDefault,
      }),
    onSuccess: (response) => {
      toast.success(response.message || 'Template printer profile eslemesi kaydedildi');
      void queryClient.invalidateQueries({ queryKey: ['barcode-designer-template-printer-profiles', activeTemplateId] });
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Template printer profile eslemesi kaydedilemedi');
    },
  });

  const gs1BuildMutation = useMutation({
    mutationFn: async () => await barcodeDesignerApi.buildGs1({
      elements: gs1Elements.filter((item) => item.applicationIdentifier.trim() && item.value.trim()),
    }),
    onSuccess: (response) => {
      const result = response.data;
      if (!result) {
        toast.error('GS1 sonucu alinamadi');
        return;
      }

      updateDocumentState({
        ...documentState,
        bindings: {
          ...documentState.bindings,
          'gs1.value': result.barcodeValue,
          'gs1.hri': result.humanReadable,
        },
      });

      toast.success(result.isValid ? 'GS1 payload olusturuldu' : 'GS1 dogrulamasi tamamlandi');
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'GS1 payload olusturulamadi');
    },
  });

  const handleJsonApply = (): void => {
    try {
      const parsed = parseTemplateDocument(jsonValue);
      setDocumentState(parsed);
      if (!parsed.elements.some((item) => item.id === selectedElementId)) {
        setSelectedElementId(parsed.elements[0]?.id ?? null);
        setSelectedElementIds(parsed.elements[0]?.id ? [parsed.elements[0].id] : []);
      }
      toast.success('Template JSON uygulandi');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Template JSON gecersiz');
    }
  };

  const handleApplyPreset = (): void => {
    const preset = BARCODE_TEMPLATE_PRESETS.find((item) => item.id === selectedPresetId);
    if (!preset) {
      return;
    }

    setTemplateRequest((current) => ({
      ...current,
      labelType: preset.labelType,
      displayName: current.displayName.trim() ? current.displayName : preset.displayName,
      width: preset.document.canvas.width,
      height: preset.document.canvas.height,
      dpi: preset.document.canvas.dpi,
    }));

    setDocumentState(preset.document);
    setJsonValue(stringifyTemplateDocument(preset.document));
    setSelectedElementId(preset.document.elements[0]?.id ?? null);
    setSelectedElementIds(preset.document.elements[0]?.id ? [preset.document.elements[0].id] : []);
    setSelectedPresetCategory(preset.category);
    saveBarcodeDesignerDefaults({
      ...recommendationContext,
      preferredPresetId: preset.id,
    });
    toast.success(`${preset.displayName} preset'i uygulandi`);
  };

  const handleApplyLogisticWizard = (): void => {
    const isPallet = selectedPresetCategory === 'pallet';
    const nextGs1Elements = isPallet
      ? [
          { applicationIdentifier: '00', value: logisticWizard.sscc },
          { applicationIdentifier: '01', value: logisticWizard.gtin },
          { applicationIdentifier: '37', value: logisticWizard.count },
          { applicationIdentifier: '410', value: logisticWizard.shipTo },
        ]
      : [
          { applicationIdentifier: '01', value: logisticWizard.gtin },
          { applicationIdentifier: '10', value: logisticWizard.lotNo },
          { applicationIdentifier: '17', value: logisticWizard.expiryDate },
          { applicationIdentifier: '21', value: logisticWizard.serialNo },
        ];

    setGs1Elements(nextGs1Elements);
    updateDocumentState({
      ...documentState,
      bindings: {
        ...documentState.bindings,
        shipTo: logisticWizard.shipTo,
        count: logisticWizard.count,
        gtin: logisticWizard.gtin,
        lotNo: logisticWizard.lotNo,
        expiryDate: logisticWizard.expiryDate,
        shipmentNo: logisticWizard.shipmentNo,
        warehouseCode: logisticWizard.warehouseCode,
        locationCode: logisticWizard.locationCode,
        customerName: logisticWizard.customerName,
        stockName: logisticWizard.stockName,
        serialNo: logisticWizard.serialNo,
      },
    });
    toast.success('Wizard alanlari preset baglamina yerlestirildi. Sonraki adimda GS1 uret.');
  };

  const handleSelectElement = (elementId: string, options?: { additive?: boolean }): void => {
    setSelectedElementId(elementId);
    setArrangementGuides({ x: [], y: [] });
    setSelectedElementIds((current) => {
      if (!options?.additive) {
        return [elementId];
      }

      if (current.includes(elementId)) {
        const next = current.filter((id) => id !== elementId);
        return next.length > 0 ? next : [elementId];
      }

      return [...current, elementId];
    });
  };

  const handleClearSelection = (): void => {
    setSelectedElementId(null);
    setSelectedElementIds([]);
    setArrangementGuides({ x: [], y: [] });
  };

  const handleMoveElement = (elementId: string, x: number, y: number): void => {
    const nextDocument: BarcodeDesignerTemplateDocument = {
      ...documentState,
      elements: documentState.elements.map((item) => (item.id === elementId ? { ...item, x: snapToGridPx(x), y: snapToGridPx(y) } : item)),
    };
    setDocumentState(nextDocument);
    setJsonValue(stringifyTemplateDocument(nextDocument));
  };

  const handleResizeElement = (elementId: string, width: number, height: number, x: number, y: number): void => {
    const nextDocument: BarcodeDesignerTemplateDocument = {
      ...documentState,
      elements: documentState.elements.map((item) => {
        if (item.id !== elementId) {
          return item;
        }

        if (item.type === 'line') {
          return {
            ...item,
            x: snapToGridPx(x),
            y: snapToGridPx(y),
            points: [0, 0, snapToGridPx(width), 0],
          };
        }

        if ('width' in item && 'height' in item) {
          return {
            ...item,
            x: snapToGridPx(x),
            y: snapToGridPx(y),
            width: snapToGridPx(width),
            height: snapToGridPx(height),
          };
        }

        return item;
      }),
    };

    updateDocumentState(nextDocument);
  };

  const handleDeleteSelectedElement = (): void => {
    if (!selectedElementId) {
      return;
    }

    const nextElements = documentState.elements.filter((item) => item.id !== selectedElementId);
    const nextSelectedId = nextElements[0]?.id ?? null;
    const nextDocument = {
      ...documentState,
      elements: nextElements,
    };

    updateDocumentState(nextDocument);
    setSelectedElementId(nextSelectedId);
    setSelectedElementIds(nextSelectedId ? [nextSelectedId] : []);
    toast.success('Secili eleman silindi');
  };

  const handleDuplicateSelectedElement = (): void => {
    if (!selectedElement) {
      return;
    }

    const duplicateId = `${selectedElement.type}-copy-${Date.now()}`;
    const nextX = snapToGridPx(selectedElement.x + cmToPx(0.5));
    const nextY = snapToGridPx(selectedElement.y + cmToPx(0.5));
    const duplicate = { ...selectedElement, id: duplicateId, x: nextX, y: nextY };
    const nextDocument = {
      ...documentState,
      elements: [...documentState.elements, duplicate],
    };

    updateDocumentState(nextDocument);
    setSelectedElementId(duplicateId);
    setSelectedElementIds([duplicateId]);
    toast.success('Secili eleman kopyalandi');
  };

  const handleNudgeSelectedElement = (xDeltaCm: number, yDeltaCm: number): void => {
    if (!selectedElement) {
      return;
    }

    const canvasWidth = cmToPx(mmToCm(documentState.canvas.width));
    const canvasHeight = cmToPx(mmToCm(documentState.canvas.height));
    handleUpdateSelectedElement((element) => {
      const box = getElementBox(element);
      const maxX = Math.max(0, canvasWidth - box.width);
      const maxY = Math.max(0, canvasHeight - box.height);
      return {
        ...element,
        x: snapToGridPx(Math.min(Math.max(element.x + cmToPx(xDeltaCm), 0), maxX)),
        y: snapToGridPx(Math.min(Math.max(element.y + cmToPx(yDeltaCm), 0), maxY)),
      };
    });
  };

  const handleCenterSelectedElement = (axis: 'horizontal' | 'vertical'): void => {
    if (!selectedElement) {
      return;
    }

    const canvasWidth = cmToPx(mmToCm(documentState.canvas.width));
    const canvasHeight = cmToPx(mmToCm(documentState.canvas.height));
    handleUpdateSelectedElement((element) => {
      const box = getElementBox(element);
      if (axis === 'horizontal') {
        return {
          ...element,
          x: snapToGridPx((canvasWidth - box.width) / 2),
        };
      }

      return {
        ...element,
        y: snapToGridPx((canvasHeight - box.height) / 2),
      };
    });
  };

  const handleApplyTextPreset = (preset: 'title' | 'body' | 'caption'): void => {
    handleUpdateSelectedElement((element) => {
      if (element.type !== 'text') {
        return element;
      }

      if (preset === 'title') {
        return {
          ...element,
          fontSize: 20,
          width: cmToPx(8),
          height: cmToPx(1),
          text: element.text.startsWith('{{') ? element.text : 'Ana Baslik',
        };
      }

      if (preset === 'caption') {
        return {
          ...element,
          fontSize: 10,
          width: cmToPx(5),
          height: cmToPx(0.7),
          text: element.text.startsWith('{{') ? element.text : 'Kucuk Etiket',
        };
      }

      return {
        ...element,
        fontSize: 14,
        width: cmToPx(6.5),
        height: cmToPx(0.8),
        text: element.text.startsWith('{{') ? element.text : 'Aciklama Alani',
      };
    });
    toast.success('Text preset uygulandi');
  };

  const handleApplyBarcodePreset = (preset: 'code128' | 'qrcode' | 'datamatrix'): void => {
    handleUpdateSelectedElement((element) => {
      if (element.type !== 'barcode') {
        return element;
      }

      if (preset === 'qrcode') {
        return {
          ...element,
          barcodeType: 'qrcode',
          width: cmToPx(3),
          height: cmToPx(3),
        };
      }

      if (preset === 'datamatrix') {
        return {
          ...element,
          barcodeType: 'datamatrix',
          width: cmToPx(2.8),
          height: cmToPx(2.8),
        };
      }

      return {
        ...element,
        barcodeType: 'code128',
        width: cmToPx(6),
        height: cmToPx(1.8),
      };
    });
    toast.success('Barcode preset uygulandi');
  };

  const handleApplyImagePreset = (preset: 'logo' | 'product'): void => {
    handleUpdateSelectedElement((element) => {
      if (element.type !== 'image') {
        return element;
      }

      if (preset === 'logo') {
        return {
          ...element,
          width: cmToPx(2.5),
          height: cmToPx(1.4),
        };
      }

      return {
        ...element,
        width: cmToPx(4),
        height: cmToPx(3),
      };
    });
    toast.success('Image preset uygulandi');
  };

  const renderSchemaEntityIcon = (iconKey: string): ReactElement => {
    switch (iconKey) {
      case 'package':
        return <Package2 className="size-4 text-amber-600 dark:text-amber-300" />;
      case 'building':
        return <Layers3 className="size-4 text-cyan-600 dark:text-cyan-300" />;
      case 'truck':
        return <Package2 className="size-4 text-emerald-600 dark:text-emerald-300" />;
      case 'scan':
        return <ScanLine className="size-4 text-sky-600 dark:text-sky-300" />;
      case 'workflow':
        return <Sparkles className="size-4 text-violet-600 dark:text-violet-300" />;
      default:
        return <Package2 className="size-4 text-slate-500 dark:text-slate-300" />;
    }
  };

  const updateDocumentState = (nextDocument: BarcodeDesignerTemplateDocument): void => {
    setDocumentState(nextDocument);
    setJsonValue(stringifyTemplateDocument(nextDocument));
  };

  const applySelectionArrangement = (
    updater: (elements: BarcodeDesignerElement[]) => BarcodeDesignerElement[],
    guides: { x?: number[]; y?: number[] } = {},
  ): void => {
    if (selectedElementIds.length === 0) {
      return;
    }

    const selectedIdSet = new Set(selectedElementIds);
    const selected = documentState.elements.filter((item) => selectedIdSet.has(item.id));
    if (selected.length === 0) {
      return;
    }

    const updatedSelected = updater(selected);
    const updatedMap = new Map(updatedSelected.map((item) => [item.id, item]));
    updateDocumentState({
      ...documentState,
      elements: documentState.elements.map((item) => updatedMap.get(item.id) ?? item),
    });
    setArrangementGuides({
      x: guides.x ?? [],
      y: guides.y ?? [],
    });
  };

  const handleAlignSelection = (mode: 'top' | 'bottom' | 'middle'): void => {
    if (selectedElements.length < 2) {
      return;
    }

    const boxes = selectedElements.map(getElementBox);
    const top = Math.min(...boxes.map((box) => box.y));
    const bottom = Math.max(...boxes.map((box) => box.y + box.height));
    const middle = top + ((bottom - top) / 2);

    applySelectionArrangement(
      (elements) => elements.map((element) => {
        const box = getElementBox(element);
        if (mode === 'top') {
          return { ...element, y: top };
        }

        if (mode === 'bottom') {
          return { ...element, y: bottom - box.height };
        }

        return { ...element, y: middle - (box.height / 2) };
      }),
      { y: [mode === 'top' ? top : mode === 'bottom' ? bottom : middle] },
    );
    toast.success(`Secili elemanlar ${mode === 'top' ? 'ust' : mode === 'bottom' ? 'alt' : 'orta'} cizgide hizalandi`);
  };

  const handleAlignHorizontalSelection = (mode: 'left' | 'center' | 'right'): void => {
    if (selectedElements.length < 2) {
      return;
    }

    const boxes = selectedElements.map(getElementBox);
    const left = Math.min(...boxes.map((box) => box.x));
    const right = Math.max(...boxes.map((box) => box.x + box.width));
    const center = left + ((right - left) / 2);

    applySelectionArrangement(
      (elements) => elements.map((element) => {
        const box = getElementBox(element);
        if (mode === 'left') {
          return { ...element, x: left };
        }

        if (mode === 'right') {
          return { ...element, x: right - box.width };
        }

        return { ...element, x: center - (box.width / 2) };
      }),
      { x: [mode === 'left' ? left : mode === 'right' ? right : center] },
    );
    toast.success(`Secili elemanlar ${mode === 'left' ? 'sol' : mode === 'right' ? 'sag' : 'merkez'} hizada toplandi`);
  };

  const handleDistributeSelection = (orientation: 'horizontal' | 'vertical', strategy: 'edge' | 'center' = 'edge'): void => {
    if (selectedElements.length < 3) {
      return;
    }

    const sorted = [...selectedElements].sort((left, right) =>
      orientation === 'horizontal' ? left.x - right.x : left.y - right.y,
    );
    const nextPositions = new Map<string, number>();
    let guideValues: number[];

    if (strategy === 'center') {
      const centers = sorted.map((element) => {
        const box = getElementBox(element);
        return orientation === 'horizontal'
          ? box.x + (box.width / 2)
          : box.y + (box.height / 2);
      });
      const firstCenter = centers[0];
      const lastCenter = centers[centers.length - 1];
      const centerGap = (lastCenter - firstCenter) / (sorted.length - 1);

      sorted.forEach((element, index) => {
        const box = getElementBox(element);
        const targetCenter = firstCenter + (centerGap * index);
        nextPositions.set(
          element.id,
          orientation === 'horizontal'
            ? targetCenter - (box.width / 2)
            : targetCenter - (box.height / 2),
        );
      });

      guideValues = sorted.map((_, index) => firstCenter + (centerGap * index));
    } else {
      const firstBox = getElementBox(sorted[0]);
      const lastBox = getElementBox(sorted[sorted.length - 1]);
      const totalSize = sorted.reduce((sum, element) => {
        const box = getElementBox(element);
        return sum + (orientation === 'horizontal' ? box.width : box.height);
      }, 0);
      const span = orientation === 'horizontal'
        ? (lastBox.x + lastBox.width) - firstBox.x
        : (lastBox.y + lastBox.height) - firstBox.y;

      const gap = (span - totalSize) / (sorted.length - 1);
      let cursor = orientation === 'horizontal' ? firstBox.x : firstBox.y;

      for (const element of sorted) {
        const box = getElementBox(element);
        nextPositions.set(element.id, cursor);
        cursor += (orientation === 'horizontal' ? box.width : box.height) + gap;
      }

      guideValues = Array.from(nextPositions.values());
    }

    applySelectionArrangement(
      (elements) => elements.map((element) => {
        const nextPosition = nextPositions.get(element.id);
        if (nextPosition == null) {
          return element;
        }

        return orientation === 'horizontal'
          ? { ...element, x: nextPosition }
          : { ...element, y: nextPosition };
      }),
      orientation === 'horizontal' ? { x: guideValues } : { y: guideValues },
    );
    toast.success(`Secili elemanlar ${orientation === 'horizontal' ? 'yatay' : 'dikey'} ${strategy === 'center' ? 'merkez' : 'kenar'} bazli dagitildi`);
  };

  const handleResizeSelection = (dimension: 'width' | 'height'): void => {
    if (selectedElements.length < 2) {
      return;
    }

    const anchor = selectedElement ?? selectedElements[0];
    if (!anchor || !('width' in anchor) || !('height' in anchor)) {
      return;
    }

    const anchorValue = dimension === 'width' ? anchor.width : anchor.height;
    applySelectionArrangement((elements) => elements.map((element) => {
      if (!('width' in element) || !('height' in element)) {
        return element;
      }

      return dimension === 'width'
        ? { ...element, width: anchorValue }
        : { ...element, height: anchorValue };
    }));
    toast.success(`Secili elemanlarin ${dimension === 'width' ? 'genislik' : 'yukseklik'} degeri esitlendi`);
  };

  const handleUpdateSelectedElement = (updater: (element: BarcodeDesignerElement) => BarcodeDesignerElement): void => {
    if (!selectedElementId) {
      return;
    }

    const nextDocument: BarcodeDesignerTemplateDocument = {
      ...documentState,
      elements: documentState.elements.map((item) => (item.id === selectedElementId ? updater(item) : item)),
    };
    updateDocumentState(nextDocument);
  };

  const handleBindingValueChange = (bindingKey: string, value: string): void => {
    updateDocumentState({
      ...documentState,
      bindings: {
        ...documentState.bindings,
        [bindingKey]: value,
      },
    });
  };

  const handleApplyBindingField = (bindingKey: string, sample: string, target: 'text' | 'barcode' | 'image'): void => {
    handleBindingValueChange(bindingKey, sample);

    if (!selectedElement) {
      return;
    }

    if (target === 'text' && selectedElement.type === 'text') {
      handleUpdateSelectedElement((element) => (
        element.type === 'text' ? { ...element, text: `{{${bindingKey}}}` } : element
      ));
      return;
    }

    if (target === 'barcode' && selectedElement.type === 'barcode') {
      handleUpdateSelectedElement((element) => (
        element.type === 'barcode' ? { ...element, binding: bindingKey } : element
      ));
      return;
    }

    if (target === 'image' && selectedElement.type === 'image') {
      handleUpdateSelectedElement((element) => (
        element.type === 'image' ? { ...element, src: `{{${bindingKey}}}` } : element
      ));
    }
  };

  const handleBindOrCreateField = (
    bindingKey: string,
    sample: string,
    target: 'text' | 'barcode' | 'image',
    fieldMeta?: Pick<BarcodeBindingField, 'label' | 'path'>,
  ): void => {
    if (selectedElement && selectedElementTarget === target) {
      handleApplyBindingField(bindingKey, sample, target);
      toast.success('Alan secili elemana baglandi');
      return;
    }

    const placement = getSmartPlacementFromSelection(documentState, selectedElement, target);
    const nextElement = createBoundElementFromField(documentState, {
      key: bindingKey,
      label: fieldMeta?.label ?? bindingKey,
      path: fieldMeta?.path ?? bindingKey,
      sampleValue: sample,
      targetType: target,
    }, placement.x, placement.y);

    const nextDocument = {
      ...documentState,
      bindings: {
        ...documentState.bindings,
        [bindingKey]: sample,
      },
      elements: [...documentState.elements, nextElement],
    };
    updateDocumentState(nextDocument);
    setSelectedElementId(nextElement.id);
    setSelectedElementIds([nextElement.id]);
    toast.success("Alan yeni eleman olarak canvas'a eklendi");
  };

  const handleDropBindingField = (field: Pick<BarcodeBindingField, 'key' | 'label' | 'path' | 'sampleValue' | 'targetType'>, x: number, y: number): void => {
    const nextElement = createBoundElementFromField(documentState, field, x, y);
    const nextDocument = {
      ...documentState,
      bindings: {
        ...documentState.bindings,
        [field.key]: field.sampleValue,
      },
      elements: [...documentState.elements, nextElement],
    };

    updateDocumentState(nextDocument);
    setSelectedElementId(nextElement.id);
    setSelectedElementIds([nextElement.id]);
    toast.success("Alan surukle-birak ile canvas'a eklendi");
  };

  const handleCreateFieldElement = (
    field: Pick<BarcodeBindingField, 'key' | 'label' | 'path' | 'sampleValue' | 'targetType'>,
    targetType?: 'text' | 'barcode' | 'image',
  ): void => {
    const effectiveTarget = targetType ?? field.targetType;
    const placement = getSmartPlacementFromSelection(documentState, selectedElement, effectiveTarget);
    const nextElement = createBoundElementFromField(documentState, {
      ...field,
      targetType: effectiveTarget,
    }, placement.x, placement.y);

    const nextDocument = {
      ...documentState,
      bindings: {
        ...documentState.bindings,
        [field.key]: field.sampleValue,
      },
      elements: [...documentState.elements, nextElement],
    };

    updateDocumentState(nextDocument);
    setSelectedElementId(nextElement.id);
    setSelectedElementIds([nextElement.id]);
    toast.success(`${field.label} alani eklendi ve secildi`);
  };

  const handleBindingPickerConfirm = (payload: {
    header: BarcodeSourceHeaderOption;
    line?: BarcodeSourceLineOption | null;
    packageItem?: BarcodeSourcePackageOption | null;
  }): void => {
    setSelectedBindingHeader(payload.header);
    setSelectedBindingLine(payload.line ?? null);
    setSelectedBindingPackage(payload.packageItem ?? null);
    setBindingContext({
      sourceModule: payload.header.sourceModule,
      sourceHeaderId: String(payload.header.id),
      sourceLineId: String(payload.line?.id ?? payload.packageItem?.id ?? ''),
    });
    toast.success('Belge baglami designer icine uygulandi');
  };

  const handleAddElement = (type: 'text' | 'barcode' | 'rect' | 'line' | 'image' | 'qrcode' | 'datamatrix'): void => {
    const nextId = `${type}-${Date.now()}`;
    const effectiveTarget: 'text' | 'barcode' | 'image' =
      type === 'text' ? 'text' : type === 'image' ? 'image' : 'barcode';
    const placement = getSmartPlacementFromSelection(documentState, selectedElement, effectiveTarget);
    const nextElement: BarcodeDesignerElement =
      type === 'text'
        ? {
            id: nextId,
            type,
            x: placement.x ?? 24,
            y: placement.y ?? 24,
            width: 180,
            height: 24,
            fontSize: 14,
            text: 'Yeni Text',
          }
        : type === 'barcode' || type === 'qrcode' || type === 'datamatrix'
          ? {
              id: nextId,
              type: 'barcode',
              x: placement.x ?? 24,
              y: placement.y ?? 64,
              width: type === 'barcode' ? 240 : 120,
              height: type === 'barcode' ? 72 : 120,
              barcodeType: type === 'barcode' ? 'code128' : type,
              binding: 'stock.barcode',
            }
          : type === 'image'
            ? { id: nextId, type: 'image', x: placement.x ?? 24, y: placement.y ?? 24, width: 120, height: 80, src: 'https://placehold.co/240x160/png' }
          : type === 'rect'
            ? { id: nextId, type, x: placement.x ?? 16, y: placement.y ?? 16, width: 280, height: 180 }
            : { id: nextId, type, x: placement.x ?? 20, y: placement.y ?? 20, points: [0, 0, 180, 0] };

    const nextDocument = {
      ...documentState,
      elements: [...documentState.elements, nextElement],
    };
    setDocumentState(nextDocument);
    setJsonValue(stringifyTemplateDocument(nextDocument));
    setSelectedElementId(nextId);
    setSelectedElementIds([nextId]);
  };

  const handleExportPdf = async (): Promise<void> => {
    const stage = stageRef.current;
    if (!stage) {
      toast.error('Canvas hazir degil');
      return;
    }

    const image = stage.toDataURL({ pixelRatio: 2 });
    const { jsPDF } = await loadJsPdfModule();
    const pdf = new jsPDF({
      orientation: documentState.canvas.width > documentState.canvas.height ? 'landscape' : 'portrait',
      unit: 'mm',
      format: [documentState.canvas.width, documentState.canvas.height],
    });
    pdf.addImage(image, 'PNG', 0, 0, documentState.canvas.width, documentState.canvas.height);
    pdf.save(`${templateRequest.templateCode || 'barcode-template'}.pdf`);
  };

  const handleExportComplianceReportPdf = async (): Promise<void> => {
    if (!lastComplianceReport) {
      toast.error('Once uyum raporu uret');
      return;
    }

    const { jsPDF } = await loadJsPdfModule();
    const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
    let y = 16;
    pdf.setFontSize(16);
    pdf.text('Barcode Compliance Audit Sheet', 14, y);
    y += 8;
    pdf.setFontSize(10);
    pdf.text(`Template: ${templateRequest.templateCode} / ${templateRequest.displayName}`, 14, y);
    y += 6;
    pdf.text(`Label Type: ${lastComplianceReport.labelType || templateRequest.labelType}`, 14, y);
    y += 6;
    pdf.text(`Summary: ${lastComplianceReport.summary}`, 14, y);
    y += 8;
    pdf.text(`Barcode Count: ${lastComplianceReport.barcodeCount}`, 14, y);
    y += 6;
    pdf.text(`GS1 HRI: ${lastComplianceReport.hasGs1HumanReadableText ? 'Yes' : 'No'}`, 14, y);
    y += 8;

    for (const issue of lastComplianceReport.issues) {
      const lines = pdf.splitTextToSize(`- [${issue.level.toUpperCase()}] ${issue.message}`, 180);
      pdf.text(lines, 14, y);
      y += lines.length * 5;
      if (y > 280) {
        pdf.addPage();
        y = 16;
      }
    }

    if (lastComplianceReport.issues.length === 0) {
      pdf.text('No compliance issues found.', 14, y);
    }

    pdf.save(`${templateRequest.templateCode || 'barcode-template'}-compliance-report.pdf`);
  };

  return (
    <div className="crm-page space-y-6">
      <Breadcrumb
        items={[
          { label: t('sidebar.erp', { defaultValue: 'Missing translation' }) },
          { label: t('sidebar.erpBarcodeDesigner', { defaultValue: 'Missing translation' }) },
          {
            label: isEditMode
              ? t('sidebar.erpBarcodeDesignerEdit', { defaultValue: 'Missing translation' })
              : t('sidebar.erpBarcodeDesignerCreate', { defaultValue: 'Missing translation' }),
            isActive: true,
          },
        ]}
      />

      <section className="rounded-3xl border border-slate-200/80 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.18),_transparent_32%),linear-gradient(135deg,_rgba(255,255,255,0.96),_rgba(241,245,249,0.92))] p-6 shadow-sm dark:border-white/10 dark:bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.18),_transparent_30%),linear-gradient(135deg,_rgba(15,23,42,0.96),_rgba(15,23,42,0.88))]">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline">{t('sidebar.erp', { defaultValue: 'Missing translation' })}</Badge>
              <Badge variant="secondary">{isEditMode ? 'Update' : 'Create'}</Badge>
              <Badge variant="secondary">Designer</Badge>
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">
                {isEditMode
                  ? t('sidebar.erpBarcodeDesignerEdit', { defaultValue: 'Missing translation' })
                  : t('sidebar.erpBarcodeDesignerCreate', { defaultValue: 'Missing translation' })}
              </h1>
              <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                Template bilgisini yönetin, canvas üzerinde label tasarlayın, JSON draft saklayın ve preview/export akışını tek yerden yönetin.
              </p>
            </div>
          </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="sm:col-span-3 rounded-2xl border border-slate-200/80 bg-white/70 p-4 dark:border-white/10 dark:bg-white/4">
                <div className="mb-4 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-slate-900/30">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium text-slate-900 dark:text-white">Akilli Preset Onerisi</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">Sube, musteri ve isleme gore en uygun 3 preset one cikarilir.</div>
                    </div>
                    <Badge variant="outline">Recommendation Layer</Badge>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <Input value={recommendationContext.branchCode} onChange={(event) => setRecommendationContext((current) => ({ ...current, branchCode: event.target.value }))} placeholder="Sube Kodu" />
                    <Select value={recommendationContext.customerType} onValueChange={(value) => setRecommendationContext((current) => ({ ...current, customerType: value }))}>
                      <SelectTrigger><SelectValue placeholder="Musteri tipi" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">Standart</SelectItem>
                        <SelectItem value="gs1">GS1</SelectItem>
                        <SelectItem value="retail">Retail</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={recommendationContext.processType} onValueChange={(value) => setRecommendationContext((current) => ({ ...current, processType: value }))}>
                      <SelectTrigger><SelectValue placeholder="Surec tipi" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="warehouse-inbound">Ambar Giris</SelectItem>
                        <SelectItem value="shipment">Sevkiyat</SelectItem>
                        <SelectItem value="transfer">Transfer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {recommendedPresets.map((preset, index) => (
                      <Button
                        key={preset.id}
                        type="button"
                        variant={index === 0 ? 'default' : 'outline'}
                        onClick={() => {
                          setSelectedPresetCategory(preset.category);
                          setSelectedPresetId(preset.id);
                        }}
                      >
                        {index + 1}. {preset.displayName}
                      </Button>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => saveBarcodeDesignerDefaults({ ...recommendationContext, preferredPresetId: selectedPresetId })}
                    >
                      Varsayilan Olarak Kaydet
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium text-slate-900 dark:text-white">Hazir Template Galerisi</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Koli, palet ve lojistik etiketlerini wizard mantigi ile hizli baslat.</div>
                  </div>
                  <Badge variant="secondary">3 Adimli Wizard</Badge>
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-4">
                  {(['product', 'carton', 'pallet', 'logistic'] as const).map((category) => (
                    <Button
                      key={category}
                      type="button"
                      variant={selectedPresetCategory === category ? 'default' : 'outline'}
                      onClick={() => {
                        setSelectedPresetCategory(category);
                        const fallbackPreset = BARCODE_TEMPLATE_PRESETS.find((item) => item.category === category);
                        if (fallbackPreset) {
                          setSelectedPresetId(fallbackPreset.id);
                        }
                      }}
                    >
                      {category === 'product' ? 'Urun' : category === 'carton' ? 'Koli' : category === 'pallet' ? 'Palet' : 'Lojistik'}
                    </Button>
                  ))}
                </div>

                <div className="mt-4 grid gap-3 lg:grid-cols-2">
                  {filteredPresets.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setSelectedPresetId(preset.id)}
                      className={`rounded-2xl border p-4 text-left transition ${
                        selectedPresetId === preset.id
                          ? 'border-sky-400 bg-sky-50/80 shadow-sm dark:border-sky-500 dark:bg-sky-500/10'
                          : 'border-slate-200/80 bg-white/80 hover:border-slate-300 dark:border-white/10 dark:bg-white/3'
                      }`}
                    >
                      <div className="mb-3">
                        <BarcodeTemplatePresetThumbnail document={preset.document} />
                      </div>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-medium text-slate-900 dark:text-white">{preset.displayName}</div>
                          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{preset.description}</div>
                        </div>
                        <Badge variant="outline">{preset.document.canvas.width}x{preset.document.canvas.height} mm</Badge>
                      </div>
                      <div className="mt-3 text-xs text-slate-600 dark:text-slate-300">
                        {preset.recommendedFor}
                      </div>
                    </button>
                  ))}
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-slate-200/80 px-4 py-3 dark:border-white/10">
                  <div className="text-sm text-slate-600 dark:text-slate-300">
                    <span className="font-medium text-slate-900 dark:text-white">{activePreset?.displayName ?? 'Preset'}</span>
                    {' · '}
                    {activePreset?.recommendedFor ?? 'Secili preset hazir'}
                  </div>
                  <Button variant="outline" onClick={handleApplyPreset} disabled={!canManageTemplate}>
                    Preset Uygula
                  </Button>
                </div>

                {(selectedPresetCategory === 'carton' || selectedPresetCategory === 'pallet' || selectedPresetCategory === 'logistic') ? (
                  <div className="mt-4 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-slate-900/40">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-medium text-slate-900 dark:text-white">GS1 Logistic Label Wizard</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">Preset'e uygun temel alanlari doldur, sonra GS1 payload uret.</div>
                      </div>
                      <Badge variant="secondary">{selectedPresetCategory === 'pallet' ? 'SSCC / Palet' : selectedPresetCategory === 'carton' ? 'Koli' : 'Lojistik'}</Badge>
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <Input value={logisticWizard.gtin} onChange={(event) => setLogisticWizard((current) => ({ ...current, gtin: event.target.value }))} placeholder="GTIN" />
                      <Input value={logisticWizard.sscc} onChange={(event) => setLogisticWizard((current) => ({ ...current, sscc: event.target.value }))} placeholder="SSCC" />
                      <Input value={logisticWizard.lotNo} onChange={(event) => setLogisticWizard((current) => ({ ...current, lotNo: event.target.value }))} placeholder="Lot" />
                      <Input value={logisticWizard.expiryDate} onChange={(event) => setLogisticWizard((current) => ({ ...current, expiryDate: event.target.value }))} placeholder="SKT (YYMMDD)" />
                      <Input value={logisticWizard.serialNo} onChange={(event) => setLogisticWizard((current) => ({ ...current, serialNo: event.target.value }))} placeholder="Seri" />
                      <Input value={logisticWizard.count} onChange={(event) => setLogisticWizard((current) => ({ ...current, count: event.target.value }))} placeholder="Adet" />
                      <Input value={logisticWizard.shipTo} onChange={(event) => setLogisticWizard((current) => ({ ...current, shipTo: event.target.value }))} placeholder="Ship To GLN" />
                      <Input value={logisticWizard.shipmentNo} onChange={(event) => setLogisticWizard((current) => ({ ...current, shipmentNo: event.target.value }))} placeholder="Shipment No" />
                      <Input value={logisticWizard.warehouseCode} onChange={(event) => setLogisticWizard((current) => ({ ...current, warehouseCode: event.target.value }))} placeholder="Depo" />
                      <Input value={logisticWizard.locationCode} onChange={(event) => setLogisticWizard((current) => ({ ...current, locationCode: event.target.value }))} placeholder="Lokasyon" />
                      <Input value={logisticWizard.customerName} onChange={(event) => setLogisticWizard((current) => ({ ...current, customerName: event.target.value }))} placeholder="Musteri" />
                      <Input value={logisticWizard.stockName} onChange={(event) => setLogisticWizard((current) => ({ ...current, stockName: event.target.value }))} placeholder="Stok Adi" />
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button variant="outline" onClick={handleApplyLogisticWizard} disabled={!canManageTemplate}>
                        Wizard Alanlarini Uygula
                      </Button>
                      <Button onClick={() => gs1BuildMutation.mutate()} disabled={!canManageTemplate || gs1BuildMutation.isPending}>
                        GS1 Payload Uret
                      </Button>
                      <Button variant="outline" onClick={() => previewMutation.mutate()} disabled={previewMutation.isPending}>
                        Wizard Preview
                      </Button>
                    </div>
                    {previewMutation.data?.data?.outputFormat === 'svg' && previewMutation.data.data.previewPayload ? (
                      <div className="mt-4 rounded-2xl border border-slate-200/80 bg-white/80 p-3 dark:border-white/10 dark:bg-white/3">
                        <div className="mb-2 text-sm font-medium text-slate-900 dark:text-white">GS1 Logistic Label Preview</div>
                        <div
                          className="overflow-hidden rounded-xl border border-slate-200/80 bg-white p-2 dark:border-white/10 dark:bg-slate-950"
                          dangerouslySetInnerHTML={{ __html: previewMutation.data.data.previewPayload }}
                        />
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
              <Button variant="outline" onClick={() => handleAddElement('text')} disabled={!canManageTemplate}>
                <Plus className="mr-2 size-4" />
                Text
            </Button>
            <Button variant="outline" onClick={() => handleAddElement('barcode')} disabled={!canManageTemplate}>
              <Barcode className="mr-2 size-4" />
              Barcode
            </Button>
            <Button variant="outline" onClick={() => handleAddElement('rect')} disabled={!canManageTemplate}>
              <Layers3 className="mr-2 size-4" />
              Frame
            </Button>
            <Button variant="outline" onClick={() => handleAddElement('qrcode')} disabled={!canManageTemplate}>
              QR
            </Button>
            <Button variant="outline" onClick={() => handleAddElement('datamatrix')} disabled={!canManageTemplate}>
              DataMatrix
            </Button>
            <Button variant="outline" onClick={() => handleAddElement('image')} disabled={!canManageTemplate}>
              Logo
            </Button>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[0.34fr_0.66fr]">
        <Card className="border-slate-200/80 bg-white/85 dark:border-white/10 dark:bg-white/3">
          <CardHeader>
            <CardTitle>Template Bilgisi</CardTitle>
          </CardHeader>
          <CardContent className={`space-y-4 ${readOnlyClassName ?? ''}`}>
            <div className="space-y-2">
              <Label>Kod</Label>
              <Input value={templateRequest.templateCode} onChange={(event) => setTemplateRequest((current) => ({ ...current, templateCode: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Ad</Label>
              <Input value={templateRequest.displayName} onChange={(event) => setTemplateRequest((current) => ({ ...current, displayName: event.target.value }))} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Label Type</Label>
                <Input value={templateRequest.labelType} onChange={(event) => setTemplateRequest((current) => ({ ...current, labelType: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>DPI</Label>
                <Input type="number" value={templateRequest.dpi} onChange={(event) => setTemplateRequest((current) => ({ ...current, dpi: Number(event.target.value) }))} />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Width (cm)</Label>
                <Input type="number" step="0.1" value={mmToCm(templateRequest.width)} onChange={(event) => setTemplateRequest((current) => ({ ...current, width: cmToMm(Number(event.target.value)) }))} />
              </div>
              <div className="space-y-2">
                <Label>Height (cm)</Label>
                <Input type="number" step="0.1" value={mmToCm(templateRequest.height)} onChange={(event) => setTemplateRequest((current) => ({ ...current, height: cmToMm(Number(event.target.value)) }))} />
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              {!isEditMode ? (
                <Button onClick={() => createTemplateMutation.mutate()} disabled={!permission.canCreate || createTemplateMutation.isPending}>
                  <Plus className="mr-2 size-4" />
                  Template Olustur
                </Button>
              ) : (
                <Button onClick={() => updateTemplateMutation.mutate()} disabled={!permission.canUpdate || updateTemplateMutation.isPending}>
                  <Save className="mr-2 size-4" />
                  Template Guncelle
                </Button>
              )}
              <Button variant="outline" onClick={() => navigate('/erp/barcode-designer')}>
                Listeye Don
              </Button>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 text-sm dark:border-white/10 dark:bg-slate-900/30">
              <div className="font-medium text-slate-900 dark:text-white">Secili Eleman</div>
              <div className="mt-2 text-slate-600 dark:text-slate-300">{describeElement(selectedElement)}</div>
              {selectedElement ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge variant="outline">X: {pxToCm(selectedElement.x)} cm</Badge>
                  <Badge variant="outline">Y: {pxToCm(selectedElement.y)} cm</Badge>
                  {'width' in selectedElement ? <Badge variant="outline">W: {pxToCm(selectedElement.width)} cm</Badge> : null}
                  {'height' in selectedElement ? <Badge variant="outline">H: {pxToCm(selectedElement.height)} cm</Badge> : null}
                </div>
              ) : null}
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-slate-900/30">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-medium text-slate-900 dark:text-white">Eleman Listesi</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Koordinat vermeden once elemani buradan da secebilirsin.</div>
                </div>
                <Badge variant="secondary">{documentState.elements.length} eleman</Badge>
              </div>
              <div className="mt-4 space-y-2">
                {documentState.elements.map((element) => (
                  <button
                    key={element.id}
                    type="button"
                    onClick={() => handleSelectElement(element.id)}
                    className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-sm transition ${
                      selectedElementId === element.id
                        ? 'border-sky-400 bg-sky-50/80 dark:border-sky-500 dark:bg-sky-500/10'
                        : 'border-slate-200/80 bg-white/70 hover:border-slate-300 dark:border-white/10 dark:bg-white/3'
                    }`}
                  >
                    <div>
                      <div className="font-medium text-slate-900 dark:text-white">{describeElement(element)}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {pxToCm(element.x)} cm / {pxToCm(element.y)} cm
                      </div>
                    </div>
                    <Badge variant="outline">{element.type}</Badge>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-slate-900/30">
              <div className="flex items-center justify-between gap-3">
                <div className="font-medium text-slate-900 dark:text-white">Baski Kalite Kontrolu</div>
                <Badge variant={validationIssues.some((item) => item.level === 'error') ? 'destructive' : validationIssues.length ? 'secondary' : 'default'}>
                  {validationIssues.length === 0 ? 'Temiz' : `${validationIssues.length} Uyari`}
                </Badge>
              </div>
              {validationIssues.length === 0 ? (
                <div className="mt-3 text-sm text-emerald-700 dark:text-emerald-300">
                  Quiet zone, minimum boyut ve GS1 baglama tarafinda kritik bir risk gorunmuyor.
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  {validationIssues.map((issue) => (
                    <div
                      key={`${issue.elementId}-${issue.title}`}
                      className={`rounded-xl border px-3 py-3 text-sm ${
                        issue.level === 'error'
                          ? 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200'
                          : 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200'
                      }`}
                    >
                      <div className="font-medium">{issue.title}</div>
                      <div className="mt-1 opacity-90">{issue.detail}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-slate-900/30">
              <div className="font-medium text-slate-900 dark:text-white">Hazir Binding Alani</div>
              <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Stok kodu, stok adi, ana gorsel, musteri/firma kodu ve adini secili elemana tek tikla baglayabilirsin.
              </div>
              <div className="mt-4 rounded-2xl border border-dashed border-slate-200/80 bg-white/70 p-3 dark:border-white/10 dark:bg-white/3">
                <div className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Belge Baglami ile Zenginlestir</div>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <Select value={bindingContext.sourceModule} onValueChange={(value) => setBindingContext((current) => ({ ...current, sourceModule: value as BarcodePrintSourceModule }))} disabled={!canManageTemplate}>
                    <SelectTrigger><SelectValue placeholder="Kaynak modul" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="goods-receipt">Mal Kabul</SelectItem>
                      <SelectItem value="transfer">Transfer</SelectItem>
                      <SelectItem value="warehouse-inbound">Ambar Giris</SelectItem>
                      <SelectItem value="warehouse-outbound">Ambar Cikis</SelectItem>
                      <SelectItem value="shipment">Sevkiyat</SelectItem>
                      <SelectItem value="subcontracting-issue">Fason Cikis</SelectItem>
                      <SelectItem value="subcontracting-receipt">Fason Giris</SelectItem>
                      <SelectItem value="package">Paket</SelectItem>
                      <SelectItem value="production-transfer">Uretim Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    value={bindingContext.sourceHeaderId}
                    onChange={(event) => setBindingContext((current) => ({ ...current, sourceHeaderId: event.target.value }))}
                    placeholder="Header Id"
                    disabled={!canManageTemplate}
                  />
                  <Input
                    value={bindingContext.sourceLineId}
                    onChange={(event) => setBindingContext((current) => ({ ...current, sourceLineId: event.target.value }))}
                    placeholder="Line Id (opsiyonel)"
                    disabled={!canManageTemplate}
                  />
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Button type="button" variant="outline" onClick={() => setBindingPickerOpen(true)} disabled={!canManageTemplate}>
                    Belgeden Sec
                  </Button>
                  {selectedBindingHeader ? (
                    <Badge variant="secondary">
                      {selectedBindingHeader.title}
                      {selectedBindingLine ? ` / ${selectedBindingLine.title}` : ''}
                      {selectedBindingPackage ? ` / ${selectedBindingPackage.title}` : ''}
                    </Badge>
                  ) : null}
                </div>
                <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  Header/line girilirse katalog ilgili belge satirinin ornek degerleriyle zenginlesir.
                </div>
              </div>
              <div className="mt-4 rounded-2xl border border-slate-200/80 bg-white/70 p-3 dark:border-white/10 dark:bg-white/3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium text-slate-900 dark:text-white">Schema Explorer</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {selectedElementTarget
                        ? `${fieldTargetHint} Cift tikla yeni eleman olustur veya secili elemana bagla.`
                        : `${fieldTargetHint} Alanlari ara, gruplari ac ve surukleyerek canvas'a birak.`}
                    </div>
                  </div>
                  <Input
                    value={schemaSearch}
                    onChange={(event) => setSchemaSearch(event.target.value)}
                    placeholder="Alan ara"
                    className="max-w-56"
                    disabled={!canManageTemplate}
                  />
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">Process: {schemaMetadataQuery.data?.data?.processLabel ?? 'Genel'}</Badge>
                  <Badge variant="outline">Entity: {schemaEntities.length}</Badge>
                  <Badge variant="outline">Frequent: {frequentFields.length}</Badge>
                </div>
              </div>
              {frequentFields.length > 0 ? (
                <div className="mt-4 rounded-2xl border border-slate-200/80 bg-white/70 p-3 dark:border-white/10 dark:bg-white/3">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium text-slate-900 dark:text-white">Sik Kullanilan Alanlar</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">En sik kullanilan veya operasyonel olarak en degerli alanlara hizli erisim.</div>
                    </div>
                    <Badge variant="secondary">Quick Access</Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {frequentFields.map((field) => (
                      <Button
                        key={`frequent-${field.key}`}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleBindOrCreateField(field.key, field.sampleValue, field.targetType, { label: field.label, path: field.path })}
                        disabled={!canManageTemplate}
                      >
                        {field.label}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : null}
              {schemaEntities.length > 0 ? (
                <div className="mt-4 rounded-2xl border border-slate-200/80 bg-white/70 p-3 dark:border-white/10 dark:bg-white/3">
                  <div className="mb-3 text-sm font-medium text-slate-900 dark:text-white">Process / Entity Ayrimi</div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {schemaEntities.map((entity) => (
                      <div key={entity.entityKey} className="flex items-center gap-2 rounded-xl border border-slate-200/80 bg-slate-50/80 px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-900/30">
                        {renderSchemaEntityIcon(entity.iconKey)}
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-slate-900 dark:text-white">{entity.entityLabel}</div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">{entity.entityType} · {entity.fields.length} alan</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
              <div className="mt-4 text-[11px] text-slate-500 dark:text-slate-400">
                Tree node seviyesinde ac/kapa kullanabilir, leaf alanlari cift tiklayabilir veya dogrudan canvas'a surukleyebilirsin.
              </div>
              <div className="mt-4 rounded-2xl border border-slate-200/80 bg-white/70 p-3 dark:border-white/10 dark:bg-white/3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium text-slate-900 dark:text-white">Hizli Alan Yerlestir</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Suruklemeden de kullan. Tikladiginda alan canvas'a eklenir ve otomatik secilir.
                    </div>
                  </div>
                  <Badge variant="secondary">Quick Insert</Badge>
                </div>
                <div className="mt-3 space-y-2">
                  {QUICK_INSERT_FIELDS.map((field) => (
                    <div key={`quick-${field.key}`} className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200/80 bg-slate-50/80 px-3 py-2 dark:border-white/10 dark:bg-slate-900/30">
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-slate-900 dark:text-white">{field.label}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">{field.path}</div>
                      </div>
                      <Button type="button" variant="outline" size="sm" onClick={() => handleCreateFieldElement(field, 'text')} disabled={!canManageTemplate}>
                        Text Ekle
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => handleCreateFieldElement(field, field.targetType)} disabled={!canManageTemplate}>
                        {field.targetType === 'barcode' ? 'Barcode Ekle' : field.targetType === 'image' ? 'Gorsel Ekle' : 'Onerilen Ekle'}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-4 space-y-3">
                {bindingExplorerTrees.map((group) => {
                  const expanded = expandedBindingGroups[group.groupKey] ?? true;
                  return (
                    <div key={group.groupKey} className="rounded-2xl border border-slate-200/80 bg-white/80 dark:border-white/10 dark:bg-white/3">
                      <button
                        type="button"
                        className="flex w-full items-center justify-between px-4 py-3 text-left"
                        onClick={() => setExpandedBindingGroups((current) => ({ ...current, [group.groupKey]: !expanded }))}
                      >
                        <div>
                          <div className="text-sm font-semibold text-slate-900 dark:text-white">{group.groupLabel}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{group.fields.length} alan</div>
                      </div>
                      <Badge variant="outline">{expanded ? 'Acik' : 'Kapali'}</Badge>
                    </button>
                      {expanded ? (
                        <div className="grid gap-2 px-4 pb-4">
                          {group.tree.map((node) => (
                            <SchemaFieldNode
                              key={node.key}
                              node={node}
                              expandedNodes={expandedBindingNodes}
                              onToggleNode={(key) => setExpandedBindingNodes((current) => ({ ...current, [key]: !(current[key] ?? true) }))}
                             onApplyField={(field) => handleApplyBindingField(field.key, field.sampleValue, field.targetType)}
                              onCreateField={(field) => handleBindOrCreateField(field.key, field.sampleValue, field.targetType, { label: field.label, path: field.path })}
                            />
                          ))}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-slate-900/30">
              <div className="font-medium text-slate-900 dark:text-white">Element Property Panel</div>
              {selectedElement ? (
                <div className="mt-4 space-y-4">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Button type="button" variant="outline" onClick={handleDuplicateSelectedElement} disabled={!canManageTemplate}>
                      <Copy className="mr-2 size-4" />
                      Kopyala
                    </Button>
                    <Button type="button" variant="outline" onClick={handleDeleteSelectedElement} disabled={!canManageTemplate}>
                      <Trash2 className="mr-2 size-4" />
                      Sil
                    </Button>
                  </div>

                  <div className="rounded-xl border border-slate-200/80 bg-white/70 p-3 dark:border-white/10 dark:bg-white/3">
                    <div className="mb-2 text-sm font-medium text-slate-900 dark:text-white">Hizli Konumlandirma</div>
                    <div className="grid gap-2 sm:grid-cols-3">
                      <Button type="button" variant="outline" size="sm" onClick={() => handleNudgeSelectedElement(0, -0.1)} disabled={!canManageTemplate}>Yukari</Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => handleCenterSelectedElement('horizontal')} disabled={!canManageTemplate}>Yatay Ortala</Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => handleNudgeSelectedElement(0, 0.1)} disabled={!canManageTemplate}>Asagi</Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => handleNudgeSelectedElement(-0.1, 0)} disabled={!canManageTemplate}>Sola</Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => handleCenterSelectedElement('vertical')} disabled={!canManageTemplate}>Dikey Ortala</Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => handleNudgeSelectedElement(0.1, 0)} disabled={!canManageTemplate}>Saga</Button>
                    </div>
                    <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                      Butonlar elemani 0.1 cm adimlarla tasir. Daha net konum icin alttaki X/Y alanlarini kullan.
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>X (cm)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={pxToCm(selectedElement.x)}
                        onChange={(event) => handleUpdateSelectedElement((element) => ({ ...element, x: cmToPx(toNumber(event.target.value, pxToCm(element.x))) }))}
                        disabled={!canManageTemplate}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Y (cm)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={pxToCm(selectedElement.y)}
                        onChange={(event) => handleUpdateSelectedElement((element) => ({ ...element, y: cmToPx(toNumber(event.target.value, pxToCm(element.y))) }))}
                        disabled={!canManageTemplate}
                      />
                    </div>
                  </div>

                  {(selectedElement.type === 'text' || selectedElement.type === 'barcode' || selectedElement.type === 'rect' || selectedElement.type === 'image') ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Width (cm)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={pxToCm(selectedElement.width)}
                          onChange={(event) => handleUpdateSelectedElement((element) => (
                            'width' in element ? { ...element, width: cmToPx(toNumber(event.target.value, pxToCm(element.width))) } : element
                          ))}
                          disabled={!canManageTemplate}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Height (cm)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={pxToCm(selectedElement.height)}
                          onChange={(event) => handleUpdateSelectedElement((element) => (
                            'height' in element ? { ...element, height: cmToPx(toNumber(event.target.value, pxToCm(element.height))) } : element
                          ))}
                          disabled={!canManageTemplate}
                        />
                      </div>
                    </div>
                  ) : null}

                  {selectedElement.type === 'text' ? (
                    <>
                      <div className="space-y-2">
                        <Label>Text</Label>
                        <Textarea
                          value={selectedElement.text}
                          onChange={(event) => handleUpdateSelectedElement((element) => (
                            element.type === 'text' ? { ...element, text: event.target.value } : element
                          ))}
                          className="min-h-[96px]"
                          disabled={!canManageTemplate}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Font Size</Label>
                        <Input
                          type="number"
                          value={selectedElement.fontSize}
                          onChange={(event) => handleUpdateSelectedElement((element) => (
                            element.type === 'text' ? { ...element, fontSize: toNumber(event.target.value, element.fontSize) } : element
                          ))}
                          disabled={!canManageTemplate}
                        />
                      </div>
                    </>
                  ) : null}

                  {selectedElement.type === 'barcode' ? (
                    <>
                      <div className="space-y-2">
                        <Label>Barcode Type</Label>
                        <Select
                          value={selectedElement.barcodeType}
                          onValueChange={(value) => handleUpdateSelectedElement((element) => (
                            element.type === 'barcode'
                              ? { ...element, barcodeType: value as 'code128' | 'qrcode' | 'datamatrix' }
                              : element
                          ))}
                          disabled={!canManageTemplate}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="code128">Code128</SelectItem>
                            <SelectItem value="qrcode">QR Code</SelectItem>
                            <SelectItem value="datamatrix">DataMatrix</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Binding</Label>
                        <Input
                          value={selectedElement.binding}
                          onChange={(event) => handleUpdateSelectedElement((element) => (
                            element.type === 'barcode' ? { ...element, binding: event.target.value } : element
                          ))}
                          disabled={!canManageTemplate}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Binding Value</Label>
                        <Input
                          value={documentState.bindings[selectedElement.binding] ?? ''}
                          onChange={(event) => handleBindingValueChange(selectedElement.binding, event.target.value)}
                          disabled={!canManageTemplate}
                        />
                      </div>
                    </>
                  ) : null}

                  {selectedElement.type === 'image' ? (
                    <div className="space-y-2">
                      <Label>Image URL</Label>
                      <Input
                        value={selectedElement.src}
                        onChange={(event) => handleUpdateSelectedElement((element) => (
                          element.type === 'image' ? { ...element, src: event.target.value } : element
                        ))}
                        disabled={!canManageTemplate}
                      />
                    </div>
                  ) : null}

                  {selectedElement.type === 'line' ? (
                    <div className="space-y-2">
                      <Label>Points</Label>
                      <Input
                        value={selectedElement.points.join(', ')}
                        onChange={(event) => {
                          const values = event.target.value
                            .split(',')
                            .map((item) => Number(item.trim()))
                            .filter((item) => Number.isFinite(item));
                          handleUpdateSelectedElement((element) => (
                            element.type === 'line' ? { ...element, points: values.length >= 4 ? values : element.points } : element
                          ));
                        }}
                        disabled={!canManageTemplate}
                      />
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                  Property panelini kullanmak için önce canvas üzerinden bir eleman seç.
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 text-sm dark:border-white/10 dark:bg-slate-900/30">
              <div className="font-medium text-slate-900 dark:text-white">Teknik Karar</div>
              <ul className="mt-2 space-y-2 text-slate-600 dark:text-slate-300">
                {STACK_OPTIONS.slice(0, 2).map((item) => (
                  <li key={item.name}>{item.name}: {item.reason}</li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-slate-900/30">
              <div className="font-medium text-slate-900 dark:text-white">GS1 AI Builder</div>
              <div className="mt-3 space-y-3">
                {gs1Elements.map((item, index) => (
                  <div key={`${item.applicationIdentifier}-${index}`} className="grid gap-3 sm:grid-cols-[96px_1fr]">
                    <Input
                      value={item.applicationIdentifier}
                      onChange={(event) => setGs1Elements((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, applicationIdentifier: event.target.value } : row))}
                      placeholder="AI"
                    />
                    <Input
                      value={item.value}
                      onChange={(event) => setGs1Elements((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, value: event.target.value } : row))}
                      placeholder="Deger"
                    />
                  </div>
                ))}
                <div className="grid gap-2 sm:grid-cols-2">
                  <Button variant="outline" onClick={() => setGs1Elements((current) => [...current, { applicationIdentifier: '', value: '' }])}>
                    AI Satiri Ekle
                  </Button>
                  <Button onClick={() => gs1BuildMutation.mutate()} disabled={!canManageTemplate || gs1BuildMutation.isPending}>
                    GS1 Uret ve Binding'e Yaz
                  </Button>
                </div>
                <div className="rounded-xl border border-slate-200/80 bg-white/80 p-3 text-xs dark:border-white/10 dark:bg-white/4">
                  <div><span className="font-medium">gs1.value:</span> {documentState.bindings['gs1.value'] ?? '-'}</div>
                  <div className="mt-2"><span className="font-medium">gs1.hri:</span> {documentState.bindings['gs1.hri'] ?? '-'}</div>
                  {gs1BuildMutation.data?.data?.warnings?.length ? (
                    <div className="mt-2 text-amber-700 dark:text-amber-300">
                      {gs1BuildMutation.data.data.warnings.join(' | ')}
                    </div>
                  ) : null}
                  {gs1BuildMutation.data?.data?.errors?.length ? (
                    <div className="mt-2 text-rose-700 dark:text-rose-300">
                      {gs1BuildMutation.data.data.errors.join(' | ')}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            {isEditMode ? (
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-slate-900/30">
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-3 text-left"
                  onClick={() => setPrinterProfilesExpanded((current) => !current)}
                >
                  <div className="font-medium text-slate-900 dark:text-white">Printer Profile Esleme</div>
                  <Badge variant="outline">{printerProfilesExpanded ? 'Acik' : 'Yukle'}</Badge>
                </button>
                {printerProfilesExpanded ? (
                <div className="mt-4 space-y-4">
                  <div className="space-y-2">
                    <Label>Printer Profile</Label>
                    <Select value={selectedPrinterProfileId} onValueChange={setSelectedPrinterProfileId} disabled={!permission.canUpdate}>
                      <SelectTrigger><SelectValue placeholder="Printer profile sec" /></SelectTrigger>
                      <SelectContent>
                        {(printerProfilesQuery.data?.data ?? []).filter((item) => item.isActive).map((profile) => (
                          <SelectItem key={profile.id} value={String(profile.id)}>
                            {profile.displayName} ({profile.printerDisplayName})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Button
                      variant="outline"
                      disabled={!permission.canUpdate || !selectedPrinterProfileId || upsertTemplateProfileMutation.isPending}
                      onClick={() => upsertTemplateProfileMutation.mutate({ printerProfileId: Number(selectedPrinterProfileId), isDefault: false })}
                    >
                      Profile Ekle
                    </Button>
                    <Button
                      disabled={!permission.canUpdate || !selectedPrinterProfileId || upsertTemplateProfileMutation.isPending}
                      onClick={() => upsertTemplateProfileMutation.mutate({ printerProfileId: Number(selectedPrinterProfileId), isDefault: true })}
                    >
                      Varsayilan Olarak Ekle
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {(templatePrinterProfilesQuery.data?.data ?? []).map((mapping) => (
                      <div key={mapping.id ?? `${mapping.barcodeTemplateId}-${mapping.printerProfileId}`} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white/80 px-3 py-3 text-sm dark:border-white/10 dark:bg-white/4">
                        <div>
                          <div className="font-medium text-slate-900 dark:text-white">{mapping.printerProfileDisplayName}</div>
                          <div className="text-slate-500 dark:text-slate-400">{mapping.printerCode} · {mapping.printerProfileCode}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={mapping.isDefault ? 'default' : 'secondary'}>
                            {mapping.isDefault ? 'Varsayilan' : 'Ekli'}
                          </Badge>
                          {!mapping.isDefault ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => upsertTemplateProfileMutation.mutate({ printerProfileId: mapping.printerProfileId, isDefault: true })}
                              disabled={!permission.canUpdate}
                            >
                              Varsayilan Yap
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    ))}
                    {(templatePrinterProfilesQuery.data?.data ?? []).length === 0 ? (
                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        Bu template icin henuz printer profile eslemesi yok.
                      </div>
                    ) : null}
                  </div>
                </div>
                ) : (
                  <div className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                    Bu panel ilk acilista yuklenmez. Yalnizca printer-profile esleme yapacaginiz zaman acilir.
                  </div>
                )}
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="designer">Designer</TabsTrigger>
            <TabsTrigger value="json">JSON</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="plan">Plan</TabsTrigger>
          </TabsList>

          <TabsContent value="designer" className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => saveDraftMutation.mutate()} disabled={!permission.canUpdate || !activeTemplateId || saveDraftMutation.isPending}>
                <Save className="mr-2 size-4" />
                Draft Kaydet
              </Button>
              <Button variant="outline" onClick={() => previewMutation.mutate()} disabled={previewMutation.isPending}>
                <Sparkles className="mr-2 size-4" />
                Preview Hazirla
              </Button>
              <Button variant="outline" onClick={handleExportPdf}>
                <Download className="mr-2 size-4" />
                PDF Export
              </Button>
              {activeTemplateId ? (
                <Button variant="outline" onClick={() => navigate(`/erp/barcode-designer/${activeTemplateId}/print`)}>
                  Etiket Bas
                </Button>
              ) : null}
            </div>

            <Card className="border-slate-200/80 bg-white/85 dark:border-white/10 dark:bg-white/3">
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
                <div>
                  <div className="font-medium text-slate-900 dark:text-white">
                    Canvas: {mmToCm(documentState.canvas.width)} cm × {mmToCm(documentState.canvas.height)} cm
                  </div>
                  <div className="mt-1 text-slate-500 dark:text-slate-400">
                    Sagdan alan ekle, canvas uzerinden surukle veya eleman listesinden secip X/Y ver. Boyut degistirdikce goruntu aninda guncellenir.
                  </div>
                </div>
                <Badge variant="outline">{documentState.canvas.dpi} DPI</Badge>
              </CardContent>
            </Card>

            <Card className="border-slate-200/80 bg-white/85 dark:border-white/10 dark:bg-white/3">
              <CardContent className="flex flex-wrap items-center gap-2 p-4">
                <Badge variant="secondary">{selectedElementIds.length} secili</Badge>
                <Button variant="outline" size="sm" disabled={selectedElementIds.length < 2} onClick={() => handleAlignHorizontalSelection('left')}>
                  Align Left
                </Button>
                <Button variant="outline" size="sm" disabled={selectedElementIds.length < 2} onClick={() => handleAlignHorizontalSelection('center')}>
                  Align Center
                </Button>
                <Button variant="outline" size="sm" disabled={selectedElementIds.length < 2} onClick={() => handleAlignHorizontalSelection('right')}>
                  Align Right
                </Button>
                <Button variant="outline" size="sm" disabled={selectedElementIds.length < 2} onClick={() => handleAlignSelection('top')}>
                  Align Top
                </Button>
                <Button variant="outline" size="sm" disabled={selectedElementIds.length < 2} onClick={() => handleAlignSelection('middle')}>
                  Align Middle
                </Button>
                <Button variant="outline" size="sm" disabled={selectedElementIds.length < 2} onClick={() => handleAlignSelection('bottom')}>
                  Align Bottom
                </Button>
                <Button variant="outline" size="sm" disabled={selectedElementIds.length < 3} onClick={() => handleDistributeSelection('horizontal')}>
                  Dagit Yatay Kenar
                </Button>
                <Button variant="outline" size="sm" disabled={selectedElementIds.length < 3} onClick={() => handleDistributeSelection('vertical')}>
                  Dagit Dikey Kenar
                </Button>
                <Button variant="outline" size="sm" disabled={selectedElementIds.length < 3} onClick={() => handleDistributeSelection('horizontal', 'center')}>
                  Dagit Yatay Merkez
                </Button>
                <Button variant="outline" size="sm" disabled={selectedElementIds.length < 3} onClick={() => handleDistributeSelection('vertical', 'center')}>
                  Dagit Dikey Merkez
                </Button>
                <Button variant="outline" size="sm" disabled={selectedElementIds.length < 2} onClick={() => handleResizeSelection('width')}>
                  Esit Genislik
                </Button>
                <Button variant="outline" size="sm" disabled={selectedElementIds.length < 2} onClick={() => handleResizeSelection('height')}>
                  Esit Yukseklik
                </Button>
                <Button variant="outline" size="sm" disabled={selectedElementIds.length === 0} onClick={handleClearSelection}>
                  Secimi Temizle
                </Button>
                <div className="ml-auto text-xs text-slate-500 dark:text-slate-400">
                  Ctrl/Cmd veya Shift ile coklu secim yapabilirsin.
                </div>
              </CardContent>
            </Card>

            <Suspense
              fallback={(
                <div className="flex min-h-[520px] items-center justify-center rounded-2xl border border-slate-200/80 bg-white/85 dark:border-white/10 dark:bg-white/3">
                  <div className="text-center">
                    <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-b-2 border-primary" />
                    <p className="text-sm text-slate-500 dark:text-slate-400">Designer canvas yukleniyor...</p>
                  </div>
                </div>
              )}
            >
              <BarcodeDesignerCanvas
                document={documentState}
                selectedElementId={selectedElementId}
                selectedElementIds={selectedElementIds}
                onSelectElement={handleSelectElement}
                onClearSelection={handleClearSelection}
                onMoveElement={canManageTemplate ? handleMoveElement : () => {}}
                onResizeElement={canManageTemplate ? handleResizeElement : () => {}}
                onDuplicateSelected={canManageTemplate ? handleDuplicateSelectedElement : undefined}
                onDeleteSelected={canManageTemplate ? handleDeleteSelectedElement : undefined}
                onApplyTextPreset={canManageTemplate ? handleApplyTextPreset : undefined}
                onApplyBarcodePreset={canManageTemplate ? handleApplyBarcodePreset : undefined}
                onApplyImagePreset={canManageTemplate ? handleApplyImagePreset : undefined}
                onDropBindingField={canManageTemplate ? handleDropBindingField : () => {}}
                arrangementGuides={arrangementGuides}
                stageRef={stageRef}
              />
            </Suspense>
          </TabsContent>

          <TabsContent value="json" className="space-y-4">
            <Card className="border-slate-200/80 bg-white/85 dark:border-white/10 dark:bg-white/3">
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <CardTitle>Template JSON</CardTitle>
                  <Button variant="outline" onClick={handleJsonApply} disabled={!canManageTemplate}>
                    <FileJson2 className="mr-2 size-4" />
                    JSON Uygula
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Textarea value={jsonValue} onChange={(event) => setJsonValue(event.target.value)} className="min-h-[520px] font-mono text-xs" disabled={!canManageTemplate} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preview" className="space-y-4">
            <div className="grid gap-4 xl:grid-cols-2">
              <Card className="border-slate-200/80 bg-white/85 dark:border-white/10 dark:bg-white/3">
                <CardHeader><CardTitle>Preview Servis Cevabi</CardTitle></CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div><span className="font-medium">Engine:</span> {previewMutation.data?.data?.engineType ?? 'client-bwip-js'}</div>
                  <div><span className="font-medium">Format:</span> {previewMutation.data?.data?.outputFormat ?? 'json'}</div>
                  <div><span className="font-medium">Mesaj:</span> {previewMutation.data?.data?.debugMessage ?? 'Sample data ile local preview aktif.'}</div>
                  <pre className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-slate-950 p-4 text-xs leading-6 text-slate-100">
                    <code>{previewMutation.data?.data?.previewPayload ?? jsonValue}</code>
                  </pre>
                </CardContent>
              </Card>

              <Card className="border-slate-200/80 bg-white/85 dark:border-white/10 dark:bg-white/3">
                <CardHeader><CardTitle>Aktif Fazlar</CardTitle></CardHeader>
                <CardContent className="grid gap-3">
                  {DELIVERY_PHASES.map((phase) => (
                    <div key={phase.title} className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-slate-900/30">
                      <div className="font-medium text-slate-900 dark:text-white">{phase.title}</div>
                      <ul className="mt-2 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                        {phase.items.map((item) => <li key={item}>{item}</li>)}
                      </ul>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="plan" className="space-y-4">
            <div className="grid gap-4 xl:grid-cols-2">
              {ARCHITECTURE_GROUPS.map((group) => (
                <Card key={group.title} className="border-slate-200/80 bg-white/85 dark:border-white/10 dark:bg-white/3">
                  <CardHeader><CardTitle>{group.title}</CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-600 dark:text-slate-300">{group.description}</p>
                    <ul className="mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-200">
                      {group.items.map((item) => <li key={item}>{item}</li>)}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {isEditMode ? (
        <Card className="border-slate-200/80 bg-white/85 dark:border-white/10 dark:bg-white/3">
          <CardHeader>
            <button
              type="button"
              className="flex w-full items-center justify-between gap-3 text-left"
              onClick={() => setVersioningExpanded((current) => !current)}
            >
              <CardTitle>Versioning ve Publish</CardTitle>
              <Badge variant="outline">{versioningExpanded ? 'Acik' : 'Yukle'}</Badge>
            </button>
          </CardHeader>
          <CardContent className="grid gap-3">
            {!versioningExpanded ? (
              <div className="text-sm text-slate-500 dark:text-slate-400">
                Version listesi ve publish gecmisi ilk acilista yuklenmez. Ihtiyac oldugunda bu paneli acin.
              </div>
            ) : null}
            {versioningExpanded ? (
            <>
            {(versionsQuery.data?.data ?? []).map((version) => (
              <div key={version.id ?? version.versionNo} className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-slate-900/30 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1 text-sm">
                  <div className="font-medium text-slate-900 dark:text-white">Versiyon {version.versionNo}</div>
                  <div className="text-slate-600 dark:text-slate-300">{version.notes || 'Not yok'}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={version.isPublished ? 'default' : 'secondary'}>
                    {version.isPublished ? 'Published' : 'Draft Snapshot'}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!permission.canUpdate || version.isPublished || !version.id || publishMutation.isPending || hasBlockingValidationIssue}
                    onClick={() => publishMutation.mutate(Number(version.id))}
                  >
                    Yayınla
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!version.id || complianceReportMutation.isPending}
                    onClick={() => complianceReportMutation.mutate(Number(version.id))}
                  >
                    Uyum Raporu
                  </Button>
                </div>
              </div>
            ))}
            {hasBlockingValidationIssue ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
                Publish kapali. Once Baski Kalite Kontrolu alanindaki hata seviyesindeki maddeleri duzelt.
              </div>
            ) : null}
            {(versionsQuery.data?.data ?? []).length === 0 ? (
              <div className="text-sm text-slate-500">Henüz kaydedilmiş versiyon yok. Önce draft kaydet.</div>
            ) : null}
            {lastComplianceReport ? (
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-slate-900/30">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-medium text-slate-900 dark:text-white">Otomatik Uyum Raporu</div>
                  <Badge variant={lastComplianceReport.canPublish ? 'default' : 'destructive'}>
                    {lastComplianceReport.canPublish ? 'Uygun' : 'Kritik Sorun Var'}
                  </Badge>
                </div>
                <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">{lastComplianceReport.summary}</div>
                <div className="mt-3 grid gap-2 sm:grid-cols-3 text-sm">
                  <div className="rounded-xl border border-slate-200/80 bg-white/70 px-3 py-2 dark:border-white/10 dark:bg-white/3">Label: {lastComplianceReport.labelType || templateRequest.labelType}</div>
                  <div className="rounded-xl border border-slate-200/80 bg-white/70 px-3 py-2 dark:border-white/10 dark:bg-white/3">Barkod: {lastComplianceReport.barcodeCount}</div>
                  <div className="rounded-xl border border-slate-200/80 bg-white/70 px-3 py-2 dark:border-white/10 dark:bg-white/3">GS1 HRI: {lastComplianceReport.hasGs1HumanReadableText ? 'Var' : 'Yok'}</div>
                </div>
                <div className="mt-3 space-y-2">
                  {lastComplianceReport.issues.map((issue) => (
                    <div
                      key={`${issue.elementId}-${issue.code}`}
                      className={`rounded-xl border px-3 py-2 text-sm ${
                        issue.level === 'error'
                          ? 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200'
                          : 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200'
                      }`}
                    >
                      {issue.message}
                    </div>
                  ))}
                  {lastComplianceReport.issues.length === 0 ? (
                    <div className="text-sm text-emerald-700 dark:text-emerald-300">Rapor temiz. Publish sonrasi kalite kapisi gecildi.</div>
                  ) : null}
                </div>
                <div className="mt-4">
                  <Button variant="outline" onClick={handleExportComplianceReportPdf}>
                    <Download className="mr-2 size-4" />
                    Uyum Raporunu PDF Al
                  </Button>
                </div>
              </div>
            ) : null}
            </>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <Suspense fallback={null}>
        <BarcodePrintSourcePickerDialog
          open={bindingPickerOpen}
          onOpenChange={setBindingPickerOpen}
          sourceModule={bindingContext.sourceModule}
          printMode="document-line"
          selectedHeaderId={bindingContext.sourceHeaderId.trim() ? Number(bindingContext.sourceHeaderId) : null}
          selectedLineId={bindingContext.sourceLineId.trim() ? Number(bindingContext.sourceLineId) : null}
          onConfirm={handleBindingPickerConfirm}
        />
      </Suspense>
    </div>
  );
}
