import { type ReactElement, useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/stores/auth-store';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useUserDetail } from '../hooks/useUserDetail';
import { useCreateUserDetail } from '../hooks/useCreateUserDetail';
import { useUpdateUserDetail } from '../hooks/useUpdateUserDetail';
import { createUserDetailFormSchema, type UserDetailFormData, Gender } from '../types/user-detail';
import { parseProfileMeta, serializeProfileMeta } from '../utils/profile-description-meta';
import { useChangePassword } from '@/features/auth/hooks/useChangePassword';
import type { ChangePasswordRequest } from '@/features/auth/types/auth';
import {
  Loader2,
  Shield,
  Lock,
  Eye,
  EyeOff,
  Ruler,
  Scale,
  User,
  Phone,
  Mail,
  Linkedin,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ProfileSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ProfileTab = 'personal' | 'security';

const fieldLabelClass =
  'text-[11px] font-semibold uppercase tracking-wider text-sky-100/45 mb-1.5 block';

const inputIconWrapClass =
  'relative flex h-11 w-full items-center rounded-xl border border-sky-400/18 bg-sky-950/28 transition-colors focus-within:border-orange-300/28 focus-within:ring-1 focus-within:ring-orange-400/18';

const inputInnerClass =
  'h-full w-full rounded-xl border-0 bg-transparent pl-10 pr-3 text-sm text-white placeholder:text-sky-200/40 focus-visible:ring-0 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60';

export function ProfileSettingsModal({ open, onOpenChange }: ProfileSettingsModalProps): ReactElement {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [tab, setTab] = useState<ProfileTab>('personal');
  const [isEditMode, setIsEditMode] = useState(false);
  const [isCurrentPasswordVisible, setIsCurrentPasswordVisible] = useState(false);
  const [isNewPasswordVisible, setIsNewPasswordVisible] = useState(false);

  const { data: userDetail, isLoading: isLoadingUserDetail, refetch } = useUserDetail();
  const createMutation = useCreateUserDetail();
  const updateMutation = useUpdateUserDetail();
  const changePasswordMutation = useChangePassword();

  const schema = useMemo(() => createUserDetailFormSchema(t), [t]);

  const form = useForm<UserDetailFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      profilePictureUrl: '',
      height: null,
      weight: null,
      note: '',
      phone: '',
      linkedInUrl: '',
      gender: null,
    },
  });

  const changePasswordSchema = useMemo(
    () =>
      z
        .object({
          currentPassword: z.string().min(1, t('userDetail.currentPasswordRequired')),
          newPassword: z
            .string()
            .min(6, t('userDetail.newPasswordMinLength'))
            .max(100, t('userDetail.newPasswordMaxLength')),
        })
        .refine((data) => data.currentPassword !== data.newPassword, {
          message: t('userDetail.newPasswordSameAsCurrent'),
          path: ['newPassword'],
        }),
    [t]
  );

  const changePasswordForm = useForm<ChangePasswordRequest>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
    },
  });

  useEffect(() => {
    if (open) {
      void refetch();
    }
  }, [open, refetch]);

  useEffect(() => {
    if (!open) {
      setTab('personal');
    }
  }, [open]);

  useEffect(() => {
    if (userDetail) {
      setIsEditMode(true);
      const meta = parseProfileMeta(userDetail.description ?? undefined);
      form.reset({
        profilePictureUrl: userDetail.profilePictureUrl || '',
        height: userDetail.height ?? null,
        weight: userDetail.weight ?? null,
        note: meta.note,
        phone: meta.phone,
        linkedInUrl: meta.linkedInUrl,
        gender: userDetail.gender ?? null,
      });
    } else if (!isLoadingUserDetail && open) {
      setIsEditMode(false);
      form.reset({
        profilePictureUrl: '',
        height: null,
        weight: null,
        note: '',
        phone: '',
        linkedInUrl: '',
        gender: null,
      });
    }
  }, [userDetail, isLoadingUserDetail, open, form]);

  const descriptionPayload = (data: UserDetailFormData): string =>
    serializeProfileMeta({
      note: data.note ?? '',
      phone: data.phone ?? '',
      linkedInUrl: data.linkedInUrl ?? '',
    });

  const handleSubmitProfile = (data: UserDetailFormData): void => {
    const desc = descriptionPayload(data);
    if (isEditMode) {
      updateMutation.mutate(
        {
          profilePictureUrl: data.profilePictureUrl || undefined,
          height: data.height ?? undefined,
          weight: data.weight ?? undefined,
          description: desc || undefined,
          gender: (data.gender ?? undefined) as Gender | undefined,
        },
        {
          onSuccess: () => {
            toast.success(t('userDetail.updatedSuccessfully'));
            onOpenChange(false);
          },
          onError: (error: Error) => {
            toast.error(error.message || t('userDetail.updateError'));
          },
        }
      );
    } else {
      if (!user?.id) {
        toast.error(t('userDetail.userNotFound'));
        return;
      }
      createMutation.mutate(
        {
          userId: user.id,
          profilePictureUrl: data.profilePictureUrl || undefined,
          height: data.height ?? undefined,
          weight: data.weight ?? undefined,
          description: desc || undefined,
          gender: (data.gender ?? undefined) as Gender | undefined,
        },
        {
          onSuccess: () => {
            toast.success(t('userDetail.createdSuccessfully'));
            onOpenChange(false);
          },
          onError: (error: Error) => {
            toast.error(error.message || t('userDetail.createError'));
          },
        }
      );
    }
  };

  const handleChangePasswordSubmit = async (data: ChangePasswordRequest): Promise<void> => {
    await changePasswordMutation.mutateAsync(data);
    changePasswordForm.reset();
  };

  const isLoading = isLoadingUserDetail || createMutation.isPending || updateMutation.isPending;
  const isChangingPassword = changePasswordMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
          showCloseButton
          className={cn(
            'flex h-full max-h-[100dvh] w-full max-w-[min(100vw,24rem)] flex-col gap-0 overflow-hidden border-y-0 border-l border-r-0 border-sky-400/22 bg-gradient-to-br from-[#0f172a]/97 via-[#1a1626]/96 to-[#231a18]/95 p-0 shadow-[0_0_60px_-12px_rgba(14,165,233,0.22),0_0_48px_-18px_rgba(251,146,60,0.12)] backdrop-blur-xl sm:max-w-[28rem]',
            '!fixed !top-0 !right-0 !bottom-0 !left-auto !flex !translate-x-0 !translate-y-0 rounded-none rounded-l-[1.65rem] sm:rounded-l-3xl',
            'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right data-[state=closed]:zoom-out-100 data-[state=open]:zoom-in-100 duration-300',
            'text-white [&_[data-slot=dialog-close]]:rounded-full [&_[data-slot=dialog-close]]:border [&_[data-slot=dialog-close]]:border-sky-400/22 [&_[data-slot=dialog-close]]:bg-sky-950/45 [&_[data-slot=dialog-close]]:p-2 [&_[data-slot=dialog-close]]:hover:border-orange-300/28 [&_[data-slot=dialog-close]]:hover:bg-orange-950/35'
          )}
        >
          <div className="shrink-0 border-b border-sky-200/10 px-6 pb-4 pt-6 md:px-8 md:pb-5 md:pt-7">
            <DialogHeader className="gap-2 space-y-0 text-left">
              <DialogTitle className="text-xl font-bold tracking-tight text-white">
                {t('profile.profileSettings')}
              </DialogTitle>
              <DialogDescription className="text-sm leading-relaxed text-sky-100/55">
                {t('profile.settingsModalSubtitle')}
              </DialogDescription>
            </DialogHeader>

            <div className="mt-6 grid grid-cols-2 gap-2 rounded-xl border border-sky-400/15 bg-sky-950/35 p-1 ring-1 ring-orange-400/10">
              <button
                type="button"
                onClick={() => setTab('personal')}
                className={cn(
                  'flex items-center justify-center gap-2 rounded-lg px-3 py-3 text-sm font-medium transition-colors md:px-4',
                  tab === 'personal'
                    ? 'border border-sky-300/25 bg-gradient-to-br from-sky-500/18 to-orange-500/12 text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]'
                    : 'border border-transparent text-sky-100/50 hover:text-sky-50'
                )}
              >
                <User className="size-4 shrink-0" aria-hidden />
                {t('profile.tabPersonal')}
              </button>
              <button
                type="button"
                onClick={() => setTab('security')}
                className={cn(
                  'flex items-center justify-center gap-2 rounded-lg px-3 py-3 text-sm font-medium transition-colors md:px-4',
                  tab === 'security'
                    ? 'border border-sky-300/25 bg-gradient-to-br from-sky-500/18 to-orange-500/12 text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]'
                    : 'border border-transparent text-sky-100/50 hover:text-sky-50'
                )}
              >
                <Lock className="size-4 shrink-0" aria-hidden />
                {t('profile.tabSecurity')}
              </button>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 py-5 md:px-8 md:py-6">
            {isLoadingUserDetail ? (
              <div className="flex items-center justify-center py-14">
                <Loader2 className="size-8 animate-spin text-sky-400/70" aria-hidden />
              </div>
            ) : tab === 'personal' ? (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmitProfile)} className="space-y-5">
                  <FormField
                    control={form.control}
                    name="note"
                    render={({ field }) => <input type="hidden" {...field} />}
                  />

                  <div className="rounded-2xl border border-sky-400/14 bg-gradient-to-br from-sky-950/45 to-orange-950/30 p-5 md:p-6 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]">
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-4">
                      <FormField
                        control={form.control}
                        name="height"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={fieldLabelClass}>{t('userDetail.height')}</FormLabel>
                            <FormControl>
                              <div className={inputIconWrapClass}>
                                <Ruler className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-sky-400/70" aria-hidden />
                                <Input
                                  type="number"
                                  step="0.1"
                                  min={0}
                                  max={300}
                                  placeholder={t('userDetail.placeholderHeight')}
                                  className={inputInnerClass}
                                  {...field}
                                  value={field.value ?? ''}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    field.onChange(value === '' ? null : parseFloat(value));
                                  }}
                                />
                              </div>
                            </FormControl>
                            <FormMessage className="text-rose-400" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="weight"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={fieldLabelClass}>{t('userDetail.weight')}</FormLabel>
                            <FormControl>
                              <div className={inputIconWrapClass}>
                                <Scale className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-sky-400/70" aria-hidden />
                                <Input
                                  type="number"
                                  step="0.1"
                                  min={0}
                                  max={500}
                                  placeholder={t('userDetail.placeholderWeight')}
                                  className={inputInnerClass}
                                  {...field}
                                  value={field.value ?? ''}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    field.onChange(value === '' ? null : parseFloat(value));
                                  }}
                                />
                              </div>
                            </FormControl>
                            <FormMessage className="text-rose-400" />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="mt-5">
                      <FormField
                        control={form.control}
                        name="gender"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={fieldLabelClass}>{t('userDetail.genderFieldLabel')}</FormLabel>
                            <Select
                              value={field.value?.toString() ?? Gender.NotSpecified.toString()}
                              onValueChange={(value) => {
                                const numValue = parseInt(value, 10);
                                field.onChange(numValue === Gender.NotSpecified ? null : (numValue as Gender));
                              }}
                            >
                              <FormControl>
                                <div className={cn(inputIconWrapClass, 'cursor-pointer')}>
                                  <User className="pointer-events-none absolute left-3 top-1/2 z-[1] size-4 -translate-y-1/2 text-sky-400/70" aria-hidden />
                                  <SelectTrigger className="h-11 w-full min-w-0 flex-1 cursor-pointer border-0 bg-transparent px-3 py-0 pl-10 pr-8 text-sm text-white shadow-none outline-none ring-0 focus-visible:border-0 focus-visible:ring-0 data-[placeholder]:text-sky-200/40 [&>svg]:shrink-0 [&>svg]:text-sky-300/55">
                                    <SelectValue placeholder={t('userDetail.selectGender')} />
                                  </SelectTrigger>
                                </div>
                              </FormControl>
                              <SelectContent className="border-sky-400/18 bg-gradient-to-b from-[#141c28] to-[#1f1410] text-white">
                                <SelectItem value={Gender.NotSpecified.toString()}>
                                  {t('userDetail.gender.notSpecified')}
                                </SelectItem>
                                <SelectItem value={Gender.Male.toString()}>{t('userDetail.gender.male')}</SelectItem>
                                <SelectItem value={Gender.Female.toString()}>{t('userDetail.gender.female')}</SelectItem>
                                <SelectItem value={Gender.Other.toString()}>{t('userDetail.gender.other')}</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage className="text-rose-400" />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-4">
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={fieldLabelClass}>{t('userDetail.phoneNumber')}</FormLabel>
                            <FormControl>
                              <div className={inputIconWrapClass}>
                                <Phone className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-sky-400/70" aria-hidden />
                                <Input
                                  type="tel"
                                  placeholder={t('userDetail.placeholderPhone')}
                                  className={inputInnerClass}
                                  {...field}
                                  value={field.value ?? ''}
                                />
                              </div>
                            </FormControl>
                            <FormMessage className="text-rose-400" />
                          </FormItem>
                        )}
                      />

                      <FormItem>
                        <FormLabel className={fieldLabelClass}>{t('userDetail.emailAddress')}</FormLabel>
                        <div className={inputIconWrapClass}>
                          <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-sky-400/70" aria-hidden />
                          <Input
                            readOnly
                            value={user?.email ?? ''}
                            placeholder={t('userDetail.placeholderEmail')}
                            className={cn(inputInnerClass, 'cursor-default opacity-90')}
                          />
                        </div>
                      </FormItem>
                    </div>

                    <div className="mt-5">
                      <FormField
                        control={form.control}
                        name="linkedInUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={fieldLabelClass}>{t('userDetail.linkedInProfile')}</FormLabel>
                            <FormControl>
                              <div className={inputIconWrapClass}>
                                <Linkedin className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-sky-400/70" aria-hidden />
                                <Input
                                  type="url"
                                  placeholder={t('userDetail.placeholderLinkedIn')}
                                  className={inputInnerClass}
                                  {...field}
                                  value={field.value ?? ''}
                                />
                              </div>
                            </FormControl>
                            <FormMessage className="text-rose-400" />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <DialogFooter className="gap-2 border-t border-sky-200/10 pt-5 sm:justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => onOpenChange(false)}
                      disabled={isLoading}
                      className="rounded-xl border-sky-400/25 bg-sky-950/25 text-white hover:border-orange-300/30 hover:bg-orange-950/25"
                    >
                      {t('common.cancel')}
                    </Button>
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="rounded-xl border border-orange-400/25 bg-gradient-to-r from-sky-600/35 to-orange-600/30 text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)] hover:from-sky-500/45 hover:to-orange-500/38"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
                          {t('common.saving')}
                        </>
                      ) : isEditMode ? (
                        t('common.update')
                      ) : (
                        t('common.save')
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            ) : (
              <Form {...changePasswordForm}>
                <form
                  onSubmit={changePasswordForm.handleSubmit(handleChangePasswordSubmit)}
                  className="space-y-5"
                >
                  <div className="rounded-2xl border border-sky-400/14 bg-gradient-to-br from-sky-950/45 to-orange-950/30 p-5 md:p-6 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]">
                    <FormField
                      control={changePasswordForm.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className={fieldLabelClass}>{t('userDetail.currentPassword')}</FormLabel>
                          <FormControl>
                            <div className={cn(inputIconWrapClass, 'pr-10')}>
                              <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-sky-400/70" aria-hidden />
                              <Input
                                {...field}
                                type={isCurrentPasswordVisible ? 'text' : 'password'}
                                placeholder="••••••••"
                                className={cn(inputInnerClass, 'pr-10')}
                              />
                              <button
                                type="button"
                                onClick={() => setIsCurrentPasswordVisible((v) => !v)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-sky-300/65 hover:text-orange-100/90"
                              >
                                {isCurrentPasswordVisible ? (
                                  <EyeOff className="size-4" aria-hidden />
                                ) : (
                                  <Eye className="size-4" aria-hidden />
                                )}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage className="text-rose-400" />
                        </FormItem>
                      )}
                    />

                    <div className="mt-5">
                      <FormField
                        control={changePasswordForm.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={fieldLabelClass}>{t('userDetail.newPassword')}</FormLabel>
                            <FormControl>
                              <div className={cn(inputIconWrapClass, 'pr-10')}>
                                <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-sky-400/70" aria-hidden />
                                <Input
                                  {...field}
                                  type={isNewPasswordVisible ? 'text' : 'password'}
                                  placeholder={t('userDetail.newPasswordPlaceholder')}
                                  className={cn(inputInnerClass, 'pr-10')}
                                />
                                <button
                                  type="button"
                                  onClick={() => setIsNewPasswordVisible((v) => !v)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sky-300/65 hover:text-orange-100/90"
                                >
                                  {isNewPasswordVisible ? (
                                    <EyeOff className="size-4" aria-hidden />
                                  ) : (
                                    <Eye className="size-4" aria-hidden />
                                  )}
                                </button>
                              </div>
                            </FormControl>
                            <FormMessage className="text-rose-400" />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="mt-6 flex justify-end">
                      <Button
                        type="submit"
                        disabled={isChangingPassword}
                        className="rounded-xl border border-orange-400/25 bg-gradient-to-r from-sky-600/35 to-orange-600/30 text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)] hover:from-sky-500/45 hover:to-orange-500/38"
                      >
                        {isChangingPassword ? (
                          <>
                            <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
                            {t('userDetail.changingPassword')}
                          </>
                        ) : (
                          <>
                            <Shield className="mr-2 size-4" aria-hidden />
                            {t('userDetail.changePasswordButton')}
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </form>
              </Form>
            )}
          </div>
        </DialogContent>
    </Dialog>
  );
}
