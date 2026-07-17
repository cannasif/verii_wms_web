import { useMutation, useQueryClient } from '@tanstack/react-query';
import { permissionDefinitionApi } from '../api/permissionDefinitionApi';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

export const useDeletePermissionDefinitionMutation = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation('common');
  return useMutation({
    mutationFn: (id: number) => permissionDefinitionApi.delete(id),
    onSuccess: () => {
      toast.success(t('deleteSuccess'));
      queryClient.invalidateQueries({ queryKey: ['permissions', 'definitions'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || t('errors.deleteFailed'));
    },
  });
};
