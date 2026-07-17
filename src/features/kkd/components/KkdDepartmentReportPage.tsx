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
import type { KkdDepartmentUsageReportDto } from '../types/kkd.types';
import { KKD_REPORT_COLUMN_WIDTHS, KkdOpsSection, KkdReportDetailFacts, KkdResultPanel } from './kkd-ops-ui';

type ColumnKey = 'departmentCode' | 'departmentName' | 'employeeCount' | 'distributionCount' | 'totalQuantity' | 'lastUsageDate';

function mapSortBy(value: ColumnKey): string {
  switch (value) {
    case 'departmentCode':
      return 'DepartmentCode';
    case 'departmentName':
      return 'DepartmentName';
    case 'employeeCount':
      return 'EmployeeCount';
    case 'distributionCount':
      return 'DistributionCount';
    case 'totalQuantity':
      return 'TotalQuantity';
    case 'lastUsageDate':
      return 'LastUsageDate';
    default:
      return 'TotalQuantity';
  }
}

export function KkdDepartmentReportPage(): ReactElement {
  const { t, i18n } = useTranslation(['kkd', 'common']);
  const { setPageTitle } = useUIStore();
  const [selectedRow, setSelectedRow] = useState<KkdDepartmentUsageReportDto | null>(null);
  const pagedGrid = usePagedDataGrid<ColumnKey>({
    pageKey: 'kkd-department-report-grid',
    defaultSortBy: 'totalQuantity',
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
    setPageTitle(t('kkd.operational.departmentReport.pageTitle'));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

  const query = useQuery({
    queryKey: ['kkd', 'reports', 'departments', pagedGrid.queryParams],
    queryFn: ({ signal }) => kkdApi.getDepartmentUsageReports(pagedGrid.queryParams, { signal }),
    retry: false,
  });

  const rows = useMemo(() => query.data?.data ?? [], [query.data?.data]);
  const range = getPagedRange(query.data);

  const columns = useMemo<PagedDataGridColumn<ColumnKey>[]>(
    () => [
      { key: 'departmentCode', label: t('kkd.operational.reports.colDeptCode') },
      { key: 'departmentName', label: t('kkd.operational.reports.colDeptName') },
      { key: 'employeeCount', label: t('kkd.operational.reports.colEmployees') },
      { key: 'distributionCount', label: t('kkd.operational.reports.colDocs') },
      { key: 'totalQuantity', label: t('kkd.operational.reports.colQty') },
      { key: 'lastUsageDate', label: t('kkd.operational.reports.colLast') },
    ],
    [t],
  );
  const filterColumns = useMemo<readonly FilterColumnConfig[]>(() => [
    { value: 'DepartmentCode', type: 'string', labelKey: 'departmentCode', label: t('kkd.operational.reports.colDeptCode') },
    { value: 'DepartmentName', type: 'string', labelKey: 'departmentName', label: t('kkd.operational.reports.colDeptName') },
    { value: 'EmployeeCount', type: 'number', labelKey: 'employeeCount', label: t('kkd.operational.reports.colEmployees') },
    { value: 'DistributionCount', type: 'number', labelKey: 'distributionCount', label: t('kkd.operational.reports.colDocs') },
    { value: 'TotalQuantity', type: 'number', labelKey: 'totalQuantity', label: t('kkd.operational.reports.colQty') },
    { value: 'LastUsageDate', type: 'date', labelKey: 'lastUsageDate', label: t('kkd.operational.reports.colLast') },
  ], [t]);
  const exportColumns = useMemo(() => columns.map(({ key, label }) => ({ key, label })), [columns]);
  const exportRows = useMemo<Record<string, unknown>[]>(() => rows.map((row) => ({
    departmentCode: row.departmentCode || '-',
    departmentName: row.departmentName || '-',
    employeeCount: row.employeeCount,
    distributionCount: row.distributionCount,
    totalQuantity: row.totalQuantity,
    lastUsageDate: formatDate(row.lastUsageDate),
  })), [formatDate, rows]);

  const undefinedName = t('kkd.operational.common.undefinedName');

  return (
    <OpsListPageShell
      className="wms-ops-kkd-page"
      eyebrow={<OpsServiceEyebrow module={t('kkd.operational.breadcrumb.module')} />}
      title={t('kkd.operational.departmentReport.pageTitle')}
      description={t('kkd.operational.departmentReport.breadcrumb')}
    >
      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <KkdOpsSection className="min-w-0" title={t('kkd.operational.reports.summaryDept')}>
          <PagedDataGrid<KkdDepartmentUsageReportDto, ColumnKey>
            variant="ops"
            pageKey="kkd-department-report"
            columns={columns}
            rows={rows}
            rowKey={(row) => `${row.departmentId ?? 0}-${row.departmentCode ?? 'unknown'}`}
            defaultColumnWidths={KKD_REPORT_COLUMN_WIDTHS}
            enableColumnResize
            renderCell={(row, columnKey) => {
              switch (columnKey) {
                case 'departmentCode':
                  return row.departmentCode || '-';
                case 'departmentName':
                  return row.departmentName || undefinedName;
                case 'employeeCount':
                  return row.employeeCount;
                case 'distributionCount':
                  return row.distributionCount;
                case 'totalQuantity':
                  return row.totalQuantity;
                case 'lastUsageDate':
                  return formatDate(row.lastUsageDate);
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
            errorText={t('kkd.operational.reports.errDept')}
            emptyText={t('kkd.operational.reports.emptyDept')}
            search={{
              value: pagedGrid.searchInput,
              onValueChange: pagedGrid.searchConfig.onValueChange,
              onSearchChange: pagedGrid.searchConfig.onSearchChange,
              placeholder: t('kkd.operational.reports.deptSearchPh'),
            }}
            filterColumns={filterColumns}
            defaultFilterColumn="DepartmentCode"
            draftFilterRows={pagedGrid.draftFilterRows}
            onDraftFilterRowsChange={pagedGrid.setDraftFilterRows}
            filterLogic={pagedGrid.filterLogic}
            onFilterLogicChange={pagedGrid.setFilterLogic}
            onApplyFilters={pagedGrid.applyAdvancedFilters}
            onClearFilters={pagedGrid.clearAdvancedFilters}
            appliedFilterCount={pagedGrid.appliedAdvancedFilters.length}
            exportFileName="kkd-bolum-raporu"
            exportColumns={exportColumns}
            exportRows={exportRows}
          />
        </KkdOpsSection>

        <KkdOpsSection title={t('kkd.operational.reports.summaryD')} className="min-w-0">
          {selectedRow ? (
            <div className="space-y-4">
              <KkdReportDetailFacts
                items={[
                  {
                    label: t('kkd.operational.reports.deptLabel'),
                    value: `${selectedRow.departmentCode || '-'} - ${selectedRow.departmentName || undefinedName}`,
                    tone: 'info',
                  },
                  {
                    label: t('kkd.operational.reports.labelQty'),
                    value: String(selectedRow.totalQuantity),
                    tone: 'success',
                  },
                  {
                    label: t('kkd.operational.reports.labelDocEmp'),
                    value: `${selectedRow.distributionCount} / ${selectedRow.employeeCount}`,
                  },
                  {
                    label: t('kkd.operational.reports.lastMove'),
                    value: formatDate(selectedRow.lastUsageDate),
                  },
                ]}
              />
            </div>
          ) : (
            <KkdResultPanel>
              <p className="text-center text-sm">{t('kkd.operational.reports.pickRowDept')}</p>
            </KkdResultPanel>
          )}
        </KkdOpsSection>
      </div>
    </OpsListPageShell>
  );
}
