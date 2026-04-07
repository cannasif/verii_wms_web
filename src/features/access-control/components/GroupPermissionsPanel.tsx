import { type ReactElement, useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { usePermissionGroupQuery } from '../hooks/usePermissionGroupQuery';
import { useSetPermissionGroupPermissionsMutation } from '../hooks/useSetPermissionGroupPermissionsMutation';
import { PermissionDefinitionMultiSelect } from './PermissionDefinitionMultiSelect';
import { FieldHelpTooltip } from './FieldHelpTooltip';
import { getPermissionActionLabel, getPermissionDisplayMeta, getPermissionScope, getPermissionScopeDisplayMeta } from '../utils/permission-config';

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
      const displayMeta = getPermissionDisplayMeta(code);
      const codeLabel = displayMeta ? t(displayMeta.key, displayMeta.fallback) : code;

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
      <DialogContent className="bg-white dark:bg-[#130822] border border-slate-100 dark:border-white/10 text-slate-900 dark:text-white max-w-2xl w-[95%] sm:w-full shadow-2xl sm:rounded-2xl p-0 overflow-hidden flex flex-col max-h-[90vh]">
        <DialogHeader className="px-6 py-5 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#1a1025]/50">
          <DialogTitle>
            {t('permissionGroups.permissionsPanel.title')}
          </DialogTitle>
          <DialogDescription>
            {group?.name} - {t('permissionGroups.permissionsPanel.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 sm:p-8">
          <div className="mb-4 rounded-lg border border-slate-200/70 bg-slate-50/70 px-4 py-3 text-sm text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
            <div className="font-medium text-slate-900 dark:text-slate-100">
              {t('permissionGroups.permissionsPanel.introTitle', { defaultValue: 'Bu grup hangi işlemleri yapabilir?' })}
            </div>
            <div className="mt-1 leading-6">
              {t('permissionGroups.permissionsPanel.introBody', { defaultValue: 'Aşağıda bu grubun hangi modülleri görebileceğini, kayıt açabileceğini, güncelleyebileceğini veya silebileceğini seçersiniz. Bu gruba atanan tüm kullanıcılar aynı yetki setini alır.' })}
            </div>
          </div>
          {isSystemAdminGroup && (
            <div className="mb-4 rounded-lg border border-amber-300/50 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300">
              {t('permissionGroups.systemAdminLocked')}
            </div>
          )}
          <div className="mb-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-lg border border-slate-200/70 bg-white/70 px-3 py-3 dark:border-white/10 dark:bg-white/5">
              <div className="text-xs text-slate-500 dark:text-slate-400">{t('common.view', { defaultValue: 'Görüntüle' })}</div>
              <div className="mt-1 text-lg font-semibold">{currentPermissionSummary.view}</div>
            </div>
            <div className="rounded-lg border border-slate-200/70 bg-white/70 px-3 py-3 dark:border-white/10 dark:bg-white/5">
              <div className="text-xs text-slate-500 dark:text-slate-400">{t('common.create', { defaultValue: 'Oluştur' })}</div>
              <div className="mt-1 text-lg font-semibold">{currentPermissionSummary.create}</div>
            </div>
            <div className="rounded-lg border border-slate-200/70 bg-white/70 px-3 py-3 dark:border-white/10 dark:bg-white/5">
              <div className="text-xs text-slate-500 dark:text-slate-400">{t('common.update', { defaultValue: 'Güncelle' })}</div>
              <div className="mt-1 text-lg font-semibold">{currentPermissionSummary.update}</div>
            </div>
            <div className="rounded-lg border border-slate-200/70 bg-white/70 px-3 py-3 dark:border-white/10 dark:bg-white/5">
              <div className="text-xs text-slate-500 dark:text-slate-400">{t('common.delete', { defaultValue: 'Sil' })}</div>
              <div className="mt-1 text-lg font-semibold">{currentPermissionSummary.delete}</div>
            </div>
          </div>
          {group?.permissionCodes && group.permissionCodes.length > 0 && (
            <div className="mb-4">
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
                              <Badge key={`${scopeLabel}-${actionLabel}-${codeLabel}`} variant="secondary" className="text-xs">
                                {codeLabel}
                              </Badge>
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
          <div>
            <p className="text-sm font-medium mb-2 inline-flex items-center">
              {t('permissionGroups.form.permissions')}
              <FieldHelpTooltip text={t('help.permissionGroup.permissions')} />
            </p>
            <PermissionDefinitionMultiSelect value={selectedIds} onChange={setSelectedIds} disabled={setPermissions.isPending || isSystemAdminGroup} />
          </div>
        </div>

        <DialogFooter className="px-6 py-5 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#1a1025]/50">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={setPermissions.isPending}>
            {t('common.cancel')}
          </Button>
          <span className="inline-flex items-center gap-1">
            <FieldHelpTooltip text={t('help.permissionGroup.save')} side="top" />
            <Button onClick={handleSave} disabled={setPermissions.isPending || isSystemAdminGroup}>
              {setPermissions.isPending ? t('common.saving') : t('common.save')}
            </Button>
          </span>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
