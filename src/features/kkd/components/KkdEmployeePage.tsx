import { type Dispatch, type ReactElement, type SetStateAction, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { PagedLookupDialog } from '@/components/shared/PagedLookupDialog';
import { KkdCrudPage, renderKkdGenericCell, type KkdCrudField } from './KkdCrudPage';
import { kkdApi } from '../api/kkd.api';
import { lookupApi } from '@/services/lookup-api';
import type { CreateKkdEmployeeDto, KkdEmployeeDepartmentDto, KkdEmployeeDto, KkdEmployeeRoleDto, UpdateKkdEmployeeDto } from '../types/kkd.types';
import type { PagedDataGridColumn } from '@/components/shared';
import type { CustomerLookup } from '@/services/lookup-types';
import { userApi } from '@/features/user-management/api/user-api';
import type { UserDto } from '@/features/user-management/types/user-types';
import { FieldHelpTooltip } from '@/features/access-control/components/FieldHelpTooltip';

type ColumnKey = 'employeeCode' | 'firstName' | 'lastName' | 'customerCode' | 'departmentName' | 'roleName' | 'isActive';

function EmployeeForm({
  formState,
  setFormState,
}: {
  formState: CreateKkdEmployeeDto;
  setFormState: Dispatch<SetStateAction<CreateKkdEmployeeDto>>;
}): ReactElement {
  const { t } = useTranslation();
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [departmentDialogOpen, setDepartmentDialogOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);

  const labelWithHelp = (label: string, helpKey: string): ReactElement => (
    <div className="flex items-center">
      <Label>{label}</Label>
      <FieldHelpTooltip text={t(helpKey)} />
    </div>
  );

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2 md:col-span-2">
        {labelWithHelp('Sistem Kullanıcısı *', 'help.kkd.employee.user')}
        <PagedLookupDialog<UserDto>
          open={userDialogOpen}
          onOpenChange={setUserDialogOpen}
          title="Kullanıcı Seç"
          value={formState.userId ? `${formState.firstName} ${formState.lastName}`.trim() : null}
          placeholder="Kullanıcı seçiniz"
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
      </div>

      <div className="space-y-2">
        {labelWithHelp('Cari *', 'help.kkd.employee.customer')}
        <PagedLookupDialog<CustomerLookup>
          open={customerDialogOpen}
          onOpenChange={setCustomerDialogOpen}
          title="Cari Seç"
          value={formState.customerCode ? `${formState.customerCode}` : null}
          placeholder="Cari seçiniz"
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
      </div>

      <div className="space-y-2">
        <div className="flex items-center">
          <Label htmlFor="employeeCode">Personel Kodu *</Label>
          <FieldHelpTooltip text={t('help.kkd.employee.employeeCode')} />
        </div>
        <Input
          id="employeeCode"
          value={formState.employeeCode}
          onChange={(event) => setFormState((prev) => ({ ...prev, employeeCode: event.target.value }))}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="firstName">Ad</Label>
        <Input
          id="firstName"
          value={formState.firstName}
          readOnly
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="lastName">Soyad</Label>
        <Input
          id="lastName"
          value={formState.lastName}
          readOnly
        />
      </div>

      <div className="space-y-2">
        {labelWithHelp('Bölüm', 'help.kkd.employee.department')}
        <PagedLookupDialog<KkdEmployeeDepartmentDto>
          open={departmentDialogOpen}
          onOpenChange={setDepartmentDialogOpen}
          title="Bölüm Seç"
          value={formState.departmentCode ? `${formState.departmentCode} - ${formState.departmentName ?? ''}` : null}
          placeholder="Bölüm seçiniz"
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
      </div>

      <div className="space-y-2">
        {labelWithHelp('Görev', 'help.kkd.employee.role')}
        <PagedLookupDialog<KkdEmployeeRoleDto>
          open={roleDialogOpen}
          onOpenChange={(open) => {
            if (!formState.departmentId) {
              setRoleDialogOpen(false);
              return;
            }
            setRoleDialogOpen(open);
          }}
          title="Görev Seç"
          value={formState.roleCode ? `${formState.roleCode} - ${formState.roleName ?? ''}` : null}
          placeholder={formState.departmentId ? 'Görev seçiniz' : 'Önce bölüm seçiniz'}
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
      </div>

      <div className="space-y-2 md:col-span-2">
        <div className="flex items-center">
          <Label htmlFor="employmentStartDate">İşe Giriş Tarihi *</Label>
          <FieldHelpTooltip text={t('help.kkd.employee.employmentStartDate')} />
        </div>
        <Input
          id="employmentStartDate"
          type="date"
          value={formState.employmentStartDate}
          onChange={(event) => setFormState((prev) => ({ ...prev, employmentStartDate: event.target.value }))}
        />
      </div>

      <div className="space-y-2 md:col-span-2">
        <div className="flex items-center">
          <Label htmlFor="qrCode">QR Kod *</Label>
          <FieldHelpTooltip text={t('help.kkd.employee.qrCode')} />
        </div>
        <Input
          id="qrCode"
          value={formState.qrCode}
          onChange={(event) => setFormState((prev) => ({ ...prev, qrCode: event.target.value }))}
          placeholder="Çalışana ait QR referansı"
        />
      </div>
    </div>
  );
}

export function KkdEmployeePage(): ReactElement {
  const { t } = useTranslation('common');
  const columns = useMemo<PagedDataGridColumn<ColumnKey>[]>(() => [
    { key: 'employeeCode', label: t('kkd.columns.employeeCode') },
    { key: 'firstName', label: t('kkd.columns.firstName') },
    { key: 'lastName', label: t('kkd.columns.lastName') },
    { key: 'customerCode', label: t('kkd.columns.customerCode') },
    { key: 'departmentName', label: t('kkd.columns.department') },
    { key: 'roleName', label: t('kkd.columns.role') },
    { key: 'isActive', label: t('common.active') },
  ], [t]);

  const fields: readonly KkdCrudField<CreateKkdEmployeeDto>[] = [
    { key: 'userId', label: 'Sistem Kullanıcısı', type: 'number', required: true },
    { key: 'customerId', label: 'Cari', type: 'number', required: true },
    { key: 'customerCode', label: 'Cari Kodu', type: 'text', required: true },
    { key: 'employeeCode', label: 'Personel Kodu', type: 'text', required: true },
    { key: 'firstName', label: 'Ad', type: 'text' },
    { key: 'lastName', label: 'Soyad', type: 'text' },
    { key: 'departmentId', label: 'Bölüm', type: 'number' },
    { key: 'departmentCode', label: 'Bölüm Kodu', type: 'text' },
    { key: 'departmentName', label: 'Bölüm Adı', type: 'text' },
    { key: 'roleId', label: 'Görev', type: 'number' },
    { key: 'roleCode', label: 'Görev Kodu', type: 'text' },
    { key: 'roleName', label: 'Görev Adı', type: 'text' },
    { key: 'employmentStartDate', label: 'İşe Giriş Tarihi', type: 'text', required: true },
    { key: 'qrCode', label: 'QR Kod', type: 'text', required: true },
    { key: 'isActive', label: 'Aktif', type: 'boolean' },
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
      mapSortBy={(value) => ({
        employeeCode: 'EmployeeCode',
        firstName: 'FirstName',
        lastName: 'LastName',
        customerCode: 'CustomerCode',
        departmentName: 'DepartmentName',
        roleName: 'RoleName',
        isActive: 'IsActive',
      }[value] ?? 'EmployeeCode')}
      renderCell={(row, columnKey) => renderKkdGenericCell(row[columnKey])}
      renderForm={({ formState, setFormState }) => (
        <EmployeeForm formState={formState} setFormState={setFormState} />
      )}
    />
  );
}
