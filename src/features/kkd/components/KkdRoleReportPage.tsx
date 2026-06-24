import { type ReactElement, useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OpsListPageShell, OpsServiceEyebrow, PagedDataGrid, type PagedDataGridColumn } from '@/components/shared';
import { usePagedDataGrid } from '@/hooks/usePagedDataGrid';
import { getLocaleForFormatting } from '@/lib/i18n';
import { getPagedRange } from '@/lib/paged';
import { useUIStore } from '@/stores/ui-store';
import { kkdApi } from '../api/kkd.api';
import type { KkdRoleUsageReportDto } from '../types/kkd.types';
import { KKD_REPORT_COLUMN_WIDTHS, KkdOpsSection, KkdReportDetailFacts, KkdResultPanel } from './kkd-ops-ui';

type ColumnKey = 'roleCode' | 'roleName' | 'employeeCount' | 'distributionCount' | 'totalQuantity' | 'lastUsageDate';

function mapSortBy(value: ColumnKey): string {
  switch (value) {
    case 'roleCode':
      return 'RoleCode';
    case 'roleName':
      return 'RoleName';
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

export function KkdRoleReportPage(): ReactElement {
  const { t, i18n } = useTranslation(['kkd', 'common']);
  const { setPageTitle } = useUIStore();
  const [selectedRow, setSelectedRow] = useState<KkdRoleUsageReportDto | null>(null);
  const pagedGrid = usePagedDataGrid<ColumnKey>({
    pageKey: 'kkd-role-report-grid',
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
    setPageTitle(t('kkd.operational.roleReport.pageTitle'));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

  const query = useQuery({
    queryKey: ['kkd', 'reports', 'roles', pagedGrid.queryParams],
    queryFn: ({ signal }) => kkdApi.getRoleUsageReports(pagedGrid.queryParams, { signal }),
    retry: false,
  });

  const rows = query.data?.data ?? [];
  const range = getPagedRange(query.data);

  const columns = useMemo<PagedDataGridColumn<ColumnKey>[]>(
    () => [
      { key: 'roleCode', label: t('kkd.operational.reports.colRoleCode') },
      { key: 'roleName', label: t('kkd.operational.reports.colRoleName') },
      { key: 'employeeCount', label: t('kkd.operational.reports.colEmployees') },
      { key: 'distributionCount', label: t('kkd.operational.reports.colDocs') },
      { key: 'totalQuantity', label: t('kkd.operational.reports.colQty') },
      { key: 'lastUsageDate', label: t('kkd.operational.reports.colLast') },
    ],
    [t],
  );

  const undefinedName = t('kkd.operational.common.undefinedName');

  return (
    <OpsListPageShell
      className="wms-ops-kkd-page"
      eyebrow={<OpsServiceEyebrow module={t('kkd.operational.breadcrumb.module')} />}
      title={t('kkd.operational.roleReport.pageTitle')}
      description={t('kkd.operational.roleReport.breadcrumb')}
    >
      <div className="grid min-w-0 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <KkdOpsSection title={t('kkd.operational.reports.summaryRole')}>
          <PagedDataGrid<KkdRoleUsageReportDto, ColumnKey>
            variant="ops"
            pageKey="kkd-role-report"
            columns={columns}
            rows={rows}
            rowKey={(row) => `${row.roleId ?? 0}-${row.roleCode ?? 'unknown'}`}
            defaultColumnWidths={KKD_REPORT_COLUMN_WIDTHS}
            enableColumnResize
            renderCell={(row, columnKey) => {
              switch (columnKey) {
                case 'roleCode':
                  return row.roleCode || '-';
                case 'roleName':
                  return row.roleName || undefinedName;
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
            errorText={t('kkd.operational.reports.errRole')}
            emptyText={t('kkd.operational.reports.emptyRole')}
            search={{
              value: pagedGrid.searchInput,
              onValueChange: pagedGrid.searchConfig.onValueChange,
              onSearchChange: pagedGrid.searchConfig.onSearchChange,
              placeholder: t('kkd.operational.reports.roleSearchPh'),
            }}
          />
        </KkdOpsSection>

        <KkdOpsSection title={t('kkd.operational.reports.summaryK')} className="min-w-0">
          {selectedRow ? (
            <div className="space-y-4">
              <KkdReportDetailFacts
                items={[
                  {
                    label: t('kkd.operational.reports.labelRole'),
                    value: `${selectedRow.roleCode || '-'} - ${selectedRow.roleName || undefinedName}`,
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
              <p className="text-center text-sm">{t('kkd.operational.reports.pickRowRole')}</p>
            </KkdResultPanel>
          )}
        </KkdOpsSection>
      </div>
    </OpsListPageShell>
  );
}
