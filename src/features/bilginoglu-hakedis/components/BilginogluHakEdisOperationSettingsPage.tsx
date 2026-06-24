import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { Edit3, Loader2, Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { OpsActionButton, OpsInput, OpsListPageShell, OpsServiceEyebrow, OpsToggleField, PagedDataGrid, type PagedDataGridColumn, PagedLookupDialog } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Dialog, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  HAK_EDIS_SETTINGS_COLUMN_WIDTHS,
  HakEdisDetailPanel,
  HakEdisOpsDialogContent,
  HakEdisOpsTypePicker,
  HakEdisWarehouseChainFacts,
  hakEdisOperationTypeBadge,
} from './bilginoglu-hakedis-ops-ui';
import { useCrudPermission } from '@/features/access-control/hooks/useCrudPermission';
import { lookupApi } from '@/features/shared/api/lookup-api';
import type { WarehouseLookup } from '@/features/shared/api/lookup-types';
import { usePagedDataGrid } from '@/hooks/usePagedDataGrid';
import { useUIStore } from '@/stores/ui-store';
import type { BilginogluHakEdisOperationSetting, BilginogluHakEdisOperationType } from '../types/bilginoglu-hakedis.types';
import {
  useBilginogluHakEdisOperationSettingDeleteMutation,
  useBilginogluHakEdisOperationSettingMutation,
  useBilginogluHakEdisOperationSettingsQuery,
} from '../hooks/useBilginogluHakEdisQueries';

interface WarehouseSelection {
  id?: number;
  code?: number;
  label: string;
}

interface FormState {
  id?: number;
  operationCode: string;
  operationDescription: string;
  operationType: BilginogluHakEdisOperationType;
  mainWarehouse: WarehouseSelection;
  intermediateWarehouse: WarehouseSelection;
  finalWarehouse: WarehouseSelection;
  isActive: boolean;
}

const emptyWarehouse: WarehouseSelection = { label: '' };
const emptyForm: FormState = {
  operationCode: '',
  operationDescription: '',
  operationType: 'DAT',
  mainWarehouse: emptyWarehouse,
  intermediateWarehouse: emptyWarehouse,
  finalWarehouse: emptyWarehouse,
  isActive: true,
};

const operationTypes: BilginogluHakEdisOperationType[] = ['DAT', 'SEVK', 'AMBAR_CIKIS'];
type OperationColumnKey = 'branch' | 'operation' | 'type' | 'warehouseChain' | 'status';

function requiresWarehouseChain(type: BilginogluHakEdisOperationType): boolean {
  return type === 'DAT' || type === 'SEVK';
}

export function BilginogluHakEdisOperationSettingsPage(): ReactElement {
  const { t } = useTranslation(['bilginoglu-hakedis', 'common']);
  const { setPageTitle } = useUIStore();
  const permission = useCrudPermission('wms.service-allocation');
  const pageKey = 'bilginoglu-hakedis-operation-settings';
  const [form, setForm] = useState<FormState>(emptyForm);
  const [dialogOpen, setDialogOpen] = useState(false);
  const pagedGrid = usePagedDataGrid<OperationColumnKey>({
    pageKey,
    defaultSortBy: 'operation',
    defaultSortDirection: 'asc',
    defaultPageSize: 10,
    defaultPageNumber: 1,
    pageNumberBase: 1,
  });
  const settingsQuery = useBilginogluHakEdisOperationSettingsQuery();
  const saveMutation = useBilginogluHakEdisOperationSettingMutation();
  const deleteMutation = useBilginogluHakEdisOperationSettingDeleteMutation();

  useEffect(() => {
    setPageTitle(t('operationSettings.title'));
  }, [setPageTitle, t]);

  const settings = settingsQuery.data ?? [];
  const showWarehouseChain = requiresWarehouseChain(form.operationType);
  const canSave = permission.canCreate || permission.canUpdate;
  const isWarehouseChainValid = !showWarehouseChain || (form.mainWarehouse.id && form.intermediateWarehouse.id && form.finalWarehouse.id);
  const columns = useMemo<PagedDataGridColumn<OperationColumnKey>[]>(() => [
    { key: 'branch', label: t('operationSettings.table.branch') },
    { key: 'operation', label: t('operationSettings.table.operation') },
    { key: 'type', label: t('operationSettings.table.type') },
    { key: 'warehouseChain', label: t('operationSettings.table.warehouseChain'), sortable: false },
    { key: 'status', label: t('operationSettings.table.status'), sortable: false },
  ], [t]);
  const filteredSettings = useMemo(() => settings.filter((item) => {
    const search = pagedGrid.searchTerm.trim().toLocaleLowerCase('tr-TR');
    if (!search) return true;

    return [
      item.branchCode,
      item.operationCode,
      item.operationDescription,
      item.operationType,
      item.mainWarehouseCode,
      item.mainWarehouseName,
      item.intermediateWarehouseCode,
      item.intermediateWarehouseName,
      item.finalWarehouseCode,
      item.finalWarehouseName,
    ].some((value) => String(value ?? '').toLocaleLowerCase('tr-TR').includes(search));
  }), [pagedGrid.searchTerm, settings]);
  const sortedSettings = useMemo(() => [...filteredSettings].sort((a, b) => {
    const direction = pagedGrid.sortDirection === 'asc' ? 1 : -1;
    const read = (item: BilginogluHakEdisOperationSetting): string => {
      switch (pagedGrid.sortBy) {
        case 'branch':
          return item.branchCode ?? '';
        case 'type':
          return item.operationType ?? '';
        case 'operation':
        default:
          return `${item.operationCode ?? ''} ${item.operationDescription ?? ''}`;
      }
    };

    return read(a).localeCompare(read(b), 'tr') * direction;
  }), [filteredSettings, pagedGrid.sortBy, pagedGrid.sortDirection]);
  const totalPages = Math.max(1, Math.ceil(sortedSettings.length / pagedGrid.pageSize));
  const safePageNumber = Math.min(pagedGrid.pageNumber, totalPages);
  const pageRows = sortedSettings.slice((safePageNumber - 1) * pagedGrid.pageSize, safePageNumber * pagedGrid.pageSize);
  const rangeFrom = sortedSettings.length === 0 ? 0 : (safePageNumber - 1) * pagedGrid.pageSize + 1;
  const rangeTo = Math.min(safePageNumber * pagedGrid.pageSize, sortedSettings.length);

  const resetForm = () => setForm(emptyForm);
  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const edit = (item: BilginogluHakEdisOperationSetting) => {
    setForm({
      id: item.id,
      operationCode: item.operationCode,
      operationDescription: item.operationDescription,
      operationType: item.operationType,
      mainWarehouse: toWarehouseSelection(item.mainWarehouseId, item.mainWarehouseCode, item.mainWarehouseName),
      intermediateWarehouse: toWarehouseSelection(item.intermediateWarehouseId, item.intermediateWarehouseCode, item.intermediateWarehouseName),
      finalWarehouse: toWarehouseSelection(item.finalWarehouseId, item.finalWarehouseCode, item.finalWarehouseName),
      isActive: item.isActive,
    });
    setDialogOpen(true);
  };

  const submit = () => {
    if (!isWarehouseChainValid) return;
    saveMutation.mutate({
      id: form.id,
      input: {
        operationCode: form.operationCode.trim(),
        operationDescription: form.operationDescription.trim(),
        operationType: form.operationType,
        mainWarehouseId: showWarehouseChain ? form.mainWarehouse.id : null,
        intermediateWarehouseId: showWarehouseChain ? form.intermediateWarehouse.id : null,
        finalWarehouseId: showWarehouseChain ? form.finalWarehouse.id : null,
        isActive: form.isActive,
      },
    }, {
      onSuccess: () => {
        resetForm();
        setDialogOpen(false);
      },
    });
  };

  return (
    <OpsListPageShell
      eyebrow={<OpsServiceEyebrow module={t('breadcrumb.module')} />}
      title={t('operationSettings.title')}
      description={t('operationSettings.hero.description')}
      actions={
        <OpsActionButton type="button" variant="primary" onClick={openCreateDialog} disabled={!permission.canCreate}>
          <Plus className="size-4" />
          {t('operationSettings.actions.new')}
        </OpsActionButton>
      }
    >
      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open);
        if (!open) resetForm();
      }}>
        <HakEdisOpsDialogContent className="max-w-2xl">
          <div className="border-b px-4 py-4 sm:px-6">
            <DialogHeader className="space-y-1 text-left">
              <DialogTitle>{form.id ? t('operationSettings.form.editTitle') : t('operationSettings.form.createTitle')}</DialogTitle>
              <DialogDescription>{t('operationSettings.hero.description')}</DialogDescription>
            </DialogHeader>
          </div>
          <div className="space-y-4 p-4 sm:p-6 wms-ops-form wms-ops-bilginoglu-detail">
            <div className="space-y-2">
              <Label className="wms-ops-prelabel-form-label">
                {t('operationSettings.form.operationType')}
                <RequiredMark />
              </Label>
              <HakEdisOpsTypePicker
                value={form.operationType}
                options={operationTypes}
                onChange={(value) => setForm((prev) => ({
                  ...prev,
                  operationType: value,
                  mainWarehouse: requiresWarehouseChain(value) ? prev.mainWarehouse : emptyWarehouse,
                  intermediateWarehouse: requiresWarehouseChain(value) ? prev.intermediateWarehouse : emptyWarehouse,
                  finalWarehouse: requiresWarehouseChain(value) ? prev.finalWarehouse : emptyWarehouse,
                }))}
                getLabel={(type) => t(`operationSettings.operationTypes.${type}`)}
              />
            </div>

            <div className="space-y-2">
              <Label className="wms-ops-prelabel-form-label">
                {t('operationSettings.form.operationCode')}
                <RequiredMark />
              </Label>
              <OpsInput value={form.operationCode} onChange={(event) => setForm((prev) => ({ ...prev, operationCode: event.target.value }))} />
            </div>

            <div className="space-y-2">
              <Label className="wms-ops-prelabel-form-label">
                {t('operationSettings.form.operationDescription')}
                <RequiredMark />
              </Label>
              <OpsInput value={form.operationDescription} onChange={(event) => setForm((prev) => ({ ...prev, operationDescription: event.target.value }))} />
            </div>

            {showWarehouseChain ? (
              <HakEdisDetailPanel title={t('operationSettings.form.warehouseChainTitle')} className="wms-ops-bilginoglu-warehouse-chain-form">
                <WarehousePicker
                  title={t('operationSettings.form.mainWarehouse')}
                  value={form.mainWarehouse}
                  onSelect={(warehouse) => setForm((prev) => ({ ...prev, mainWarehouse: warehouse }))}
                  queryKeySuffix="main"
                />
                <WarehousePicker
                  title={t('operationSettings.form.intermediateWarehouse')}
                  value={form.intermediateWarehouse}
                  onSelect={(warehouse) => setForm((prev) => ({ ...prev, intermediateWarehouse: warehouse }))}
                  queryKeySuffix="intermediate"
                />
                <WarehousePicker
                  title={t('operationSettings.form.finalWarehouse')}
                  value={form.finalWarehouse}
                  onSelect={(warehouse) => setForm((prev) => ({ ...prev, finalWarehouse: warehouse }))}
                  queryKeySuffix="final"
                />
              </HakEdisDetailPanel>
            ) : null}
          </div>
          <DialogFooter className="flex-col gap-3 px-4 pb-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:pb-6">
            <OpsToggleField
              checked={form.isActive}
              onCheckedChange={(checked) => setForm((prev) => ({ ...prev, isActive: checked }))}
              title={t('operationSettings.form.isActive')}
              className="w-full sm:max-w-xs"
            />
            <div className="flex w-full flex-wrap justify-end gap-2 sm:ml-auto sm:w-auto">
            <OpsActionButton type="button" variant="secondary" onClick={() => setDialogOpen(false)}>
              {t('common.cancel')}
            </OpsActionButton>
            <OpsActionButton
              type="button"
              variant="primary"
              disabled={!canSave || !form.operationCode.trim() || !form.operationDescription.trim() || !isWarehouseChainValid || saveMutation.isPending}
              onClick={submit}
            >
              {saveMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              {t('operationSettings.actions.save')}
            </OpsActionButton>
            </div>
          </DialogFooter>
        </HakEdisOpsDialogContent>
      </Dialog>

      <PagedDataGrid<BilginogluHakEdisOperationSetting, OperationColumnKey>
            variant="ops"
            pageKey={pageKey}
            columns={columns}
            rows={pageRows}
            rowKey={(row) => row.id}
            defaultColumnWidths={HAK_EDIS_SETTINGS_COLUMN_WIDTHS}
            iconOnlyActions
            renderCell={(row, columnKey) => {
              switch (columnKey) {
                case 'branch':
                  return <span className="font-semibold">{row.branchCode}</span>;
                case 'operation':
                  return (
                    <div>
                      <div className="font-semibold">{row.operationCode}</div>
                      <div className="text-xs text-muted-foreground">{row.operationDescription}</div>
                    </div>
                  );
                case 'type':
                  return hakEdisOperationTypeBadge(t(`operationSettings.operationTypes.${row.operationType}`));
                case 'warehouseChain':
                  return requiresWarehouseChain(row.operationType) ? (
                    <HakEdisWarehouseChainFacts
                      items={[
                        { label: t('operationSettings.form.mainWarehouse'), code: row.mainWarehouseCode, name: row.mainWarehouseName },
                        { label: t('operationSettings.form.intermediateWarehouse'), code: row.intermediateWarehouseCode, name: row.intermediateWarehouseName },
                        { label: t('operationSettings.form.finalWarehouse'), code: row.finalWarehouseCode, name: row.finalWarehouseName },
                      ]}
                    />
                  ) : '-';
                case 'status': {
                  const statusLabel = row.isActive ? t('operationSettings.badges.active') : t('operationSettings.badges.passive');
                  return (
                    <span
                      className={cn(
                        'wms-ops-status-badge inline-flex max-w-full truncate',
                        row.isActive ? 'wms-ops-status-badge--active' : 'wms-ops-status-badge--pending',
                      )}
                      title={statusLabel}
                    >
                      {statusLabel}
                    </span>
                  );
                }
                default:
                  return null;
              }
            }}
            sortBy={pagedGrid.sortBy}
            sortDirection={pagedGrid.sortDirection}
            onSort={pagedGrid.handleSort}
            isLoading={settingsQuery.isLoading}
            isError={settingsQuery.isError}
            errorText={t('operationSettings.messages.saveFailed')}
            emptyText={t('operationSettings.table.empty')}
            pageSize={pagedGrid.pageSize}
            pageSizeOptions={pagedGrid.pageSizeOptions}
            onPageSizeChange={pagedGrid.handlePageSizeChange}
            pageNumber={safePageNumber}
            totalPages={totalPages}
            hasPreviousPage={safePageNumber > 1}
            hasNextPage={safePageNumber < totalPages}
            onPreviousPage={pagedGrid.goToPreviousPage}
            onNextPage={pagedGrid.goToNextPage}
            previousLabel={t('common.previous')}
            nextLabel={t('common.next')}
            paginationInfoText={t('common.paginationInfo', { current: rangeFrom, total: rangeTo, totalCount: sortedSettings.length })}
            showActionsColumn
            actionsHeaderLabel={t('operationSettings.table.actions')}
            actionsCellClassName="wms-ops-table-actions-col"
            renderActionsCell={(row) => (
              <div className="wms-ops-row-actions">
                <Button type="button" variant="ghost" size="icon" className="wms-ops-grid-icon-btn" onClick={() => edit(row)} disabled={!permission.canUpdate} aria-label={t('common.edit')}>
                  <Edit3 className="size-3" />
                </Button>
                <Button type="button" variant="ghost" size="icon" className="wms-ops-grid-icon-btn wms-ops-grid-icon-btn--danger" onClick={() => deleteMutation.mutate(row.id)} disabled={!permission.canDelete || deleteMutation.isPending} aria-label={t('common.delete')}>
                  <Trash2 className="size-3" />
                </Button>
              </div>
            )}
            search={{
              ...pagedGrid.searchConfig,
              placeholder: t('table.search'),
            }}
            refresh={{
              onRefresh: () => settingsQuery.refetch(),
              isLoading: settingsQuery.isFetching,
              label: t('common.refresh'),
            }}
            exportFileName="bilginoglu-hakedis-operation-settings"
            exportColumns={columns.map((column) => ({ key: column.key, label: column.label }))}
            exportRows={sortedSettings.map((row) => ({
              branch: row.branchCode,
              operation: `${row.operationCode} - ${row.operationDescription}`,
              type: t(`operationSettings.operationTypes.${row.operationType}`),
              warehouseChain: requiresWarehouseChain(row.operationType)
                ? `${row.mainWarehouseCode ?? '-'}>${row.intermediateWarehouseCode ?? '-'}>${row.finalWarehouseCode ?? '-'}`
                : '-',
              status: row.isActive ? t('operationSettings.badges.active') : t('operationSettings.badges.passive'),
            }))}
          />
    </OpsListPageShell>
  );
}

function WarehousePicker({
  title,
  value,
  onSelect,
  queryKeySuffix,
}: {
  title: string;
  value: WarehouseSelection;
  onSelect: (warehouse: WarehouseSelection) => void;
  queryKeySuffix: string;
}): ReactElement {
  const { t } = useTranslation(['bilginoglu-hakedis', 'common']);
  const [open, setOpen] = useState(false);

  return (
    <div className="wms-ops-bilginoglu-warehouse-picker">
      <span className="wms-ops-code-badge wms-ops-bilginoglu-warehouse-picker__label">{title}</span>
      <PagedLookupDialog<WarehouseLookup>
        open={open}
        onOpenChange={setOpen}
        variant="ops"
        title={title}
        description={t('operationSettings.form.warehouseSelectDescription')}
        value={value.label}
        placeholder={t('operationSettings.form.selectWarehouse')}
        searchPlaceholder={t('table.search')}
        queryKey={['bilginoglu-hakedis', 'operation-setting', queryKeySuffix, 'warehouse']}
        fetchPage={({ pageNumber, pageSize, search, signal }) => lookupApi.getWarehousesPaged({ pageNumber, pageSize, search }, undefined, { signal })}
        getKey={(item) => String(item.id)}
        getLabel={(item) => `${item.depoKodu} · ${item.depoIsmi}`}
        onSelect={(item) => {
          onSelect({ id: item.id, code: item.depoKodu, label: `${item.depoKodu} · ${item.depoIsmi}` });
          setOpen(false);
        }}
      />
    </div>
  );
}

function RequiredMark(): ReactElement {
  return <span className="ml-1 text-destructive" aria-hidden="true">*</span>;
}

function toWarehouseSelection(id?: number | null, code?: number | null, name?: string | null): WarehouseSelection {
  return id ? { id, code: code ?? undefined, label: `${code ?? '-'} · ${name ?? '-'}` } : emptyWarehouse;
}
