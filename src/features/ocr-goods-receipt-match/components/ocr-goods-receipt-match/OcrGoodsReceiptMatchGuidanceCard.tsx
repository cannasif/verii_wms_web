import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { MasterDataOpsGuidance } from '@/features/shared';

export function OcrGoodsReceiptMatchGuidanceCard(): ReactElement {
  const { t } = useTranslation('common');

  return (
    <MasterDataOpsGuidance
      title={t('ocrGoodsReceiptMatch.guidance.title')}
      lines={[t('ocrGoodsReceiptMatch.guidance.line1'), t('ocrGoodsReceiptMatch.guidance.line2')]}
    />
  );
}
