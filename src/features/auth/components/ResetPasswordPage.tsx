import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { toast } from 'sonner';
import type React from 'react';
import loginImage from '@/assets/login.jpg';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useResetPassword } from '../hooks/useResetPassword';

export function ResetPasswordPage(): React.JSX.Element {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { mutate: resetPassword, isPending } = useResetPassword();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const schema = z.object({
    token: z.string().min(1, t('auth.validation.tokenRequired')),
    newPassword: z.string().min(6, t('auth.validation.newPasswordMinLength')),
    confirmPassword: z.string().min(6, t('auth.validation.confirmPasswordRequired')),
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: t('auth.validation.passwordsMismatch'),
    path: ['confirmPassword'],
  });

  type FormData = z.infer<typeof schema>;

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      token: token || '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    if (!token) {
      toast.error(t('auth.resetPassword.invalidToken'));
      setTimeout(() => {
        navigate('/auth/login', { replace: true });
      }, 1500);
      return;
    }
    form.setValue('token', token);
  }, [form, navigate, t, token]);

  const onSubmit = (data: FormData): void => {
    if (!token) {
      toast.error(t('auth.resetPassword.tokenNotFound'));
      return;
    }

    resetPassword({
      token: data.token,
      newPassword: data.newPassword,
    });
  };

  return (
    <div className="h-screen flex flex-col">
      <div className="flex flex-1">
        <div className="hidden lg:flex lg:w-1/2 h-full overflow-hidden relative">
          <img
            src={loginImage}
            alt="Reset Password"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40" />
        </div>

        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 h-full bg-background">
          <div className="w-full max-w-md space-y-8">
            <div className="space-y-3 text-center">
              <div className="flex justify-center">
                <div className="rounded-lg bg-primary/10 p-3">
                  <Lock className="size-6 text-primary" />
                </div>
              </div>
              <div className="space-y-1">
                <h1 className="text-3xl font-semibold tracking-tight">
                  {t('auth.resetPassword.title')}
                </h1>
                <p className="text-muted-foreground text-sm">
                  {t('auth.resetPassword.description')}
                </p>
              </div>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('auth.resetPassword.newPasswordLabel')}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            placeholder={t('auth.resetPassword.newPasswordPlaceholder')}
                            className="h-11 pr-10"
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((prev) => !prev)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            aria-label={showPassword ? t('auth.resetPassword.hidePassword') : t('auth.resetPassword.showPassword')}
                          >
                            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('auth.resetPassword.confirmPasswordLabel')}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showConfirmPassword ? 'text' : 'password'}
                            placeholder={t('auth.resetPassword.confirmPasswordPlaceholder')}
                            className="h-11 pr-10"
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword((prev) => !prev)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            aria-label={showConfirmPassword ? t('auth.resetPassword.hidePassword') : t('auth.resetPassword.showPassword')}
                          >
                            {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full h-11 text-base font-medium"
                  disabled={isPending || !token}
                >
                  {isPending ? t('auth.resetPassword.processing') : t('auth.resetPassword.submitButton')}
                </Button>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
}
