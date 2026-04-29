import type { ChangeEvent, ReactElement, RefObject } from 'react';
import { ImagePlus, Loader2, Trash2, Upload } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { FormPageShell } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { VehicleCheckInHeaderDto } from '../../types/vehicle-check-in.types';
import { formatDateTime } from './shared';

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
    <FormPageShell title={t('vehicleCheckIn.images.title')} description={t('vehicleCheckIn.images.description')}>
      <div className="space-y-4">
        {!currentRecord ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-6 text-sm text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
            {t('vehicleCheckIn.images.saveHint')}
          </div>
        ) : (
          <>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/5">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium">
                <ImagePlus className="size-4" />
                {t('vehicleCheckIn.images.add')}
              </div>
              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <Input ref={fileInputRef} type="file" accept="image/*" multiple onChange={onFileSelect} />
                <Button
                  type="button"
                  variant="outline"
                  onClick={onUpload}
                  disabled={selectedFiles.length === 0 || uploadPending}
                >
                  {uploadPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Upload className="mr-2 size-4" />}
                  {t('vehicleCheckIn.images.upload')}
                </Button>
              </div>
              {selectedFiles.length > 0 ? (
                <div className="mt-3 text-xs text-slate-500">
                  {selectedFiles.map((file) => file.name).join(', ')}
                </div>
              ) : null}
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {currentRecord.images.map((image) => (
                <div key={image.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-950">
                  <img src={image.fileUrl} alt={image.fileName || image.fileUrl} className="h-48 w-full object-cover" />
                  <div className="space-y-3 p-3">
                    <div className="text-sm font-medium text-slate-900 dark:text-white">{image.fileName || t('vehicleCheckIn.images.image')}</div>
                    <div className="text-xs text-slate-500">{formatDateTime(image.createdDate)}</div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onDeleteImage(image.id)}
                      disabled={deletePending}
                    >
                      <Trash2 className="mr-2 size-4" />
                      {t('vehicleCheckIn.images.delete')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {currentRecord.images.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-6 text-sm text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                {t('vehicleCheckIn.images.empty')}
              </div>
            ) : null}
          </>
        )}
      </div>
    </FormPageShell>
  );
}
