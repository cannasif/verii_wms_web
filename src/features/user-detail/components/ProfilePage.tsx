import { type ReactElement, type ChangeEvent, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Building2, Camera, Loader2, Mail, Settings } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { useUIStore } from '@/stores/ui-store';
import { Button } from '@/components/ui/button';
import { useUserDetail } from '../hooks/useUserDetail';
import { useUploadProfilePicture } from '../hooks/useUploadProfilePicture';
import { getFullProfileImageUrl } from '../utils/profile-image';
import { cn } from '@/lib/utils';
import { ProfileSettingsModal } from './ProfileSettingsModal';

const MAX_PROFILE_IMAGE_BYTES = 5 * 1024 * 1024;
const PROFILE_IMAGE_ACCEPT_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'] as const;
const PROFILE_IMAGE_ACCEPT_ATTR = PROFILE_IMAGE_ACCEPT_TYPES.join(',');

export function ProfilePage(): ReactElement {
  const { t } = useTranslation();
  const { user, branch } = useAuthStore();
  const { setPageTitle } = useUIStore();
  const { data: userDetail, isLoading: isLoadingUserDetail } = useUserDetail();
  const uploadPictureMutation = useUploadProfilePicture();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profileSettingsOpen, setProfileSettingsOpen] = useState(false);

  useEffect(() => {
    setPageTitle(t('profile.title'));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

  const displayName = user?.name || user?.email || t('dashboard.user');
  const normalizedDisplayName = displayName.trim().toLowerCase();
  const isSystemLikeDisplayName =
    normalizedDisplayName.startsWith('system') || normalizedDisplayName.startsWith('sistem');
  const emptyAvatarLetter = isSystemLikeDisplayName ? 'S' : displayName.charAt(0).toUpperCase();
  const imageUrl = getFullProfileImageUrl(userDetail?.profilePictureUrl);
  const emailLine = user?.email ?? '—';
  const branchCodeTrimmed = branch?.code?.trim();
  const branchCodeDisplay =
    branchCodeTrimmed && branchCodeTrimmed.toLowerCase() !== '0'
      ? branchCodeTrimmed.toUpperCase()
      : undefined;
  const branchLine =
    branch != null
      ? [branchCodeDisplay, branch.name?.trim()]
          .filter((part): part is string => Boolean(part?.trim()))
          .join(' · ') || '—'
      : '—';

  const handleAvatarPickClick = (): void => {
    if (uploadPictureMutation.isPending) return;
    fileInputRef.current?.click();
  };

  const handleProfileImageSelected = (event: ChangeEvent<HTMLInputElement>): void => {
    const input = event.target;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    const allowedTypes: readonly string[] = PROFILE_IMAGE_ACCEPT_TYPES;
    if (!allowedTypes.includes(file.type)) {
      toast.error(t('userDetail.invalidFileFormat'));
      return;
    }
    if (file.size > MAX_PROFILE_IMAGE_BYTES) {
      toast.error(t('userDetail.fileSizeExceeded'));
      return;
    }

    uploadPictureMutation.mutate(file, {
      onSuccess: (response) => {
        if (response.success && response.data) {
          toast.success(t('userDetail.profilePictureUploadedSuccessfully'));
        } else {
          toast.error(response.message || t('userDetail.profilePictureUploadError'));
        }
      },
      onError: (error: Error) => {
        toast.error(error.message || t('userDetail.profilePictureUploadError'));
      },
    });
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-4 pb-12 pt-2 md:px-6">
      <section
        aria-label={t('profile.title')}
        className={cn(
          'relative overflow-hidden rounded-[1.75rem] border p-6 backdrop-blur-2xl backdrop-saturate-150 md:rounded-[2rem] md:p-8',
          'border-slate-200/45 bg-white/[0.62] shadow-[0_10px_36px_rgba(15,23,42,0.055),0_2px_14px_rgba(15,23,42,0.035)] ring-1 ring-white/65',
          'dark:border-white/[0.062] dark:bg-[rgba(22,17,30,0.34)] dark:shadow-[0_22px_52px_rgba(0,0,0,0.44),inset_0_1px_0_0_rgba(255,255,255,0.05)]',
          'dark:ring-white/[0.04]'
        )}
      >
        {isLoadingUserDetail ? (
          <div className="flex w-full items-center justify-center py-16">
            <Loader2 className="size-8 animate-spin text-slate-400 dark:text-zinc-500" aria-hidden />
          </div>
        ) : (
          <>
            <div className="absolute right-6 top-6 z-10 md:right-8 md:top-8">
              <Button
                type="button"
                variant="outline"
                onClick={() => setProfileSettingsOpen(true)}
                className={cn(
                  'h-11 rounded-full border border-sky-700/15 px-6 font-semibold shadow-none backdrop-blur-xl transition-colors',
                  'bg-gradient-to-r from-sky-500/[0.08] via-white/55 to-orange-500/[0.1] text-slate-800 ring-1 ring-inset ring-white/35',
                  'shadow-[inset_0_1px_0_0_rgba(255,255,255,0.48)]',
                  'hover:border-sky-600/25 hover:from-sky-500/[0.12] hover:via-white/60 hover:to-orange-500/[0.14] hover:ring-sky-200/45 hover:text-slate-900',
                  'dark:border-sky-400/18 dark:bg-gradient-to-r dark:from-sky-950/65 dark:via-[rgba(22,17,30,0.48)] dark:to-orange-950/50 dark:text-white dark:ring-sky-400/12',
                  'dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]',
                  'dark:hover:border-orange-400/22 dark:hover:from-sky-900/55 dark:hover:via-[rgba(28,20,34,0.55)] dark:hover:to-orange-900/45 dark:hover:ring-orange-400/15 dark:hover:text-white'
                )}
              >
                <Settings className="mr-2 size-4 shrink-0 text-sky-600 dark:text-sky-400" strokeWidth={1.85} aria-hidden />
                {t('profile.profileSettings')}
              </Button>
            </div>

            <div className="flex max-md:pr-[11rem] flex-row items-start gap-5 md:gap-8 md:pr-44">
              <div className="relative shrink-0">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={PROFILE_IMAGE_ACCEPT_ATTR}
                  className="sr-only"
                  tabIndex={-1}
                  onChange={handleProfileImageSelected}
                />
                <button
                  type="button"
                  disabled={uploadPictureMutation.isPending}
                  onClick={handleAvatarPickClick}
                  aria-label={t('profile.changePhoto')}
                  className={cn(
                    'group relative size-[8rem] shrink-0 overflow-hidden rounded-[1.4rem] md:size-[9rem] md:rounded-[1.45rem]',
                    'ring-2 ring-fuchsia-500/55 shadow-[0_0_0_1px_rgba(217,70,239,0.35),0_0_22px_rgba(192,38,211,0.22),inset_0_2px_32px_rgba(0,0,0,0.5)]',
                    'transition-[transform,box-shadow] duration-200 hover:shadow-[0_0_0_1px_rgba(232,121,249,0.55),0_0_28px_rgba(217,70,239,0.32),inset_0_2px_32px_rgba(0,0,0,0.45)]',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:ring-fuchsia-400/45 dark:focus-visible:ring-offset-zinc-950',
                    'disabled:pointer-events-none disabled:opacity-70 dark:shadow-[0_0_0_1px_rgba(217,70,239,0.35),0_0_26px_rgba(168,85,247,0.2),inset_0_2px_36px_rgba(0,0,0,0.65)]'
                  )}
                >
                  {uploadPictureMutation.isPending ? (
                    <span className="flex size-full items-center justify-center bg-zinc-950/80">
                      <Loader2 className="size-9 animate-spin text-fuchsia-300" aria-hidden />
                    </span>
                  ) : imageUrl ? (
                    <>
                      <img src={imageUrl} alt="" className="size-full object-cover" />
                      <span
                        className="pointer-events-none absolute inset-0 rounded-[inherit] bg-black/0 shadow-[inset_0_0_36px_rgba(0,0,0,0.42)] ring-1 ring-inset ring-fuchsia-400/25 transition-colors duration-200 group-hover:bg-black/48 group-focus-visible:bg-black/48 dark:shadow-[inset_0_0_42px_rgba(0,0,0,0.55)] dark:ring-fuchsia-400/30"
                        aria-hidden
                      />
                      <span className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-[inherit] opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
                        <Camera
                          className="size-8 text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.55)] md:size-9"
                          strokeWidth={1.75}
                          aria-hidden
                        />
                      </span>
                    </>
                  ) : isSystemLikeDisplayName ? (
                    <span className="relative flex size-full items-center justify-center bg-linear-to-br from-sky-400 via-sky-500 to-orange-500">
                      <span
                        className="pointer-events-none absolute inset-0 rounded-[inherit] shadow-[inset_0_2px_28px_rgba(0,0,0,0.18)] ring-1 ring-inset ring-white/30"
                        aria-hidden
                      />
                      <span className="relative z-[1] text-5xl font-bold tracking-tight text-white drop-shadow-md transition-[opacity,filter] duration-200 group-hover:opacity-40 group-hover:brightness-[0.68] group-focus-visible:opacity-40 group-focus-visible:brightness-[0.68] md:text-6xl">
                        {emptyAvatarLetter}
                      </span>
                      <span
                        className="pointer-events-none absolute inset-0 z-[2] rounded-[inherit] bg-black/0 transition-colors duration-200 group-hover:bg-black/45 group-focus-visible:bg-black/45"
                        aria-hidden
                      />
                      <Camera
                        className="pointer-events-none absolute inset-0 z-[3] m-auto size-8 text-white opacity-0 drop-shadow-[0_0_14px_rgba(255,255,255,0.65)] transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100 md:size-9"
                        strokeWidth={1.75}
                        aria-hidden
                      />
                    </span>
                  ) : (
                    <span className="relative flex size-full items-center justify-center bg-[radial-gradient(circle_at_50%_42%,rgb(82,38,40)_0%,rgb(32,14,22)_40%,rgb(56,20,58)_100%)] dark:bg-[radial-gradient(circle_at_50%_42%,rgb(72,32,34)_0%,rgb(26,10,20)_38%,rgb(48,16,52)_100%)]">
                      <span
                        className="pointer-events-none absolute inset-0 rounded-[inherit] shadow-[inset_0_0_36px_rgba(0,0,0,0.72)] ring-1 ring-inset ring-fuchsia-500/35 transition-[box-shadow,ring-color] duration-200 group-hover:shadow-[inset_0_0_56px_rgba(0,0,0,0.92)] group-hover:ring-fuchsia-400/45 group-focus-visible:shadow-[inset_0_0_56px_rgba(0,0,0,0.92)] group-focus-visible:ring-fuchsia-400/45"
                        aria-hidden
                      />
                      <span
                        className="pointer-events-none absolute inset-0 z-[1] rounded-[inherit] bg-black/0 transition-colors duration-200 group-hover:bg-black/52 group-focus-visible:bg-black/52"
                        aria-hidden
                      />
                      <Camera
                        className="pointer-events-none absolute inset-0 z-[2] m-auto size-8 text-white opacity-0 drop-shadow-[0_0_14px_rgba(255,255,255,0.6)] transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100 md:size-9"
                        strokeWidth={1.75}
                        aria-hidden
                      />
                    </span>
                  )}
                </button>
              </div>

              <div className="min-w-0 flex-1 text-left">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl dark:text-white">{displayName}</h1>
                <div className="mt-2 flex flex-row flex-wrap items-center justify-start gap-0 text-sm text-slate-600 md:mt-2.5 md:text-[0.9375rem] dark:text-zinc-300">
                  <span className="inline-flex min-w-0 items-center gap-2 md:pr-4">
                    <Mail className="size-4 shrink-0 text-slate-500 dark:text-zinc-400" aria-hidden />
                    <span className="truncate">{emailLine}</span>
                  </span>
                  <span className="mx-2 h-5 w-px shrink-0 bg-slate-300/90 dark:bg-white/15" aria-hidden />
                  <span className="inline-flex items-center gap-2" aria-label={t('profile.branchLabel')}>
                    <Building2 className="size-4 shrink-0 text-slate-500 dark:text-zinc-400" aria-hidden />
                    <span>{branchLine}</span>
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </section>

      <ProfileSettingsModal open={profileSettingsOpen} onOpenChange={setProfileSettingsOpen} />

      <div className="min-h-[min(42vh,360px)] w-full" aria-hidden />
    </div>
  );
}
