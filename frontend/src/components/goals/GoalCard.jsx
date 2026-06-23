import { Link } from 'react-router-dom';
import { Target, Plus, Pencil, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { formatCurrency, formatDate } from '../../utils/format';

const priorityStyles = {
  low: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  high: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const statusStyles = {
  active: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  cancelled: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
};

export default function GoalCard({ goal, onDelete }) {
  const { t } = useTranslation();
  const progress = Math.min(Number(goal.progress_percent) || 0, 100);

  return (
    <Card className="flex h-full flex-col">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <Link
            to={`/goals/${goal.id}`}
            className="text-lg font-semibold text-slate-900 hover:text-primary-600 dark:text-slate-100 dark:hover:text-primary-400"
          >
            {goal.name}
          </Link>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {t(`goals.categories.${goal.category}`)}
          </p>
        </div>
        <Target className="shrink-0 text-primary-500" size={22} />
      </div>

      <div className="mb-4">
        <div className="mb-1 flex justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>{progress.toFixed(0)}%</span>
          <span>
            {formatCurrency(goal.saved_amount)} / {formatCurrency(goal.target_amount)}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div
            className="h-full rounded-full bg-primary-500 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2 text-sm">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">{t('goals.remaining')}</p>
          <p className="font-medium text-slate-900 dark:text-slate-100">
            {formatCurrency(goal.remaining_amount)}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">{t('goals.monthlyNeeded')}</p>
          <p className="font-medium text-slate-900 dark:text-slate-100">
            {goal.monthly_savings_needed != null
              ? formatCurrency(goal.monthly_savings_needed)
              : '-'}
          </p>
        </div>
      </div>

      <div className="mt-auto flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${priorityStyles[goal.priority]}`}>
          {t(`goals.priorities.${goal.priority}`)}
        </span>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[goal.status]}`}>
          {t(`goals.statuses.${goal.status}`)}
        </span>
        {goal.deadline && (
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {t('goals.deadline')}: {formatDate(goal.deadline)}
          </span>
        )}
      </div>

      <div className="mt-4 flex gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
        <Link to={`/goals/${goal.id}`} className="flex-1">
          <Button variant="secondary" className="w-full" size="sm">
            {t('goals.viewDetails')}
          </Button>
        </Link>
        <Link to={`/goals/${goal.id}/edit`}>
          <Button variant="ghost" size="sm" title={t('goals.editGoal')}>
            <Pencil size={16} />
          </Button>
        </Link>
        <Button variant="ghost" size="sm" onClick={() => onDelete(goal.id)} title={t('goals.deleteGoal')}>
          <Trash2 size={16} className="text-red-500" />
        </Button>
      </div>
    </Card>
  );
}
