import { type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { OpsActionButton } from '@/components/shared';
import { Dialog, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { KkdOpsDialogContent } from '../kkd-ops-ui';

interface KkdInitialOrderPromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAnswer: (opened: boolean) => void;
}

const dist = 'kkd.operational.dist' as const;

export function KkdInitialOrderPromptDialog({
  open,
  onOpenChange,
  onAnswer,
}: KkdInitialOrderPromptDialogProps): ReactElement {
  const { t } = useTranslation(['kkd', 'common']);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <KkdOpsDialogContent className="max-w-md">
        <DialogHeader className="wms-ops-detail-dialog__header shrink-0 border-b px-4 py-4 pr-12 sm:px-6 sm:pr-14">
          <DialogTitle className="wms-ops-detail-dialog__title">{t(`${dist}.initialPromptTitle`)}</DialogTitle>
          <DialogDescription className="wms-ops-detail-dialog__description">{t(`${dist}.initialPromptDesc`)}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="wms-ops-detail-dialog__footer shrink-0 gap-2 border-t px-4 py-4 sm:px-6">
          <OpsActionButton type="button" variant="secondary" onClick={() => onAnswer(false)}>
            {t(`${dist}.initialPromptNo`)}
          </OpsActionButton>
          <OpsActionButton type="button" variant="primary" onClick={() => onAnswer(true)}>
            {t(`${dist}.initialPromptYes`)}
          </OpsActionButton>
        </DialogFooter>
      </KkdOpsDialogContent>
    </Dialog>
  );
}
