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
  | 'groupName'
  | 'initialIssueQuantity'
  | 'initialFrequencyDays'
  | 'initialAllowBulkIssue'
  | 'initialQuantityPerFrequency'
  | 'additionalAfterMonthsQuantity'
  | 'threeMonthFrequencyDays'
  | 'threeMonthAllowBulkIssue'
  | 'threeMonthQuantityPerFrequency'
  | 'routineQuantity'
  | 'routinePeriodType'
  | 'routinePeriodInterval'
  | 'routineFrequencyDays'
  | 'routineAllowBulkIssue'
  | 'routineQuantityPerFrequency'
  | 'isMandatory'
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

  const helperText = (text: string): ReactElement => (
    <p className="text-xs leading-5 text-slate-500">{text}</p>
  );

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="md:col-span-2 rounded-2xl border border-cyan-200 bg-cyan-50/80 p-4 text-sm leading-6 text-slate-700">
        {t('kkd.operational.matrix.intro')}
      </div>

      <div className="md:col-span-2 rounded-2xl border border-amber-200 bg-amber-50/90 p-4 text-sm leading-6 text-slate-700">
        <div className="font-semibold text-slate-900">{t('kkd.operational.matrix.touchGuideTitle')}</div>
        <div>{t('kkd.operational.matrix.touchGuideLine1')}</div>
        <div>{t('kkd.operational.matrix.touchGuideLine2')}</div>
        <div>{t('kkd.operational.matrix.touchGuideLine3')}</div>
      </div>

      <div className="space-y-2">
        {labelWithHelp(t('kkd.operational.matrix.lblDepartment'), 'help.kkd.matrix.department')}
        <PagedLookupDialog<KkdEmployeeDepartmentDto>
          open={departmentDialogOpen}
          onOpenChange={setDepartmentDialogOpen}
          title={t('kkd.operational.matrix.departmentTitle')}
          value={formState.departmentId ? `#${formState.departmentId}` : null}
          placeholder={t('kkd.operational.matrix.departmentPh')}
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
        {labelWithHelp(t('kkd.operational.matrix.lblRole'), 'help.kkd.matrix.role')}
        <PagedLookupDialog<KkdEmployeeRoleDto>
          open={roleDialogOpen}
          onOpenChange={setRoleDialogOpen}
          title={t('kkd.operational.matrix.roleTitle')}
          value={formState.roleId ? `#${formState.roleId}` : null}
          placeholder={formState.departmentId ? t('kkd.operational.matrix.rolePh') : t('kkd.operational.matrix.departmentPhNeedDept')}
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
        {labelWithHelp(t('kkd.operational.matrix.lblGroupCode'), 'help.kkd.matrix.groupCode')}
        <SearchableSelect<KkdStockGroupOption>
          value={formState.groupCode}
          onValueChange={(value) => {
            const selected = stockGroups.find((item) => item.groupCode === value);
            setFormState((prev) => ({ ...prev, groupCode: value, groupName: selected?.groupName ?? '' }));
          }}
          options={stockGroups}
          getOptionValue={(item) => item.groupCode}
          getOptionLabel={(item) => `${item.groupCode}${item.groupName ? ` - ${item.groupName}` : ''}`}
          placeholder={t('kkd.placeholders.selectStockGroup')}
          searchPlaceholder={t('kkd.operational.matrix.groupSearch')}
          emptyText={t('kkd.operational.matrix.groupEmpty')}
          isLoading={stockGroupsQuery.isLoading}
          modal
        />
      </div>

      <div className="space-y-2">
        {labelWithHelp(t('kkd.operational.matrix.lblInitialIssue'), 'help.kkd.matrix.initialQuantity')}
        <Input type="number" step="0.01" value={formState.initialIssueQuantity} onChange={(event) => setFormState((prev) => ({ ...prev, initialIssueQuantity: Number(event.target.value) || 0 }))} />
      </div>

      <div className="space-y-2">
        {labelWithHelp(t('kkd.operational.matrix.lblInitialFreqDays'), 'help.kkd.matrix.initialFrequencyDays')}
        <Input
          type="number"
          value={formState.initialFrequencyDays ?? ''}
          onChange={(event) => setFormState((prev) => ({ ...prev, initialFrequencyDays: event.target.value ? Number(event.target.value) : null }))}
        />
        {helperText(t('kkd.operational.matrix.hintInitialFreqDays'))}
      </div>

      <div className="space-y-3">
        {labelWithHelp(t('kkd.operational.matrix.lblInitialBulk'), 'help.kkd.matrix.initialBulk')}
        <div className="flex h-10 items-center rounded-xl border border-slate-200 px-3">
          <Switch checked={formState.initialAllowBulkIssue} onCheckedChange={(checked) => setFormState((prev) => ({ ...prev, initialAllowBulkIssue: checked }))} />
        </div>
      </div>

      <div className="space-y-2">
        {labelWithHelp(t('kkd.operational.matrix.lblInitialFreqQty'), 'help.kkd.matrix.initialFrequencyQuantity')}
        <Input
          type="number"
          step="0.01"
          value={formState.initialQuantityPerFrequency ?? ''}
          onChange={(event) => setFormState((prev) => ({ ...prev, initialQuantityPerFrequency: event.target.value ? Number(event.target.value) : null }))}
        />
        {helperText(t('kkd.operational.matrix.hintInitialFreqQty'))}
      </div>

      <div className="space-y-2">
        {labelWithHelp(t('kkd.operational.matrix.lblThreeMonthQty'), 'help.kkd.matrix.threeMonthQuantity')}
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
        {labelWithHelp(t('kkd.operational.matrix.lblThreeMonthFreqDays'), 'help.kkd.matrix.threeMonthFrequencyDays')}
        <Input
          type="number"
          value={formState.threeMonthFrequencyDays ?? ''}
          onChange={(event) => setFormState((prev) => ({ ...prev, threeMonthFrequencyDays: event.target.value ? Number(event.target.value) : null }))}
        />
        {helperText(t('kkd.operational.matrix.hintThreeMonthFreqDays'))}
      </div>

      <div className="space-y-3">
        {labelWithHelp(t('kkd.operational.matrix.lblThreeMonthBulk'), 'help.kkd.matrix.threeMonthBulk')}
        <div className="flex h-10 items-center rounded-xl border border-slate-200 px-3">
          <Switch checked={formState.threeMonthAllowBulkIssue} onCheckedChange={(checked) => setFormState((prev) => ({ ...prev, threeMonthAllowBulkIssue: checked }))} />
        </div>
      </div>

      <div className="space-y-2">
        {labelWithHelp(t('kkd.operational.matrix.lblThreeMonthFreqQty'), 'help.kkd.matrix.threeMonthFrequencyQuantity')}
        <Input
          type="number"
          step="0.01"
          value={formState.threeMonthQuantityPerFrequency ?? ''}
          onChange={(event) => setFormState((prev) => ({ ...prev, threeMonthQuantityPerFrequency: event.target.value ? Number(event.target.value) : null }))}
        />
        {helperText(t('kkd.operational.matrix.hintThreeMonthFreqQty'))}
      </div>

      <div className="space-y-2">
        {labelWithHelp(t('kkd.operational.matrix.lblRoutineQty'), 'help.kkd.matrix.routineQuantity')}
        <Input
          type="number"
          step="0.01"
          value={formState.routineQuantity}
          onChange={(event) => setFormState((prev) => ({ ...prev, routineQuantity: Number(event.target.value) || 0 }))}
        />
      </div>

      <div className="space-y-2">
        {labelWithHelp(t('kkd.operational.matrix.lblRoutinePeriodType'), 'help.kkd.matrix.routinePeriodType')}
        <Input
          value={formState.routinePeriodType}
          onChange={(event) => setFormState((prev) => ({ ...prev, routinePeriodType: event.target.value || 'Year' }))}
          placeholder={t('kkd.operational.matrix.periodPlaceholder')}
        />
      </div>

      <div className="space-y-2">
        {labelWithHelp(t('kkd.operational.matrix.lblRoutineInterval'), 'help.kkd.matrix.routinePeriodInterval')}
        <Input
          type="number"
          value={formState.routinePeriodInterval}
          onChange={(event) => setFormState((prev) => ({ ...prev, routinePeriodInterval: Number(event.target.value) || 1 }))}
        />
      </div>

      <div className="space-y-2">
        {labelWithHelp(t('kkd.operational.matrix.lblRoutineFreqDays'), 'help.kkd.matrix.routineFrequencyDays')}
        <Input
          type="number"
          value={formState.routineFrequencyDays ?? ''}
          onChange={(event) => setFormState((prev) => ({ ...prev, routineFrequencyDays: event.target.value ? Number(event.target.value) : null }))}
        />
        {helperText(t('kkd.operational.matrix.hintRoutineFreqDays'))}
      </div>

      <div className="space-y-3">
        {labelWithHelp(t('kkd.operational.matrix.lblRoutineBulk'), 'help.kkd.matrix.routineBulk')}
        <div className="flex h-10 items-center rounded-xl border border-slate-200 px-3">
          <Switch checked={formState.routineAllowBulkIssue} onCheckedChange={(checked) => setFormState((prev) => ({ ...prev, routineAllowBulkIssue: checked }))} />
        </div>
      </div>

      <div className="space-y-2">
        {labelWithHelp(t('kkd.operational.matrix.lblRoutineFreqQty'), 'help.kkd.matrix.routineFrequencyQuantity')}
        <Input
          type="number"
          step="0.01"
          value={formState.routineQuantityPerFrequency ?? ''}
          onChange={(event) => setFormState((prev) => ({ ...prev, routineQuantityPerFrequency: event.target.value ? Number(event.target.value) : null }))}
        />
        {helperText(t('kkd.operational.matrix.hintRoutineFreqQty'))}
      </div>

      <div className="space-y-3">
        {labelWithHelp(t('kkd.operational.matrix.lblActive'), 'help.kkd.matrix.isActive')}
        <div className="flex h-10 items-center rounded-xl border border-slate-200 px-3">
          <Switch checked={formState.isActive} onCheckedChange={(checked) => setFormState((prev) => ({ ...prev, isActive: checked }))} />
        </div>
      </div>

      <div className="space-y-3">
        {labelWithHelp(t('kkd.operational.matrix.lblMandatory'), 'help.kkd.matrix.isMandatory')}
        <div className="flex h-10 items-center rounded-xl border border-slate-200 px-3">
          <Switch checked={formState.isMandatory} onCheckedChange={(checked) => setFormState((prev) => ({ ...prev, isMandatory: checked }))} />
        </div>
      </div>
    </div>
  );
}

export function KkdEntitlementMatrixPage(): ReactElement {
  const { t } = useTranslation('common');
  const matrixHelp = (key: string): string => t(`help.kkd.matrix.${key}`);
  const columns = useMemo<PagedDataGridColumn<ColumnKey>[]>(() => [
    { key: 'departmentName', label: t('kkd.columns.department'), headerHelpText: matrixHelp('department') },
    { key: 'roleName', label: t('kkd.columns.role'), headerHelpText: matrixHelp('role') },
    { key: 'groupCode', label: t('kkd.columns.groupCode'), headerHelpText: matrixHelp('groupCode') },
    { key: 'groupName', label: t('kkd.columns.groupName'), headerHelpText: matrixHelp('groupCode') },
    { key: 'initialIssueQuantity', label: t('kkd.columns.initialIssue'), headerHelpText: matrixHelp('initialQuantity') },
    { key: 'initialFrequencyDays', label: t('kkd.columns.initialFrequencyDays'), headerHelpText: matrixHelp('initialFrequencyDays') },
    { key: 'initialAllowBulkIssue', label: t('kkd.columns.initialBulkIssue'), headerHelpText: matrixHelp('initialBulk') },
    { key: 'initialQuantityPerFrequency', label: t('kkd.columns.initialQuantityPerFrequency'), headerHelpText: matrixHelp('initialFrequencyQuantity') },
    { key: 'additionalAfterMonthsQuantity', label: t('kkd.columns.afterThreeMonths'), headerHelpText: matrixHelp('threeMonthQuantity') },
    { key: 'threeMonthFrequencyDays', label: t('kkd.columns.threeMonthFrequencyDays'), headerHelpText: matrixHelp('threeMonthFrequencyDays') },
    { key: 'threeMonthAllowBulkIssue', label: t('kkd.columns.threeMonthBulkIssue'), headerHelpText: matrixHelp('threeMonthBulk') },
    { key: 'threeMonthQuantityPerFrequency', label: t('kkd.columns.threeMonthQuantityPerFrequency'), headerHelpText: matrixHelp('threeMonthFrequencyQuantity') },
    { key: 'routineQuantity', label: t('kkd.columns.routine'), headerHelpText: matrixHelp('routineQuantity') },
    { key: 'routinePeriodType', label: t('kkd.columns.period'), headerHelpText: matrixHelp('routinePeriodType') },
    { key: 'routinePeriodInterval', label: t('kkd.columns.periodInterval'), headerHelpText: matrixHelp('routinePeriodInterval') },
    { key: 'routineFrequencyDays', label: t('kkd.columns.routineFrequencyDays'), headerHelpText: matrixHelp('routineFrequencyDays') },
    { key: 'routineAllowBulkIssue', label: t('kkd.columns.routineBulkIssue'), headerHelpText: matrixHelp('routineBulk') },
    { key: 'routineQuantityPerFrequency', label: t('kkd.columns.routineQuantityPerFrequency'), headerHelpText: matrixHelp('routineFrequencyQuantity') },
    { key: 'isMandatory', label: t('kkd.columns.mandatory'), headerHelpText: matrixHelp('isMandatory') },
    { key: 'isActive', label: t('common.active'), headerHelpText: matrixHelp('isActive') },
  ], [t]);

  const fields: readonly KkdCrudField<CreateKkdEntitlementMatrixRowDto>[] = [
    { key: 'groupCode', label: t('kkd.columns.groupCode'), type: 'text', required: true },
  ];

  return (
    <KkdCrudPage<KkdEntitlementMatrixRowDto, CreateKkdEntitlementMatrixRowDto, ColumnKey>
      pageKey="kkd-entitlement-matrix"
      title={t('kkd.pages.entitlementMatrixTitle')}
      description={t('kkd.pages.entitlementMatrixDescription')}
      breadcrumbGroup={t('sidebar.kkd')}
      breadcrumbCurrent={t('kkd.pages.entitlementMatrixBreadcrumb')}
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
        groupName: 'GroupName',
        initialIssueQuantity: 'InitialIssueQuantity',
        initialFrequencyDays: 'InitialFrequencyDays',
        initialAllowBulkIssue: 'InitialAllowBulkIssue',
        initialQuantityPerFrequency: 'InitialQuantityPerFrequency',
        threeMonthFrequencyDays: 'ThreeMonthFrequencyDays',
        threeMonthAllowBulkIssue: 'ThreeMonthAllowBulkIssue',
        threeMonthQuantityPerFrequency: 'ThreeMonthQuantityPerFrequency',
        routinePeriodType: 'RoutinePeriodType',
        routinePeriodInterval: 'RoutinePeriodInterval',
        routineQuantity: 'RoutineQuantity',
        routineFrequencyDays: 'RoutineFrequencyDays',
        routineAllowBulkIssue: 'RoutineAllowBulkIssue',
        routineQuantityPerFrequency: 'RoutineQuantityPerFrequency',
        additionalAfterMonthsQuantity: 'AdditionalAfterMonthsQuantity',
        isMandatory: 'IsMandatory',
        isActive: 'IsActive',
      }[value] ?? 'UpdatedDate')}
      renderCell={(row, columnKey) => renderKkdGenericCell(row[columnKey])}
      renderForm={({ formState, setFormState }) => (
        <KkdEntitlementMatrixForm formState={formState} setFormState={setFormState} />
      )}
    />
  );
}
