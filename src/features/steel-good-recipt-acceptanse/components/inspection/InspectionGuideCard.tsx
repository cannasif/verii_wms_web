import { type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { MasterDataOpsSection } from '@/features/shared';

export function InspectionGuideCard(): ReactElement {
  const { t } = useTranslation('common');

  return (
    <MasterDataOpsSection title={t('steelGoodReceiptAcceptance.inspection.flowGuideTitle')}>
      <div className="grid gap-3 text-sm md:grid-cols-3">
        <div className="wms-ops-kkd-result-panel wms-ops-kkd-result-panel--success p-4">
          <div className="font-medium">{t('steelGoodReceiptAcceptance.inspection.approveTitle')}</div>
          <div className="mt-1 opacity-80">{t('steelGoodReceiptAcceptance.inspection.approveDesc')}</div>
        </div>
        <div className="wms-ops-kkd-result-panel wms-ops-kkd-result-panel--danger p-4">
          <div className="font-medium">{t('steelGoodReceiptAcceptance.inspection.rejectTitle')}</div>
          <div className="mt-1 opacity-80">{t('steelGoodReceiptAcceptance.inspection.rejectDesc')}</div>
        </div>
        <div className="wms-ops-kkd-result-panel wms-ops-kkd-result-panel--warn p-4">
          <div className="font-medium">{t('steelGoodReceiptAcceptance.inspection.partialTitle')}</div>
          <div className="mt-1 opacity-80">{t('steelGoodReceiptAcceptance.inspection.partialDesc')}</div>
        </div>
      </div>
    </MasterDataOpsSection>
  );
}
