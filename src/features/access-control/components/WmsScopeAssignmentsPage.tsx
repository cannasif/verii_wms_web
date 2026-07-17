import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Combobox } from '@/components/ui/combobox';
import { useUIStore } from '@/stores/ui-store';
import { useActiveUsers } from '@/features/auth/hooks/useActiveUsers';
import { useWarehouses } from '@/features/goods-receipt/hooks/useWarehouses';
import { usePermissionAccess } from '../hooks/usePermissionAccess';
import { useAllWmsScopePoliciesQuery } from '../hooks/useAllWmsScopePoliciesQuery';
import { useUserWmsScopePoliciesQuery } from '../hooks/useUserWmsScopePoliciesQuery';
import { useSetUserWmsScopePoliciesMutation } from '../hooks/useSetUserWmsScopePoliciesMutation';
import { useWmsScopePolicyResolutionQuery } from '../hooks/useWmsScopePolicyResolutionQuery';
import { MasterDataOpsFlagChip, MasterDataOpsGuidance } from '@/features/shared';
import { OpsActionButton, OpsFormPageShell, OpsInput } from '@/components/shared';
import {
  ACCESS_CONTROL_OPS_PAGE_CLASS,
  AccessControlOpsEyebrow,
  AccessControlOpsSection,
  AccessControlOpsStatGrid,
} from './access-control-ops-ui';

type AssignmentRow = {
  localId: string;
  wmsScopePolicyId: number | null;
  branchCode: string;
  warehouseId: number | null;
};

const scopeTypeLabels: Record<string, string> = {
  unrestricted: 'Tam Erişim',
  branch: 'Şube Bazlı',
  warehouse: 'Depo Bazlı',
  'assigned-only': 'Sadece Atanan',
};

export function WmsScopeAssignmentsPage(): ReactElement {
  const { t } = useTranslation(['access-control', 'common']);
  const { setPageTitle } = useUIStore();
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [assignmentRows, setAssignmentRows] = useState<AssignmentRow[]>([]);
  const [selectedEntityType, setSelectedEntityType] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const permissionAccess = usePermissionAccess();
  const canUpdateAssignments = permissionAccess.can('access-control.wms-scope-assignments.update');

  const { data: users = [], isLoading: usersLoading } = useActiveUsers();
  const { data: warehouses = [] } = useWarehouses();
  const { data: policies = [] } = useAllWmsScopePoliciesQuery();
  const { data: userAssignments, isLoading: assignmentsLoading } = useUserWmsScopePoliciesQuery(selectedUserId);
  const setAssignments = useSetUserWmsScopePoliciesMutation(selectedUserId);
  const resolutionQuery = useWmsScopePolicyResolutionQuery(selectedUserId, selectedEntityType);

  useEffect(() => {
    setPageTitle(t('wmsScopeAssignments.title'));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

  useEffect(() => {
    const nextRows = (userAssignments ?? []).map((item, index) => ({
      localId: `${item.id}-${index}`,
      wmsScopePolicyId: item.wmsScopePolicyId,
      branchCode: item.branchCode ?? '',
      warehouseId: item.warehouseId ?? null,
    }));
    setAssignmentRows(nextRows);
    setHasChanges(false);

    if (userAssignments && userAssignments.length > 0) {
      setSelectedEntityType((current) => current ?? userAssignments[0].entityType);
    }
  }, [userAssignments]);

  const userOptions = useMemo(() => users.map((u) => ({
    value: u.id.toString(),
    label: u.fullName || u.username || u.email || `User ${u.id}`,
  })), [users]);

  const policyOptions = useMemo(() => policies
    .filter((item) => item.isActive)
    .map((item) => ({
      value: item.id.toString(),
      label: `${item.name} (${item.entityType} / ${scopeTypeLabels[item.scopeType] ?? item.scopeType})`,
    })), [policies]);

  const entityTypeOptions = useMemo(() => Array.from(new Set(policies.map((item) => item.entityType))).map((entityType) => ({
    value: entityType,
    label: entityType,
  })), [policies]);

  const warehouseOptions = useMemo(() => warehouses.map((item) => ({
    value: item.id.toString(),
    label: item.depoIsmi ? `${item.depoKodu} - ${item.depoIsmi}` : `${item.depoKodu}`,
  })), [warehouses]);

  const selectedUserLabel = useMemo(() => {
    if (selectedUserId == null) return t('wmsScopeAssignments.noUserSelected');
    return userOptions.find((option) => option.value === selectedUserId.toString())?.label ?? `#${selectedUserId}`;
  }, [selectedUserId, t, userOptions]);

  const handleAddRow = (): void => {
    setAssignmentRows((current) => [...current, {
      localId: crypto.randomUUID(),
      wmsScopePolicyId: null,
      branchCode: '',
      warehouseId: null,
    }]);
    setHasChanges(true);
  };

  const handleRowChange = (localId: string, patch: Partial<AssignmentRow>): void => {
    setAssignmentRows((current) => current.map((row) => row.localId === localId ? { ...row, ...patch } : row));
    setHasChanges(true);
  };

  const handleRemoveRow = (localId: string): void => {
    setAssignmentRows((current) => current.filter((row) => row.localId !== localId));
    setHasChanges(true);
  };

  const handleSave = async (): Promise<void> => {
    if (selectedUserId == null) return;
    const items = assignmentRows
      .filter((row) => row.wmsScopePolicyId != null)
      .map((row) => ({
        wmsScopePolicyId: row.wmsScopePolicyId!,
        branchCode: row.branchCode.trim() || undefined,
        warehouseId: row.warehouseId,
      }));

    await setAssignments.mutateAsync({ items });
    setHasChanges(false);
  };

  const selectedAssignments = useMemo(() => (userAssignments ?? []).filter((item) => !selectedEntityType || item.entityType === selectedEntityType), [selectedEntityType, userAssignments]);

  return (
    <OpsFormPageShell
      className={ACCESS_CONTROL_OPS_PAGE_CLASS}
      eyebrow={<AccessControlOpsEyebrow page={t('sidebar.wmsScopeAssignments')} />}
      title={t('wmsScopeAssignments.title')}
      description={t('wmsScopeAssignments.description')}
    >
      <div className="space-y-4">
        <AccessControlOpsStatGrid
          className="md:grid-cols-4"
          items={[
            { label: t('wmsScopeAssignments.selectUser'), value: selectedUserLabel },
            { label: t('wmsScopeAssignments.assignedPolicies'), value: assignmentRows.length },
            { label: t('wmsScopeAssignments.resolutionScope'), value: selectedEntityType ?? '-' },
            { label: t('wmsScopeAssignments.statusLabel'), value: hasChanges ? t('wmsScopeAssignments.statusPending') : t('wmsScopeAssignments.statusCurrent') },
          ]}
        />
        <MasterDataOpsGuidance
          title={t('wmsScopeAssignments.editorTitle')}
          lines={[t('wmsScopeAssignments.editorDescription')]}
        />
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="space-y-4">
            <AccessControlOpsSection title={t('wmsScopeAssignments.selectUser')} subtitle={t('wmsScopeAssignments.selectUserHint')}>
              <Combobox
                options={userOptions}
                value={selectedUserId?.toString() ?? ''}
                variant="ops"
                onValueChange={(value) => setSelectedUserId(value ? parseInt(value, 10) : null)}
                placeholder={t('wmsScopeAssignments.selectUserPlaceholder')}
                searchPlaceholder={t('common.search')}
                emptyText={t('wmsScopeAssignments.noUsers')}
                disabled={usersLoading}
              />
            </AccessControlOpsSection>

            {selectedUserId != null ? (
              <AccessControlOpsSection
                title={t('wmsScopeAssignments.editorTitle')}
                subtitle={t('wmsScopeAssignments.editorDescription')}
                actions={canUpdateAssignments ? (
                  <OpsActionButton type="button" variant="secondary" onClick={handleAddRow}>
                    <Plus className="mr-2 size-4" />
                    {t('wmsScopeAssignments.addAssignment')}
                  </OpsActionButton>
                ) : undefined}
              >
                {assignmentsLoading ? (
                  <div className="wms-ops-form-hint py-8 text-center">{t('common.loading')}</div>
                ) : assignmentRows.length === 0 ? (
                  <div className="wms-ops-form-hint py-8 text-center">
                    {t('wmsScopeAssignments.empty')}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {assignmentRows.map((row) => (
                      <div key={row.localId} className="grid gap-3 rounded-2xl border p-4 lg:grid-cols-[minmax(0,1.4fr)_140px_180px_auto]">
                        <Combobox
                          options={policyOptions}
                          value={row.wmsScopePolicyId?.toString() ?? ''}
                          variant="ops"
                          onValueChange={(value) => handleRowChange(row.localId, { wmsScopePolicyId: value ? parseInt(value, 10) : null })}
                          placeholder={t('wmsScopeAssignments.policyPlaceholder')}
                          searchPlaceholder={t('common.search')}
                          emptyText={t('common.noData')}
                          disabled={!canUpdateAssignments}
                        />
                        <OpsInput
                          value={row.branchCode}
                          onChange={(event) => handleRowChange(row.localId, { branchCode: event.target.value })}
                          placeholder={t('wmsScopeAssignments.branchCodePlaceholder')}
                          disabled={!canUpdateAssignments}
                        />
                        <Combobox
                          options={warehouseOptions}
                          value={row.warehouseId?.toString() ?? ''}
                          variant="ops"
                          onValueChange={(value) => handleRowChange(row.localId, { warehouseId: value ? parseInt(value, 10) : null })}
                          placeholder={t('wmsScopeAssignments.warehousePlaceholder')}
                          searchPlaceholder={t('common.search')}
                          emptyText={t('common.noData')}
                          disabled={!canUpdateAssignments}
                        />
                        {canUpdateAssignments ? (
                          <OpsActionButton type="button" variant="secondary" onClick={() => handleRemoveRow(row.localId)}>
                            <Trash2 className="mr-2 size-4" />
                            {t('common.delete')}
                          </OpsActionButton>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}

                {hasChanges && canUpdateAssignments ? (
                  <div className="flex justify-end">
                    <OpsActionButton onClick={handleSave} disabled={setAssignments.isPending}>
                      {setAssignments.isPending ? t('common.saving') : t('common.save')}
                    </OpsActionButton>
                  </div>
                ) : null}
              </AccessControlOpsSection>
            ) : null}
          </div>

          <AccessControlOpsSection
            title={t('wmsScopeAssignments.previewTitle')}
            subtitle={t('wmsScopeAssignments.previewDescription')}
          >
            <div className="space-y-3">
              <Combobox
                options={entityTypeOptions}
                value={selectedEntityType ?? ''}
                variant="ops"
                onValueChange={(value) => setSelectedEntityType(value || null)}
                placeholder={t('wmsScopeAssignments.entityTypePlaceholder')}
                searchPlaceholder={t('common.search')}
                emptyText={t('common.noData')}
              />

              {selectedEntityType && selectedUserId != null ? (
                resolutionQuery.isLoading ? (
                  <div className="wms-ops-form-hint py-8 text-center">{t('common.loading')}</div>
                ) : resolutionQuery.data ? (
                  <div className="space-y-3">
                    <div className="rounded-2xl border p-4">
                      <div className="flex flex-wrap gap-2">
                        {(resolutionQuery.data.scopeTypes ?? []).length === 0 ? (
                          <MasterDataOpsFlagChip>{t('wmsScopeAssignments.noExplicitPolicy')}</MasterDataOpsFlagChip>
                        ) : (
                          resolutionQuery.data.scopeTypes.map((scopeType) => (
                            <MasterDataOpsFlagChip key={scopeType}>{scopeTypeLabels[scopeType] ?? scopeType}</MasterDataOpsFlagChip>
                          ))
                        )}
                      </div>
                      <div className="mt-4 space-y-2 text-sm">
                        <p>{t('wmsScopeAssignments.previewUnrestricted')}: <span className="font-semibold">{resolutionQuery.data.isUnrestricted ? t('common.yes') : t('common.no')}</span></p>
                        <p>{t('wmsScopeAssignments.previewIncludeSelf')}: <span className="font-semibold">{resolutionQuery.data.includeSelf ? t('common.yes') : t('common.no')}</span></p>
                        <p>{t('wmsScopeAssignments.previewAssignedOnly')}: <span className="font-semibold">{resolutionQuery.data.requiresAssignedRecords ? t('common.yes') : t('common.no')}</span></p>
                      </div>
                    </div>

                    <div className="rounded-2xl border p-4">
                      <p className="text-xs uppercase tracking-[0.2em] opacity-75">{t('wmsScopeAssignments.previewBranches')}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {(resolutionQuery.data.branchCodes ?? []).length === 0
                          ? <MasterDataOpsFlagChip>-</MasterDataOpsFlagChip>
                          : resolutionQuery.data.branchCodes.map((code) => <MasterDataOpsFlagChip key={code}>{code}</MasterDataOpsFlagChip>)}
                      </div>
                    </div>

                    <div className="rounded-2xl border p-4">
                      <p className="text-xs uppercase tracking-[0.2em] opacity-75">{t('wmsScopeAssignments.previewWarehouses')}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {(resolutionQuery.data.warehouseIds ?? []).length === 0
                          ? <MasterDataOpsFlagChip>-</MasterDataOpsFlagChip>
                          : resolutionQuery.data.warehouseIds.map((id) => <MasterDataOpsFlagChip key={id}>#{id}</MasterDataOpsFlagChip>)}
                      </div>
                    </div>

                    {selectedAssignments.length > 0 ? (
                      <div className="rounded-2xl border p-4">
                        <p className="text-xs uppercase tracking-[0.2em] opacity-75">{t('wmsScopeAssignments.previewAssignments')}</p>
                        <div className="mt-3 space-y-2">
                          {selectedAssignments.map((item) => (
                            <div key={item.id} className="rounded-xl border px-3 py-2 text-sm">
                              <div className="font-semibold">{item.policyName}</div>
                              <div className="opacity-80">
                                {item.branchCode || '-'} / {item.warehouseId ? `#${item.warehouseId}` : '-'}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null
              ) : (
                <div className="wms-ops-form-hint py-8 text-center">
                  {t('wmsScopeAssignments.previewEmpty')}
                </div>
              )}
            </div>
          </AccessControlOpsSection>
        </div>
      </div>
    </OpsFormPageShell>
  );
}
