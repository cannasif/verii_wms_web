import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowDown, ArrowUp, Pencil, Plus, Save, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  Dialog,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DeleteConfirmDialog,
  OpsActionButton,
  OpsCircuitToggleField,
  OpsInput,
  OpsListPageShell,
  OpsTextarea,
  PagedDataGrid,
  type PagedDataGridColumn,
} from '@/components/shared';
import {
  MasterDataOpsDialogContent,
  MasterDataOpsFormField,
  MasterDataOpsFlagChip,
  MasterDataOpsGuidance,
} from '@/features/shared';
import { PURCHASE_OPS_SHELL_CLASS, PurchaseOpsDialogFooter, PurchaseOpsListIconButton } from './purchase-ops-ui';
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
      className={PURCHASE_OPS_SHELL_CLASS}
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
      <PagedDataGrid<PurchaseDefinitionDto, DefinitionColumnKey>
        variant="ops"
        pageKey={config.pageKey}
        columns={columns}
        rows={query.data?.data ?? []}
        rowKey={(row) => row.id}
        renderCell={(row, columnKey) => {
          switch (columnKey) {
            case 'code': return <span className="font-mono text-xs font-bold text-[var(--wms-ops-accent)]">{row.code}</span>;
            case 'name': return <span className="font-semibold">{row.name}</span>;
            case 'description': return row.description || '-';
            case 'sortOrder': return row.sortOrder;
            case 'isActive': return (
              <MasterDataOpsFlagChip tone={row.isActive ? 'success' : 'default'}>
                {row.isActive ? 'Aktif' : 'Pasif'}
              </MasterDataOpsFlagChip>
            );
            case 'isDefault': return (
              <MasterDataOpsFlagChip tone={row.isDefault ? 'info' : 'default'}>
                {row.isDefault ? 'Evet' : 'Hayır'}
              </MasterDataOpsFlagChip>
            );
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
        iconOnlyActions
        actionsCellClassName="wms-ops-table-actions-col"
        renderActionsCell={(row) => (
          <div className="wms-ops-row-actions">
            <PurchaseOpsListIconButton label="Düzenle" onClick={() => openEditDialog(row)}>
              <Pencil className="size-3" />
            </PurchaseOpsListIconButton>
            <PurchaseOpsListIconButton label="Sil" tone="danger" onClick={() => setDeleteDefinition(row)}>
              <Trash2 className="size-3" />
            </PurchaseOpsListIconButton>
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <MasterDataOpsDialogContent size="lg" className="max-h-[88vh]">
          <DialogHeader className="wms-ops-detail-dialog__header border-b px-5 py-4">
            <DialogTitle className="wms-ops-detail-dialog__title">
              {editingDefinition ? `${config.singular} Düzenle` : `Yeni ${config.singular}`}
            </DialogTitle>
            <p className="wms-ops-detail-dialog__description mt-1">
              Bu değerler satınalma teklif ve sipariş formundaki seçim pencerelerinde kullanılır.
            </p>
          </DialogHeader>
          <div className="wms-ops-form max-h-[calc(88vh-11rem)] overflow-y-auto px-5 py-4">
            <MasterDataOpsGuidance
              title="Tanım kullanımı"
              lines={['Kod ve açıklama alanları lookup pencerelerinde görünür. Varsayılan işaretli tanım form açılışında öncelikli seçilir.']}
            />
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <MasterDataOpsFormField label="Kod *">
                <OpsInput value={draft.code} onChange={(event) => setDraft((prev) => ({ ...prev, code: event.target.value }))} placeholder="Örn: CASH" />
              </MasterDataOpsFormField>
              <MasterDataOpsFormField label="Sıra">
                <OpsInput type="number" value={String(draft.sortOrder)} onChange={(event) => setDraft((prev) => ({ ...prev, sortOrder: Number(event.target.value) || 0 }))} />
              </MasterDataOpsFormField>
            </div>
            <div className="mt-4 grid gap-4">
              <MasterDataOpsFormField label="Açıklama *">
                <OpsInput value={draft.name} onChange={(event) => setDraft((prev) => ({ ...prev, name: event.target.value }))} placeholder="Örn: Peşin" />
              </MasterDataOpsFormField>
              <MasterDataOpsFormField label="Detay">
                <OpsTextarea rows={3} value={draft.description ?? ''} onChange={(event) => setDraft((prev) => ({ ...prev, description: event.target.value }))} />
              </MasterDataOpsFormField>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <OpsCircuitToggleField
                title="Aktif"
                checked={draft.isActive}
                onCheckedChange={(checked) => setDraft((prev) => ({ ...prev, isActive: checked }))}
              />
              <OpsCircuitToggleField
                title="Varsayılan"
                checked={draft.isDefault}
                onCheckedChange={(checked) => setDraft((prev) => ({ ...prev, isDefault: checked }))}
              />
            </div>
          </div>
          <PurchaseOpsDialogFooter className="justify-end">
            <OpsActionButton type="button" variant="secondary" onClick={() => setDialogOpen(false)} disabled={saveMutation.isPending}>
              İptal
            </OpsActionButton>
            <OpsActionButton type="button" variant="primary" onClick={handleSave} disabled={saveMutation.isPending}>
              <Save className="size-4" />
              Kaydet
            </OpsActionButton>
          </PurchaseOpsDialogFooter>
        </MasterDataOpsDialogContent>
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
