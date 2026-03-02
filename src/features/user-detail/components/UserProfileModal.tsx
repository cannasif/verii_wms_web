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
            ? 'bg-[#120c18] text-white shadow-[0_0_50px_rgba(0,0,0,0.55)]'
            : 'bg-white text-slate-900 shadow-[0_0_50px_rgba(15,23,42,0.18)]'
        )}
      >
        <DialogTitle className="sr-only">{t('sidebar.settings', 'Ayarlar')}</DialogTitle>

        <div className="grid min-h-[520px] grid-cols-1 md:grid-cols-[1fr_1fr]">
          <div
            className={cn(
              'relative flex flex-col items-center justify-center gap-5 border-b p-8 md:border-b-0 md:border-r',
              darkMode ? 'border-white/10 bg-[#171023]' : 'border-slate-200 bg-slate-50'
            )}
          >
            <div className="absolute left-[-30%] top-[-20%] h-56 w-56 rounded-full bg-pink-500/20 blur-[70px]" />
            <div className="relative z-10">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={displayName}
                  className="h-28 w-28 rounded-3xl border-2 border-white/20 object-cover shadow-xl"
                />
              ) : (
                <div className="flex h-28 w-28 items-center justify-center rounded-3xl bg-linear-to-br from-pink-600 via-purple-600 to-orange-500 text-3xl font-black text-white shadow-xl">
                  {displayInitial}
                </div>
              )}
            </div>

            <div className="z-10 text-center">
              <p className="max-w-[240px] truncate text-xl font-bold">{displayName}</p>
              <p className={cn('text-xs', darkMode ? 'text-slate-300' : 'text-slate-500')}>
                {branch?.name || t('roles.admin', 'Yonetici')}
              </p>
            </div>

            <div
              className={cn(
                'z-10 flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-sm',
                darkMode ? 'border-white/10 bg-white/5 text-slate-200' : 'border-slate-200 bg-white text-slate-700'
              )}
            >
              <Mail size={16} className="text-pink-500" />
              <span className="truncate">{user?.email}</span>
            </div>
          </div>

          <div className="flex min-w-0 flex-col p-6 md:p-8">
            <div className="mb-5 flex items-center gap-2">
              <div className="h-7 w-1.5 rounded-full bg-linear-to-b from-pink-500 to-orange-500" />
              <h3 className="text-2xl font-black tracking-tight">{t('sidebar.settings', 'Ayarlar')}</h3>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={onOpenProfileDetails}
                className={cn(
                  'flex w-full items-center justify-between gap-3 rounded-2xl border p-4 text-left transition-all',
                  darkMode ? 'border-white/10 bg-white/5 hover:bg-white/10' : 'border-slate-200 bg-slate-50 hover:bg-white'
                )}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className={cn('rounded-xl p-3', darkMode ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-700')}>
                    <User size={18} />
                  </div>
                  <div className="min-w-0 pr-2">
                    <p className="font-semibold">{t('profile.title', 'Profil')}</p>
                    <p className={cn('text-xs leading-5', darkMode ? 'text-slate-400' : 'text-slate-500')}>
                      {t('userDetail.subtitle', 'Kullanici detay bilgilerinizi guncelleyin')}
                    </p>
                  </div>
                </div>
                <ArrowRight size={18} className={cn('shrink-0', darkMode ? 'text-slate-400' : 'text-slate-500')} />
              </button>

              <div
                className={cn(
                  'flex items-center justify-between gap-3 rounded-2xl border p-4',
                  darkMode ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50'
                )}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className={cn('rounded-xl p-3', darkMode ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-700')}>
                    <Languages size={18} />
                  </div>
                  <span className="truncate font-semibold">{t('language_choice', 'Dil')}</span>
                </div>
                <Select value={currentLanguage.code} onValueChange={handleLanguageChange}>
                  <SelectTrigger className={cn('h-9 w-24 shrink-0', darkMode ? 'border-white/10 bg-white/10' : 'border-slate-200 bg-white')}>
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
                  darkMode ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50'
                )}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className={cn('rounded-xl p-3', darkMode ? 'bg-orange-500/20 text-orange-300' : 'bg-orange-100 text-orange-700')}>
                    {darkMode ? <Moon size={18} /> : <Sun size={18} />}
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
                className="h-12 w-full rounded-2xl bg-linear-to-r from-pink-600 to-orange-600 text-base font-bold text-white hover:opacity-95"
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
