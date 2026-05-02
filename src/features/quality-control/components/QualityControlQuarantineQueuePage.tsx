import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { PagedDataGrid, type PagedDataGridColumn } from '@/components/shared';
import { useColumnPreferences } from '@/hooks/useColumnPreferences';
import { usePagedDataGrid } from '@/hooks/usePagedDataGrid';
import { getPagedRange } from '@/lib/paged';
import { useUIStore } from '@/stores/ui-store';
import { qualityControlApi } from '../api/quality-control.api';
import type { InventoryQualityInspectionDto, InventoryQualityQuarantinePagedRowDto } from '../types/quality-control.types';

type ColumnKey = 'documentType' | 'documentNumber' | 'warehouse' | 'supplier' | 'inspectionDate' | 'lineCount' | 'totalQuantity' | 'serialTrackedLineCount' | 'actions';

function mapSortBy(value: ColumnKey): string {
  switch (value) {
    case 'documentType': return 'DocumentType';
    case 'documentNumber': return 'DocumentNumber';
    case 'warehouse': return 'WarehouseName';
    case 'supplier': return 'SupplierId';
    case 'inspectionDate': return 'InspectionDate';
    case 'lineCount': return 'Id';
    case 'totalQuantity': return 'Id';
    case 'serialTrackedLineCount': return 'Id';
    default: return 'InspectionDate';
  }
}

function formatDateTime(value?: string | null): string {
  if (!value) return '-';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString('tr-TR');
}

function formatNumber(value?: number | null): string {
  if (value == null) return '-';
  return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 }).format(value);
}

function formatDecisionLabel(t: (key: string) => string, decision: string): string {
  const normalized = `${decision.charAt(0).toLowerCase()}${decision.slice(1)}`;
  return t(`qualityControl.inspections.decisions.${normalized}`);
}

export function QualityControlQuarantineQueuePage(): ReactElement {
  const { t } = useTranslation('common');
  const { setPageTitle } = useUIStore();
  const pageKey = 'quality-control-quarantine-queue';
  const [selectedInspectionId, setSelectedInspectionId] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionNote, setActionNote] = useState('');

  const pagedGrid = usePagedDataGrid<ColumnKey>({
    pageKey,
    defaultSortBy: 'inspectionDate',
    defaultSortDirection: 'desc',
    defaultPageNumber: 1,
    defaultPageSize: 20,
    pageNumberBase: 1,
    mapSortBy,
  });

  useEffect(() => {
    setPageTitle(t('qualityControl.quarantine.pageTitle'));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

  const columns = useMemo<PagedDataGridColumn<ColumnKey>[]>(() => [
    { key: 'documentType', label: t('qualityControl.quarantine.columns.documentType') },
    { key: 'documentNumber', label: t('qualityControl.quarantine.columns.documentNumber') },
    { key: 'warehouse', label: t('qualityControl.quarantine.columns.warehouse') },
    { key: 'supplier', label: t('qualityControl.quarantine.columns.supplier') },
    { key: 'inspectionDate', label: t('qualityControl.quarantine.columns.inspectionDate') },
    { key: 'lineCount', label: t('qualityControl.quarantine.columns.lineCount') },
    { key: 'totalQuantity', label: t('qualityControl.quarantine.columns.totalQuantity') },
    { key: 'serialTrackedLineCount', label: t('qualityControl.quarantine.columns.serialTrackedLineCount') },
    { key: 'actions', label: t('common.actions'), sortable: false },
  ], [t]);

  const { userId, columnOrder, visibleColumns, orderedVisibleColumns, setColumnOrder, setVisibleColumns } = useColumnPreferences({
    pageKey,
    columns: columns.map(({ key, label }) => ({ key, label })),
    idColumnKey: 'documentType',
  });

  const query = useQuery({
    queryKey: ['quality-control', 'quarantine', pagedGrid.queryParams],
    queryFn: () => qualityControlApi.getQuarantinePaged(pagedGrid.queryParams),
  });

  const inspectionDetailQuery = useQuery({
    queryKey: ['quality-control', 'inspection-detail', selectedInspectionId],
    queryFn: () => qualityControlApi.getInspectionById(selectedInspectionId as number),
    enabled: dialogOpen && selectedInspectionId != null,
  });

  const actionMutation = useMutation({
    mutationFn: ({ id, action, note }: { id: number; action: string; note?: string }) =>
      qualityControlApi.applyQuarantineDecision(id, { action, note }),
    onSuccess: async (data, variables) => {
      const baseKey =
        variables.action === 'Release'
          ? 'qualityControl.messages.quarantineReleased'
          : variables.action === 'Reject'
            ? 'qualityControl.messages.quarantineRejected'
            : 'qualityControl.messages.quarantineReturned';

      const reference =
        variables.action === 'Release'
          ? data.releaseMovementReference?.trim() ?? ''
          : variables.action === 'Reject'
            ? data.rejectMovementReference?.trim() ?? ''
            : data.returnMovementReference?.trim() ?? '';
      const message = reference
        ? t(`${baseKey}WithReference`, { reference, defaultValue: `${t(baseKey)} ${reference}` })
        : t(baseKey);

      toast.success(message);
      setDialogOpen(false);
      setSelectedInspectionId(null);
      setActionNote('');
      await query.refetch();
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('common.generalError')),
  });

  const visibleColumnKeys = useMemo(() => orderedVisibleColumns.filter((key) => key !== 'actions') as ColumnKey[], [orderedVisibleColumns]);
  const exportColumns = useMemo(() => orderedVisibleColumns.filter((key) => key !== 'actions').map((key) => ({
    key,
    label: columns.find((column) => column.key === key)?.label ?? key,
  })), [columns, orderedVisibleColumns]);
  const exportRows = useMemo<Record<string, unknown>[]>(() => (
    (query.data?.data ?? []).map((row) => ({
      documentType: row.documentType,
      documentNumber: row.documentNumber || '-',
      warehouse: [row.warehouseCode, row.warehouseName].filter(Boolean).join(' - '),
      supplier: [row.supplierCode, row.supplierName].filter(Boolean).join(' - ') || '-',
      inspectionDate: formatDateTime(row.inspectionDate),
      lineCount: row.lineCount,
      totalQuantity: row.totalQuantity,
      serialTrackedLineCount: row.serialTrackedLineCount,
    }))
  ), [query.data?.data]);

  const range = getPagedRange(query.data, 1);
  const paginationInfoText = t('common.paginationInfo', {
    current: range.from,
    total: range.to,
    totalCount: range.total,
    defaultValue: `${range.from}-${range.to} / ${range.total}`,
  });

  const renderSortIcon = (columnKey: ColumnKey): ReactElement | null => {
    if (columnKey !== pagedGrid.sortBy) return null;
    return pagedGrid.sortDirection === 'asc'
      ? <ArrowUp className="ml-1 h-3.5 w-3.5" />
      : <ArrowDown className="ml-1 h-3.5 w-3.5" />;
  };

  const selectedInspection = inspectionDetailQuery.data;

  const openDialog = (inspectionId: number): void => {
    setSelectedInspectionId(inspectionId);
    setActionNote('');
    setDialogOpen(true);
  };

  const handleAction = (action: 'Release' | 'Reject' | 'Return'): void => {
    if (!selectedInspectionId) return;
    actionMutation.mutate({ id: selectedInspectionId, action, note: actionNote || undefined });
  };

  return (
    <div className="crm-page space-y-6">
      <div className="space-y-2">
        <Badge variant="secondary">{t('qualityControl.badge')}</Badge>
        <h1 className="text-2xl font-semibold">{t('qualityControl.quarantine.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('qualityControl.quarantine.description')}</p>
      </div>

      <PagedDataGrid<InventoryQualityQuarantinePagedRowDto, ColumnKey>
        pageKey={pageKey}
        columns={columns}
        visibleColumnKeys={visibleColumnKeys}
        rows={query.data?.data ?? []}
        rowKey={(row) => row.id}
        renderCell={(row, columnKey) => {
          switch (columnKey) {
            case 'documentType':
              return row.documentType;
            case 'documentNumber':
              return row.documentNumber || '-';
            case 'warehouse':
              return [row.warehouseCode, row.warehouseName].filter(Boolean).join(' - ');
            case 'supplier':
              return [row.supplierCode, row.supplierName].filter(Boolean).join(' - ') || '-';
            case 'inspectionDate':
              return formatDateTime(row.inspectionDate);
            case 'lineCount':
              return row.lineCount;
            case 'totalQuantity':
              return formatNumber(row.totalQuantity);
            case 'serialTrackedLineCount':
              return row.serialTrackedLineCount;
            default:
              return null;
          }
        }}
        sortBy={pagedGrid.sortBy}
        sortDirection={pagedGrid.sortDirection}
        onSort={(columnKey) => {
          if (columnKey !== 'actions') pagedGrid.handleSort(columnKey);
        }}
        renderSortIcon={renderSortIcon}
        isLoading={query.isLoading}
        isError={Boolean(query.error)}
        errorText={query.error instanceof Error ? query.error.message : t('common.generalError')}
        emptyText={t('qualityControl.quarantine.empty')}
        showActionsColumn={orderedVisibleColumns.includes('actions')}
        actionsHeaderLabel={t('common.actions')}
        renderActionsCell={(row) => (
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button type="button" size="sm" variant="outline" onClick={() => openDialog(row.id)}>
              {t('qualityControl.quarantine.review')}
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
          exportFileName: 'quality-control-quarantine-queue',
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
            placeholder: t('qualityControl.quarantine.searchPlaceholder'),
          },
          refresh: {
            onRefresh: () => { void query.refetch(); },
            isLoading: query.isLoading,
            label: t('common.refresh'),
          },
        }}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{t('qualityControl.quarantine.dialog.title')}</DialogTitle>
            <DialogDescription>{t('qualityControl.quarantine.dialog.description')}</DialogDescription>
          </DialogHeader>

          {inspectionDetailQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
          ) : inspectionDetailQuery.error ? (
            <p className="text-sm text-destructive">{inspectionDetailQuery.error instanceof Error ? inspectionDetailQuery.error.message : t('common.generalError')}</p>
          ) : selectedInspection ? (
            <QuarantineDialogContent inspection={selectedInspection} note={actionNote} onNoteChange={setActionNote} t={t} />
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              {t('common.close')}
            </Button>
            <Button type="button" variant="outline" onClick={() => handleAction('Return')} disabled={actionMutation.isPending}>
              {t('qualityControl.quarantine.actions.return')}
            </Button>
            <Button type="button" variant="outline" onClick={() => handleAction('Reject')} disabled={actionMutation.isPending}>
              {t('qualityControl.quarantine.actions.reject')}
            </Button>
            <Button type="button" onClick={() => handleAction('Release')} disabled={actionMutation.isPending}>
              {t('qualityControl.quarantine.actions.release')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function QuarantineDialogContent({
  inspection,
  note,
  onNoteChange,
  t,
}: {
  inspection: InventoryQualityInspectionDto;
  note: string;
  onNoteChange: (value: string) => void;
  t: (key: string, options?: Record<string, unknown>) => string;
}): ReactElement {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        <InfoItem label={t('qualityControl.quarantine.columns.documentType')} value={inspection.documentType} />
        <InfoItem label={t('qualityControl.quarantine.columns.documentNumber')} value={inspection.documentNumber || '-'} />
        <InfoItem label={t('qualityControl.quarantine.columns.warehouse')} value={[inspection.warehouseCode, inspection.warehouseName].filter(Boolean).join(' - ')} />
        <InfoItem label={t('qualityControl.quarantine.columns.supplier')} value={[inspection.supplierCode, inspection.supplierName].filter(Boolean).join(' - ') || '-'} />
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold">{t('qualityControl.quarantine.dialog.linesTitle')}</h3>
        <div className="space-y-2 rounded-xl border p-3">
          {inspection.lines.map((line) => (
            <div key={line.id} className="rounded-lg border p-3 text-sm">
              <div className="font-medium">{[line.stockCode, line.stockName].filter(Boolean).join(' - ')}</div>
              <div className="text-muted-foreground">
                {t('qualityControl.inspections.lines.lineSummary', {
                  stockId: line.stockId,
                  quantity: line.quantity,
                  decision: formatDecisionLabel(t, line.decision),
                })}
              </div>
              <div className="text-muted-foreground">
                {t('qualityControl.inspections.lines.lineMeta', {
                  lot: line.lotNo || '-',
                  serial: line.serialNo || '-',
                  expiry: line.expiryDate ? formatDateTime(line.expiryDate) : '-',
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="quarantine-note">
          {t('qualityControl.quarantine.dialog.note')}
        </label>
        <Textarea
          id="quarantine-note"
          value={note}
          onChange={(event) => onNoteChange(event.target.value)}
          placeholder={t('qualityControl.quarantine.dialog.notePlaceholder')}
          rows={4}
        />
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }): ReactElement {
  return (
    <div className="rounded-xl border p-3">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm font-medium">{value}</div>
    </div>
  );
}
