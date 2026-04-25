import { type Dispatch, type ReactElement, type SetStateAction, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { PagedLookupDialog } from '@/components/shared/PagedLookupDialog';
import { SearchableSelect } from '@/features/goods-receipt/components/steps/components/SearchableSelect';
import { FieldHelpTooltip } from '@/features/access-control/components/FieldHelpTooltip';
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
  | 'additionalAfterMonthsQuantity'
  | 'routineQuantity'
  | 'routinePeriodType'
  | 'isActive';

function buildMatrixDefaults(departmentId: number, roleId: number): Pick<CreateKkdEntitlementMatrixRowDto, 'matrixCode' | 'matrixName'> {
  if (!departmentId || !roleId) {
    return { matrixCode: '', matrixName: '' };
  }

  return {
    matrixCode: `KKD-${departmentId}-${roleId}`,
    matrixName: `KKD ${departmentId}/${roleId}`,
  };
}

function KkdEntitlementMatrixForm({
  formState,
  setFormState,
}: {
  formState: CreateKkdEntitlementMatrixRowDto;
  setFormState: Dispatch<SetStateAction<CreateKkdEntitlementMatrixRowDto>>;
}): ReactElement {
  const { t } = useTranslation();
  const [departmentDialogOpen, setDepartmentDialogOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const stockGroupsQuery = useQuery({
    queryKey: ['kkd', 'matrix-form', 'stock-groups'],
    queryFn: () => kkdApi.getStockGroups(),
    retry: false,
  });

  const stockGroups = stockGroupsQuery.data ?? [];

  const labelWithHelp = (label: string, helpKey: string): ReactElement => (
    <div className="flex items-center">
      <Label>{label}</Label>
      <FieldHelpTooltip text={t(helpKey)} />
    </div>
  );

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="md:col-span-2 rounded-2xl border border-cyan-200 bg-cyan-50/80 p-4 text-sm leading-6 text-slate-700">
        Haklar daima görev tanımı ve grup kodu üzerinden hesaplanır. Çalışan işe girdiğinde ilk giriş hakkını, işe giriş tarihinden 3 ay sonra ikinci hakkını, sonrasında da rutin dönem hakkını kullanır.
      </div>

      <div className="space-y-2">
        {labelWithHelp('Bölüm *', 'help.kkd.matrix.department')}
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
            ...buildMatrixDefaults(item.id, 0),
          }))}
        />
      </div>

      <div className="space-y-2">
        {labelWithHelp('Görev *', 'help.kkd.matrix.role')}
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
          disabled={!formState.departmentId}
          onSelect={(item) => setFormState((prev) => ({
            ...prev,
            roleId: item.id,
            ...buildMatrixDefaults(prev.departmentId, item.id),
          }))}
        />
      </div>

      <div className="space-y-2">
        {labelWithHelp('Grup Kodu *', 'help.kkd.matrix.groupCode')}
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
        {labelWithHelp('İlk Giriş Adedi *', 'help.kkd.matrix.initialQuantity')}
        <Input type="number" step="0.01" value={formState.initialIssueQuantity} onChange={(event) => setFormState((prev) => ({ ...prev, initialIssueQuantity: Number(event.target.value) || 0 }))} />
      </div>

      <div className="space-y-2">
        {labelWithHelp('İlk Giriş Frekans (Gün)', 'help.kkd.matrix.initialFrequencyDays')}
        <Input
          type="number"
          value={formState.initialFrequencyDays ?? ''}
          onChange={(event) => setFormState((prev) => ({ ...prev, initialFrequencyDays: event.target.value ? Number(event.target.value) : null }))}
        />
      </div>

      <div className="space-y-3">
        {labelWithHelp('İlk Giriş Toplu Alım', 'help.kkd.matrix.initialBulk')}
        <div className="flex h-10 items-center rounded-xl border border-slate-200 px-3">
          <Switch checked={formState.initialAllowBulkIssue} onCheckedChange={(checked) => setFormState((prev) => ({ ...prev, initialAllowBulkIssue: checked }))} />
        </div>
      </div>

      <div className="space-y-2">
        {labelWithHelp('İlk Giriş Frekans Adedi', 'help.kkd.matrix.initialFrequencyQuantity')}
        <Input
          type="number"
          step="0.01"
          value={formState.initialQuantityPerFrequency ?? ''}
          onChange={(event) => setFormState((prev) => ({ ...prev, initialQuantityPerFrequency: event.target.value ? Number(event.target.value) : null }))}
        />
      </div>

      <div className="space-y-2">
        {labelWithHelp('3. Ay Sonrası Adedi *', 'help.kkd.matrix.threeMonthQuantity')}
        <Input
          type="number"
          step="0.01"
          value={formState.additionalAfterMonthsQuantity ?? 0}
          onChange={(event) => setFormState((prev) => ({
            ...prev,
            additionalAfterMonths: 3,
            additionalAfterMonthsQuantity: Number(event.target.value) || 0,
          }))}
        />
      </div>

      <div className="space-y-2">
        {labelWithHelp('3. Ay Frekans (Gün)', 'help.kkd.matrix.threeMonthFrequencyDays')}
        <Input
          type="number"
          value={formState.threeMonthFrequencyDays ?? ''}
          onChange={(event) => setFormState((prev) => ({ ...prev, threeMonthFrequencyDays: event.target.value ? Number(event.target.value) : null }))}
        />
      </div>

      <div className="space-y-3">
        {labelWithHelp('3. Ay Toplu Alım', 'help.kkd.matrix.threeMonthBulk')}
        <div className="flex h-10 items-center rounded-xl border border-slate-200 px-3">
          <Switch checked={formState.threeMonthAllowBulkIssue} onCheckedChange={(checked) => setFormState((prev) => ({ ...prev, threeMonthAllowBulkIssue: checked }))} />
        </div>
      </div>

      <div className="space-y-2">
        {labelWithHelp('3. Ay Frekans Adedi', 'help.kkd.matrix.threeMonthFrequencyQuantity')}
        <Input
          type="number"
          step="0.01"
          value={formState.threeMonthQuantityPerFrequency ?? ''}
          onChange={(event) => setFormState((prev) => ({ ...prev, threeMonthQuantityPerFrequency: event.target.value ? Number(event.target.value) : null }))}
        />
      </div>

      <div className="space-y-2">
        {labelWithHelp('Rutin Dönem Adedi *', 'help.kkd.matrix.routineQuantity')}
        <Input
          type="number"
          step="0.01"
          value={formState.routineQuantity}
          onChange={(event) => setFormState((prev) => ({ ...prev, routineQuantity: Number(event.target.value) || 0 }))}
        />
      </div>

      <div className="space-y-2">
        {labelWithHelp('Rutin Dönem Tipi *', 'help.kkd.matrix.routinePeriodType')}
        <Input
          value={formState.routinePeriodType}
          onChange={(event) => setFormState((prev) => ({ ...prev, routinePeriodType: event.target.value || 'Year' }))}
          placeholder="Year / Month / Day"
        />
      </div>

      <div className="space-y-2">
        {labelWithHelp('Rutin Dönem Aralığı *', 'help.kkd.matrix.routinePeriodInterval')}
        <Input
          type="number"
          value={formState.routinePeriodInterval}
          onChange={(event) => setFormState((prev) => ({ ...prev, routinePeriodInterval: Number(event.target.value) || 1 }))}
        />
      </div>

      <div className="space-y-2">
        {labelWithHelp('Rutin Frekans (Gün)', 'help.kkd.matrix.routineFrequencyDays')}
        <Input
          type="number"
          value={formState.routineFrequencyDays ?? ''}
          onChange={(event) => setFormState((prev) => ({ ...prev, routineFrequencyDays: event.target.value ? Number(event.target.value) : null }))}
        />
      </div>

      <div className="space-y-3">
        {labelWithHelp('Rutin Toplu Alım', 'help.kkd.matrix.routineBulk')}
        <div className="flex h-10 items-center rounded-xl border border-slate-200 px-3">
          <Switch checked={formState.routineAllowBulkIssue} onCheckedChange={(checked) => setFormState((prev) => ({ ...prev, routineAllowBulkIssue: checked }))} />
        </div>
      </div>

      <div className="space-y-2">
        {labelWithHelp('Rutin Frekans Adedi', 'help.kkd.matrix.routineFrequencyQuantity')}
        <Input
          type="number"
          step="0.01"
          value={formState.routineQuantityPerFrequency ?? ''}
          onChange={(event) => setFormState((prev) => ({ ...prev, routineQuantityPerFrequency: event.target.value ? Number(event.target.value) : null }))}
        />
      </div>

      <div className="space-y-3">
        {labelWithHelp('Aktif', 'help.kkd.matrix.isActive')}
        <div className="flex h-10 items-center rounded-xl border border-slate-200 px-3">
          <Switch checked={formState.isActive} onCheckedChange={(checked) => setFormState((prev) => ({ ...prev, isActive: checked }))} />
        </div>
      </div>

      <div className="space-y-3">
        {labelWithHelp('Zorunlu', 'help.kkd.matrix.isMandatory')}
        <div className="flex h-10 items-center rounded-xl border border-slate-200 px-3">
          <Switch checked={formState.isMandatory} onCheckedChange={(checked) => setFormState((prev) => ({ ...prev, isMandatory: checked }))} />
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
    { key: 'additionalAfterMonthsQuantity', label: '3. Ay' },
    { key: 'routineQuantity', label: 'Rutin' },
    { key: 'routinePeriodType', label: 'Dönem' },
    { key: 'isActive', label: 'Aktif' },
  ], []);

  const fields: readonly KkdCrudField<CreateKkdEntitlementMatrixRowDto>[] = [
    { key: 'groupCode', label: 'Grup Kodu', type: 'text', required: true },
  ];

  return (
    <KkdCrudPage<KkdEntitlementMatrixRowDto, CreateKkdEntitlementMatrixRowDto, ColumnKey>
      pageKey="kkd-entitlement-matrix"
      title="KKD Görev Bazlı Hak Matrisi"
      description="Görev ve grup bazında ilk giriş, 3 ay sonrası ve rutin dönem haklarını tanımlayın."
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
        initialAllowBulkIssue: true,
        initialFrequencyDays: null,
        initialQuantityPerFrequency: null,
        additionalAfterMonths: 3,
        additionalAfterMonthsQuantity: 0,
        threeMonthAllowBulkIssue: true,
        threeMonthFrequencyDays: null,
        threeMonthQuantityPerFrequency: null,
        routinePeriodType: 'Year',
        routinePeriodInterval: 1,
        routineQuantity: 0,
        routineAllowBulkIssue: true,
        routineFrequencyDays: null,
        routineQuantityPerFrequency: null,
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
