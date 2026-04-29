import type { ReactElement } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { TFunction } from 'i18next';

interface PlacementGuideCardProps {
  t: TFunction<'common'>;
}

export function PlacementGuideCard({ t }: PlacementGuideCardProps): ReactElement {
  return (
    <Card className="border-white/10 bg-white/5">
      <CardHeader>
        <CardTitle>{t('steelGoodReceiptAcceptance.placement.guideTitle')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-slate-300">
        <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-3">
          <div className="font-medium text-emerald-200">{t('steelGoodReceiptAcceptance.placement.presetBesideTitle')}</div>
          <div>{t('steelGoodReceiptAcceptance.placement.presetBesideDesc')}</div>
        </div>
        <div className="rounded-xl border border-sky-400/20 bg-sky-500/10 p-3">
          <div className="font-medium text-sky-200">{t('steelGoodReceiptAcceptance.placement.presetBehindTitle')}</div>
          <div>{t('steelGoodReceiptAcceptance.placement.presetBehindDesc')}</div>
        </div>
        <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-3">
          <div className="font-medium text-amber-200">{t('steelGoodReceiptAcceptance.placement.presetAboveTitle')}</div>
          <div>{t('steelGoodReceiptAcceptance.placement.presetAboveDesc')}</div>
        </div>
      </CardContent>
    </Card>
  );
}
