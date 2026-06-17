import { type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Languages } from 'lucide-react';
import { cn } from '@/lib/utils';
import { normalizeLanguage, setAppLanguage } from '@/lib/i18n';

const languages = [
  { code: 'tr', flag: '🇹🇷' },
  { code: 'en', flag: '🇬🇧' },
  { code: 'de', flag: '🇩🇪' },
  { code: 'fr', flag: '🇫🇷' },
] as const;

interface LanguageSwitcherProps {
  variant?: 'default' | 'pill';
}

export function LanguageSwitcher({ variant = 'default' }: LanguageSwitcherProps): ReactElement {
  const { i18n, t } = useTranslation('common');

  const normalizedLanguage = normalizeLanguage(i18n.resolvedLanguage ?? i18n.language);
  const currentLanguage = languages.find((lang) => lang.code === normalizedLanguage) || languages[0];
  const currentName = t(`languageNames.${normalizedLanguage}` as never);

  const handleLanguageChange = (value: string): void => {
    void setAppLanguage(value);
  };

  return (
    <Select value={normalizedLanguage} onValueChange={handleLanguageChange}>
      <SelectTrigger
        aria-label={currentName}
        className={cn(
          'h-10 w-[140px] border bg-background shadow-lg hover:bg-accent',
          variant === 'pill' &&
            'h-11 w-11 justify-center rounded-full border-sky-400/20 bg-slate-900/80 p-0 text-cyan-300 shadow-[0_0_14px_rgba(56,132,246,0.20)] backdrop-blur-xl transition-all duration-300 hover:border-cyan-400/50 hover:bg-slate-900 hover:text-cyan-200 hover:shadow-[0_0_20px_rgba(56,132,246,0.40)] [&>svg]:hidden'
        )}
      >
        {variant === 'pill' ? (
          <span className="flex items-center justify-center">
            <Languages className="h-5 w-5 text-cyan-300" />
          </span>
        ) : (
          <div className="flex items-center gap-2 flex-1">
            <Languages className="h-4 w-4 shrink-0" />
            <SelectValue>
              <span className="flex items-center gap-1.5">
                <span className="text-base">{currentLanguage.flag}</span>
                <span className="hidden text-sm sm:inline">{currentName}</span>
              </span>
            </SelectValue>
          </div>
        )}
      </SelectTrigger>
      <SelectContent
        className={cn(
          variant === 'pill' && 'border-sky-400/20 !bg-[#0b1733] text-white shadow-[0_0_24px_rgba(56,132,246,0.18)]'
        )}
      >
        {languages.map((language) => (
          <SelectItem
            key={language.code}
            value={language.code}
            className={cn(
              'cursor-pointer',
              variant === 'pill' &&
                'focus:!bg-sky-500/25 focus:!text-white data-[state=checked]:!text-sky-300'
            )}
          >
            <div className="flex items-center gap-2">
              <span className="text-base">{language.flag}</span>
              <span>{t(`languageNames.${language.code}` as never)}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
