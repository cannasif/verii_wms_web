import { type ReactElement, useMemo } from 'react';
import { KkdCrudPage, renderKkdGenericCell, type KkdCrudField } from './KkdCrudPage';
import { kkdApi } from '../api/kkd.api';
import type { CreateKkdEmployeeRoleDto, KkdEmployeeRoleDto, UpdateKkdEmployeeRoleDto } from '../types/kkd.types';
import type { PagedDataGridColumn } from '@/components/shared';

type ColumnKey = 'roleCode' | 'roleName' | 'isActive';

export function KkdEmployeeRolePage(): ReactElement {
  const columns = useMemo<PagedDataGridColumn<ColumnKey>[]>(() => [
    { key: 'roleCode', label: 'Görev Kodu' },
    { key: 'roleName', label: 'Görev Adı' },
    { key: 'isActive', label: 'Aktif' },
  ], []);

  const fields: readonly KkdCrudField<CreateKkdEmployeeRoleDto>[] = [
    { key: 'roleCode', label: 'Görev Kodu', type: 'text', required: true },
    { key: 'roleName', label: 'Görev Adı', type: 'text', required: true },
    { key: 'isActive', label: 'Aktif', type: 'boolean' },
  ];

  return (
    <KkdCrudPage<KkdEmployeeRoleDto, CreateKkdEmployeeRoleDto, ColumnKey>
      pageKey="kkd-roles"
      title="KKD Görev Tanımları"
      description="Görev kayıtlarını yönetin."
      breadcrumbGroup="KKD"
      breadcrumbCurrent="Görev Tanımları"
      columns={columns}
      fields={fields}
      initialForm={{ roleCode: '', roleName: '', isActive: true }}
      getList={kkdApi.getRoles}
      createItem={kkdApi.createRole}
      updateItem={(id, dto) => kkdApi.updateRole(id, dto as UpdateKkdEmployeeRoleDto)}
      deleteItem={kkdApi.deleteRole}
      queryKey={['kkd', 'roles']}
      mapSortBy={(value) => value === 'roleName' ? 'RoleName' : value === 'isActive' ? 'IsActive' : 'RoleCode'}
      renderCell={(row, columnKey) => renderKkdGenericCell(row[columnKey])}
    />
  );
}
