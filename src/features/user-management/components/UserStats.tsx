import { type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { useUserStats } from '../hooks/useUserStats';
import { AccessControlOpsStatGrid } from '@/features/access-control';

export function UserStats(): ReactElement {
  const { t } = useTranslation(['user-management', 'common']);
  const { data: stats, isLoading } = useUserStats();

  if (isLoading) {
    return (
      <AccessControlOpsStatGrid
        className="md:grid-cols-2 lg:grid-cols-4"
        items={[
          { label: t('userManagement.stats.totalUsers'), value: '…' },
          { label: t('userManagement.stats.activeUsers'), value: '…' },
          { label: t('userManagement.stats.newThisMonth'), value: '…' },
          { label: t('userManagement.stats.confirmedUsers'), value: '…' },
        ]}
      />
    );
  }

  if (!stats) {
    return <></>;
  }

  return (
    <AccessControlOpsStatGrid
      className="md:grid-cols-2 lg:grid-cols-4"
      items={[
        { label: t('userManagement.stats.totalUsers'), value: stats.totalUsers },
        { label: t('userManagement.stats.activeUsers'), value: stats.activeUsers },
        { label: t('userManagement.stats.newThisMonth'), value: stats.newThisMonth },
        { label: t('userManagement.stats.confirmedUsers'), value: stats.confirmedUsers },
      ]}
    />
  );
}
