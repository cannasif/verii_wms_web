import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import type React from 'react';
import { Mail } from 'lucide-react';
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
import { useForgotPassword } from '../hooks/useForgotPassword';

export function ForgotPasswordPage(): React.JSX.Element {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { mutate: requestPasswordReset, isPending } = useForgotPassword();

  const schema = z.object({
    email: z.string().email(t('auth.validation.emailInvalid')),
  });

  type FormData = z.infer<typeof schema>;

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = (data: FormData): void => {
    requestPasswordReset(data.email);
  };

  return (
    <div className="h-screen flex flex-col">
      <div className="flex flex-1">
        <div className="hidden lg:flex lg:w-1/2 h-full overflow-hidden relative">
          <img
            src={loginImage}
            alt="Forgot Password"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40" />
        </div>

        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 h-full bg-background">
          <div className="w-full max-w-md space-y-8">
            <div className="space-y-3 text-center">
              <div className="flex justify-center">
                <div className="rounded-lg bg-primary/10 p-3">
                  <Mail className="size-6 text-primary" />
                </div>
              </div>
              <div className="space-y-1">
                <h1 className="text-3xl font-semibold tracking-tight">
                  {t('auth.forgotPassword.title')}
                </h1>
                <p className="text-muted-foreground text-sm">
                  {t('auth.forgotPassword.description')}
                </p>
              </div>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('auth.forgotPassword.emailLabel')}</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder={t('auth.forgotPassword.emailPlaceholder')}
                          className="h-11"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full h-11 text-base font-medium"
                  disabled={isPending}
                >
                  {isPending ? t('auth.forgotPassword.processing') : t('auth.forgotPassword.submitButton')}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-11 text-base"
                  onClick={() => navigate('/auth/login')}
                >
                  {t('auth.forgotPassword.backToLogin')}
                </Button>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
}
