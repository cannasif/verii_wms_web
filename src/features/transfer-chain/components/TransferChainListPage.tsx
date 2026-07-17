import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Eye, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DeleteConfirmDialog, OpsActionButton, OpsFieldShell, OpsInput, OpsListPageShell, OpsTextarea, PagedDataGrid, type PagedDataGridColumn } from '@/components/shared';
import { OPS_FIELD_CLASS, OPS_SELECT_CONTENT_CLASS } from '@/components/shared/ops-field-styles';
import { VoiceSearchButton } from '@/components/ui/voice-search-button';
import { useColumnPreferences } from '@/hooks/useColumnPreferences';
import { usePagedDataGrid } from '@/hooks/usePagedDataGrid';
import { getLocaleForFormatting } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { getPagedRange } from '@/lib/paged';
import type { FilterColumnConfig } from '@/lib/advanced-filter-types';
import { useUIStore } from '@/stores/ui-store';
import { useCrudPermission } from '@/features/access-control/hooks/useCrudPermission';
import { transferChainApi } from '../api/transferChainApi';
import {
  useAddTransferChainStepMutation,
  useCreateTransferChainMutation,
  useDeleteTransferChainMutation,
  useDeleteTransferChainStepMutation,
  useTransferChainDetailQuery,
  useTransferChainsQuery,
  useUpdateTransferChainMutation,
  useUpdateTransferChainStepMutation,
} from '../hooks/useTransferChainQueries';
import {
  TRANSFER_CHAIN_SOURCE_TYPES,
  TRANSFER_CHAIN_STATUSES,
  TRANSFER_CHAIN_STEP_STATUSES,
  type CreateTransferChainDto,
  type CreateTransferChainStepDto,
  type TransferChainDto,
  type TransferChainPagedRowDto,
  type TransferChainReadinessDto,
} from '../types/transfer-chain.types';

type ChainColumnKey = 'code' | 'name' | 'status' | 'chainType' | 'sourceDocument' | 'progress' | 'createdDate' | 'actions';

const DEFAULT_COLUMN_WIDTHS: Record<string, number> = {
  code: 12,
  name: 16,
  status: 10,
  chainType: 10,
  sourceDocument: 14,
  progress: 10,
  createdDate: 14,
};

const emptyChainForm: CreateTransferChainDto = {
  code: '',
  name: '',
  chainType: 'Transfer',
  sourceDocumentType: '',
  status: TRANSFER_CHAIN_STATUSES.active,
  description: '',
  steps: [],
};

const emptyStepForm: CreateTransferChainStepDto = {
  sourceType: TRANSFER_CHAIN_SOURCE_TYPES.warehouseTransfer,
  sourceHeaderId: 0,
  sequenceNo: 1,
  dependencyType: 'FinishToStart',
  isRequired: true,
  note: '',
};

function mapSortBy(value: ChainColumnKey): string {
  switch (value) {
    case 'code':
      return 'Code';
    case 'name':
      return 'Name';
    case 'status':
      return 'Status';
    case 'chainType':
      return 'ChainType';
    case 'createdDate':
      return 'CreatedDate';
    default:
      return 'Id';
  }
}

function formatDate(value?: string | null, locale = 'tr-TR'): string {
  if (!value) return '-';
  return new Intl.DateTimeFormat(locale, { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
}

function statusBadge(status: string, label: string): ReactElement {
  if (status === TRANSFER_CHAIN_STATUSES.completed) {
    return <Badge variant="outline" className="wms-ops-status-badge wms-ops-status-badge--done mx-auto">{label}</Badge>;
  }
  if (status === TRANSFER_CHAIN_STATUSES.cancelled) {
    return <Badge variant="outline" className="wms-ops-status-badge wms-ops-status-badge--danger mx-auto">{label}</Badge>;
  }
  if (status === TRANSFER_CHAIN_STATUSES.active) {
    return <Badge variant="outline" className="wms-ops-status-badge wms-ops-status-badge--active mx-auto">{label}</Badge>;
  }
  if (status === TRANSFER_CHAIN_STATUSES.draft) {
    return <Badge variant="outline" className="wms-ops-status-badge wms-ops-status-badge--pending mx-auto">{label}</Badge>;
  }
  return <Badge variant="outline" className="wms-ops-status-badge mx-auto">{label}</Badge>;
}

function stepStatusBadge(status: string, label: string): ReactElement {
  if (status === TRANSFER_CHAIN_STEP_STATUSES.completed) {
    return <Badge variant="outline" className="wms-ops-status-badge wms-ops-status-badge--done">{label}</Badge>;
  }
  if (status === TRANSFER_CHAIN_STEP_STATUSES.ready || status === TRANSFER_CHAIN_STEP_STATUSES.inProgress) {
    return <Badge variant="outline" className="wms-ops-status-badge wms-ops-status-badge--active">{label}</Badge>;
  }
  if (status === TRANSFER_CHAIN_STEP_STATUSES.blocked) {
    return <Badge variant="outline" className="wms-ops-status-badge wms-ops-status-badge--pending">{label}</Badge>;
  }
  if (status === TRANSFER_CHAIN_STEP_STATUSES.cancelled) {
    return <Badge variant="outline" className="wms-ops-status-badge wms-ops-status-badge--danger">{label}</Badge>;
  }
  return <Badge variant="outline" className="wms-ops-status-badge">{label}</Badge>;
}

export function TransferChainListPage(): ReactElement {
  const { t, i18n } = useTranslation(['transfer-chain', 'common']);
  const { setPageTitle } = useUIStore();
  const queryClient = useQueryClient();
  const permission = useCrudPermission('wms.transfer');
  const pageKey = 'transfer-chain-list';

  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedChainId, setSelectedChainId] = useState<number | null>(null);
  const [deleteItem, setDeleteItem] = useState<TransferChainPagedRowDto | null>(null);
  const [editingItem, setEditingItem] = useState<TransferChainDto | null>(null);
  const [chainForm, setChainForm] = useState<CreateTransferChainDto>(emptyChainForm);
  const [stepForm, setStepForm] = useState<CreateTransferChainStepDto>(emptyStepForm);
  const [readiness, setReadiness] = useState<TransferChainReadinessDto | null>(null);
  const [readinessLoading, setReadinessLoading] = useState(false);

  const pagedGrid = usePagedDataGrid<ChainColumnKey>({
    pageKey,
    defaultSortBy: 'createdDate',
    defaultSortDirection: 'desc',
    defaultPageSize: 20,
    mapSortBy,
  });

  const locale = getLocaleForFormatting(i18n.resolvedLanguage ?? i18n.language);
  const labelStatus = (status: string): string => t(`status.${status}`, { defaultValue: status });
  const labelStepStatus = (status: string): string => t(`stepStatus.${status}`, { defaultValue: status });
  const labelSourceType = (sourceType: string): string => t(`sourceType.${sourceType}`, { defaultValue: sourceType });

  const advancedFilterColumns = useMemo<readonly FilterColumnConfig[]>(() => [
    { value: 'Code', type: 'string', labelKey: t('table.code') },
    { value: 'Name', type: 'string', labelKey: t('table.name') },
    { value: 'Status', type: 'string', labelKey: t('table.status') },
    { value: 'ChainType', type: 'string', labelKey: t('table.chainType') },
    { value: 'SourceDocumentType', type: 'string', labelKey: t('table.sourceDocumentType') },
  ], [t]);

  const columns = useMemo<PagedDataGridColumn<ChainColumnKey>[]>(() => [
    { key: 'code', label: t('table.code'), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
    { key: 'name', label: t('table.name'), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
    { key: 'status', label: t('table.status'), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
    { key: 'chainType', label: t('table.type'), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
    { key: 'sourceDocument', label: t('table.sourceDocument'), sortable: false, headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
    { key: 'progress', label: t('table.progress'), sortable: false, headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
    { key: 'createdDate', label: t('table.createdDate'), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
    { key: 'actions', label: t('common:actions'), sortable: false },
  ], [t]);

  const showActionsColumn = permission.canView || permission.canUpdate || permission.canDelete;

  const { userId, columnOrder, visibleColumns, orderedVisibleColumns, columnWidths, setColumnOrder, setVisibleColumns, resizeColumnPair } = useColumnPreferences({
    pageKey,
    columns: columns.map(({ key, label }) => ({ key, label })),
    defaultWidths: DEFAULT_COLUMN_WIDTHS,
    includeActionsColumn: showActionsColumn,
  });

  const { data, isLoading, error } = useTransferChainsQuery(pagedGrid.queryParams);
  const { data: detail, isLoading: detailLoading } = useTransferChainDetailQuery(selectedChainId);
  const createMutation = useCreateTransferChainMutation();
  const updateMutation = useUpdateTransferChainMutation();
  const deleteMutation = useDeleteTransferChainMutation();
  const addStepMutation = useAddTransferChainStepMutation();
  const updateStepMutation = useUpdateTransferChainStepMutation();
  const deleteStepMutation = useDeleteTransferChainStepMutation();

  useEffect(() => {
    setPageTitle(t('title'));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

  useEffect(() => {
    if (!formOpen) return;
    if (editingItem) {
      setChainForm({
        code: editingItem.code,
        name: editingItem.name,
        chainType: editingItem.chainType,
        sourceDocumentType: editingItem.sourceDocumentType ?? '',
        sourceDocumentId: editingItem.sourceDocumentId ?? undefined,
        status: editingItem.status,
        description: editingItem.description ?? '',
        steps: [],
      });
      return;
    }
    setChainForm({ ...emptyChainForm, code: `CHAIN-${Date.now()}` });
  }, [editingItem, formOpen]);

  const range = getPagedRange(data);
  const paginationInfoText = t('common:paginationInfo', {
    current: range.from,
    total: range.to,
    totalCount: range.total,
    defaultValue: `${range.from}-${range.to} / ${range.total}`,
  });
  const visibleColumnKeys = useMemo(() => orderedVisibleColumns.filter((key) => key !== 'actions') as ChainColumnKey[], [orderedVisibleColumns]);

  const getCellText = (row: TransferChainPagedRowDto, key: ChainColumnKey): string | undefined => {
    switch (key) {
      case 'code': return row.code;
      case 'name': return row.name;
      case 'status': return labelStatus(row.status);
      case 'chainType': return row.chainType;
      case 'sourceDocument':
        return row.sourceDocumentType ? `${row.sourceDocumentType}${row.sourceDocumentId ? ` #${row.sourceDocumentId}` : ''}` : '-';
      case 'progress': return `${row.completedStepCount}/${row.stepCount}`;
      case 'createdDate': return formatDate(row.createdDate, locale);
      default: return undefined;
    }
  };
  const exportColumns = useMemo(
    () => orderedVisibleColumns.filter((key) => key !== 'actions').map((key) => ({ key, label: columns.find((column) => column.key === key)?.label ?? key })),
    [columns, orderedVisibleColumns],
  );
  const exportRows = useMemo<Record<string, unknown>[]>(() => (data?.data ?? []).map((item) => ({
    code: item.code,
    name: item.name,
    status: labelStatus(item.status),
    chainType: item.chainType,
    sourceDocument: [item.sourceDocumentType, item.sourceDocumentId].filter(Boolean).join(' #'),
    progress: `${item.completedStepCount}/${item.stepCount}`,
    createdDate: formatDate(item.createdDate, locale),
  })), [data?.data, locale, t]);

  const renderSortIcon = (columnKey: ChainColumnKey): ReactElement | null => {
    if (columnKey !== pagedGrid.sortBy) return null;
    return pagedGrid.sortDirection === 'asc' ? <ArrowUp className="ml-1 h-3.5 w-3.5" /> : <ArrowDown className="ml-1 h-3.5 w-3.5" />;
  };

  const handleRefresh = async (): Promise<void> => {
    await queryClient.invalidateQueries({ queryKey: ['transfer-chain'] });
  };

  const openDetail = (id: number): void => {
    setSelectedChainId(id);
    setDetailOpen(true);
    setReadiness(null);
  };

  const handleSubmitChain = async (): Promise<void> => {
    const dto: CreateTransferChainDto = {
      ...chainForm,
      code: chainForm.code.trim(),
      name: chainForm.name.trim(),
      chainType: chainForm.chainType?.trim() || 'Transfer',
      sourceDocumentType: chainForm.sourceDocumentType?.trim() || undefined,
      sourceDocumentId: chainForm.sourceDocumentId || undefined,
      description: chainForm.description?.trim() || undefined,
      steps: editingItem ? [] : chainForm.steps,
    };
    if (!dto.code || !dto.name) return;
    if (editingItem) {
      await updateMutation.mutateAsync({
        id: editingItem.id,
        dto: {
          name: dto.name,
          chainType: dto.chainType,
          sourceDocumentType: dto.sourceDocumentType ?? null,
          sourceDocumentId: dto.sourceDocumentId ?? null,
          status: dto.status,
          description: dto.description ?? null,
        },
      });
    } else {
      await createMutation.mutateAsync(dto);
    }
    setFormOpen(false);
    setEditingItem(null);
  };

  const handleAddStep = async (): Promise<void> => {
    if (!detail) return;
    const dto = {
      ...stepForm,
      sourceHeaderId: Number(stepForm.sourceHeaderId),
      sequenceNo: Number(stepForm.sequenceNo),
      dependencyType: stepForm.dependencyType || 'FinishToStart',
      note: stepForm.note?.trim() || undefined,
    };
    if (!dto.sourceHeaderId || !dto.sequenceNo) return;
    await addStepMutation.mutateAsync({ chainId: detail.id, dto });
    const lastStep = detail.steps[detail.steps.length - 1];
    setStepForm({ ...emptyStepForm, sequenceNo: (lastStep?.sequenceNo ?? 0) + 1 });
  };

  const handleReadinessCheck = async (): Promise<void> => {
    if (!stepForm.sourceType || !stepForm.sourceHeaderId) return;
    setReadinessLoading(true);
    try {
      const result = await transferChainApi.getReadiness(stepForm.sourceType, Number(stepForm.sourceHeaderId));
      setReadiness(result);
    } finally {
      setReadinessLoading(false);
    }
  };

  return (
    <>
      <OpsListPageShell
        eyebrow={
          <>
            <span>{t('breadcrumb.parent')}</span>
            <span className="mx-2 opacity-60">/</span>
            <span>{t('breadcrumb.module')}</span>
          </>
        }
        title={t('title')}
        description={t('hero.description')}
        actions={
          permission.canCreate ? (
            <OpsActionButton
              type="button"
              variant="primary"
              onClick={() => { setEditingItem(null); setFormOpen(true); }}
            >
              <Plus className="size-3.5" aria-hidden />
              {t('hero.create')}
            </OpsActionButton>
          ) : null
        }
      >
        <PagedDataGrid<TransferChainPagedRowDto, ChainColumnKey>
          variant="ops"
          columns={columns}
          visibleColumnKeys={visibleColumnKeys}
          defaultColumnWidths={DEFAULT_COLUMN_WIDTHS}
          columnWidths={columnWidths}
          onResizeColumnPair={resizeColumnPair}
          getCellText={getCellText}
          rows={data?.data ?? []}
          rowKey={(row) => row.id}
          renderCell={(item, columnKey) => ({
            code: <span className="font-mono text-xs font-medium">{item.code}</span>,
            name: (
              <button
                type="button"
                className="font-medium hover:underline"
                onClick={() => openDetail(item.id)}
              >
                {item.name}
              </button>
            ),
            status: statusBadge(item.status, labelStatus(item.status)),
            chainType: <Badge variant="outline" className="wms-ops-code-badge mx-auto rounded-none text-[0.625rem]">{item.chainType}</Badge>,
            sourceDocument: item.sourceDocumentType
              ? <span className="font-mono text-xs">{item.sourceDocumentType}{item.sourceDocumentId ? ` #${item.sourceDocumentId}` : ''}</span>
              : '-',
            progress: <span className="font-semibold">{item.completedStepCount}/{item.stepCount}</span>,
            createdDate: <span className="font-mono text-xs">{formatDate(item.createdDate, locale)}</span>,
          } as Record<Exclude<ChainColumnKey, 'actions'>, React.ReactNode>)[columnKey as Exclude<ChainColumnKey, 'actions'>] ?? null}
          sortBy={pagedGrid.sortBy}
          sortDirection={pagedGrid.sortDirection}
          onSort={(columnKey) => {
            if (columnKey !== 'actions') pagedGrid.handleSort(columnKey);
          }}
          renderSortIcon={renderSortIcon}
          isLoading={isLoading}
          isError={!!error}
          errorText={error instanceof Error ? error.message : undefined}
          emptyText={t('common:noData')}
          showActionsColumn={showActionsColumn}
          actionsHeaderLabel={t('common:actions')}
          iconOnlyActions={false}
          actionsCellClassName="wms-ops-table-actions-col"
          renderActionsCell={(item) => (
            <div className="wms-ops-row-actions">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="wms-ops-grid-icon-btn"
                aria-label={t('table.detail')}
                title={t('table.detail')}
                onClick={() => openDetail(item.id)}
              >
                <Eye className="size-3" aria-hidden />
              </Button>
              {permission.canUpdate ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="wms-ops-grid-icon-btn"
                  aria-label={t('common:edit')}
                  title={t('common:edit')}
                  onClick={async () => {
                    const chain = await transferChainApi.getById(item.id);
                    setEditingItem(chain);
                    setFormOpen(true);
                  }}
                >
                  <Pencil className="size-3" aria-hidden />
                </Button>
              ) : null}
              {permission.canDelete ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="wms-ops-grid-icon-btn wms-ops-grid-icon-btn--danger"
                  aria-label={t('common:delete')}
                  title={t('common:delete')}
                  onClick={() => setDeleteItem(item)}
                >
                  <Trash2 className="size-3" aria-hidden />
                </Button>
              ) : null}
            </div>
          )}
          pageSize={data?.pageSize ?? pagedGrid.pageSize}
          pageSizeOptions={pagedGrid.pageSizeOptions}
          onPageSizeChange={pagedGrid.handlePageSizeChange}
          pageNumber={pagedGrid.getDisplayPageNumber(data)}
          totalPages={Math.max(data?.totalPages ?? 1, 1)}
          hasPreviousPage={Boolean(data?.hasPreviousPage)}
          hasNextPage={Boolean(data?.hasNextPage)}
          onPreviousPage={pagedGrid.goToPreviousPage}
          onNextPage={pagedGrid.goToNextPage}
          previousLabel={t('common:previous')}
          nextLabel={t('common:next')}
          paginationInfoText={paginationInfoText}
          actionBar={{
            pageKey,
            userId,
            columns: columns.map(({ key, label }) => ({ key, label })),
            visibleColumns,
            columnOrder,
            onVisibleColumnsChange: setVisibleColumns,
            onColumnOrderChange: setColumnOrder,
            exportFileName: 'transfer-chain',
            exportColumns,
            exportRows,
            filterColumns: advancedFilterColumns,
            defaultFilterColumn: 'Code',
            draftFilterRows: pagedGrid.draftFilterRows,
            onDraftFilterRowsChange: pagedGrid.setDraftFilterRows,
            filterLogic: pagedGrid.filterLogic,
            onFilterLogicChange: pagedGrid.setFilterLogic,
            onApplyFilters: pagedGrid.applyAdvancedFilters,
            onClearFilters: pagedGrid.clearAdvancedFilters,
            appliedFilterCount: pagedGrid.appliedAdvancedFilters.length,
            search: {
              value: pagedGrid.searchInput,
              onValueChange: pagedGrid.searchConfig.onValueChange,
              onSearchChange: pagedGrid.searchConfig.onSearchChange,
              placeholder: t('common:search'),
            },
            refresh: { onRefresh: handleRefresh, isLoading, label: t('common:refresh') },
            leftSlot: (
              <VoiceSearchButton
                onResult={pagedGrid.handleVoiceSearch}
                size="icon"
                variant="ghost"
                className="wms-ops-voice-btn"
              />
            ),
            variant: 'ops',
          }}
        />
      </OpsListPageShell>

      <Dialog open={formOpen} onOpenChange={(next) => { setFormOpen(next); if (!next) setEditingItem(null); }}>
        <DialogContent className="wms-ops-form wms-ops-detail-dialog flex max-h-[90dvh] w-[95vw] max-w-[calc(100vw-1rem)] flex-col gap-0 overflow-hidden border-0 p-0 shadow-none sm:max-w-[95vw] lg:max-w-2xl">
          <DialogHeader className="wms-ops-detail-dialog__header shrink-0 border-b px-4 py-4 pr-12 sm:px-6 sm:pr-14">
            <DialogTitle className="wms-ops-detail-dialog__title">
              {editingItem ? t('form.editTitle') : t('form.createTitle')}
            </DialogTitle>
            <DialogDescription className="wms-ops-detail-dialog__description">
              {t('form.description')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid flex-1 gap-4 overflow-y-auto px-4 py-4 sm:grid-cols-2 sm:px-6 sm:py-5">
            <OpsField label={t('form.code')}>
              <OpsInput value={chainForm.code} disabled={!!editingItem} onChange={(event) => setChainForm((prev) => ({ ...prev, code: event.target.value }))} />
            </OpsField>
            <OpsField label={t('form.name')}>
              <OpsInput value={chainForm.name} onChange={(event) => setChainForm((prev) => ({ ...prev, name: event.target.value }))} />
            </OpsField>
            <OpsField label={t('form.status')}>
              <OpsFieldShell>
                <Select value={chainForm.status ?? TRANSFER_CHAIN_STATUSES.active} onValueChange={(value) => setChainForm((prev) => ({ ...prev, status: value }))}>
                  <SelectTrigger className={cn('w-full', OPS_FIELD_CLASS)}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className={OPS_SELECT_CONTENT_CLASS}>
                    {Object.values(TRANSFER_CHAIN_STATUSES).map((status) => (
                      <SelectItem key={status} value={status}>{labelStatus(status)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </OpsFieldShell>
            </OpsField>
            <OpsField label={t('form.chainType')}>
              <OpsInput value={chainForm.chainType ?? ''} onChange={(event) => setChainForm((prev) => ({ ...prev, chainType: event.target.value }))} />
            </OpsField>
            <OpsField label={t('form.sourceDocumentType')}>
              <OpsInput
                value={chainForm.sourceDocumentType ?? ''}
                onChange={(event) => setChainForm((prev) => ({ ...prev, sourceDocumentType: event.target.value }))}
                placeholder={t('form.sourceDocumentTypePlaceholder')}
              />
            </OpsField>
            <OpsField label={t('form.sourceDocumentId')}>
              <OpsInput
                type="number"
                value={chainForm.sourceDocumentId ?? ''}
                onChange={(event) => setChainForm((prev) => ({ ...prev, sourceDocumentId: Number(event.target.value) || undefined }))}
              />
            </OpsField>
            <div className="sm:col-span-2">
              <OpsField label={t('form.descriptionLabel')}>
                <OpsTextarea value={chainForm.description ?? ''} onChange={(event) => setChainForm((prev) => ({ ...prev, description: event.target.value }))} rows={4} />
              </OpsField>
            </div>
          </div>
          <DialogFooter className="shrink-0 gap-2 border-t px-4 py-4 sm:px-6 sm:gap-2">
            <OpsActionButton type="button" variant="secondary" onClick={() => setFormOpen(false)}>
              {t('common:cancel')}
            </OpsActionButton>
            <OpsActionButton
              type="button"
              variant="primary"
              disabled={!chainForm.code.trim() || !chainForm.name.trim() || createMutation.isPending || updateMutation.isPending}
              onClick={handleSubmitChain}
            >
              {createMutation.isPending || updateMutation.isPending ? t('common:processing') : t('common:save')}
            </OpsActionButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-h-[88dvh] w-[95vw] max-w-[calc(100vw-1rem)] overflow-y-auto sm:max-w-[95vw] lg:max-w-5xl">
          <DialogHeader>
            <DialogTitle>{detail?.name ?? t('detail.fallbackTitle')}</DialogTitle>
            <DialogDescription>{detail ? `${detail.code} - ${labelStatus(detail.status)}` : t('detail.loading')}</DialogDescription>
          </DialogHeader>

          {detailLoading ? <div className="py-8 text-center text-sm text-slate-500">{t('common:loading')}</div> : null}
          {detail ? (
            <div className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-4">
                <InfoCard label={t('table.code')} value={detail.code} />
                <InfoCard label={t('table.status')} value={labelStatus(detail.status)} />
                <InfoCard label={t('table.type')} value={detail.chainType} />
                <InfoCard label={t('detail.step')} value={`${detail.steps.filter((step) => step.status === TRANSFER_CHAIN_STEP_STATUSES.completed).length}/${detail.steps.length}`} />
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-black text-slate-900 dark:text-white">{t('detail.stepsTitle')}</h3>
                    <p className="text-sm text-slate-500">{t('detail.stepsDescription')}</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => { void handleRefresh(); }}><RefreshCw className="mr-2 size-4" />{t('common:refresh')}</Button>
                </div>
                <div className="space-y-2">
                  {detail.steps.map((step) => (
                    <div key={step.id} className="grid gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3 text-sm dark:border-white/10 dark:bg-slate-950/40 md:grid-cols-[80px_1fr_140px_120px_auto] md:items-center">
                      <div className="font-black">#{step.sequenceNo}</div>
                      <div>
                        <div className="font-semibold">{labelSourceType(step.sourceType)} #{step.sourceHeaderId}</div>
                        <div className="text-xs text-slate-500">{step.note || step.dependencyType}</div>
                      </div>
                      <div>{stepStatusBadge(step.status, labelStepStatus(step.status))}</div>
                      <div className="text-xs text-slate-500">{step.completedDate ? formatDate(step.completedDate, locale) : step.readyDate ? formatDate(step.readyDate, locale) : '-'}</div>
                      <div className="flex justify-end gap-2">
                        {permission.canUpdate && step.status === TRANSFER_CHAIN_STEP_STATUSES.blocked ? (
                          <Button size="sm" variant="outline" onClick={() => updateStepMutation.mutate({ stepId: step.id, dto: { status: TRANSFER_CHAIN_STEP_STATUSES.ready } })}>{t('detail.prepare')}</Button>
                        ) : null}
                        {permission.canUpdate && step.status !== TRANSFER_CHAIN_STEP_STATUSES.completed ? (
                          <Button size="sm" variant="outline" onClick={() => updateStepMutation.mutate({ stepId: step.id, dto: { status: TRANSFER_CHAIN_STEP_STATUSES.skipped } })}>{t('detail.skip')}</Button>
                        ) : null}
                        {permission.canDelete ? (
                          <Button size="sm" variant="outline" className="text-rose-600" onClick={() => deleteStepMutation.mutate(step.id)}><Trash2 className="size-4" /></Button>
                        ) : null}
                      </div>
                    </div>
                  ))}
                  {detail.steps.length === 0 ? <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-slate-500">{t('detail.emptySteps')}</div> : null}
                </div>
              </div>

              {permission.canUpdate ? (
                <div className="rounded-2xl border border-cyan-200 bg-cyan-50/70 p-4 dark:border-cyan-800/40 dark:bg-cyan-950/20">
                  <h3 className="font-black text-slate-900 dark:text-white">{t('stepForm.title')}</h3>
                  <div className="mt-4 grid gap-3 md:grid-cols-5">
                    <OpsField label={t('stepForm.source')}>
                      <Select value={stepForm.sourceType} onValueChange={(value) => setStepForm((prev) => ({ ...prev, sourceType: value }))}>
                        <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value={TRANSFER_CHAIN_SOURCE_TYPES.warehouseTransfer}>{labelSourceType(TRANSFER_CHAIN_SOURCE_TYPES.warehouseTransfer)}</SelectItem>
                          <SelectItem value={TRANSFER_CHAIN_SOURCE_TYPES.productionTransfer}>{labelSourceType(TRANSFER_CHAIN_SOURCE_TYPES.productionTransfer)}</SelectItem>
                        </SelectContent>
                      </Select>
                    </OpsField>
                    <OpsField label={t('stepForm.headerId')}><Input type="number" value={stepForm.sourceHeaderId || ''} onChange={(event) => setStepForm((prev) => ({ ...prev, sourceHeaderId: Number(event.target.value) || 0 }))} /></OpsField>
                    <OpsField label={t('stepForm.sequenceNo')}><Input type="number" value={stepForm.sequenceNo} onChange={(event) => setStepForm((prev) => ({ ...prev, sequenceNo: Number(event.target.value) || 1 }))} /></OpsField>
                    <OpsField label={t('stepForm.note')}><Input value={stepForm.note ?? ''} onChange={(event) => setStepForm((prev) => ({ ...prev, note: event.target.value }))} /></OpsField>
                    <div className="flex items-end gap-2">
                      <Button type="button" variant="outline" disabled={readinessLoading || !stepForm.sourceHeaderId} onClick={handleReadinessCheck}>{t('stepForm.check')}</Button>
                      <Button type="button" disabled={addStepMutation.isPending || !stepForm.sourceHeaderId} onClick={handleAddStep}>{t('stepForm.add')}</Button>
                    </div>
                  </div>
                  {readiness ? (
                    <div className="mt-3 rounded-2xl border border-white/70 bg-white/75 p-3 text-sm dark:border-white/10 dark:bg-white/5">
                      {readiness.canStart
                        ? t('stepForm.ready')
                        : t('stepForm.blocked', { reason: readiness.blockedReason ?? t('stepForm.defaultBlockedReason') })}
                      {readiness.transferChainCode ? <span className="ml-2 font-mono text-xs">({readiness.transferChainCode})</span> : null}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={Boolean(deleteItem)}
        title={t('delete.title')}
        description={t('delete.description', { name: deleteItem?.name ?? deleteItem?.code ?? '' })}
        isPending={deleteMutation.isPending}
        onOpenChange={(open) => {
          if (!open) setDeleteItem(null);
        }}
        onConfirm={() => void (async () => {
          if (!deleteItem) return;
          await deleteMutation.mutateAsync(deleteItem.id);
          setDeleteItem(null);
        })()}
      />
    </>
  );
}

function OpsField({ label, children }: { label: string; children: ReactElement }): ReactElement {
  return (
    <div className="space-y-2">
      <Label className="wms-ops-detail-field__label">{label}</Label>
      {children}
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }): ReactElement {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/5">
      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-1 truncate font-black text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}
