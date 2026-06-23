import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { projectionApi } from '../api/projection';
import Card from '../components/ui/Card';
import Loading from '../components/ui/Loading';
import EmptyState from '../components/ui/EmptyState';
import { formatCurrency, getMonthName, getErrorMessage } from '../utils/format';

export default function Projection() {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjection();
  }, []);

  const loadProjection = async () => {
    try {
      const { data: res } = await projectionApi.get(12);
      setData(res);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading />;

  if (!data?.months?.length) {
    return (
      <EmptyState
        icon={TrendingUp}
        title={t('projection.emptyTitle')}
        description={t('projection.emptyDescription')}
      />
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t('projection.title')}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {t('projection.subtitle', { salary: formatCurrency(data.monthly_salary) })}
        </p>
      </div>

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
              <th className="px-4 py-3 font-medium">{t('projection.month')}</th>
              <th className="px-4 py-3 font-medium">{t('projection.salary')}</th>
              <th className="px-4 py-3 font-medium">{t('projection.recurring')}</th>
              <th className="px-4 py-3 font-medium">{t('projection.installments')}</th>
              <th className="px-4 py-3 font-medium">{t('projection.totalCommitted')}</th>
              <th className="px-4 py-3 font-medium">{t('projection.estimatedBalance')}</th>
              <th className="px-4 py-3 font-medium">{t('projection.endingInMonth')}</th>
            </tr>
          </thead>
          <tbody>
            {data.months.map((month) => (
              <tr key={`${month.year}-${month.month_number}`} className="border-b border-slate-100 dark:border-slate-800">
                <td className="px-4 py-3 font-medium capitalize text-slate-900 dark:text-slate-100">
                  {getMonthName(month.month_number)}/{month.year}
                </td>
                <td className="px-4 py-3">{formatCurrency(month.expected_salary)}</td>
                <td className="px-4 py-3">{formatCurrency(month.recurring_expenses)}</td>
                <td className="px-4 py-3">{formatCurrency(month.installment_expenses)}</td>
                <td className="px-4 py-3">{formatCurrency(month.total_committed)}</td>
                <td
                  className={`px-4 py-3 font-medium ${
                    Number(month.estimated_balance) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {formatCurrency(month.estimated_balance)}
                </td>
                <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                  {month.ending_accounts.length > 0
                    ? month.ending_accounts.join(', ')
                    : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
