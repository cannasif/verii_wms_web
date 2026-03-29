import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { goodsReceiptApi } from '../api/goods-receipt-api';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export const useOrdersByCustomer = (customerCode: string | null) => {
  const { t } = useTranslation();

  const query = useQuery({
    queryKey: ['orders', customerCode],
    queryFn: ({ signal }) => goodsReceiptApi.getOrdersByCustomer(customerCode!, { signal }),
    enabled: !!customerCode,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (query.isError && query.error) {
      toast.error(
        query.error instanceof Error
          ? query.error.message
          : t('common.generalError')
      );
    }
  }, [query.isError, query.error, t]);

  return query;
};

