import { type Dispatch, type ReactElement, type SetStateAction, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { PagedLookupDialog } from '@/components/shared/PagedLookupDialog';
import { SearchableSelect } from '@/features/goods-receipt/components/steps/components/SearchableSelect';
import { KkdCrudPage, renderKkdGenericCell, type KkdCrudField } from './KkdCrudPage';
import { kkdApi } from '../api/kkd.api';
import { lookupApi } from '@/services/lookup-api';
import type {
  CreateKkdEntitlementPolicyDto,
  KkdEmployeeDepartmentDto,
  KkdEmployeeDto,
  KkdEmployeeRoleDto,
  KkdEntitlementPolicyDto,
  KkdStockGroupOption,
  UpdateKkdEntitlementPolicyDto,
} from '../types/kkd.types';
import type { PagedDataGridColumn } from '@/components/shared';
import type { CustomerLookup } from '@/services/lookup-types';

type ColumnKey = 'groupCode' | 'groupName' | 'customerId' | 'totalQuantity' | 'periodType' | 'allowBulkIssue' | 'isActive';

const PERIOD_OPTIONS = [
  { value: 'Day', label: 'Günlük' },
  { value: 'Month', label: 'Aylık' },
  { value: 'Year', label: 'Yıllık' },
  { value: 'CustomRange', label: 'Özel Aralık' },
] as const;

function EntitlementPolicyForm({
  formState,
  setFormState,
}: {
  formState: CreateKkdEntitlementPolicyDto;
  setFormState: Dispatch<SetStateAction<CreateKkdEntitlementPolicyDto>>;
}): ReactElement {
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [employeeDialogOpen, setEmployeeDialogOpen] = useState(false);
  const [departmentDialogOpen, setDepartmentDialogOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const stockGroupsQuery = useQuery({
    queryKey: ['kkd', 'stock-groups'],
    queryFn: () => kkdApi.getStockGroups(),
  });

  const stockGroups = stockGroupsQuery.data ?? [];

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <Label>Cari *</Label>
        <PagedLookupDialog<CustomerLookup>
          open={customerDialogOpen}
          onOpenChange={setCustomerDialogOpen}
          title="Cari Seç"
          value={formState.customerId ? `${formState.customerId} / müşteri seçildi` : null}
          placeholder="Cari seçiniz"
          queryKey={['kkd', 'entitlement-form', 'customers']}
          fetchPage={({ pageNumber, pageSize, search, signal }) =>
            lookupApi.getCustomersPaged({ pageNumber, pageSize, search }, { signal })
          }
          getKey={(item) => String(item.id)}
          getLabel={(item) => `${item.cariKod} - ${item.cariIsim}`}
          onSelect={(item) => setFormState((prev) => ({ ...prev, customerId: item.id }))}
        />
      </div>

      <div className="space-y-2">
        <Label>Çalışan</Label>
        <PagedLookupDialog<KkdEmployeeDto>
          open={employeeDialogOpen}
          onOpenChange={setEmployeeDialogOpen}
          title="Çalışan Seç"
          value={formState.employeeId ? `#${formState.employeeId}` : null}
          placeholder="Çalışan seçiniz"
          queryKey={['kkd', 'entitlement-form', 'employees']}
          fetchPage={({ pageNumber, pageSize, search, signal }) =>
            kkdApi.getEmployees({ pageNumber, pageSize, search }, { signal })
          }
          getKey={(item) => String(item.id)}
          getLabel={(item) => `${item.employeeCode} - ${item.firstName} ${item.lastName}`}
          onSelect={(item) => setFormState((prev) => ({
            ...prev,
            employeeId: item.id,
            customerId: prev.customerId || item.customerId,
          }))}
        />
      </div>

      <div className="space-y-2">
        <Label>Bölüm</Label>
        <PagedLookupDialog<KkdEmployeeDepartmentDto>
          open={departmentDialogOpen}
          onOpenChange={setDepartmentDialogOpen}
          title="Bölüm Seç"
          value={formState.departmentId ? `#${formState.departmentId}` : null}
          placeholder="Bölüm seçiniz"
          queryKey={['kkd', 'entitlement-form', 'departments']}
          fetchPage={({ pageNumber, pageSize, search, signal }) =>
            kkdApi.getDepartments({ pageNumber, pageSize, search }, { signal })
          }
          getKey={(item) => String(item.id)}
          getLabel={(item) => `${item.departmentCode} - ${item.departmentName}`}
          onSelect={(item) => setFormState((prev) => ({ ...prev, departmentId: item.id }))}
        />
      </div>

      <div className="space-y-2">
        <Label>Görev</Label>
        <PagedLookupDialog<KkdEmployeeRoleDto>
          open={roleDialogOpen}
          onOpenChange={setRoleDialogOpen}
          title="Görev Seç"
          value={formState.roleId ? `#${formState.roleId}` : null}
          placeholder="Görev seçiniz"
          queryKey={['kkd', 'entitlement-form', 'roles']}
          fetchPage={({ pageNumber, pageSize, search, signal }) =>
            kkdApi.getRoles({ pageNumber, pageSize, search }, { signal })
          }
          getKey={(item) => String(item.id)}
          getLabel={(item) => `${item.roleCode} - ${item.roleName}`}
          onSelect={(item) => setFormState((prev) => ({ ...prev, roleId: item.id }))}
        />
      </div>

      <div className="space-y-2">
        <Label>Grup Kodu *</Label>
        <SearchableSelect<KkdStockGroupOption>
          value={formState.groupCode}
          onValueChange={(value) => {
            const selected = stockGroups.find((item) => item.groupCode === value);
            setFormState((prev) => ({
              ...prev,
              groupCode: value,
              groupName: selected?.groupName ?? '',
            }));
          }}
          options={stockGroups}
          getOptionValue={(item) => item.groupCode}
          getOptionLabel={(item) => `${item.groupCode}${item.groupName ? ` - ${item.groupName}` : ''}`}
          placeholder="Stok grubu seçiniz"
          searchPlaceholder="Grup kodu ara"
          emptyText="Grup bulunamadı"
          isLoading={stockGroupsQuery.isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label>Dönem Tipi *</Label>
        <SearchableSelect<{ value: string; label: string }>
          value={formState.periodType}
          onValueChange={(value) => setFormState((prev) => ({ ...prev, periodType: value }))}
          options={PERIOD_OPTIONS.map((item) => ({ ...item }))}
          getOptionValue={(item) => item.value}
          getOptionLabel={(item) => item.label}
          placeholder="Dönem tipi seçiniz"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="totalQuantity">Toplam Hak *</Label>
        <Input
          id="totalQuantity"
          type="number"
          step="0.01"
          value={formState.totalQuantity}
          onChange={(event) => setFormState((prev) => ({ ...prev, totalQuantity: Number(event.target.value) || 0 }))}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="periodStartDate">Başlangıç</Label>
        <Input
          id="periodStartDate"
          type="date"
          value={formState.periodStartDate?.slice(0, 10) ?? ''}
          onChange={(event) => setFormState((prev) => ({ ...prev, periodStartDate: event.target.value || null }))}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="periodEndDate">Bitiş</Label>
        <Input
          id="periodEndDate"
          type="date"
          value={formState.periodEndDate?.slice(0, 10) ?? ''}
          onChange={(event) => setFormState((prev) => ({ ...prev, periodEndDate: event.target.value || null }))}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="frequencyDays">Periyot Gün</Label>
        <Input
          id="frequencyDays"
          type="number"
          value={formState.frequencyDays ?? ''}
          onChange={(event) => setFormState((prev) => ({ ...prev, frequencyDays: event.target.value ? Number(event.target.value) : null }))}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="quantityPerFrequency">Periyot Başına Adet</Label>
        <Input
          id="quantityPerFrequency"
          type="number"
          step="0.01"
          value={formState.quantityPerFrequency ?? ''}
          onChange={(event) => setFormState((prev) => ({ ...prev, quantityPerFrequency: event.target.value ? Number(event.target.value) : null }))}
        />
      </div>

      <div className="space-y-3">
        <Label>Periyot Kuralı</Label>
        <div className="flex h-10 items-center rounded-xl border border-slate-200 px-3">
          <Switch
            checked={formState.hasFrequencyRule}
            onCheckedChange={(checked) => setFormState((prev) => ({ ...prev, hasFrequencyRule: checked }))}
          />
        </div>
      </div>

      <div className="space-y-3">
        <Label>Toplu Alıma İzin</Label>
        <div className="flex h-10 items-center rounded-xl border border-slate-200 px-3">
          <Switch
            checked={formState.allowBulkIssue}
            onCheckedChange={(checked) => setFormState((prev) => ({ ...prev, allowBulkIssue: checked }))}
          />
        </div>
      </div>
    </div>
  );
}

export function KkdEntitlementPolicyPage(): ReactElement {
  const columns = useMemo<PagedDataGridColumn<ColumnKey>[]>(() => [
    { key: 'groupCode', label: 'Grup Kodu' },
    { key: 'groupName', label: 'Grup Adı' },
    { key: 'customerId', label: 'Cari ID' },
    { key: 'totalQuantity', label: 'Toplam Hak' },
    { key: 'periodType', label: 'Dönem Tipi' },
    { key: 'allowBulkIssue', label: 'Toplu Alım' },
    { key: 'isActive', label: 'Aktif' },
  ], []);

  const fields: readonly KkdCrudField<CreateKkdEntitlementPolicyDto>[] = [
    { key: 'groupCode', label: 'Grup Kodu', type: 'text', required: true },
  ];

  return (
    <KkdCrudPage<KkdEntitlementPolicyDto, CreateKkdEntitlementPolicyDto, ColumnKey>
      pageKey="kkd-entitlement-policies"
      title="KKD Hak Tanımları"
      description="Grup kodu bazlı ana hak politikalarını yönetin."
      breadcrumbGroup="KKD"
      breadcrumbCurrent="Hak Tanımları"
      columns={columns}
      fields={fields}
      initialForm={{
        customerId: 0,
        employeeId: null,
        departmentId: null,
        roleId: null,
        groupCode: '',
        groupName: '',
        totalQuantity: 0,
        periodType: 'Year',
        periodStartDate: null,
        periodEndDate: null,
        hasFrequencyRule: false,
        frequencyDays: null,
        quantityPerFrequency: null,
        allowBulkIssue: true,
        isActive: true,
      }}
      getList={kkdApi.getEntitlementPolicies}
      createItem={kkdApi.createEntitlementPolicy}
      updateItem={(id, dto) => kkdApi.updateEntitlementPolicy(id, dto as UpdateKkdEntitlementPolicyDto)}
      deleteItem={kkdApi.deleteEntitlementPolicy}
      queryKey={['kkd', 'entitlement-policies']}
      mapSortBy={(value) => ({
        groupCode: 'GroupCode',
        groupName: 'GroupName',
        customerId: 'CustomerId',
        totalQuantity: 'TotalQuantity',
        periodType: 'PeriodType',
        allowBulkIssue: 'AllowBulkIssue',
        isActive: 'IsActive',
      }[value] ?? 'UpdatedDate')}
      renderCell={(row, columnKey) => renderKkdGenericCell(row[columnKey])}
      renderForm={({ formState, setFormState }) => (
        <EntitlementPolicyForm formState={formState} setFormState={setFormState} />
      )}
    />
  );
}
