import { type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function InspectionGuideCard(): ReactElement {
  const { t } = useTranslation('common');

  return (
    <Card className="border-white/10 bg-white/5">
      <CardHeader>
        <CardTitle>{t('steelGoodReceiptAcceptance.inspection.flowGuideTitle')}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 text-sm text-slate-300 md:grid-cols-3">
        <div className="rounded-xl border border-sky-400/20 bg-sky-500/10 p-4">
          <div className="font-medium text-sky-200">{t('steelGoodReceiptAcceptance.inspection.approveTitle')}</div>
          <div>{t('steelGoodReceiptAcceptance.inspection.approveDesc')}</div>
        </div>
        <div className="rounded-xl border border-rose-400/20 bg-rose-500/10 p-4">
          <div className="font-medium text-rose-200">{t('steelGoodReceiptAcceptance.inspection.rejectTitle')}</div>
          <div>{t('steelGoodReceiptAcceptance.inspection.rejectDesc')}</div>
        </div>
        <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-4">
          <div className="font-medium text-amber-200">{t('steelGoodReceiptAcceptance.inspection.partialTitle')}</div>
          <div>{t('steelGoodReceiptAcceptance.inspection.partialDesc')}</div>
        </div>
      </CardContent>
    </Card>
  );
}
