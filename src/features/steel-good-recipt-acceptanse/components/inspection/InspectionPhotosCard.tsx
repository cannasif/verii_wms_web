import { type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { SteelGoodReciptAcceptansePhotoDto } from '../../types/steel-good-recipt-acceptanse.types';
import { SteelGoodReciptAcceptansePhotoUpload } from '../SteelGoodReciptAcceptansePhotoUpload';

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
    <Card className="shrink-0 border-white/10 bg-white/5">
      <CardHeader>
        <CardTitle>{t('steelGoodReceiptAcceptance.inspection.photosTitle')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <SteelGoodReciptAcceptansePhotoUpload lineId={lineId} onUploaded={onUploaded} />

        <div className="space-y-3">
          {photos.map((photo) => (
            <div key={photo.id} className="flex items-start gap-3 rounded-xl border border-white/10 p-3">
              <img src={photo.imageUrl} alt={photo.caption ?? photo.id.toString()} className="h-20 w-20 rounded-lg object-cover" />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">{photo.caption || t('steelGoodReceiptAcceptance.inspection.photo')}</div>
                <div className="text-xs text-slate-400">{photo.createdDate ?? '-'}</div>
              </div>
              <Button type="button" variant="ghost" onClick={() => onDeletePhoto(photo.id)}>
                {t('common.delete')}
              </Button>
            </div>
          ))}
          {photos.length === 0 ? (
            <div className="rounded-xl border border-white/10 p-4 text-sm text-slate-400">{t('steelGoodReceiptAcceptance.inspection.noPhotos')}</div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
