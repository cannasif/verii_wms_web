import { type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useVoiceSearch } from '@/hooks/useVoiceSearch';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface VoiceSearchButtonProps {
  onResult: (text: string) => void;
  className?: string;
  size?: 'sm' | 'default' | 'lg' | 'icon';
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
}

export function VoiceSearchButton({
  onResult,
  className,
  size = 'icon',
  variant = 'ghost',
}: VoiceSearchButtonProps): ReactElement {
  const { t } = useTranslation();
  const { isListening, error, isSupported, startListening, stopListening } = useVoiceSearch({
    onResult: (text) => {
      onResult(text);
      if (text.trim()) {
        toast.success(t('voiceSearch.completed'));
      }
    },
  });

  const handleClick = (): void => {
    if (!isSupported) {
      toast.error(t('voiceSearch.unsupported'));
      return;
    }

    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  if (error) {
    toast.error(error);
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleClick}
      className={cn(
        'shrink-0',
        isListening && 'wms-ops-voice-btn--listening animate-pulse',
        !className?.includes('wms-ops-voice-btn') && isListening && 'bg-primary text-primary-foreground',
        className,
      )}
      disabled={!isSupported}
      title={isListening ? t('voiceSearch.stop') : t('voiceSearch.start')}
    >
      {isListening ? (
        <MicOff className="size-3.5" aria-hidden />
      ) : (
        <Mic className="size-3.5" aria-hidden />
      )}
    </Button>
  );
}
