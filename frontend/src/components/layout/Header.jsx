import { Menu, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import Button from '../ui/Button';
import PreferencesBar from '../ui/PreferencesBar';

export default function Header({ onMenuClick }) {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-900 lg:px-6">
      <button
        onClick={onMenuClick}
        className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 lg:hidden"
      >
        <Menu size={24} />
      </button>
      <div className="hidden lg:block" />
      <div className="flex items-center gap-3">
        <PreferencesBar />
        <span className="hidden text-sm text-slate-600 dark:text-slate-300 sm:inline">
          {t('common.hello', { name: `${user?.name || ''} ${user?.last_name || ''}`.trim() })}
        </span>
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          <LogOut size={18} />
          <span className="hidden sm:inline">{t('common.logout')}</span>
        </Button>
      </div>
    </header>
  );
}
