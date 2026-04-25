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
import { lookupApi } from '@/services/lookup-api';
import type {
  CreateKkdAdditionalEntitlementDto,
  KkdAdditionalEntitlementDto,
  KkdEmployeeDto,
  KkdStockGroupOption,
  UpdateKkdAdditionalEntitlementDto,
} from '../types/kkd.types';
import type { PagedDataGridColumn } from '@/components/shared';
import type { CustomerLookup } from '@/services/lookup-types';

type ColumnKey = 'groupCode' | 'groupName' | 'employeeId' | 'extraQuantity' | 'consumedQuantity' | 'validFrom' | 'validTo' | 'isActive';

function AdditionalEntitlementForm({
  formState,
  setFormState,
}: {
  formState: CreateKkdAdditionalEntitlementDto;
  setFormState: Dispatch<SetStateAction<CreateKkdAdditionalEntitlementDto>>;
}): ReactElement {
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [employeeDialogOpen, setEmployeeDialogOpen] = useState(false);
  const [approverDialogOpen, setApproverDialogOpen] = useState(false);
  const stockGroupsQuery = useQuery({
    queryKey: ['kkd', 'stock-groups'],
    queryFn: () => kkdApi.getStockGroups(),
    retry: false,
  });

  const stockGroups = stockGroupsQuery.data ?? [];

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="md:col-span-2 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-sm leading-6 text-slate-700 dark:border-amber-800/30 dark:bg-amber-950/20 dark:text-slate-200">
        Bu ekran çalışan bazlı ek hak vermek için kullanılır.
      </div>

      <div className="space-y-2">
        <Label>Cari *</Label>
        <PagedLookupDialog<CustomerLookup>
          open={customerDialogOpen}
          onOpenChange={setCustomerDialogOpen}
          title="Cari Seç"
          value={formState.customerId ? `${formState.customerId} / müşteri seçildi` : null}
          placeholder="Cari seçiniz"
          queryKey={['kkd', 'additional-entitlement-form', 'customers']}
          fetchPage={({ pageNumber, pageSize, search, signal }) =>
            lookupApi.getCustomersPaged({ pageNumber, pageSize, search }, { signal })
          }
          getKey={(item) => String(item.id)}
          getLabel={(item) => `${item.cariKod} - ${item.cariIsim}`}
          onSelect={(item) => setFormState((prev) => ({ ...prev, customerId: item.id }))}
        />
      </div>

      <div className="space-y-2">
        <Label>Çalışan *</Label>
        <PagedLookupDialog<KkdEmployeeDto>
          open={employeeDialogOpen}
          onOpenChange={setEmployeeDialogOpen}
          title="Çalışan Seç"
          value={formState.employeeId ? `#${formState.employeeId}` : null}
          placeholder="Çalışan seçiniz"
          queryKey={['kkd', 'additional-entitlement-form', 'employees']}
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
        <Label htmlFor="extraQuantity">Ek Hak Adedi *</Label>
        <Input
          id="extraQuantity"
          type="number"
          step="0.01"
          value={formState.extraQuantity}
          onChange={(event) => setFormState((prev) => ({ ...prev, extraQuantity: Number(event.target.value) || 0 }))}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="validFrom">Geçerlilik Başlangıç *</Label>
        <Input
          id="validFrom"
          type="date"
          value={formState.validFrom?.slice(0, 10) ?? ''}
          onChange={(event) => setFormState((prev) => ({ ...prev, validFrom: event.target.value }))}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="validTo">Geçerlilik Bitiş</Label>
        <Input
          id="validTo"
          type="date"
          value={formState.validTo?.slice(0, 10) ?? ''}
          onChange={(event) => setFormState((prev) => ({ ...prev, validTo: event.target.value || null }))}
        />
      </div>

      <div className="space-y-2">
        <Label>Onaylayan Kullanıcı</Label>
        <PagedLookupDialog<UserDto>
          open={approverDialogOpen}
          onOpenChange={setApproverDialogOpen}
          title="Onaylayan Kullanıcı Seç"
          value={formState.approvedByUserId ? `#${formState.approvedByUserId}` : null}
          placeholder="Kullanıcı seçiniz"
          queryKey={['kkd', 'additional-entitlement-form', 'approvers']}
          fetchPage={({ pageNumber, pageSize, search }) =>
            userApi.getList({ pageNumber, pageSize, search })
          }
          getKey={(item) => String(item.id)}
          getLabel={(item) => item.fullName || item.username}
          onSelect={(item) => setFormState((prev) => ({ ...prev, approvedByUserId: item.id }))}
        />
      </div>

      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="description">Açıklama</Label>
        <Textarea
          id="description"
          value={formState.description ?? ''}
          onChange={(event) => setFormState((prev) => ({ ...prev, description: event.target.value }))}
        />
      </div>

      <div className="space-y-3">
        <Label>Aktif</Label>
        <div className="flex h-10 items-center rounded-xl border border-slate-200 px-3">
          <Switch
            checked={formState.isActive}
            onCheckedChange={(checked) => setFormState((prev) => ({ ...prev, isActive: checked }))}
          />
        </div>
      </div>
    </div>
  );
}

export function KkdAdditionalEntitlementPage(): ReactElement {
  const columns = useMemo<PagedDataGridColumn<ColumnKey>[]>(() => [
    { key: 'groupCode', label: 'Grup Kodu' },
    { key: 'groupName', label: 'Grup Adı' },
    { key: 'employeeId', label: 'Çalışan ID' },
    { key: 'extraQuantity', label: 'Ek Hak' },
    { key: 'consumedQuantity', label: 'Kullanılan' },
    { key: 'validFrom', label: 'Başlangıç' },
    { key: 'validTo', label: 'Bitiş' },
    { key: 'isActive', label: 'Aktif' },
  ], []);

  const fields: readonly KkdCrudField<CreateKkdAdditionalEntitlementDto>[] = [
    { key: 'groupCode', label: 'Grup Kodu', type: 'text', required: true },
  ];

  return (
    <KkdCrudPage<KkdAdditionalEntitlementDto, CreateKkdAdditionalEntitlementDto, ColumnKey>
      pageKey="kkd-additional-entitlements"
      title="KKD Kişi Bazlı İstisna ve Ek Haklar"
      description="Çalışan bazlı ek hak kayıtlarını yönetin."
      breadcrumbGroup="KKD"
      breadcrumbCurrent="Kişi Bazlı İstisna ve Ek Haklar"
      columns={columns}
      fields={fields}
      initialForm={{
        customerId: 0,
        employeeId: 0,
        groupCode: '',
        groupName: '',
        extraQuantity: 0,
        validFrom: '',
        validTo: null,
        description: '',
        approvedByUserId: null,
        isActive: true,
      }}
      getList={kkdApi.getAdditionalEntitlements}
      createItem={kkdApi.createAdditionalEntitlement}
      updateItem={(id, dto) => kkdApi.updateAdditionalEntitlement(id, dto as UpdateKkdAdditionalEntitlementDto)}
      deleteItem={kkdApi.deleteAdditionalEntitlement}
      queryKey={['kkd', 'additional-entitlements']}
      mapSortBy={(value) => ({
        groupCode: 'GroupCode',
        groupName: 'GroupName',
        employeeId: 'EmployeeId',
        extraQuantity: 'ExtraQuantity',
        consumedQuantity: 'ConsumedQuantity',
        validFrom: 'ValidFrom',
        validTo: 'ValidTo',
        isActive: 'IsActive',
      }[value] ?? 'UpdatedDate')}
      renderCell={(row, columnKey) => renderKkdGenericCell(row[columnKey])}
      renderForm={({ formState, setFormState }) => (
        <AdditionalEntitlementForm formState={formState} setFormState={setFormState} />
      )}
    />
  );
}
