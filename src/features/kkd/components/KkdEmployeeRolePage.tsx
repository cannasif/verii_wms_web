import { type Dispatch, type ReactElement, type SetStateAction, useMemo, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { PagedLookupDialog } from '@/components/shared/PagedLookupDialog';
import { KkdCrudPage, renderKkdGenericCell, type KkdCrudField } from './KkdCrudPage';
import { kkdApi } from '../api/kkd.api';
import type { CreateKkdEmployeeRoleDto, KkdEmployeeDepartmentDto, KkdEmployeeRoleDto, UpdateKkdEmployeeRoleDto } from '../types/kkd.types';
import type { PagedDataGridColumn } from '@/components/shared';

type ColumnKey = 'departmentName' | 'roleCode' | 'roleName' | 'isActive';

function RoleForm({
  formState,
  setFormState,
}: {
  formState: CreateKkdEmployeeRoleDto;
  setFormState: Dispatch<SetStateAction<CreateKkdEmployeeRoleDto>>;
}): ReactElement {
  const [departmentDialogOpen, setDepartmentDialogOpen] = useState(false);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2 md:col-span-2">
        <Label>Bölüm *</Label>
        <PagedLookupDialog<KkdEmployeeDepartmentDto>
          open={departmentDialogOpen}
          onOpenChange={setDepartmentDialogOpen}
          title="Bölüm Seç"
          value={formState.departmentId ? `${formState.departmentId}` : null}
          placeholder="Bölüm seçiniz"
          queryKey={['kkd', 'role-form', 'departments']}
          fetchPage={({ pageNumber, pageSize, search, signal }) =>
            kkdApi.getDepartments({ pageNumber, pageSize, search }, { signal })
          }
          getKey={(item) => String(item.id)}
          getLabel={(item) => `${item.departmentCode} - ${item.departmentName}`}
          onSelect={(item) => setFormState((prev) => ({ ...prev, departmentId: item.id }))}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="roleCode">Görev Kodu *</Label>
        <Input
          id="roleCode"
          value={formState.roleCode}
          onChange={(event) => setFormState((prev) => ({ ...prev, roleCode: event.target.value }))}
          placeholder="Görev kodu giriniz"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="roleName">Görev Adı *</Label>
        <Input
          id="roleName"
          value={formState.roleName}
          onChange={(event) => setFormState((prev) => ({ ...prev, roleName: event.target.value }))}
          placeholder="Görev adı giriniz"
        />
      </div>
    </div>
  );
}

export function KkdEmployeeRolePage(): ReactElement {
  const columns = useMemo<PagedDataGridColumn<ColumnKey>[]>(() => [
    { key: 'departmentName', label: 'Bölüm' },
    { key: 'roleCode', label: 'Görev Kodu' },
    { key: 'roleName', label: 'Görev Adı' },
    { key: 'isActive', label: 'Aktif' },
  ], []);

  const fields: readonly KkdCrudField<CreateKkdEmployeeRoleDto>[] = [
    { key: 'departmentId', label: 'Bölüm', type: 'number', required: true },
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
      initialForm={{ departmentId: 0, roleCode: '', roleName: '', isActive: true }}
      getList={kkdApi.getRoles}
      createItem={kkdApi.createRole}
      updateItem={(id, dto) => kkdApi.updateRole(id, dto as UpdateKkdEmployeeRoleDto)}
      deleteItem={kkdApi.deleteRole}
      queryKey={['kkd', 'roles']}
      mapSortBy={(value) => value === 'roleName' ? 'RoleName' : value === 'isActive' ? 'IsActive' : 'RoleCode'}
      renderCell={(row, columnKey) => renderKkdGenericCell(row[columnKey])}
      renderForm={({ formState, setFormState }) => (
        <RoleForm formState={formState} setFormState={setFormState} />
      )}
    />
  );
}
