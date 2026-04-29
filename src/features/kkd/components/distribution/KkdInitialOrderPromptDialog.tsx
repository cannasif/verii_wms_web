import { type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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
  const { t } = useTranslation('common');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t(`${dist}.initialPromptTitle`)}</DialogTitle>
          <DialogDescription>{t(`${dist}.initialPromptDesc`)}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onAnswer(false)}>
            {t(`${dist}.initialPromptNo`)}
          </Button>
          <Button type="button" onClick={() => onAnswer(true)}>
            {t(`${dist}.initialPromptYes`)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
