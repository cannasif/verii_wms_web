import { useMutation, useQueryClient } from '@tanstack/react-query';
import { permissionGroupApi } from '../api/permissionGroupApi';
import type { SetPermissionGroupPermissionsDto } from '../types/access-control.types';
import { ACCESS_CONTROL_QUERY_KEYS } from '../utils/query-keys';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

export const useSetPermissionGroupPermissionsMutation = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation('common');
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: SetPermissionGroupPermissionsDto }) =>
      permissionGroupApi.setPermissions(id, dto),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['permissions', 'groups'] });
      await queryClient.invalidateQueries({ queryKey: ACCESS_CONTROL_QUERY_KEYS.ME_PERMISSIONS_BASE });
      await queryClient.refetchQueries({
        queryKey: ACCESS_CONTROL_QUERY_KEYS.ME_PERMISSIONS_BASE,
        type: 'active',
      });
      toast.success(t('saveSuccess'));
    },
    onError: (error: Error) => {
      toast.error(error.message || t('errors.permissionGroupSetPermissionsFailed'));
    },
  });
};
