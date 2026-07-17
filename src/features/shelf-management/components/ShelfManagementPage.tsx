import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowDown, ArrowUp, Pencil, Plus, RefreshCcw, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { OpsActionButton, OpsCircuitToggleInline, OpsFormPageShell, OpsInput, OpsSelectItem, OpsTextarea, PagedDataGrid, PagedLookupDialog, type PagedDataGridColumn } from '@/components/shared';
import { MasterDataOpsErpEyebrow, MasterDataOpsFormField, MasterDataOpsSelect, masterDataOpsGridColumn } from '@/features/shared';
import { useColumnPreferences } from '@/hooks/useColumnPreferences';
import { usePagedDataGrid } from '@/hooks/usePagedDataGrid';
import { getPagedRange } from '@/lib/paged';
import type { FilterColumnConfig } from '@/lib/advanced-filter-types';
import { useUIStore } from '@/stores/ui-store';
import { lookupApi } from '@/features/shared/api/lookup-api';
import { useCrudPermission } from '@/features/access-control/hooks/useCrudPermission';
import type { ShelfDefinitionDto, ShelfUpsertRequest } from '../types/shelf-management.types';
import { shelfManagementApi } from '../api/shelf-management.api';

type ShelfColumnKey = 'warehouse' | 'code' | 'name' | 'type' | 'barcode' | 'status' | 'actions';

const filterColumns: readonly FilterColumnConfig[] = [
  { value: 'warehouseId', type: 'number', labelKey: 'shelfManagement.colWarehouse' },
  { value: 'code', type: 'string', labelKey: 'shelfManagement.colCode' },
  { value: 'name', type: 'string', labelKey: 'shelfManagement.colName' },
  { value: 'locationType', type: 'string', labelKey: 'shelfManagement.colType' },
  { value: 'barcode', type: 'string', labelKey: 'shelfManagement.colBarcode' },
  { value: 'isActive', type: 'boolean', labelKey: 'shelfManagement.colStatus' },
];

const SHELF_DEFAULT_WIDTHS = {
  warehouse: 18,
  code: 14,
  name: 22,
  type: 10,
  barcode: 16,
  status: 10,
  actions: 12,
} as Record<string, number>;

function mapShelfSortBy(value: ShelfColumnKey): string {
  if (value === 'actions') return 'Code';
  switch (value) {
    case 'warehouse': return 'WarehouseName';
    case 'name': return 'Name';
    case 'type': return 'LocationType';
    case 'barcode': return 'Barcode';
    case 'status': return 'IsActive';
    case 'code':
    default: return 'Code';
  }
}

const EMPTY_FORM: ShelfUpsertRequest = {
  warehouseId: 0,
  parentShelfId: null,
  code: '',
  name: '',
  locationType: 'Cell',
  barcodeEntryMode: 'Auto',
  barcode: '',
  capacity: null,
  levelNo: null,
  isActive: true,
  description: '',
};

function sanitizeBarcodeCandidate(code: string): string {
  const normalizedCode = code.trim().toUpperCase();
  return normalizedCode.replace(/[^A-Z0-9_-]/g, '');
}

function getLocationTypeLabel(
  value: ShelfUpsertRequest['locationType'],
  t: (key: string) => string,
): string {
  switch (value) {
    case 'Zone':
      return t('shelfManagement.locationZone');
    case 'Rack':
      return t('shelfManagement.locationRack');
    case 'Shelf':
      return t('shelfManagement.locationShelf');
    case 'Cell':
      return t('shelfManagement.locationCell');
    default:
      return value;
  }
}

export function ShelfManagementPage(): ReactElement {
  const { t } = useTranslation('common');
  const { setPageTitle } = useUIStore();
  const permission = useCrudPermission('wms.shelf');
  const [form, setForm] = useState<ShelfUpsertRequest>(EMPTY_FORM);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [warehousePickerOpen, setWarehousePickerOpen] = useState(false);
  const pageKey = 'shelf-management-list';
  const showActionsColumn = permission.canUpdate || permission.canDelete;

  const pagedGrid = usePagedDataGrid<ShelfColumnKey>({
    pageKey,
    defaultSortBy: 'code',
    defaultSortDirection: 'asc',
    defaultPageSize: 20,
    mapSortBy: mapShelfSortBy,
  });

  const columns = useMemo<PagedDataGridColumn<ShelfColumnKey>[]>(
    () => [
      masterDataOpsGridColumn('warehouse', t('shelfManagement.colWarehouse')),
      masterDataOpsGridColumn('code', t('shelfManagement.colCode')),
      masterDataOpsGridColumn('name', t('shelfManagement.colName')),
      masterDataOpsGridColumn('type', t('shelfManagement.colType')),
      masterDataOpsGridColumn('barcode', t('shelfManagement.colBarcode')),
      masterDataOpsGridColumn('status', t('shelfManagement.colStatus')),
      masterDataOpsGridColumn('actions', t('shelfManagement.colAction'), false),
    ],
    [t],
  );

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
    defaultWidths: SHELF_DEFAULT_WIDTHS,
    includeActionsColumn: showActionsColumn,
    idColumnKey: 'code',
  });

  useEffect(() => {
    setPageTitle(t('sidebar.erpShelves'));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

  const warehousesQuery = useQuery({
    queryKey: ['shelf-management-warehouses'],
    queryFn: ({ signal }) => lookupApi.getWarehouses(undefined, { signal }),
  });

  const shelvesQuery = useQuery({
    queryKey: ['shelf-management-list', pagedGrid.queryParams],
    queryFn: ({ signal }) => shelfManagementApi.getPaged(pagedGrid.queryParams, { signal }),
  });

  const parentShelvesQuery = useQuery({
    queryKey: ['shelf-management-all'],
    queryFn: ({ signal }) => shelfManagementApi.getAll({ signal }),
  });

  const shelfRows = shelvesQuery.data?.data?.data ?? [];
  const allShelves = parentShelvesQuery.data?.data ?? [];
  const shelfRange = getPagedRange(shelvesQuery.data?.data);
  const filteredParents = useMemo(
    () => allShelves.filter((item) => item.id !== selectedId && item.warehouseId === form.warehouseId),
    [allShelves, form.warehouseId, selectedId],
  );
  const barcodePreview = useMemo(
    () => (form.barcodeEntryMode === 'Auto' ? sanitizeBarcodeCandidate(form.code) : (form.barcode ?? '')),
    [form.barcode, form.barcodeEntryMode, form.code],
  );

  const formReadOnly = selectedId ? !permission.canUpdate : !permission.canCreate;

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (selectedId) {
        return await shelfManagementApi.update(selectedId, form);
      }
      return await shelfManagementApi.create(form);
    },
    onSuccess: (response) => {
      toast.success(
        response.message || (selectedId ? t('shelfManagement.toastUpdated') : t('shelfManagement.toastCreated')),
      );
      void shelvesQuery.refetch();
      setSelectedId(null);
      setForm(EMPTY_FORM);
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : t('shelfManagement.toastSaveFailed'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => await shelfManagementApi.remove(id),
    onSuccess: (response) => {
      toast.success(response.message || t('shelfManagement.toastDeleted'));
      void shelvesQuery.refetch();
      if (selectedId) {
        setSelectedId(null);
        setForm(EMPTY_FORM);
      }
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : t('shelfManagement.toastDeleteFailed'));
    },
  });

  const renderLocationType = (item: ShelfDefinitionDto): string => getLocationTypeLabel(item.locationType, t);

  return (
    <OpsFormPageShell
      eyebrow={<MasterDataOpsErpEyebrow page={t('sidebar.erpShelves')} />}
      title={t('sidebar.erpShelves')}
      description={t('shelfManagement.subtitle')}
      actions={
        <OpsActionButton type="button" variant="secondary" onClick={() => void shelvesQuery.refetch()}>
          <RefreshCcw className="size-3.5" aria-hidden />
          {t('common.refresh')}
        </OpsActionButton>
      }
    >
      <div className="wms-ops-form wms-ops-erp-skin space-y-6">
        <section className="wms-ops-receiving-area wms-ops-pt-terminal-section border">
          <div className="wms-ops-receiving-area__header flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5">
            <div className="wms-ops-pt-terminal__prompt min-w-0">
              <span className="wms-ops-subtitle-prefix" aria-hidden>{'> '}</span>
              <h3 className="wms-ops-pt-terminal__title">
                {selectedId ? t('shelfManagement.formEdit') : t('shelfManagement.formNew')}
              </h3>
            </div>
            <div className="wms-ops-actions flex flex-wrap gap-2">
              <OpsActionButton type="button" variant="primary" onClick={() => saveMutation.mutate()} disabled={formReadOnly || saveMutation.isPending}>
                <Save className="size-3.5" aria-hidden />
                {selectedId ? t('shelfManagement.update') : t('shelfManagement.save')}
              </OpsActionButton>
              <OpsActionButton
                type="button"
                variant="secondary"
                onClick={() => {
                  setSelectedId(null);
                  setForm(EMPTY_FORM);
                }}
              >
                <Plus className="size-3.5" aria-hidden />
                {t('shelfManagement.newRecord')}
              </OpsActionButton>
            </div>
          </div>

          <div className="wms-ops-form p-4 sm:px-5 sm:pb-5">
            <fieldset disabled={formReadOnly} className={formReadOnly ? 'pointer-events-none opacity-75' : undefined}>
              <div className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <MasterDataOpsFormField label={t('shelfManagement.warehouse')} className="md:col-span-2 xl:col-span-2">
                  <PagedLookupDialog
                    variant="ops"
                    open={warehousePickerOpen}
                    onOpenChange={setWarehousePickerOpen}
                    value={
                      warehousesQuery.data?.find((item) => item.id === form.warehouseId)
                        ? `${warehousesQuery.data.find((item) => item.id === form.warehouseId)?.depoKodu} · ${warehousesQuery.data.find((item) => item.id === form.warehouseId)?.depoIsmi}`
                        : ''
                    }
                    placeholder={t('shelfManagement.warehousePh')}
                    title={t('shelfManagement.warehouseTitle')}
                    description={t('shelfManagement.warehouseDesc')}
                    queryKey={['shelf-management', 'warehouse-picker']}
                    fetchPage={({ pageNumber, pageSize, search, signal }) =>
                      lookupApi.getWarehousesPaged({ pageNumber, pageSize, search }, undefined, { signal })
                    }
                    getKey={(item) => String(item.id)}
                    getLabel={(item) => `${item.depoKodu} · ${item.depoIsmi}`}
                    onSelect={(item) =>
                      setForm((current) => ({ ...current, warehouseId: item.id, parentShelfId: null }))
                    }
                    disabled={formReadOnly}
                  />
                </MasterDataOpsFormField>

                <MasterDataOpsFormField label={t('shelfManagement.parentShelf')} className="md:col-span-2 xl:col-span-2">
                  <MasterDataOpsSelect
                    value={form.parentShelfId ? String(form.parentShelfId) : '__none__'}
                    onValueChange={(value) =>
                      setForm((current) => ({ ...current, parentShelfId: value === '__none__' ? null : Number(value) }))
                    }
                    placeholder={t('shelfManagement.parentShelfPh')}
                    disabled={formReadOnly}
                  >
                    <OpsSelectItem value="__none__">{t('shelfManagement.none')}</OpsSelectItem>
                    {filteredParents.map((item) => (
                      <OpsSelectItem key={item.id} value={String(item.id)}>
                        {item.code} · {item.name}
                      </OpsSelectItem>
                    ))}
                  </MasterDataOpsSelect>
                </MasterDataOpsFormField>

                <MasterDataOpsFormField label={t('shelfManagement.code')}>
                  <OpsInput value={form.code} onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))} />
                </MasterDataOpsFormField>

                <MasterDataOpsFormField label={t('shelfManagement.name')}>
                  <OpsInput value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
                </MasterDataOpsFormField>

                <MasterDataOpsFormField label={t('shelfManagement.type')}>
                  <MasterDataOpsSelect
                    value={form.locationType}
                    onValueChange={(value) =>
                      setForm((current) => ({ ...current, locationType: value as ShelfUpsertRequest['locationType'] }))
                    }
                    disabled={formReadOnly}
                  >
                    <OpsSelectItem value="Zone">{t('shelfManagement.locationZone')}</OpsSelectItem>
                    <OpsSelectItem value="Rack">{t('shelfManagement.locationRack')}</OpsSelectItem>
                    <OpsSelectItem value="Shelf">{t('shelfManagement.locationShelf')}</OpsSelectItem>
                    <OpsSelectItem value="Cell">{t('shelfManagement.locationCell')}</OpsSelectItem>
                  </MasterDataOpsSelect>
                </MasterDataOpsFormField>

                <MasterDataOpsFormField label={t('shelfManagement.levelNo')}>
                  <OpsInput
                    type="number"
                    value={form.levelNo ?? ''}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, levelNo: event.target.value ? Number(event.target.value) : null }))
                    }
                  />
                </MasterDataOpsFormField>

                <MasterDataOpsFormField label={t('shelfManagement.capacity')}>
                  <OpsInput
                    type="number"
                    value={form.capacity ?? ''}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, capacity: event.target.value ? Number(event.target.value) : null }))
                    }
                  />
                </MasterDataOpsFormField>

                <MasterDataOpsFormField label={t('shelfManagement.barcodeEntryMode')}>
                  <MasterDataOpsSelect
                    value={form.barcodeEntryMode}
                    onValueChange={(value) =>
                      setForm((current) => ({ ...current, barcodeEntryMode: value as ShelfUpsertRequest['barcodeEntryMode'] }))
                    }
                    disabled={formReadOnly}
                  >
                    <OpsSelectItem value="Auto">{t('shelfManagement.barcodeModeAuto')}</OpsSelectItem>
                    <OpsSelectItem value="Manual">{t('shelfManagement.barcodeModeManual')}</OpsSelectItem>
                  </MasterDataOpsSelect>
                </MasterDataOpsFormField>

                <MasterDataOpsFormField label={t('shelfManagement.barcode')} className="md:col-span-2">
                  <OpsInput
                    value={form.barcodeEntryMode === 'Auto' ? barcodePreview : (form.barcode ?? '')}
                    onChange={(event) => setForm((current) => ({ ...current, barcode: event.target.value }))}
                    disabled={form.barcodeEntryMode === 'Auto'}
                    placeholder={
                      form.barcodeEntryMode === 'Auto'
                        ? t('shelfManagement.barcodeAutoPh')
                        : t('shelfManagement.barcodeManualPh')
                    }
                  />
                </MasterDataOpsFormField>

                <MasterDataOpsFormField label={t('shelfManagement.activeRecord')}>
                  <div className="flex min-h-[2.25rem] items-center justify-between gap-3 border border-[color:var(--wms-ops-field-border)] bg-[color:var(--wms-ops-field-bg)] px-3">
                    <span className="min-w-0 text-[0.6875rem] leading-snug opacity-70">
                      {t('shelfManagement.activeRecordHelp')}
                    </span>
                    <OpsCircuitToggleInline
                      checked={form.isActive}
                      onCheckedChange={(checked) => setForm((current) => ({ ...current, isActive: checked }))}
                      disabled={formReadOnly}
                      aria-label={t('shelfManagement.activeRecord')}
                    />
                  </div>
                </MasterDataOpsFormField>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="rounded-none border border-[color:var(--wms-ops-card-border)] bg-[color-mix(in_oklab,var(--wms-ops-accent)_6%,var(--wms-ops-card-bg))] p-3">
                  <div className="font-mono text-[0.6875rem] uppercase tracking-wider text-[color:var(--wms-ops-accent)]">
                    {t('shelfManagement.barcodePreviewTitle')}
                  </div>
                  <div className="mt-1.5 font-mono text-base">{barcodePreview || '-'}</div>
                  <div className="mt-1.5 text-[0.6875rem] leading-snug opacity-70">{t('shelfManagement.barcodePreviewHelp')}</div>
                </div>

                <MasterDataOpsFormField label={t('common.description')} className="min-w-0">
                  <OpsTextarea
                    value={form.description ?? ''}
                    onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                    rows={3}
                    className="min-h-[5rem]"
                  />
                </MasterDataOpsFormField>
              </div>
            </fieldset>
          </div>
        </section>

        <section className="wms-ops-receiving-area wms-ops-pt-terminal-section border">
          <div className="wms-ops-receiving-area__header px-4 py-3 sm:px-5">
            <div className="wms-ops-pt-terminal__prompt">
              <span className="wms-ops-subtitle-prefix" aria-hidden>{'> '}</span>
              <h3 className="wms-ops-pt-terminal__title">{t('shelfManagement.listTitle')}</h3>
            </div>
          </div>
          <div className="wms-ops-list wms-ops-form p-4 sm:px-5 sm:pb-5">
            <PagedDataGrid<ShelfDefinitionDto, ShelfColumnKey>
              variant="ops"
              pageKey={pageKey}
              columns={columns}
              visibleColumnKeys={orderedVisibleColumns.filter((key) => key !== 'actions') as ShelfColumnKey[]}
              defaultColumnWidths={SHELF_DEFAULT_WIDTHS}
              columnWidths={columnWidths}
              onResizeColumnPair={resizeColumnPair}
              rows={shelfRows}
              rowKey={(row) => row.id}
              renderCell={(item, columnKey) => {
                switch (columnKey) {
                  case 'warehouse':
                    return `${item.warehouseCode ?? '-'} · ${item.warehouseName ?? '-'}`;
                  case 'code':
                    return <span className="wms-ops-table-id-value font-mono text-xs">{item.code}</span>;
                  case 'name':
                    return (
                      <div>
                        <div className="font-medium uppercase tracking-wide">{item.name}</div>
                        {item.parentShelfCode ? (
                          <div className="text-xs opacity-70">
                            {t('shelfManagement.parentPrefix')}: {item.parentShelfCode}
                          </div>
                        ) : null}
                      </div>
                    );
                  case 'type':
                    return renderLocationType(item);
                  case 'barcode':
                    return <span className="font-mono text-xs">{item.barcode || '-'}</span>;
                  case 'status':
                    return (
                      <Badge variant="outline" className="wms-ops-code-badge rounded-none text-[0.625rem]">
                        {item.isActive ? t('shelfManagement.active') : t('shelfManagement.inactive')}
                      </Badge>
                    );
                  default:
                    return null;
                }
              }}
              showActionsColumn={showActionsColumn}
              actionsHeaderLabel={t('shelfManagement.colAction')}
              actionsCellClassName="wms-ops-table-actions-col"
              renderActionsCell={(item) => (
                <div className="wms-ops-row-actions">
                  {permission.canUpdate ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="wms-ops-grid-icon-btn"
                      aria-label={t('shelfManagement.edit')}
                      onClick={() => {
                        setSelectedId(item.id);
                        setForm({
                          warehouseId: item.warehouseId,
                          parentShelfId: item.parentShelfId ?? null,
                          code: item.code,
                          name: item.name,
                          locationType: item.locationType,
                          barcodeEntryMode: item.barcodeEntryMode,
                          barcode: item.barcode ?? '',
                          capacity: item.capacity ?? null,
                          levelNo: item.levelNo ?? null,
                          isActive: item.isActive,
                          description: item.description ?? '',
                        });
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
                      aria-label={t('common.delete')}
                      disabled={deleteMutation.isPending}
                      onClick={() => deleteMutation.mutate(item.id)}
                    >
                      <Trash2 className="size-3" aria-hidden />
                    </Button>
                  ) : null}
                </div>
              )}
              sortBy={pagedGrid.sortBy}
              sortDirection={pagedGrid.sortDirection}
              onSort={(columnKey) => {
                if (columnKey === 'actions') return;
                pagedGrid.handleSort(columnKey);
              }}
              renderSortIcon={(columnKey) =>
                columnKey === pagedGrid.sortBy
                  ? pagedGrid.sortDirection === 'asc'
                    ? <ArrowUp className="ml-1 h-3.5 w-3.5" />
                    : <ArrowDown className="ml-1 h-3.5 w-3.5" />
                  : null
              }
              isLoading={shelvesQuery.isLoading}
              isError={Boolean(shelvesQuery.error)}
              errorText={shelvesQuery.error instanceof Error ? shelvesQuery.error.message : t('common.error')}
              emptyText={t('common.noData')}
              pageSize={shelvesQuery.data?.data?.pageSize ?? pagedGrid.pageSize}
              pageSizeOptions={pagedGrid.pageSizeOptions}
              onPageSizeChange={pagedGrid.handlePageSizeChange}
              pageNumber={pagedGrid.getDisplayPageNumber(shelvesQuery.data?.data)}
              totalPages={Math.max(shelvesQuery.data?.data?.totalPages ?? 1, 1)}
              hasPreviousPage={Boolean(shelvesQuery.data?.data?.hasPreviousPage)}
              hasNextPage={Boolean(shelvesQuery.data?.data?.hasNextPage)}
              onPreviousPage={pagedGrid.goToPreviousPage}
              onNextPage={pagedGrid.goToNextPage}
              previousLabel={t('common.previous')}
              nextLabel={t('common.next')}
              paginationInfoText={t('common.paginationInfo', {
                current: shelfRange.from,
                total: shelfRange.to,
                totalCount: shelfRange.total,
                defaultValue: `${shelfRange.from}-${shelfRange.to} / ${shelfRange.total}`,
              })}
              lockedColumnKeys={['code']}
              idColumnKey="code"
              actionBar={{
                pageKey,
                userId,
                columns: columns.map(({ key, label }) => ({ key, label })),
                visibleColumns,
                columnOrder,
                onVisibleColumnsChange: setVisibleColumns,
                onColumnOrderChange: setColumnOrder,
                lockedKeys: ['code'],
                exportFileName: pageKey,
                exportColumns: orderedVisibleColumns
                  .filter((key) => key !== 'actions')
                  .map((key) => ({ key, label: columns.find((column) => column.key === key)?.label ?? key })),
                exportRows: shelfRows.map((item) => ({
                  warehouse: `${item.warehouseCode ?? ''} · ${item.warehouseName ?? ''}`,
                  code: item.code,
                  name: item.name,
                  type: renderLocationType(item),
                  barcode: item.barcode ?? '',
                  status: item.isActive ? t('shelfManagement.active') : t('shelfManagement.inactive'),
                })),
                filterColumns,
                defaultFilterColumn: 'code',
                draftFilterRows: pagedGrid.draftFilterRows,
                onDraftFilterRowsChange: pagedGrid.setDraftFilterRows,
                filterLogic: pagedGrid.filterLogic,
                onFilterLogicChange: pagedGrid.setFilterLogic,
                onApplyFilters: pagedGrid.applyAdvancedFilters,
                onClearFilters: pagedGrid.clearAdvancedFilters,
                appliedFilterCount: pagedGrid.appliedAdvancedFilters.length,
                variant: 'ops',
                search: {
                  value: pagedGrid.searchInput,
                  onValueChange: pagedGrid.searchConfig.onValueChange,
                  onSearchChange: pagedGrid.searchConfig.onSearchChange,
                  placeholder: t('shelfManagement.searchPh'),
                },
                refresh: {
                  onRefresh: () => void shelvesQuery.refetch(),
                  isLoading: shelvesQuery.isLoading,
                  label: t('common.refresh'),
                },
              }}
            />
          </div>
        </section>
      </div>
    </OpsFormPageShell>
  );
}
