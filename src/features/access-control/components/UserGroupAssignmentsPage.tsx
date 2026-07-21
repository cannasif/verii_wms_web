import { type ReactElement, useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useUIStore } from '@/stores/ui-store';
import { useActiveUsers } from '@/features/auth/hooks/useActiveUsers';
import { Combobox } from '@/components/ui/combobox';
import { useUserPermissionGroupsQuery } from '../hooks/useUserPermissionGroupsQuery';
import { useSetUserPermissionGroupsMutation } from '../hooks/useSetUserPermissionGroupsMutation';
import { usePermissionAccess } from '../hooks/usePermissionAccess';
import { PermissionGroupMultiSelect } from './PermissionGroupMultiSelect';
import { FieldHelpTooltip } from './FieldHelpTooltip';
import { OpsActionButton, OpsFormPageShell } from '@/components/shared';
import { MasterDataOpsGuidance } from '@/features/shared';
import {
  ACCESS_CONTROL_OPS_PAGE_CLASS,
  AccessControlOpsEyebrow,
  AccessControlOpsSection,
  AccessControlOpsStatGrid,
} from './access-control-ops-ui';

export function UserGroupAssignmentsPage(): ReactElement {
  const { t } = useTranslation(['access-control', 'common']);
  const { setPageTitle } = useUIStore();
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedGroupIds, setSelectedGroupIds] = useState<number[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const permissionAccess = usePermissionAccess();
  const canUpdateAssignments = permissionAccess.can('access-control.user-group-assignments.update');

  const { data: users = [], isLoading: usersLoading } = useActiveUsers();
  const { data: userGroups, isLoading: userGroupsLoading } = useUserPermissionGroupsQuery(selectedUserId);
  const setUserGroups = useSetUserPermissionGroupsMutation(selectedUserId ?? 0);

  useEffect(() => {
    setPageTitle(t('userGroupAssignments.title'));
    return () => setPageTitle(null);
  }, [t, setPageTitle]);

  const serverGroupIdsKey = (userGroups?.permissionGroupIds ?? []).join(',');
  const parsedServerGroupIds = useMemo<number[]>(
    () => (serverGroupIdsKey ? serverGroupIdsKey.split(',').map((x) => parseInt(x, 10)) : []),
    [serverGroupIdsKey]
  );

  useEffect(() => {
    setSelectedGroupIds(parsedServerGroupIds.length > 0 ? [...parsedServerGroupIds] : []);
    setHasChanges(false);
  }, [parsedServerGroupIds]);

  const handleGroupIdsChange = (ids: number[]): void => {
    setSelectedGroupIds(ids);
    setHasChanges(true);
  };

  const handleSave = async (): Promise<void> => {
    if (selectedUserId == null) return;
    await setUserGroups.mutateAsync({ permissionGroupIds: selectedGroupIds });
    setHasChanges(false);
  };

  const userOptions = users.map((u) => ({
    value: u.id.toString(),
    label: u.fullName || u.username || u.email || `User ${u.id}`,
  }));

  const selectedUserLabel = useMemo(() => {
    if (selectedUserId == null) return t('userGroupAssignments.noUserSelected', { defaultValue: 'Missing translation' });
    return userOptions.find((option) => option.value === selectedUserId.toString())?.label ?? `#${selectedUserId}`;
  }, [selectedUserId, t, userOptions]);

  return (
    <OpsFormPageShell
      className={ACCESS_CONTROL_OPS_PAGE_CLASS}
      eyebrow={<AccessControlOpsEyebrow page={t('sidebar.userGroupAssignments')} />}
      title={t('userGroupAssignments.title')}
      description={t('userGroupAssignments.description')}
    >
      <div className="space-y-4">
        <AccessControlOpsStatGrid
          items={[
            { label: t('userGroupAssignments.selectUser'), value: selectedUserLabel },
            { label: t('userGroupAssignments.assignedGroups'), value: selectedGroupIds.length },
            {
              label: t('userGroupAssignments.statusLabel', { defaultValue: 'Missing translation' }),
              value: hasChanges
                ? t('userGroupAssignments.statusPending', { defaultValue: 'Missing translation' })
                : t('userGroupAssignments.statusCurrent', { defaultValue: 'Missing translation' }),
            },
          ]}
          className="md:grid-cols-3"
        />
        <MasterDataOpsGuidance
          title={t('help.userAssignment.systemAdminNote')}
          lines={[t('help.userAssignment.systemAdminNote')]}
        />
        <AccessControlOpsSection
          title={t('userGroupAssignments.selectUser')}
          subtitle={t('userGroupAssignments.selectUserHint')}
        >
          <div className="space-y-2">
            <label className="inline-flex items-center gap-1 text-sm">
              {t('userGroupAssignments.selectUser')}
              <FieldHelpTooltip text={t('help.userAssignment.user')} variant="ops" />
            </label>
            <Combobox
              options={userOptions}
              value={selectedUserId?.toString() ?? ''}
              variant="ops"
              onValueChange={(v) => setSelectedUserId(v ? parseInt(v, 10) : null)}
              placeholder={t('userGroupAssignments.selectUserPlaceholder')}
              searchPlaceholder={t('common.search')}
              emptyText={t('userGroupAssignments.noUsers')}
              disabled={usersLoading}
            />
          </div>
        </AccessControlOpsSection>

        {selectedUserId != null ? (
          <AccessControlOpsSection
            title={t('userGroupAssignments.assignedGroups')}
            actions={hasChanges && canUpdateAssignments ? (
              <OpsActionButton onClick={handleSave} disabled={setUserGroups.isPending}>
                {setUserGroups.isPending ? t('common.saving') : t('common.save')}
              </OpsActionButton>
            ) : undefined}
          >
            {!canUpdateAssignments ? (
              <div className="rounded-none border border-[color-mix(in_oklab,#f59e0b_45%,transparent)] bg-[color-mix(in_oklab,#f59e0b_10%,transparent)] px-3 py-2 font-mono text-xs text-amber-700 dark:text-amber-300">
                {t('userGroupAssignments.readOnlyInfo', {
                  defaultValue: 'Missing translation',
                })}
              </div>
            ) : null}
            {userGroupsLoading ? (
              <div className="wms-ops-form-hint py-8 text-center">{t('common.loading')}</div>
            ) : (
              <div className="space-y-3">
                <div className="inline-flex items-center gap-1 text-sm">
                  <span>{t('userGroupAssignments.assignedGroups')}</span>
                  <FieldHelpTooltip text={t('help.userAssignment.groups')} variant="ops" />
                </div>
                <PermissionGroupMultiSelect
                  value={selectedGroupIds}
                  onChange={handleGroupIdsChange}
                  disabled={setUserGroups.isPending || !canUpdateAssignments}
                />
                {hasChanges && canUpdateAssignments ? (
                  <div className="inline-flex items-center gap-1">
                    <FieldHelpTooltip text={t('help.userAssignment.save')} side="top" variant="ops" />
                  </div>
                ) : null}
              </div>
            )}
          </AccessControlOpsSection>
        ) : null}
      </div>
    </OpsFormPageShell>
  );
}
