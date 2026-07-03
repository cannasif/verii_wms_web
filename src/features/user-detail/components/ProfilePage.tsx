import { type ReactElement, type ChangeEvent, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Building2, Camera, Loader2, Mail, Settings } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { useUIStore } from '@/stores/ui-store';
import { OpsActionButton } from '@/components/shared/OpsActionButton';
import { useUserDetail } from '../hooks/useUserDetail';
import { useUploadProfilePicture } from '../hooks/useUploadProfilePicture';
import { getFullProfileImageUrl } from '../utils/profile-image';
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
  const displayInitial = isSystemLikeDisplayName ? 'S' : displayName.charAt(0).toUpperCase();
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
    <div className="wms-ops-profile-page mx-auto w-full max-w-6xl px-4 pb-12 pt-2 md:px-6">
      <section aria-label={t('profile.title')} className="wms-ops-profile-page__card wms-ops-form">
        <span className="wms-ops-profile-page__frame" aria-hidden>
          <span className="wms-ops-profile-page__corner wms-ops-profile-page__corner--tl" />
          <span className="wms-ops-profile-page__corner wms-ops-profile-page__corner--tr" />
          <span className="wms-ops-profile-page__corner wms-ops-profile-page__corner--bl" />
          <span className="wms-ops-profile-page__corner wms-ops-profile-page__corner--br" />
        </span>

        {isLoadingUserDetail ? (
          <div className="flex w-full items-center justify-center py-16">
            <Loader2 className="size-8 animate-spin text-[var(--cyb-cyan)]" aria-hidden />
          </div>
        ) : (
          <div className="wms-ops-profile-page__content">
            <div className="wms-ops-profile-page__toolbar">
              <p className="wms-ops-profile-page__eyebrow">
                {t('profile.terminal.eyebrow', { defaultValue: 'PROFIL / KULLANICI' })}
              </p>
              <OpsActionButton
                type="button"
                variant="secondary"
                onClick={() => setProfileSettingsOpen(true)}
                className="wms-ops-profile-page__settings-btn wms-ops-action-btn--secondary"
              >
                <Settings className="size-4 shrink-0" strokeWidth={1.85} aria-hidden />
                {t('profile.profileSettings')}
              </OpsActionButton>
            </div>

            <div className="wms-ops-profile-page__main">
              <div className="wms-ops-profile-page__avatar-wrap">
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
                  className="wms-ops-profile-page__avatar-btn group"
                >
                  <div className="wms-ops-profile-page__avatar">
                    {uploadPictureMutation.isPending ? (
                      <div className="flex size-full items-center justify-center">
                        <Loader2 className="size-9 animate-spin text-[var(--cyb-cyan)]" aria-hidden />
                      </div>
                    ) : imageUrl ? (
                      <>
                        <img src={imageUrl} alt="" className="size-full object-cover" />
                        <span className="wms-ops-profile-page__avatar-overlay" aria-hidden />
                        <Camera className="wms-ops-profile-page__avatar-camera" strokeWidth={1.75} aria-hidden />
                      </>
                    ) : (
                      <>
                        <span className="wms-ops-profile-page__avatar-initial">{displayInitial}</span>
                        <span className="wms-ops-profile-page__avatar-overlay" aria-hidden />
                        <Camera className="wms-ops-profile-page__avatar-camera" strokeWidth={1.75} aria-hidden />
                      </>
                    )}
                  </div>
                </button>
              </div>

              <div className="wms-ops-profile-page__meta">
                <h1 className="wms-ops-profile-page__name">{displayName}</h1>
                <div className="wms-ops-profile-page__lines">
                  <p className="wms-ops-profile-page__line">
                    <Mail className="size-4 shrink-0" aria-hidden />
                    <span className="wms-ops-profile-page__line-prefix" aria-hidden>
                      {'> '}
                    </span>
                    <span className="truncate">{emailLine}</span>
                  </p>
                  <p className="wms-ops-profile-page__line" aria-label={t('profile.branchLabel')}>
                    <Building2 className="size-4 shrink-0" aria-hidden />
                    <span className="wms-ops-profile-page__line-prefix" aria-hidden>
                      {'> '}
                    </span>
                    <span>{branchLine}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      <ProfileSettingsModal open={profileSettingsOpen} onOpenChange={setProfileSettingsOpen} />

      <div className="min-h-[min(42vh,360px)] w-full" aria-hidden />
    </div>
  );
}
