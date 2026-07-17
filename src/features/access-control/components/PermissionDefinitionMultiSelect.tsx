import { type ReactElement, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { usePermissionDefinitionsQuery } from '../hooks/usePermissionDefinitionsQuery';
import {
  getPermissionActionLabel,
  getPermissionScope,
  getPermissionScopeDisplayMeta,
  isLeafPermissionCode,
  resolvePermissionDisplayLabel,
} from '../utils/permission-config';
import { MasterDataOpsFlagChip } from '@/features/shared';
import { OpsInput } from '@/components/shared';
import { cn } from '@/lib/utils';
import {
  AccessControlOpsCheckbox,
  AccessControlOpsCheckboxControl,
  AccessControlOpsMultiSelectPanel,
  AccessControlOpsScrollList,
} from './access-control-ops-ui';

interface PermissionDefinitionMultiSelectProps {
  value: number[];
  onChange: (ids: number[]) => void;
  disabled?: boolean;
}

type PermissionActionKey = 'view' | 'create' | 'update' | 'delete';

type PermissionCategoryKey =
  | 'operations'
  | 'warehouse'
  | 'subcontracting'
  | 'production'
  | 'parameters'
  | 'erp'
  | 'access-control'
  | 'system'
  | 'other';

type PermissionDefinitionItem = NonNullable<
  NonNullable<ReturnType<typeof usePermissionDefinitionsQuery>['data']>['data']
>[number];

type PermissionCell = {
  id: number;
  code: string;
  label: string;
};

type PermissionScopeRow = {
  scopeKey: string;
  scopeLabel: string;
  categoryKey: PermissionCategoryKey;
  permissions: Partial<Record<PermissionActionKey, PermissionCell>>;
};

const ACTION_ORDER: readonly PermissionActionKey[] = ['view', 'create', 'update', 'delete'];

const CATEGORY_ORDER: readonly PermissionCategoryKey[] = [
  'operations',
  'warehouse',
  'subcontracting',
  'production',
  'parameters',
  'erp',
  'access-control',
  'system',
  'other',
];

const CATEGORY_LABELS: Record<PermissionCategoryKey, { key: string; fallback: string }> = {
  operations: { key: 'permissionGroups.permissionsPanel.categories.operations', fallback: 'Operasyon' },
  warehouse: { key: 'permissionGroups.permissionsPanel.categories.warehouse', fallback: 'Depo & Sevkiyat' },
  subcontracting: { key: 'permissionGroups.permissionsPanel.categories.subcontracting', fallback: 'Fason' },
  production: { key: 'permissionGroups.permissionsPanel.categories.production', fallback: 'Üretim & Sayım' },
  parameters: { key: 'permissionGroups.permissionsPanel.categories.parameters', fallback: 'Parametreler' },
  erp: { key: 'permissionGroups.permissionsPanel.categories.erp', fallback: 'ERP & Bakiye' },
  'access-control': { key: 'permissionGroups.permissionsPanel.categories.accessControl', fallback: 'Erişim Kontrolü' },
  system: { key: 'permissionGroups.permissionsPanel.categories.system', fallback: 'Sistem' },
  other: { key: 'permissionGroups.permissionsPanel.categories.other', fallback: 'Diğer' },
};

function resolvePermissionCategory(scope: string): PermissionCategoryKey {
  if (scope === 'dashboard' || scope === 'wms.reports') return 'system';
  if (scope.startsWith('access-control.')) return 'access-control';
  if (scope.startsWith('wms.parameters.')) return 'parameters';
  if (scope.startsWith('wms.warehouse-balance') || scope.startsWith('wms.shelf') || scope.startsWith('wms.print-management')) return 'erp';
  if (
    scope.startsWith('wms.production') ||
    scope.startsWith('wms.package') ||
    scope.startsWith('wms.inventory-count')
  ) {
    return 'production';
  }
  if (scope.startsWith('wms.subcontracting.')) return 'subcontracting';
  if (
    scope.startsWith('wms.warehouse.') ||
    scope.startsWith('wms.shipment') ||
    scope.startsWith('wms.service-allocation')
  ) {
    return 'warehouse';
  }
  if (scope.startsWith('wms.goods-receipt') || scope.startsWith('wms.transfer')) return 'operations';
  return 'other';
}

function isPermissionAction(value: string): value is PermissionActionKey {
  return value === 'view' || value === 'create' || value === 'update' || value === 'delete';
}

function buildScopeRows(
  items: PermissionDefinitionItem[],
  getDisplayLabel: (code: string, name: string | null | undefined) => string,
  translate: (key: string, fallback?: string) => string,
): PermissionScopeRow[] {
  const rowMap = new Map<string, PermissionScopeRow>();

  for (const item of items) {
    const code = item.code ?? '';
    const scopeKey = getPermissionScope(code);
    const parts = code.split('.').filter(Boolean);
    const actionPart = parts[parts.length - 1] ?? 'view';
    const action = isPermissionAction(actionPart) ? actionPart : 'view';
    const scopeMeta = getPermissionScopeDisplayMeta(scopeKey);
    const scopeLabel = scopeMeta
      ? translate(scopeMeta.key, scopeMeta.fallback)
      : getDisplayLabel(code, item.name);

    const existing = rowMap.get(scopeKey);
    const cell: PermissionCell = {
      id: item.id,
      code,
      label: getDisplayLabel(code, item.name),
    };

    if (existing) {
      existing.permissions[action] = cell;
      continue;
    }

    rowMap.set(scopeKey, {
      scopeKey,
      scopeLabel,
      categoryKey: resolvePermissionCategory(scopeKey),
      permissions: { [action]: cell },
    });
  }

  return Array.from(rowMap.values()).sort((a, b) => a.scopeLabel.localeCompare(b.scopeLabel, 'tr'));
}

export function PermissionDefinitionMultiSelect({
  value,
  onChange,
  disabled = false,
}: PermissionDefinitionMultiSelectProps): ReactElement {
  const { t } = useTranslation(['access-control', 'common']);
  const { data, isLoading } = usePermissionDefinitionsQuery({
    pageNumber: 1,
    pageSize: 20,
    sortBy: 'code',
    sortDirection: 'asc',
  }, true);

  const items = (data?.data ?? []).filter((d) => d.isActive && isLeafPermissionCode(d.code));
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<PermissionCategoryKey>('operations');

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
      return (item.code ?? '').toLowerCase().includes(q)
        || (item.name ?? '').toLowerCase().includes(q)
        || display.toLowerCase().includes(q);
    });
  }, [items, search, getDisplayLabel]);

  const scopeRows = useMemo(
    () => buildScopeRows(filteredItems, getDisplayLabel, (key, fallback) => t(key, fallback ?? key)),
    [filteredItems, getDisplayLabel, t],
  );

  const isSearchActive = search.trim().length > 0;

  const categoriesWithRows = useMemo(() => {
    return CATEGORY_ORDER
      .map((categoryKey) => {
        const rows = scopeRows.filter((row) => row.categoryKey === categoryKey);
        const selectedCount = rows.reduce((count, row) => {
          return count + ACTION_ORDER.filter((action) => {
            const cell = row.permissions[action];
            return cell != null && value.includes(cell.id);
          }).length;
        }, 0);
        const labelMeta = CATEGORY_LABELS[categoryKey];
        return {
          key: categoryKey,
          label: t(labelMeta.key, { defaultValue: labelMeta.fallback }),
          rows,
          selectedCount,
        };
      })
      .filter((category) => category.rows.length > 0);
  }, [scopeRows, t, value]);

  useEffect(() => {
    if (isSearchActive || categoriesWithRows.length === 0) return;
    if (!categoriesWithRows.some((category) => category.key === activeCategory)) {
      setActiveCategory(categoriesWithRows[0]?.key ?? 'operations');
    }
  }, [activeCategory, categoriesWithRows, isSearchActive]);

  const activeRows = useMemo(() => {
    if (isSearchActive) return scopeRows;
    return scopeRows.filter((row) => row.categoryKey === activeCategory);
  }, [activeCategory, isSearchActive, scopeRows]);

  const visibleActions = useMemo(
    () => ACTION_ORDER.filter((action) => activeRows.some((row) => row.permissions[action] != null)),
    [activeRows],
  );

  const selectionSummary = useMemo(() => {
    const selected = new Set<number>(value);
    const counts = { view: 0, create: 0, update: 0, delete: 0 };

    items.forEach((item) => {
      if (!selected.has(item.id)) return;
      const parts = item.code?.split('.').filter(Boolean) ?? [];
      const action = parts[parts.length - 1] as PermissionActionKey;
      if (action in counts) counts[action] += 1;
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

  const handleBulkToggle = useCallback((ids: number[], checked: boolean): void => {
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

  const isFullySelected = useCallback((ids: number[]): boolean => {
    if (ids.length === 0) return false;
    const selected = new Set<number>(value);
    return ids.every((id) => selected.has(id));
  }, [value]);

  const allFilteredSelected = useMemo(() => {
    if (filteredItems.length === 0) return false;
    const selected = new Set<number>(value);
    return filteredItems.every((item) => selected.has(item.id));
  }, [filteredItems, value]);

  const handleSelectAllFiltered = (checked: boolean): void => {
    handleBulkToggle(filteredItems.map((item) => item.id), checked);
  };

  const getActionLabel = (action: PermissionActionKey): string => {
    const meta = getPermissionActionLabel(`scope.${action}`);
    return t(meta.key, meta.fallback);
  };

  const getCategoryActionIds = (action: PermissionActionKey, rows: PermissionScopeRow[]): number[] =>
    rows.flatMap((row) => {
      const cell = row.permissions[action];
      return cell ? [cell.id] : [];
    });

  const searchResultRows = useMemo(() => {
    if (!isSearchActive) return [];
    return filteredItems.map((item) => ({
      id: item.id,
      code: item.code ?? '',
      label: getDisplayLabel(item.code, item.name),
    })).sort((a, b) => a.label.localeCompare(b.label, 'tr'));
  }, [filteredItems, getDisplayLabel, isSearchActive]);

  if (isLoading) {
    return <div className="wms-ops-form-hint py-4 text-sm">{t('common.loading')}</div>;
  }

  return (
    <AccessControlOpsMultiSelectPanel className="wms-ops-access-control-permission-picker">
      <div className="wms-ops-access-control-summary flex flex-wrap items-center gap-2 border p-2.5 sm:gap-3 sm:p-3">
        <span className="font-mono text-[0.625rem] uppercase tracking-wider text-[color:var(--wms-ops-accent)] sm:text-[0.6875rem]">
          {t('permissionGroups.permissionsPanel.selectionSummaryTitle', { defaultValue: 'Seçili CRUD Özeti' })}
        </span>
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          <MasterDataOpsFlagChip>{t('common.view', { defaultValue: 'Görüntüle' })}: {selectionSummary.view}</MasterDataOpsFlagChip>
          <MasterDataOpsFlagChip>{t('common.create', { defaultValue: 'Oluştur' })}: {selectionSummary.create}</MasterDataOpsFlagChip>
          <MasterDataOpsFlagChip>{t('common.update', { defaultValue: 'Güncelle' })}: {selectionSummary.update}</MasterDataOpsFlagChip>
          <MasterDataOpsFlagChip>{t('common.delete', { defaultValue: 'Sil' })}: {selectionSummary.delete}</MasterDataOpsFlagChip>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
        <OpsInput
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('permissionGroups.permissionsPanel.searchPlaceholder', { defaultValue: 'Modül, işlem veya izin adı ara...' })}
          disabled={disabled}
        />
        <AccessControlOpsCheckbox
          id="select-all-permissions"
          checked={allFilteredSelected}
          onCheckedChange={handleSelectAllFiltered}
          disabled={disabled || filteredItems.length === 0}
          compact
          className="sm:justify-self-end"
          label={t('permissionGroups.selectAll')}
        />
      </div>

      {!isSearchActive ? (
        <div className="wms-ops-access-control-permission-tabs" role="tablist" aria-label={t('permissionGroups.permissionsPanel.categoriesLabel', { defaultValue: 'İzin kategorileri' })}>
          {categoriesWithRows.map((category) => (
            <button
              key={category.key}
              type="button"
              role="tab"
              aria-selected={activeCategory === category.key}
              className={cn(
                'wms-ops-access-control-permission-tabs__tab',
                activeCategory === category.key && 'wms-ops-access-control-permission-tabs__tab--active',
              )}
              onClick={() => setActiveCategory(category.key)}
            >
              <span>{category.label}</span>
              {category.selectedCount > 0 ? (
                <span className="wms-ops-access-control-permission-tabs__count">{category.selectedCount}</span>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}

      <AccessControlOpsScrollList
        className="wms-ops-access-control-permission-picker__list min-h-[14rem] max-h-[min(52dvh,30rem)] overflow-x-auto border p-0"
        isEmpty={isSearchActive ? searchResultRows.length === 0 : activeRows.length === 0}
        emptyText={t('permissionGroups.noDefinitions')}
      >
        {isSearchActive ? (
          <table className="wms-ops-access-control-permission-matrix wms-ops-access-control-permission-matrix--search">
            <thead>
              <tr>
                <th className="wms-ops-access-control-permission-matrix__col-check" />
                <th>{t('permissionGroups.permissionsPanel.table.name', { defaultValue: 'İzin Adı' })}</th>
                <th>{t('permissionGroups.permissionsPanel.table.code', { defaultValue: 'Kod' })}</th>
              </tr>
            </thead>
            <tbody>
              {searchResultRows.map((row) => (
                <tr key={row.id}>
                  <td className="wms-ops-access-control-permission-matrix__col-check">
                    <AccessControlOpsCheckboxControl
                      id={`perm-search-${row.id}`}
                      checked={value.includes(row.id)}
                      onCheckedChange={() => handleToggle(row.id)}
                      disabled={disabled}
                      aria-label={row.label}
                    />
                  </td>
                  <td className="wms-ops-access-control-permission-matrix__name">{row.label}</td>
                  <td className="wms-ops-access-control-permission-matrix__code">
                    <MasterDataOpsFlagChip>{row.code}</MasterDataOpsFlagChip>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="wms-ops-access-control-permission-matrix">
            <thead>
              <tr>
                <th className="wms-ops-access-control-permission-matrix__col-module">
                  {t('permissionGroups.permissionsPanel.table.module', { defaultValue: 'Modül' })}
                </th>
                {visibleActions.map((action) => {
                  const actionIds = getCategoryActionIds(action, activeRows);
                  return (
                    <th key={action} className="wms-ops-access-control-permission-matrix__col-action">
                      <div className="wms-ops-access-control-permission-matrix__action-head">
                        <span>{getActionLabel(action)}</span>
                        <AccessControlOpsCheckboxControl
                          id={`category-${activeCategory}-${action}-all`}
                          checked={isFullySelected(actionIds)}
                          onCheckedChange={(checked) => handleBulkToggle(actionIds, checked)}
                          disabled={disabled}
                          aria-label={t('permissionGroups.permissionsPanel.selectActionGroup', {
                            defaultValue: 'Tüm {{action}} izinlerini seç',
                            action: getActionLabel(action),
                          })}
                        />
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {activeRows.map((row) => (
                  <tr key={row.scopeKey}>
                    <td className="wms-ops-access-control-permission-matrix__module">
                      <div className="wms-ops-access-control-permission-matrix__module-label">{row.scopeLabel}</div>
                      <div className="wms-ops-access-control-permission-matrix__module-key">{row.scopeKey}</div>
                    </td>
                    {visibleActions.map((action) => {
                      const cell = row.permissions[action];
                      return (
                        <td key={`${row.scopeKey}-${action}`} className="wms-ops-access-control-permission-matrix__cell">
                          {cell ? (
                            <AccessControlOpsCheckboxControl
                              id={`perm-${cell.id}`}
                              checked={value.includes(cell.id)}
                              onCheckedChange={() => handleToggle(cell.id)}
                              disabled={disabled}
                              aria-label={cell.label}
                            />
                          ) : (
                            <span className="wms-ops-access-control-permission-matrix__empty">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
              ))}
            </tbody>
          </table>
        )}
      </AccessControlOpsScrollList>
    </AccessControlOpsMultiSelectPanel>
  );
}
