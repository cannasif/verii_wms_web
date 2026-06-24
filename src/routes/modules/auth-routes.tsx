import type { RouteObject } from 'react-router-dom';
import AuthLayout from '@/layouts/AuthLayout';
import { RouteErrorPage } from '../RouteErrorPage';
import { lazyNamed, withRoute } from '../route-utils';

const LoginPage = lazyNamed(() => import('@/features/auth'), 'LoginPage');
const ForgotPasswordPage = lazyNamed(() => import('@/features/auth'), 'ForgotPasswordPage');
const ResetPasswordPage = lazyNamed(() => import('@/features/auth'), 'ResetPasswordPage');

export const authRouteTrees: RouteObject[] = [
  {
    path: '/auth',
    errorElement: <RouteErrorPage />,
    element: <AuthLayout />,
    children: [
      { path: 'login', Component: withRoute(LoginPage, { routeName: 'auth-login' }) },
      { path: 'forgot-password', Component: withRoute(ForgotPasswordPage, { routeName: 'auth-forgot-password' }) },
      { path: 'reset-password', Component: withRoute(ResetPasswordPage, { routeName: 'auth-reset-password' }) },
    ],
  },
  {
    path: '/',
    errorElement: <RouteErrorPage />,
    element: <AuthLayout />,
    children: [
      { path: 'forgot-password', Component: withRoute(ForgotPasswordPage, { routeName: 'forgot-password-shortcut' }) },
      { path: 'reset-password', Component: withRoute(ResetPasswordPage, { routeName: 'reset-password-shortcut' }) },
    ],
  },
];
