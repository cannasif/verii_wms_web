import type { ChangeEvent, ReactElement, RefObject } from 'react';
import { ImagePlus, Loader2, Trash2, Upload } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { OpsActionButton } from '@/components/shared';
import {
  MasterDataOpsEmptyState,
  MasterDataOpsFormField,
  MasterDataOpsSection,
} from '@/features/shared';
import type { VehicleCheckInHeaderDto } from '../../types/vehicle-check-in.types';
import { formatDateTime } from './shared';
import { VehicleCheckInAuthImage } from './VehicleCheckInAuthImage';

interface VehicleCheckInImagesSectionProps {
  currentRecord: VehicleCheckInHeaderDto | null;
  selectedFiles: File[];
  fileInputRef: RefObject<HTMLInputElement | null>;
  onFileSelect: (event: ChangeEvent<HTMLInputElement>) => void;
  onUpload: () => void;
  uploadPending: boolean;
  onDeleteImage: (imageId: number) => void;
  deletePending: boolean;
}

export function VehicleCheckInImagesSection({
  currentRecord,
  selectedFiles,
  fileInputRef,
  onFileSelect,
  onUpload,
  uploadPending,
  onDeleteImage,
  deletePending,
}: VehicleCheckInImagesSectionProps): ReactElement {
  const { t } = useTranslation('common');

  return (
    <MasterDataOpsSection title={t('vehicleCheckIn.images.title')} subtitle={t('vehicleCheckIn.images.description')}>
      {!currentRecord ? (
        <MasterDataOpsEmptyState>{t('vehicleCheckIn.images.saveHint')}</MasterDataOpsEmptyState>
      ) : (
        <div className="space-y-5">
          <MasterDataOpsFormField label={t('vehicleCheckIn.images.add')}>
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:gap-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={onFileSelect}
                className="wms-ops-list-field-trigger w-full min-w-0 text-sm file:mr-3 file:border-0 file:bg-transparent file:font-semibold file:uppercase file:tracking-wide"
              />
              <OpsActionButton
                type="button"
                variant="secondary"
                onClick={onUpload}
                disabled={selectedFiles.length === 0 || uploadPending}
              >
                {uploadPending ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
                {t('vehicleCheckIn.images.upload')}
              </OpsActionButton>
            </div>
            {selectedFiles.length > 0 ? (
              <p className="mt-2 text-xs opacity-70">{selectedFiles.map((file) => file.name).join(', ')}</p>
            ) : null}
          </MasterDataOpsFormField>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {currentRecord.images.map((image) => (
              <article key={image.id} className="wms-ops-kkd-employee-panel overflow-hidden">
                <VehicleCheckInAuthImage
                  imageId={image.id}
                  alt={image.fileName || image.fileUrl}
                  className="h-48 w-full object-cover"
                />
                <div className="space-y-3 p-3">
                  <div className="text-sm font-medium">{image.fileName || t('vehicleCheckIn.images.image')}</div>
                  <div className="text-xs opacity-70">{formatDateTime(image.createdDate)}</div>
                  <OpsActionButton type="button" variant="secondary" onClick={() => onDeleteImage(image.id)} disabled={deletePending}>
                    <Trash2 className="size-4" />
                    {t('vehicleCheckIn.images.delete')}
                  </OpsActionButton>
                </div>
              </article>
            ))}
          </div>

          {currentRecord.images.length === 0 ? (
            <MasterDataOpsEmptyState>
              <ImagePlus className="mx-auto mb-2 size-5 opacity-60" aria-hidden />
              {t('vehicleCheckIn.images.empty')}
            </MasterDataOpsEmptyState>
          ) : null}
        </div>
      )}
    </MasterDataOpsSection>
  );
}
