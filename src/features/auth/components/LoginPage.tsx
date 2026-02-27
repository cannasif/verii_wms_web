import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { loginRequestSchema, type LoginRequest } from '../types/auth';
import { useLogin } from '../hooks/useLogin';
import { useBranches } from '../hooks/useBranches';
import { useAuthStore } from '@/stores/auth-store';
import { isTokenValid } from '@/utils/jwt';
import type React from 'react';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher';
import { AuthBackground } from './AuthBackground';
import loginImage from '@/assets/login.jpg';
import { Building2, Eye, EyeOff, Lock, Mail, Sparkles, ShieldCheck, TriangleAlert, Waves } from 'lucide-react';

export function LoginPage(): React.JSX.Element {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: branches } = useBranches();
  const { mutate: login, isPending } = useLogin(branches);
  const { token, isAuthenticated, logout } = useAuthStore();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [capsLockActive, setCapsLockActive] = useState(false);
  const [showAnimation, setShowAnimation] = useState(true);

  const form = useForm<LoginRequest>({
    resolver: zodResolver(loginRequestSchema),
    defaultValues: {
      email: '',
      password: '',
      branchId: '',
    },
  });

  useEffect(() => {
    if (searchParams.get('sessionExpired') === 'true') {
      logout();
      toast.warning(t('auth.login.sessionExpired'));
      setSearchParams({}, { replace: true });
      return;
    }

    if (token && isTokenValid(token) && isAuthenticated()) {
      navigate('/', { replace: true });
    }
  }, [searchParams, setSearchParams, t, token, isAuthenticated, navigate, logout]);

  const onSubmit = (data: LoginRequest): void => {
    login(data);
  };

  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#070d1f] text-white">
      <style>{`
        input { color-scheme: dark; }
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus,
        input:-webkit-autofill:active {
            -webkit-box-shadow: 0 0 0 30px #0b1228 inset !important;
            -webkit-text-fill-color: white !important;
            transition: background-color 5000s ease-in-out 0s;
            caret-color: white;
        }
      `}</style>

      <div className={`absolute inset-0 z-0 transition-opacity duration-1000 ${showAnimation ? 'opacity-0' : 'opacity-100'}`}>
        <div className="absolute left-[-12%] top-[-12%] h-[58vw] w-[58vw] rounded-full bg-cyan-900/20 blur-[120px] mix-blend-screen" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[58vw] w-[58vw] rounded-full bg-blue-900/20 blur-[120px] mix-blend-screen" />
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-[#070d1f]/60 to-[#070d1f]" />
      </div>

      <AuthBackground isActive={showAnimation} />

      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
        <LanguageSwitcher />
        <button
          onClick={() => setShowAnimation((prev) => !prev)}
          className={`
            flex h-11 w-11 items-center justify-center rounded-full border backdrop-blur-xl transition-all duration-300 hover:scale-105 active:scale-95
            ${showAnimation
              ? 'border-cyan-400/50 bg-cyan-500/20 text-cyan-300 shadow-[0_0_18px_rgba(34,211,238,0.35)]'
              : 'border-white/20 bg-slate-900/80 text-slate-200 hover:border-cyan-400/40 hover:text-cyan-300'}
          `}
          title={showAnimation ? t('auth.login.animationOff', 'Animasyonu kapat') : t('auth.login.animationOn', 'Animasyonu ac')}
        >
          {showAnimation ? <Waves size={18} /> : <Sparkles size={18} />}
        </button>
      </div>

      <div className="relative z-10 flex h-full w-full items-center justify-center px-4 py-8">
        <div className="grid w-full max-w-5xl grid-cols-1 overflow-hidden rounded-3xl border border-white/10 bg-[#0b1228]/70 shadow-[0_20px_50px_rgba(0,0,0,0.45)] backdrop-blur-xl lg:grid-cols-[44%_56%]">
          <div className="relative hidden min-h-[620px] lg:block">
            <img src={loginImage} alt="WMS Login" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-linear-to-t from-[#070d1f] via-[#070d1f]/45 to-transparent" />
            <div className="absolute bottom-8 left-8 right-8">
              <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/80">V3RII WMS</p>
              <p className="mt-2 text-2xl font-bold leading-tight text-white">
                Depo operasyonlarinizi
                <span className="block bg-linear-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">tek merkezden yonetin</span>
              </p>
            </div>
          </div>

          <div className="p-8 sm:p-10">
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/15 text-cyan-300">
                <ShieldCheck size={26} />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-white">{t('auth.login.title')}</h1>
              <p className="mt-1 text-sm text-slate-400">{t('auth.login.subtitle')}</p>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
                <FormField
                  control={form.control}
                  name="branchId"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormControl>
                        <div className="group relative">
                          <Building2
                            className={`absolute left-4 top-1/2 -translate-y-1/2 ${fieldState.invalid ? 'text-red-400' : 'text-slate-400 group-focus-within:text-cyan-300'}`}
                            size={18}
                          />
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger
                              className={`h-auto rounded-xl py-6 pl-12 pr-4 text-sm text-white transition-all focus:ring-0 ${
                                fieldState.invalid
                                  ? 'border-red-500/80 bg-red-950/20'
                                  : 'border-white/15 bg-black/25 focus:border-cyan-500'
                              }`}
                            >
                              <SelectValue placeholder={t('auth.login.selectBranch')} />
                            </SelectTrigger>
                            <SelectContent className="border-white/10 bg-[#0b1228] text-white">
                              {branches?.length ? (
                                branches.map((branch) => (
                                  <SelectItem key={branch.id} value={branch.id} className="cursor-pointer focus:bg-cyan-500/20">
                                    {branch.name}
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="no-branch" disabled>
                                  {t('auth.login.branchNotFound')}
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      </FormControl>
                      <FormMessage className="text-xs text-red-400" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormControl>
                        <div className="group relative">
                          <Mail
                            className={`absolute left-4 top-1/2 -translate-y-1/2 ${fieldState.invalid ? 'text-red-400' : 'text-slate-400 group-focus-within:text-cyan-300'}`}
                            size={18}
                          />
                          <Input
                            {...field}
                            type="email"
                            placeholder={t('auth.login.emailPlaceholder')}
                            className={`rounded-xl border py-6 pl-12 pr-4 text-sm text-white placeholder:text-slate-500 focus-visible:ring-0 ${
                              fieldState.invalid
                                ? 'border-red-500/80 bg-red-950/20'
                                : 'border-white/15 bg-black/25 focus-visible:border-cyan-500'
                            }`}
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-xs text-red-400" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormControl>
                        <div className="group relative">
                          <Lock
                            className={`absolute left-4 top-1/2 -translate-y-1/2 ${fieldState.invalid ? 'text-red-400' : 'text-slate-400 group-focus-within:text-cyan-300'}`}
                            size={18}
                          />
                          <Input
                            {...field}
                            type={isPasswordVisible ? 'text' : 'password'}
                            placeholder={t('auth.login.passwordPlaceholder')}
                            className={`rounded-xl border py-6 pl-12 pr-11 text-sm text-white placeholder:text-slate-500 focus-visible:ring-0 ${
                              fieldState.invalid
                                ? 'border-red-500/80 bg-red-950/20'
                                : 'border-white/15 bg-black/25 focus-visible:border-cyan-500'
                            }`}
                            onKeyDown={(e) => setCapsLockActive(e.getModifierState('CapsLock'))}
                            onKeyUp={(e) => setCapsLockActive(e.getModifierState('CapsLock'))}
                          />
                          <button
                            type="button"
                            onClick={() => setIsPasswordVisible((prev) => !prev)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-cyan-300"
                          >
                            {isPasswordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </FormControl>
                      <div className="min-h-[18px]">
                        {fieldState.error ? (
                          <FormMessage className="text-xs text-red-400" />
                        ) : capsLockActive ? (
                          <div className="mt-1 flex w-fit items-center gap-1 rounded-md border border-amber-400/30 bg-amber-400/10 px-2 py-1 text-xs text-amber-300">
                            <TriangleAlert size={12} />
                            {t('auth.login.capsLockOn', 'Caps Lock acik')}
                          </div>
                        ) : null}
                      </div>
                    </FormItem>
                  )}
                />

                <div className="flex justify-end">
                  <button
                    type="button"
                    className="text-sm text-cyan-300 transition hover:text-cyan-200 hover:underline"
                    onClick={() => navigate('/auth/forgot-password')}
                  >
                    {t('auth.login.forgotPassword')}
                  </button>
                </div>

                <Button
                  type="submit"
                  className="mt-2 h-12 w-full rounded-xl bg-linear-to-r from-cyan-600 via-blue-600 to-indigo-600 text-sm font-semibold uppercase tracking-wide text-white hover:opacity-95"
                  disabled={isPending}
                >
                  {isPending ? t('auth.login.loggingIn') : t('auth.login.loginButton')}
                </Button>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
}

