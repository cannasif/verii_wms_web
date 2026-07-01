import { type ReactElement, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Dialog } from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import {
  userFormSchema,
  userUpdateFormSchema,
  type UserFormSchema,
  type UserUpdateFormSchema,
} from '../types/user-types';
import type { UserDto } from '../types/user-types';
import { useUserAuthorityOptionsQuery } from '../hooks/useUserAuthorityOptionsQuery';
import type { RoleOption } from '../hooks/useUserAuthorityOptionsQuery';
import { useUserPermissionGroupsForForm } from '../hooks/useUserPermissionGroupsForForm';
import { usePermissionGroupOptionsQuery } from '../hooks/usePermissionGroupOptionsQuery';
import { UserFormPermissionGroupSelect } from './UserFormPermissionGroupSelect';
import {
  AccessControlOpsDialogContent,
  AccessControlOpsDialogFooter,
  AccessControlOpsDialogHeader,
  AccessControlOpsFormField,
} from '@/features/access-control';
import { MasterDataOpsSelect } from '@/features/shared';
import { OpsCircuitToggleField, OpsInput, OpsSelectItem } from '@/components/shared';

interface UserFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: UserFormSchema | UserUpdateFormSchema) => void | Promise<void>;
  user?: UserDto | null;
  isLoading?: boolean;
}

const EMPTY_ROLE_OPTIONS: RoleOption[] = [];

export function UserForm({
  open,
  onOpenChange,
  onSubmit,
  user,
  isLoading = false,
}: UserFormProps): ReactElement {
  const { t } = useTranslation('user-management');
  const userId = user?.id ?? null;
  const userUsername = user?.username ?? '';
  const userEmail = user?.email ?? '';
  const userFirstName = user?.firstName ?? '';
  const userLastName = user?.lastName ?? '';
  const userPhoneNumber = user?.phoneNumber ?? '';
  const userRoleLabel = user?.role ?? '';
  const userRoleId = user?.roleId ?? 0;
  const userIsActive = user?.isActive ?? true;
  const isEditMode = userId != null;
  const roleOptionsQuery = useUserAuthorityOptionsQuery();
  const roleOptions = roleOptionsQuery.data ?? EMPTY_ROLE_OPTIONS;
  const permissionGroupOptionsQuery = usePermissionGroupOptionsQuery();
  const permissionGroupOptions = permissionGroupOptionsQuery.data ?? [];
  const systemAdminGroupIds = permissionGroupOptions
    .filter((group) => group.isSystemAdmin)
    .map((group) => group.value);
  const userPermissionGroupsQuery = useUserPermissionGroupsForForm(
    userId
  );

  const form = useForm<UserFormSchema | UserUpdateFormSchema>({
    resolver: zodResolver(isEditMode ? userUpdateFormSchema : userFormSchema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      username: '',
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      phoneNumber: '',
      roleId: 0,
      isActive: true,
      permissionGroupIds: [],
    },
  });
  const isFormValid = form.formState.isValid;
  const selectedRoleId = form.watch('roleId');
  const selectedRole = roleOptions.find((opt) => opt.value === selectedRoleId);
  const isAdminRole = (selectedRole?.label ?? '').toLowerCase().includes('admin');

  useEffect(() => {
    if (!open) {
      return;
    }

    if (userId != null) {
      form.reset({
        username: userUsername,
        email: userEmail,
        firstName: userFirstName,
        lastName: userLastName,
        phoneNumber: userPhoneNumber,
        roleId: userRoleId,
        isActive: userIsActive,
        permissionGroupIds: [],
      });
      return;
    }

    form.reset({
      username: '',
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      phoneNumber: '',
      roleId: 0,
      isActive: true,
      permissionGroupIds: [],
    });
  }, [
    open,
    userId,
    userUsername,
    userEmail,
    userFirstName,
    userLastName,
    userPhoneNumber,
    userIsActive,
    userRoleId,
    form,
  ]);

  useEffect(() => {
    if (!open || userId == null) {
      return;
    }

    if (userPermissionGroupsQuery.isLoading || userPermissionGroupsQuery.data == null) {
      return;
    }

    const current = form.getValues('permissionGroupIds') ?? [];
    const next = userPermissionGroupsQuery.data;
    const same =
      current.length === next.length &&
      current.every((value, index) => value === next[index]);

    if (!same) {
      form.setValue('permissionGroupIds', next, { shouldDirty: false, shouldTouch: false });
    }
  }, [open, userId, userPermissionGroupsQuery.isLoading, userPermissionGroupsQuery.data, form]);

  useEffect(() => {
    if (!open || userId == null || roleOptions.length === 0) {
      return;
    }

    const currentRole = form.getValues('roleId');
    if (currentRole && currentRole > 0) {
      return;
    }

    const matchedRole = roleOptions.find((r) => r.label === userRoleLabel);
    if (matchedRole) {
      form.setValue('roleId', matchedRole.value, { shouldDirty: false, shouldTouch: false });
    }
  }, [open, userId, userRoleLabel, roleOptions, form]);

  useEffect(() => {
    if (roleOptions.length === 0 || !selectedRoleId) {
      return;
    }

    if (isAdminRole || systemAdminGroupIds.length === 0) {
      return;
    }

    const selectedGroupIds = form.getValues('permissionGroupIds') ?? [];
    if (selectedGroupIds.length === 0) {
      return;
    }

    const filteredGroupIds = selectedGroupIds.filter((id) => !systemAdminGroupIds.includes(id));
    if (filteredGroupIds.length !== selectedGroupIds.length) {
      form.setValue('permissionGroupIds', filteredGroupIds, { shouldDirty: true, shouldTouch: true });
    }
  }, [isAdminRole, systemAdminGroupIds, form, roleOptions.length, selectedRoleId]);

  useEffect(() => {
    if (roleOptions.length === 0 || !selectedRoleId) {
      return;
    }

    if (!isAdminRole || systemAdminGroupIds.length === 0) {
      return;
    }

    const selectedGroupIds = form.getValues('permissionGroupIds') ?? [];
    const missingSystemAdminIds = systemAdminGroupIds.filter((id) => !selectedGroupIds.includes(id));
    if (missingSystemAdminIds.length === 0) {
      return;
    }

    form.setValue('permissionGroupIds', [...selectedGroupIds, ...missingSystemAdminIds], {
      shouldDirty: true,
      shouldTouch: true,
    });
  }, [isAdminRole, systemAdminGroupIds, form, roleOptions.length, selectedRoleId]);

  const handleSubmit = async (data: UserFormSchema | UserUpdateFormSchema): Promise<void> => {
    await onSubmit(data);
    if (!isLoading) {
      form.reset({
        username: '',
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        phoneNumber: '',
        roleId: 0,
        isActive: true,
        permissionGroupIds: [],
      });
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <AccessControlOpsDialogContent size="lg">
        <AccessControlOpsDialogHeader
          title={user ? t('userManagement.form.editUser') : t('userManagement.form.addUser')}
          description={user ? t('userManagement.form.editDescription') : t('userManagement.form.addDescription')}
        />

        <div className="wms-ops-form max-h-[min(72dvh,680px)] overflow-y-auto px-5 py-4">
          <Form {...form}>
            <form id="user-management-form" onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <AccessControlOpsFormField label={(
                        <>
                          {t('userManagement.form.username')}
                          {!isEditMode ? <span className="text-red-500">*</span> : null}
                        </>
                      )}>
                        <FormControl>
                          <OpsInput
                            {...field}
                            placeholder={t('userManagement.form.usernamePlaceholder')}
                            maxLength={50}
                            disabled={isEditMode}
                          />
                        </FormControl>
                      </AccessControlOpsFormField>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <AccessControlOpsFormField label={(
                        <>
                          {t('userManagement.form.email')}
                          {!isEditMode ? <span className="text-red-500">*</span> : null}
                        </>
                      )}>
                        <FormControl>
                          <OpsInput
                            {...field}
                            type="email"
                            placeholder={t('userManagement.form.emailPlaceholder')}
                          />
                        </FormControl>
                      </AccessControlOpsFormField>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {!isEditMode ? (
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <AccessControlOpsFormField label={(
                        <>
                          {t('userManagement.form.password')}
                          <span className="text-red-500">*</span>
                        </>
                      )}>
                        <FormControl>
                          <OpsInput
                            {...field}
                            type="password"
                            placeholder={t('userManagement.form.passwordPlaceholder')}
                          />
                        </FormControl>
                      </AccessControlOpsFormField>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : null}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <AccessControlOpsFormField label={t('userManagement.form.firstName')}>
                        <FormControl>
                          <OpsInput
                            {...field}
                            placeholder={t('userManagement.form.firstNamePlaceholder')}
                            maxLength={50}
                          />
                        </FormControl>
                      </AccessControlOpsFormField>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <AccessControlOpsFormField label={t('userManagement.form.lastName')}>
                        <FormControl>
                          <OpsInput
                            {...field}
                            placeholder={t('userManagement.form.lastNamePlaceholder')}
                            maxLength={50}
                          />
                        </FormControl>
                      </AccessControlOpsFormField>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <AccessControlOpsFormField label={t('userManagement.form.phoneNumber')}>
                        <FormControl>
                          <OpsInput
                            {...field}
                            placeholder={t('userManagement.form.phoneNumberPlaceholder')}
                            maxLength={20}
                          />
                        </FormControl>
                      </AccessControlOpsFormField>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="roleId"
                  render={({ field }) => (
                    <FormItem>
                      <AccessControlOpsFormField label={(
                        <>
                          {t('userManagement.form.role')}
                          {!isEditMode ? <span className="text-red-500">*</span> : null}
                        </>
                      )}>
                        <FormControl>
                          <MasterDataOpsSelect
                            value={field.value ? String(field.value) : ''}
                            onValueChange={(v) => field.onChange(v ? parseInt(v, 10) : 0)}
                            placeholder={t('userManagement.form.rolePlaceholder')}
                            disabled={isLoading}
                          >
                            {roleOptions.map((opt) => (
                              <OpsSelectItem key={opt.value} value={String(opt.value)}>
                                {opt.label}
                              </OpsSelectItem>
                            ))}
                          </MasterDataOpsSelect>
                        </FormControl>
                      </AccessControlOpsFormField>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="permissionGroupIds"
                render={({ field }) => (
                  <FormItem>
                    <AccessControlOpsFormField label={t('userManagement.form.permissionGroups')}>
                      <FormControl>
                        <UserFormPermissionGroupSelect
                          value={field.value ?? []}
                          onChange={field.onChange}
                          disabled={isLoading}
                          isAdminRole={isAdminRole}
                        />
                      </FormControl>
                    </AccessControlOpsFormField>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <OpsCircuitToggleField
                        checked={field.value ?? true}
                        onCheckedChange={field.onChange}
                        title={t('userManagement.form.isActive')}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>

        <AccessControlOpsDialogFooter
          onCancel={() => onOpenChange(false)}
          cancelLabel={t('userManagement.form.cancel')}
          saveLabel={isLoading ? t('userManagement.form.saving') : t('userManagement.form.save')}
          isLoading={isLoading}
          saveDisabled={!isFormValid}
          saveType="submit"
          formId="user-management-form"
        />
      </AccessControlOpsDialogContent>
    </Dialog>
  );
}
