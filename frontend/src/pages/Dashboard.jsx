import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Receipt, Calendar, Clock, Wallet, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { expensesApi } from '../api/expenses';
import { StatCard } from '../components/ui/Card';
import Card from '../components/ui/Card';
import Loading from '../components/ui/Loading';
import { formatCurrency, formatDate, getErrorMessage, hasInstallmentBreakdown } from '../utils/format';

export default function Dashboard() {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const { data: res } = await expensesApi.dashboard();
      setData(res);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t('dashboard.title')}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">{t('dashboard.subtitle')}</p>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title={t('dashboard.totalExpenses')}
          value={data?.total_expenses || 0}
          icon={Receipt}
          color="primary"
        />
        <StatCard
          title={t('dashboard.monthlyCommitted')}
          value={formatCurrency(data?.monthly_committed)}
          icon={Calendar}
          color="orange"
        />
        <StatCard
          title={t('dashboard.pendingInstallments')}
          value={data?.pending_installments_total || 0}
          icon={Clock}
          color="purple"
        />
        <StatCard
          title={t('dashboard.balanceSubtitle')}
          value={formatCurrency(data?.estimated_monthly_balance)}
          icon={Wallet}
          color="green"
        />
      </div>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{t('dashboard.upcomingBills')}</h2>
          <Link to="/expenses" className="text-sm text-primary-600 hover:text-primary-700">
            {t('dashboard.viewAll')}
          </Link>
        </div>

        {data?.upcoming_bills?.length === 0 ? (
          <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-4 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            <AlertCircle size={20} />
            <span className="text-sm">{t('dashboard.noPendingBills')}</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500 dark:border-slate-700 dark:text-slate-400">
                  <th className="pb-3 font-medium">{t('common.name')}</th>
                  <th className="pb-3 font-medium">{t('dashboard.installment')}</th>
                  <th className="pb-3 font-medium">{t('dashboard.pending')}</th>
                  <th className="pb-3 font-medium">{t('dashboard.expectedEnd')}</th>
                </tr>
              </thead>
              <tbody>
                {data?.upcoming_bills?.map((bill) => (
                  <tr key={bill.id} className="border-b border-slate-100 dark:border-slate-800">
                    <td className="py-3 font-medium text-slate-900 dark:text-slate-100">{bill.name}</td>
                    <td className="py-3">
                      {hasInstallmentBreakdown(bill.payment_method)
                        ? formatCurrency(bill.installment_amount)
                        : '-'}
                    </td>
                    <td className="py-3">{bill.pending_installments}</td>
                    <td className="py-3">{formatDate(bill.expected_end_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
