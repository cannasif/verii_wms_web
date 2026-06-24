import { type ReactElement, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ImagePlus, Loader2, Upload, X } from 'lucide-react';
import { OpsActionButton, OpsInput } from '@/components/shared';
import { MasterDataOpsResultPanel } from '@/features/shared';
import { steelGoodReciptAcceptanseApi } from '../api/steel-good-recipt-acceptanse.api';

interface Props {
  lineId: number;
  onUploaded: () => Promise<void> | void;
}

export function SteelGoodReciptAcceptansePhotoUpload({ lineId, onUploaded }: Props): ReactElement {
  const { t } = useTranslation('common');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [captions, setCaptions] = useState<string[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const next = files.map((file) => URL.createObjectURL(file));
    setPreviews(next);
    return () => next.forEach((url) => URL.revokeObjectURL(url));
  }, [files]);

  function handleSelect(event: React.ChangeEvent<HTMLInputElement>): void {
    const selected = Array.from(event.target.files ?? []).filter((file) => file.type.startsWith('image/'));
    if (selected.length === 0) return;
    setFiles((current) => [...current, ...selected]);
    setCaptions((current) => [...current, ...selected.map(() => '')]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleRemove(index: number): void {
    setFiles((current) => current.filter((_, i) => i !== index));
    setCaptions((current) => current.filter((_, i) => i !== index));
  }

  async function handleUpload(): Promise<void> {
    if (files.length === 0 || isUploading) return;
    setIsUploading(true);
    try {
      await steelGoodReciptAcceptanseApi.uploadInspectionPhotos(lineId, files, captions);
      setFiles([]);
      setCaptions([]);
      await onUploaded();
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="space-y-4">
      <MasterDataOpsResultPanel className="p-4 text-center">
        <ImagePlus className="mx-auto mb-2 size-5 opacity-70" aria-hidden />
        <p className="font-semibold">{t('steelGoodReceiptAcceptance.photos.addTitle')}</p>
        <p className="mt-1 text-xs opacity-70">{t('steelGoodReceiptAcceptance.photos.addHint')}</p>
        <OpsActionButton type="button" variant="secondary" className="mt-3" onClick={() => fileInputRef.current?.click()}>
          <Upload className="size-4" />
          {t('steelGoodReceiptAcceptance.photos.select')}
        </OpsActionButton>
        <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleSelect} />
      </MasterDataOpsResultPanel>

      {files.length > 0 ? (
        <div className="space-y-3">
          {files.map((file, index) => (
            <div key={`${file.name}-${index}`} className="flex items-start gap-3 border border-[color-mix(in_oklab,var(--wms-ops-accent)_14%,var(--wms-ops-card-border))] p-3">
              <img src={previews[index]} alt={file.name} className="h-16 w-16 object-cover" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="truncate text-sm font-medium">{file.name}</div>
                  <OpsActionButton type="button" variant="secondary" onClick={() => handleRemove(index)}>
                    <X className="size-4" />
                  </OpsActionButton>
                </div>
                <OpsInput
                  value={captions[index] ?? ''}
                  onChange={(event) => setCaptions((current) => current.map((value, i) => i === index ? event.target.value : value))}
                  placeholder={t('steelGoodReceiptAcceptance.photos.notePh')}
                />
              </div>
            </div>
          ))}

          <div className="flex justify-end">
            <OpsActionButton type="button" variant="primary" onClick={() => void handleUpload()} disabled={isUploading}>
              {isUploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
              {t('steelGoodReceiptAcceptance.photos.uploadP')}
            </OpsActionButton>
          </div>
        </div>
      ) : null}
    </div>
  );
}
