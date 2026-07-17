import { type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { usePermissionGroupsQuery } from '../hooks/usePermissionGroupsQuery';
import {
  AccessControlOpsCheckbox,
  AccessControlOpsMultiSelectPanel,
  AccessControlOpsScrollList,
} from './access-control-ops-ui';

interface PermissionGroupMultiSelectProps {
  value: number[];
  onChange: (ids: number[]) => void;
  disabled?: boolean;
}

export function PermissionGroupMultiSelect({
  value,
  onChange,
  disabled = false,
}: PermissionGroupMultiSelectProps): ReactElement {
  const { t } = useTranslation(['access-control', 'common']);
  const { data, isLoading } = usePermissionGroupsQuery({
    pageNumber: 1,
    pageSize: 20,
    sortBy: 'name',
    sortDirection: 'asc',
  }, true);

  const items = (data?.data ?? []).filter((d) => d.isActive);

  const handleToggle = (id: number): void => {
    if (value.includes(id)) {
      onChange(value.filter((x) => x !== id));
    } else {
      onChange([...value, id]);
    }
  };

  const handleSelectAll = (checked: boolean): void => {
    if (checked) {
      onChange(items.map((i) => i.id));
    } else {
      onChange([]);
    }
  };

  if (isLoading) {
    return <div className="wms-ops-form-hint py-4 text-sm">{t('common.loading')}</div>;
  }

  return (
    <AccessControlOpsMultiSelectPanel>
      <AccessControlOpsCheckbox
        id="select-all-groups"
        checked={items.length > 0 && value.length === items.length}
        onCheckedChange={handleSelectAll}
        disabled={disabled || items.length === 0}
        compact
        label={t('userGroupAssignments.selectAll')}
      />
      <AccessControlOpsScrollList
        className="wms-ops-access-control-group-picker max-h-[min(42dvh,18rem)] space-y-1 border p-2 sm:max-h-[min(48dvh,22rem)] sm:p-3"
        isEmpty={items.length === 0}
        emptyText={t('userGroupAssignments.noGroups')}
      >
        <div className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
            <div key={item.id} className="wms-ops-access-control-permission-row rounded-sm px-1 py-0.5">
            <AccessControlOpsCheckbox
              id={`group-${item.id}`}
              checked={value.includes(item.id)}
              onCheckedChange={() => handleToggle(item.id)}
              disabled={disabled}
              compact
              label={(
                <span className="text-sm">
                  {item.name}
                  {item.isSystemAdmin && (
                    <span className="ml-2 text-xs text-amber-600 dark:text-amber-400">({t('common.systemAdmin')})</span>
                  )}
                </span>
              )}
            />
            </div>
        ))}
        </div>
      </AccessControlOpsScrollList>
    </AccessControlOpsMultiSelectPanel>
  );
}
