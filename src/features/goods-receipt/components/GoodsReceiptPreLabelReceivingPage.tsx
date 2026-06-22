import { type ReactElement, type ReactNode, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowDown, ArrowUp, FileText, PackageCheck, RefreshCw, ScanLine } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  type GrPreReceiptLabelBatch,
  type OrderItem,
  type SelectedOrderItem,
} from '../types/goods-receipt';
import { getPreLabelStatusBadgeClass } from '../utils/pre-label-status-badge';
import { Step1BasicInfo } from './steps/Step1BasicInfo';
import { Step2OrderSelection } from './steps/Step2OrderSelection';

type ColumnKey = 'batchNo' | 'siparisNo' | 'customer' | 'status' | 'progress' | 'createdDate' | 'actions';

const actionableStatuses = new Set(['Generated', 'Printed', 'PartiallyPrinted', 'PartiallyConsumed']);

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
              className="wms-ops-grid-icon-btn wms-ops-grid-icon-btn--start"
              aria-label={t('preLabelReceiving.startScan')}
              title={t('preLabelReceiving.startScan')}
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

      <div className="wms-ops-hint-banner">
        <RefreshCw className="size-3.5 shrink-0" aria-hidden />
        <span>{receivingMode === 'orders' ? t('preLabelReceiving.orderHelpText') : t('preLabelReceiving.helpText')}</span>
      </div>
    </OpsListPageShell>
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
        <div className="rounded-2xl border border-[color-mix(in_oklab,var(--wms-ops-accent)_18%,transparent)] bg-[color-mix(in_oklab,var(--wms-ops-card)_92%,transparent)] p-4 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-base font-semibold text-foreground">{t('preLabelReceiving.orderModeTitle')}</h3>
              <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{t('preLabelReceiving.orderModeDescription')}</p>
            </div>
            <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
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
