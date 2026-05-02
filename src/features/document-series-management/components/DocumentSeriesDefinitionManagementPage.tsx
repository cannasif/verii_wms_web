import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { PagedDataGrid, PagedLookupDialog, type PagedDataGridColumn } from '@/components/shared';
import { erpReferenceApi } from '@/features/erp-reference/api/erpReference.api';
import type { WarehouseReferenceDto } from '@/features/erp-reference/types/erpReference.types';
import { useColumnPreferences } from '@/hooks/useColumnPreferences';
import { usePagedDataGrid } from '@/hooks/usePagedDataGrid';
import { getPagedRange } from '@/lib/paged';
import { useUIStore } from '@/stores/ui-store';
import { documentSeriesManagementApi } from '../api/document-series-management.api';
import type {
  CreateWmsDocumentSeriesDefinitionDto,
  WmsDocumentSeriesDefinitionDto,
  WmsDocumentSeriesDefinitionPagedRowDto,
} from '../types/document-series-management.types';
import {
  buildWarehouseLabel,
  documentSeriesDocumentFlows,
  documentSeriesOperationTypes,
  documentSeriesYearModes,
} from './document-series/shared';

type ColumnKey = 'code' | 'name' | 'operationType' | 'documentFlow' | 'warehouse' | 'seriesPrefix' | 'currentNumber' | 'isEDispatchSeries' | 'isDefault' | 'isActive' | 'actions';

const emptyForm: CreateWmsDocumentSeriesDefinitionDto = {
  branchCode: '0',
  code: '',
  name: '',
  operationType: 'WO',
  documentFlow: 'NETSIS_OUTBOUND',
  companyCode: '',
  warehouseId: null,
  seriesPrefix: '',
  yearMode: 'YEAR4',
  numberLength: 6,
  startNumber: 1,
  currentNumber: 1,
  incrementBy: 1,
  isEDispatchSeries: false,
  isDefault: false,
  isActive: true,
  description: '',
};

function mapSortBy(value: ColumnKey): string {
  switch (value) {
    case 'code': return 'Code';
    case 'name': return 'Name';
    case 'operationType': return 'OperationType';
    case 'documentFlow': return 'DocumentFlow';
    case 'warehouse': return 'WarehouseId';
    case 'seriesPrefix': return 'SeriesPrefix';
    case 'currentNumber': return 'CurrentNumber';
    case 'isEDispatchSeries': return 'IsEDispatchSeries';
    case 'isDefault': return 'IsDefault';
    case 'isActive': return 'IsActive';
    default: return 'Id';
  }
}

export function DocumentSeriesDefinitionManagementPage(): ReactElement {
  const { t } = useTranslation('common');
  const { setPageTitle } = useUIStore();
  const pageKey = 'document-series-definition-management';
  const [dialogOpen, setDialogOpen] = useState(false);
  const [warehouseDialogOpen, setWarehouseDialogOpen] = useState(false);
  const [editing, setEditing] = useState<WmsDocumentSeriesDefinitionDto | null>(null);
  const [formState, setFormState] = useState<CreateWmsDocumentSeriesDefinitionDto>(emptyForm);
  const [warehouseLabel, setWarehouseLabel] = useState('');

  const pagedGrid = usePagedDataGrid<ColumnKey>({
    pageKey,
    defaultSortBy: 'code',
    defaultSortDirection: 'asc',
    defaultPageNumber: 1,
    defaultPageSize: 20,
    pageNumberBase: 1,
    mapSortBy,
  });

  useEffect(() => {
    setPageTitle(t('documentSeries.definitions.pageTitle'));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

  const columns = useMemo<PagedDataGridColumn<ColumnKey>[]>(() => [
    { key: 'code', label: t('documentSeries.columns.code') },
    { key: 'name', label: t('documentSeries.columns.name') },
    { key: 'operationType', label: t('documentSeries.columns.operationType') },
    { key: 'documentFlow', label: t('documentSeries.columns.documentFlow') },
    { key: 'warehouse', label: t('documentSeries.columns.warehouse') },
    { key: 'seriesPrefix', label: t('documentSeries.columns.seriesPrefix') },
    { key: 'currentNumber', label: t('documentSeries.columns.currentNumber') },
    { key: 'isEDispatchSeries', label: t('documentSeries.columns.eDispatch') },
    { key: 'isDefault', label: t('documentSeries.columns.isDefault') },
    { key: 'isActive', label: t('documentSeries.columns.isActive') },
    { key: 'actions', label: t('common.actions'), sortable: false },
  ], [t]);

  const { userId, columnOrder, visibleColumns, orderedVisibleColumns, setColumnOrder, setVisibleColumns } = useColumnPreferences({
    pageKey,
    columns: columns.map(({ key, label }) => ({ key, label })),
    idColumnKey: 'code',
  });

  const query = useQuery({
    queryKey: ['document-series', 'definitions', pagedGrid.queryParams],
    queryFn: () => documentSeriesManagementApi.getDefinitionsPaged(pagedGrid.queryParams),
  });

  const saveMutation = useMutation({
    mutationFn: async (dto: CreateWmsDocumentSeriesDefinitionDto) => (
      editing?.id
        ? documentSeriesManagementApi.updateDefinition(editing.id, dto)
        : documentSeriesManagementApi.createDefinition(dto)
    ),
    onSuccess: async () => {
      toast.success(t(editing ? 'documentSeries.messages.definitionUpdated' : 'documentSeries.messages.definitionCreated'));
      setDialogOpen(false);
      resetForm();
      await query.refetch();
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('common.generalError')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => documentSeriesManagementApi.deleteDefinition(id),
    onSuccess: async () => {
      toast.success(t('documentSeries.messages.definitionDeleted'));
      await query.refetch();
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('common.generalError')),
  });

  function resetForm(): void {
    setEditing(null);
    setFormState(emptyForm);
    setWarehouseLabel('');
  }

  function startCreate(): void {
    resetForm();
    setDialogOpen(true);
  }

  function startEdit(row: WmsDocumentSeriesDefinitionDto): void {
    setEditing(row);
    setFormState({
      branchCode: row.branchCode || '0',
      code: row.code,
      name: row.name,
      operationType: row.operationType,
      documentFlow: row.documentFlow,
      companyCode: row.companyCode || '',
      warehouseId: row.warehouseId ?? null,
      seriesPrefix: row.seriesPrefix,
      yearMode: row.yearMode,
      numberLength: row.numberLength,
      startNumber: row.startNumber,
      currentNumber: row.currentNumber,
      incrementBy: row.incrementBy,
      isEDispatchSeries: row.isEDispatchSeries,
      isDefault: row.isDefault,
      isActive: row.isActive,
      description: row.description || '',
    });
    setWarehouseLabel(buildWarehouseLabel(row.warehouseCode, row.warehouseName));
    setDialogOpen(true);
  }

  function handleSave(): void {
    if (!formState.code.trim() || !formState.name.trim() || !formState.seriesPrefix.trim()) {
      toast.error(t('documentSeries.messages.definitionRequiredFields'));
      return;
    }
    saveMutation.mutate({
      ...formState,
      code: formState.code.trim(),
      name: formState.name.trim(),
      companyCode: formState.companyCode?.trim() || null,
      seriesPrefix: formState.seriesPrefix.trim(),
      description: formState.description?.trim() || null,
    });
  }

  const visibleColumnKeys = useMemo(() => orderedVisibleColumns.filter((key) => key !== 'actions') as ColumnKey[], [orderedVisibleColumns]);
  const exportColumns = useMemo(() => orderedVisibleColumns.filter((key) => key !== 'actions').map((key) => ({
    key,
    label: columns.find((column) => column.key === key)?.label ?? key,
  })), [columns, orderedVisibleColumns]);
  const exportRows = useMemo<Record<string, unknown>[]>(() => (
    (query.data?.data ?? []).map((row) => ({
      code: row.code,
      name: row.name,
      operationType: row.operationType,
      documentFlow: row.documentFlow,
      warehouse: buildWarehouseLabel(row.warehouseCode, row.warehouseName) || '-',
      seriesPrefix: row.seriesPrefix,
      currentNumber: row.currentNumber,
      isEDispatchSeries: row.isEDispatchSeries ? t('common.yes') : t('common.no'),
      isDefault: row.isDefault ? t('common.yes') : t('common.no'),
      isActive: row.isActive ? t('common.yes') : t('common.no'),
    }))
  ), [query.data?.data, t]);
  const range = getPagedRange(query.data, 1);
  const paginationInfoText = t('common.paginationInfo', { current: range.from, total: range.to, totalCount: range.total, defaultValue: `${range.from}-${range.to} / ${range.total}` });

  const renderSortIcon = (columnKey: ColumnKey): ReactElement | null =>
    columnKey === pagedGrid.sortBy
      ? pagedGrid.sortDirection === 'asc'
        ? <ArrowUp className="ml-1 h-3.5 w-3.5" />
        : <ArrowDown className="ml-1 h-3.5 w-3.5" />
      : null;

  return (
    <div className="crm-page space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Badge variant="secondary">{t('documentSeries.badge')}</Badge>
        <Button type="button" onClick={startCreate}>{t('common.add')}</Button>
      </div>

      <PagedDataGrid<WmsDocumentSeriesDefinitionPagedRowDto, ColumnKey>
        pageKey={pageKey}
        columns={columns}
        visibleColumnKeys={visibleColumnKeys}
        rows={query.data?.data ?? []}
        rowKey={(row) => row.id}
        renderCell={(row, columnKey) => {
          switch (columnKey) {
            case 'code':
              return row.code;
            case 'name':
              return row.name;
            case 'operationType':
              return row.operationType;
            case 'documentFlow':
              return row.documentFlow;
            case 'warehouse': return buildWarehouseLabel(row.warehouseCode, row.warehouseName) || '-';
            case 'seriesPrefix':
              return row.seriesPrefix;
            case 'currentNumber':
              return row.currentNumber;
            case 'isEDispatchSeries':
            case 'isDefault':
            case 'isActive':
              return row[columnKey] ? t('common.yes') : t('common.no');
            default:
              return null;
          }
        }}
        sortBy={pagedGrid.sortBy}
        sortDirection={pagedGrid.sortDirection}
        onSort={(columnKey) => { if (columnKey !== 'actions') pagedGrid.handleSort(columnKey); }}
        renderSortIcon={renderSortIcon}
        isLoading={query.isLoading}
        isError={Boolean(query.error)}
        errorText={query.error instanceof Error ? query.error.message : t('common.generalError')}
        emptyText={t('documentSeries.definitions.empty')}
        showActionsColumn={orderedVisibleColumns.includes('actions')}
        actionsHeaderLabel={t('common.actions')}
        renderActionsCell={(row) => (
          <div className="flex gap-2 justify-end">
            <Button type="button" size="sm" variant="outline" onClick={() => startEdit(row)}>{t('common.update')}</Button>
            <Button type="button" size="sm" variant="outline" onClick={() => deleteMutation.mutate(row.id)}>{t('common.delete')}</Button>
          </div>
        )}
        pageSize={query.data?.pageSize ?? pagedGrid.pageSize}
        pageSizeOptions={pagedGrid.pageSizeOptions}
        onPageSizeChange={pagedGrid.handlePageSizeChange}
        pageNumber={pagedGrid.getDisplayPageNumber(query.data)}
        totalPages={Math.max(query.data?.totalPages ?? 1, 1)}
        hasPreviousPage={Boolean(query.data?.hasPreviousPage)}
        hasNextPage={Boolean(query.data?.hasNextPage)}
        onPreviousPage={pagedGrid.goToPreviousPage}
        onNextPage={pagedGrid.goToNextPage}
        previousLabel={t('common.previous')}
        nextLabel={t('common.next')}
        paginationInfoText={paginationInfoText}
        actionBar={{
          pageKey,
          userId,
          columns: columns.map(({ key, label }) => ({ key, label })),
          visibleColumns,
          columnOrder,
          onVisibleColumnsChange: setVisibleColumns,
          onColumnOrderChange: setColumnOrder,
          exportFileName: 'document-series-definitions',
          exportColumns,
          exportRows,
          filterColumns: [],
          defaultFilterColumn: '',
          draftFilterRows: [],
          onDraftFilterRowsChange: () => undefined,
          filterLogic: 'and',
          onFilterLogicChange: () => undefined,
          onApplyFilters: () => undefined,
          onClearFilters: () => undefined,
          appliedFilterCount: 0,
          search: {
            value: pagedGrid.searchInput,
            onValueChange: pagedGrid.searchConfig.onValueChange,
            onSearchChange: pagedGrid.searchConfig.onSearchChange,
            placeholder: t('documentSeries.searchPlaceholder'),
          },
          refresh: { onRefresh: () => { void query.refetch(); }, isLoading: query.isLoading, label: t('common.refresh') },
        }}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editing ? t('documentSeries.definitions.editTitle') : t('documentSeries.definitions.createTitle')}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2"><Label>{t('documentSeries.columns.code')}</Label><Input value={formState.code} onChange={(event) => setFormState((prev) => ({ ...prev, code: event.target.value }))} /></div>
            <div className="space-y-2"><Label>{t('documentSeries.columns.name')}</Label><Input value={formState.name} onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))} /></div>
            <div className="space-y-2"><Label>{t('documentSeries.columns.operationType')}</Label><select className="w-full rounded-xl border px-3 py-2 bg-background" value={formState.operationType} onChange={(event) => setFormState((prev) => ({ ...prev, operationType: event.target.value }))}>{documentSeriesOperationTypes.map((item) => <option key={item} value={item}>{item}</option>)}</select></div>
            <div className="space-y-2"><Label>{t('documentSeries.columns.documentFlow')}</Label><select className="w-full rounded-xl border px-3 py-2 bg-background" value={formState.documentFlow} onChange={(event) => setFormState((prev) => ({ ...prev, documentFlow: event.target.value }))}>{documentSeriesDocumentFlows.map((item) => <option key={item} value={item}>{item}</option>)}</select></div>
            <div className="space-y-2"><Label>{t('documentSeries.columns.companyCode')}</Label><Input value={formState.companyCode ?? ''} onChange={(event) => setFormState((prev) => ({ ...prev, companyCode: event.target.value }))} /></div>
            <div className="space-y-2">
              <Label>{t('documentSeries.columns.warehouse')}</Label>
              <PagedLookupDialog<WarehouseReferenceDto>
                open={warehouseDialogOpen}
                onOpenChange={setWarehouseDialogOpen}
                title={t('documentSeries.columns.warehouse')}
                placeholder={t('documentSeries.placeholders.warehouse')}
                value={warehouseLabel}
                queryKey={['document-series', 'definitions', 'warehouse']}
                fetchPage={({ pageNumber, pageSize, search }: { pageNumber: number; pageSize: number; search: string; signal?: AbortSignal }) =>
                  erpReferenceApi.getWarehouses({ pageNumber, pageSize, search })}
                getKey={(item: WarehouseReferenceDto) => String(item.id)}
                getLabel={(item: WarehouseReferenceDto) => `${item.warehouseCode} - ${item.warehouseName}`}
                onSelect={(item: WarehouseReferenceDto) => {
                  setFormState((prev) => ({ ...prev, warehouseId: item.id }));
                  setWarehouseLabel(`${item.warehouseCode} - ${item.warehouseName}`);
                }}
              />
            </div>
            <div className="space-y-2"><Label>{t('documentSeries.columns.seriesPrefix')}</Label><Input value={formState.seriesPrefix} onChange={(event) => setFormState((prev) => ({ ...prev, seriesPrefix: event.target.value }))} /></div>
            <div className="space-y-2"><Label>{t('documentSeries.columns.yearMode')}</Label><select className="w-full rounded-xl border px-3 py-2 bg-background" value={formState.yearMode} onChange={(event) => setFormState((prev) => ({ ...prev, yearMode: event.target.value }))}>{documentSeriesYearModes.map((item) => <option key={item} value={item}>{item}</option>)}</select></div>
            <div className="space-y-2"><Label>{t('documentSeries.columns.numberLength')}</Label><Input type="number" value={formState.numberLength} onChange={(event) => setFormState((prev) => ({ ...prev, numberLength: Number(event.target.value) || 0 }))} /></div>
            <div className="space-y-2"><Label>{t('documentSeries.columns.startNumber')}</Label><Input type="number" value={formState.startNumber} onChange={(event) => setFormState((prev) => ({ ...prev, startNumber: Number(event.target.value) || 0 }))} /></div>
            <div className="space-y-2"><Label>{t('documentSeries.columns.currentNumber')}</Label><Input type="number" value={formState.currentNumber} onChange={(event) => setFormState((prev) => ({ ...prev, currentNumber: Number(event.target.value) || 0 }))} /></div>
            <div className="space-y-2"><Label>{t('documentSeries.columns.incrementBy')}</Label><Input type="number" value={formState.incrementBy} onChange={(event) => setFormState((prev) => ({ ...prev, incrementBy: Number(event.target.value) || 1 }))} /></div>
          </div>

          <div className="grid gap-4 md:grid-cols-3 mt-4">
            <div className="flex items-center justify-between rounded-xl border p-3"><Label>{t('documentSeries.columns.eDispatch')}</Label><Switch checked={formState.isEDispatchSeries} onCheckedChange={(checked) => setFormState((prev) => ({ ...prev, isEDispatchSeries: checked }))} /></div>
            <div className="flex items-center justify-between rounded-xl border p-3"><Label>{t('documentSeries.columns.isDefault')}</Label><Switch checked={formState.isDefault} onCheckedChange={(checked) => setFormState((prev) => ({ ...prev, isDefault: checked }))} /></div>
            <div className="flex items-center justify-between rounded-xl border p-3"><Label>{t('documentSeries.columns.isActive')}</Label><Switch checked={formState.isActive} onCheckedChange={(checked) => setFormState((prev) => ({ ...prev, isActive: checked }))} /></div>
          </div>

          <div className="space-y-2 mt-4"><Label>{t('common.description')}</Label><Textarea rows={3} value={formState.description ?? ''} onChange={(event) => setFormState((prev) => ({ ...prev, description: event.target.value }))} /></div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>{t('common.close')}</Button>
            <Button type="button" onClick={handleSave} disabled={saveMutation.isPending}>{t('common.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
