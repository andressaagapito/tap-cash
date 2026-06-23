import { Pencil, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { DEFAULT_CARD_COLOR, DEFAULT_CARD_ICON, getCardIcon } from '../../utils/cardStyle';
import { formatCurrency } from '../../utils/format';

function CreditCardListRow({ card, onEdit, onDelete }) {
  const { t } = useTranslation();
  const color = card.color || DEFAULT_CARD_COLOR;
  const Icon = getCardIcon(card.icon || DEFAULT_CARD_ICON);

  return (
    <tr className="block border-b border-slate-100 last:border-b-0 dark:border-slate-800 sm:table-row">
      <td className="block px-4 py-3 sm:table-cell">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white"
            style={{ backgroundColor: color }}
          >
            <Icon size={20} />
          </div>
          <div className="min-w-0">
            <h3 className="truncate font-semibold text-slate-900 dark:text-slate-100">{card.name}</h3>
            <p className="truncate text-sm text-slate-500 dark:text-slate-400">{card.institution}</p>
          </div>
        </div>
      </td>

      <td className="block px-4 py-1 sm:table-cell sm:py-3 sm:text-right">
        <div className="flex items-center justify-between sm:block">
          <span className="text-xs font-medium uppercase text-slate-400 sm:hidden">
            {t('cards.limit')}
          </span>
          <span className="tabular-nums text-slate-700 dark:text-slate-200">
            {card.limit != null ? formatCurrency(card.limit) : '—'}
          </span>
        </div>
      </td>

      <td className="block px-4 py-1 sm:table-cell sm:py-3 sm:text-right">
        <div className="flex items-center justify-between sm:block">
          <span className="text-xs font-medium uppercase text-slate-400 sm:hidden">
            {t('cards.closing')}
          </span>
          <span className="tabular-nums text-slate-700 dark:text-slate-200">
            {card.closing_day ? `${t('common.day')} ${card.closing_day}` : '—'}
          </span>
        </div>
      </td>

      <td className="block px-4 py-1 sm:table-cell sm:py-3 sm:text-right">
        <div className="flex items-center justify-between sm:block">
          <span className="text-xs font-medium uppercase text-slate-400 sm:hidden">
            {t('cards.due')}
          </span>
          <span className="tabular-nums text-slate-700 dark:text-slate-200">
            {card.due_day ? `${t('common.day')} ${card.due_day}` : '—'}
          </span>
        </div>
      </td>

      <td className="block px-4 py-3 sm:table-cell sm:text-right">
        <div className="flex justify-end gap-1">
          <button
            type="button"
            onClick={() => onEdit(card)}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            title={t('cards.editCard')}
          >
            <Pencil size={16} />
          </button>
          <button
            type="button"
            onClick={() => onDelete(card.id)}
            className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-900/20 dark:hover:text-red-400"
            title={t('cards.deleteTitle')}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function CreditCardList({ cards, onEdit, onDelete }) {
  const { t } = useTranslation();

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <table className="w-full min-w-[36rem] text-sm">
        <thead>
          <tr className="hidden border-b border-slate-100 text-xs font-medium uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400 sm:table-row">
            <th className="px-4 py-3 text-left font-medium">{t('cards.cardName')}</th>
            <th className="w-36 px-4 py-3 text-right font-medium">{t('cards.limit')}</th>
            <th className="w-28 px-4 py-3 text-right font-medium">{t('cards.closing')}</th>
            <th className="w-28 px-4 py-3 text-right font-medium">{t('cards.due')}</th>
            <th className="w-24 px-4 py-3 text-right font-medium">{t('common.actions')}</th>
          </tr>
        </thead>
        <tbody>
          {cards.map((card) => (
            <CreditCardListRow
              key={card.id}
              card={card}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
