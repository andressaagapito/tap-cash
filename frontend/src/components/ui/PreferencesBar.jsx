import LanguageSwitcher from './LanguageSwitcher';
import ThemeSwitcher from './ThemeSwitcher';

const ON_DARK_BUTTON = 'text-white hover:bg-white/10 dark:text-white dark:hover:bg-white/10';

export default function PreferencesBar({ className = '', variant = 'default' }) {
  const buttonClassName = variant === 'onDark' ? ON_DARK_BUTTON : '';

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <ThemeSwitcher buttonClassName={buttonClassName} />
      <LanguageSwitcher buttonClassName={buttonClassName} />
    </div>
  );
}
