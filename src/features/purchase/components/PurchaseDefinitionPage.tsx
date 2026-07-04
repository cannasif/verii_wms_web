import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowDown, ArrowUp, Pencil, Plus, Save, Trash2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DeleteConfirmDialog, OpsActionButton, OpsInput, OpsListPageShell, OpsTextarea, PagedDataGrid, type PagedDataGridColumn } from '@/components/shared';
import { usePagedDataGrid } from '@/hooks/usePagedDataGrid';
import { getPagedRange } from '@/lib/paged';
import { useUIStore } from '@/stores/ui-store';
import { purchaseDefinitionApi } from '../api/purchase.api';
import type { CreatePurchaseDefinitionDto, PurchaseDefinitionCategory, PurchaseDefinitionDto } from '../types/purchase.types';

type DefinitionColumnKey = 'code' | 'name' | 'description' | 'sortOrder' | 'isActive' | 'isDefault' | 'updatedDate' | 'actions';

const categoryConfigs: Record<PurchaseDefinitionCategory, { title: string; description: string; singular: string; pageKey: string }> = {
  PaymentType: {
    title: 'Ödeme Tipleri',
    description: 'Satınalma teklif ve siparişlerinde seçilecek ödeme tiplerini yönetin.',
    singular: 'Ödeme Tipi',
    pageKey: 'purchase-payment-type-definitions',
  },
  PurchaseType: {
    title: 'Satınalma Tipleri',
    description: 'Yurtiçi, yurtdışı veya firma özelindeki satınalma türlerini yönetin.',
    singular: 'Satınalma Tipi',
    pageKey: 'purchase-type-definitions',
  },
  DeliveryType: {
    title: 'Teslimat Tipleri',
    description: 'Teslimat şekli ve teslimat tipi seçeneklerini satınalma akışında kullanılacak şekilde yönetin.',
    singular: 'Teslimat Tipi',
    pageKey: 'purchase-delivery-type-definitions',
  },
};

const emptyDraft = (category: PurchaseDefinitionCategory): CreatePurchaseDefinitionDto => ({
  category,
  code: '',
  name: '',
  description: '',
  sortOrder: 0,
  isActive: true,
  isDefault: false,
});

function mapSortBy(value: DefinitionColumnKey): string {
  switch (value) {
    case 'code': return 'Code';
    case 'name': return 'Name';
    case 'description': return 'Description';
    case 'sortOrder': return 'SortOrder';
    case 'isActive': return 'IsActive';
    case 'isDefault': return 'IsDefault';
    case 'updatedDate': return 'UpdatedDate';
    default: return 'SortOrder';
  }
}

function formatDate(value?: string | null): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('tr-TR', { dateStyle: 'short', timeStyle: 'short' }).format(date);
}

export function PurchaseDefinitionPage({ category }: { category: PurchaseDefinitionCategory }): ReactElement {
  const { t } = useTranslation('common');
  const { setPageTitle } = useUIStore();
  const queryClient = useQueryClient();
  const config = categoryConfigs[category];
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDefinition, setEditingDefinition] = useState<PurchaseDefinitionDto | null>(null);
  const [deleteDefinition, setDeleteDefinition] = useState<PurchaseDefinitionDto | null>(null);
  const [draft, setDraft] = useState<CreatePurchaseDefinitionDto>(() => emptyDraft(category));

  const pagedGrid = usePagedDataGrid<DefinitionColumnKey>({
    pageKey: config.pageKey,
    defaultSortBy: 'sortOrder',
    defaultSortDirection: 'asc',
    defaultPageSize: 20,
    mapSortBy,
  });

  const columns = useMemo<PagedDataGridColumn<DefinitionColumnKey>[]>(() => [
    { key: 'code', label: 'Kod' },
    { key: 'name', label: 'Açıklama' },
    { key: 'description', label: 'Detay' },
    { key: 'sortOrder', label: 'Sıra' },
    { key: 'isActive', label: 'Aktif', sortable: false },
    { key: 'isDefault', label: 'Varsayılan', sortable: false },
    { key: 'updatedDate', label: 'Güncelleme' },
    { key: 'actions', label: t('actions'), sortable: false },
  ], [t]);

  const query = useQuery({
    queryKey: ['purchase', 'definitions', category, pagedGrid.queryParams],
    queryFn: () => purchaseDefinitionApi.getPaged({
      ...pagedGrid.queryParams,
      filters: [
        ...(pagedGrid.queryParams.filters ?? []),
        { column: 'Category', operator: 'Equals', value: category },
      ],
    }),
  });

  const saveMutation = useMutation({
    mutationFn: (dto: CreatePurchaseDefinitionDto) => editingDefinition
      ? purchaseDefinitionApi.update(editingDefinition.id, dto)
      : purchaseDefinitionApi.create(dto),
    onSuccess: async () => {
      toast.success(editingDefinition ? 'Satınalma tanımı güncellendi.' : 'Satınalma tanımı oluşturuldu.');
      setDialogOpen(false);
      setEditingDefinition(null);
      setDraft(emptyDraft(category));
      await queryClient.invalidateQueries({ queryKey: ['purchase', 'definitions'] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('generalError')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => purchaseDefinitionApi.delete(id),
    onSuccess: async () => {
      toast.success('Satınalma tanımı silindi.');
      setDeleteDefinition(null);
      await queryClient.invalidateQueries({ queryKey: ['purchase', 'definitions'] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('generalError')),
  });

  useEffect(() => {
    setPageTitle(config.title);
    return () => setPageTitle(null);
  }, [config.title, setPageTitle]);

  function openCreateDialog(): void {
    setEditingDefinition(null);
    setDraft(emptyDraft(category));
    setDialogOpen(true);
  }

  function openEditDialog(definition: PurchaseDefinitionDto): void {
    setEditingDefinition(definition);
    setDraft({
      category,
      code: definition.code,
      name: definition.name,
      description: definition.description ?? '',
      sortOrder: definition.sortOrder ?? 0,
      isActive: definition.isActive,
      isDefault: definition.isDefault,
    });
    setDialogOpen(true);
  }

  function handleSave(): void {
    const code = draft.code.trim().toUpperCase();
    const name = draft.name.trim();
    if (!code || !name) {
      toast.error('Kod ve açıklama zorunludur.');
      return;
    }

    saveMutation.mutate({
      ...draft,
      category,
      code,
      name,
      description: draft.description?.trim() || null,
      sortOrder: Number(draft.sortOrder) || 0,
    });
  }

  const range = getPagedRange(query.data);
  const paginationInfoText = t('paginationInfo', { current: range.from, total: range.to, totalCount: range.total, defaultValue: `${range.from}-${range.to} / ${range.total}` });
  const renderSortIcon = (columnKey: DefinitionColumnKey): ReactElement | null => columnKey !== pagedGrid.sortBy ? null : pagedGrid.sortDirection === 'asc' ? <ArrowUp className="ml-1 h-3.5 w-3.5" /> : <ArrowDown className="ml-1 h-3.5 w-3.5" />;

  return (
    <OpsListPageShell
      eyebrow="WMS / SATINALMA / TANIMLAR"
      title={config.title}
      description={config.description}
      actions={(
        <OpsActionButton type="button" variant="primary" onClick={openCreateDialog}>
          <Plus className="size-4" />
          Yeni {config.singular}
        </OpsActionButton>
      )}
    >
      <div className="rounded-2xl border border-slate-300/80 bg-white/95 p-5 shadow-[0_18px_50px_-36px_rgba(15,23,42,0.45)] dark:border-white/10 dark:bg-[#120b1d]/88">
        <PagedDataGrid<PurchaseDefinitionDto, DefinitionColumnKey>
          pageKey={config.pageKey}
          columns={columns}
          rows={query.data?.data ?? []}
          rowKey={(row) => row.id}
          renderCell={(row, columnKey) => {
            switch (columnKey) {
              case 'code': return <span className="font-mono text-xs font-black text-cyan-700 dark:text-cyan-200">{row.code}</span>;
              case 'name': return <span className="font-black">{row.name}</span>;
              case 'description': return row.description || '-';
              case 'sortOrder': return row.sortOrder;
              case 'isActive': return <Badge variant={row.isActive ? 'default' : 'secondary'}>{row.isActive ? 'Aktif' : 'Pasif'}</Badge>;
              case 'isDefault': return <Badge variant={row.isDefault ? 'default' : 'secondary'}>{row.isDefault ? 'Evet' : 'Hayır'}</Badge>;
              case 'updatedDate': return formatDate(row.updatedDate ?? row.createdDate);
              default: return null;
            }
          }}
          sortBy={pagedGrid.sortBy}
          sortDirection={pagedGrid.sortDirection}
          onSort={(columnKey) => {
            if (columnKey === 'actions' || columnKey === 'isActive' || columnKey === 'isDefault') return;
            pagedGrid.handleSort(columnKey);
          }}
          renderSortIcon={renderSortIcon}
          isLoading={query.isLoading}
          isError={query.isError}
          errorText={query.error instanceof Error ? query.error.message : 'Satınalma tanımları alınamadı.'}
          emptyText="Bu kategori için tanım bulunamadı."
          showActionsColumn
          actionsHeaderLabel={t('actions')}
          renderActionsCell={(row) => (
            <div className="flex items-center justify-end gap-2">
              <button type="button" className="wms-ops-action-btn wms-ops-action-btn--secondary" onClick={() => openEditDialog(row)}>
                <Pencil className="size-4" />
                Düzenle
              </button>
              <button type="button" className="wms-ops-action-btn wms-ops-delete-btn" onClick={() => setDeleteDefinition(row)}>
                <Trash2 className="size-4" />
                Sil
              </button>
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
          previousLabel={t('previous')}
          nextLabel={t('next')}
          paginationInfoText={paginationInfoText}
          search={{
            value: pagedGrid.searchInput,
            onValueChange: pagedGrid.searchConfig.onValueChange,
            onSearchChange: pagedGrid.searchConfig.onSearchChange,
            placeholder: 'Kod veya açıklama ara',
          }}
          refresh={{ onRefresh: () => { void query.refetch(); }, isLoading: query.isFetching, label: t('refresh') }}
          exportFileName={config.pageKey}
          exportColumns={columns.filter((column) => column.key !== 'actions').map((column) => ({ key: column.key, label: column.label }))}
          exportRows={(query.data?.data ?? []).map((row) => ({
            code: row.code,
            name: row.name,
            description: row.description,
            sortOrder: row.sortOrder,
            isActive: row.isActive ? 'Aktif' : 'Pasif',
            isDefault: row.isDefault ? 'Evet' : 'Hayır',
            updatedDate: formatDate(row.updatedDate ?? row.createdDate),
          }))}
        />
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[88vh] overflow-hidden p-0 sm:max-w-2xl">
          <DialogHeader className="border-b bg-slate-50/90 px-6 py-5 dark:border-white/10 dark:bg-white/[0.05]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <DialogTitle className="text-xl font-black">{editingDefinition ? `${config.singular} Düzenle` : `Yeni ${config.singular}`}</DialogTitle>
                <p className="mt-1 text-sm font-semibold text-muted-foreground">Bu değerler satınalma teklif ve sipariş formundaki seçim pencerelerinde kullanılır.</p>
              </div>
              <button type="button" className="inline-flex size-10 items-center justify-center rounded-xl border bg-background text-muted-foreground shadow-sm transition hover:text-foreground" onClick={() => setDialogOpen(false)} aria-label="Kapat">
                <X className="size-5" />
              </button>
            </div>
          </DialogHeader>
          <div className="grid max-h-[calc(88vh-11rem)] gap-4 overflow-y-auto px-6 py-5">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-semibold">
                Kod <span className="text-rose-500">*</span>
                <OpsInput value={draft.code} onChange={(event) => setDraft((prev) => ({ ...prev, code: event.target.value }))} placeholder="Örn: CASH" />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                Sıra
                <OpsInput type="number" value={String(draft.sortOrder)} onChange={(event) => setDraft((prev) => ({ ...prev, sortOrder: Number(event.target.value) || 0 }))} />
              </label>
            </div>
            <label className="grid gap-2 text-sm font-semibold">
              Açıklama <span className="text-rose-500">*</span>
              <OpsInput value={draft.name} onChange={(event) => setDraft((prev) => ({ ...prev, name: event.target.value }))} placeholder="Örn: Peşin" />
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Detay
              <OpsTextarea rows={3} value={draft.description ?? ''} onChange={(event) => setDraft((prev) => ({ ...prev, description: event.target.value }))} />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex items-center justify-between gap-3 rounded-2xl border bg-white/80 px-4 py-3 text-sm font-black dark:border-white/10 dark:bg-white/[0.04]">
                Aktif
                <input type="checkbox" checked={draft.isActive} onChange={(event) => setDraft((prev) => ({ ...prev, isActive: event.target.checked }))} className="size-5 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500" />
              </label>
              <label className="flex items-center justify-between gap-3 rounded-2xl border bg-white/80 px-4 py-3 text-sm font-black dark:border-white/10 dark:bg-white/[0.04]">
                Varsayılan
                <input type="checkbox" checked={draft.isDefault} onChange={(event) => setDraft((prev) => ({ ...prev, isDefault: event.target.checked }))} className="size-5 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500" />
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t px-6 py-4 dark:border-white/10">
            <OpsActionButton type="button" variant="secondary" onClick={() => setDialogOpen(false)} disabled={saveMutation.isPending}>
              İptal
            </OpsActionButton>
            <OpsActionButton type="button" variant="primary" onClick={handleSave} disabled={saveMutation.isPending}>
              <Save className="size-4" />
              Kaydet
            </OpsActionButton>
          </div>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={Boolean(deleteDefinition)}
        itemLabel={deleteDefinition ? `${deleteDefinition.code} - ${deleteDefinition.name}` : null}
        isPending={deleteMutation.isPending}
        onOpenChange={(open) => {
          if (!open) setDeleteDefinition(null);
        }}
        onConfirm={() => {
          if (deleteDefinition) deleteMutation.mutate(deleteDefinition.id);
        }}
      />
    </OpsListPageShell>
  );
}
