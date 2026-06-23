import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Target } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { goalsApi } from '../api/goals';
import Button from '../components/ui/Button';
import Loading from '../components/ui/Loading';
import EmptyState from '../components/ui/EmptyState';
import { ConfirmModal } from '../components/ui/Modal';
import GoalCard from '../components/goals/GoalCard';
import { getErrorMessage } from '../utils/format';

export default function Goals() {
  const { t } = useTranslation();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    setLoading(true);
    try {
      const { data } = await goalsApi.list();
      setGoals(data);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await goalsApi.delete(deleteId);
      toast.success(t('goals.deleted'));
      setGoals((current) => current.filter((goal) => goal.id !== deleteId));
      setDeleteId(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t('goals.title')}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{t('goals.subtitle')}</p>
        </div>
        <Link to="/goals/new">
          <Button>
            <Plus size={18} />
            {t('goals.newGoal')}
          </Button>
        </Link>
      </div>

      {goals.length === 0 ? (
        <EmptyState
          icon={Target}
          title={t('goals.emptyTitle')}
          description={t('goals.emptyDescription')}
          action={
            <Link to="/goals/new">
              <Button>
                <Plus size={18} />
                {t('goals.newGoal')}
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} onDelete={setDeleteId} />
          ))}
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title={t('goals.deleteTitle')}
        message={t('goals.deleteMessage')}
        loading={deleting}
      />
    </div>
  );
}
