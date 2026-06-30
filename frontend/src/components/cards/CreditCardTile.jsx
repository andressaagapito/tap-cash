import { Pencil, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { DEFAULT_CARD_COLOR, DEFAULT_CARD_ICON, getCardIcon, shadeColor } from '../../utils/cardStyle';
import { formatCurrency } from '../../utils/format';

export default function CreditCardTile({ card, onEdit, onDelete, preview = false }) {
  const { t } = useTranslation();
  const color = card.color || DEFAULT_CARD_COLOR;
  const Icon = getCardIcon(card.icon || DEFAULT_CARD_ICON);

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-5 text-white shadow-md"
      style={{
        background: `linear-gradient(135deg, ${color} 0%, ${shadeColor(color, -40)} 100%)`,
      }}
    >
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10" />
      <div className="absolute -bottom-8 -left-4 h-28 w-28 rounded-full bg-white/10" />

      <div className="relative flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
            <Icon size={22} />
          </div>
          <div>
            <h3 className="font-semibold">{card.name}</h3>
            <p className="text-sm text-white/80">{card.institution}</p>
          </div>
        </div>
        <div className="flex gap-1">
          {!preview && (
            <>
              <button
                onClick={() => onEdit(card)}
                className="rounded-lg p-2 text-white/80 hover:bg-white/20 hover:text-white"
              >
                <Pencil size={16} />
              </button>
              <button
                onClick={() => onDelete(card.uuid)}
                className="rounded-lg p-2 text-white/80 hover:bg-white/20 hover:text-white"
              >
                <Trash2 size={16} />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="relative mt-6 space-y-1 text-sm text-white/90">
        {card.limit != null && <p>{t('cards.limit')}: {formatCurrency(card.limit)}</p>}
        {card.closing_day && <p>{t('cards.closing')}: {t('common.day')} {card.closing_day}</p>}
        {card.due_day && <p>{t('cards.due')}: {t('common.day')} {card.due_day}</p>}
      </div>
    </div>
  );
}
