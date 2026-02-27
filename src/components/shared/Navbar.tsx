import { type ReactElement, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth-store';
import { useUIStore } from '@/stores/ui-store';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { NotificationIcon } from '@/features/notification/components/NotificationIcon';
import { UserDetailModal } from '@/features/user-detail';
import { cn } from '@/lib/utils';

export function Navbar(): ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, logout, branch } = useAuthStore();
  const { isSidebarOpen, toggleSidebar, pageTitle } = useUIStore();
  const [isUserDetailModalOpen, setIsUserDetailModalOpen] = useState(false);

  const handleLogout = (): void => {
    logout();
    navigate('/auth/login');
  };

  const handleUserClick = (): void => {
    setIsUserDetailModalOpen(true);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-xl supports-backdrop-filter:bg-white/70 dark:border-white/10 dark:bg-[#0c0516]/80">
      <div className="flex h-16 items-center justify-between px-4 sm:px-5">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white lg:hidden"
            aria-label="Toggle sidebar"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className={cn(
              'hidden text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white lg:flex',
              !isSidebarOpen && 'lg:flex',
            )}
            aria-label="Toggle sidebar"
          >
            {isSidebarOpen ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </Button>
          <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100">{pageTitle || t('navbar.wms')}</h1>
        </div>
        <div className="ml-auto flex items-center gap-4">
          {user && (
            <div className="hidden items-center gap-3 text-sm sm:flex">
              {branch && (
                <span className="text-slate-500 dark:text-slate-400">
                  {branch.code && <span className="font-medium">{branch.code}</span>}
                  {branch.name && (
                    <span className={branch.code ? ' ml-1' : ''}>{branch.name}</span>
                  )}
                </span>
              )}
              {branch && <span className="text-slate-400 dark:text-slate-500">•</span>}
              <button
                type="button"
                onClick={handleUserClick}
                className="cursor-pointer text-slate-600 transition-colors hover:text-pink-500 dark:text-slate-300 dark:hover:text-pink-400"
              >
                {user.name || user.email}
              </button>
            </div>
          )}
          <NotificationIcon />
          <ThemeToggle />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
          >
            {t('auth.logout')}
          </Button>
        </div>
      </div>
      <UserDetailModal
        isOpen={isUserDetailModalOpen}
        onClose={() => setIsUserDetailModalOpen(false)}
      />
    </header>
  );
}
