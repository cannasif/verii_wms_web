import { type ReactElement, useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useUIStore } from '@/stores/ui-store';
import { OpsActionButton, OpsListPageShell } from '@/components/shared';
import { USER_MANAGEMENT_OPS_PAGE_CLASS } from '@/features/access-control';
import { UserStats } from './UserStats';
import { UserTable } from './UserTable';
import { UserForm } from './UserForm';
import { useCreateUser } from '../hooks/useCreateUser';
import { useUpdateUser } from '../hooks/useUpdateUser';
import { usePermissionAccess } from '@/features/access-control/hooks/usePermissionAccess';
import type { UserDto, CreateUserDto, UpdateUserDto } from '../types/user-types';
import type { UserFormSchema, UserUpdateFormSchema } from '../types/user-types';

function UserManagementOpsEyebrow(): ReactElement {
  const { t } = useTranslation(['user-management', 'access-control']);

  return (
    <>
      <span>{t('sidebar.accessControl', { ns: 'access-control' })}</span>
      <span className="mx-2 opacity-60">/</span>
      <span>{t('userManagement.menu')}</span>
    </>
  );
}

export function UserManagementPage(): ReactElement {
  const { t } = useTranslation(['user-management', 'common']);
  const { setPageTitle } = useUIStore();
  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserDto | null>(null);

  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const permissionAccess = usePermissionAccess();
  const canCreate = permissionAccess.can('access-control.user-management.create');
  const canUpdate = permissionAccess.can('access-control.user-management.update');

  useEffect(() => {
    setPageTitle(t('userManagement.menu'));
    return () => {
      setPageTitle(null);
    };
  }, [t, setPageTitle]);

  const handleAddClick = (): void => {
    setEditingUser(null);
    setFormOpen(true);
  };

  const handleFormSubmit = async (data: UserFormSchema | UserUpdateFormSchema): Promise<void> => {
    if (editingUser) {
      const updateData: UpdateUserDto = {
        email: data.email,
        firstName: data.firstName || undefined,
        lastName: data.lastName || undefined,
        phoneNumber: data.phoneNumber || undefined,
        roleId: data.roleId && data.roleId > 0 ? data.roleId : undefined,
        isActive: data.isActive,
        permissionGroupIds: data.permissionGroupIds,
      };
      await updateUser.mutateAsync({
        id: editingUser.id,
        data: updateData,
      });
    } else {
      const createFormData = data as UserFormSchema;
      const createData: CreateUserDto = {
        username: createFormData.username!,
        email: createFormData.email!,
        password: createFormData.password || undefined,
        firstName: createFormData.firstName || undefined,
        lastName: createFormData.lastName || undefined,
        phoneNumber: createFormData.phoneNumber || undefined,
        roleId: createFormData.roleId!,
        isActive: createFormData.isActive,
        permissionGroupIds: createFormData.permissionGroupIds,
      };
      await createUser.mutateAsync(createData);
    }
    setFormOpen(false);
    setEditingUser(null);
  };

  return (
    <OpsListPageShell
      className={USER_MANAGEMENT_OPS_PAGE_CLASS}
      eyebrow={<UserManagementOpsEyebrow />}
      title={t('userManagement.menu')}
      description={t('userManagement.description')}
      actions={canCreate ? (
        <OpsActionButton type="button" variant="primary" onClick={handleAddClick}>
          <Plus size={16} />
          {t('userManagement.addButton')}
        </OpsActionButton>
      ) : null}
    >
      <UserStats />

      <section className="wms-ops-receiving-area mt-6 overflow-hidden rounded-lg border bg-white/70 dark:bg-white/3">
        <UserTable
          canUpdate={canUpdate}
          onEdit={canUpdate ? (u) => {
            setEditingUser(u);
            setFormOpen(true);
          } : undefined}
        />
      </section>

      <UserForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleFormSubmit}
        user={editingUser}
        isLoading={createUser.isPending || updateUser.isPending}
      />
    </OpsListPageShell>
  );
}
