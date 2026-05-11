import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, GitBranch, Link2, Plus, RefreshCw, ShieldCheck, Trash2, Workflow } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { PagedDataGrid, type PagedDataGridColumn } from '@/components/shared';
import { VoiceSearchButton } from '@/components/ui/voice-search-button';
import { useColumnPreferences } from '@/hooks/useColumnPreferences';
import { usePagedDataGrid } from '@/hooks/usePagedDataGrid';
import { getLocaleForFormatting } from '@/lib/i18n';
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
    return <Badge className="rounded-xl border-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">{label}</Badge>;
  }
  if (status === TRANSFER_CHAIN_STATUSES.cancelled) {
    return <Badge className="rounded-xl border-0 bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300">{label}</Badge>;
  }
  if (status === TRANSFER_CHAIN_STATUSES.active) {
    return <Badge className="rounded-xl border-0 bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300">{label}</Badge>;
  }
  return <Badge variant="secondary">{label}</Badge>;
}

function stepStatusBadge(status: string, label: string): ReactElement {
  if (status === TRANSFER_CHAIN_STEP_STATUSES.completed) {
    return <Badge className="rounded-xl border-0 bg-emerald-100 text-emerald-700">{label}</Badge>;
  }
  if (status === TRANSFER_CHAIN_STEP_STATUSES.ready) {
    return <Badge className="rounded-xl border-0 bg-blue-100 text-blue-700">{label}</Badge>;
  }
  if (status === TRANSFER_CHAIN_STEP_STATUSES.blocked) {
    return <Badge className="rounded-xl border-0 bg-amber-100 text-amber-700">{label}</Badge>;
  }
  return <Badge variant="secondary">{label}</Badge>;
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
    { key: 'code', label: t('table.code') },
    { key: 'name', label: t('table.name') },
    { key: 'status', label: t('table.status') },
    { key: 'chainType', label: t('table.type') },
    { key: 'sourceDocument', label: t('table.sourceDocument'), sortable: false },
    { key: 'progress', label: t('table.progress'), sortable: false },
    { key: 'createdDate', label: t('table.createdDate') },
    { key: 'actions', label: t('common:actions'), sortable: false },
  ], [t]);

  const { userId, columnOrder, visibleColumns, orderedVisibleColumns, setColumnOrder, setVisibleColumns } = useColumnPreferences({
    pageKey,
    columns: columns.map(({ key, label }) => ({ key, label })),
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

  const activeCount = useMemo(() => (data?.data ?? []).filter((item) => item.status === TRANSFER_CHAIN_STATUSES.active).length, [data?.data]);
  const completedCount = useMemo(() => (data?.data ?? []).filter((item) => item.status === TRANSFER_CHAIN_STATUSES.completed).length, [data?.data]);
  const totalStepCount = useMemo(() => (data?.data ?? []).reduce((sum, item) => sum + item.stepCount, 0), [data?.data]);

  const range = getPagedRange(data);
  const paginationInfoText = `${range.from}-${range.to} / ${range.total}`;
  const visibleColumnKeys = useMemo(() => orderedVisibleColumns.filter((key) => key !== 'actions') as ChainColumnKey[], [orderedVisibleColumns]);
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
    <div className="w-full space-y-6 crm-page">
      <Breadcrumb items={[{ label: t('breadcrumb.operations') }, { label: t('title'), isActive: true }]} />

      <div className="overflow-hidden rounded-[30px] border border-slate-200 bg-linear-to-br from-slate-950 via-cyan-950 to-emerald-950 p-6 text-white shadow-xl shadow-cyan-950/20">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="space-y-3">
            <div className="inline-flex w-fit items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.22em] text-cyan-100">
              <GitBranch className="size-4" />
              {t('hero.eyebrow')}
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{t('title')}</h1>
              <p className="mt-2 max-w-3xl text-sm font-medium text-cyan-50/80">
                {t('hero.description')}
              </p>
            </div>
          </div>
          {permission.canCreate ? (
            <Button
              onClick={() => { setEditingItem(null); setFormOpen(true); }}
              className="h-11 rounded-2xl border border-white/20 bg-white text-slate-950 shadow-lg hover:bg-cyan-50"
            >
              <Plus className="mr-2 size-4" />
              {t('hero.create')}
            </Button>
          ) : null}
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
            <div className="flex items-center gap-3">
              <Workflow className="size-5 text-cyan-200" />
              <div><p className="text-xs font-black uppercase tracking-widest text-cyan-100/70">{t('stats.active')}</p><p className="text-2xl font-black">{activeCount}</p></div>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
            <div className="flex items-center gap-3">
              <ShieldCheck className="size-5 text-emerald-200" />
              <div><p className="text-xs font-black uppercase tracking-widest text-cyan-100/70">{t('stats.completed')}</p><p className="text-2xl font-black">{completedCount}</p></div>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
            <div className="flex items-center gap-3">
              <Link2 className="size-5 text-amber-200" />
              <div><p className="text-xs font-black uppercase tracking-widest text-cyan-100/70">{t('stats.totalSteps')}</p><p className="text-2xl font-black">{totalStepCount}</p></div>
            </div>
          </div>
        </div>
      </div>

      <PagedDataGrid<TransferChainPagedRowDto, ChainColumnKey>
        columns={columns}
        visibleColumnKeys={visibleColumnKeys}
        rows={data?.data ?? []}
        rowKey={(row) => row.id}
        renderCell={(item, columnKey) => {
          switch (columnKey) {
            case 'code':
              return <span className="font-mono text-xs font-bold text-cyan-700 dark:text-cyan-300">{item.code}</span>;
            case 'name':
              return <button type="button" className="text-left font-semibold text-slate-900 hover:text-cyan-700 dark:text-white" onClick={() => openDetail(item.id)}>{item.name}</button>;
            case 'status':
              return statusBadge(item.status, labelStatus(item.status));
            case 'chainType':
              return <Badge variant="outline">{item.chainType}</Badge>;
            case 'sourceDocument':
              return item.sourceDocumentType ? <span className="text-sm">{item.sourceDocumentType} {item.sourceDocumentId ? `#${item.sourceDocumentId}` : ''}</span> : '-';
            case 'progress':
              return <span className="font-semibold">{item.completedStepCount}/{item.stepCount}</span>;
            case 'createdDate':
              return formatDate(item.createdDate, locale);
            case 'actions':
              return (
                <div className="flex flex-wrap items-center gap-2">
                  <Button size="sm" variant="outline" className="rounded-xl" onClick={() => openDetail(item.id)}>{t('table.detail')}</Button>
                  {permission.canUpdate ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xl"
                      onClick={async () => {
                        const chain = await transferChainApi.getById(item.id);
                        setEditingItem(chain);
                        setFormOpen(true);
                      }}
                    >
                      {t('common:edit')}
                    </Button>
                  ) : null}
                  {permission.canDelete ? (
                    <Button size="sm" variant="outline" className="rounded-xl text-rose-600" onClick={() => setDeleteItem(item)}>{t('common:delete')}</Button>
                  ) : null}
                </div>
              );
            default:
              return null;
          }
        }}
        sortBy={pagedGrid.sortBy}
        sortDirection={pagedGrid.sortDirection}
        onSort={pagedGrid.handleSort}
        renderSortIcon={renderSortIcon}
        isLoading={isLoading}
        isError={!!error}
        errorText={error instanceof Error ? error.message : undefined}
        emptyText={t('common:noData')}
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
          leftSlot: <VoiceSearchButton onResult={pagedGrid.handleVoiceSearch} size="sm" variant="outline" />,
        }}
      />

      <Dialog open={formOpen} onOpenChange={(next) => { setFormOpen(next); if (!next) setEditingItem(null); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingItem ? t('form.editTitle') : t('form.createTitle')}</DialogTitle>
            <DialogDescription>{t('form.description')}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t('form.code')}><Input value={chainForm.code} disabled={!!editingItem} onChange={(event) => setChainForm((prev) => ({ ...prev, code: event.target.value }))} /></Field>
            <Field label={t('form.name')}><Input value={chainForm.name} onChange={(event) => setChainForm((prev) => ({ ...prev, name: event.target.value }))} /></Field>
            <Field label={t('form.status')}>
              <Select value={chainForm.status ?? TRANSFER_CHAIN_STATUSES.active} onValueChange={(value) => setChainForm((prev) => ({ ...prev, status: value }))}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.values(TRANSFER_CHAIN_STATUSES).map((status) => <SelectItem key={status} value={status}>{labelStatus(status)}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label={t('form.chainType')}><Input value={chainForm.chainType ?? ''} onChange={(event) => setChainForm((prev) => ({ ...prev, chainType: event.target.value }))} /></Field>
            <Field label={t('form.sourceDocumentType')}><Input value={chainForm.sourceDocumentType ?? ''} onChange={(event) => setChainForm((prev) => ({ ...prev, sourceDocumentType: event.target.value }))} placeholder={t('form.sourceDocumentTypePlaceholder')} /></Field>
            <Field label={t('form.sourceDocumentId')}><Input type="number" value={chainForm.sourceDocumentId ?? ''} onChange={(event) => setChainForm((prev) => ({ ...prev, sourceDocumentId: Number(event.target.value) || undefined }))} /></Field>
            <div className="sm:col-span-2">
              <Field label={t('form.descriptionLabel')}><Textarea value={chainForm.description ?? ''} onChange={(event) => setChainForm((prev) => ({ ...prev, description: event.target.value }))} /></Field>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>{t('common:cancel')}</Button>
            <Button disabled={!chainForm.code.trim() || !chainForm.name.trim() || createMutation.isPending || updateMutation.isPending} onClick={handleSubmitChain}>
              {createMutation.isPending || updateMutation.isPending ? t('common:processing') : t('common:save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-h-[88vh] max-w-5xl overflow-y-auto">
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
                    <Field label={t('stepForm.source')}>
                      <Select value={stepForm.sourceType} onValueChange={(value) => setStepForm((prev) => ({ ...prev, sourceType: value }))}>
                        <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value={TRANSFER_CHAIN_SOURCE_TYPES.warehouseTransfer}>{labelSourceType(TRANSFER_CHAIN_SOURCE_TYPES.warehouseTransfer)}</SelectItem>
                          <SelectItem value={TRANSFER_CHAIN_SOURCE_TYPES.productionTransfer}>{labelSourceType(TRANSFER_CHAIN_SOURCE_TYPES.productionTransfer)}</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label={t('stepForm.headerId')}><Input type="number" value={stepForm.sourceHeaderId || ''} onChange={(event) => setStepForm((prev) => ({ ...prev, sourceHeaderId: Number(event.target.value) || 0 }))} /></Field>
                    <Field label={t('stepForm.sequenceNo')}><Input type="number" value={stepForm.sequenceNo} onChange={(event) => setStepForm((prev) => ({ ...prev, sequenceNo: Number(event.target.value) || 1 }))} /></Field>
                    <Field label={t('stepForm.note')}><Input value={stepForm.note ?? ''} onChange={(event) => setStepForm((prev) => ({ ...prev, note: event.target.value }))} /></Field>
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

      <Dialog open={!!deleteItem} onOpenChange={(next) => !next && setDeleteItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('delete.title')}</DialogTitle>
            <DialogDescription>{t('delete.description', { name: deleteItem?.name ?? deleteItem?.code ?? '' })}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteItem(null)}>{t('common:cancel')}</Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={async () => {
                if (!deleteItem) return;
                await deleteMutation.mutateAsync(deleteItem.id);
                setDeleteItem(null);
              }}
            >
              {deleteMutation.isPending ? t('common:processing') : t('common:delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactElement }): ReactElement {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-black uppercase tracking-wider text-slate-500">{label}</Label>
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
