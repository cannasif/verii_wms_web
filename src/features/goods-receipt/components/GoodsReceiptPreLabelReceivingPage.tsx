import { type ChangeEvent, type ReactElement, type ReactNode, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowDown, ArrowUp, Camera, FileText, PackageCheck, Plus, RefreshCw, ScanLine, Trash2, Upload } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { OpsActionButton, OpsListPageShell, PagedDataGrid, type PagedDataGridColumn } from '@/components/shared';
import { PermissionNotice } from '@/features/access-control/components/PermissionNotice';
import { useCrudPermission } from '@/features/access-control/hooks/useCrudPermission';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Form } from '@/components/ui/form';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VoiceSearchButton } from '@/components/ui/voice-search-button';
import { useColumnPreferences } from '@/hooks/useColumnPreferences';
import { usePagedDataGrid } from '@/hooks/usePagedDataGrid';
import { getPagedRange } from '@/lib/paged';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/ui-store';
import type { FilterColumnConfig } from '@/lib/advanced-filter-types';
import { goodsReceiptApi } from '../api/goods-receipt-api';
import {
  createGoodsReceiptFormSchema,
  type GoodsReceiptFormData,
  type GrPreReceiptLabel,
  type GrPreReceiptLabelBatch,
  type OrderItem,
  type SelectedOrderItem,
} from '../types/goods-receipt';
import { getPreLabelStatusBadgeClass } from '../utils/pre-label-status-badge';
import { Step1BasicInfo } from './steps/Step1BasicInfo';
import { Step2OrderSelection } from './steps/Step2OrderSelection';

type ColumnKey = 'batchNo' | 'siparisNo' | 'customer' | 'status' | 'progress' | 'createdDate' | 'actions';

const actionableStatuses = new Set(['Generated', 'Printed', 'PartiallyPrinted', 'PartiallyConsumed']);
const unavailableLabelStatuses = new Set(['Consumed', 'Void']);

type BarcodeDetectorConstructor = new (options?: { formats?: string[] }) => {
  detect(source: ImageBitmapSource): Promise<Array<{ rawValue?: string }>>;
};

const PHOTO_BARCODE_FORMATS = ['data_matrix', 'qr_code', 'code_128', 'code_39'];
const PHOTO_ROW_SCAN_COUNTS = [4, 5, 6, 7, 8, 9, 10, 12];
const PHOTO_FALLBACK_ROW_SCAN_COUNTS = [1, 8, 9, 10];
const PHOTO_HORIZONTAL_SCAN_PLANS = [
  { xRatio: 0, widthRatio: 1 },
  { xRatio: 0.35, widthRatio: 0.65 },
  { xRatio: 0.45, widthRatio: 0.55 },
];

function normalizeBarcode(value: string): string {
  return value.trim().toUpperCase();
}

function splitBarcodeInput(value: string): string[] {
  return value
    .split(/[\n,;]+/g)
    .map((item) => item.trim())
    .filter(Boolean);
}

function getBarcodeDetector(): BarcodeDetectorConstructor | null {
  const candidate = (window as typeof window & { BarcodeDetector?: BarcodeDetectorConstructor }).BarcodeDetector;
  return typeof candidate === 'function' ? candidate : null;
}

type Html5QrcodeModule = typeof import('html5-qrcode');
type BarcodeCrop = {
  name: string;
  file: File;
};
type PhotoEnhancementMode = 'raw' | 'contrast' | 'binary';

function collectDetectedBarcodeValues(
  target: Map<string, string>,
  detected: Array<{ rawValue?: string }>,
): void {
  for (const item of detected) {
    const value = item.rawValue?.trim();
    if (!value) continue;
    target.set(normalizeBarcode(value), value);
  }
}

function canvasToPngFile(canvas: HTMLCanvasElement, name: string): Promise<File | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob ? new File([blob], name, { type: 'image/png' }) : null);
    }, 'image/png');
  });
}

function enhanceCanvasForBarcode(
  context: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  mode: Exclude<PhotoEnhancementMode, 'raw'>,
): void {
  const image = context.getImageData(0, 0, canvas.width, canvas.height);
  const { data } = image;

  for (let index = 0; index < data.length; index += 4) {
    const gray = (data[index] * 0.299) + (data[index + 1] * 0.587) + (data[index + 2] * 0.114);
    const next = mode === 'binary'
      ? (gray > 145 ? 255 : 0)
      : Math.max(0, Math.min(255, ((gray - 128) * 1.9) + 128));

    data[index] = next;
    data[index + 1] = next;
    data[index + 2] = next;
  }

  context.putImageData(image, 0, 0);
}

async function addCanvasCrop(
  crops: BarcodeCrop[],
  canvas: HTMLCanvasElement,
  name: string,
  mode: PhotoEnhancementMode,
): Promise<void> {
  const cropFile = await canvasToPngFile(canvas, `pre-label-photo-${name}-${mode}.png`);
  if (cropFile) {
    crops.push({ name: `${name}:${mode}`, file: cropFile });
  }
}

async function buildPhotoCropPlans(
  bitmap: ImageBitmap,
  context: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  rowCounts: number[],
  includeEnhancedVariants: boolean,
): Promise<BarcodeCrop[]> {
  const crops: BarcodeCrop[] = [];
  const width = bitmap.width;
  const height = bitmap.height;

  for (const rowCount of rowCounts) {
    const rowHeight = height / rowCount;
    const overlap = rowHeight * 0.18;

    for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
      const sourceY = Math.max(0, Math.floor(rowIndex * rowHeight - overlap));
      const sourceBottom = Math.min(height, Math.ceil((rowIndex + 1) * rowHeight + overlap));
      const sourceHeight = sourceBottom - sourceY;

      if (sourceHeight <= 0) continue;

      for (const horizontal of PHOTO_HORIZONTAL_SCAN_PLANS) {
        const sourceX = Math.floor(width * horizontal.xRatio);
        const sourceWidth = Math.max(1, Math.floor(width * horizontal.widthRatio));

        canvas.width = sourceWidth;
        canvas.height = sourceHeight;
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(bitmap, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, sourceWidth, sourceHeight);
        await addCanvasCrop(crops, canvas, `${rowCount}-${rowIndex}`, 'raw');

        if (includeEnhancedVariants) {
          context.clearRect(0, 0, canvas.width, canvas.height);
          context.drawImage(bitmap, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, sourceWidth, sourceHeight);
          enhanceCanvasForBarcode(context, canvas, 'contrast');
          await addCanvasCrop(crops, canvas, `${rowCount}-${rowIndex}`, 'contrast');

          context.clearRect(0, 0, canvas.width, canvas.height);
          context.drawImage(bitmap, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, sourceWidth, sourceHeight);
          enhanceCanvasForBarcode(context, canvas, 'binary');
          await addCanvasCrop(crops, canvas, `${rowCount}-${rowIndex}`, 'binary');
        }
      }
    }
  }

  return crops;
}

async function scanFileWithHtml5Qrcode(
  file: File,
  html5QrcodeModule: Html5QrcodeModule,
  elementId: string,
): Promise<string | null> {
  const { Html5Qrcode, Html5QrcodeSupportedFormats } = html5QrcodeModule;
  const scanner = new Html5Qrcode(elementId, {
    formatsToSupport: [
      Html5QrcodeSupportedFormats.DATA_MATRIX,
      Html5QrcodeSupportedFormats.QR_CODE,
      Html5QrcodeSupportedFormats.CODE_128,
      Html5QrcodeSupportedFormats.CODE_39,
    ],
    useBarCodeDetectorIfSupported: false,
    verbose: false,
  });

  try {
    const result = await scanner.scanFileV2(file, false);
    return result.decodedText?.trim() || null;
  } catch {
    return null;
  } finally {
    try {
      scanner.clear();
    } catch {
      // The scanner may have nothing rendered for failed image scans.
    }
  }
}

async function collectHtml5QrcodeValuesFromPhoto(
  target: Map<string, string>,
  originalFile: File,
  cropFiles: BarcodeCrop[],
): Promise<void> {
  const module = await import('html5-qrcode');
  const container = document.createElement('div');
  const elementId = `pre-label-photo-reader-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  container.id = elementId;
  container.style.position = 'fixed';
  container.style.left = '-10000px';
  container.style.top = '-10000px';
  container.style.width = '1px';
  container.style.height = '1px';
  document.body.appendChild(container);

  try {
    const fullImageValue = await scanFileWithHtml5Qrcode(originalFile, module, elementId);
    if (fullImageValue) {
      target.set(normalizeBarcode(fullImageValue), fullImageValue);
    }

    for (const crop of cropFiles) {
      const value = await scanFileWithHtml5Qrcode(crop.file, module, elementId);
      if (value) {
        target.set(normalizeBarcode(value), value);
      }
    }
  } finally {
    container.remove();
  }
}

async function detectBarcodeValuesFromPhoto(file: File, detectorCtor: BarcodeDetectorConstructor | null): Promise<string[]> {
  const values = new Map<string, string>();
  const bitmap = await createImageBitmap(file);

  try {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d', { willReadFrequently: true });

    if (detectorCtor) {
      const detector = new detectorCtor({ formats: PHOTO_BARCODE_FORMATS });
      collectDetectedBarcodeValues(values, await detector.detect(bitmap));

      if (context) {
        const nativeCrops = await buildPhotoCropPlans(bitmap, context, canvas, PHOTO_ROW_SCAN_COUNTS, false);

        for (const crop of nativeCrops) {
          try {
            const cropBitmap = await createImageBitmap(crop.file);
            try {
              collectDetectedBarcodeValues(values, await detector.detect(cropBitmap));
            } finally {
              cropBitmap.close();
            }
          } catch {
            // Some browser implementations fail on a crop even when the full image is valid.
            // Continue with the remaining crop plans instead of losing the whole upload.
          }
        }
      }
    }

    if (!context) {
      return Array.from(values.values());
    }

    const fallbackCrops = await buildPhotoCropPlans(bitmap, context, canvas, PHOTO_FALLBACK_ROW_SCAN_COUNTS, true);
    await collectHtml5QrcodeValuesFromPhoto(values, file, fallbackCrops);

    return Array.from(values.values());
  } finally {
    bitmap.close();
  }
}

const filterColumns: readonly FilterColumnConfig[] = [
  { value: 'batchNo', type: 'string', labelKey: 'goodsReceipt.preLabelReceiving.batchNo' },
  { value: 'siparisNo', type: 'string', labelKey: 'goodsReceipt.preLabelReceiving.orderNo' },
  { value: 'customer', type: 'string', labelKey: 'goodsReceipt.preLabelReceiving.customer' },
  { value: 'status', type: 'string', labelKey: 'goodsReceipt.preLabelReceiving.status' },
  { value: 'createdDate', type: 'date', labelKey: 'goodsReceipt.preLabelReceiving.createdDate' },
];

const DEFAULT_COLUMN_WIDTHS: Record<string, number> = {
  batchNo: 14,
  siparisNo: 14,
  customer: 20,
  status: 12,
  progress: 12,
  createdDate: 16,
};

function mapSortBy(value: ColumnKey): string {
  switch (value) {
    case 'batchNo': return 'batchNo';
    case 'siparisNo': return 'siparisNo';
    case 'customer': return 'customerCodeSnapshot';
    case 'status': return 'status';
    case 'createdDate':
    default: return 'createdDate';
  }
}

function formatDate(value?: string | null): string {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat('tr-TR', { dateStyle: 'short', timeStyle: 'short' }).format(date);
}

export function GoodsReceiptPreLabelReceivingPage(): ReactElement {
  const { t } = useTranslation(['goods-receipt', 'common']);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setPageTitle } = useUIStore();
  const [receivingMode, setReceivingMode] = useState<'orders' | 'assigned'>('orders');
  const [scanBatch, setScanBatch] = useState<GrPreReceiptLabelBatch | null>(null);
  const pageKey = 'goods-receipt-pre-label-receiving';
  const pagedGrid = usePagedDataGrid<ColumnKey>({
    pageKey,
    defaultSortBy: 'createdDate',
    defaultSortDirection: 'desc',
    defaultPageNumber: 1,
    pageNumberBase: 1,
    mapSortBy,
  });

  useEffect(() => {
    setPageTitle(t('preLabelReceiving.title'));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

  const batchesQuery = useQuery({
    queryKey: ['goods-receipt-pre-label-receiving', pagedGrid.queryParams],
    queryFn: ({ signal }) => goodsReceiptApi.getPreReceiptLabelBatchesPaged(pagedGrid.queryParams, { signal }),
  });

  const startGoodsReceiptMutation = useMutation({
    mutationFn: (batch: GrPreReceiptLabelBatch) => goodsReceiptApi.startGoodsReceiptFromPreReceiptBatch(batch.id),
    onSuccess: async (headerId) => {
      toast.success(t('preLabelReceiving.started'));
      await queryClient.invalidateQueries({ queryKey: ['goods-receipt-pre-label-receiving'] });
      await queryClient.invalidateQueries({ queryKey: ['goods-receipt-pre-label-batches'] });
      navigate(`/goods-receipt/collection/${headerId}`);
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('common.error')),
  });

  const page = batchesQuery.data;
  const actionableBatches = useMemo(
    () => (page?.data ?? []).filter((batch) => actionableStatuses.has(batch.status)),
    [page?.data],
  );

  const summary = useMemo(() => actionableBatches.reduce(
      (acc, batch) => {
        acc.total += 1;
        acc.labels += batch.totalLabelCount;
        acc.remaining += Math.max(0, batch.totalLabelCount - batch.consumedLabelCount - batch.voidLabelCount);
        return acc;
      },
      { total: 0, labels: 0, remaining: 0 },
  ), [actionableBatches]);

  const columns = useMemo<PagedDataGridColumn<ColumnKey>[]>(() => [
    { key: 'batchNo', label: t('preLabelReceiving.batchNo'), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
    { key: 'siparisNo', label: t('preLabelReceiving.orderNo'), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
    { key: 'customer', label: t('preLabelReceiving.customer'), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
    { key: 'status', label: t('preLabelReceiving.status'), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
    { key: 'progress', label: t('preLabelReceiving.progress'), sortable: false, headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
    { key: 'createdDate', label: t('preLabelReceiving.createdDate'), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
    { key: 'actions', label: t('preLabelReceiving.actions'), sortable: false },
  ], [t]);

  const {
    userId,
    columnOrder,
    visibleColumns,
    orderedVisibleColumns,
    columnWidths,
    setColumnOrder,
    setVisibleColumns,
    resizeColumnPair,
  } = useColumnPreferences({
    pageKey,
    columns: columns.map(({ key, label }) => ({ key, label })),
    defaultWidths: DEFAULT_COLUMN_WIDTHS,
    includeActionsColumn: true,
  });

  const renderSortIcon = (columnKey: ColumnKey): ReactElement | null => {
    if (columnKey !== pagedGrid.sortBy) return null;
    return pagedGrid.sortDirection === 'asc'
      ? <ArrowUp className="ml-1 h-3.5 w-3.5" />
      : <ArrowDown className="ml-1 h-3.5 w-3.5" />;
  };

  const range = getPagedRange(page, 1);
  const exportColumns = useMemo(
    () => columns.filter((column) => column.key !== 'actions').map((column) => ({ key: column.key, label: column.label })),
    [columns],
  );
  const exportRows = useMemo<Record<string, unknown>[]>(() => actionableBatches.map((batch) => ({
    batchNo: batch.batchNo,
    siparisNo: batch.siparisNo,
    customer: [batch.customerCodeSnapshot, batch.customerNameSnapshot].filter(Boolean).join(' - ') || '-',
    status: t(`preLabels.statuses.${batch.status}`, batch.status),
    progress: `${batch.consumedLabelCount}/${batch.totalLabelCount}`,
    createdDate: formatDate(batch.createdDate),
  })), [actionableBatches, t]);

  const getCellText = (batch: GrPreReceiptLabelBatch, key: ColumnKey): string | undefined => {
    switch (key) {
      case 'batchNo': return batch.batchNo;
      case 'siparisNo': return batch.siparisNo;
      case 'customer': return [batch.customerCodeSnapshot, batch.customerNameSnapshot].filter(Boolean).join(' - ') || '-';
      case 'status': return t(`preLabels.statuses.${batch.status}`, batch.status);
      case 'progress': return `${batch.consumedLabelCount}/${batch.totalLabelCount}`;
      case 'createdDate': return formatDate(batch.createdDate);
      default: return undefined;
    }
  };

  return (
    <OpsListPageShell
      eyebrow={
        <>
          <span>{t('goodsReceipt.create.breadcrumb.parent')}</span>
          <span className="mx-2 opacity-60">/</span>
          <span>{t('goodsReceipt.create.breadcrumb.module')}</span>
        </>
      }
      title={t('preLabelReceiving.title')}
      description={t('preLabelReceiving.subtitle')}
      actions={(
        <div className="flex w-full flex-col gap-4">
          <Tabs value={receivingMode} onValueChange={(value) => setReceivingMode(value as 'orders' | 'assigned')} className="w-full sm:w-auto">
            <TabsList
              className={cn(
                'wms-ops-tabs w-full sm:w-auto',
                receivingMode === 'orders' ? 'wms-ops-tabs--order' : 'wms-ops-tabs--stock',
              )}
            >
              <span className="wms-ops-tab-indicator" aria-hidden />
              <TabsTrigger value="orders" className="wms-ops-tab gap-1.5">
                <FileText className="size-3.5" aria-hidden />
                {t('preLabelReceiving.tabs.orders')}
              </TabsTrigger>
              <TabsTrigger value="assigned" className="wms-ops-tab gap-1.5">
                <ScanLine className="size-3.5" aria-hidden />
                {t('preLabelReceiving.tabs.assigned')}
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="wms-ops-stat-grid">
            <div className="wms-ops-stat-card">
              <div className="wms-ops-stat-card__value">{summary.total}</div>
              <div className="wms-ops-stat-card__label">{t('preLabelReceiving.openBatchCount')}</div>
            </div>
            <div className="wms-ops-stat-card">
              <div className="wms-ops-stat-card__value">{summary.labels}</div>
              <div className="wms-ops-stat-card__label">{t('preLabelReceiving.totalLabels')}</div>
            </div>
            <div className="wms-ops-stat-card">
              <div className="wms-ops-stat-card__value">{summary.remaining}</div>
              <div className="wms-ops-stat-card__label">{t('preLabelReceiving.remainingLabels')}</div>
            </div>
          </div>
        </div>
      )}
    >
      {receivingMode === 'orders' ? (
        <OrderBasedReceivingPanel />
      ) : (
          <PagedDataGrid<GrPreReceiptLabelBatch, ColumnKey>
        variant="ops"
        pageKey={pageKey}
            columns={columns}
        visibleColumnKeys={orderedVisibleColumns.filter((key) => key !== 'actions') as ColumnKey[]}
        defaultColumnWidths={DEFAULT_COLUMN_WIDTHS}
        columnWidths={columnWidths}
        onResizeColumnPair={resizeColumnPair}
        getCellText={getCellText}
            rows={actionableBatches}
            rowKey={(batch) => batch.id}
            renderCell={(batch, key) => ({
          batchNo: <span className="font-semibold font-mono text-xs">{batch.batchNo}</span>,
          siparisNo: <span className="font-mono text-xs">{batch.siparisNo}</span>,
              customer: [batch.customerCodeSnapshot, batch.customerNameSnapshot].filter(Boolean).join(' - ') || '-',
          status: (
            <Badge variant="outline" className={getPreLabelStatusBadgeClass(batch.status)}>
              {t(`preLabels.statuses.${batch.status}`, batch.status)}
            </Badge>
          ),
          progress: <span className="font-mono text-xs">{batch.consumedLabelCount}/{batch.totalLabelCount} {t('preLabelReceiving.consumedShort')}</span>,
          createdDate: <span className="font-mono text-xs">{formatDate(batch.createdDate)}</span>,
            } as Record<Exclude<ColumnKey, 'actions'>, ReactNode>)[key as Exclude<ColumnKey, 'actions'>] ?? null}
            sortBy={pagedGrid.sortBy}
            sortDirection={pagedGrid.sortDirection}
            onSort={(key) => {
          if (key !== 'progress' && key !== 'actions') pagedGrid.handleSort(key);
            }}
            renderSortIcon={renderSortIcon}
            isLoading={batchesQuery.isLoading}
            isError={Boolean(batchesQuery.error)}
            errorText={t('preLabelReceiving.loadError')}
            emptyText={t('preLabelReceiving.empty')}
            showActionsColumn
            actionsHeaderLabel={t('preLabelReceiving.actions')}
        iconOnlyActions={false}
        actionsCellClassName="wms-ops-table-actions-col"
            renderActionsCell={(batch) => (
          <div className="wms-ops-row-actions">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="wms-ops-grid-icon-btn"
              aria-label={t('preLabelReceiving.multiScan')}
              title={t('preLabelReceiving.multiScan')}
              onClick={() => setScanBatch(batch)}
              disabled={startGoodsReceiptMutation.isPending}
            >
              <ScanLine className="size-3" aria-hidden />
            </Button>
                <Button
              type="button"
              variant="ghost"
              size="icon"
              className="wms-ops-grid-icon-btn wms-ops-grid-icon-btn--start"
              aria-label={t('preLabelReceiving.startAll')}
              title={t('preLabelReceiving.startAll')}
                  onClick={() => startGoodsReceiptMutation.mutate(batch)}
                  disabled={startGoodsReceiptMutation.isPending}
                >
              <PackageCheck className="size-3" aria-hidden />
                </Button>
              </div>
            )}
            pageSize={pagedGrid.pageSize}
            pageSizeOptions={pagedGrid.pageSizeOptions}
            onPageSizeChange={pagedGrid.handlePageSizeChange}
            pageNumber={pagedGrid.getDisplayPageNumber(page)}
            totalPages={page?.totalPages ?? 1}
            hasPreviousPage={page?.hasPreviousPage ?? false}
            hasNextPage={page?.hasNextPage ?? false}
            onPreviousPage={pagedGrid.goToPreviousPage}
            onNextPage={pagedGrid.goToNextPage}
            previousLabel={t('common.previous')}
            nextLabel={t('common.next')}
            paginationInfoText={t('preLabelReceiving.paginationInfo', {
              current: range.from,
              total: range.to,
              totalCount: range.total,
            })}
        actionBar={{
          pageKey,
          userId,
          columns: columns.map(({ key, label }) => ({ key, label })),
          visibleColumns,
          columnOrder,
          onVisibleColumnsChange: setVisibleColumns,
          onColumnOrderChange: setColumnOrder,
          exportFileName: pageKey,
          exportColumns,
          exportRows,
          filterColumns,
          defaultFilterColumn: 'batchNo',
          draftFilterRows: pagedGrid.draftFilterRows,
          onDraftFilterRowsChange: pagedGrid.setDraftFilterRows,
          filterLogic: pagedGrid.filterLogic,
          onFilterLogicChange: pagedGrid.setFilterLogic,
          onApplyFilters: pagedGrid.applyAdvancedFilters,
          onClearFilters: pagedGrid.clearAdvancedFilters,
          translationNamespace: 'common',
          appliedFilterCount: pagedGrid.appliedAdvancedFilters.length,
          search: { ...pagedGrid.searchConfig, placeholder: t('preLabelReceiving.searchPlaceholder') },
          leftSlot: (
            <VoiceSearchButton
              onResult={pagedGrid.handleVoiceSearch}
              size="icon"
              variant="ghost"
              className="wms-ops-voice-btn"
            />
          ),
          refresh: {
              onRefresh: () => void batchesQuery.refetch(),
              isLoading: batchesQuery.isFetching,
              label: t('common.refresh'),
              disabled: batchesQuery.isFetching,
          },
          variant: 'ops',
        }}
      />
      )}

      <PreReceiptBatchScanDialog
        batch={scanBatch}
        open={Boolean(scanBatch)}
        onOpenChange={(open) => {
          if (!open) setScanBatch(null);
        }}
      />

      <div className="wms-ops-hint-banner">
        <RefreshCw className="size-3.5 shrink-0" aria-hidden />
        <span>{receivingMode === 'orders' ? t('preLabelReceiving.orderHelpText') : t('preLabelReceiving.helpText')}</span>
      </div>
    </OpsListPageShell>
  );
}

interface PreReceiptBatchScanDialogProps {
  batch: GrPreReceiptLabelBatch | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function PreReceiptBatchScanDialog({ batch, open, onOpenChange }: PreReceiptBatchScanDialogProps): ReactElement {
  const { t } = useTranslation(['goods-receipt', 'common']);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [singleBarcode, setSingleBarcode] = useState('');
  const [bulkBarcodes, setBulkBarcodes] = useState('');
  const [selectedLabelIds, setSelectedLabelIds] = useState<number[]>([]);

  useEffect(() => {
    if (!open) {
      setSingleBarcode('');
      setBulkBarcodes('');
      setSelectedLabelIds([]);
    }
  }, [open, batch?.id]);

  const labelsQuery = useQuery({
    queryKey: ['goods-receipt-pre-label-batch-labels', batch?.id],
    queryFn: ({ signal }) => goodsReceiptApi.getPreReceiptLabelsByBatchId(batch!.id, { signal }),
    enabled: open && Boolean(batch?.id),
  });

  const labels = labelsQuery.data ?? [];
  const labelsByBarcode = useMemo(() => {
    const map = new Map<string, GrPreReceiptLabel>();
    for (const label of labels) {
      map.set(normalizeBarcode(label.barcodeValue), label);
    }
    return map;
  }, [labels]);

  const selectedLabels = useMemo(() => {
    const selected = new Set(selectedLabelIds);
    return labels.filter((label) => selected.has(label.id));
  }, [labels, selectedLabelIds]);

  const scanStartMutation = useMutation({
    mutationFn: () => {
      if (!batch) {
        throw new Error(t('preLabelReceiving.selectBatchFirst'));
      }

      const assignedHeaderIds = Array.from(new Set(selectedLabels.map((label) => label.grHeaderId).filter((id): id is number => Boolean(id))));
      if (assignedHeaderIds.length === 1 && selectedLabels.every((label) => label.grHeaderId === assignedHeaderIds[0])) {
        return Promise.resolve(assignedHeaderIds[0]);
      }

      if (assignedHeaderIds.length > 0) {
        throw new Error(t('preLabelReceiving.scanMixedAssigned'));
      }

      return goodsReceiptApi.startGoodsReceiptFromScannedPreReceiptLabels(batch.id, {
        labelIds: selectedLabelIds,
        barcodeValues: selectedLabels.map((label) => label.barcodeValue),
      });
    },
    onSuccess: async (headerId) => {
      toast.success(t('preLabelReceiving.selectedStarted', { count: selectedLabelIds.length }));
      await queryClient.invalidateQueries({ queryKey: ['goods-receipt-pre-label-receiving'] });
      await queryClient.invalidateQueries({ queryKey: ['goods-receipt-pre-label-batches'] });
      onOpenChange(false);
      navigate(`/goods-receipt/collection/${headerId}`);
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('common.error')),
  });

  const addLabel = (rawBarcode: string): boolean => {
    const normalized = normalizeBarcode(rawBarcode);
    if (!normalized) return false;

    const label = labelsByBarcode.get(normalized);
    if (!label) {
      toast.error(t('preLabelReceiving.scanNotFound', { barcode: rawBarcode.trim() }));
      return false;
    }

    if (unavailableLabelStatuses.has(label.status)) {
      toast.error(t('preLabelReceiving.scanUnavailable', { barcode: label.barcodeValue }));
      return false;
    }

    setSelectedLabelIds((prev) => {
      if (prev.includes(label.id)) {
        toast.info(t('preLabelReceiving.scanDuplicate', { barcode: label.barcodeValue }));
        return prev;
      }

      return [...prev, label.id];
    });
    return true;
  };

  const handleSingleAdd = (): void => {
    if (addLabel(singleBarcode)) {
      setSingleBarcode('');
    }
  };

  const handleBulkAdd = (): void => {
    const values = splitBarcodeInput(bulkBarcodes);
    if (values.length === 0) {
      toast.error(t('preLabelReceiving.bulkEmpty'));
      return;
    }

    let added = 0;
    for (const value of values) {
      if (addLabel(value)) added++;
    }

    setBulkBarcodes('');
    toast.success(t('preLabelReceiving.bulkAdded', { count: added }));
  };

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      const detectorCtor = getBarcodeDetector();
      const values = await detectBarcodeValuesFromPhoto(file, detectorCtor);
      if (values.length === 0) {
        toast.error(t('preLabelReceiving.photoNoBarcode'));
        return;
      }

      let added = 0;
      for (const value of values) {
        if (addLabel(value)) added++;
      }
      toast.success(t('preLabelReceiving.photoAdded', { count: added, total: values.length }));
    } catch {
      toast.error(t('preLabelReceiving.photoFailed'));
    }
  };

  const removeLabel = (labelId: number): void => {
    setSelectedLabelIds((prev) => prev.filter((id) => id !== labelId));
  };

  const remainingCount = labels.filter((label) => !unavailableLabelStatuses.has(label.status) && !label.consumedAt).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="wms-ops-detail-dialog wms-ops-prelabel-scan max-h-[92vh] overflow-hidden p-0 sm:max-w-5xl">
        <DialogHeader className="wms-ops-detail-dialog__header border-b px-6 py-5">
          <DialogTitle className="wms-ops-detail-dialog__title flex items-center gap-2">
            <ScanLine className="wms-ops-prelabel-scan__title-icon size-5" aria-hidden />
            {t('preLabelReceiving.multiScanTitle')}
          </DialogTitle>
          <DialogDescription className="wms-ops-detail-dialog__description">
            {t('preLabelReceiving.multiScanDescription', { batchNo: batch?.batchNo ?? '-' })}
          </DialogDescription>
        </DialogHeader>

        <div className="wms-ops-prelabel-scan__body grid max-h-[calc(92vh-9rem)] gap-5 overflow-y-auto px-6 py-5 lg:grid-cols-[0.95fr_1.05fr]">
          <section className="wms-ops-prelabel-scan__col space-y-4">
            <div className="wms-ops-prelabel-scan__card">
              <div className="wms-ops-prelabel-scan__meta-grid">
                <div>
                  <div className="wms-ops-prelabel-scan__meta-label">{t('preLabelReceiving.orderNo')}</div>
                  <div className="wms-ops-prelabel-scan__meta-value wms-ops-prelabel-scan__meta-value--mono">{batch?.siparisNo ?? '-'}</div>
                </div>
                <div>
                  <div className="wms-ops-prelabel-scan__meta-label">{t('preLabelReceiving.customer')}</div>
                  <div className="wms-ops-prelabel-scan__meta-value">{[batch?.customerCodeSnapshot, batch?.customerNameSnapshot].filter(Boolean).join(' - ') || '-'}</div>
                </div>
                <div>
                  <div className="wms-ops-prelabel-scan__meta-label">{t('preLabelReceiving.remainingLabels')}</div>
                  <div className="wms-ops-prelabel-scan__meta-value wms-ops-prelabel-scan__meta-value--mono">{remainingCount}</div>
                </div>
              </div>
            </div>

            <div className="wms-ops-prelabel-scan__card">
              <div className="wms-ops-prelabel-scan__section-title">
                <ScanLine className="size-4" aria-hidden />
                {t('preLabelReceiving.singleScan')}
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  value={singleBarcode}
                  onChange={(event) => setSingleBarcode(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      handleSingleAdd();
                    }
                  }}
                  placeholder={t('preLabelReceiving.singleScanPlaceholder')}
                  autoComplete="off"
                  className="wms-ops-prelabel-scan__input"
                />
                <OpsActionButton type="button" variant="primary" onClick={handleSingleAdd} disabled={!singleBarcode.trim() || labelsQuery.isLoading}>
                  <Plus className="mr-2 size-4" aria-hidden />
                  {t('preLabelReceiving.addScan')}
                </OpsActionButton>
              </div>
            </div>

            <div className="wms-ops-prelabel-scan__card">
              <div className="wms-ops-prelabel-scan__section-title">
                <Upload className="size-4" aria-hidden />
                {t('preLabelReceiving.bulkScan')}
              </div>
              <Textarea
                value={bulkBarcodes}
                onChange={(event) => setBulkBarcodes(event.target.value)}
                placeholder={t('preLabelReceiving.bulkScanPlaceholder')}
                className="wms-ops-prelabel-scan__textarea min-h-28"
              />
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <OpsActionButton type="button" variant="secondary" onClick={handleBulkAdd} disabled={!bulkBarcodes.trim() || labelsQuery.isLoading}>
                  {t('preLabelReceiving.addBulkScan')}
                </OpsActionButton>
                <label className="wms-ops-prelabel-scan__photo-btn">
                  <Camera className="size-4" aria-hidden />
                  {t('preLabelReceiving.scanFromPhoto')}
                  <input className="sr-only" type="file" accept="image/*" onChange={(event) => void handleImageUpload(event)} />
                </label>
              </div>
              <p className="wms-ops-prelabel-scan__hint">{t('preLabelReceiving.photoHint')}</p>
            </div>
          </section>

          <section className="wms-ops-prelabel-scan__card wms-ops-prelabel-scan__pool">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="wms-ops-prelabel-scan__section-title">{t('preLabelReceiving.scannedPool')}</h3>
                <p className="wms-ops-prelabel-scan__hint">{t('preLabelReceiving.scannedPoolDescription')}</p>
              </div>
              <Badge variant="outline" className="wms-ops-prelabel-scan__count">{selectedLabels.length}</Badge>
            </div>

            {labelsQuery.isLoading ? (
              <div className="wms-ops-prelabel-scan__empty">{t('common.loading')}</div>
            ) : selectedLabels.length === 0 ? (
              <div className="wms-ops-prelabel-scan__empty">{t('preLabelReceiving.noScannedLabels')}</div>
            ) : (
              <div className="wms-ops-prelabel-scan__table-wrap">
                <div className="max-h-[24rem] overflow-y-auto">
                  <table className="wms-ops-prelabel-scan__table w-full text-left text-sm">
                    <thead>
                      <tr>
                        <th className="px-3 py-2">{t('preLabels.barcode')}</th>
                        <th className="px-3 py-2">{t('preLabels.stock')}</th>
                        <th className="px-3 py-2">{t('preLabels.quantity')}</th>
                        <th className="px-3 py-2">{t('preLabels.serial')}</th>
                        <th className="px-3 py-2 text-right">{t('preLabelReceiving.actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedLabels.map((label) => (
                        <tr key={label.id}>
                          <td className="px-3 py-2 font-mono text-xs">{label.barcodeValue}</td>
                          <td className="px-3 py-2">
                            <div className="font-semibold">{label.stockCodeSnapshot}</div>
                            <div className="text-xs text-muted-foreground">{label.stockNameSnapshot || '-'}</div>
                          </td>
                          <td className="px-3 py-2 font-mono">{label.labelQuantity}</td>
                          <td className="px-3 py-2 font-mono text-xs">{label.serialNo || '-'}</td>
                          <td className="px-3 py-2 text-right">
                            <Button type="button" variant="ghost" size="icon" onClick={() => removeLabel(label.id)} aria-label={t('common.delete')}>
                              <Trash2 className="size-4" aria-hidden />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        </div>

        <DialogFooter className="wms-ops-actions wms-ops-prelabel-scan__footer border-t px-6 py-4">
          <OpsActionButton type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </OpsActionButton>
          <OpsActionButton
            type="button"
            variant="primary"
            onClick={() => scanStartMutation.mutate()}
            disabled={selectedLabelIds.length === 0 || scanStartMutation.isPending}
          >
            <PackageCheck className="mr-2 size-4" aria-hidden />
            {scanStartMutation.isPending ? t('common.saving') : t('preLabelReceiving.startSelectedScans', { count: selectedLabelIds.length })}
          </OpsActionButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function OrderBasedReceivingPanel(): ReactElement {
  const { t } = useTranslation(['goods-receipt', 'common']);
  const navigate = useNavigate();
  const permission = useCrudPermission('wms.goods-receipt');
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedOrderItems, setSelectedOrderItems] = useState<SelectedOrderItem[]>([]);
  const schema = useMemo(() => createGoodsReceiptFormSchema(t), [t]);

  const form = useForm({
    resolver: zodResolver(schema),
    shouldFocusError: false,
    defaultValues: {
      receiptDate: new Date().toISOString().split('T')[0],
      documentNo: '',
      projectCode: '',
      isInvoice: false,
      customerId: '',
      customerRefId: undefined,
      notes: '',
    },
  });

  const createMutation = useMutation({
    mutationFn: async (formData: GoodsReceiptFormData) => goodsReceiptApi.processGoodsReceipt(formData, selectedOrderItems, false),
    onSuccess: () => {
      toast.success(t('preLabelReceiving.orderStarted'));
      navigate('/goods-receipt/list');
    },
    onError: (error: Error) => {
      toast.error(error.message || t('goodsReceipt.process.error'));
    },
  });

  const steps = [
    { label: t('goodsReceipt.create.steps.basicInfo') },
    { label: t('goodsReceipt.create.steps.orderSelection') },
  ];

  const handleNext = async (): Promise<void> => {
    if (currentStep === 1) {
      const isValid = await form.trigger();
      if (!isValid) return;
    }

    if (currentStep === 2 && selectedOrderItems.length === 0) {
      toast.error(t('common.validation.selectAtLeastOneItem'));
      return;
    }

    setCurrentStep((prev) => Math.min(prev + 1, steps.length));
  };

  const handleToggleOrderItem = (item: OrderItem): void => {
    setSelectedOrderItems((prev) => {
      const existingIndex = prev.findIndex((selected) => selected.id === item.id);
      if (existingIndex >= 0) {
        return prev.filter((_, idx) => idx !== existingIndex);
      }

      return [
        ...prev,
        {
          ...item,
          receiptQuantity: item.quantity || 0,
          isSelected: true,
        } as SelectedOrderItem,
      ];
    });
  };

  const handleUpdateOrderItem = (itemId: string, updates: Partial<SelectedOrderItem>): void => {
    setSelectedOrderItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, ...updates } : item)));
  };

  const handleRemoveOrderItem = (itemId: string): void => {
    setSelectedOrderItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const handleSave = async (): Promise<void> => {
    await createMutation.mutateAsync(form.getValues() as GoodsReceiptFormData);
  };

  return (
    <Form {...form}>
      <div className="space-y-6">
        {!permission.canCreate ? <PermissionNotice /> : null}
        <div className="wms-ops-prelabel-scan__card wms-ops-prelabel-order-banner">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="wms-ops-prelabel-scan__section-title mb-0">{t('preLabelReceiving.orderModeTitle')}</h3>
              <p className="wms-ops-prelabel-scan__hint mt-1 max-w-3xl normal-case tracking-normal">{t('preLabelReceiving.orderModeDescription')}</p>
            </div>
            <span className="wms-ops-prelabel-order-banner__badge">
              {t('preLabelReceiving.noPreLabelRequired')}
            </span>
          </div>
        </div>

        <Breadcrumb
          items={steps.map((step, index) => ({
            label: step.label,
            isActive: index + 1 === currentStep,
          }))}
          className="wms-ops-steps"
        />

        <form className="space-y-6">
          <fieldset disabled={!permission.canCreate} className={!permission.canCreate ? 'pointer-events-none opacity-75' : undefined}>
            {currentStep === 1 ? (
              <Step1BasicInfo variant="ops" />
            ) : (
              <Step2OrderSelection
                variant="ops"
                selectedItems={selectedOrderItems}
                onToggleItem={handleToggleOrderItem}
                onUpdateItem={handleUpdateOrderItem}
                onRemoveItem={handleRemoveOrderItem}
              />
            )}

            <div className="wms-ops-actions mt-6 flex justify-between gap-4 border-t pt-6">
              <OpsActionButton
                type="button"
                variant="secondary"
                onClick={() => setCurrentStep((prev) => Math.max(prev - 1, 1))}
                disabled={currentStep === 1}
              >
                {t('common.previous')}
              </OpsActionButton>
              <div className="flex gap-3">
                {currentStep < steps.length ? (
                  <OpsActionButton type="button" variant="primary" onClick={handleNext} disabled={!permission.canCreate}>
                    {t('common.next')}
                  </OpsActionButton>
                ) : (
                  <OpsActionButton
                    type="button"
                    variant="primary"
                    onClick={handleSave}
                    disabled={!permission.canCreate || createMutation.isPending || selectedOrderItems.length === 0}
                  >
                    {createMutation.isPending ? t('common.saving') : t('preLabelReceiving.startOrderReceipt')}
                  </OpsActionButton>
                )}
              </div>
            </div>
          </fieldset>
        </form>
    </div>
    </Form>
  );
}
