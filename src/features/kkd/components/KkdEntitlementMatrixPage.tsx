import { type Dispatch, type ReactElement, type SetStateAction, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { OpsInput, OpsToggleField } from '@/components/shared';
import { PagedLookupDialog } from '@/components/shared/PagedLookupDialog';
import { SearchableSelect } from '@/features/shared';
import { FieldHelpTooltip } from '@/features/access-control/components/FieldHelpTooltip';
import { KkdCrudPage, type KkdCrudField } from './KkdCrudPage';
import {
  KKD_MATRIX_COLUMN_WIDTHS,
  KKD_MATRIX_TABLE_MIN_WIDTH_CLASS,
  KkdOpsCollapsibleGuide,
  KkdOpsFormField,
  KkdOpsSection,
  KkdOpsSelect,
  renderKkdActiveCell,
  renderKkdGenericCell,
  renderKkdPeriodTypeCell,
  renderKkdTextChip,
  renderKkdYesNoCell,
} from './kkd-ops-ui';
import { SelectItem } from '@/components/ui/select';
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

const ROUTINE_PERIOD_TYPES = ['Year', 'Month', 'Day'] as const;

function KkdEntitlementMatrixForm({
  formState,
  setFormState,
  editingItem,
}: {
  formState: CreateKkdEntitlementMatrixRowDto;
  setFormState: Dispatch<SetStateAction<CreateKkdEntitlementMatrixRowDto>>;
  editingItem: KkdEntitlementMatrixRowDto | null;
}): ReactElement {
  const { t } = useTranslation(['kkd', 'common']);
  const [departmentDialogOpen, setDepartmentDialogOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [departmentLabel, setDepartmentLabel] = useState<string | null>(null);
  const [roleLabel, setRoleLabel] = useState<string | null>(null);
  const stockGroupsQuery = useQuery({
    queryKey: ['kkd', 'matrix-form', 'stock-groups'],
    queryFn: () => kkdApi.getStockGroups(),
    retry: false,
  });

  const stockGroups = stockGroupsQuery.data ?? [];

  useEffect(() => {
    setDepartmentLabel(
      editingItem
        ? [editingItem.departmentCode, editingItem.departmentName].filter(Boolean).join(' - ')
        : null,
    );
    setRoleLabel(
      editingItem
        ? [editingItem.roleCode, editingItem.roleName].filter(Boolean).join(' - ')
        : null,
    );
  }, [editingItem]);

  const labelWithHelp = (label: string, helpKey: string, focusable = true): ReactElement => (
    <span className="wms-ops-kkd-matrix-label">
      <span className="wms-ops-kkd-matrix-label__text">{label}</span>
      <FieldHelpTooltip text={t(helpKey, { ns: 'common' })} variant="ops" focusable={focusable} />
    </span>
  );

  return (
    <div className="wms-ops-kkd-matrix-form space-y-5">
      <div className="grid gap-2 sm:grid-cols-2">
        <KkdOpsCollapsibleGuide tone="info" title={t('kkd.operational.matrix.introTitle', { defaultValue: 'Hak matrisi özeti' })}>
          {t('kkd.operational.matrix.intro')}
        </KkdOpsCollapsibleGuide>

        <KkdOpsCollapsibleGuide tone="warn" title={t('kkd.operational.matrix.touchGuideTitle')}>
          <p>{t('kkd.operational.matrix.touchGuideLine1')}</p>
          <p>{t('kkd.operational.matrix.touchGuideLine2')}</p>
          <p>{t('kkd.operational.matrix.touchGuideLine3')}</p>
        </KkdOpsCollapsibleGuide>
      </div>

      <KkdOpsSection title={t('kkd.operational.matrix.sectionBase')}>
        <div className="wms-ops-kkd-matrix-field-grid grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <KkdOpsFormField label={labelWithHelp(t('kkd.operational.matrix.lblDepartment'), 'help.kkd.matrix.department', false)}>
            <PagedLookupDialog<KkdEmployeeDepartmentDto>
              variant="ops"
              open={departmentDialogOpen}
              onOpenChange={setDepartmentDialogOpen}
              title={t('kkd.operational.matrix.departmentTitle')}
              value={formState.departmentId ? departmentLabel ?? `#${formState.departmentId}` : null}
              placeholder={t('kkd.operational.matrix.departmentPh')}
              queryKey={['kkd', 'matrix-form', 'departments']}
              fetchPage={({ pageNumber, pageSize, search, signal }) =>
                kkdApi.getDepartments({ pageNumber, pageSize, search }, { signal })
              }
              getKey={(item) => String(item.id)}
              getLabel={(item) => `${item.departmentCode} - ${item.departmentName}`}
              onSelect={(item) => {
                setDepartmentLabel(`${item.departmentCode} - ${item.departmentName}`);
                setRoleLabel(null);
                setFormState((prev) => ({
                  ...prev,
                  departmentId: item.id,
                  roleId: 0,
                  ...buildMatrixDefaults(item.id, 0),
                }));
              }}
            />
          </KkdOpsFormField>

          <KkdOpsFormField label={labelWithHelp(t('kkd.operational.matrix.lblRole'), 'help.kkd.matrix.role')}>
            <PagedLookupDialog<KkdEmployeeRoleDto>
              variant="ops"
              open={roleDialogOpen}
              onOpenChange={setRoleDialogOpen}
              title={t('kkd.operational.matrix.roleTitle')}
              value={formState.roleId ? roleLabel ?? `#${formState.roleId}` : null}
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
              onSelect={(item) => {
                setRoleLabel(`${item.roleCode} - ${item.roleName}`);
                setFormState((prev) => ({
                  ...prev,
                  roleId: item.id,
                  ...buildMatrixDefaults(prev.departmentId, item.id),
                }));
              }}
            />
          </KkdOpsFormField>

          <KkdOpsFormField
            className="sm:col-span-2 xl:col-span-1"
            label={labelWithHelp(t('kkd.operational.matrix.lblGroupCode'), 'help.kkd.matrix.groupCode')}
          >
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
              variant="ops"
              modal
            />
          </KkdOpsFormField>
        </div>
      </KkdOpsSection>

      <div className="grid gap-5 xl:grid-cols-2">
        <KkdOpsSection title={t('kkd.operational.matrix.sectionInitial')}>
          <div className="wms-ops-kkd-matrix-field-grid grid gap-3 sm:grid-cols-2">
            <KkdOpsFormField label={labelWithHelp(t('kkd.operational.matrix.lblInitialIssue'), 'help.kkd.matrix.initialQuantity')}>
              <OpsInput type="number" step="0.01" value={formState.initialIssueQuantity} onChange={(event) => setFormState((prev) => ({ ...prev, initialIssueQuantity: Number(event.target.value) || 0 }))} />
            </KkdOpsFormField>

            <KkdOpsFormField label={labelWithHelp(t('kkd.operational.matrix.lblInitialFreqDays'), 'help.kkd.matrix.initialFrequencyDays')}>
              <OpsInput
                type="number"
                value={formState.initialFrequencyDays ?? ''}
                onChange={(event) => setFormState((prev) => ({ ...prev, initialFrequencyDays: event.target.value ? Number(event.target.value) : null }))}
              />
            </KkdOpsFormField>

            <KkdOpsFormField className="sm:col-span-2" label={labelWithHelp(t('kkd.operational.matrix.lblInitialFreqQty'), 'help.kkd.matrix.initialFrequencyQuantity')}>
              <OpsInput
                type="number"
                step="0.01"
                value={formState.initialQuantityPerFrequency ?? ''}
                onChange={(event) => setFormState((prev) => ({ ...prev, initialQuantityPerFrequency: event.target.value ? Number(event.target.value) : null }))}
              />
            </KkdOpsFormField>

            <div className="wms-ops-kkd-matrix-toggle sm:col-span-2">
              <OpsToggleField
                checked={formState.initialAllowBulkIssue}
                onCheckedChange={(checked) => setFormState((prev) => ({ ...prev, initialAllowBulkIssue: checked }))}
                title={labelWithHelp(t('kkd.operational.matrix.lblInitialBulk'), 'help.kkd.matrix.initialBulk')}
              />
            </div>
          </div>
        </KkdOpsSection>

        <KkdOpsSection title={t('kkd.operational.matrix.sectionThreeMonth')}>
          <div className="wms-ops-kkd-matrix-field-grid grid gap-3 sm:grid-cols-2">
            <KkdOpsFormField label={labelWithHelp(t('kkd.operational.matrix.lblThreeMonthQty'), 'help.kkd.matrix.threeMonthQuantity')}>
              <OpsInput
                type="number"
                step="0.01"
                value={formState.additionalAfterMonthsQuantity ?? 0}
                onChange={(event) => setFormState((prev) => ({
                  ...prev,
                  additionalAfterMonths: 3,
                  additionalAfterMonthsQuantity: Number(event.target.value) || 0,
                }))}
              />
            </KkdOpsFormField>

            <KkdOpsFormField label={labelWithHelp(t('kkd.operational.matrix.lblThreeMonthFreqDays'), 'help.kkd.matrix.threeMonthFrequencyDays')}>
              <OpsInput
                type="number"
                value={formState.threeMonthFrequencyDays ?? ''}
                onChange={(event) => setFormState((prev) => ({ ...prev, threeMonthFrequencyDays: event.target.value ? Number(event.target.value) : null }))}
              />
            </KkdOpsFormField>

            <KkdOpsFormField className="sm:col-span-2" label={labelWithHelp(t('kkd.operational.matrix.lblThreeMonthFreqQty'), 'help.kkd.matrix.threeMonthFrequencyQuantity')}>
              <OpsInput
                type="number"
                step="0.01"
                value={formState.threeMonthQuantityPerFrequency ?? ''}
                onChange={(event) => setFormState((prev) => ({ ...prev, threeMonthQuantityPerFrequency: event.target.value ? Number(event.target.value) : null }))}
              />
            </KkdOpsFormField>

            <div className="wms-ops-kkd-matrix-toggle sm:col-span-2">
              <OpsToggleField
                checked={formState.threeMonthAllowBulkIssue}
                onCheckedChange={(checked) => setFormState((prev) => ({ ...prev, threeMonthAllowBulkIssue: checked }))}
                title={labelWithHelp(t('kkd.operational.matrix.lblThreeMonthBulk'), 'help.kkd.matrix.threeMonthBulk')}
              />
            </div>
          </div>
        </KkdOpsSection>
      </div>

      <KkdOpsSection title={t('kkd.operational.matrix.sectionRoutine')}>
        <div className="wms-ops-kkd-matrix-field-grid grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <KkdOpsFormField label={labelWithHelp(t('kkd.operational.matrix.lblRoutineQty'), 'help.kkd.matrix.routineQuantity')}>
            <OpsInput
              type="number"
              step="0.01"
              value={formState.routineQuantity}
              onChange={(event) => setFormState((prev) => ({ ...prev, routineQuantity: Number(event.target.value) || 0 }))}
            />
          </KkdOpsFormField>

          <KkdOpsFormField label={labelWithHelp(t('kkd.operational.matrix.lblRoutinePeriodType'), 'help.kkd.matrix.routinePeriodType')}>
            <KkdOpsSelect
              value={formState.routinePeriodType || 'Year'}
              onValueChange={(value) => setFormState((prev) => ({ ...prev, routinePeriodType: value }))}
            >
              {ROUTINE_PERIOD_TYPES.map((periodType) => (
                <SelectItem key={periodType} value={periodType}>
                  {t(`periodTypes.${periodType}`)}
                </SelectItem>
              ))}
            </KkdOpsSelect>
          </KkdOpsFormField>

          <KkdOpsFormField label={labelWithHelp(t('kkd.operational.matrix.lblRoutineInterval'), 'help.kkd.matrix.routinePeriodInterval')}>
            <OpsInput
              type="number"
              value={formState.routinePeriodInterval}
              onChange={(event) => setFormState((prev) => ({ ...prev, routinePeriodInterval: Number(event.target.value) || 1 }))}
            />
          </KkdOpsFormField>

          <KkdOpsFormField label={labelWithHelp(t('kkd.operational.matrix.lblRoutineFreqDays'), 'help.kkd.matrix.routineFrequencyDays')}>
            <OpsInput
              type="number"
              value={formState.routineFrequencyDays ?? ''}
              onChange={(event) => setFormState((prev) => ({ ...prev, routineFrequencyDays: event.target.value ? Number(event.target.value) : null }))}
            />
          </KkdOpsFormField>

          <KkdOpsFormField label={labelWithHelp(t('kkd.operational.matrix.lblRoutineFreqQty'), 'help.kkd.matrix.routineFrequencyQuantity')}>
            <OpsInput
              type="number"
              step="0.01"
              value={formState.routineQuantityPerFrequency ?? ''}
              onChange={(event) => setFormState((prev) => ({ ...prev, routineQuantityPerFrequency: event.target.value ? Number(event.target.value) : null }))}
            />
          </KkdOpsFormField>

          <div className="wms-ops-kkd-matrix-toggle sm:col-span-2 xl:col-span-3">
            <OpsToggleField
              checked={formState.routineAllowBulkIssue}
              onCheckedChange={(checked) => setFormState((prev) => ({ ...prev, routineAllowBulkIssue: checked }))}
              title={labelWithHelp(t('kkd.operational.matrix.lblRoutineBulk'), 'help.kkd.matrix.routineBulk')}
            />
          </div>
        </div>
      </KkdOpsSection>

      <KkdOpsSection title={t('kkd.operational.matrix.sectionFlags')}>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="wms-ops-kkd-matrix-toggle">
            <OpsToggleField
              checked={formState.isActive}
              onCheckedChange={(checked) => setFormState((prev) => ({ ...prev, isActive: checked }))}
              title={labelWithHelp(t('kkd.operational.matrix.lblActive'), 'help.kkd.matrix.isActive')}
            />
          </div>

          <div className="wms-ops-kkd-matrix-toggle">
            <OpsToggleField
              checked={formState.isMandatory}
              onCheckedChange={(checked) => setFormState((prev) => ({ ...prev, isMandatory: checked }))}
              title={labelWithHelp(t('kkd.operational.matrix.lblMandatory'), 'help.kkd.matrix.isMandatory')}
            />
          </div>
        </div>
      </KkdOpsSection>
    </div>
  );
}

function renderMatrixCell(row: KkdEntitlementMatrixRowDto, columnKey: ColumnKey): ReactElement | string | number | null {
  const value = row[columnKey];

  if (columnKey === 'departmentName' || columnKey === 'roleName') {
    return renderKkdTextChip(value, 'info');
  }
  if (columnKey === 'groupCode') {
    return renderKkdTextChip(value);
  }
  if (columnKey === 'routinePeriodType') {
    return renderKkdPeriodTypeCell(value);
  }
  if (columnKey === 'isActive') {
    return renderKkdActiveCell(value);
  }
  if (
    columnKey === 'initialAllowBulkIssue'
    || columnKey === 'threeMonthAllowBulkIssue'
    || columnKey === 'routineAllowBulkIssue'
    || columnKey === 'isMandatory'
  ) {
    return renderKkdYesNoCell(value);
  }

  return renderKkdGenericCell(value);
}

export function KkdEntitlementMatrixPage(): ReactElement {
  const { t } = useTranslation(['kkd', 'common']);
  const columns = useMemo<PagedDataGridColumn<ColumnKey>[]>(() => {
    const matrixHelp = (key: string): string => t(`help.kkd.matrix.${key}`, { ns: 'common' });
    const matrixHeadClass = 'wms-ops-kkd-matrix-head';
    return [
    { key: 'departmentName', label: t('kkd.columns.department'), headerHelpText: matrixHelp('department'), headClassName: matrixHeadClass },
    { key: 'roleName', label: t('kkd.columns.role'), headerHelpText: matrixHelp('role'), headClassName: matrixHeadClass },
    { key: 'groupCode', label: t('kkd.columns.groupCode'), headerHelpText: matrixHelp('groupCode'), headClassName: matrixHeadClass },
    { key: 'groupName', label: t('kkd.columns.groupName'), headerHelpText: matrixHelp('groupCode'), headClassName: matrixHeadClass },
    { key: 'initialIssueQuantity', label: t('kkd.columns.initialIssue'), headerHelpText: matrixHelp('initialQuantity'), headClassName: matrixHeadClass },
    { key: 'initialFrequencyDays', label: t('kkd.columns.initialFrequencyDays'), headerHelpText: matrixHelp('initialFrequencyDays'), headClassName: matrixHeadClass },
    { key: 'initialAllowBulkIssue', label: t('kkd.columns.initialBulkIssue'), headerHelpText: matrixHelp('initialBulk'), headClassName: matrixHeadClass },
    { key: 'initialQuantityPerFrequency', label: t('kkd.columns.initialQuantityPerFrequency'), headerHelpText: matrixHelp('initialFrequencyQuantity'), headClassName: matrixHeadClass },
    { key: 'additionalAfterMonthsQuantity', label: t('kkd.columns.afterThreeMonths'), headerHelpText: matrixHelp('threeMonthQuantity'), headClassName: matrixHeadClass },
    { key: 'threeMonthFrequencyDays', label: t('kkd.columns.threeMonthFrequencyDays'), headerHelpText: matrixHelp('threeMonthFrequencyDays'), headClassName: matrixHeadClass },
    { key: 'threeMonthAllowBulkIssue', label: t('kkd.columns.threeMonthBulkIssue'), headerHelpText: matrixHelp('threeMonthBulk'), headClassName: matrixHeadClass },
    { key: 'threeMonthQuantityPerFrequency', label: t('kkd.columns.threeMonthQuantityPerFrequency'), headerHelpText: matrixHelp('threeMonthFrequencyQuantity'), headClassName: matrixHeadClass },
    { key: 'routineQuantity', label: t('kkd.columns.routine'), headerHelpText: matrixHelp('routineQuantity'), headClassName: matrixHeadClass },
    { key: 'routinePeriodType', label: t('kkd.columns.period'), headerHelpText: matrixHelp('routinePeriodType'), headClassName: matrixHeadClass },
    { key: 'routinePeriodInterval', label: t('kkd.columns.periodInterval'), headerHelpText: matrixHelp('routinePeriodInterval'), headClassName: matrixHeadClass },
    { key: 'routineFrequencyDays', label: t('kkd.columns.routineFrequencyDays'), headerHelpText: matrixHelp('routineFrequencyDays'), headClassName: matrixHeadClass },
    { key: 'routineAllowBulkIssue', label: t('kkd.columns.routineBulkIssue'), headerHelpText: matrixHelp('routineBulk'), headClassName: matrixHeadClass },
    { key: 'routineQuantityPerFrequency', label: t('kkd.columns.routineQuantityPerFrequency'), headerHelpText: matrixHelp('routineFrequencyQuantity'), headClassName: matrixHeadClass },
    { key: 'isMandatory', label: t('kkd.columns.mandatory'), headerHelpText: matrixHelp('isMandatory'), headClassName: matrixHeadClass },
    { key: 'isActive', label: t('common.active'), headerHelpText: matrixHelp('isActive'), headClassName: matrixHeadClass },
    ];
  }, [t]);

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
      renderCell={(row, columnKey) => renderMatrixCell(row, columnKey)}
      defaultColumnWidths={KKD_MATRIX_COLUMN_WIDTHS}
      gridMinWidthClassName={KKD_MATRIX_TABLE_MIN_WIDTH_CLASS}
      dialogSize="full"
      dialogClassName="wms-ops-kkd-matrix-dialog"
      renderForm={({ formState, setFormState, editingItem }) => (
        <KkdEntitlementMatrixForm formState={formState} setFormState={setFormState} editingItem={editingItem} />
      )}
    />
  );
}
