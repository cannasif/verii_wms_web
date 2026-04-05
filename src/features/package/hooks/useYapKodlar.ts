import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { lookupApi } from '@/services/lookup-api';
import { PACKAGE_QUERY_KEYS } from '../utils/query-keys';

export function useYapKodlar() {
  const { t } = useTranslation();

  const query = useQuery({
    queryKey: [PACKAGE_QUERY_KEYS.YAP_KODS],
    queryFn: ({ signal }) => lookupApi.getYapKodlar({ signal }),
    staleTime: 2 * 60 * 60 * 1000,
  });

  useEffect(() => {
    if (query.isError && query.error) {
      toast.error(query.error instanceof Error ? query.error.message : t('common.generalError'));
    }
  }, [query.error, query.isError, t]);

  return query;
}
