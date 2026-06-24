import { type Dispatch, type ReactElement, type SetStateAction, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { OpsInput, OpsTextarea, OpsToggleField } from '@/components/shared';
import { PagedLookupDialog } from '@/components/shared/PagedLookupDialog';
import { SearchableSelect } from '@/features/shared';
import { userApi } from '@/features/user-management/api/user-api';
import type { UserDto } from '@/features/user-management/types/user-types';
import { KkdCrudPage, type KkdCrudField } from './KkdCrudPage';
import {
  KKD_OVERRIDE_COLUMN_WIDTHS,
  KkdOpsFormBanner,
  KkdOpsFormField,
  KkdOpsSection,
  renderKkdActiveCell,
  renderKkdGenericCell,
  renderKkdTextChip,
} from './kkd-ops-ui';
import { kkdApi } from '../api/kkd.api';
import type {
  CreateKkdEntitlementOverrideDto,
  KkdEmployeeDto,
  KkdEntitlementOverrideDto,
  KkdStockGroupOption,
  UpdateKkdEntitlementOverrideDto,
} from '../types/kkd.types';
import type { PagedDataGridColumn } from '@/components/shared';

type ColumnKey = 'employeeCode' | 'employeeName' | 'groupCode' | 'groupName' | 'extraQuantity' | 'consumedQuantity' | 'validFrom' | 'validTo' | 'reason' | 'isActive';

function KkdEntitlementOverrideForm({
  formState,
  setFormState,
}: {
  formState: CreateKkdEntitlementOverrideDto;
  setFormState: Dispatch<SetStateAction<CreateKkdEntitlementOverrideDto>>;
}): ReactElement {
  const { t } = useTranslation(['kkd', 'common']);
  const [employeeDialogOpen, setEmployeeDialogOpen] = useState(false);
  const [approverDialogOpen, setApproverDialogOpen] = useState(false);
  const stockGroupsQuery = useQuery({
    queryKey: ['kkd', 'override-form', 'stock-groups'],
    queryFn: () => kkdApi.getStockGroups(),
    retry: false,
  });

  const stockGroups = stockGroupsQuery.data ?? [];

  return (
    <div className="space-y-4">
      <KkdOpsFormBanner tone="warn">
        {t('kkd.messages.manualOverrideNotice')}
      </KkdOpsFormBanner>

      <KkdOpsSection title={t('kkd.operational.override.sectionEmployee')}>
        <div className="grid gap-4 md:grid-cols-2">
      <KkdOpsFormField
        label={(
          <>
            {t('kkd.columns.employee')}
            <span className="ml-1 text-destructive" aria-hidden>*</span>
          </>
        )}
      >
        <PagedLookupDialog<KkdEmployeeDto>
          variant="ops"
          open={employeeDialogOpen}
          onOpenChange={setEmployeeDialogOpen}
          title={t('kkd.dialogs.selectEmployee')}
          value={formState.employeeId ? `#${formState.employeeId}` : null}
          placeholder={t('kkd.placeholders.selectEmployee')}
          queryKey={['kkd', 'override-form', 'employees']}
          fetchPage={({ pageNumber, pageSize, search, signal }) =>
            kkdApi.getEmployees({ pageNumber, pageSize, search }, { signal })
          }
          getKey={(item) => String(item.id)}
          getLabel={(item) => `${item.employeeCode} - ${item.firstName} ${item.lastName}`}
          onSelect={(item) => setFormState((prev) => ({ ...prev, employeeId: item.id }))}
        />
      </KkdOpsFormField>

      <KkdOpsFormField
        label={(
          <>
            {t('kkd.columns.groupCode')}
            <span className="ml-1 text-destructive" aria-hidden>*</span>
          </>
        )}
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
          searchPlaceholder={t('kkd.placeholders.searchGroup')}
          emptyText={t('kkd.messages.groupNotFound')}
          isLoading={stockGroupsQuery.isLoading}
          variant="ops"
          modal
        />
      </KkdOpsFormField>
        </div>
      </KkdOpsSection>

      <KkdOpsSection title={t('kkd.operational.override.sectionEntitlement')}>
        <div className="grid gap-4 md:grid-cols-2">
      <KkdOpsFormField
        label={(
          <>
            {t('kkd.columns.extraEntitlement')}
            <span className="ml-1 text-destructive" aria-hidden>*</span>
          </>
        )}
      >
        <OpsInput type="number" step="0.01" value={formState.extraQuantity} onChange={(event) => setFormState((prev) => ({ ...prev, extraQuantity: Number(event.target.value) || 0 }))} />
      </KkdOpsFormField>

      <KkdOpsFormField
        label={(
          <>
            {t('kkd.columns.startDate')}
            <span className="ml-1 text-destructive" aria-hidden>*</span>
          </>
        )}
      >
        <OpsInput type="date" value={formState.validFrom?.slice(0, 10) ?? ''} onChange={(event) => setFormState((prev) => ({ ...prev, validFrom: event.target.value }))} />
      </KkdOpsFormField>

      <KkdOpsFormField label={t('kkd.columns.endDate')}>
        <OpsInput type="date" value={formState.validTo?.slice(0, 10) ?? ''} onChange={(event) => setFormState((prev) => ({ ...prev, validTo: event.target.value || null }))} />
      </KkdOpsFormField>

      <KkdOpsFormField label={t('kkd.columns.approver')}>
        <PagedLookupDialog<UserDto>
          variant="ops"
          open={approverDialogOpen}
          onOpenChange={setApproverDialogOpen}
          title={t('kkd.dialogs.selectApprover')}
          value={formState.approvedByUserId ? `#${formState.approvedByUserId}` : null}
          placeholder={t('kkd.placeholders.selectUser')}
          queryKey={['kkd', 'override-form', 'approvers']}
          fetchPage={({ pageNumber, pageSize, search }) => userApi.getList({ pageNumber, pageSize, search })}
          getKey={(item) => String(item.id)}
          getLabel={(item) => item.fullName || item.username}
          onSelect={(item) => setFormState((prev) => ({ ...prev, approvedByUserId: item.id }))}
        />
      </KkdOpsFormField>

      <KkdOpsFormField label={t('common.description')} className="md:col-span-2">
        <OpsTextarea value={formState.reason ?? ''} onChange={(event) => setFormState((prev) => ({ ...prev, reason: event.target.value }))} />
      </KkdOpsFormField>

      <OpsToggleField
        checked={formState.isActive}
        onCheckedChange={(checked) => setFormState((prev) => ({ ...prev, isActive: checked }))}
        title={t('common.active')}
      />
        </div>
      </KkdOpsSection>
    </div>
  );
}

function renderOverrideCell(row: KkdEntitlementOverrideDto, columnKey: ColumnKey): ReactElement | string | number | null {
  const value = row[columnKey];

  if (columnKey === 'employeeCode' || columnKey === 'groupCode') {
    return renderKkdTextChip(value);
  }
  if (columnKey === 'employeeName' || columnKey === 'groupName') {
    return renderKkdTextChip(value, 'info');
  }
  if (columnKey === 'isActive') {
    return renderKkdActiveCell(value);
  }

  return renderKkdGenericCell(value);
}

export function KkdEntitlementOverridePage(): ReactElement {
  const { t } = useTranslation(['kkd', 'common']);
  const columns = useMemo<PagedDataGridColumn<ColumnKey>[]>(() => [
    { key: 'employeeCode', label: t('kkd.columns.employeeCode') },
    { key: 'groupCode', label: t('kkd.columns.groupCode') },
    { key: 'groupName', label: t('kkd.columns.groupName') },
    { key: 'employeeName', label: t('kkd.columns.employee') },
    { key: 'extraQuantity', label: t('kkd.columns.extraEntitlement') },
    { key: 'consumedQuantity', label: t('kkd.columns.consumed') },
    { key: 'validFrom', label: t('kkd.columns.startDate') },
    { key: 'validTo', label: t('kkd.columns.endDate') },
    { key: 'reason', label: t('common.description') },
    { key: 'isActive', label: t('common.active') },
  ], [t]);

  const fields: readonly KkdCrudField<CreateKkdEntitlementOverrideDto>[] = [
    { key: 'groupCode', label: t('kkd.columns.groupCode'), type: 'text', required: true },
  ];

  return (
    <KkdCrudPage<KkdEntitlementOverrideDto, CreateKkdEntitlementOverrideDto, ColumnKey>
      pageKey="kkd-entitlement-overrides"
      title={t('kkd.pages.manualOverridesTitle')}
      description={t('kkd.pages.manualOverridesDescription')}
      breadcrumbGroup={t('sidebar.kkd')}
      breadcrumbCurrent={t('kkd.pages.manualOverridesBreadcrumb')}
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
        employeeCode: 'EmployeeCode',
        groupCode: 'GroupCode',
        groupName: 'GroupName',
        employeeName: 'EmployeeName',
        extraQuantity: 'ExtraQuantity',
        consumedQuantity: 'ConsumedQuantity',
        validFrom: 'ValidFrom',
        validTo: 'ValidTo',
        reason: 'Reason',
        isActive: 'IsActive',
      }[value] ?? 'UpdatedDate')}
      renderCell={(row, columnKey) => renderOverrideCell(row, columnKey)}
      defaultColumnWidths={KKD_OVERRIDE_COLUMN_WIDTHS}
      renderForm={({ formState, setFormState }) => (
        <KkdEntitlementOverrideForm formState={formState} setFormState={setFormState} />
      )}
    />
  );
}
