import { useTranslation } from 'react-i18next';
import { CARD_COLORS, CARD_ICONS } from '../../utils/cardStyle';

export default function CardStylePicker({ color, icon, onColorChange, onIconChange }) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">{t('cards.color')}</p>
        <div className="flex flex-wrap gap-2">
          {CARD_COLORS.map((item) => (
            <button
              key={item.value}
              type="button"
              title={t(`cards.colors.${item.labelKey}`)}
              onClick={() => onColorChange(item.value)}
              className={`h-8 w-8 rounded-full border-2 transition-transform hover:scale-110 ${
                color === item.value ? 'border-slate-900 ring-2 ring-offset-2 dark:border-white dark:ring-white' : 'border-transparent'
              }`}
              style={{ backgroundColor: item.value }}
            />
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">{t('cards.icon')}</p>
        <div className="flex flex-wrap gap-2">
          {CARD_ICONS.map(({ value, Icon }) => (
            <button
              key={value}
              type="button"
              title={t(`cards.icons.${value}`)}
              onClick={() => onIconChange(value)}
              className={`flex h-10 w-10 items-center justify-center rounded-lg border transition-colors ${
                icon === value
                  ? 'border-primary-500 bg-primary-50 text-primary-600 dark:bg-primary-900/40 dark:text-primary-300'
                  : 'border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800'
              }`}
            >
              <Icon size={18} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
