import { type ReactElement, useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OpsListPageShell, OpsServiceEyebrow, PagedDataGrid, type PagedDataGridColumn } from '@/components/shared';
import { usePagedDataGrid } from '@/hooks/usePagedDataGrid';
import { getLocaleForFormatting } from '@/lib/i18n';
import { getPagedRange } from '@/lib/paged';
import type { FilterColumnConfig } from '@/lib/advanced-filter-types';
import { useUIStore } from '@/stores/ui-store';
import { kkdApi } from '../api/kkd.api';
import type { KkdValidationLogDto } from '../types/kkd.types';
import {
  KKD_VALIDATION_LOG_COLUMN_WIDTHS,
  KkdFlagChip,
  KkdOpsSection,
  KkdResultPanel,
  KkdSummaryMetric,
} from './kkd-ops-ui';

type ValidationColumnKey =
  | 'createdDate'
  | 'employee'
  | 'customerCode'
  | 'stock'
  | 'groupCode'
  | 'attemptedQuantity'
  | 'reasonCode'
  | 'reasonMessage';

function mapSortBy(value: ValidationColumnKey): string {
  switch (value) {
    case 'createdDate':
      return 'CreatedDate';
    case 'employee':
      return 'EmployeeCode';
    case 'customerCode':
      return 'CustomerCode';
    case 'stock':
      return 'StockCode';
    case 'groupCode':
      return 'GroupCode';
    case 'attemptedQuantity':
      return 'AttemptedQuantity';
    case 'reasonCode':
      return 'ReasonCode';
    case 'reasonMessage':
      return 'ReasonMessage';
    default:
      return 'CreatedDate';
  }
}

export function KkdValidationLogPage(): ReactElement {
  const { t, i18n } = useTranslation(['kkd', 'common']);
  const { setPageTitle } = useUIStore();
  const [selectedRow, setSelectedRow] = useState<KkdValidationLogDto | null>(null);
  const pagedGrid = usePagedDataGrid<ValidationColumnKey>({
    pageKey: 'kkd-validation-log-grid',
    defaultSortBy: 'createdDate',
    defaultSortDirection: 'desc',
    defaultPageSize: 20,
    mapSortBy,
  });

  const formatDate = useCallback(
    (value?: string | null): string => {
      if (!value) return '-';
      return new Date(value).toLocaleString(getLocaleForFormatting(i18n.language));
    },
    [i18n.language],
  );

  useEffect(() => {
    setPageTitle(t('kkd.operational.validationLog.pageTitle'));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

  const query = useQuery({
    queryKey: ['kkd', 'validation-logs', pagedGrid.queryParams],
    queryFn: ({ signal }) => kkdApi.getValidationLogs(pagedGrid.queryParams, { signal }),
    retry: false,
  });

  const rows = query.data?.data ?? [];
  const range = getPagedRange(query.data);

  const columns = useMemo<PagedDataGridColumn<ValidationColumnKey>[]>(
    () => [
      { key: 'createdDate', label: t('kkd.operational.validationLog.time') },
      { key: 'employee', label: t('kkd.operational.validationLog.employee') },
      { key: 'customerCode', label: t('kkd.operational.validationLog.account') },
      { key: 'stock', label: t('kkd.operational.validationLog.stock') },
      { key: 'groupCode', label: t('kkd.operational.validationLog.group') },
      { key: 'attemptedQuantity', label: t('kkd.operational.validationLog.qty') },
      { key: 'reasonCode', label: t('kkd.operational.validationLog.code') },
      { key: 'reasonMessage', label: t('kkd.operational.validationLog.desc') },
    ],
    [t],
  );
  const filterColumns = useMemo<readonly FilterColumnConfig[]>(() => [
    { value: 'CreatedDate', type: 'date', labelKey: 'createdDate', label: t('kkd.operational.validationLog.time') },
    { value: 'EmployeeCode', type: 'string', labelKey: 'employeeCode', label: t('kkd.operational.validationLog.employee') },
    { value: 'CustomerCode', type: 'string', labelKey: 'customerCode', label: t('kkd.operational.validationLog.account') },
    { value: 'StockCode', type: 'string', labelKey: 'stockCode', label: t('kkd.operational.validationLog.stock') },
    { value: 'GroupCode', type: 'string', labelKey: 'groupCode', label: t('kkd.operational.validationLog.group') },
    { value: 'AttemptedQuantity', type: 'number', labelKey: 'attemptedQuantity', label: t('kkd.operational.validationLog.qty') },
    { value: 'ReasonCode', type: 'string', labelKey: 'reasonCode', label: t('kkd.operational.validationLog.code') },
    { value: 'ReasonMessage', type: 'string', labelKey: 'reasonMessage', label: t('kkd.operational.validationLog.desc') },
  ], [t]);

  return (
    <OpsListPageShell
      className="wms-ops-kkd-page"
      eyebrow={<OpsServiceEyebrow module={t('kkd.operational.breadcrumb.module')} />}
      title={t('kkd.operational.validationLog.pageTitle')}
      description={t('kkd.operational.validationLog.breadcrumb')}
    >
      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <KkdOpsSection className="min-w-0" title={t('kkd.operational.validationLog.gridTitle')}>
          <PagedDataGrid<KkdValidationLogDto, ValidationColumnKey>
            variant="ops"
            pageKey="kkd-validation-log"
            columns={columns}
            rows={rows}
            rowKey={(row) => row.id}
            defaultColumnWidths={KKD_VALIDATION_LOG_COLUMN_WIDTHS}
            enableColumnResize
            renderCell={(row, columnKey) => {
              switch (columnKey) {
                case 'createdDate':
                  return formatDate(row.createdDate);
                case 'employee':
                  return row.employeeCode
                    ? `${row.employeeCode} - ${row.employeeName || ''}`.trim()
                    : row.employeeName || '-';
                case 'customerCode':
                  return row.customerCode || '-';
                case 'stock':
                  return row.stockCode
                    ? `${row.stockCode} - ${row.stockName || ''}`.trim()
                    : row.stockName || '-';
                case 'groupCode':
                  return row.groupCode || '-';
                case 'attemptedQuantity':
                  return row.attemptedQuantity;
                case 'reasonCode':
                  return row.reasonCode;
                case 'reasonMessage':
                  return row.reasonMessage || '-';
                default:
                  return '-';
              }
            }}
            sortBy={pagedGrid.sortBy}
            sortDirection={pagedGrid.sortDirection}
            onSort={pagedGrid.handleSort}
            showActionsColumn
            iconOnlyActions
            actionsHeaderLabel={t('common.actions')}
            actionsCellClassName="wms-ops-table-actions-col"
            renderActionsCell={(row) => (
              <div className="wms-ops-row-actions">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="wms-ops-grid-icon-btn"
                  title={t('common.view')}
                  aria-label={t('common.view')}
                  onClick={() => setSelectedRow(row)}
                >
                  <Eye className="size-3" />
                </Button>
              </div>
            )}
            pageSize={query.data?.pageSize ?? pagedGrid.pageSize}
            pageSizeOptions={pagedGrid.pageSizeOptions}
            onPageSizeChange={pagedGrid.handlePageSizeChange}
            pageNumber={pagedGrid.getDisplayPageNumber(query.data)}
            totalPages={query.data?.totalPages ?? 0}
            hasPreviousPage={query.data?.hasPreviousPage ?? false}
            hasNextPage={query.data?.hasNextPage ?? false}
            onPreviousPage={pagedGrid.goToPreviousPage}
            onNextPage={pagedGrid.goToNextPage}
            previousLabel={t('common.previous')}
            nextLabel={t('common.next')}
            paginationInfoText={`${range.from}-${range.to} / ${range.total}`}
            isLoading={query.isLoading}
            isError={query.isError}
            errorText={t('kkd.operational.validationLog.errLoad')}
            emptyText={t('kkd.operational.validationLog.empty')}
            search={{
              value: pagedGrid.searchInput,
              onValueChange: pagedGrid.searchConfig.onValueChange,
              onSearchChange: pagedGrid.searchConfig.onSearchChange,
              placeholder: t('kkd.operational.validationLog.searchPh'),
            }}
            filterColumns={filterColumns}
            defaultFilterColumn="CreatedDate"
            draftFilterRows={pagedGrid.draftFilterRows}
            onDraftFilterRowsChange={pagedGrid.setDraftFilterRows}
            filterLogic={pagedGrid.filterLogic}
            onFilterLogicChange={pagedGrid.setFilterLogic}
            onApplyFilters={pagedGrid.applyAdvancedFilters}
            onClearFilters={pagedGrid.clearAdvancedFilters}
            appliedFilterCount={pagedGrid.appliedAdvancedFilters.length}
          />
        </KkdOpsSection>

        <KkdOpsSection className="min-w-0" title={t('kkd.operational.validationLog.detailTitle')}>
          {selectedRow ? (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <KkdFlagChip tone="info">{selectedRow.reasonCode}</KkdFlagChip>
                {selectedRow.groupCode ? <KkdFlagChip>{selectedRow.groupCode}</KkdFlagChip> : null}
                <KkdFlagChip>{formatDate(selectedRow.createdDate)}</KkdFlagChip>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <KkdSummaryMetric
                  icon={<span className="text-xs font-bold">EC</span>}
                  label={t('kkd.operational.validationLog.employeeCust')}
                  value={`${(selectedRow.employeeCode || selectedRow.employeeName)
                    ? `${selectedRow.employeeCode || ''} ${selectedRow.employeeName || ''}`.trim()
                    : '-'} / ${selectedRow.customerCode || '-'}`}
                />
                <KkdSummaryMetric
                  icon={<span className="text-xs font-bold">SQ</span>}
                  label={t('kkd.operational.validationLog.stockQty')}
                  value={`${(selectedRow.stockCode || selectedRow.stockName)
                    ? `${selectedRow.stockCode || ''} ${selectedRow.stockName || ''}`.trim()
                    : '-'} / ${selectedRow.attemptedQuantity}`}
                />
              </div>

              <KkdResultPanel>
                <p className="wms-ops-prelabel-form-label">{t('kkd.operational.validationLog.message')}</p>
                <p className="mt-2 text-sm leading-6">{selectedRow.reasonMessage || '-'}</p>
              </KkdResultPanel>

              <KkdResultPanel tone="warn">
                <p className="text-sm leading-6">
                  {t('kkd.operational.validationLog.metaQr')}: {selectedRow.scannedQr || '-'}
                  <br />
                  {t('kkd.operational.validationLog.metaBarcode')}: {selectedRow.scannedBarcode || '-'}
                  <br />
                  {t('kkd.operational.validationLog.metaWh')}: {selectedRow.warehouseId || '-'}
                  <br />
                  {t('kkd.operational.validationLog.metaDevice')}: {selectedRow.deviceInfo || '-'}
                </p>
              </KkdResultPanel>
            </div>
          ) : (
            <KkdResultPanel>
              <p className="text-center text-sm">{t('kkd.operational.validationLog.pickLog')}</p>
            </KkdResultPanel>
          )}
        </KkdOpsSection>
      </div>
    </OpsListPageShell>
  );
}
