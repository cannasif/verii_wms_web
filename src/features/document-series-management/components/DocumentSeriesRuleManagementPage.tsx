import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ArrowDown, ArrowUp, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  OpsActionButton,
  OpsCircuitToggleField,
  OpsInput,
  OpsListPageShell,
  OpsTextarea,
  PagedDataGrid,
  PagedLookupDialog,
  type PagedDataGridColumn,
} from '@/components/shared';
import {
  MasterDataOpsDialogContent,
  MasterDataOpsErpEyebrow,
  MasterDataOpsFormField,
  masterDataOpsGridColumn,
} from '@/features/shared';
import { erpReferenceApi } from '@/features/erp-reference/api/erpReference.api';
import type { CustomerReferenceDto, WarehouseReferenceDto } from '@/features/erp-reference/types/erpReference.types';
import { userApi } from '@/features/user-management/api/user-api';
import type { UserDto } from '@/features/user-management/types/user-types';
import { useColumnPreferences } from '@/hooks/useColumnPreferences';
import { usePagedDataGrid } from '@/hooks/usePagedDataGrid';
import { getPagedRange } from '@/lib/paged';
import type { FilterColumnConfig } from '@/lib/advanced-filter-types';
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
  getDocumentSeriesOperationTypeLabel,
} from './document-series/shared';

type ColumnKey = 'definition' | 'operationType' | 'warehouse' | 'customer' | 'user' | 'requiresEDispatch' | 'priority' | 'isActive' | 'actions';

const filterColumns: readonly FilterColumnConfig[] = [
  { value: 'operationType', type: 'string', labelKey: 'documentSeries.columns.operationType' },
  { value: 'companyCode', type: 'string', labelKey: 'documentSeries.columns.companyCode' },
  { value: 'warehouseId', type: 'number', labelKey: 'documentSeries.columns.warehouse' },
  { value: 'customerId', type: 'number', labelKey: 'documentSeries.columns.customer' },
  { value: 'userId', type: 'number', labelKey: 'documentSeries.columns.user' },
  { value: 'requiresEDispatch', type: 'boolean', labelKey: 'documentSeries.columns.eDispatch' },
  { value: 'priority', type: 'number', labelKey: 'documentSeries.columns.priority' },
  { value: 'isActive', type: 'boolean', labelKey: 'documentSeries.columns.isActive' },
];

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
    masterDataOpsGridColumn('definition', t('documentSeries.columns.definition')),
    masterDataOpsGridColumn('operationType', t('documentSeries.columns.operationType')),
    masterDataOpsGridColumn('warehouse', t('documentSeries.columns.warehouse')),
    masterDataOpsGridColumn('customer', t('documentSeries.columns.customer')),
    masterDataOpsGridColumn('user', t('documentSeries.columns.user')),
    masterDataOpsGridColumn('requiresEDispatch', t('documentSeries.columns.eDispatch')),
    masterDataOpsGridColumn('priority', t('documentSeries.columns.priority')),
    masterDataOpsGridColumn('isActive', t('documentSeries.columns.isActive')),
    masterDataOpsGridColumn('actions', t('common.actions'), false),
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

  function handleDialogOpenChange(nextOpen: boolean): void {
    setDialogOpen(nextOpen);
    if (!nextOpen) {
      resetForm();
    }
  }

  return (
    <OpsListPageShell
      eyebrow={<MasterDataOpsErpEyebrow page={t('sidebar.erpDocumentSeriesRules')} />}
      title={t('documentSeries.rules.pageTitle')}
      description={t('documentSeries.rules.pageDescription', { defaultValue: t('documentSeries.badge') })}
      actions={
        <OpsActionButton type="button" variant="primary" onClick={startCreate}>
          {t('common.add')}
        </OpsActionButton>
      }
    >
      <PagedDataGrid<WmsDocumentSeriesRulePagedRowDto, ColumnKey>
        variant="ops"
        pageKey={pageKey}
        columns={columns}
        visibleColumnKeys={visibleColumnKeys}
        rows={query.data?.data ?? []}
        rowKey={(row) => row.id}
        renderCell={(row, columnKey) => {
          switch (columnKey) {
            case 'definition': return buildDefinitionLabel(row.documentSeriesDefinitionCode, row.documentSeriesDefinitionName);
            case 'operationType':
              return getDocumentSeriesOperationTypeLabel(t, row.operationType);
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
            <Button type="button" size="sm" variant="outline" onClick={() => startEdit(row)}><Pencil className="size-4" /><span className="ml-2">{t('common.update')}</span></Button>
            <Button type="button" size="sm" variant="outline" onClick={() => deleteMutation.mutate(row.id)}><Trash2 className="size-4" /><span className="ml-2">{t('common.delete')}</span></Button>
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
          filterColumns,
          defaultFilterColumn: 'operationType',
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
            placeholder: t('documentSeries.searchPlaceholder'),
          },
          refresh: { onRefresh: () => { void query.refetch(); }, isLoading: query.isLoading, label: t('common.refresh') },
          variant: 'ops',
        }}
      />

      <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
        <MasterDataOpsDialogContent size="xl">
          <DialogHeader className="wms-ops-detail-dialog__header border-b px-5 py-4">
            <DialogTitle className="wms-ops-pt-terminal__title">
              {editing ? t('documentSeries.rules.editTitle') : t('documentSeries.rules.createTitle')}
            </DialogTitle>
          </DialogHeader>

          <div className="wms-ops-form max-h-[min(68dvh,720px)] overflow-y-auto px-5 py-4">
            <div className="grid gap-4 md:grid-cols-2">
              <MasterDataOpsFormField label={t('documentSeries.columns.definition')}>
                <PagedLookupDialog<WmsDocumentSeriesDefinitionPagedRowDto>
                  variant="ops"
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
              </MasterDataOpsFormField>
              <MasterDataOpsFormField label={t('documentSeries.columns.operationType')}>
                <select className="wms-ops-field w-full rounded-none border bg-transparent px-3 py-2" value={formState.operationType} onChange={(event) => setFormState((prev) => ({ ...prev, operationType: event.target.value }))}>{documentSeriesOperationTypes.map((item) => <option key={item} value={item}>{getDocumentSeriesOperationTypeLabel(t, item)}</option>)}</select>
              </MasterDataOpsFormField>
              <MasterDataOpsFormField label={t('documentSeries.columns.companyCode')}>
                <OpsInput value={formState.companyCode ?? ''} onChange={(event) => setFormState((prev) => ({ ...prev, companyCode: event.target.value }))} />
              </MasterDataOpsFormField>
              <MasterDataOpsFormField label={t('documentSeries.columns.warehouse')}>
                <PagedLookupDialog<WarehouseReferenceDto>
                  variant="ops"
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
              </MasterDataOpsFormField>
              <MasterDataOpsFormField label={t('documentSeries.columns.customer')}>
                <PagedLookupDialog<CustomerReferenceDto>
                  variant="ops"
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
              </MasterDataOpsFormField>
              <MasterDataOpsFormField label={t('documentSeries.columns.user')}>
                <PagedLookupDialog<UserDto>
                  variant="ops"
                  open={userDialogOpen}
                  onOpenChange={setUserDialogOpen}
                  title={t('documentSeries.columns.user')}
                  placeholder={t('documentSeries.placeholders.user')}
                  value={userLabel}
                  queryKey={['document-series', 'rules', 'user']}
                  fetchPage={({ pageNumber, pageSize, search }: { pageNumber: number; pageSize: number; search: string; signal?: AbortSignal }) =>
                    userApi.getList({ pageNumber, pageSize, search })}
                  getKey={(item: UserDto) => String(item.id)}
                  getLabel={(item: UserDto) => item.fullName || item.username}
                  onSelect={(item: UserDto) => {
                    setFormState((prev) => ({ ...prev, userId: item.id }));
                    setUserLabel(item.fullName || item.username);
                  }}
                />
              </MasterDataOpsFormField>
              <MasterDataOpsFormField label={t('documentSeries.columns.priority')}>
                <OpsInput type="number" value={formState.priority} onChange={(event) => setFormState((prev) => ({ ...prev, priority: Number(event.target.value) || 0 }))} />
              </MasterDataOpsFormField>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <OpsCircuitToggleField
                checked={formState.requiresEDispatch}
                onCheckedChange={(checked) => setFormState((prev) => ({ ...prev, requiresEDispatch: checked }))}
                title={t('documentSeries.columns.eDispatch')}
              />
              <OpsCircuitToggleField
                checked={formState.isActive}
                onCheckedChange={(checked) => setFormState((prev) => ({ ...prev, isActive: checked }))}
                title={t('documentSeries.columns.isActive')}
              />
            </div>

            <MasterDataOpsFormField label={t('common.description')} className="mt-4">
              <OpsTextarea rows={3} value={formState.description ?? ''} onChange={(event) => setFormState((prev) => ({ ...prev, description: event.target.value }))} />
            </MasterDataOpsFormField>
          </div>

          <DialogFooter className="wms-ops-actions border-t px-5 py-4">
            <OpsActionButton type="button" variant="secondary" onClick={() => handleDialogOpenChange(false)}>
              {t('common.close')}
            </OpsActionButton>
            <OpsActionButton type="button" variant="primary" onClick={handleSave} disabled={saveMutation.isPending}>
              {t('common.save')}
            </OpsActionButton>
          </DialogFooter>
        </MasterDataOpsDialogContent>
      </Dialog>
    </OpsListPageShell>
  );
}
