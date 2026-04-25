import { type Dispatch, type ReactElement, type SetStateAction, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { PagedLookupDialog } from '@/components/shared/PagedLookupDialog';
import { SearchableSelect } from '@/features/goods-receipt/components/steps/components/SearchableSelect';
import { KkdCrudPage, renderKkdGenericCell, type KkdCrudField } from './KkdCrudPage';
import { kkdApi } from '../api/kkd.api';
import type {
  CreateKkdEntitlementMatrixRowDto,
  KkdEmployeeDepartmentDto,
  KkdEmployeeRoleDto,
  KkdEntitlementMatrixRowDto,
  KkdStockGroupOption,
  UpdateKkdEntitlementMatrixRowDto,
} from '../types/kkd.types';
import type { PagedDataGridColumn } from '@/components/shared';

type ColumnKey =
  | 'departmentName'
  | 'roleName'
  | 'groupCode'
  | 'initialIssueQuantity'
  | 'routinePeriodType'
  | 'routineQuantity'
  | 'additionalAfterMonthsQuantity'
  | 'isActive';

const PERIOD_OPTIONS = [
  { value: 'Day', label: 'Günlük' },
  { value: 'Month', label: 'Aylık' },
  { value: 'Year', label: 'Yıllık' },
] as const;

function KkdEntitlementMatrixForm({
  formState,
  setFormState,
}: {
  formState: CreateKkdEntitlementMatrixRowDto;
  setFormState: Dispatch<SetStateAction<CreateKkdEntitlementMatrixRowDto>>;
}): ReactElement {
  const [departmentDialogOpen, setDepartmentDialogOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const stockGroupsQuery = useQuery({
    queryKey: ['kkd', 'matrix-form', 'stock-groups'],
    queryFn: () => kkdApi.getStockGroups(),
    retry: false,
  });

  const stockGroups = stockGroupsQuery.data ?? [];

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="md:col-span-2 rounded-2xl border border-cyan-200 bg-cyan-50/80 p-4 text-sm leading-6 text-slate-700">
        Bu ekranda haklar kişi için değil, bölüm ve görev tanımı için tanımlanır. Çalışanlar bağlı oldukları görev matrisinden hak alır.
      </div>
      <div className="space-y-2">
        <Label>Matris Kodu *</Label>
        <Input value={formState.matrixCode} onChange={(event) => setFormState((prev) => ({ ...prev, matrixCode: event.target.value }))} />
      </div>

      <div className="space-y-2">
        <Label>Matris Adı *</Label>
        <Input value={formState.matrixName} onChange={(event) => setFormState((prev) => ({ ...prev, matrixName: event.target.value }))} />
      </div>

      <div className="space-y-2">
        <Label>Bölüm *</Label>
        <PagedLookupDialog<KkdEmployeeDepartmentDto>
          open={departmentDialogOpen}
          onOpenChange={setDepartmentDialogOpen}
          title="Bölüm Seç"
          value={formState.departmentId ? `#${formState.departmentId}` : null}
          placeholder="Bölüm seçiniz"
          queryKey={['kkd', 'matrix-form', 'departments']}
          fetchPage={({ pageNumber, pageSize, search, signal }) =>
            kkdApi.getDepartments({ pageNumber, pageSize, search }, { signal })
          }
          getKey={(item) => String(item.id)}
          getLabel={(item) => `${item.departmentCode} - ${item.departmentName}`}
          onSelect={(item) => setFormState((prev) => ({
            ...prev,
            departmentId: item.id,
            roleId: 0,
          }))}
        />
      </div>

      <div className="space-y-2">
        <Label>Görev *</Label>
        <PagedLookupDialog<KkdEmployeeRoleDto>
          open={roleDialogOpen}
          onOpenChange={setRoleDialogOpen}
          title="Görev Seç"
          value={formState.roleId ? `#${formState.roleId}` : null}
          placeholder={formState.departmentId ? 'Görev seçiniz' : 'Önce bölüm seçiniz'}
          queryKey={['kkd', 'matrix-form', 'roles', formState.departmentId || 0]}
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
          onSelect={(item) => setFormState((prev) => ({ ...prev, roleId: item.id }))}
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
        <Label>Standart</Label>
        <Input value={formState.standardCode ?? ''} onChange={(event) => setFormState((prev) => ({ ...prev, standardCode: event.target.value }))} />
      </div>

      <div className="space-y-2">
        <Label>İlk Giriş *</Label>
        <Input type="number" step="0.01" value={formState.initialIssueQuantity} onChange={(event) => setFormState((prev) => ({ ...prev, initialIssueQuantity: Number(event.target.value) || 0 }))} />
      </div>

      <div className="space-y-2">
        <Label>Rutin Dönem *</Label>
        <SearchableSelect<{ value: string; label: string }>
          value={formState.routinePeriodType}
          onValueChange={(value) => setFormState((prev) => ({ ...prev, routinePeriodType: value }))}
          options={PERIOD_OPTIONS.map((item) => ({ ...item }))}
          getOptionValue={(item) => item.value}
          getOptionLabel={(item) => item.label}
          placeholder="Dönem seçiniz"
        />
      </div>

      <div className="space-y-2">
        <Label>Dönem Aralığı *</Label>
        <Input type="number" value={formState.routinePeriodInterval} onChange={(event) => setFormState((prev) => ({ ...prev, routinePeriodInterval: Number(event.target.value) || 1 }))} />
      </div>

      <div className="space-y-2">
        <Label>Rutin Adet *</Label>
        <Input type="number" step="0.01" value={formState.routineQuantity} onChange={(event) => setFormState((prev) => ({ ...prev, routineQuantity: Number(event.target.value) || 0 }))} />
      </div>

      <div className="space-y-2">
        <Label>Kaç Ay Sonra İlave</Label>
        <Input type="number" value={formState.additionalAfterMonths ?? ''} onChange={(event) => setFormState((prev) => ({ ...prev, additionalAfterMonths: event.target.value ? Number(event.target.value) : null }))} />
      </div>

      <div className="space-y-2">
        <Label>İlave Adet</Label>
        <Input type="number" step="0.01" value={formState.additionalAfterMonthsQuantity ?? ''} onChange={(event) => setFormState((prev) => ({ ...prev, additionalAfterMonthsQuantity: event.target.value ? Number(event.target.value) : null }))} />
      </div>

      <div className="space-y-2">
        <Label>Yıllık Tekrar Sayısı</Label>
        <Input type="number" value={formState.annualIssueCount ?? ''} onChange={(event) => setFormState((prev) => ({ ...prev, annualIssueCount: event.target.value ? Number(event.target.value) : null }))} />
      </div>

      <div className="space-y-2">
        <Label>Yıllık Toplam Adet</Label>
        <Input type="number" step="0.01" value={formState.annualQuantity ?? ''} onChange={(event) => setFormState((prev) => ({ ...prev, annualQuantity: event.target.value ? Number(event.target.value) : null }))} />
      </div>

      <div className="space-y-2">
        <Label>Sıra</Label>
        <Input type="number" value={formState.sortOrder} onChange={(event) => setFormState((prev) => ({ ...prev, sortOrder: Number(event.target.value) || 0 }))} />
      </div>

      <div className="space-y-3">
        <Label>Toplu Alım</Label>
        <div className="flex h-10 items-center rounded-xl border border-slate-200 px-3">
          <Switch checked={formState.allowBulkIssue} onCheckedChange={(checked) => setFormState((prev) => ({ ...prev, allowBulkIssue: checked }))} />
        </div>
      </div>

      <div className="space-y-3">
        <Label>Zorunlu</Label>
        <div className="flex h-10 items-center rounded-xl border border-slate-200 px-3">
          <Switch checked={formState.isMandatory} onCheckedChange={(checked) => setFormState((prev) => ({ ...prev, isMandatory: checked }))} />
        </div>
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

export function KkdEntitlementMatrixPage(): ReactElement {
  const columns = useMemo<PagedDataGridColumn<ColumnKey>[]>(() => [
    { key: 'departmentName', label: 'Bölüm' },
    { key: 'roleName', label: 'Görev' },
    { key: 'groupCode', label: 'Grup Kodu' },
    { key: 'initialIssueQuantity', label: 'İlk Giriş' },
    { key: 'routinePeriodType', label: 'Rutin Dönem' },
    { key: 'routineQuantity', label: 'Rutin Adet' },
    { key: 'additionalAfterMonthsQuantity', label: 'İlave Adet' },
    { key: 'isActive', label: 'Aktif' },
  ], []);

  const fields: readonly KkdCrudField<CreateKkdEntitlementMatrixRowDto>[] = [
    { key: 'groupCode', label: 'Grup Kodu', type: 'text', required: true },
  ];

  return (
    <KkdCrudPage<KkdEntitlementMatrixRowDto, CreateKkdEntitlementMatrixRowDto, ColumnKey>
      pageKey="kkd-entitlement-matrix"
      title="KKD Görev Bazlı Hak Matrisi"
      description="Bölüm ve görev tanımına göre KKD kurallarını yönetin."
      breadcrumbGroup="KKD"
      breadcrumbCurrent="Görev Bazlı Hak Matrisi"
      columns={columns}
      fields={fields}
      initialForm={{
        departmentId: 0,
        roleId: 0,
        matrixCode: '',
        matrixName: '',
        effectiveFrom: null,
        effectiveTo: null,
        groupCode: '',
        groupName: '',
        stockCode: '',
        stockName: '',
        standardCode: '',
        standardName: '',
        initialIssueQuantity: 0,
        additionalAfterMonths: null,
        additionalAfterMonthsQuantity: null,
        routinePeriodType: 'Year',
        routinePeriodInterval: 1,
        routineQuantity: 0,
        annualIssueCount: null,
        annualQuantity: null,
        maxCarryQuantity: null,
        allowBulkIssue: true,
        isMandatory: false,
        sortOrder: 0,
        isActive: true,
        description: '',
      }}
      getList={kkdApi.getEntitlementMatrixRows}
      createItem={kkdApi.createEntitlementMatrixRow}
      updateItem={(id, dto) => kkdApi.updateEntitlementMatrixRow(id, dto as UpdateKkdEntitlementMatrixRowDto)}
      deleteItem={kkdApi.deleteEntitlementMatrixRow}
      queryKey={['kkd', 'entitlement-matrix']}
      mapSortBy={(value) => ({
        departmentName: 'DepartmentName',
        roleName: 'RoleName',
        groupCode: 'GroupCode',
        initialIssueQuantity: 'InitialIssueQuantity',
        routinePeriodType: 'RoutinePeriodType',
        routineQuantity: 'RoutineQuantity',
        additionalAfterMonthsQuantity: 'AdditionalAfterMonthsQuantity',
        isActive: 'IsActive',
      }[value] ?? 'UpdatedDate')}
      renderCell={(row, columnKey) => renderKkdGenericCell(row[columnKey])}
      renderForm={({ formState, setFormState }) => (
        <KkdEntitlementMatrixForm formState={formState} setFormState={setFormState} />
      )}
    />
  );
}
