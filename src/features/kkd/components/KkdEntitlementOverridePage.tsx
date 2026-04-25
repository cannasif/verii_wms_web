import { type Dispatch, type ReactElement, type SetStateAction, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { PagedLookupDialog } from '@/components/shared/PagedLookupDialog';
import { SearchableSelect } from '@/features/goods-receipt/components/steps/components/SearchableSelect';
import { userApi } from '@/features/user-management/api/user-api';
import type { UserDto } from '@/features/user-management/types/user-types';
import { KkdCrudPage, renderKkdGenericCell, type KkdCrudField } from './KkdCrudPage';
import { kkdApi } from '../api/kkd.api';
import type {
  CreateKkdEntitlementOverrideDto,
  KkdEmployeeDto,
  KkdEntitlementOverrideDto,
  KkdStockGroupOption,
  UpdateKkdEntitlementOverrideDto,
} from '../types/kkd.types';
import type { PagedDataGridColumn } from '@/components/shared';

type ColumnKey = 'groupCode' | 'employeeName' | 'extraQuantity' | 'consumedQuantity' | 'validFrom' | 'validTo' | 'isActive';

function KkdEntitlementOverrideForm({
  formState,
  setFormState,
}: {
  formState: CreateKkdEntitlementOverrideDto;
  setFormState: Dispatch<SetStateAction<CreateKkdEntitlementOverrideDto>>;
}): ReactElement {
  const [employeeDialogOpen, setEmployeeDialogOpen] = useState(false);
  const [approverDialogOpen, setApproverDialogOpen] = useState(false);
  const stockGroupsQuery = useQuery({
    queryKey: ['kkd', 'override-form', 'stock-groups'],
    queryFn: () => kkdApi.getStockGroups(),
    retry: false,
  });

  const stockGroups = stockGroupsQuery.data ?? [];

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="md:col-span-2 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-sm leading-6 text-slate-700">
        Bu ekran ana kural için değil, istisnai çalışan ihtiyaçları için manuel ek hak vermek amacıyla kullanılır.
      </div>

      <div className="space-y-2">
        <Label>Çalışan *</Label>
        <PagedLookupDialog<KkdEmployeeDto>
          open={employeeDialogOpen}
          onOpenChange={setEmployeeDialogOpen}
          title="Çalışan Seç"
          value={formState.employeeId ? `#${formState.employeeId}` : null}
          placeholder="Çalışan seçiniz"
          queryKey={['kkd', 'override-form', 'employees']}
          fetchPage={({ pageNumber, pageSize, search, signal }) =>
            kkdApi.getEmployees({ pageNumber, pageSize, search }, { signal })
          }
          getKey={(item) => String(item.id)}
          getLabel={(item) => `${item.employeeCode} - ${item.firstName} ${item.lastName}`}
          onSelect={(item) => setFormState((prev) => ({ ...prev, employeeId: item.id }))}
        />
      </div>

      <div className="space-y-2">
        <Label>Grup Kodu *</Label>
        <SearchableSelect<KkdStockGroupOption>
          value={formState.groupCode}
          onValueChange={(value) => {
            const selected = stockGroups.find((item) => item.groupCode === value);
            setFormState((prev) => ({ ...prev, groupCode: value, groupName: selected?.groupName ?? '' }));
          }}
          options={stockGroups}
          getOptionValue={(item) => item.groupCode}
          getOptionLabel={(item) => `${item.groupCode}${item.groupName ? ` - ${item.groupName}` : ''}`}
          placeholder="Stok grubu seçiniz"
          searchPlaceholder="Grup ara"
          emptyText="Grup bulunamadı"
          isLoading={stockGroupsQuery.isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label>Ek Hak *</Label>
        <Input type="number" step="0.01" value={formState.extraQuantity} onChange={(event) => setFormState((prev) => ({ ...prev, extraQuantity: Number(event.target.value) || 0 }))} />
      </div>

      <div className="space-y-2">
        <Label>Başlangıç *</Label>
        <Input type="date" value={formState.validFrom?.slice(0, 10) ?? ''} onChange={(event) => setFormState((prev) => ({ ...prev, validFrom: event.target.value }))} />
      </div>

      <div className="space-y-2">
        <Label>Bitiş</Label>
        <Input type="date" value={formState.validTo?.slice(0, 10) ?? ''} onChange={(event) => setFormState((prev) => ({ ...prev, validTo: event.target.value || null }))} />
      </div>

      <div className="space-y-2">
        <Label>Onaylayan</Label>
        <PagedLookupDialog<UserDto>
          open={approverDialogOpen}
          onOpenChange={setApproverDialogOpen}
          title="Onaylayan Seç"
          value={formState.approvedByUserId ? `#${formState.approvedByUserId}` : null}
          placeholder="Kullanıcı seçiniz"
          queryKey={['kkd', 'override-form', 'approvers']}
          fetchPage={({ pageNumber, pageSize, search }) => userApi.getList({ pageNumber, pageSize, search })}
          getKey={(item) => String(item.id)}
          getLabel={(item) => item.fullName || item.username}
          onSelect={(item) => setFormState((prev) => ({ ...prev, approvedByUserId: item.id }))}
        />
      </div>

      <div className="space-y-2 md:col-span-2">
        <Label>Açıklama</Label>
        <Textarea value={formState.reason ?? ''} onChange={(event) => setFormState((prev) => ({ ...prev, reason: event.target.value }))} />
      </div>

      <div className="space-y-3">
        <Label>Aktif</Label>
        <div className="flex h-10 items-center rounded-xl border border-slate-200 px-3">
          <Switch checked={formState.isActive} onCheckedChange={(checked) => setFormState((prev) => ({ ...prev, isActive: checked }))} />
        </div>
      </div>
    </div>
  );
}

export function KkdEntitlementOverridePage(): ReactElement {
  const columns = useMemo<PagedDataGridColumn<ColumnKey>[]>(() => [
    { key: 'groupCode', label: 'Grup Kodu' },
    { key: 'employeeName', label: 'Çalışan' },
    { key: 'extraQuantity', label: 'Ek Hak' },
    { key: 'consumedQuantity', label: 'Kullanılan' },
    { key: 'validFrom', label: 'Başlangıç' },
    { key: 'validTo', label: 'Bitiş' },
    { key: 'isActive', label: 'Aktif' },
  ], []);

  const fields: readonly KkdCrudField<CreateKkdEntitlementOverrideDto>[] = [
    { key: 'groupCode', label: 'Grup Kodu', type: 'text', required: true },
  ];

  return (
    <KkdCrudPage<KkdEntitlementOverrideDto, CreateKkdEntitlementOverrideDto, ColumnKey>
      pageKey="kkd-entitlement-overrides"
      title="KKD Manuel İstisnalar"
      description="İstisnai çalışan ihtiyaçları için manuel ek hak kayıtlarını yönetin."
      breadcrumbGroup="KKD"
      breadcrumbCurrent="Manuel İstisnalar"
      columns={columns}
      fields={fields}
      initialForm={{
        employeeId: 0,
        matrixLineId: null,
        groupCode: '',
        groupName: '',
        extraQuantity: 0,
        validFrom: '',
        validTo: null,
        reason: '',
        approvedByUserId: null,
        isActive: true,
      }}
      getList={kkdApi.getEntitlementOverrides}
      createItem={kkdApi.createEntitlementOverride}
      updateItem={(id, dto) => kkdApi.updateEntitlementOverride(id, dto as UpdateKkdEntitlementOverrideDto)}
      deleteItem={kkdApi.deleteEntitlementOverride}
      queryKey={['kkd', 'entitlement-overrides']}
      mapSortBy={(value) => ({
        groupCode: 'GroupCode',
        employeeName: 'EmployeeName',
        extraQuantity: 'ExtraQuantity',
        consumedQuantity: 'ConsumedQuantity',
        validFrom: 'ValidFrom',
        validTo: 'ValidTo',
        isActive: 'IsActive',
      }[value] ?? 'UpdatedDate')}
      renderCell={(row, columnKey) => renderKkdGenericCell(row[columnKey])}
      renderForm={({ formState, setFormState }) => (
        <KkdEntitlementOverrideForm formState={formState} setFormState={setFormState} />
      )}
    />
  );
}
