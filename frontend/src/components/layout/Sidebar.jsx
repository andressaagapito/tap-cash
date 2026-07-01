import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  CreditCard,
  Receipt,
  TrendingUp,
  Lightbulb,
  Target,
  User,
  Wallet,
  X,
  Database,
} from 'lucide-react';

const navItems = [
  { to: '/dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard },
  { to: '/cards', labelKey: 'nav.cards', icon: CreditCard },
  { to: '/expenses', labelKey: 'nav.expenses', icon: Receipt },
  { to: '/projection', labelKey: 'nav.projection', icon: TrendingUp },
  { to: '/suggestions', labelKey: 'nav.suggestions', icon: Lightbulb },
  { to: '/goals', labelKey: 'nav.goals', icon: Target },
  { to: '/profile', labelKey: 'nav.profile', icon: User },
  { to: '/settings/backup', labelKey: 'nav.backup', icon: Database },
];


export default function Sidebar({ open, onClose }) {
  const { t } = useTranslation();

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={onClose} />
      )}

      {/* Espaço reservado no desktop para a barra de ícones */}
      <div className="hidden w-18 shrink-0 lg:block" aria-hidden />

      <aside
        className={`group/sidebar fixed inset-y-0 left-0 z-50 flex w-64 flex-col overflow-hidden bg-slate-900 text-white shadow-xl transition-all duration-200 ease-in-out lg:w-18 lg:hover:w-64 lg:hover:shadow-2xl ${
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex h-16 shrink-0 items-center justify-between px-4 lg:justify-center lg:px-0 lg:group-hover/sidebar:justify-between lg:group-hover/sidebar:px-4">
          <div className="flex min-w-0 items-center gap-2 lg:gap-0 lg:group-hover/sidebar:gap-2">
            <Wallet className="shrink-0 text-primary-400" size={28} />
            <span className="truncate text-xl font-bold lg:hidden lg:group-hover/sidebar:inline">
              {t('app.name')}
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 hover:bg-slate-800 lg:hidden"
            type="button"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto overflow-x-hidden px-3 py-4 lg:px-2 lg:group-hover/sidebar:px-3">
          {navItems.map(({ to, labelKey, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              title={t(labelKey)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors lg:justify-center lg:px-2 lg:group-hover/sidebar:justify-start lg:group-hover/sidebar:px-3 ${
                  isActive
                    ? 'bg-primary-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <Icon className="shrink-0" size={20} />
              <span className="truncate lg:hidden lg:group-hover/sidebar:inline">
                {t(labelKey)}
              </span>
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
