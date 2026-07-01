import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { XIcon } from 'lucide-react';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { OpsActionButton } from '@/components/shared';
import { cn } from '@/lib/utils';

type DeleteConfirmDialogProps = {
  open: boolean;
  title?: string;
  description?: string;
  itemLabel?: string | null;
  isPending?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
};

export function DeleteConfirmDialog({
  open,
  title,
  description,
  itemLabel,
  isPending = false,
  onOpenChange,
  onConfirm,
}: DeleteConfirmDialogProps): ReactElement {
  const { t } = useTranslation();
  const resolvedTitle = title ?? t('common.deleteConfirmTitle', { defaultValue: 'Kaydı sil' });
  const resolvedLabel = itemLabel ?? t('common.selected', { defaultValue: 'seçili' });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          'wms-ops-form wms-ops-detail-dialog wms-ops-delete-dialog max-w-md gap-0 overflow-hidden border-0 p-0 shadow-none',
        )}
      >
        <DialogHeader className="wms-ops-delete-dialog__header wms-ops-detail-dialog__header relative border-b px-6 py-4 pr-12 text-left">
          <DialogTitle className="wms-ops-detail-dialog__title wms-ops-delete-dialog__title min-w-0 pr-2">
            {resolvedTitle}
          </DialogTitle>
          <DialogClose
            className={cn('wms-ops-delete-dialog__close', isPending && 'pointer-events-none opacity-45')}
            aria-disabled={isPending}
          >
            <XIcon aria-hidden />
            <span className="sr-only">{t('common.close')}</span>
          </DialogClose>
        </DialogHeader>

        <div className="wms-ops-delete-dialog__body px-6 py-5">
          {description ? (
            <p className="wms-ops-delete-dialog__message">{description}</p>
          ) : (
            <p className="wms-ops-delete-dialog__message">
              <span className="wms-ops-subtitle-prefix" aria-hidden>{'> '}</span>
              <span className="wms-ops-delete-dialog__target">{resolvedLabel}</span>
              <span className="wms-ops-delete-dialog__suffix">
                {t('common.deleteConfirmSuffix', {
                  defaultValue: 'kaydını silmek istediğine emin misin? Bu işlem geri alınamaz.',
                })}
              </span>
            </p>
          )}
        </div>

        <DialogFooter className="wms-ops-delete-dialog__footer gap-2 border-t px-6 py-4 sm:justify-end sm:gap-2">
          <OpsActionButton type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={isPending}>
            {t('common.cancel')}
          </OpsActionButton>
          <button
            type="button"
            className="wms-ops-action-btn wms-ops-delete-btn"
            onClick={onConfirm}
            disabled={isPending}
          >
            <span className="wms-ops-delete-btn__label">
              {isPending ? t('common.processing') : t('common.delete')}
            </span>
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
