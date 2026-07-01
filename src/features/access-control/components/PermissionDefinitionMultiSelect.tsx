import { type ReactElement, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { usePermissionDefinitionsQuery } from '../hooks/usePermissionDefinitionsQuery';
import {
  getPermissionActionLabel,
  getPermissionModuleDisplayMeta,
  getPermissionScope,
  getPermissionScopeDisplayMeta,
  isLeafPermissionCode,
  resolvePermissionDisplayLabel,
} from '../utils/permission-config';
import { MasterDataOpsFlagChip } from '@/features/shared';
import { OpsInput } from '@/components/shared';
import {
  AccessControlOpsCheckbox,
  AccessControlOpsGroupLabel,
  AccessControlOpsMultiSelectPanel,
  AccessControlOpsScrollList,
} from './access-control-ops-ui';

interface PermissionDefinitionMultiSelectProps {
  value: number[];
  onChange: (ids: number[]) => void;
  disabled?: boolean;
}

export function PermissionDefinitionMultiSelect({
  value,
  onChange,
  disabled = false,
}: PermissionDefinitionMultiSelectProps): ReactElement {
  const { t } = useTranslation(['access-control', 'common']);
  const { data, isLoading } = usePermissionDefinitionsQuery({
    pageNumber: 1,
    pageSize: 1000,
    sortBy: 'code',
    sortDirection: 'asc',
  });

  const items = (data?.data ?? []).filter((d) => d.isActive && isLeafPermissionCode(d.code));
  const [search, setSearch] = useState('');

  const getDisplayLabel = useCallback(
    (code: string, name: string | null | undefined): string =>
      resolvePermissionDisplayLabel(code, name, (key, fallback) => t(key, fallback ?? key)),
    [t],
  );

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => {
      const display = getDisplayLabel(item.code, item.name);
      return (item.code ?? '').toLowerCase().includes(q) || (item.name ?? '').toLowerCase().includes(q) || display.toLowerCase().includes(q);
    });
  }, [items, search, getDisplayLabel]);

  const groupedItems = useMemo(() => {
    const buckets = new Map<string, typeof filteredItems>();
    for (const item of filteredItems) {
      const code = item.code ?? '';
      const scope = getPermissionScope(code);
      const scopeMeta = getPermissionScopeDisplayMeta(scope);
      const prefix = code.split('.').filter(Boolean)[0] ?? 'other';
      const moduleMeta = getPermissionModuleDisplayMeta(prefix);
      const groupLabel = scopeMeta
        ? t(scopeMeta.key, scopeMeta.fallback)
        : moduleMeta
          ? t(moduleMeta.key, moduleMeta.fallback)
          : scope;
      const existing = buckets.get(groupLabel);
      if (existing) {
        existing.push(item);
      } else {
        buckets.set(groupLabel, [item]);
      }
    }

    const actionOrder = ['view', 'create', 'update', 'delete'] as const;
    const sorted = Array.from(buckets.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    return sorted.map(([groupLabel, groupItems]) => {
      const actionBuckets = new Map<string, typeof groupItems>();

      groupItems.forEach((item) => {
        const parts = item.code?.split('.').filter(Boolean) ?? [];
        const action = parts.length > 0 ? parts[parts.length - 1] : 'view';
        const current = actionBuckets.get(action) ?? [];
        current.push(item);
        actionBuckets.set(action, current);
      });

      const actions = actionOrder
        .filter((action) => actionBuckets.has(action))
        .map((action) => ({
          action,
          items: (actionBuckets.get(action) ?? []).sort((a, b) => (a.code ?? '').localeCompare(b.code ?? '')),
        }));

      return {
        groupLabel,
        actions,
      };
    });
  }, [filteredItems, t]);

  const selectionSummary = useMemo(() => {
    const selected = new Set<number>(value);
    const counts = {
      view: 0,
      create: 0,
      update: 0,
      delete: 0,
    };

    items.forEach((item) => {
      if (!selected.has(item.id)) return;
      const parts = item.code?.split('.').filter(Boolean) ?? [];
      const action = parts[parts.length - 1] as keyof typeof counts;
      if (action in counts) {
        counts[action] += 1;
      }
    });

    return counts;
  }, [items, value]);

  const handleToggle = (id: number): void => {
    if (value.includes(id)) {
      onChange(value.filter((x) => x !== id));
    } else {
      onChange([...value, id]);
    }
  };

  const handleSelectAll = (checked: boolean): void => {
    if (checked) {
      const ids = new Set<number>(value);
      for (const item of filteredItems) ids.add(item.id);
      onChange(Array.from(ids));
    } else {
      const filteredIds = new Set<number>(filteredItems.map((i) => i.id));
      onChange(value.filter((id) => !filteredIds.has(id)));
    }
  };

  const isActionFullySelected = useCallback((ids: number[]): boolean => {
    if (ids.length === 0) return false;
    const selected = new Set<number>(value);
    return ids.every((id) => selected.has(id));
  }, [value]);

  const handleActionToggle = useCallback((ids: number[], checked: boolean): void => {
    if (ids.length === 0) return;

    if (checked) {
      const merged = new Set<number>(value);
      ids.forEach((id) => merged.add(id));
      onChange(Array.from(merged));
      return;
    }

    const blocked = new Set<number>(ids);
    onChange(value.filter((id) => !blocked.has(id)));
  }, [onChange, value]);

  const allFilteredSelected = useMemo(() => {
    if (filteredItems.length === 0) return false;
    const selected = new Set<number>(value);
    return filteredItems.every((i) => selected.has(i.id));
  }, [filteredItems, value]);

  if (isLoading) {
    return <div className="wms-ops-form-hint py-4 text-sm">{t('common.loading')}</div>;
  }

  return (
    <AccessControlOpsMultiSelectPanel className="wms-ops-access-control-permission-picker">
      <div className="wms-ops-access-control-summary flex flex-wrap items-center gap-2 border p-2.5 sm:gap-3 sm:p-3">
        <span className="font-mono text-[0.625rem] uppercase tracking-wider text-[color:var(--wms-ops-accent)] sm:text-[0.6875rem]">
          {t('permissionGroups.permissionsPanel.selectionSummaryTitle', { defaultValue: 'Missing translation' })}
        </span>
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          <MasterDataOpsFlagChip>{t('common.view', { defaultValue: 'Missing translation' })}: {selectionSummary.view}</MasterDataOpsFlagChip>
          <MasterDataOpsFlagChip>{t('common.create', { defaultValue: 'Missing translation' })}: {selectionSummary.create}</MasterDataOpsFlagChip>
          <MasterDataOpsFlagChip>{t('common.update', { defaultValue: 'Missing translation' })}: {selectionSummary.update}</MasterDataOpsFlagChip>
          <MasterDataOpsFlagChip>{t('common.delete', { defaultValue: 'Missing translation' })}: {selectionSummary.delete}</MasterDataOpsFlagChip>
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
        <OpsInput
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('permissionGroups.permissionsPanel.searchPlaceholder', { defaultValue: 'Missing translation' })}
          disabled={disabled}
        />
        <AccessControlOpsCheckbox
          id="select-all-permissions"
          checked={allFilteredSelected}
          onCheckedChange={handleSelectAll}
          disabled={disabled || filteredItems.length === 0}
          compact
          className="sm:justify-self-end"
          label={t('permissionGroups.selectAll')}
        />
      </div>
      <AccessControlOpsScrollList
        className="wms-ops-access-control-permission-picker__list min-h-[12rem] max-h-[min(52dvh,28rem)] space-y-3 border p-2 sm:p-3"
        isEmpty={filteredItems.length === 0}
        emptyText={t('permissionGroups.noDefinitions')}
      >
        {groupedItems.map(({ groupLabel, actions }) => (
          <div key={groupLabel} className="space-y-2">
            <AccessControlOpsGroupLabel>{groupLabel}</AccessControlOpsGroupLabel>
            {actions.map(({ action, items: actionItems }) => {
              const actionLabel = getPermissionActionLabel(`scope.${action}`);
              const actionIds = actionItems.map((item) => item.id);
              const actionSelected = isActionFullySelected(actionIds);
              return (
                <div key={`${groupLabel}-${action}`} className="wms-ops-access-control-action-block space-y-1.5 pl-1 sm:pl-2">
                  <div className="wms-ops-access-control-action-row flex items-center justify-between gap-2 border-b border-[color:color-mix(in_oklab,var(--wms-ops-accent)_12%,transparent)] pb-1.5">
                    <div className="font-mono text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-[color:var(--wms-ops-accent)] sm:text-[0.6875rem]">
                      {t(actionLabel.key, actionLabel.fallback)}
                    </div>
                    <AccessControlOpsCheckbox
                      id={`action-${groupLabel}-${action}`}
                      checked={actionSelected}
                      onCheckedChange={(checked) => handleActionToggle(actionIds, checked)}
                      disabled={disabled}
                      compact
                      label={t('permissionGroups.permissionsPanel.selectActionGroup', {
                        defaultValue: 'Missing translation',
                        action: t(actionLabel.key, actionLabel.fallback),
                      })}
                    />
                  </div>
                  <div className="grid gap-1 sm:grid-cols-2 xl:grid-cols-3">
                    {actionItems.map((item) => {
                      const display = getDisplayLabel(item.code, item.name);
                      return (
                        <div key={item.id} className="wms-ops-access-control-permission-row rounded-sm px-1 py-0.5">
                          <AccessControlOpsCheckbox
                            id={`perm-${item.id}`}
                            checked={value.includes(item.id)}
                            onCheckedChange={() => handleToggle(item.id)}
                            disabled={disabled}
                            compact
                            label={(
                              <span className="flex min-w-0 flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
                                <span className="truncate text-xs">{display}</span>
                                <span className="wms-ops-access-control-route-badge max-w-full shrink-0 truncate">
                                  <MasterDataOpsFlagChip>{item.code}</MasterDataOpsFlagChip>
                                </span>
                              </span>
                            )}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </AccessControlOpsScrollList>
    </AccessControlOpsMultiSelectPanel>
  );
}
