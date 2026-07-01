import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { OpsActionButton, OpsCircuitToggleInline, OpsInput, OpsListPageShell, OpsTextarea, PagedDataGrid, type PagedDataGridColumn, DeleteConfirmDialog } from '@/components/shared';
import { MasterDataOpsDialogContent, MasterDataOpsFormField, masterDataOpsGridColumn } from '@/features/shared';
import { usePagedDataGrid } from '@/hooks/usePagedDataGrid';
import { getPagedRange } from '@/lib/paged';
import { useUIStore } from '@/stores/ui-store';
import { incomingInvoiceArchiveApi } from '../api/incoming-invoice-archive.api';
import type { ELogoConnection, ELogoConnectionUpsert } from '../types/incoming-invoice-archive.types';

type ColumnKey = 'displayName' | 'key' | 'vkn' | 'username' | 'source' | 'isConfigured' | 'isDefault' | 'isActive';

const emptyForm: ELogoConnectionUpsert = {
  key: '',
  displayName: '',
  vkn: '',
  username: '',
  password: '',
  source: '',
  endpointUrl: '',
  applicationName: '',
  version: '',
  timeoutSeconds: null,
  isActive: true,
  isDefault: false,
  description: '',
};

function mapSortBy(column: ColumnKey): string {
  switch (column) {
    case 'displayName':
      return 'DisplayName';
    case 'key':
      return 'Key';
    case 'vkn':
      return 'Vkn';
    case 'username':
      return 'Username';
    case 'source':
      return 'Source';
    case 'isConfigured':
      return 'PasswordCipherText';
    case 'isDefault':
      return 'IsDefault';
    case 'isActive':
      return 'IsActive';
    default:
      return 'Id';
  }
}

export function IncomingInvoiceConnectionsPage(): ReactElement {
  const { t } = useTranslation(['incoming-invoice-archive', 'common']);
  const { setPageTitle } = useUIStore();
  const pageKey = 'incoming-invoice-archive-connections';
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ELogoConnection | null>(null);
  const [connectionToDelete, setConnectionToDelete] = useState<ELogoConnection | null>(null);
  const [formState, setFormState] = useState<ELogoConnectionUpsert>(emptyForm);

  const pagedGrid = usePagedDataGrid<ColumnKey>({
    pageKey,
    defaultSortBy: 'displayName',
    defaultSortDirection: 'asc',
    defaultPageNumber: 1,
    defaultPageSize: 20,
    pageNumberBase: 1,
    mapSortBy,
  });

  useEffect(() => {
    setPageTitle(t('connections.title'));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

  const query = useQuery({
    queryKey: ['incoming-invoice-archive', 'connections', pagedGrid.queryParams],
    queryFn: () => incomingInvoiceArchiveApi.getConnectionsPaged(pagedGrid.queryParams),
  });

  const saveMutation = useMutation({
    mutationFn: (input: ELogoConnectionUpsert) => (
      editing?.id
        ? incomingInvoiceArchiveApi.updateConnection(editing.id, input)
        : incomingInvoiceArchiveApi.createConnection(input)
    ),
    onSuccess: async () => {
      toast.success(t(editing ? 'connections.messages.updated' : 'connections.messages.created'));
      setDialogOpen(false);
      resetForm();
      await query.refetch();
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('common:generalError')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => incomingInvoiceArchiveApi.deleteConnection(id),
    onSuccess: async () => {
      toast.success(t('connections.messages.deleted'));
      setConnectionToDelete(null);
      await query.refetch();
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('common:generalError')),
  });

  const columns = useMemo<PagedDataGridColumn<ColumnKey>[]>(() => [
    masterDataOpsGridColumn('displayName', t('connections.table.displayName')),
    masterDataOpsGridColumn('key', t('connections.table.key')),
    masterDataOpsGridColumn('vkn', t('connections.table.vkn')),
    masterDataOpsGridColumn('username', t('connections.table.username')),
    masterDataOpsGridColumn('source', t('connections.table.source')),
    masterDataOpsGridColumn('isConfigured', t('connections.table.configured')),
    masterDataOpsGridColumn('isDefault', t('connections.table.default')),
    masterDataOpsGridColumn('isActive', t('connections.table.active')),
  ], [t]);

  const visibleColumnKeys = useMemo<ColumnKey[]>(() => columns.map((column) => column.key), [columns]);
  const range = getPagedRange(query.data, 1);
  const paginationInfoText = t('common:paginationInfo', {
    current: range.from,
    total: range.to,
    totalCount: range.total,
    defaultValue: `${range.from}-${range.to} / ${range.total}`,
  });

  function resetForm(): void {
    setEditing(null);
    setFormState(emptyForm);
  }

  function startCreate(): void {
    resetForm();
    setDialogOpen(true);
  }

  function startEdit(row: ELogoConnection): void {
    setEditing(row);
    setFormState({
      key: row.key,
      displayName: row.displayName,
      vkn: row.vkn,
      username: row.username,
      password: '',
      source: row.source,
      endpointUrl: row.endpointUrl ?? '',
      applicationName: row.applicationName ?? '',
      version: row.version ?? '',
      timeoutSeconds: row.timeoutSeconds ?? null,
      isActive: row.isActive,
      isDefault: row.isDefault,
      description: row.description ?? '',
    });
    setDialogOpen(true);
  }

  function handleSave(): void {
    if (!formState.displayName.trim() || !formState.vkn.trim() || !formState.username.trim() || !formState.source.trim()) {
      toast.error(t('connections.messages.required'));
      return;
    }

    if (!editing && !formState.key?.trim()) {
      toast.error(t('connections.messages.keyRequired'));
      return;
    }

    saveMutation.mutate({
      ...formState,
      key: editing ? undefined : formState.key?.trim(),
      displayName: formState.displayName.trim(),
      vkn: formState.vkn.trim(),
      username: formState.username.trim(),
      password: formState.password?.trim() || null,
      source: formState.source.trim(),
      endpointUrl: formState.endpointUrl?.trim() || null,
      applicationName: formState.applicationName?.trim() || null,
      version: formState.version?.trim() || null,
      timeoutSeconds: formState.timeoutSeconds || null,
      description: formState.description?.trim() || null,
    });
  }

  const renderSortIcon = (columnKey: ColumnKey): ReactElement | null =>
    columnKey === pagedGrid.sortBy
      ? pagedGrid.sortDirection === 'asc'
        ? <ArrowUp className="ml-1 h-3.5 w-3.5" />
        : <ArrowDown className="ml-1 h-3.5 w-3.5" />
      : null;

  return (
    <OpsListPageShell
      className="wms-ops-erp-skin"
      eyebrow={t('eyebrow')}
      title={t('connections.title')}
      description={t('connections.description')}
      actions={
        <OpsActionButton type="button" variant="primary" onClick={startCreate}>
          <Plus className="size-3.5" aria-hidden />
          {t('connections.actions.create')}
        </OpsActionButton>
      }
    >
      <PagedDataGrid<ELogoConnection, ColumnKey>
        variant="ops"
        pageKey={pageKey}
        columns={columns}
        visibleColumnKeys={visibleColumnKeys}
        rows={query.data?.data ?? []}
        rowKey={(row) => row.id}
        renderCell={(row, columnKey) => {
          switch (columnKey) {
            case 'displayName':
              return <span className="font-semibold">{row.displayName}</span>;
            case 'key':
              return <span className="font-mono text-xs">{row.key}</span>;
            case 'vkn':
              return row.vkn;
            case 'username':
              return row.username;
            case 'source':
              return <span className="font-mono text-xs">{row.source}</span>;
            case 'isConfigured':
              return row.isConfigured ? t('status.ready') : t('status.notConfigured');
            case 'isDefault':
            case 'isActive':
              return row[columnKey] ? t('common:yes') : t('common:no');
            default:
              return null;
          }
        }}
        sortBy={pagedGrid.sortBy}
        sortDirection={pagedGrid.sortDirection}
        onSort={(columnKey) => {
          pagedGrid.handleSort(columnKey);
        }}
        renderSortIcon={renderSortIcon}
        isLoading={query.isLoading || query.isFetching}
        isError={Boolean(query.error)}
        errorText={query.error instanceof Error ? query.error.message : t('common:generalError')}
        emptyText={t('connections.empty')}
        showActionsColumn
        actionsHeaderLabel={t('common:actions')}
        iconOnlyActions
        actionsCellClassName="wms-ops-table-actions-col"
        renderActionsCell={(row) => (
          <div className="wms-ops-row-actions">
            <Button type="button" variant="ghost" size="icon" className="wms-ops-grid-icon-btn" onClick={() => startEdit(row)} aria-label={t('common:update')}>
              <Pencil className="size-3" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="wms-ops-grid-icon-btn wms-ops-grid-icon-btn--danger"
              onClick={() => setConnectionToDelete(row)}
              aria-label={t('common:delete')}
            >
              <Trash2 className="size-3" />
            </Button>
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
        previousLabel={t('common:previous')}
        nextLabel={t('common:next')}
        paginationInfoText={paginationInfoText}
      />

      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
        <MasterDataOpsDialogContent size="xl">
          <DialogHeader className="wms-ops-detail-dialog__header border-b px-5 py-4">
            <DialogTitle className="wms-ops-pt-terminal__title">
              {editing ? t('connections.dialog.editTitle') : t('connections.dialog.createTitle')}
            </DialogTitle>
          </DialogHeader>

          <div className="wms-ops-form max-h-[min(68dvh,720px)] overflow-y-auto px-5 py-4">
            <div className="grid gap-4 md:grid-cols-2">
              <MasterDataOpsFormField label={`${t('connections.form.key')} *`}>
                <OpsInput
                  value={formState.key ?? ''}
                  disabled={Boolean(editing)}
                  onChange={(event) => setFormState((prev) => ({ ...prev, key: event.target.value }))}
                />
              </MasterDataOpsFormField>
              <MasterDataOpsFormField label={`${t('connections.form.displayName')} *`}>
                <OpsInput value={formState.displayName} onChange={(event) => setFormState((prev) => ({ ...prev, displayName: event.target.value }))} />
              </MasterDataOpsFormField>
              <MasterDataOpsFormField label={`${t('connections.form.vkn')} *`}>
                <OpsInput value={formState.vkn} onChange={(event) => setFormState((prev) => ({ ...prev, vkn: event.target.value }))} />
              </MasterDataOpsFormField>
              <MasterDataOpsFormField label={`${t('connections.form.username')} *`}>
                <OpsInput value={formState.username} onChange={(event) => setFormState((prev) => ({ ...prev, username: event.target.value }))} />
              </MasterDataOpsFormField>
              <MasterDataOpsFormField label={t('connections.form.password')}>
                <OpsInput
                  type="password"
                  value={formState.password ?? ''}
                  placeholder={editing ? t('connections.form.passwordKeep') : undefined}
                  onChange={(event) => setFormState((prev) => ({ ...prev, password: event.target.value }))}
                />
              </MasterDataOpsFormField>
              <MasterDataOpsFormField label={`${t('connections.form.source')} *`}>
                <OpsInput value={formState.source} onChange={(event) => setFormState((prev) => ({ ...prev, source: event.target.value }))} />
              </MasterDataOpsFormField>
              <MasterDataOpsFormField label={t('connections.form.endpointUrl')}>
                <OpsInput value={formState.endpointUrl ?? ''} onChange={(event) => setFormState((prev) => ({ ...prev, endpointUrl: event.target.value }))} />
              </MasterDataOpsFormField>
              <MasterDataOpsFormField label={t('connections.form.applicationName')}>
                <OpsInput value={formState.applicationName ?? ''} onChange={(event) => setFormState((prev) => ({ ...prev, applicationName: event.target.value }))} />
              </MasterDataOpsFormField>
              <MasterDataOpsFormField label={t('connections.form.version')}>
                <OpsInput value={formState.version ?? ''} onChange={(event) => setFormState((prev) => ({ ...prev, version: event.target.value }))} />
              </MasterDataOpsFormField>
              <MasterDataOpsFormField label={t('connections.form.timeoutSeconds')}>
                <OpsInput
                  type="number"
                  value={formState.timeoutSeconds ?? ''}
                  onChange={(event) => setFormState((prev) => ({ ...prev, timeoutSeconds: event.target.value ? Number(event.target.value) : null }))}
                />
              </MasterDataOpsFormField>
              <MasterDataOpsFormField label={t('connections.form.active')}>
                <OpsCircuitToggleInline
                  checked={formState.isActive}
                  onCheckedChange={(checked) => setFormState((prev) => ({ ...prev, isActive: checked }))}
                  aria-label={t('connections.form.active')}
                />
              </MasterDataOpsFormField>
              <MasterDataOpsFormField label={t('connections.form.default')}>
                <OpsCircuitToggleInline
                  checked={formState.isDefault}
                  onCheckedChange={(checked) => setFormState((prev) => ({ ...prev, isDefault: checked }))}
                  aria-label={t('connections.form.default')}
                />
              </MasterDataOpsFormField>
              <MasterDataOpsFormField label={t('connections.form.description')} className="md:col-span-2">
                <OpsTextarea value={formState.description ?? ''} onChange={(event) => setFormState((prev) => ({ ...prev, description: event.target.value }))} />
              </MasterDataOpsFormField>
            </div>
          </div>

          <DialogFooter className="border-t px-5 py-4">
            <OpsActionButton type="button" variant="secondary" onClick={() => setDialogOpen(false)}>
              {t('common:cancel')}
            </OpsActionButton>
            <OpsActionButton type="button" onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? t('common:saving') : t('common:save')}
            </OpsActionButton>
          </DialogFooter>
        </MasterDataOpsDialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={connectionToDelete != null}
        itemLabel={connectionToDelete?.displayName || connectionToDelete?.key}
        isPending={deleteMutation.isPending}
        onOpenChange={(open) => {
          if (!open) setConnectionToDelete(null);
        }}
        onConfirm={() => {
          if (connectionToDelete) deleteMutation.mutate(connectionToDelete.id);
        }}
      />
    </OpsListPageShell>
  );
}
