import { useEffect, useState } from 'react';
import { CheckCircle, RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { expensesApi } from '../../api/expenses';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Loading from '../ui/Loading';
import { formatCurrency, formatDate, getErrorMessage } from '../../utils/format';

export default function InstallmentsModal({ expenseId, expenseName, isOpen, onClose, onUpdated }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [installments, setInstallments] = useState([]);

  useEffect(() => {
    if (!isOpen || !expenseId) return;
    loadInstallments();
  }, [isOpen, expenseId]);

  const loadInstallments = async () => {
    setLoading(true);
    try {
      const { data } = await expensesApi.get(expenseId);
      setInstallments(data.installments || []);
    } catch (error) {
      toast.error(getErrorMessage(error));
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleMarkPaid = async (number) => {
    setActionLoading(number);
    try {
      await expensesApi.markInstallmentPaid(expenseId, number);
      toast.success(t('expenses.installmentMarkedPaid'));
      await loadInstallments();
      onUpdated?.();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkUnpaid = async (number) => {
    setActionLoading(number);
    try {
      await expensesApi.markInstallmentUnpaid(expenseId, number);
      toast.success(t('expenses.installmentMarkedUnpaid'));
      await loadInstallments();
      onUpdated?.();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('expenses.installmentsTitle', { name: expenseName })}
    >
      {loading ? (
        <Loading />
      ) : installments.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">{t('expenses.emptyDescription')}</p>
      ) : (
        <div className="max-h-96 space-y-2 overflow-y-auto">
          {installments.map((item) => (
            <div
              key={item.number}
              className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700"
            >
              <div>
                <p className="font-medium text-slate-900 dark:text-slate-100">
                  {t('expenses.installmentNumber', { number: item.number })}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t('expenses.dueDate')}: {formatDate(item.due_date)} · {formatCurrency(item.amount)}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      item.status === 'paid'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                    }`}
                  >
                    {t(`expenses.installmentStatuses.${item.status}`)}
                  </span>
                  {item.paid_by && (
                    <span className="text-xs text-slate-400">
                      ({t(`expenses.paidBy.${item.paid_by}`)})
                    </span>
                  )}
                </div>
              </div>
              <div>
                {item.status === 'pending' ? (
                  <button
                    onClick={() => handleMarkPaid(item.number)}
                    disabled={actionLoading === item.number}
                    className="rounded-lg p-1.5 text-green-600 hover:bg-green-50 disabled:opacity-50 dark:hover:bg-green-900/30"
                    title={t('expenses.markInstallmentPaid')}
                  >
                    <CheckCircle size={18} />
                  </button>
                ) : item.paid_by === 'manual' ? (
                  <button
                    onClick={() => handleMarkUnpaid(item.number)}
                    disabled={actionLoading === item.number}
                    className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-50 dark:hover:bg-slate-800"
                    title={t('expenses.markInstallmentUnpaid')}
                  >
                    <RotateCcw size={18} />
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="mt-4 flex justify-end">
        <Button variant="secondary" onClick={onClose}>
          {t('common.cancel')}
        </Button>
      </div>
    </Modal>
  );
}
