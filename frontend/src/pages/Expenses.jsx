import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, Receipt, Pencil, Trash2, CheckCircle, List } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { expensesApi } from '../api/expenses';
import { cardsApi } from '../api/cards';
import Button from '../components/ui/Button';
import Select from '../components/ui/Select';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import Loading from '../components/ui/Loading';
import EmptyState from '../components/ui/EmptyState';
import { ConfirmModal } from '../components/ui/Modal';
import InstallmentsModal from '../components/expenses/InstallmentsModal';
import { formatCurrency, formatDate, getErrorMessage, hasInstallmentBreakdown, translateCategory } from '../utils/format';

export default function Expenses() {
  const { t } = useTranslation();
  const location = useLocation();
  const [expenses, setExpenses] = useState([]);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ card_id: '', status: '', type: '', search: '' });
  const [deleteId, setDeleteId] = useState(null);
  const [installmentsExpense, setInstallmentsExpense] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadCards();
  }, []);

  useEffect(() => {
    loadExpenses();
  }, [filters, location.key]);

  const loadCards = async () => {
    try {
      const { data } = await cardsApi.list();
      setCards(data);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const loadExpenses = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.card_id) params.card_id = filters.card_id;
      if (filters.status) params.status = filters.status;
      if (filters.type) params.type = filters.type;
      if (filters.search) params.search = filters.search;
      const { data } = await expensesApi.list(params);
      setExpenses(data);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      await expensesApi.delete(deleteId);
      toast.success(t('expenses.deleted'));
      setDeleteId(null);
      loadExpenses();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkPaid = async (id) => {
    try {
      await expensesApi.markAsPaid(id);
      toast.success(t('expenses.markedPaid'));
      loadExpenses();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t('expenses.title')}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{t('expenses.subtitle')}</p>
        </div>
        <Link to="/expenses/new">
          <Button>
            <Plus size={18} />
            {t('expenses.newExpense')}
          </Button>
        </Link>
      </div>

      <Card className="mb-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Input
            label={t('expenses.searchByName')}
            placeholder={t('expenses.searchPlaceholder')}
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
          <Select
            label={t('expenses.card')}
            value={filters.card_id}
            onChange={(e) => setFilters({ ...filters, card_id: e.target.value })}
            options={[
              { value: '', label: t('common.all') },
              ...cards.map((c) => ({ value: c.id, label: c.name })),
            ]}
          />
          <Select
            label={t('expenses.status')}
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            options={[
              { value: '', label: t('common.all') },
              { value: 'active', label: t('expenses.statuses.active') },
              { value: 'paid_off', label: t('expenses.statuses.paid_off') },
              { value: 'cancelled', label: t('expenses.statuses.cancelled') },
            ]}
          />
          <Select
            label={t('expenses.type')}
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            options={[
              { value: '', label: t('common.all') },
              { value: 'one_time', label: t('expenses.types.one_time') },
              { value: 'recurring', label: t('expenses.types.recurring') },
            ]}
          />
        </div>
      </Card>

      {loading ? (
        <Loading />
      ) : expenses.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title={t('expenses.emptyTitle')}
          description={t('expenses.emptyDescription')}
          action={
            <Link to="/expenses/new">
              <Button>
                <Plus size={18} />
                {t('expenses.newExpense')}
              </Button>
            </Link>
          }
        />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                <th className="px-4 py-3 font-medium">{t('common.name')}</th>
                <th className="px-4 py-3 font-medium">{t('expenses.type')}</th>
                <th className="px-4 py-3 font-medium">{t('expenses.paymentMethod')}</th>
                <th className="px-4 py-3 font-medium">{t('expenses.category')}</th>
                <th className="px-4 py-3 font-medium">{t('expenses.card')}</th>
                <th className="px-4 py-3 font-medium">{t('expenses.total')}</th>
                <th className="px-4 py-3 font-medium">{t('expenses.installment')}</th>
                <th className="px-4 py-3 font-medium">{t('expenses.remaining')}</th>
                <th className="px-4 py-3 font-medium">{t('expenses.paid')}</th>
                <th className="px-4 py-3 font-medium">{t('expenses.pending')}</th>
                <th className="px-4 py-3 font-medium">{t('expenses.status')}</th>
                <th className="px-4 py-3 font-medium">{t('expenses.endDate')}</th>
                <th className="px-4 py-3 font-medium">{t('expenses.nextDue')}</th>
                <th className="px-4 py-3 font-medium">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((exp) => (
                <tr key={exp.id} className="border-b border-slate-100 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{exp.name}</td>
                  <td className="px-4 py-3">{t(`expenses.types.${exp.type}`)}</td>
                  <td className="px-4 py-3">{t(`expenses.paymentMethods.${exp.payment_method || 'credit_card'}`)}</td>
                  <td className="px-4 py-3">{translateCategory(t, exp.category)}</td>
                  <td className="px-4 py-3">{exp.card_name || '-'}</td>
                  <td className="px-4 py-3">{formatCurrency(exp.total_amount)}</td>
                  <td className="px-4 py-3">
                    {hasInstallmentBreakdown(exp.payment_method)
                      ? formatCurrency(exp.installment_amount)
                      : '-'}
                  </td>
                  <td className="px-4 py-3">{formatCurrency(exp.remaining_amount ?? 0)}</td>
                  <td className="px-4 py-3">{exp.paid_installments}</td>
                  <td className="px-4 py-3">{exp.pending_installments}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        exp.status === 'active'
                          ? 'bg-blue-100 text-blue-700'
                          : exp.status === 'paid_off'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {t(`expenses.statuses.${exp.status}`)}
                    </span>
                  </td>
                  <td className="px-4 py-3">{formatDate(exp.expected_end_date)}</td>
                  <td className="px-4 py-3">{formatDate(exp.next_due_date)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {exp.status === 'active' && (
                        <>
                          <button
                            onClick={() => setInstallmentsExpense({ id: exp.id, name: exp.name })}
                            className="rounded-lg p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                            title={t('expenses.viewInstallments')}
                          >
                            <List size={16} />
                          </button>
                          <button
                          onClick={() => handleMarkPaid(exp.id)}
                          className="rounded-lg p-1.5 text-green-600 hover:bg-green-50"
                          title={t('expenses.markAsPaid')}
                        >
                          <CheckCircle size={16} />
                        </button>
                        </>
                      )}
                      <Link
                        to={`/expenses/${exp.id}/edit`}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                      >
                        <Pencil size={16} />
                      </Link>
                      <button
                        onClick={() => setDeleteId(exp.id)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <InstallmentsModal
        expenseId={installmentsExpense?.id}
        expenseName={installmentsExpense?.name}
        isOpen={!!installmentsExpense}
        onClose={() => setInstallmentsExpense(null)}
        onUpdated={loadExpenses}
      />

      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title={t('expenses.deleteTitle')}
        message={t('expenses.deleteMessage')}
        loading={actionLoading}
      />
    </div>
  );
}
