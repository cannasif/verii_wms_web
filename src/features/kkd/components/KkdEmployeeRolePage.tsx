import { type Dispatch, type ReactElement, type SetStateAction, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('common');
  const [departmentDialogOpen, setDepartmentDialogOpen] = useState(false);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2 md:col-span-2">
        <Label>{t('kkd.columns.department')} *</Label>
        <PagedLookupDialog<KkdEmployeeDepartmentDto>
          open={departmentDialogOpen}
          onOpenChange={setDepartmentDialogOpen}
          title={t('kkd.dialogs.selectDepartment')}
          value={formState.departmentId ? `${formState.departmentId}` : null}
          placeholder={t('kkd.placeholders.selectDepartment')}
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
        <Label htmlFor="roleCode">{t('kkd.columns.roleCode')} *</Label>
        <Input
          id="roleCode"
          value={formState.roleCode}
          onChange={(event) => setFormState((prev) => ({ ...prev, roleCode: event.target.value }))}
          placeholder={t('kkd.placeholders.enterRoleCode')}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="roleName">{t('kkd.columns.roleName')} *</Label>
        <Input
          id="roleName"
          value={formState.roleName}
          onChange={(event) => setFormState((prev) => ({ ...prev, roleName: event.target.value }))}
          placeholder={t('kkd.placeholders.enterRoleName')}
        />
      </div>
    </div>
  );
}

export function KkdEmployeeRolePage(): ReactElement {
  const { t } = useTranslation('common');
  const columns = useMemo<PagedDataGridColumn<ColumnKey>[]>(() => [
    { key: 'departmentName', label: t('kkd.columns.department') },
    { key: 'roleCode', label: t('kkd.columns.roleCode') },
    { key: 'roleName', label: t('kkd.columns.roleName') },
    { key: 'isActive', label: t('common.active') },
  ], [t]);

  const fields: readonly KkdCrudField<CreateKkdEmployeeRoleDto>[] = [
    { key: 'departmentId', label: t('kkd.columns.department'), type: 'number', required: true },
    { key: 'roleCode', label: t('kkd.columns.roleCode'), type: 'text', required: true },
    { key: 'roleName', label: t('kkd.columns.roleName'), type: 'text', required: true },
    { key: 'isActive', label: t('common.active'), type: 'boolean' },
  ];

  return (
    <KkdCrudPage<KkdEmployeeRoleDto, CreateKkdEmployeeRoleDto, ColumnKey>
      pageKey="kkd-roles"
      title={t('kkd.pages.roleDefinitionsTitle')}
      description={t('kkd.pages.roleDefinitionsDescription')}
      breadcrumbGroup={t('sidebar.kkd')}
      breadcrumbCurrent={t('kkd.pages.roleDefinitionsBreadcrumb')}
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
