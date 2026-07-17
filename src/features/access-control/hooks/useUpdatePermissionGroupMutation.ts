import { useMutation, useQueryClient } from '@tanstack/react-query';
import { permissionGroupApi } from '../api/permissionGroupApi';
import type { UpdatePermissionGroupDto } from '../types/access-control.types';
import { ACCESS_CONTROL_QUERY_KEYS } from '../utils/query-keys';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

export const useUpdatePermissionGroupMutation = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation('common');
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: UpdatePermissionGroupDto }) =>
      permissionGroupApi.update(id, dto),
    onSuccess: () => {
      toast.success(t('saveSuccess'));
      queryClient.invalidateQueries({ queryKey: ['permissions', 'groups'] });
      queryClient.invalidateQueries({ queryKey: ACCESS_CONTROL_QUERY_KEYS.ME_PERMISSIONS_BASE });
    },
    onError: (error: Error) => {
      toast.error(error.message || t('errors.requestFailed'));
    },
  });
};
