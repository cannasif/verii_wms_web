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
import type { CustomerReferenceDto, WarehouseReferenceDto } from '@/features/erp-reference/types/erpReference.types';
import { userApi } from '@/features/user-management/api/user-api';
import type { UserDto } from '@/features/user-management/types/user-types';
import { useColumnPreferences } from '@/hooks/useColumnPreferences';
import { usePagedDataGrid } from '@/hooks/usePagedDataGrid';
import { getPagedRange } from '@/lib/paged';
import { useUIStore } from '@/stores/ui-store';
import { documentSeriesManagementApi } from '../api/document-series-management.api';
import type {
  CreateWmsDocumentSeriesRuleDto,
  WmsDocumentSeriesDefinitionPagedRowDto,
  WmsDocumentSeriesRuleDto,
  WmsDocumentSeriesRulePagedRowDto,
} from '../types/document-series-management.types';
import {
  buildCustomerLabel,
  buildDefinitionLabel,
  buildWarehouseLabel,
  documentSeriesOperationTypes,
} from './document-series/shared';

type ColumnKey = 'definition' | 'operationType' | 'warehouse' | 'customer' | 'user' | 'requiresEDispatch' | 'priority' | 'isActive' | 'actions';

const emptyForm: CreateWmsDocumentSeriesRuleDto = {
  branchCode: '0',
  documentSeriesDefinitionId: 0,
  operationType: 'WO',
  companyCode: '',
  warehouseId: null,
  customerId: null,
  userId: null,
  requiresEDispatch: false,
  priority: 100,
  isActive: true,
  description: '',
};

function mapSortBy(value: ColumnKey): string {
  switch (value) {
    case 'definition': return 'DocumentSeriesDefinitionId';
    case 'operationType': return 'OperationType';
    case 'warehouse': return 'WarehouseId';
    case 'customer': return 'CustomerId';
    case 'user': return 'UserId';
    case 'requiresEDispatch': return 'RequiresEDispatch';
    case 'priority': return 'Priority';
    case 'isActive': return 'IsActive';
    default: return 'Id';
  }
}

export function DocumentSeriesRuleManagementPage(): ReactElement {
  const { t } = useTranslation('common');
  const { setPageTitle } = useUIStore();
  const pageKey = 'document-series-rule-management';
  const [dialogOpen, setDialogOpen] = useState(false);
  const [definitionDialogOpen, setDefinitionDialogOpen] = useState(false);
  const [warehouseDialogOpen, setWarehouseDialogOpen] = useState(false);
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [editing, setEditing] = useState<WmsDocumentSeriesRuleDto | null>(null);
  const [formState, setFormState] = useState<CreateWmsDocumentSeriesRuleDto>(emptyForm);
  const [definitionLabel, setDefinitionLabel] = useState('');
  const [warehouseLabel, setWarehouseLabel] = useState('');
  const [customerLabel, setCustomerLabel] = useState('');
  const [userLabel, setUserLabel] = useState('');

  const pagedGrid = usePagedDataGrid<ColumnKey>({
    pageKey,
    defaultSortBy: 'priority',
    defaultSortDirection: 'asc',
    defaultPageNumber: 1,
    defaultPageSize: 20,
    pageNumberBase: 1,
    mapSortBy,
  });

  useEffect(() => {
    setPageTitle(t('documentSeries.rules.pageTitle'));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

  const columns = useMemo<PagedDataGridColumn<ColumnKey>[]>(() => [
    { key: 'definition', label: t('documentSeries.columns.definition') },
    { key: 'operationType', label: t('documentSeries.columns.operationType') },
    { key: 'warehouse', label: t('documentSeries.columns.warehouse') },
    { key: 'customer', label: t('documentSeries.columns.customer') },
    { key: 'user', label: t('documentSeries.columns.user') },
    { key: 'requiresEDispatch', label: t('documentSeries.columns.eDispatch') },
    { key: 'priority', label: t('documentSeries.columns.priority') },
    { key: 'isActive', label: t('documentSeries.columns.isActive') },
    { key: 'actions', label: t('common.actions'), sortable: false },
  ], [t]);

  const { userId, columnOrder, visibleColumns, orderedVisibleColumns, setColumnOrder, setVisibleColumns } = useColumnPreferences({
    pageKey,
    columns: columns.map(({ key, label }) => ({ key, label })),
    idColumnKey: 'definition',
  });

  const query = useQuery({
    queryKey: ['document-series', 'rules', pagedGrid.queryParams],
    queryFn: () => documentSeriesManagementApi.getRulesPaged(pagedGrid.queryParams),
  });

  const saveMutation = useMutation({
    mutationFn: async (dto: CreateWmsDocumentSeriesRuleDto) => (
      editing?.id
        ? documentSeriesManagementApi.updateRule(editing.id, dto)
        : documentSeriesManagementApi.createRule(dto)
    ),
    onSuccess: async () => {
      toast.success(t(editing ? 'documentSeries.messages.ruleUpdated' : 'documentSeries.messages.ruleCreated'));
      setDialogOpen(false);
      resetForm();
      await query.refetch();
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('common.generalError')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => documentSeriesManagementApi.deleteRule(id),
    onSuccess: async () => {
      toast.success(t('documentSeries.messages.ruleDeleted'));
      await query.refetch();
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('common.generalError')),
  });

  function resetForm(): void {
    setEditing(null);
    setFormState(emptyForm);
    setDefinitionLabel('');
    setWarehouseLabel('');
    setCustomerLabel('');
    setUserLabel('');
  }

  function startCreate(): void {
    resetForm();
    setDialogOpen(true);
  }

  function startEdit(row: WmsDocumentSeriesRuleDto): void {
    setEditing(row);
    setFormState({
      branchCode: row.branchCode || '0',
      documentSeriesDefinitionId: row.documentSeriesDefinitionId,
      operationType: row.operationType,
      companyCode: row.companyCode || '',
      warehouseId: row.warehouseId ?? null,
      customerId: row.customerId ?? null,
      userId: row.userId ?? null,
      requiresEDispatch: row.requiresEDispatch,
      priority: row.priority,
      isActive: row.isActive,
      description: row.description || '',
    });
    setDefinitionLabel(buildDefinitionLabel(row.documentSeriesDefinitionCode, row.documentSeriesDefinitionName));
    setWarehouseLabel(buildWarehouseLabel(row.warehouseCode, row.warehouseName));
    setCustomerLabel(buildCustomerLabel(row.customerCode, row.customerName));
    setUserLabel(row.userFullName || '');
    setDialogOpen(true);
  }

  function handleSave(): void {
    if (!formState.documentSeriesDefinitionId) {
      toast.error(t('documentSeries.messages.definitionRequired'));
      return;
    }
    saveMutation.mutate({
      ...formState,
      companyCode: formState.companyCode?.trim() || null,
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
      definition: buildDefinitionLabel(row.documentSeriesDefinitionCode, row.documentSeriesDefinitionName),
      operationType: row.operationType,
      warehouse: buildWarehouseLabel(row.warehouseCode, row.warehouseName) || '-',
      customer: buildCustomerLabel(row.customerCode, row.customerName) || '-',
      user: row.userFullName || '-',
      requiresEDispatch: row.requiresEDispatch ? t('common.yes') : t('common.no'),
      priority: row.priority,
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

      <PagedDataGrid<WmsDocumentSeriesRulePagedRowDto, ColumnKey>
        pageKey={pageKey}
        columns={columns}
        visibleColumnKeys={visibleColumnKeys}
        rows={query.data?.data ?? []}
        rowKey={(row) => row.id}
        renderCell={(row, columnKey) => {
          switch (columnKey) {
            case 'definition': return buildDefinitionLabel(row.documentSeriesDefinitionCode, row.documentSeriesDefinitionName);
            case 'operationType':
              return row.operationType;
            case 'warehouse': return buildWarehouseLabel(row.warehouseCode, row.warehouseName) || '-';
            case 'customer': return buildCustomerLabel(row.customerCode, row.customerName) || '-';
            case 'user': return row.userFullName || '-';
            case 'requiresEDispatch':
            case 'isActive':
              return row[columnKey] ? t('common.yes') : t('common.no');
            case 'priority':
              return row.priority;
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
        emptyText={t('documentSeries.rules.empty')}
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
          exportFileName: 'document-series-rules',
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
          <DialogHeader><DialogTitle>{editing ? t('documentSeries.rules.editTitle') : t('documentSeries.rules.createTitle')}</DialogTitle></DialogHeader>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>{t('documentSeries.columns.definition')}</Label>
              <PagedLookupDialog<WmsDocumentSeriesDefinitionPagedRowDto>
                open={definitionDialogOpen}
                onOpenChange={setDefinitionDialogOpen}
                title={t('documentSeries.columns.definition')}
                placeholder={t('documentSeries.placeholders.definition')}
                value={definitionLabel}
                queryKey={['document-series', 'rules', 'definition']}
                fetchPage={({ pageNumber, pageSize, search }: { pageNumber: number; pageSize: number; search: string; signal?: AbortSignal }) =>
                  documentSeriesManagementApi.getDefinitionsPaged({ pageNumber, pageSize, search })}
                getKey={(item: WmsDocumentSeriesDefinitionPagedRowDto) => String(item.id)}
                getLabel={(item: WmsDocumentSeriesDefinitionPagedRowDto) => `${item.code} - ${item.name}`}
                onSelect={(item: WmsDocumentSeriesDefinitionPagedRowDto) => {
                  setFormState((prev) => ({ ...prev, documentSeriesDefinitionId: item.id }));
                  setDefinitionLabel(`${item.code} - ${item.name}`);
                }}
              />
            </div>
            <div className="space-y-2"><Label>{t('documentSeries.columns.operationType')}</Label><select className="w-full rounded-xl border px-3 py-2 bg-background" value={formState.operationType} onChange={(event) => setFormState((prev) => ({ ...prev, operationType: event.target.value }))}>{documentSeriesOperationTypes.map((item) => <option key={item} value={item}>{item}</option>)}</select></div>
            <div className="space-y-2"><Label>{t('documentSeries.columns.companyCode')}</Label><Input value={formState.companyCode ?? ''} onChange={(event) => setFormState((prev) => ({ ...prev, companyCode: event.target.value }))} /></div>
            <div className="space-y-2">
              <Label>{t('documentSeries.columns.warehouse')}</Label>
              <PagedLookupDialog<WarehouseReferenceDto>
                open={warehouseDialogOpen}
                onOpenChange={setWarehouseDialogOpen}
                title={t('documentSeries.columns.warehouse')}
                placeholder={t('documentSeries.placeholders.warehouse')}
                value={warehouseLabel}
                queryKey={['document-series', 'rules', 'warehouse']}
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
            <div className="space-y-2">
              <Label>{t('documentSeries.columns.customer')}</Label>
              <PagedLookupDialog<CustomerReferenceDto>
                open={customerDialogOpen}
                onOpenChange={setCustomerDialogOpen}
                title={t('documentSeries.columns.customer')}
                placeholder={t('documentSeries.placeholders.customer')}
                value={customerLabel}
                queryKey={['document-series', 'rules', 'customer']}
                fetchPage={({ pageNumber, pageSize, search }: { pageNumber: number; pageSize: number; search: string; signal?: AbortSignal }) =>
                  erpReferenceApi.getCustomers({ pageNumber, pageSize, search })}
                getKey={(item: CustomerReferenceDto) => String(item.id)}
                getLabel={(item: CustomerReferenceDto) => `${item.customerCode} - ${item.customerName}`}
                onSelect={(item: CustomerReferenceDto) => {
                  setFormState((prev) => ({ ...prev, customerId: item.id }));
                  setCustomerLabel(`${item.customerCode} - ${item.customerName}`);
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('documentSeries.columns.user')}</Label>
              <PagedLookupDialog<UserDto>
                open={userDialogOpen}
                onOpenChange={setUserDialogOpen}
                title={t('documentSeries.columns.user')}
                placeholder={t('documentSeries.placeholders.user')}
                value={userLabel}
                queryKey={['document-series', 'rules', 'user']}
                fetchPage={({ pageNumber, pageSize, search }: { pageNumber: number; pageSize: number; search: string; signal?: AbortSignal }) =>
                  userApi.getList({ pageNumber: pageNumber - 1, pageSize, search })}
                getKey={(item: UserDto) => String(item.id)}
                getLabel={(item: UserDto) => item.fullName || item.username}
                onSelect={(item: UserDto) => {
                  setFormState((prev) => ({ ...prev, userId: item.id }));
                  setUserLabel(item.fullName || item.username);
                }}
              />
            </div>
            <div className="space-y-2"><Label>{t('documentSeries.columns.priority')}</Label><Input type="number" value={formState.priority} onChange={(event) => setFormState((prev) => ({ ...prev, priority: Number(event.target.value) || 0 }))} /></div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 mt-4">
            <div className="flex items-center justify-between rounded-xl border p-3"><Label>{t('documentSeries.columns.eDispatch')}</Label><Switch checked={formState.requiresEDispatch} onCheckedChange={(checked) => setFormState((prev) => ({ ...prev, requiresEDispatch: checked }))} /></div>
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
