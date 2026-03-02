import { type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Moon, Sun, LogOut, ArrowRight, Languages } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useTheme } from '@/components/theme-provider';
import { useAuthStore } from '@/stores/auth-store';
import { useUserDetail } from '../hooks/useUserDetail';
import { getApiBaseUrl } from '@/lib/axios';
import { cn } from '@/lib/utils';

interface UserProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenProfileDetails: () => void;
}

const languages = [
  { code: 'tr', name: 'Turkce', flag: 'TR' },
  { code: 'en', name: 'English', flag: 'EN' },
  { code: 'de', name: 'Deutsch', flag: 'DE' },
  { code: 'fr', name: 'Francais', flag: 'FR' },
];

const getFullImageUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  const apiBaseUrl = getApiBaseUrl();
  return `${apiBaseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
};

export function UserProfileModal({
  open,
  onOpenChange,
  onOpenProfileDetails,
}: UserProfileModalProps): ReactElement {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { user, logout, branch } = useAuthStore();
  const { data: userDetail } = useUserDetail();

  const currentLanguage = languages.find((lang) => lang.code === i18n.language) || languages[0];
  const displayName = user?.name || user?.email || t('dashboard.user', 'Kullanici');
  const displayInitial = displayName.charAt(0).toUpperCase();
  const imageUrl = getFullImageUrl(userDetail?.profilePictureUrl);
  const darkMode = theme === 'dark';

  const handleLanguageChange = (value: string): void => {
    i18n.changeLanguage(value);
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
          'w-[95vw] max-w-[920px] overflow-hidden rounded-[1.75rem] border-none p-0',
          darkMode
            ? 'border border-white/5 bg-[#120c18] text-white shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_25px_50px_-12px_rgba(0,0,0,0.5)]'
            : 'border border-slate-200/80 bg-white text-slate-900 shadow-[0_0_0_1px_rgba(15,23,42,0.04),0_25px_50px_-12px_rgba(15,23,42,0.15)]'
        )}
      >
        <DialogTitle className="sr-only">{t('sidebar.settings', 'Ayarlar')}</DialogTitle>

        <div className="grid min-h-[520px] grid-cols-1 md:grid-cols-[1fr_1fr]">
          <div
            className={cn(
              'relative flex flex-col items-center justify-center gap-6 border-b p-8 md:border-b-0 md:border-r',
              darkMode ? 'border-white/10 bg-[#0f0a14]' : 'border-slate-200/80 bg-linear-to-b from-slate-50/80 to-slate-50'
            )}
          >
            <div className="absolute left-[-20%] top-[-15%] h-64 w-64 rounded-full bg-pink-500/15 blur-[80px] transition-opacity" />
            <div className="absolute bottom-[-10%] right-[-15%] h-40 w-40 rounded-full bg-purple-500/10 blur-[60px]" />
            <div className="relative z-10">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={displayName}
                  className="h-28 w-28 rounded-3xl border-2 object-cover shadow-xl ring-4 ring-white/10 dark:border-white/20 dark:ring-white/5"
                />
              ) : (
                <div className="flex h-28 w-28 items-center justify-center rounded-3xl bg-linear-to-br from-pink-600 via-purple-600 to-orange-500 text-3xl font-black text-white shadow-xl ring-4 ring-white/10 dark:ring-white/5">
                  {displayInitial}
                </div>
              )}
            </div>

            <div className="z-10 flex flex-col items-center gap-1 text-center">
              <p className="max-w-[240px] truncate text-xl font-bold tracking-tight">{displayName}</p>
              <p className={cn('text-xs font-medium', darkMode ? 'text-slate-400' : 'text-slate-500')}>
                {branch?.name || t('roles.admin', 'Yonetici')}
              </p>
            </div>

            <div
              className={cn(
                'z-10 flex w-full max-w-[260px] items-center gap-3 rounded-2xl border px-4 py-3.5 text-sm transition-colors',
                darkMode
                  ? 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/[0.07]'
                  : 'border-slate-200/80 bg-white/80 text-slate-700 shadow-sm hover:border-slate-200 hover:bg-white'
              )}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-pink-500/10">
                <Mail size={16} className="text-pink-500" />
              </div>
              <span className="min-w-0 truncate">{user?.email}</span>
            </div>
          </div>

          <div className="flex min-w-0 flex-col p-6 md:p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="h-8 w-1 rounded-full bg-linear-to-b from-pink-500 to-orange-500" />
              <h3 className="text-2xl font-bold tracking-tight">{t('sidebar.settings', 'Ayarlar')}</h3>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={onOpenProfileDetails}
                className={cn(
                  'group flex w-full items-center justify-between gap-3 rounded-2xl border p-4 text-left transition-all duration-200',
                  darkMode
                    ? 'border-white/10 bg-white/5 hover:border-white/15 hover:bg-white/10'
                    : 'border-slate-200/80 bg-slate-50/80 hover:border-slate-200 hover:bg-white hover:shadow-sm'
                )}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className={cn(
                      'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors',
                      darkMode ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-700 group-hover:bg-purple-200'
                    )}
                  >
                    <User size={20} />
                  </div>
                  <div className="min-w-0 pr-2">
                    <p className="font-semibold">{t('profile.title', 'Profil')}</p>
                    <p className={cn('line-clamp-2 text-xs leading-relaxed', darkMode ? 'text-slate-400' : 'text-slate-500')}>
                      {t('userDetail.subtitle', 'Kullanici detay bilgilerinizi guncelleyin')}
                    </p>
                  </div>
                </div>
                <ArrowRight
                  size={18}
                  className={cn('shrink-0 transition-transform group-hover:translate-x-0.5', darkMode ? 'text-slate-400' : 'text-slate-500')}
                />
              </button>

              <div
                className={cn(
                  'flex items-center justify-between gap-3 rounded-2xl border p-4',
                  darkMode ? 'border-white/10 bg-white/5' : 'border-slate-200/80 bg-slate-50/80'
                )}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className={cn(
                      'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
                      darkMode ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-700'
                    )}
                  >
                    <Languages size={20} />
                  </div>
                  <span className="truncate font-semibold">{t('language_choice', 'Dil')}</span>
                </div>
                <Select value={currentLanguage.code} onValueChange={handleLanguageChange}>
                  <SelectTrigger
                    className={cn(
                      'h-9 w-28 shrink-0 rounded-xl border transition-colors',
                      darkMode ? 'border-white/10 bg-white/10 hover:bg-white/15' : 'border-slate-200 bg-white hover:border-slate-300'
                    )}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map((language) => (
                      <SelectItem key={language.code} value={language.code}>
                        {language.flag} {language.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div
                className={cn(
                  'flex items-center justify-between gap-3 rounded-2xl border p-4',
                  darkMode ? 'border-white/10 bg-white/5' : 'border-slate-200/80 bg-slate-50/80'
                )}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className={cn(
                      'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
                      darkMode ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-100 text-amber-700'
                    )}
                  >
                    {darkMode ? <Moon size={20} /> : <Sun size={20} />}
                  </div>
                  <span className="truncate font-semibold">{t('appearance', 'Gorunum')}</span>
                </div>
                <Switch
                  checked={darkMode}
                  onCheckedChange={() => setTheme(darkMode ? 'light' : 'dark')}
                  className="shrink-0 data-[state=checked]:bg-pink-600"
                />
              </div>
            </div>

            <div className="mt-auto pt-6">
              <Button
                onClick={handleLogout}
                className="h-12 w-full rounded-2xl bg-linear-to-r from-pink-600 to-orange-600 text-base font-bold text-white shadow-lg shadow-pink-500/25 transition-all duration-200 hover:shadow-xl hover:shadow-pink-500/30 hover:brightness-105"
              >
                <LogOut size={18} className="mr-2" />
                {t('auth.logout', 'Logout')}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
