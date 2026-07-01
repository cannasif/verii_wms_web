import { type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { usePermissionGroupOptionsQuery } from '../hooks/usePermissionGroupOptionsQuery';
import {
  AccessControlOpsCheckbox,
  AccessControlOpsMultiSelectPanel,
  AccessControlOpsScrollList,
} from '@/features/access-control';

interface UserFormPermissionGroupSelectProps {
  value: number[];
  onChange: (ids: number[]) => void;
  disabled?: boolean;
  isAdminRole?: boolean;
}

export function UserFormPermissionGroupSelect({
  value,
  onChange,
  disabled = false,
  isAdminRole = false,
}: UserFormPermissionGroupSelectProps): ReactElement {
  const { t } = useTranslation('user-management');
  const { data: items = [], isLoading } = usePermissionGroupOptionsQuery();
  const selectableItems = items.filter((item) => isAdminRole || !item.isSystemAdmin);

  const handleToggle = (id: number): void => {
    if (value.includes(id)) {
      onChange(value.filter((x) => x !== id));
    } else {
      onChange([...value, id]);
    }
  };

  const handleSelectAll = (checked: boolean): void => {
    if (checked) {
      onChange(selectableItems.map((i) => i.value));
    } else {
      onChange([]);
    }
  };

  if (isLoading) {
    return <div className="wms-ops-form-hint py-4 text-sm">{t('userManagement.table.loading')}</div>;
  }

  return (
    <AccessControlOpsMultiSelectPanel>
      <AccessControlOpsCheckbox
        id="user-form-select-all-groups"
        checked={selectableItems.length > 0 && selectableItems.every((item) => value.includes(item.value))}
        onCheckedChange={handleSelectAll}
        disabled={disabled || selectableItems.length === 0}
        compact
        label={t('userManagement.form.selectAll')}
      />
      <AccessControlOpsScrollList
        className="wms-ops-access-control-group-picker max-h-[min(42dvh,16rem)] space-y-1 border p-2 sm:p-3"
        isEmpty={items.length === 0}
        emptyText={t('userManagement.form.permissionGroupsNoData')}
      >
        <div className="grid gap-1 sm:grid-cols-2">
          {items.map((item) => (
            <div key={item.value} className="wms-ops-access-control-permission-row rounded-sm px-1 py-0.5">
              <AccessControlOpsCheckbox
                id={`user-form-group-${item.value}`}
                checked={value.includes(item.value)}
                onCheckedChange={() => handleToggle(item.value)}
                disabled={disabled || (!isAdminRole && !!item.isSystemAdmin)}
                compact
                label={(
                  <span className="text-sm">
                    {item.label}
                    {item.isSystemAdmin ? (
                      <span className="ml-2 text-xs text-amber-600 dark:text-amber-400">
                        ({t('userManagement.form.systemAdmin', { defaultValue: 'System Admin' })})
                      </span>
                    ) : null}
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
