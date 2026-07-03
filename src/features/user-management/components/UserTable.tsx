import { type ReactElement, useMemo } from 'react';
import { ArrowDown, ArrowUp, Pencil, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { PagedDataGrid, type PagedDataGridColumn } from '@/components/shared';
import { VoiceSearchButton } from '@/components/ui/voice-search-button';
import { MasterDataOpsFlagChip, masterDataOpsGridColumn } from '@/features/shared';
import { useColumnPreferences } from '@/hooks/useColumnPreferences';
import { usePagedDataGrid } from '@/hooks/usePagedDataGrid';
import { getPagedRange } from '@/lib/paged';
import type { FilterColumnConfig } from '@/lib/advanced-filter-types';
import { OpsCircuitToggleInline } from '@/components/shared';
import { useUserList } from '../hooks/useUserList';
import { useUpdateUser } from '../hooks/useUpdateUser';
import type { UserDto } from '../types/user-types';

type UserColumnKey =
  | 'id'
  | 'username'
  | 'email'
  | 'fullName'
  | 'role'
  | 'status'
  | 'createdDate'
  | 'actions';

interface UserTableProps {
  onEdit?: (user: UserDto) => void;
  canUpdate?: boolean;
}

const USER_MANAGEMENT_DEFAULT_WIDTHS: Record<string, number> = {
  id: 6,
  username: 14,
  email: 18,
  fullName: 16,
  role: 10,
  status: 14,
  createdDate: 11,
  actions: 5,
};

const advancedFilterColumns: readonly FilterColumnConfig[] = [
  { value: 'username', type: 'string', labelKey: 'userManagement.table.username' },
  { value: 'email', type: 'string', labelKey: 'userManagement.table.email' },
  { value: 'firstName', type: 'string', labelKey: 'userManagement.form.firstName.label' },
  { value: 'lastName', type: 'string', labelKey: 'userManagement.form.lastName.label' },
  { value: 'role', type: 'string', labelKey: 'userManagement.table.role' },
  { value: 'isActive', type: 'boolean', labelKey: 'userManagement.table.status' },
];

function mapSortBy(value: UserColumnKey): string {
  switch (value) {
    case 'id':
      return 'Id';
    case 'username':
      return 'Username';
    case 'email':
      return 'Email';
    case 'fullName':
      return 'FirstName';
    case 'role':
      return 'Role';
    case 'createdDate':
    default:
      return 'Id';
  }
}

export function UserTable({
  onEdit,
  canUpdate = false,
}: UserTableProps): ReactElement {
  const { t, i18n } = useTranslation(['user-management', 'common']);
  const pageKey = 'user-management-list';
  const updateUser = useUpdateUser();

  const pagedGrid = usePagedDataGrid<UserColumnKey>({
    pageKey,
    defaultSortBy: 'id',
    defaultSortDirection: 'asc',
    mapSortBy,
  });

  const columns = useMemo<PagedDataGridColumn<UserColumnKey>[]>(
    () => [
      masterDataOpsGridColumn('id', t('userManagement.table.id')),
      masterDataOpsGridColumn('username', t('userManagement.table.username')),
      masterDataOpsGridColumn('email', t('userManagement.table.email')),
      masterDataOpsGridColumn('fullName', t('userManagement.table.fullName'), false),
      masterDataOpsGridColumn('role', t('userManagement.table.role'), false),
      masterDataOpsGridColumn('status', t('userManagement.table.status'), false),
      masterDataOpsGridColumn('createdDate', t('userManagement.table.createdDate')),
      masterDataOpsGridColumn('actions', t('common.actions'), false),
    ],
    [t],
  );

  const { userId, columnOrder, visibleColumns, orderedVisibleColumns, setColumnOrder, setVisibleColumns } = useColumnPreferences({
    pageKey,
    columns: columns.map(({ key, label }) => ({ key, label })),
    idColumnKey: 'id',
    defaultWidths: USER_MANAGEMENT_DEFAULT_WIDTHS,
  });

  const { data, isLoading, error } = useUserList(pagedGrid.queryParams);

  const handleStatusChange = async (user: UserDto, checked: boolean): Promise<void> => {
    await updateUser.mutateAsync({
      id: user.id,
      data: { isActive: checked },
    });
  };

  const visibleColumnKeys = useMemo(
    () => orderedVisibleColumns.filter((key) => key !== 'actions') as UserColumnKey[],
    [orderedVisibleColumns],
  );

  const exportColumns = useMemo(
    () => orderedVisibleColumns
      .filter((key) => key !== 'actions')
      .map((key) => ({
        key,
        label: columns.find((column) => column.key === key)?.label ?? key,
      })),
    [columns, orderedVisibleColumns],
  );

  const exportRows = useMemo<Record<string, unknown>[]>(() => {
    return (data?.data ?? []).map((user) => ({
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName || '-',
      role: user.role || '-',
      status: user.isActive ? t('userManagement.table.active') : t('userManagement.table.inactive'),
      createdDate: user.creationTime || user.createdDate
        ? new Date(user.creationTime ?? user.createdDate ?? '').toLocaleDateString(i18n.language)
        : '-',
    }));
  }, [data?.data, i18n.language, t]);

  const renderSortIcon = (columnKey: UserColumnKey): ReactElement | null => {
    if (columnKey !== pagedGrid.sortBy) return null;
    return pagedGrid.sortDirection === 'asc'
      ? <ArrowUp className="ml-1 h-3.5 w-3.5" />
      : <ArrowDown className="ml-1 h-3.5 w-3.5" />;
  };

  const range = getPagedRange(data);
  const paginationInfoText = t('common.paginationInfo', {
    current: range.from,
    total: range.to,
    totalCount: range.total,
    defaultValue: `${range.from}-${range.to} / ${range.total}`,
  });

  return (
    <div className="wms-ops-list wms-ops-form p-4 sm:p-5">
      <PagedDataGrid<UserDto, UserColumnKey>
        variant="ops"
        columns={columns}
        visibleColumnKeys={visibleColumnKeys}
        rows={data?.data ?? []}
        rowKey={(row) => row.id}
        renderCell={(user, columnKey) => {
          switch (columnKey) {
            case 'id':
              return <span className="wms-ops-table-id-value">{user.id}</span>;
            case 'username':
              return <span className="font-medium">{user.username}</span>;
            case 'email':
              return user.email;
            case 'fullName':
              return user.fullName || '-';
            case 'role':
              return <MasterDataOpsFlagChip>{user.role || '-'}</MasterDataOpsFlagChip>;
            case 'status':
              return (
                <div className="flex flex-wrap items-center gap-2">
                  <OpsCircuitToggleInline
                    checked={user.isActive}
                    onCheckedChange={(checked) => void handleStatusChange(user, checked)}
                    disabled={updateUser.isPending || !canUpdate}
                    aria-label={user.isActive ? t('userManagement.table.active') : t('userManagement.table.inactive')}
                  />
                  <span className="text-xs opacity-75">
                    {user.isActive ? t('userManagement.table.active') : t('userManagement.table.inactive')}
                  </span>
                  {user.isEmailConfirmed ? (
                    <TooltipProvider delayDuration={200}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span
                            className="inline-flex cursor-default"
                            aria-label={t('userManagement.table.confirmed')}
                          >
                            <MasterDataOpsFlagChip tone="info">
                              <ShieldCheck className="size-3" aria-hidden />
                            </MasterDataOpsFlagChip>
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          {t('userManagement.table.confirmed')}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : null}
                </div>
              );
            case 'createdDate':
              return user.creationTime || user.createdDate
                ? new Date(user.creationTime ?? user.createdDate ?? '').toLocaleDateString(i18n.language)
                : '-';
            case 'actions':
            default:
              return null;
          }
        }}
        sortBy={pagedGrid.sortBy}
        sortDirection={pagedGrid.sortDirection}
        onSort={(columnKey) => {
          if (columnKey === 'fullName' || columnKey === 'role' || columnKey === 'status' || columnKey === 'actions') return;
          pagedGrid.handleSort(columnKey);
        }}
        renderSortIcon={renderSortIcon}
        isLoading={isLoading}
        isError={Boolean(error)}
        errorText={t('common.errors.userListLoadFailed', { ns: 'common' })}
        emptyText={t('userManagement.table.noData')}
        showActionsColumn={orderedVisibleColumns.includes('actions') && Boolean(onEdit) && canUpdate}
        actionsHeaderLabel={t('common.actions')}
        iconOnlyActions
        actionsCellClassName="wms-ops-table-actions-col"
        renderActionsCell={(user) => (
          onEdit && canUpdate ? (
            <div className="wms-ops-row-actions">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="wms-ops-grid-icon-btn"
                onClick={() => onEdit(user)}
                aria-label={t('common.edit')}
              >
                <Pencil className="size-3" />
              </Button>
            </div>
          ) : null
        )}
        pageSize={pagedGrid.pageSize}
        pageSizeOptions={pagedGrid.pageSizeOptions}
        onPageSizeChange={pagedGrid.handlePageSizeChange}
        pageNumber={pagedGrid.getDisplayPageNumber(data)}
        totalPages={data?.totalPages ?? 1}
        hasPreviousPage={data?.hasPreviousPage ?? false}
        hasNextPage={data?.hasNextPage ?? false}
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
          exportFileName: pageKey,
          exportColumns,
          exportRows,
          filterColumns: advancedFilterColumns,
          defaultFilterColumn: 'username',
          draftFilterRows: pagedGrid.draftFilterRows,
          onDraftFilterRowsChange: pagedGrid.setDraftFilterRows,
          filterLogic: pagedGrid.filterLogic,
          onFilterLogicChange: pagedGrid.setFilterLogic,
          onApplyFilters: pagedGrid.applyAdvancedFilters,
          onClearFilters: pagedGrid.clearAdvancedFilters,
          translationNamespace: 'common',
          appliedFilterCount: pagedGrid.appliedAdvancedFilters.length,
          search: {
            ...pagedGrid.searchConfig,
            placeholder: t('userManagement.searchPlaceholder', { defaultValue: t('common.search') }),
          },
          leftSlot: (
            <VoiceSearchButton
              onResult={pagedGrid.handleVoiceSearch}
              size="sm"
              variant="outline"
            />
          ),
        }}
      />
    </div>
  );
}
