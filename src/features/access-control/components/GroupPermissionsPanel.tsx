import { type ReactElement, useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
} from '@/components/ui/dialog';
import { usePermissionGroupQuery } from '../hooks/usePermissionGroupQuery';
import { useSetPermissionGroupPermissionsMutation } from '../hooks/useSetPermissionGroupPermissionsMutation';
import { PermissionDefinitionMultiSelect } from './PermissionDefinitionMultiSelect';
import { FieldHelpTooltip } from './FieldHelpTooltip';
import { getPermissionActionLabel, getPermissionScope, getPermissionScopeDisplayMeta, resolvePermissionDisplayLabel } from '../utils/permission-config';
import {
  AccessControlOpsActionSummary,
  AccessControlOpsDialogContent,
  AccessControlOpsDialogFooter,
  AccessControlOpsDialogHeader,
  AccessControlOpsFormField,
} from './access-control-ops-ui';
import { MasterDataOpsFlagChip, MasterDataOpsGuidance } from '@/features/shared';

interface GroupPermissionsPanelProps {
  groupId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EMPTY_IDS: number[] = [];

export function GroupPermissionsPanel({
  groupId,
  open,
  onOpenChange,
}: GroupPermissionsPanelProps): ReactElement {
  const { t } = useTranslation(['access-control', 'common']);
  const { data: group } = usePermissionGroupQuery(groupId);
  const setPermissions = useSetPermissionGroupPermissionsMutation();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const isSystemAdminGroup = group?.isSystemAdmin === true;

  const serverIds = useMemo(() => group?.permissionDefinitionIds ?? EMPTY_IDS, [group?.permissionDefinitionIds]);
  const groupedPermissionCodes = useMemo(() => {
    const codes = group?.permissionCodes ?? [];
    const grouped = new Map<string, Map<string, string[]>>();

    codes.forEach((code) => {
      const scope = getPermissionScope(code);
      const scopeMeta = getPermissionScopeDisplayMeta(scope);
      const scopeLabel = scopeMeta ? t(scopeMeta.key, scopeMeta.fallback) : scope;
      const parts = code.split('.').filter(Boolean);
      const action = parts[parts.length - 1] ?? 'view';
      const actionLabel = t(getPermissionActionLabel(`scope.${action}`).key, getPermissionActionLabel(`scope.${action}`).fallback);
      const codeLabel = resolvePermissionDisplayLabel(code, null, (key, fallback) => t(key, fallback ?? key));

      if (!grouped.has(scopeLabel)) {
        grouped.set(scopeLabel, new Map());
      }

      const actionMap = grouped.get(scopeLabel)!;
      if (!actionMap.has(actionLabel)) {
        actionMap.set(actionLabel, []);
      }

      actionMap.get(actionLabel)!.push(codeLabel);
    });

    return Array.from(grouped.entries()).map(([scopeLabel, actions]) => ({
      scopeLabel,
      actions: Array.from(actions.entries()).map(([actionLabel, actionCodes]) => ({
        actionLabel,
        actionCodes,
      })),
    }));
  }, [group?.permissionCodes, t]);

  const currentPermissionSummary = useMemo(() => {
    const counts = {
      view: 0,
      create: 0,
      update: 0,
      delete: 0,
    };

    (group?.permissionCodes ?? []).forEach((code) => {
      const parts = code.split('.').filter(Boolean);
      const action = parts[parts.length - 1] as keyof typeof counts;
      if (action in counts) {
        counts[action] += 1;
      }
    });

    return counts;
  }, [group?.permissionCodes]);

  useEffect(() => {
    setSelectedIds(serverIds.length > 0 ? [...serverIds] : []);
  }, [open, serverIds]);

  const handleSave = async (): Promise<void> => {
    if (groupId == null) return;
    await setPermissions.mutateAsync({ id: groupId, dto: { permissionDefinitionIds: selectedIds } });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <AccessControlOpsDialogContent size="full">
        <AccessControlOpsDialogHeader
          title={t('permissionGroups.permissionsPanel.title')}
          description={`${group?.name ?? '-'} - ${t('permissionGroups.permissionsPanel.description')}`}
        />

        <div className="wms-ops-form max-h-[min(68dvh,720px)] overflow-y-auto px-5 py-4">
          <MasterDataOpsGuidance
            title={t('permissionGroups.permissionsPanel.introTitle', { defaultValue: 'Missing translation' })}
            lines={[t('permissionGroups.permissionsPanel.introBody', { defaultValue: 'Missing translation' })]}
          />
          {isSystemAdminGroup && (
            <div className="mt-4 rounded-2xl border border-amber-300/50 bg-amber-50 px-4 py-3 text-xs text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300">
              {t('permissionGroups.systemAdminLocked')}
            </div>
          )}
          <div className="mt-4">
            <AccessControlOpsActionSummary
              title={t('permissionGroups.permissionsPanel.selectionSummaryTitle', { defaultValue: 'Missing translation' })}
              description={t('permissionGroups.permissionsPanel.selectionSummaryBody', { defaultValue: 'Missing translation' })}
              items={[
                { label: t('common.view', { defaultValue: 'Missing translation' }), value: currentPermissionSummary.view },
                { label: t('common.create', { defaultValue: 'Missing translation' }), value: currentPermissionSummary.create },
                { label: t('common.update', { defaultValue: 'Missing translation' }), value: currentPermissionSummary.update },
                { label: t('common.delete', { defaultValue: 'Missing translation' }), value: currentPermissionSummary.delete },
              ]}
            />
          </div>
          {group?.permissionCodes && group.permissionCodes.length > 0 && (
            <div className="mt-4 rounded-3xl border border-slate-200/70 bg-slate-50/60 p-4 dark:border-white/10 dark:bg-white/3">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
                {t('permissionGroups.permissionsPanel.currentCodes')}
              </p>
              <div className="space-y-3">
                {groupedPermissionCodes.map(({ scopeLabel, actions }) => (
                  <div key={scopeLabel} className="rounded-lg border border-slate-200/70 bg-slate-50/60 p-3 dark:border-white/10 dark:bg-white/5">
                    <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                      {scopeLabel}
                    </div>
                    <div className="space-y-2">
                      {actions.map(({ actionLabel, actionCodes }) => (
                        <div key={`${scopeLabel}-${actionLabel}`} className="space-y-1">
                          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                            {actionLabel}
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {actionCodes.map((codeLabel) => (
                              <MasterDataOpsFlagChip key={`${scopeLabel}-${actionLabel}-${codeLabel}`}>
                                {codeLabel}
                              </MasterDataOpsFlagChip>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="mt-4 rounded-3xl border border-slate-200/70 bg-slate-50/60 p-4 dark:border-white/10 dark:bg-white/3">
            <AccessControlOpsFormField
              label={(
                <span className="inline-flex items-center">
                  {t('permissionGroups.form.permissions')}
                  <FieldHelpTooltip text={t('help.permissionGroup.permissions')} variant="ops" />
                </span>
              )}
            >
              <PermissionDefinitionMultiSelect value={selectedIds} onChange={setSelectedIds} disabled={setPermissions.isPending || isSystemAdminGroup} />
            </AccessControlOpsFormField>
          </div>
        </div>

        <AccessControlOpsDialogFooter
          onCancel={() => onOpenChange(false)}
          onSave={handleSave}
          cancelLabel={t('common.cancel')}
          saveLabel={t('common.save')}
          isLoading={setPermissions.isPending}
          saveDisabled={isSystemAdminGroup}
          saveType="button"
          leading={<FieldHelpTooltip text={t('help.permissionGroup.save')} side="top" variant="ops" />}
        />
      </AccessControlOpsDialogContent>
    </Dialog>
  );
}
