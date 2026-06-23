import { Moon, Sun, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useThemeStore } from '../../store/themeStore';
import IconDropdown, { DropdownItem } from './IconDropdown';

export default function ThemeSwitcher({ buttonClassName }) {
  const { t } = useTranslation();
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);
  const Icon = theme === 'dark' ? Moon : Sun;

  const options = [
    { value: 'light', labelKey: 'theme.light', icon: Sun },
    { value: 'dark', labelKey: 'theme.dark', icon: Moon },
  ];

  return (
    <IconDropdown icon={Icon} label={t('theme.label')} buttonClassName={buttonClassName}>
      {({ close }) =>
        options.map(({ value, labelKey, icon: OptionIcon }) => (
          <DropdownItem
            key={value}
            active={theme === value}
            onClick={() => {
              setTheme(value);
              close();
            }}
          >
            <span className="flex items-center gap-2">
              <OptionIcon size={14} />
              {t(labelKey)}
            </span>
            {theme === value && <Check size={14} />}
          </DropdownItem>
        ))
      }
    </IconDropdown>
  );
}
