import { Globe, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { changeLanguage } from '../../i18n';
import IconDropdown, { DropdownItem } from './IconDropdown';

const LANGUAGES = [
  { code: 'pt-BR', labelKey: 'languages.pt-BR' },
  { code: 'en', labelKey: 'languages.en' },
  { code: 'es', labelKey: 'languages.es' },
];

export default function LanguageSwitcher({ buttonClassName }) {
  const { i18n, t } = useTranslation();

  return (
    <IconDropdown icon={Globe} label={t('common.language')} buttonClassName={buttonClassName}>
      {({ close }) =>
        LANGUAGES.map(({ code, labelKey }) => (
          <DropdownItem
            key={code}
            active={i18n.language === code}
            onClick={() => {
              changeLanguage(code);
              close();
            }}
          >
            <span>{t(labelKey)}</span>
            {i18n.language === code && <Check size={14} />}
          </DropdownItem>
        ))
      }
    </IconDropdown>
  );
}
