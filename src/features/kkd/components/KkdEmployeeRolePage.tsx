import { type Dispatch, type ReactElement, type SetStateAction, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { OpsInput } from '@/components/shared';
import { PagedLookupDialog } from '@/components/shared/PagedLookupDialog';
import { KkdCrudPage, renderKkdGenericCell, type KkdCrudField } from './KkdCrudPage';
import { KkdOpsFormField } from './kkd-ops-ui';
import { kkdApi } from '../api/kkd.api';
import type { CreateKkdEmployeeRoleDto, KkdEmployeeDepartmentDto, KkdEmployeeRoleDto, UpdateKkdEmployeeRoleDto } from '../types/kkd.types';
import type { PagedDataGridColumn } from '@/components/shared';

type ColumnKey = 'departmentCode' | 'departmentName' | 'roleCode' | 'roleName' | 'updatedDate' | 'isActive';

function RoleForm({
  formState,
  setFormState,
}: {
  formState: CreateKkdEmployeeRoleDto;
  setFormState: Dispatch<SetStateAction<CreateKkdEmployeeRoleDto>>;
}): ReactElement {
  const { t } = useTranslation(['kkd', 'common']);
  const [departmentDialogOpen, setDepartmentDialogOpen] = useState(false);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <KkdOpsFormField
        label={(
          <>
            {t('kkd.columns.department')}
            <span className="ml-1 text-destructive" aria-hidden>*</span>
          </>
        )}
        className="md:col-span-2"
      >
        <PagedLookupDialog<KkdEmployeeDepartmentDto>
          variant="ops"
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
      </KkdOpsFormField>

      <KkdOpsFormField
        label={(
          <>
            {t('kkd.columns.roleCode')}
            <span className="ml-1 text-destructive" aria-hidden>*</span>
          </>
        )}
        htmlFor="roleCode"
      >
        <OpsInput
          id="roleCode"
          value={formState.roleCode}
          onChange={(event) => setFormState((prev) => ({ ...prev, roleCode: event.target.value }))}
          placeholder={t('kkd.placeholders.enterRoleCode')}
        />
      </KkdOpsFormField>

      <KkdOpsFormField
        label={(
          <>
            {t('kkd.columns.roleName')}
            <span className="ml-1 text-destructive" aria-hidden>*</span>
          </>
        )}
        htmlFor="roleName"
      >
        <OpsInput
          id="roleName"
          value={formState.roleName}
          onChange={(event) => setFormState((prev) => ({ ...prev, roleName: event.target.value }))}
          placeholder={t('kkd.placeholders.enterRoleName')}
        />
      </KkdOpsFormField>
    </div>
  );
}

export function KkdEmployeeRolePage(): ReactElement {
  const { t } = useTranslation(['kkd', 'common']);
  const queryClient = useQueryClient();
  const columns = useMemo<PagedDataGridColumn<ColumnKey>[]>(() => [
    { key: 'departmentCode', label: t('kkd.columns.departmentCode') },
    { key: 'departmentName', label: t('kkd.columns.department') },
    { key: 'roleCode', label: t('kkd.columns.roleCode') },
    { key: 'roleName', label: t('kkd.columns.roleName') },
    { key: 'updatedDate', label: t('common.updatedDate') },
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
      definitionExcel={{
        definitionKey: 'kkd-employee-role',
        fileNamePrefix: 'kkd-gorev-tanimlari',
        onImportCompleted: () => queryClient.invalidateQueries({ queryKey: ['kkd', 'roles'] }),
      }}
      mapSortBy={(value) => value === 'departmentCode' ? 'DepartmentCode' : value === 'departmentName' ? 'DepartmentName' : value === 'roleName' ? 'RoleName' : value === 'updatedDate' ? 'UpdatedDate' : value === 'isActive' ? 'IsActive' : 'RoleCode'}
      renderCell={(row, columnKey) => renderKkdGenericCell(row[columnKey])}
      renderForm={({ formState, setFormState }) => (
        <RoleForm formState={formState} setFormState={setFormState} />
      )}
    />
  );
}
