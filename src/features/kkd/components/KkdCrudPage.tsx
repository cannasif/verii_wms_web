import { type Dispatch, type ReactElement, type SetStateAction, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { PagedDataGrid, type PagedDataGridColumn } from '@/components/shared';
import { VoiceSearchButton } from '@/components/ui/voice-search-button';
import { getPagedRange } from '@/lib/paged';
import { usePagedDataGrid } from '@/hooks/usePagedDataGrid';
import { useUIStore } from '@/stores/ui-store';
import { toast } from 'sonner';
import type { PagedParams, PagedResponse } from '@/types/api';

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
}

function formatDateInput(value: unknown): string {
  if (!value) return '';
  if (typeof value === 'string') return value.slice(0, 10);
  return '';
}

function formatCellValue(value: unknown): string {
  if (value == null || value === '') return '-';
  if (typeof value === 'boolean') return value ? 'Evet' : 'Hayır';
  return String(value);
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
}: KkdCrudPageProps<TItem, TForm, TColumnKey>): ReactElement {
  const { t } = useTranslation('common');
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

  const createMutation = useMutation({
    mutationFn: createItem,
    onSuccess: () => {
      toast.success(t('common.saveSuccess'));
      void queryClient.invalidateQueries({ queryKey });
      setDialogOpen(false);
      setEditingItem(null);
      setFormState(initialForm);
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('common.generalError')),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: Partial<TForm> }) => updateItem(id, dto),
    onSuccess: () => {
      toast.success(t('common.saveSuccess'));
      void queryClient.invalidateQueries({ queryKey });
      setDialogOpen(false);
      setEditingItem(null);
      setFormState(initialForm);
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('common.generalError')),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteItem,
    onSuccess: () => {
      toast.success(t('common.deleteSuccess'));
      void queryClient.invalidateQueries({ queryKey });
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
    defaultValue: `${range.from}-${range.to} / ${range.total}`,
  });

  const renderSortIcon = (columnKey: TColumnKey): ReactElement | null => {
    if (columnKey !== pagedGrid.sortBy) return null;
    return pagedGrid.sortDirection === 'asc'
      ? <ArrowUp className="ml-1 h-3.5 w-3.5" />
      : <ArrowDown className="ml-1 h-3.5 w-3.5" />;
  };

  const openCreate = (): void => {
    setEditingItem(null);
    setFormState(initialForm);
    setDialogOpen(true);
  };

  const openEdit = (item: TItem): void => {
    setEditingItem(item);
    const nextState = { ...initialForm } as Record<string, unknown>;
    fields.forEach((field) => {
      nextState[field.key] = (item as Record<string, unknown>)[field.key] ?? nextState[field.key];
    });
    setFormState(nextState as TForm);
    setDialogOpen(true);
  };

  const handleSubmit = (): void => {
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, dto: formState });
      return;
    }
    createMutation.mutate(formState);
  };

  return (
    <div className="crm-page space-y-6">
      <Breadcrumb items={[{ label: breadcrumbGroup }, { label: breadcrumbCurrent, isActive: true }]} />

      <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-linear-to-br from-white via-cyan-50/70 to-emerald-50/70 p-5 shadow-sm dark:border-cyan-800/30 dark:from-blue-950/70 dark:via-blue-950/90 dark:to-cyan-950/40 sm:p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="flex flex-col gap-2">
            <div className="inline-flex w-fit items-center gap-2 rounded-2xl border border-cyan-200 bg-white/80 px-3 py-1.5 text-xs font-black text-cyan-700 shadow-sm dark:border-cyan-800/40 dark:bg-blue-950/60 dark:text-cyan-300">
              <Badge variant="outline">{breadcrumbGroup}</Badge>
              {breadcrumbCurrent}
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">{title}</h1>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{description}</p>
          </div>
          <Button
            onClick={openCreate}
            className="h-11 rounded-2xl border-0 bg-linear-to-r from-cyan-600 to-emerald-600 px-6 text-white shadow-lg shadow-cyan-500/20 hover:text-white"
          >
            <Plus size={18} className="mr-2" />
            {t('common.add')}
          </Button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white/85 p-4 shadow-sm dark:border-cyan-800/30 dark:bg-blue-950/50">
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">{t('common.records')}</p>
            <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">{totalCount}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/85 p-4 shadow-sm dark:border-cyan-800/30 dark:bg-blue-950/50">
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">{t('common.active')}</p>
            <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">{activeCount}</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <PagedDataGrid<TItem, TColumnKey>
            pageKey={pageKey}
            columns={columns}
            rows={query.data?.data ?? []}
            rowKey={(row) => row.id}
            renderCell={renderCell}
            sortBy={pagedGrid.sortBy}
            sortDirection={pagedGrid.sortDirection}
            onSort={pagedGrid.handleSort}
            renderSortIcon={renderSortIcon}
            isLoading={query.isLoading || query.isFetching}
            isError={Boolean(query.error)}
            errorText={t('common.generalError')}
            emptyText={t('common.noData')}
            showActionsColumn
            actionsHeaderLabel={t('common.actions')}
            renderActionsCell={(row) => (
              <div className="flex items-center justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => openEdit(row)}>
                  <Pencil className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setItemToDelete(row);
                    setDeleteDialogOpen(true);
                  }}
                >
                  <Trash2 className="size-4" />
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
            leftSlot={<VoiceSearchButton onResult={pagedGrid.handleVoiceSearch} size="sm" />}
            refresh={{
              onRefresh: () => {
                void query.refetch();
              },
              isLoading: query.isFetching,
              label: t('common.refresh', { defaultValue: 'Refresh' }),
            }}
          />
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingItem ? t('common.edit') : t('common.add')}</DialogTitle>
          </DialogHeader>
          {renderForm ? (
            renderForm({ formState, setFormState, editingItem })
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {fields.map((field) => {
                const rawValue = formState[field.key];
                return (
                  <div key={field.key} className={field.type === 'textarea' ? 'md:col-span-2 space-y-2' : 'space-y-2'}>
                    <Label htmlFor={field.key}>
                      {field.label}
                      {field.required ? ' *' : ''}
                    </Label>
                    {field.type === 'textarea' ? (
                      <Textarea
                        id={field.key}
                        value={typeof rawValue === 'string' ? rawValue : ''}
                        placeholder={field.placeholder}
                        onChange={(event) => setFormState((prev) => ({ ...prev, [field.key]: event.target.value }))}
                      />
                    ) : field.type === 'boolean' ? (
                      <div className="flex h-10 items-center rounded-xl border border-slate-200 px-3">
                        <Switch
                          checked={Boolean(rawValue)}
                          onCheckedChange={(checked) => setFormState((prev) => ({ ...prev, [field.key]: checked }))}
                        />
                      </div>
                    ) : (
                      <Input
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
                  </div>
                );
              })}
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {editingItem ? t('common.update') : t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('common.delete')}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {itemToDelete ? `${breadcrumbCurrent} kaydı silinsin mi?` : t('common.delete')}
          </p>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (!itemToDelete) return;
                deleteMutation.mutate(itemToDelete.id);
              }}
              disabled={deleteMutation.isPending}
            >
              {t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function renderKkdGenericCell(value: unknown): ReactElement | string | number | null {
  if (typeof value === 'boolean') {
    return <Badge variant={value ? 'default' : 'secondary'}>{value ? 'Aktif' : 'Pasif'}</Badge>;
  }
  if (typeof value === 'string' && value.length >= 10 && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return new Date(value).toLocaleDateString('tr-TR');
  }
  return formatCellValue(value);
}
