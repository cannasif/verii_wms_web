import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { goodsReceiptApi } from '../api/goods-receipt-api';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { GOODS_RECEIPT_QUERY_KEYS } from '../utils/query-keys';

export const useWarehouses = () => {
  const { t } = useTranslation();

  const query = useQuery({
    queryKey: [GOODS_RECEIPT_QUERY_KEYS.WAREHOUSES],
    queryFn: () => goodsReceiptApi.getWarehouses(),
    staleTime: 60 * 60 * 1000,
  });

  useEffect(() => {
    if (query.isError && query.error) {
      toast.error(
        query.error instanceof Error
          ? query.error.message
          : t('common.generalError', 'Bir hata oluştu. Lütfen tekrar deneyin.'),
      );
    }
  }, [query.isError, query.error, t]);

  return query;
};
