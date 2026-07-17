import { type Dispatch, type ReactElement, type SetStateAction, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { OpsInput } from '@/components/shared';
import { PagedLookupDialog } from '@/components/shared/PagedLookupDialog';
import type { PagedDataGridColumn } from '@/components/shared';
import { KkdCrudPage, renderKkdGenericCell, type KkdCrudField } from './KkdCrudPage';
import { KkdOpsFormField } from './kkd-ops-ui';
import { kkdApi } from '../api/kkd.api';
import { lookupApi } from '@/features/shared/api/lookup-api';
import type { CreateKkdEmployeeDto, KkdEmployeeDepartmentDto, KkdEmployeeDto, KkdEmployeeRoleDto, UpdateKkdEmployeeDto } from '../types/kkd.types';
import type { CustomerLookup } from '@/features/shared/api/lookup-types';
import { userApi } from '@/features/user-management/api/user-api';
import type { UserDto } from '@/features/user-management/types/user-types';
import { FieldHelpTooltip } from '@/features/access-control/components/FieldHelpTooltip';

type ColumnKey = 'employeeCode' | 'firstName' | 'lastName' | 'customerCode' | 'employmentStartDate' | 'qrCode' | 'departmentName' | 'roleName' | 'isActive';

function resolveCustomerText(row: Pick<KkdEmployeeDto, 'customerCode' | 'customerName' | 'customerId'>): string {
  const code = row.customerCode?.trim();
  const name = row.customerName?.trim();
  if (code || name) {
    return `${code || ''}${code && name ? ' - ' : ''}${name || ''}`.trim();
  }

  return row.customerId ? `#${row.customerId}` : '-';
}

function EmployeeForm({
  formState,
  setFormState,
}: {
  formState: CreateKkdEmployeeDto;
  setFormState: Dispatch<SetStateAction<CreateKkdEmployeeDto>>;
}): ReactElement {
  const { t } = useTranslation(['kkd', 'common']);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [departmentDialogOpen, setDepartmentDialogOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);

  const labelWithHelp = (label: string, helpKey: string, focusable = true): ReactElement => (
    <div className="flex items-center">
      {label}
      <FieldHelpTooltip text={t(helpKey)} focusable={focusable} />
    </div>
  );

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <KkdOpsFormField
        label={labelWithHelp(t('kkd.employeeForm.systemUser'), 'help.kkd.employee.user', false)}
        className="md:col-span-2"
      >
        <PagedLookupDialog<UserDto>
          variant="ops"
          open={userDialogOpen}
          onOpenChange={setUserDialogOpen}
          title={t('kkd.employeeForm.selectUser')}
          value={formState.userId ? `${formState.firstName} ${formState.lastName}`.trim() : null}
          placeholder={t('kkd.employeeForm.userPlaceholder')}
          queryKey={['kkd', 'employee-form', 'users']}
          fetchPage={({ pageNumber, pageSize, search }) =>
            userApi.getList({
              pageNumber,
              pageSize,
              search,
              filters: [{ column: 'IsActive', operator: 'eq', value: 'true' }],
            })
          }
          getKey={(item) => String(item.id)}
          getLabel={(item) => `${item.fullName || item.username} - ${item.email}`}
          onSelect={(item) => setFormState((prev) => ({
            ...prev,
            userId: item.id,
            firstName: item.firstName ?? item.username,
            lastName: item.lastName ?? '',
          }))}
        />
      </KkdOpsFormField>

      <KkdOpsFormField label={labelWithHelp(t('kkd.employeeForm.customer'), 'help.kkd.employee.customer')}>
        <PagedLookupDialog<CustomerLookup>
          variant="ops"
          open={customerDialogOpen}
          onOpenChange={setCustomerDialogOpen}
          title={t('kkd.employeeForm.selectCustomer')}
          value={formState.customerCode ? `${formState.customerCode}` : null}
          placeholder={t('kkd.employeeForm.customerPlaceholder')}
          queryKey={['kkd', 'employee-form', 'customers']}
          fetchPage={({ pageNumber, pageSize, search, signal }) =>
            lookupApi.getCustomersPaged({ pageNumber, pageSize, search }, { signal })
          }
          getKey={(item) => String(item.id)}
          getLabel={(item) => `${item.cariKod} - ${item.cariIsim}`}
          onSelect={(item) => setFormState((prev) => ({
            ...prev,
            customerId: item.id,
            customerCode: item.cariKod,
          }))}
        />
      </KkdOpsFormField>

      <KkdOpsFormField
        label={labelWithHelp(t('kkd.employeeForm.employeeCode'), 'help.kkd.employee.employeeCode')}
        htmlFor="employeeCode"
      >
        <OpsInput
          id="employeeCode"
          value={formState.employeeCode}
          onChange={(event) => setFormState((prev) => ({ ...prev, employeeCode: event.target.value }))}
        />
      </KkdOpsFormField>

      <KkdOpsFormField label={t('kkd.employeeForm.firstName')} htmlFor="firstName">
        <OpsInput
          id="firstName"
          value={formState.firstName}
          readOnly
        />
      </KkdOpsFormField>

      <KkdOpsFormField label={t('kkd.employeeForm.lastName')} htmlFor="lastName">
        <OpsInput
          id="lastName"
          value={formState.lastName}
          readOnly
        />
      </KkdOpsFormField>

      <KkdOpsFormField label={labelWithHelp(t('kkd.employeeForm.department'), 'help.kkd.employee.department')}>
        <PagedLookupDialog<KkdEmployeeDepartmentDto>
          variant="ops"
          open={departmentDialogOpen}
          onOpenChange={setDepartmentDialogOpen}
          title={t('kkd.employeeForm.selectDepartment')}
          value={formState.departmentCode ? `${formState.departmentCode} - ${formState.departmentName ?? ''}` : null}
          placeholder={t('kkd.employeeForm.departmentPlaceholder')}
          queryKey={['kkd', 'employee-form', 'departments']}
          fetchPage={({ pageNumber, pageSize, search, signal }) =>
            kkdApi.getDepartments({ pageNumber, pageSize, search }, { signal })
          }
          getKey={(item) => String(item.id)}
          getLabel={(item) => `${item.departmentCode} - ${item.departmentName}`}
          onSelect={(item) => setFormState((prev) => ({
            ...prev,
            departmentId: item.id,
            departmentCode: item.departmentCode,
            departmentName: item.departmentName,
            roleId: null,
            roleCode: '',
            roleName: '',
          }))}
        />
      </KkdOpsFormField>

      <KkdOpsFormField label={labelWithHelp(t('kkd.employeeForm.role'), 'help.kkd.employee.role')}>
        <PagedLookupDialog<KkdEmployeeRoleDto>
          variant="ops"
          open={roleDialogOpen}
          onOpenChange={(open) => {
            if (!formState.departmentId) {
              setRoleDialogOpen(false);
              return;
            }
            setRoleDialogOpen(open);
          }}
          title={formState.departmentId ? t('kkd.employeeForm.selectRole') : t('kkd.employeeForm.selectRoleDisabled')}
          value={formState.roleCode ? `${formState.roleCode} - ${formState.roleName ?? ''}` : null}
          placeholder={formState.departmentId ? t('kkd.employeeForm.selectRolePlaceholder') : t('kkd.employeeForm.selectRoleDisabled')}
          disabled={!formState.departmentId}
          queryKey={['kkd', 'employee-form', 'roles', formState.departmentId ?? 0]}
          fetchPage={({ pageNumber, pageSize, search, signal }) =>
            kkdApi.getRoles({
              pageNumber,
              pageSize,
              search,
              filters: formState.departmentId
                ? [{ column: 'DepartmentId', operator: 'eq', value: String(formState.departmentId) }]
                : [],
            }, { signal })
          }
          getKey={(item) => String(item.id)}
          getLabel={(item) => `${item.roleCode} - ${item.roleName}`}
          onSelect={(item) => setFormState((prev) => ({
            ...prev,
            roleId: item.id,
            roleCode: item.roleCode,
            roleName: item.roleName,
          }))}
        />
      </KkdOpsFormField>

      <KkdOpsFormField
        label={labelWithHelp(t('kkd.employeeForm.employmentStartDate'), 'help.kkd.employee.employmentStartDate')}
        htmlFor="employmentStartDate"
        className="md:col-span-2"
      >
        <OpsInput
          id="employmentStartDate"
          type="date"
          value={formState.employmentStartDate}
          onChange={(event) => setFormState((prev) => ({ ...prev, employmentStartDate: event.target.value }))}
        />
      </KkdOpsFormField>

      <KkdOpsFormField
        label={labelWithHelp(t('kkd.employeeForm.qrCode'), 'help.kkd.employee.qrCode')}
        htmlFor="qrCode"
        className="md:col-span-2"
      >
        <OpsInput
          id="qrCode"
          value={formState.qrCode}
          onChange={(event) => setFormState((prev) => ({ ...prev, qrCode: event.target.value }))}
          placeholder={t('kkd.employeeForm.qrPlaceholder')}
        />
      </KkdOpsFormField>
    </div>
  );
}

export function KkdEmployeePage(): ReactElement {
  const { t } = useTranslation(['kkd', 'common']);
  const queryClient = useQueryClient();
  const columns = useMemo<PagedDataGridColumn<ColumnKey>[]>(() => [
    { key: 'employeeCode', label: t('kkd.columns.employeeCode') },
    { key: 'firstName', label: t('kkd.columns.firstName') },
    { key: 'lastName', label: t('kkd.columns.lastName') },
    { key: 'customerCode', label: t('kkd.columns.customerCode') },
    { key: 'employmentStartDate', label: t('kkd.columns.employmentStartDate') },
    { key: 'qrCode', label: t('kkd.columns.qrCode') },
    { key: 'departmentName', label: t('kkd.columns.department') },
    { key: 'roleName', label: t('kkd.columns.role') },
    { key: 'isActive', label: t('common.active') },
  ], [t]);

  const fields: readonly KkdCrudField<CreateKkdEmployeeDto>[] = [
    { key: 'userId', label: t('kkd.employeeForm.systemUserId'), type: 'number', required: true },
    { key: 'customerId', label: t('kkd.employeeForm.customerId'), type: 'number', required: true },
    { key: 'customerCode', label: t('kkd.employeeForm.customerCode'), type: 'text', required: true },
    { key: 'employeeCode', label: t('kkd.employeeForm.employeeCode'), type: 'text', required: true },
    { key: 'firstName', label: t('kkd.columns.firstName'), type: 'text' },
    { key: 'lastName', label: t('kkd.columns.lastName'), type: 'text' },
    { key: 'departmentId', label: t('kkd.employeeForm.department'), type: 'number' },
    { key: 'departmentCode', label: t('kkd.columns.departmentCode'), type: 'text' },
    { key: 'departmentName', label: t('kkd.columns.departmentName'), type: 'text' },
    { key: 'roleId', label: t('kkd.employeeForm.role'), type: 'number' },
    { key: 'roleCode', label: t('kkd.columns.roleCode'), type: 'text' },
    { key: 'roleName', label: t('kkd.columns.roleName'), type: 'text' },
    { key: 'employmentStartDate', label: t('kkd.employeeForm.employmentStartDate'), type: 'text', required: true },
    { key: 'qrCode', label: t('kkd.employeeForm.qrCode'), type: 'text', required: true },
    { key: 'isActive', label: t('common.active'), type: 'boolean' },
  ];

  return (
    <KkdCrudPage<KkdEmployeeDto, CreateKkdEmployeeDto, ColumnKey>
      pageKey="kkd-employees"
      title={t('kkd.pages.employeeCardsTitle')}
      description={t('kkd.pages.employeeCardsDescription')}
      breadcrumbGroup={t('sidebar.kkd')}
      breadcrumbCurrent={t('kkd.pages.employeeCardsBreadcrumb')}
      columns={columns}
      fields={fields}
      initialForm={{
        userId: 0,
        customerId: 0,
        customerCode: '',
        employeeCode: '',
        firstName: '',
        lastName: '',
        departmentId: null,
        departmentCode: '',
        departmentName: '',
        roleId: null,
        roleCode: '',
        roleName: '',
        employmentStartDate: new Date().toISOString().slice(0, 10),
        qrCode: '',
        isActive: true,
      }}
      getList={kkdApi.getEmployees}
      createItem={kkdApi.createEmployee}
      updateItem={(id, dto) => kkdApi.updateEmployee(id, dto as UpdateKkdEmployeeDto)}
      deleteItem={kkdApi.deleteEmployee}
      queryKey={['kkd', 'employees']}
      definitionExcel={{
        definitionKey: 'kkd-employee',
        fileNamePrefix: 'kkd-calisan-kartlari',
        onImportCompleted: () => queryClient.invalidateQueries({ queryKey: ['kkd', 'employees'] }),
      }}
      mapSortBy={(value) => ({
        employeeCode: 'EmployeeCode',
        firstName: 'FirstName',
        lastName: 'LastName',
        customerCode: 'CustomerCode',
        employmentStartDate: 'EmploymentStartDate',
        qrCode: 'QrCode',
        departmentName: 'DepartmentName',
        roleName: 'RoleName',
        isActive: 'IsActive',
      }[value] ?? 'EmployeeCode')}
      renderCell={(row, columnKey) => {
        if (columnKey === 'customerCode') {
          return resolveCustomerText(row);
        }

        return renderKkdGenericCell(row[columnKey]);
      }}
      renderForm={({ formState, setFormState }) => (
        <EmployeeForm formState={formState} setFormState={setFormState} />
      )}
    />
  );
}
