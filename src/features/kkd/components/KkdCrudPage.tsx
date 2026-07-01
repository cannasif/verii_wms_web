import { type Dispatch, type ReactElement, type SetStateAction, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Edit3, Loader2, Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  DeleteConfirmDialog,
  OpsActionButton,
  OpsInput,
  OpsListPageShell,
  OpsTextarea,
  OpsToggleField,
  PagedDataGrid,
  type PagedDataGridColumn,
} from '@/components/shared';
import type { DataTableDefinitionExcelConfig } from '@/components/shared/DataTableActionBar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { VoiceSearchButton } from '@/components/ui/voice-search-button';
import { getPagedRange } from '@/lib/paged';
import { usePagedDataGrid } from '@/hooks/usePagedDataGrid';
import { useUIStore } from '@/stores/ui-store';
import { toast } from 'sonner';
import i18n, { getLocaleForFormatting } from '@/lib/i18n';
import type { PagedParams, PagedResponse } from '@/types/api';
import { inferFilterColumnType, type FilterColumnConfig } from '@/lib/advanced-filter-types';
import {
  KKD_CRUD_DEFAULT_COLUMN_WIDTHS,
  KkdMetricGrid,
  KkdOpsDialogContent,
  KkdOpsFormField,
  KkdSummaryMetric,
} from './kkd-ops-ui';

type CrudFieldType = 'text' | 'number' | 'date' | 'textarea' | 'boolean';

export interface KkdCrudField<TForm extends object> {
  key: keyof TForm & string;
  label: string;
  type: CrudFieldType;
  required?: boolean;
  placeholder?: string;
  step?: string;
}

interface KkdCrudFormRenderProps<TForm extends object, TItem extends { id: number }> {
  formState: TForm;
  setFormState: Dispatch<SetStateAction<TForm>>;
  editingItem: TItem | null;
}

interface KkdCrudPageProps<TItem extends { id: number }, TForm extends object, TColumnKey extends string> {
  pageKey: string;
  title: string;
  description: string;
  breadcrumbGroup: string;
  breadcrumbCurrent: string;
  columns: PagedDataGridColumn<TColumnKey>[];
  fields: readonly KkdCrudField<TForm>[];
  initialForm: TForm;
  getList: (params: PagedParams) => Promise<PagedResponse<TItem>>;
  createItem: (dto: TForm) => Promise<TItem>;
  updateItem: (id: number, dto: Partial<TForm>) => Promise<TItem>;
  deleteItem: (id: number) => Promise<void>;
  queryKey: readonly unknown[];
  mapSortBy: (value: TColumnKey) => string;
  renderCell: (row: TItem, columnKey: TColumnKey) => ReactElement | string | number | null;
  renderForm?: (props: KkdCrudFormRenderProps<TForm, TItem>) => ReactElement;
  definitionExcel?: DataTableDefinitionExcelConfig;
  defaultColumnWidths?: Record<string, number>;
  gridMinWidthClassName?: string;
  gridHeaderLayout?: 'default' | 'slant';
  dialogSize?: 'md' | 'lg' | 'xl' | 'full';
  dialogClassName?: string;
}

function formatDateInput(value: unknown): string {
  if (!value) return '';
  if (typeof value === 'string') return value.slice(0, 10);
  return '';
}

function resolveRowId<TItem extends { id: number }>(item: TItem): number {
  const record = item as Record<string, unknown>;
  const rawId = record.id ?? record.Id;
  if (typeof rawId === 'number' && !Number.isNaN(rawId)) {
    return rawId;
  }
  if (typeof rawId === 'string' && rawId.trim() !== '' && !Number.isNaN(Number(rawId))) {
    return Number(rawId);
  }
  return 0;
}

function formatExportCellValue(columnKey: string, value: unknown, activeLabel: string, passiveLabel: string): string | number {
  if (value == null || value === '') {
    return '-';
  }
  if (typeof value === 'boolean') {
    return value ? activeLabel : passiveLabel;
  }
  if (columnKey === 'updatedDate' && typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return new Date(value).toLocaleDateString(getLocaleForFormatting(i18n.language));
  }
  return typeof value === 'number' ? value : String(value);
}

export function KkdCrudPage<TItem extends { id: number }, TForm extends object, TColumnKey extends string>({
  pageKey,
  title,
  description,
  breadcrumbGroup,
  breadcrumbCurrent,
  columns,
  fields,
  initialForm,
  getList,
  createItem,
  updateItem,
  deleteItem,
  queryKey,
  mapSortBy,
  renderCell,
  renderForm,
  definitionExcel,
  defaultColumnWidths = KKD_CRUD_DEFAULT_COLUMN_WIDTHS,
  gridMinWidthClassName,
  gridHeaderLayout,
  dialogSize = 'lg',
  dialogClassName,
}: KkdCrudPageProps<TItem, TForm, TColumnKey>): ReactElement {
  const { t } = useTranslation(['kkd', 'common']);
  const { setPageTitle } = useUIStore();
  const queryClient = useQueryClient();
  const pagedGrid = usePagedDataGrid<TColumnKey>({
    pageKey,
    defaultSortBy: columns[0]?.key ?? ('id' as TColumnKey),
    defaultSortDirection: 'asc',
    defaultPageSize: 20,
    mapSortBy,
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<TItem | null>(null);
  const [formState, setFormState] = useState<TForm>(initialForm);

  useEffect(() => {
    setPageTitle(title);
    return () => setPageTitle(null);
  }, [setPageTitle, title]);

  const query = useQuery({
    queryKey: [...queryKey, pagedGrid.queryParams],
    queryFn: () => getList(pagedGrid.queryParams),
  });

  const refreshList = async (): Promise<void> => {
    await queryClient.invalidateQueries({ queryKey });
    await queryClient.refetchQueries({ queryKey, type: 'active' });
  };

  const createMutation = useMutation({
    mutationFn: createItem,
    onSuccess: async () => {
      toast.success(t('common.saveSuccess'));
      await refreshList();
      setDialogOpen(false);
      setEditingItem(null);
      setFormState(initialForm);
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('common.generalError')),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: Partial<TForm> }) => updateItem(id, dto),
    onSuccess: async () => {
      toast.success(t('common.saveSuccess'));
      await refreshList();
      setDialogOpen(false);
      setEditingItem(null);
      setFormState(initialForm);
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('common.generalError')),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteItem,
    onSuccess: async () => {
      toast.success(t('common.deleteSuccess'));
      await refreshList();
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('common.generalError')),
  });

  const totalCount = query.data?.totalCount ?? 0;
  const activeCount = useMemo(
    () => (query.data?.data ?? []).filter((item) => ('isActive' in item ? Boolean((item as Record<string, unknown>).isActive) : true)).length,
    [query.data?.data],
  );
  const range = getPagedRange(query.data);
  const paginationInfoText = t('common.paginationInfo', {
    current: range.from,
    total: range.to,
    totalCount: range.total,
  });
  const filterColumns = useMemo<readonly FilterColumnConfig[]>(
    () =>
      columns.map((column) => ({
        value: column.key,
        type: inferFilterColumnType(column.key),
        labelKey: column.key,
        label: column.label,
      })),
    [columns],
  );

  const exportColumns = useMemo(
    () => columns.map(({ key, label }) => ({ key, label })),
    [columns],
  );

  const exportRows = useMemo<Record<string, unknown>[]>(() => {
    const activeLabel = t('common.active');
    const passiveLabel = t('common.passive');

    return (query.data?.data ?? []).map((row) => {
      const record: Record<string, unknown> = {};
      columns.forEach((column) => {
        record[column.key] = formatExportCellValue(
          column.key,
          (row as Record<string, unknown>)[column.key],
          activeLabel,
          passiveLabel,
        );
      });
      return record;
    });
  }, [columns, query.data?.data, t]);

  const openCreate = (): void => {
    setEditingItem(null);
    setFormState(initialForm);
    setDialogOpen(true);
  };

  const openEdit = (item: TItem): void => {
    setEditingItem(item);
    const nextState = { ...initialForm } as Record<string, unknown>;
    Object.keys(nextState).forEach((key) => {
      nextState[key] = (item as Record<string, unknown>)[key] ?? nextState[key];
    });
    setFormState(nextState as TForm);
    setDialogOpen(true);
  };

  const handleSubmit = (): void => {
    if (editingItem) {
      const rowId = resolveRowId(editingItem);
      if (!rowId) {
        toast.error(t('common.generalError'));
        return;
      }
      updateMutation.mutate({ id: rowId, dto: formState });
      return;
    }
    createMutation.mutate(formState);
  };

  return (
    <>
      <OpsListPageShell
        className="wms-ops-kkd-page"
        eyebrow={(
          <>
            <span>{breadcrumbGroup}</span>
            <span className="mx-2 opacity-60">/</span>
            <span>{breadcrumbCurrent}</span>
          </>
        )}
        title={title}
        description={description}
        actions={(
          <OpsActionButton type="button" variant="primary" onClick={openCreate}>
            <Plus className="size-4" />
            {t('common.add')}
          </OpsActionButton>
        )}
      >
        <div className="wms-ops-kkd-page__body space-y-5">
          <KkdMetricGrid>
            <KkdSummaryMetric label={t('common.records')} value={totalCount} icon={<span className="text-xs font-bold">#</span>} />
            <KkdSummaryMetric label={t('common.active')} value={activeCount} icon={<span className="text-xs font-bold">OK</span>} />
          </KkdMetricGrid>

          <PagedDataGrid<TItem, TColumnKey>
            variant="ops"
            pageKey={pageKey}
            columns={columns}
            rows={query.data?.data ?? []}
            rowKey={(row) => resolveRowId(row)}
            renderCell={renderCell}
            sortBy={pagedGrid.sortBy}
            sortDirection={pagedGrid.sortDirection}
            onSort={pagedGrid.handleSort}
            isLoading={query.isLoading || query.isFetching}
            isError={Boolean(query.error)}
            errorText={t('common.generalError')}
            emptyText={t('common.noData')}
            showActionsColumn
            actionsHeaderLabel={t('common.actions')}
            iconOnlyActions
            actionsCellClassName="wms-ops-table-actions-col"
            defaultColumnWidths={defaultColumnWidths}
            enableColumnResize
            renderActionsCell={(row) => (
              <div className="wms-ops-row-actions">
                <Button type="button" variant="ghost" size="icon" className="wms-ops-grid-icon-btn" onClick={() => openEdit(row)} aria-label={t('common.edit')}>
                  <Edit3 className="size-3" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="wms-ops-grid-icon-btn wms-ops-grid-icon-btn--danger"
                  onClick={() => {
                    setItemToDelete(row);
                    setDeleteDialogOpen(true);
                  }}
                  aria-label={t('common.delete')}
                >
                  <Trash2 className="size-3" />
                </Button>
              </div>
            )}
            pageSize={pagedGrid.pageSize}
            pageSizeOptions={pagedGrid.pageSizeOptions}
            onPageSizeChange={pagedGrid.handlePageSizeChange}
            pageNumber={pagedGrid.getDisplayPageNumber(query.data)}
            totalPages={query.data?.totalPages ?? 1}
            hasPreviousPage={query.data?.hasPreviousPage ?? false}
            hasNextPage={query.data?.hasNextPage ?? false}
            onPreviousPage={pagedGrid.goToPreviousPage}
            onNextPage={pagedGrid.goToNextPage}
            previousLabel={t('common.previous')}
            nextLabel={t('common.next')}
            paginationInfoText={paginationInfoText}
            search={{
              value: pagedGrid.searchConfig.value,
              onValueChange: pagedGrid.searchConfig.onValueChange,
              onSearchChange: pagedGrid.searchConfig.onSearchChange,
              placeholder: t('common.search'),
            }}
            filterColumns={filterColumns}
            defaultFilterColumn={filterColumns[0]?.value ?? ''}
            draftFilterRows={pagedGrid.draftFilterRows}
            onDraftFilterRowsChange={pagedGrid.setDraftFilterRows}
            filterLogic={pagedGrid.filterLogic}
            onFilterLogicChange={pagedGrid.setFilterLogic}
            onApplyFilters={pagedGrid.applyAdvancedFilters}
            onClearFilters={pagedGrid.clearAdvancedFilters}
            appliedFilterCount={pagedGrid.appliedAdvancedFilters.length}
            leftSlot={<VoiceSearchButton onResult={pagedGrid.handleVoiceSearch} size="icon" variant="ghost" className="wms-ops-voice-btn" />}
            refresh={{
              onRefresh: () => {
                void query.refetch();
              },
              isLoading: query.isFetching,
              label: t('common.refresh'),
            }}
            exportFileName={pageKey}
            exportColumns={exportColumns}
            exportRows={exportRows}
            definitionExcel={definitionExcel}
            minTableWidthClassName={gridMinWidthClassName}
            headerLayout={gridHeaderLayout}
          />
        </div>
      </OpsListPageShell>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <KkdOpsDialogContent size={dialogSize} className={dialogClassName}>
          <DialogHeader className="wms-ops-detail-dialog__header shrink-0 border-b px-4 py-4 pr-12 sm:px-6 sm:pr-14">
            <DialogTitle className="wms-ops-detail-dialog__title">
              {editingItem ? t('common.edit') : t('common.add')}
            </DialogTitle>
            <DialogDescription className="wms-ops-detail-dialog__description">
              {description}
            </DialogDescription>
          </DialogHeader>
          <div className="wms-ops-scrollbar wms-ops-form min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
            {renderForm ? (
              renderForm({ formState, setFormState, editingItem })
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {fields.map((field) => {
                  const rawValue = formState[field.key];
                  return (
                    <KkdOpsFormField
                      key={field.key}
                      label={(
                        <>
                          {field.label}
                          {field.required ? <span className="ml-1 text-destructive" aria-hidden>*</span> : null}
                        </>
                      )}
                      htmlFor={field.key}
                      className={field.type === 'textarea' ? 'md:col-span-2' : undefined}
                    >
                      {field.type === 'textarea' ? (
                        <OpsTextarea
                          id={field.key}
                          value={typeof rawValue === 'string' ? rawValue : ''}
                          placeholder={field.placeholder}
                          onChange={(event) => setFormState((prev) => ({ ...prev, [field.key]: event.target.value }))}
                        />
                      ) : field.type === 'boolean' ? (
                        <OpsToggleField
                          checked={Boolean(rawValue)}
                          onCheckedChange={(checked) => setFormState((prev) => ({ ...prev, [field.key]: checked }))}
                          title={field.label}
                        />
                      ) : (
                        <OpsInput
                          id={field.key}
                          type={field.type}
                          step={field.step}
                          value={
                            field.type === 'date'
                              ? formatDateInput(rawValue)
                              : rawValue == null
                                ? ''
                                : String(rawValue)
                          }
                          placeholder={field.placeholder}
                          onChange={(event) => {
                            const nextValue = field.type === 'number'
                              ? (event.target.value === '' ? null : Number(event.target.value))
                              : event.target.value;
                            setFormState((prev) => ({ ...prev, [field.key]: nextValue }));
                          }}
                        />
                      )}
                    </KkdOpsFormField>
                  );
                })}
              </div>
            )}
          </div>
          <DialogFooter className="wms-ops-detail-dialog__footer shrink-0 gap-2 border-t px-4 py-4 sm:px-6">
            <OpsActionButton type="button" variant="secondary" onClick={() => setDialogOpen(false)}>
              {t('common.cancel')}
            </OpsActionButton>
            <OpsActionButton
              type="button"
              variant="primary"
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              {editingItem ? t('common.update') : t('common.save')}
            </OpsActionButton>
          </DialogFooter>
        </KkdOpsDialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        title={t('common.delete')}
        description={itemToDelete ? t('kkd.operational.deleteConfirm', { name: breadcrumbCurrent }) : undefined}
        isPending={deleteMutation.isPending}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={() => {
          if (!itemToDelete) return;
          const rowId = resolveRowId(itemToDelete);
          if (!rowId) {
            toast.error(t('common.generalError'));
            return;
          }
          deleteMutation.mutate(rowId);
        }}
      />
    </>
  );
}

export { renderKkdGenericCell } from './kkd-ops-ui';
