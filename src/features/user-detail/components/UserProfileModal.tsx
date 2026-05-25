import { type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Moon,
  Sun,
  LogOut,
  ChevronRight,
  Languages,
  ShieldCheck,
  X,
} from 'lucide-react';
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

  const settingsRowClass =
    'flex w-full min-h-[5rem] items-center justify-between gap-4 rounded-2xl border border-slate-200/90 bg-white px-5 py-5 transition-colors hover:bg-slate-50 md:min-h-0 md:flex-1 md:basis-0 dark:border-zinc-800/90 dark:bg-zinc-900/70 dark:hover:bg-zinc-900';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          'gap-0 overflow-hidden rounded-[1.75rem] border border-slate-200/90 bg-white p-0 text-slate-900 shadow-[0_24px_60px_rgba(15,23,42,0.1)] lg:rounded-[1.875rem]',
          'dark:border-zinc-800 dark:bg-[#09090f] dark:text-white dark:shadow-[0_24px_80px_rgba(0,0,0,0.65)]',
          'grid w-[calc(100vw-1rem)] max-w-[calc(100vw-1rem)] grid-cols-1 max-h-[85vh] overflow-y-auto sm:w-[min(76vw,calc(100vw-2rem))]',
          'sm:max-w-[min(76vw,calc(100vw-2rem))] md:max-w-[min(76vw,calc(100vw-2rem))] lg:max-w-[min(76vw,calc(100vw-3rem))]',
          'md:h-[min(78vh,920px)] md:max-h-[78vh] md:grid-cols-[minmax(260px,1fr)_minmax(0,2fr)] md:overflow-hidden'
        )}
        aria-describedby="user-profile-description"
      >
        <DialogTitle className="sr-only">{t('sidebar.settings')}</DialogTitle>

        <aside
          id="user-profile-description"
          aria-label={t('profile.title')}
          className="flex flex-col items-center gap-7 border-b border-slate-200/90 bg-linear-to-b from-slate-100 to-slate-50 px-8 py-10 md:h-full md:min-h-0 md:border-b-0 md:border-r md:overflow-y-auto dark:border-zinc-800/90 dark:from-zinc-900 dark:to-zinc-950"
        >
          <div className="group relative shrink-0 cursor-pointer px-2 pb-3 pt-3">
            <div className="relative origin-center transition-transform duration-300 ease-out rotate-[2deg] group-hover:rotate-0 motion-reduce:rotate-0 motion-reduce:transition-none">
              <div className="rounded-[26px] bg-white/95 p-2 shadow-md ring-1 ring-inset ring-slate-200/70 md:p-2.5 dark:bg-zinc-900/50 dark:shadow-[0_12px_36px_rgba(9,9,11,0.42),0_0_36px_-8px_rgba(56,189,248,0.22)] dark:ring-white/[0.07]">
                <div className="relative h-[148px] w-[148px] overflow-hidden rounded-[17px] ring-1 ring-slate-200/80 md:h-[158px] md:w-[158px] dark:ring-black/20">
                  {imageUrl ? (
                    <img src={imageUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-sky-400 via-sky-500 to-orange-500">
                      <span className="text-6xl font-bold tracking-tight text-white drop-shadow-md">{displayInitial}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="absolute -bottom-1 -right-1 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 shadow-md ring-[4px] ring-white dark:ring-zinc-950/90">
                <ShieldCheck className="h-5 w-5 text-white" strokeWidth={2.25} aria-hidden />
              </div>
            </div>
          </div>

          <div className="flex min-w-0 flex-col items-center gap-3 text-center">
            <p className="max-w-full px-1 text-xl font-bold tracking-tight text-slate-900 dark:text-white">{displayName}</p>
            <span className="rounded-full bg-linear-to-r from-sky-500 to-orange-500 px-4 py-1 text-xs font-semibold uppercase tracking-wider text-white shadow-[0_0_14px_rgba(14,165,233,0.28)] ring-1 ring-white/15">
              {t('profile.organizationBadge')}
            </span>
          </div>

          <div className="flex w-full max-w-[min(280px,85%)] items-center gap-3 rounded-xl border border-slate-200/90 bg-slate-100/80 px-4 py-3.5 dark:border-zinc-800/90 dark:bg-black/35">
            <Mail className="h-5 w-5 shrink-0 text-sky-600 dark:text-sky-400" aria-hidden />
            <span className="min-w-0 truncate text-sm text-slate-700 dark:text-orange-100/80">{user?.email ?? '—'}</span>
          </div>
        </aside>

        <div className="flex h-full min-h-0 min-w-0 flex-col bg-slate-50 md:max-h-none md:overflow-hidden dark:bg-[#07070c]">
          <header className="flex shrink-0 items-center justify-between gap-3 px-6 pb-3 pt-7 sm:gap-4 sm:px-10 sm:pt-8 md:pb-2">
            <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
              <span
                className="h-11 w-1 shrink-0 rounded-full bg-pink-500 shadow-[0_0_12px_rgba(236,72,153,0.45)]"
                aria-hidden
              />
              <h2 className="text-xl font-bold uppercase tracking-wide text-slate-900 sm:text-2xl lg:text-[1.65rem] lg:tracking-[0.14em] dark:text-white">
                {t('sidebar.settings')}
              </h2>
            </div>
            <DialogClose
              type="button"
              className={cn(
                'flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full border border-slate-300 bg-transparent text-slate-500 shadow-none transition-colors duration-200',
                'hover:border-red-900/35 hover:bg-red-950/[0.07] hover:text-red-900 dark:hover:border-red-900/45 dark:hover:bg-red-950/35 dark:hover:text-red-400',
                'dark:border-zinc-600 dark:bg-transparent dark:text-zinc-400 dark:shadow-none',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#07070c]'
              )}
            >
              <X className="h-5 w-5" strokeWidth={2.5} aria-hidden />
              <span className="sr-only">{t('common.close')}</span>
            </DialogClose>
          </header>

          <div
            className={cn(
              'flex min-h-0 min-w-0 flex-1 flex-col gap-3 overflow-y-auto overflow-x-hidden px-6 pb-6 pt-2 sm:px-10',
              'md:gap-3.5 md:py-4 lg:gap-4 lg:py-5'
            )}
          >
            <button type="button" onClick={onOpenProfileDetails} className={cn(settingsRowClass, 'text-left')}>
              <div className="flex min-w-0 flex-1 items-center gap-4">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-purple-600 shadow-inner">
                  <User className="h-7 w-7 text-white" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-base font-semibold text-slate-900 dark:text-white">{t('profile.settingsProfileInfo')}</p>
                  <p className="mt-1 text-sm leading-snug text-slate-500 dark:text-zinc-400">{t('profile.settingsProfileHint')}</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-slate-400 dark:text-zinc-500" aria-hidden />
            </button>

            <div className={cn(settingsRowClass)}>
              <div className="flex min-w-0 flex-1 items-center gap-4">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-sky-600 shadow-inner">
                  <Languages className="h-7 w-7 text-white" aria-hidden />
                </span>
                <span className="text-base font-semibold text-slate-900 dark:text-white">{t('profile.settingsLanguage')}</span>
              </div>
              <Select value={currentLanguage.code} onValueChange={handleLanguageChange}>
                <SelectTrigger
                  className="h-11 w-auto min-w-[6.25rem] shrink-0 gap-2 rounded-xl border border-slate-300 bg-white px-3 text-slate-900 shadow-xs hover:bg-slate-50 [&_[data-slot=select-value]]:gap-2 [&_[data-slot=select-value]]:flex [&_[data-slot=select-value]]:items-center [&_[data-slot=select-value]]:justify-start [&_svg]:text-slate-500 dark:border-zinc-700 dark:bg-zinc-950/90 dark:text-white dark:hover:bg-zinc-900 [&_svg]:dark:text-zinc-300"
                  title={currentLanguage.name}
                >
                  <SelectValue placeholder={currentLanguage.flagLabel} />
                </SelectTrigger>
                <SelectContent className="border-slate-200 bg-white text-slate-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white">
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code} textValue={lang.name} title={lang.name}>
                      <span className="flex items-center gap-2.5">
                        <span className="text-lg leading-none" aria-hidden>
                          {lang.flagEmoji}
                        </span>
                        <span className="font-semibold tracking-wide">{lang.flagLabel}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className={cn(settingsRowClass)}>
              <div className="flex min-w-0 flex-1 items-center gap-4">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-orange-800 shadow-inner">
                  {isDark ? (
                    <Moon className="h-7 w-7 text-white" aria-hidden />
                  ) : (
                    <Sun className="h-7 w-7 text-white" aria-hidden />
                  )}
                </span>
                <span className="text-base font-semibold text-slate-900 dark:text-white">{t('profile.settingsAppearance')}</span>
              </div>
              <Switch
                checked={isDark}
                onCheckedChange={() => setTheme(isDark ? 'light' : 'dark')}
                className="data-[state=checked]:bg-pink-500 data-[state=unchecked]:bg-slate-300 dark:data-[state=unchecked]:bg-zinc-700"
              />
            </div>
          </div>

          <div className="shrink-0 border-t border-slate-200/90 bg-white px-6 py-6 dark:border-zinc-800/80 dark:bg-[#07070c] sm:px-10">
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-2xl bg-linear-to-r from-sky-600 via-sky-500 to-orange-500 px-5 py-4 text-sm font-bold uppercase tracking-wide text-white shadow-[0_8px_24px_rgba(14,165,233,0.22)] transition hover:brightness-[1.05] active:scale-[0.99] dark:shadow-[0_8px_28px_rgba(14,165,233,0.28)] sm:tracking-[0.1em]"
            >
              <LogOut className="h-5 w-5 shrink-0" aria-hidden />
              {t('auth.logout')}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
