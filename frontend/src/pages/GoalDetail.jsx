import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  ExternalLink,
  Target,
  TrendingUp,
  Calendar,
  Wallet,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { goalsApi } from '../api/goals';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import CurrencyInput from '../components/ui/CurrencyInput';
import Select from '../components/ui/Select';
import Card from '../components/ui/Card';
import Loading from '../components/ui/Loading';
import Modal, { ConfirmModal } from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import { formatCurrency, formatDate, getErrorMessage, parseMoneyNumber } from '../utils/format';

const OPTION_STATUSES = ['analyzing', 'chosen', 'discarded'];

const priorityStyles = {
  low: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  high: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const optionStatusStyles = {
  analyzing: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  chosen: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  discarded: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
};

const emptyOptionForm = {
  name: '',
  estimated_amount: '',
  description: '',
  reference_link: '',
  status: 'analyzing',
};

export default function GoalDetail() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [goal, setGoal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteGoalOpen, setDeleteGoalOpen] = useState(false);
  const [deletingGoal, setDeletingGoal] = useState(false);
  const [optionModalOpen, setOptionModalOpen] = useState(false);
  const [editingOption, setEditingOption] = useState(null);
  const [deleteOptionId, setDeleteOptionId] = useState(null);
  const [savingOption, setSavingOption] = useState(false);
  const [deletingOption, setDeletingOption] = useState(false);

  const optionSchema = useMemo(
    () =>
      z
        .object({
          name: z.string().min(1, t('validation.requiredName')),
          estimated_amount: z.string().min(1, t('validation.requiredAmount')),
          description: z.string().optional(),
          reference_link: z.string().optional(),
          status: z.enum(OPTION_STATUSES),
        })
        .superRefine((data, ctx) => {
          const amount = parseMoneyNumber(data.estimated_amount || '');
          if (!data.estimated_amount?.trim() || Number.isNaN(amount) || amount <= 0) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: t('validation.requiredAmount'),
              path: ['estimated_amount'],
            });
          }
        }),
    [t]
  );

  const {
    register: registerOption,
    handleSubmit: handleSubmitOption,
    reset: resetOption,
    control: controlOption,
    formState: { errors: optionErrors },
  } = useForm({
    resolver: zodResolver(optionSchema),
    defaultValues: emptyOptionForm,
  });

  const loadGoal = async () => {
    setLoading(true);
    try {
      const { data } = await goalsApi.get(id);
      setGoal(data);
    } catch (error) {
      toast.error(getErrorMessage(error));
      navigate('/goals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGoal();
  }, [id]);

  const handleDeleteGoal = async () => {
    setDeletingGoal(true);
    try {
      await goalsApi.delete(id);
      toast.success(t('goals.deleted'));
      navigate('/goals');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setDeletingGoal(false);
    }
  };

  const openCreateOption = () => {
    setEditingOption(null);
    resetOption(emptyOptionForm);
    setOptionModalOpen(true);
  };

  const openEditOption = (option) => {
    setEditingOption(option);
    resetOption({
      name: option.name,
      estimated_amount: option.estimated_amount?.toString() || '',
      description: option.description || '',
      reference_link: option.reference_link || '',
      status: option.status,
    });
    setOptionModalOpen(true);
  };

  const onSubmitOption = async (formData) => {
    setSavingOption(true);
    const payload = {
      name: formData.name,
      estimated_amount: parseMoneyNumber(formData.estimated_amount),
      description: formData.description || null,
      reference_link: formData.reference_link?.trim() || null,
      status: formData.status,
    };

    try {
      if (editingOption) {
        await goalsApi.updateOption(id, editingOption.id, payload);
        toast.success(t('goals.optionUpdated'));
      } else {
        await goalsApi.createOption(id, payload);
        toast.success(t('goals.optionCreated'));
      }
      setOptionModalOpen(false);
      await loadGoal();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSavingOption(false);
    }
  };

  const handleDeleteOption = async () => {
    if (!deleteOptionId) return;
    setDeletingOption(true);
    try {
      await goalsApi.deleteOption(id, deleteOptionId);
      toast.success(t('goals.optionDeleted'));
      setDeleteOptionId(null);
      await loadGoal();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setDeletingOption(false);
    }
  };

  if (loading) return <Loading />;
  if (!goal) return null;

  const progress = Math.min(Number(goal.progress_percent) || 0, 100);
  const analysis = goal.analysis || {};

  return (
    <div>
      <Link
        to="/goals"
        className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-primary-600 dark:text-slate-400 dark:hover:text-primary-400"
      >
        <ArrowLeft size={16} />
        {t('goals.backToList')}
      </Link>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{goal.name}</h1>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${priorityStyles[goal.priority]}`}>
              {t(`goals.priorities.${goal.priority}`)}
            </span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {t(`goals.categories.${goal.category}`)}
            </span>
          </div>
          {goal.description && (
            <p className="text-sm text-slate-600 dark:text-slate-300">{goal.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Link to={`/goals/${id}/edit`}>
            <Button variant="secondary" size="sm">
              <Pencil size={16} />
              {t('goals.editGoal')}
            </Button>
          </Link>
          <Button variant="danger" size="sm" onClick={() => setDeleteGoalOpen(true)}>
            <Trash2 size={16} />
            {t('goals.deleteGoal')}
          </Button>
        </div>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="flex items-start gap-3">
          <div className="rounded-lg bg-primary-100 p-2 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
            <Target size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">{t('goals.progress')}</p>
            <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{progress.toFixed(0)}%</p>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div className="h-full rounded-full bg-primary-500" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </Card>

        <Card className="flex items-start gap-3">
          <div className="rounded-lg bg-amber-100 p-2 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
            <Wallet size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">{t('goals.remaining')}</p>
            <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {formatCurrency(goal.remaining_amount)}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {formatCurrency(goal.saved_amount)} / {formatCurrency(goal.target_amount)}
            </p>
          </div>
        </Card>

        <Card className="flex items-start gap-3">
          <div className="rounded-lg bg-emerald-100 p-2 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
            <TrendingUp size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">{t('goals.monthlyNeeded')}</p>
            <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {goal.monthly_savings_needed != null
                ? formatCurrency(goal.monthly_savings_needed)
                : '-'}
            </p>
            {analysis.savings_suggestion && (
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {t(`goals.suggestions.${analysis.savings_suggestion}`)}
              </p>
            )}
          </div>
        </Card>

        <Card className="flex items-start gap-3">
          <div className="rounded-lg bg-blue-100 p-2 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
            <Calendar size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">{t('goals.estimatedCompletion')}</p>
            <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {goal.estimated_completion_date
                ? formatDate(goal.estimated_completion_date)
                : '-'}
            </p>
            {goal.deadline && (
              <p className="mt-1 text-xs text-slate-500">
                {t('goals.deadline')}: {formatDate(goal.deadline)}
                {analysis.on_track != null && (
                  <span className={analysis.on_track ? ' text-emerald-600' : ' text-amber-600'}>
                    {' '}
                    — {analysis.on_track ? t('goals.onTrack') : t('goals.offTrack')}
                  </span>
                )}
              </p>
            )}
          </div>
        </Card>
      </div>

      <div className="mb-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {t('goals.optionsTitle')}
          </h2>
          <Button size="sm" onClick={openCreateOption}>
            <Plus size={16} />
            {t('goals.addOption')}
          </Button>
        </div>

        {goal.options?.length === 0 ? (
          <EmptyState
            title={t('goals.noOptionsTitle')}
            description={t('goals.noOptionsDescription')}
            action={
              <Button size="sm" onClick={openCreateOption}>
                <Plus size={16} />
                {t('goals.addOption')}
              </Button>
            }
          />
        ) : (
          <div className="space-y-4">
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-3">{t('common.name')}</th>
                    <th className="px-4 py-3">{t('goals.estimatedAmount')}</th>
                    <th className="px-4 py-3">{t('goals.gapFromSaved')}</th>
                    <th className="px-4 py-3">{t('goals.monthlyForOption')}</th>
                    <th className="px-4 py-3">{t('goals.status')}</th>
                    <th className="px-4 py-3">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {goal.options.map((option) => (
                    <tr key={option.id} className="bg-white dark:bg-slate-900">
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900 dark:text-slate-100">{option.name}</p>
                        {option.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400">{option.description}</p>
                        )}
                        {option.reference_link && (
                          <a
                            href={option.reference_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1 inline-flex items-center gap-1 text-xs text-primary-600 hover:underline dark:text-primary-400"
                          >
                            <ExternalLink size={12} />
                            {t('goals.referenceLink')}
                          </a>
                        )}
                      </td>
                      <td className="px-4 py-3">{formatCurrency(option.estimated_amount)}</td>
                      <td className="px-4 py-3">{formatCurrency(option.gap_from_saved)}</td>
                      <td className="px-4 py-3">
                        {option.monthly_savings_for_option != null
                          ? formatCurrency(option.monthly_savings_for_option)
                          : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${optionStatusStyles[option.status]}`}
                        >
                          {t(`goals.optionStatuses.${option.status}`)}
                        </span>
                        {option.affordable_now && (
                          <p className="mt-1 text-xs text-emerald-600">{t('goals.affordableNow')}</p>
                        )}
                        {option.fits_target === false && (
                          <p className="mt-1 text-xs text-amber-600">{t('goals.exceedsTarget')}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEditOption(option)}>
                            <Pencil size={14} />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setDeleteOptionId(option.id)}>
                            <Trash2 size={14} className="text-red-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {goal.option_comparison?.length > 0 && (
              <Card>
                <h3 className="mb-3 font-semibold text-slate-900 dark:text-slate-100">
                  {t('goals.comparisonTitle')}
                </h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {goal.option_comparison.map((item) => (
                    <div
                      key={item.option_id}
                      className="rounded-lg border border-slate-200 p-3 dark:border-slate-700"
                    >
                      <p className="font-medium text-slate-900 dark:text-slate-100">{item.name}</p>
                      <p className="text-lg font-bold text-primary-600 dark:text-primary-400">
                        {formatCurrency(item.estimated_amount)}
                      </p>
                      <div className="mt-2 space-y-1 text-xs text-slate-500 dark:text-slate-400">
                        <p>
                          {t('goals.gapFromSaved')}: {formatCurrency(item.gap_from_saved)}
                        </p>
                        <p>
                          {t('goals.gapFromTarget')}: {formatCurrency(item.gap_from_target)}
                        </p>
                        {item.monthly_savings_for_option != null && (
                          <p>
                            {t('goals.monthlyForOption')}:{' '}
                            {formatCurrency(item.monthly_savings_for_option)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}
      </div>

      <Modal
        isOpen={optionModalOpen}
        onClose={() => setOptionModalOpen(false)}
        title={editingOption ? t('goals.editOption') : t('goals.addOption')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOptionModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSubmitOption(onSubmitOption)} loading={savingOption}>
              {t('common.save')}
            </Button>
          </>
        }
      >
        <form className="space-y-4" onSubmit={handleSubmitOption(onSubmitOption)}>
          <Input
            label={t('common.name')}
            error={optionErrors.name?.message}
            {...registerOption('name')}
          />
          <Controller
            name="estimated_amount"
            control={controlOption}
            render={({ field }) => (
              <CurrencyInput
                label={t('goals.estimatedAmount')}
                error={optionErrors.estimated_amount?.message}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              {t('goals.description')}
            </label>
            <textarea
              rows={2}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
              {...registerOption('description')}
            />
          </div>
          <Input
            label={t('goals.referenceLinkOptional')}
            placeholder="https://"
            error={optionErrors.reference_link?.message}
            {...registerOption('reference_link')}
          />
          <Select
            label={t('goals.status')}
            error={optionErrors.status?.message}
            options={OPTION_STATUSES.map((value) => ({
              value,
              label: t(`goals.optionStatuses.${value}`),
            }))}
            {...registerOption('status')}
          />
        </form>
      </Modal>

      <ConfirmModal
        isOpen={deleteGoalOpen}
        onClose={() => setDeleteGoalOpen(false)}
        onConfirm={handleDeleteGoal}
        title={t('goals.deleteTitle')}
        message={t('goals.deleteMessage')}
        loading={deletingGoal}
      />

      <ConfirmModal
        isOpen={!!deleteOptionId}
        onClose={() => setDeleteOptionId(null)}
        onConfirm={handleDeleteOption}
        title={t('goals.deleteOptionTitle')}
        message={t('goals.deleteOptionMessage')}
        loading={deletingOption}
      />
    </div>
  );
}
