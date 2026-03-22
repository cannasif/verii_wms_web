import { type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { usePermissionGroupOptionsQuery } from '../hooks/usePermissionGroupOptionsQuery';

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
    return (
      <div className="text-sm text-muted-foreground py-4">
        {t('userManagement.table.loading')}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <input
          id="user-form-select-all-groups"
          type="checkbox"
          className="h-4 w-4 rounded border border-input accent-primary"
          checked={selectableItems.length > 0 && selectableItems.every((item) => value.includes(item.value))}
          onChange={(e) => handleSelectAll(e.target.checked)}
          disabled={disabled || selectableItems.length === 0}
        />
        <label
          htmlFor="user-form-select-all-groups"
          className="text-sm font-medium cursor-pointer"
        >
          {t('userManagement.form.selectAll')}
        </label>
      </div>
      <div className="max-h-[200px] overflow-y-auto border rounded-lg p-2 space-y-2">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">
            {t('userManagement.form.permissionGroupsNoData')}
          </p>
        ) : (
          items.map((item) => (
            <div key={item.value} className="flex items-center gap-2">
              <input
                id={`user-form-group-${item.value}`}
                type="checkbox"
                className="h-4 w-4 rounded border border-input accent-primary"
                checked={value.includes(item.value)}
                onChange={() => handleToggle(item.value)}
                disabled={disabled || (!isAdminRole && !!item.isSystemAdmin)}
              />
              <label
                htmlFor={`user-form-group-${item.value}`}
                className="text-sm cursor-pointer flex-1"
              >
                {item.label}
                {item.isSystemAdmin && (
                  <span className="ml-2 text-xs text-amber-600 dark:text-amber-400">({t('common.systemAdmin')})</span>
                )}
              </label>
            </div>
          ))
        )}
      </div>
      {!isAdminRole && items.some((item) => item.isSystemAdmin) && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          {t(
            'userManagement.form.systemAdminRequiresAdminRole'
          )}
        </p>
      )}
    </div>
  );
}
