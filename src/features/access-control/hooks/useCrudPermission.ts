import { useMemo } from 'react';
import { usePermissionAccess } from './usePermissionAccess';

export interface CrudPermissionAccess {
  canView: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canEdit: boolean;
  canMutate: boolean;
  can: (action: 'view' | 'create' | 'update' | 'delete') => boolean;
}

export function useCrudPermission(scope: string): CrudPermissionAccess {
  const permissionAccess = usePermissionAccess();

  return useMemo(() => {
    const canView = permissionAccess.can(`${scope}.view`);
    const canCreate = permissionAccess.can(`${scope}.create`);
    const canUpdate = permissionAccess.can(`${scope}.update`);
    const canDelete = permissionAccess.can(`${scope}.delete`);

    return {
      canView,
      canCreate,
      canUpdate,
      canDelete,
      canEdit: canUpdate,
      canMutate: canCreate || canUpdate || canDelete,
      can: (action) => permissionAccess.can(`${scope}.${action}`),
    };
  }, [permissionAccess, scope]);
}
