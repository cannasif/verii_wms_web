import { type ReactElement, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useUserList } from '../hooks/useUserList';
import { useUpdateUser } from '../hooks/useUpdateUser';
import type { UserDto } from '../types/user-types';
import type { PagedFilter } from '@/types/api';
import { ColumnPreferencesPopover, GridExportMenu, type ColumnDef } from '@/components/shared';
import { useColumnPreferences } from '@/hooks/useColumnPreferences';
import type { GridExportColumn } from '@/lib/grid-export';

interface UserTableProps {
  pageNumber: number;
  pageSize: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  filters?: PagedFilter[] | Record<string, unknown>;
  onPageChange: (page: number) => void;
  onSortChange: (sortBy: string, sortDirection: 'asc' | 'desc') => void;
  onEdit?: (user: UserDto) => void;
}

export function UserTable({
  pageNumber,
  pageSize,
  sortBy = 'Id',
  sortDirection = 'asc',
  filters = {},
  onPageChange,
  onSortChange,
  onEdit,
}: UserTableProps): ReactElement {
  const { t, i18n } = useTranslation(['user-management', 'common']);
  const pageKey = 'user-management-list';

  const { data, isLoading } = useUserList({
    pageNumber,
    pageSize,
    sortBy,
    sortDirection,
    filters: Array.isArray(filters) ? filters : undefined,
  });

  const updateUser = useUpdateUser();
  const columns = useMemo<ColumnDef[]>(
    () => [
      { key: 'id', label: t('userManagement.table.id') },
      { key: 'username', label: t('userManagement.table.username') },
      { key: 'email', label: t('userManagement.table.email') },
      { key: 'fullName', label: t('userManagement.table.fullName') },
      { key: 'role', label: t('userManagement.table.role') },
      { key: 'status', label: t('userManagement.table.status') },
      { key: 'createdDate', label: t('userManagement.table.createdDate') },
      ...(onEdit ? [{ key: 'actions', label: t('common:common.actions') }] : []),
    ],
    [onEdit, t]
  );
  const {
    userId,
    columnOrder,
    visibleColumns,
    orderedVisibleColumns,
    setColumnOrder,
    setVisibleColumns,
  } = useColumnPreferences({ pageKey, columns, idColumnKey: 'id' });

  const handleStatusChange = async (user: UserDto, checked: boolean): Promise<void> => {
    await updateUser.mutateAsync({
      id: user.id,
      data: { isActive: checked },
    });
  };

  const handleSort = (column: string): void => {
    const newDirection =
      sortBy === column && sortDirection === 'asc' ? 'desc' : 'asc';
    onSortChange(column, newDirection);
  };

  const exportColumns = useMemo<GridExportColumn[]>(
    () =>
      orderedVisibleColumns
        .filter((key) => key !== 'actions')
        .map((key) => ({
          key,
          label: columns.find((column) => column.key === key)?.label ?? key,
        })),
    [columns, orderedVisibleColumns]
  );

  const exportRows = useMemo<Record<string, unknown>[]>(() => {
    const list = data?.data ?? [];
    return list.map((user) => ({
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
  }, [data?.data, t, i18n.language]);

  const SortIcon = ({ column }: { column: string }): ReactElement => {
    if (sortBy !== column) {
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="ml-1 inline-block text-muted-foreground"
        >
          <path d="M8 9l4-4 4 4" />
          <path d="M16 15l-4 4-4-4" />
        </svg>
      );
    }
    return sortDirection === 'asc' ? (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="ml-1 inline-block"
      >
        <path d="M8 9l4-4 4 4" />
      </svg>
    ) : (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="ml-1 inline-block"
      >
        <path d="M16 15l-4 4-4-4" />
      </svg>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">
          {t('userManagement.table.loading')}
        </div>
      </div>
    );
  }

  const users = data?.data || [];
  
  if (!data || users.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">
          {t('userManagement.table.noData')}
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil((data.totalCount || 0) / pageSize);

  return (
    <>
      <div className="mb-3 flex justify-end gap-2">
        <GridExportMenu
          fileName={pageKey}
          columns={exportColumns}
          rows={exportRows}
        />
        <ColumnPreferencesPopover
          pageKey={pageKey}
          userId={userId}
          columns={columns}
          visibleColumns={visibleColumns}
          columnOrder={columnOrder}
          lockedKeys={['id']}
          onVisibleColumnsChange={setVisibleColumns}
          onColumnOrderChange={setColumnOrder}
        />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {orderedVisibleColumns.map((key) => {
                if (key === 'id') {
                  return (
                    <TableHead
                      key={key}
                      className="cursor-pointer select-none"
                      onClick={() => handleSort('Id')}
                    >
                      <div className="flex items-center">
                        {t('userManagement.table.id')}
                        <SortIcon column="Id" />
                      </div>
                    </TableHead>
                  );
                }

                if (key === 'username') {
                  return (
                    <TableHead
                      key={key}
                      className="cursor-pointer select-none"
                      onClick={() => handleSort('Username')}
                    >
                      <div className="flex items-center">
                        {t('userManagement.table.username')}
                        <SortIcon column="Username" />
                      </div>
                    </TableHead>
                  );
                }

                if (key === 'email') {
                  return (
                    <TableHead
                      key={key}
                      className="cursor-pointer select-none"
                      onClick={() => handleSort('Email')}
                    >
                      <div className="flex items-center">
                        {t('userManagement.table.email')}
                        <SortIcon column="Email" />
                      </div>
                    </TableHead>
                  );
                }

                if (key === 'fullName') return <TableHead key={key}>{t('userManagement.table.fullName')}</TableHead>;
                if (key === 'role') return <TableHead key={key}>{t('userManagement.table.role')}</TableHead>;
                if (key === 'status') return <TableHead key={key}>{t('userManagement.table.status')}</TableHead>;
                if (key === 'createdDate') return <TableHead key={key}>{t('userManagement.table.createdDate')}</TableHead>;
                if (key === 'actions') return <TableHead key={key} className="w-[80px]">{t('common:common.actions')}</TableHead>;
                return null;
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user: UserDto) => (
              <TableRow key={user.id}>
                {orderedVisibleColumns.map((key) => {
                  if (key === 'id') return <TableCell key={key}>{user.id}</TableCell>;
                  if (key === 'username') return <TableCell key={key} className="font-medium">{user.username}</TableCell>;
                  if (key === 'email') return <TableCell key={key}>{user.email}</TableCell>;
                  if (key === 'fullName') return <TableCell key={key}>{user.fullName || '-'}</TableCell>;
                  if (key === 'role') {
                    return (
                      <TableCell key={key}>
                        <Badge variant="outline">{user.role || '-'}</Badge>
                      </TableCell>
                    );
                  }
                  if (key === 'status') {
                    return (
                      <TableCell key={key}>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={user.isActive}
                            onCheckedChange={(checked) => handleStatusChange(user, checked)}
                            disabled={updateUser.isPending}
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
                      </TableCell>
                    );
                  }
                  if (key === 'createdDate') {
                    return (
                      <TableCell key={key}>
                        {user.creationTime || user.createdDate
                          ? new Date(user.creationTime ?? user.createdDate ?? '').toLocaleDateString(i18n.language)
                          : '-'}
                      </TableCell>
                    );
                  }
                  if (key === 'actions' && onEdit) {
                    return (
                      <TableCell key={key}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(user)}
                        >
                          {t('common:common.edit')}
                        </Button>
                      </TableCell>
                    );
                  }
                  return null;
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between py-4">
        <div className="text-sm text-muted-foreground">
          {t('userManagement.table.showing', {
            from: (pageNumber - 1) * pageSize + 1,
            to: Math.min(pageNumber * pageSize, data.totalCount || 0),
            total: data.totalCount || 0,
          })}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(pageNumber - 1)}
            disabled={pageNumber <= 1}
          >
            {t('userManagement.table.previous')}
          </Button>
          <div className="flex items-center px-4 text-sm">
            {t('userManagement.table.page', {
              current: pageNumber,
              total: totalPages,
            })}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(pageNumber + 1)}
            disabled={pageNumber >= totalPages}
          >
            {t('userManagement.table.next')}
          </Button>
        </div>
      </div>
    </>
  );
}
