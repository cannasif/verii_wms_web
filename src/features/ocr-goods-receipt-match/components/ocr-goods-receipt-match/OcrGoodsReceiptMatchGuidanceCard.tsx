import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

export function OcrGoodsReceiptMatchGuidanceCard(): ReactElement {
  const { t } = useTranslation('common');

  return (
    <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50/80 p-4 text-sm text-emerald-900 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-100">
      <div className="font-semibold">{t('ocrGoodsReceiptMatch.guidance.title')}</div>
      <div className="mt-1">{t('ocrGoodsReceiptMatch.guidance.line1')}</div>
      <div>{t('ocrGoodsReceiptMatch.guidance.line2')}</div>
    </div>
  );
}
