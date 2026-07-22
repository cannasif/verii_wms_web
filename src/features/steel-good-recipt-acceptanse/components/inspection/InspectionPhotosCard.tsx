import { type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { OpsActionButton } from '@/components/shared';
import { MasterDataOpsEmptyState, MasterDataOpsSection } from '@/features/shared';
import type { SteelGoodReciptAcceptansePhotoDto } from '../../types/steel-good-recipt-acceptanse.types';
import { SteelGoodReciptAcceptansePhotoUpload } from '../SteelGoodReciptAcceptansePhotoUpload';
import { InspectionPhotoThumb } from './InspectionPhotoThumb';

interface InspectionPhotosCardProps {
  lineId: number;
  photos: SteelGoodReciptAcceptansePhotoDto[];
  onUploaded: () => Promise<void>;
  onDeletePhoto: (photoId: number) => void;
}

export function InspectionPhotosCard({
  lineId,
  photos,
  onUploaded,
  onDeletePhoto,
}: InspectionPhotosCardProps): ReactElement {
  const { t } = useTranslation('common');

  return (
    <MasterDataOpsSection title={t('steelGoodReceiptAcceptance.inspection.photosTitle')}>
      <SteelGoodReciptAcceptansePhotoUpload lineId={lineId} onUploaded={onUploaded} />

      <div className="mt-4 space-y-3">
        {photos.map((photo) => (
          <div key={photo.id} className="flex items-start gap-3 border border-[color-mix(in_oklab,var(--wms-ops-accent)_14%,var(--wms-ops-card-border))] p-3">
            <InspectionPhotoThumb
              photoId={photo.id}
              alt={photo.caption ?? photo.id.toString()}
              className="h-20 w-20 object-cover"
            />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium">{photo.caption || t('steelGoodReceiptAcceptance.inspection.photo')}</div>
              <div className="text-xs opacity-70">{photo.createdDate ?? '-'}</div>
            </div>
            <OpsActionButton type="button" variant="secondary" onClick={() => onDeletePhoto(photo.id)}>
              {t('common.delete')}
            </OpsActionButton>
          </div>
        ))}
        {photos.length === 0 ? (
          <MasterDataOpsEmptyState>{t('steelGoodReceiptAcceptance.inspection.noPhotos')}</MasterDataOpsEmptyState>
        ) : null}
      </div>
    </MasterDataOpsSection>
  );
}
