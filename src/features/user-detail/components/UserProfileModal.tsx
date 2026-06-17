import { type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ShieldCheck, X } from 'lucide-react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Building03Icon,
  LanguageCircleIcon,
  Logout02Icon,
  Mail02Icon,
  Moon02Icon,
  Sun02Icon,
  UserCircleIcon,
} from '@hugeicons/core-free-icons';
import { Dialog, DialogContent, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useTheme } from '@/components/theme-provider';
import { useAuthStore } from '@/stores/auth-store';
import { useUserDetail } from '../hooks/useUserDetail';
import { getFullProfileImageUrl } from '../utils/profile-image';
import { cn } from '@/lib/utils';
import { normalizeLanguage, setAppLanguage } from '@/lib/i18n';

type SupportedLanguage = {
  code: string;
  name: string;
  flagEmoji: string;
  flagLabel: string;
};

const SUPPORTED_LANGUAGES: readonly SupportedLanguage[] = [
  { code: 'tr', name: 'Türkçe', flagEmoji: '🇹🇷', flagLabel: 'TR' },
  { code: 'en', name: 'English', flagEmoji: '🇬🇧', flagLabel: 'EN' },
  { code: 'de', name: 'Deutsch', flagEmoji: '🇩🇪', flagLabel: 'DE' },
  { code: 'fr', name: 'Français', flagEmoji: '🇫🇷', flagLabel: 'FR' },
];

const settingsRowBaseClass = cn(
  'flex w-full items-center justify-between gap-3 rounded-[1.5rem] border px-4 py-3.5 sm:gap-4 sm:px-5 sm:py-4 md:rounded-[2rem]',
  'border-slate-200/70 bg-white/90 dark:border-white/[0.06] dark:bg-white/[0.03]',
  'md:min-h-0 md:flex-1 md:basis-0',
);

const settingsProfileRowClass = cn(
  settingsRowBaseClass,
  'group cursor-pointer text-left transition-[border-color,box-shadow,transform] duration-300',
  'hover:border-cyan-400/35 hover:bg-cyan-50/70 hover:shadow-[0_0_20px_rgba(34,211,238,0.12)]',
  'dark:hover:border-cyan-500/30 dark:hover:bg-cyan-500/[0.07] dark:hover:shadow-[0_0_24px_rgba(34,211,238,0.1)]',
);

const settingsIconClass =
  'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl shadow-sm sm:h-12 sm:w-12 md:h-14 md:w-14';

const settingsHugeiconSize = 22;
const settingsHugeiconStroke = 1.75;

export interface UserProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenProfileDetails: () => void;
}

export function UserProfileModal({
  open,
  onOpenChange,
  onOpenProfileDetails,
}: UserProfileModalProps): ReactElement {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuthStore();
  const { data: userDetail } = useUserDetail();

  const displayName = user?.name || user?.email || t('dashboard.user');
  const displayInitial = displayName.charAt(0).toUpperCase();
  const imageUrl = getFullProfileImageUrl(userDetail?.profilePictureUrl);
  const isDark = theme === 'dark';
  const currentLanguage =
    SUPPORTED_LANGUAGES.find((lang) => lang.code === normalizeLanguage(i18n.resolvedLanguage ?? i18n.language))
    ?? SUPPORTED_LANGUAGES[0];

  const handleLanguageChange = (value: string): void => {
    void setAppLanguage(value);
  };

  const handleLogout = (): void => {
    logout();
    onOpenChange(false);
    navigate('/auth/login');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          'gap-0 overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white p-0 text-slate-900 lg:rounded-[2.5rem]',
          'shadow-[0_28px_70px_rgba(15,23,42,0.14)] dark:border-white/[0.08] dark:bg-[#09090f] dark:text-white dark:shadow-[0_28px_90px_rgba(0,0,0,0.62)]',
          'grid w-[95vw] max-w-[95vw] grid-cols-1',
          'max-h-[min(620px,92vh)] overflow-y-auto',
          'sm:max-w-4xl sm:w-full',
          'lg:!max-w-[1100px]',
          'md:h-[min(620px,90vh)] md:max-h-[min(620px,90vh)] md:grid-cols-[320px_minmax(0,1fr)] md:overflow-hidden',
          'lg:grid-cols-[380px_minmax(0,1fr)]',
        )}
        aria-describedby="user-profile-description"
      >
        <DialogTitle className="sr-only">{t('sidebar.settings')}</DialogTitle>

        <DialogClose
          type="button"
          className={cn(
            'absolute right-4 top-4 z-20 flex cursor-pointer items-center justify-center rounded-2xl p-2.5 transition-[border-color,box-shadow,transform] duration-300 md:right-6 md:top-6',
            'border border-slate-200/80 bg-white/80 text-slate-500',
            'hover:border-red-300/50 hover:bg-red-50/90 hover:text-red-600 active:scale-90',
            'dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-400',
            'dark:hover:border-red-500/30 dark:hover:bg-red-950/30 dark:hover:text-red-400',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/25 focus-visible:ring-offset-0',
          )}
        >
          <X className="h-5 w-5" strokeWidth={2.25} aria-hidden />
          <span className="sr-only">{t('common.close')}</span>
        </DialogClose>

        <aside
          id="user-profile-description"
          aria-label={t('profile.title')}
          className={cn(
            'relative flex flex-col items-center justify-center gap-5 border-b border-slate-200/70 px-6 py-8 sm:gap-6 sm:px-8 sm:py-9',
            'bg-linear-to-b from-slate-50 to-white dark:border-white/[0.06] dark:from-[#0c0c14] dark:to-[#09090f]',
            'md:h-full md:min-h-0 md:shrink-0 md:border-b-0 md:border-r md:overflow-y-auto md:py-10',
            'md:w-[320px] lg:w-[380px]',
          )}
        >
          <div className="group relative shrink-0 cursor-pointer px-1 pb-2 pt-1">
            <div className="relative origin-center transition-transform duration-500 ease-out rotate-[2deg] group-hover:rotate-0 motion-reduce:rotate-0 motion-reduce:transition-none">
              <div className="rounded-[1.5rem] bg-white/95 p-1.5 shadow-md ring-1 ring-inset ring-slate-200/70 md:rounded-[2rem] md:p-2 dark:bg-zinc-900/50 dark:shadow-[0_12px_36px_rgba(9,9,11,0.42),0_0_36px_-8px_rgba(56,189,248,0.22)] dark:ring-white/[0.07]">
                <div className="relative h-20 w-20 overflow-hidden rounded-[1.25rem] md:h-40 md:w-40 md:rounded-[1.5rem]">
                  {imageUrl ? (
                    <img src={imageUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-sky-400 via-sky-500 to-orange-500">
                      <span className="text-3xl font-bold tracking-tight text-white md:text-6xl">{displayInitial}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-2xl bg-emerald-500 ring-[3px] ring-white md:h-9 md:w-9 dark:ring-[#09090f]">
                <ShieldCheck className="h-4 w-4 text-white md:h-[18px] md:w-[18px]" strokeWidth={2.25} aria-hidden />
              </div>
            </div>
          </div>

          <div className="flex min-w-0 flex-col items-center gap-2.5 text-center sm:gap-3">
            <p className="max-w-full px-1 text-lg font-bold tracking-tight text-slate-900 md:text-2xl lg:text-3xl dark:text-white">
              {displayName}
            </p>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-linear-to-r from-sky-500 to-orange-500 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white shadow-[0_0_12px_rgba(14,165,233,0.22)]">
              <HugeiconsIcon icon={Building03Icon} size={13} strokeWidth={2} aria-hidden />
              {t('profile.organizationBadge')}
            </span>
          </div>

          <div className="flex w-full max-w-[min(280px,100%)] items-center gap-3 rounded-2xl border border-slate-200/70 bg-slate-50/90 px-4 py-3 shadow-sm dark:border-white/[0.06] dark:bg-white/[0.03]">
            <HugeiconsIcon
              icon={Mail02Icon}
              size={20}
              strokeWidth={1.75}
              className="shrink-0 text-cyan-600 dark:text-cyan-400"
              aria-hidden
            />
            <span className="min-w-0 truncate text-xs font-semibold text-slate-600 opacity-70 md:text-sm dark:text-slate-300">
              {user?.email ?? '—'}
            </span>
          </div>
        </aside>

        <div className="flex h-full min-h-0 min-w-0 flex-col bg-slate-50/80 md:overflow-hidden dark:bg-[#07070c]">
          <header className="flex shrink-0 items-center gap-3 border-b border-dashed border-slate-200/70 px-6 pb-4 pt-14 sm:px-8 md:px-10 md:pt-8 dark:border-white/[0.08]">
            <span
              className="h-8 w-0.5 shrink-0 rounded-full bg-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.4)]"
              aria-hidden
            />
            <h2 className="text-xl font-bold uppercase tracking-[0.12em] text-slate-900 sm:text-2xl lg:text-3xl dark:text-white">
              {t('sidebar.settings')}
            </h2>
          </header>

          <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2.5 overflow-y-auto px-6 py-3 sm:gap-3 sm:px-8 sm:py-4 md:justify-between md:px-10">
            <button type="button" onClick={onOpenProfileDetails} className={settingsProfileRowClass}>
              <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
                <span className={cn(settingsIconClass, 'bg-violet-600/90')}>
                  <HugeiconsIcon
                    icon={UserCircleIcon}
                    size={settingsHugeiconSize}
                    strokeWidth={settingsHugeiconStroke}
                    className="text-white"
                    aria-hidden
                  />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 sm:text-base dark:text-white">
                    {t('profile.settingsProfileInfo')}
                  </p>
                  <p className="mt-0.5 text-xs leading-snug text-slate-500 sm:mt-1 sm:text-sm dark:text-slate-400">
                    {t('profile.settingsProfileHint')}
                  </p>
                </div>
              </div>
              <ChevronRight
                className="h-5 w-5 shrink-0 text-slate-400 opacity-30 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-60 dark:text-slate-500"
                aria-hidden
              />
            </button>

            <div className={settingsRowBaseClass}>
              <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
                <span className={cn(settingsIconClass, 'bg-cyan-600/90')}>
                  <HugeiconsIcon
                    icon={LanguageCircleIcon}
                    size={settingsHugeiconSize}
                    strokeWidth={settingsHugeiconStroke}
                    className="text-white"
                    aria-hidden
                  />
                </span>
                <span className="text-sm font-semibold text-slate-900 sm:text-base dark:text-white">
                  {t('profile.settingsLanguage')}
                </span>
              </div>
              <Select value={currentLanguage.code} onValueChange={handleLanguageChange}>
                <SelectTrigger
                  className={cn(
                    'h-10 w-auto min-w-[5.75rem] shrink-0 gap-2 rounded-xl border px-3 text-sm font-semibold shadow-none transition-all duration-300 sm:h-11 sm:min-w-[6.5rem] sm:px-4 sm:text-base',
                    'border-cyan-400/35 bg-cyan-500/10 text-cyan-800 hover:border-cyan-400/50 hover:bg-cyan-500/15',
                    'dark:border-cyan-500/35 dark:bg-cyan-500/12 dark:text-cyan-100 dark:hover:bg-cyan-500/18',
                    '[&_[data-slot=select-value]]:gap-1.5 [&_[data-slot=select-value]]:flex [&_[data-slot=select-value]]:items-center',
                    '[&_svg]:text-cyan-600 dark:[&_svg]:text-cyan-300',
                  )}
                >
                  <SelectValue placeholder={currentLanguage.flagLabel} />
                </SelectTrigger>
                <SelectContent
                  className={cn(
                    'rounded-2xl border border-cyan-400/25 bg-white text-slate-900 shadow-2xl',
                    'dark:border-cyan-500/30 dark:bg-[#0f1419] dark:text-white',
                  )}
                >
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <SelectItem
                      key={lang.code}
                      value={lang.code}
                      textValue={lang.name}
                      className="rounded-xl focus:bg-cyan-500/10 dark:focus:bg-cyan-500/15"
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-base leading-none" aria-hidden>
                          {lang.flagEmoji}
                        </span>
                        <span className="font-semibold tracking-wide">{lang.flagLabel}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className={settingsRowBaseClass}>
              <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
                <span className={cn(settingsIconClass, 'bg-orange-700/90')}>
                  <HugeiconsIcon
                    icon={isDark ? Moon02Icon : Sun02Icon}
                    size={settingsHugeiconSize}
                    strokeWidth={settingsHugeiconStroke}
                    className="text-white"
                    aria-hidden
                  />
                </span>
                <span className="text-sm font-semibold text-slate-900 sm:text-base dark:text-white">
                  {t('profile.settingsAppearance')}
                </span>
              </div>
              <Switch
                checked={isDark}
                onCheckedChange={() => setTheme(isDark ? 'light' : 'dark')}
                className={cn(
                  'data-[state=unchecked]:bg-slate-300 dark:data-[state=unchecked]:bg-zinc-700',
                  'data-[state=checked]:bg-cyan-400 dark:data-[state=checked]:bg-cyan-500',
                  'data-[state=checked]:shadow-[0_0_12px_rgba(34,211,238,0.35)]',
                )}
              />
            </div>
          </div>

          <div className="shrink-0 border-t border-dashed border-slate-200/70 bg-white/80 px-6 py-4 dark:border-white/[0.06] dark:bg-[#07070c] sm:px-8 sm:py-5 md:px-10">
            <button
              type="button"
              onClick={handleLogout}
              className={cn(
                'flex h-12 w-full cursor-pointer items-center justify-center gap-3 rounded-[1.25rem] bg-linear-to-r from-sky-600 via-sky-500 to-orange-500 px-6 md:h-14',
                'text-sm font-bold uppercase tracking-[0.08em] text-white transition-all duration-300 sm:text-base',
                'shadow-[0_8px_24px_rgba(14,165,233,0.22)] dark:shadow-[0_8px_28px_rgba(14,165,233,0.28)]',
                'hover:scale-[1.01] hover:brightness-[1.05] hover:shadow-[0_10px_32px_rgba(14,165,233,0.38),0_0_28px_rgba(251,146,60,0.22),0_0_48px_rgba(34,211,238,0.12)]',
                'active:scale-[0.98]',
                'dark:hover:shadow-[0_10px_36px_rgba(14,165,233,0.42),0_0_32px_rgba(251,146,60,0.26),0_0_52px_rgba(34,211,238,0.14)]',
              )}
            >
              <HugeiconsIcon icon={Logout02Icon} size={20} strokeWidth={1.75} className="shrink-0 text-white" aria-hidden />
              {t('auth.logout')}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
