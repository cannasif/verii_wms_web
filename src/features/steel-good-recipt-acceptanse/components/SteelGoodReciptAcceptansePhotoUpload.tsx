import { type ReactElement, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ImagePlus, Loader2, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
      <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/5">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="rounded-full bg-white p-3 shadow-sm dark:bg-slate-900">
            <ImagePlus className="h-5 w-5 text-slate-600 dark:text-slate-200" />
          </div>
          <div className="text-sm">
            <p className="font-semibold text-slate-900 dark:text-white">{t('steelGoodReceiptAcceptance.photos.addTitle')}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{t('steelGoodReceiptAcceptance.photos.addHint')}</p>
          </div>
          <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
            <Upload className="mr-2 h-4 w-4" />
            {t('steelGoodReceiptAcceptance.photos.select')}
          </Button>
          <Input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleSelect} />
        </div>
      </div>

      {files.length > 0 ? (
        <div className="space-y-3">
          {files.map((file, index) => (
            <div key={`${file.name}-${index}`} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-slate-950">
              <img src={previews[index]} alt={file.name} className="h-16 w-16 rounded-lg object-cover" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="truncate text-sm font-medium text-slate-900 dark:text-white">{file.name}</div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => handleRemove(index)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <Input
                  value={captions[index] ?? ''}
                  onChange={(event) => setCaptions((current) => current.map((value, i) => i === index ? event.target.value : value))}
                  placeholder={t('steelGoodReceiptAcceptance.photos.notePh')}
                />
              </div>
            </div>
          ))}

          <div className="flex justify-end">
            <Button type="button" onClick={() => void handleUpload()} disabled={isUploading}>
              {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              {t('steelGoodReceiptAcceptance.photos.uploadP')}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
