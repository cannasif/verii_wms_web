import type { ReactElement } from 'react';
import { MasterDataOpsSection } from '@/features/shared';
import type { TFunction } from 'i18next';

interface PlacementGuideCardProps {
  t: TFunction<'common'>;
}

export function PlacementGuideCard({ t }: PlacementGuideCardProps): ReactElement {
  return (
    <MasterDataOpsSection title={t('steelGoodReceiptAcceptance.placement.guideTitle')}>
      <div className="space-y-3 text-sm">
        <div className="wms-ops-kkd-result-panel wms-ops-kkd-result-panel--success p-3">
          <div className="font-medium">{t('steelGoodReceiptAcceptance.placement.presetBesideTitle')}</div>
          <div className="mt-1 opacity-80">{t('steelGoodReceiptAcceptance.placement.presetBesideDesc')}</div>
        </div>
        <div className="wms-ops-kkd-result-panel p-3">
          <div className="font-medium">{t('steelGoodReceiptAcceptance.placement.presetBehindTitle')}</div>
          <div className="mt-1 opacity-80">{t('steelGoodReceiptAcceptance.placement.presetBehindDesc')}</div>
        </div>
        <div className="wms-ops-kkd-result-panel wms-ops-kkd-result-panel--warn p-3">
          <div className="font-medium">{t('steelGoodReceiptAcceptance.placement.presetAboveTitle')}</div>
          <div className="mt-1 opacity-80">{t('steelGoodReceiptAcceptance.placement.presetAboveDesc')}</div>
        </div>
      </div>
    </MasterDataOpsSection>
  );
}
