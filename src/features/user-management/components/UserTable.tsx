import { type ReactElement, useMemo } from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { PagedDataGrid, type PagedDataGridColumn } from '@/components/shared';
import { VoiceSearchButton } from '@/components/ui/voice-search-button';
import { useColumnPreferences } from '@/hooks/useColumnPreferences';
import { usePagedDataGrid } from '@/hooks/usePagedDataGrid';
import { getPagedRange } from '@/lib/paged';
import type { FilterColumnConfig } from '@/lib/advanced-filter-types';
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
      { key: 'id', label: t('userManagement.table.id') },
      { key: 'username', label: t('userManagement.table.username') },
      { key: 'email', label: t('userManagement.table.email') },
      { key: 'fullName', label: t('userManagement.table.fullName'), sortable: false },
      { key: 'role', label: t('userManagement.table.role'), sortable: false },
      { key: 'status', label: t('userManagement.table.status'), sortable: false },
      { key: 'createdDate', label: t('userManagement.table.createdDate') },
      { key: 'actions', label: t('common.actions'), sortable: false },
    ],
    [t],
  );

  const { userId, columnOrder, visibleColumns, orderedVisibleColumns, setColumnOrder, setVisibleColumns } = useColumnPreferences({
    pageKey,
    columns: columns.map(({ key, label }) => ({ key, label })),
    idColumnKey: 'id',
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
    <PagedDataGrid<UserDto, UserColumnKey>
      columns={columns}
      visibleColumnKeys={visibleColumnKeys}
      rows={data?.data ?? []}
      rowKey={(row) => row.id}
      renderCell={(user, columnKey) => {
        switch (columnKey) {
          case 'id':
            return user.id;
          case 'username':
            return <span className="font-medium">{user.username}</span>;
          case 'email':
            return user.email;
          case 'fullName':
            return user.fullName || '-';
          case 'role':
            return <Badge variant="outline">{user.role || '-'}</Badge>;
          case 'status':
            return (
              <div className="flex items-center gap-2">
                <Switch
                  checked={user.isActive}
                  onCheckedChange={(checked) => void handleStatusChange(user, checked)}
                  disabled={updateUser.isPending || !canUpdate}
                />
                <span className="text-sm text-muted-foreground">
                  {user.isActive ? t('userManagement.table.active') : t('userManagement.table.inactive')}
                </span>
                {user.isEmailConfirmed && (
                  <Badge variant="outline" className="text-xs">
                    {t('userManagement.table.confirmed')}
                  </Badge>
                )}
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
      renderActionsCell={(user) => (
        onEdit && canUpdate ? (
          <Button variant="ghost" size="sm" onClick={() => onEdit(user)}>
            <span>{t('common.edit')}</span>
          </Button>
        ) : null
      )}
      iconOnlyActions={false}
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
          className: 'h-9 w-full md:w-64',
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
  );
}
