import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { goalsApi } from '../api/goals';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import CurrencyInput from '../components/ui/CurrencyInput';
import Select from '../components/ui/Select';
import Card from '../components/ui/Card';
import Loading from '../components/ui/Loading';
import { getErrorMessage, parseMoneyNumber } from '../utils/format';

const PRIORITIES = ['low', 'medium', 'high'];
const CATEGORIES = ['car', 'travel', 'reserve', 'debt', 'house', 'education', 'health', 'other'];
const STATUSES = ['active', 'completed', 'cancelled'];

const emptyForm = {
  name: '',
  description: '',
  target_amount: '',
  saved_amount: '',
  deadline: '',
  priority: 'medium',
  category: 'other',
  status: 'active',
};

export default function GoalForm() {
  const { t } = useTranslation();
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  const schema = useMemo(
    () =>
      z
        .object({
          name: z.string().min(1, t('validation.requiredName')),
          description: z.string().optional(),
          target_amount: z.string().min(1, t('validation.requiredAmount')),
          saved_amount: z.string().optional(),
          deadline: z.string().optional(),
          priority: z.enum(PRIORITIES),
          category: z.enum(CATEGORIES),
          status: z.enum(STATUSES).optional(),
        })
        .superRefine((data, ctx) => {
          const target = parseMoneyNumber(data.target_amount || '');
          if (!data.target_amount?.trim() || Number.isNaN(target) || target <= 0) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: t('validation.requiredAmount'),
              path: ['target_amount'],
            });
          }
          const saved = parseMoneyNumber(data.saved_amount || '0');
          if (Number.isNaN(saved) || saved < 0) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: t('goals.validation.invalidSaved'),
              path: ['saved_amount'],
            });
          }
        }),
    [t]
  );

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: emptyForm,
  });

  useEffect(() => {
    if (!isEdit) return;
    const loadGoal = async () => {
      try {
        const { data } = await goalsApi.get(id);
        reset({
          name: data.name,
          description: data.description || '',
          target_amount: data.target_amount?.toString() || '',
          saved_amount: data.saved_amount?.toString() || '0',
          deadline: data.deadline || '',
          priority: data.priority,
          category: data.category,
          status: data.status,
        });
      } catch (error) {
        toast.error(getErrorMessage(error));
        navigate('/goals');
      } finally {
        setLoading(false);
      }
    };
    loadGoal();
  }, [id, isEdit, navigate, reset]);

  const onSubmit = async (formData) => {
    setSaving(true);
    const payload = {
      name: formData.name,
      description: formData.description || null,
      target_amount: parseMoneyNumber(formData.target_amount),
      saved_amount: parseMoneyNumber(formData.saved_amount || '0') || 0,
      deadline: formData.deadline || null,
      priority: formData.priority,
      category: formData.category,
      ...(isEdit ? { status: formData.status } : {}),
    };

    try {
      if (isEdit) {
        await goalsApi.update(id, payload);
        toast.success(t('goals.updated'));
        navigate(`/goals/${id}`);
      } else {
        const { data } = await goalsApi.create(payload);
        toast.success(t('goals.created'));
        navigate(`/goals/${data.id}`);
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div>
      <Link
        to={isEdit ? `/goals/${id}` : '/goals'}
        className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-primary-600 dark:text-slate-400 dark:hover:text-primary-400"
      >
        <ArrowLeft size={16} />
        {t('goals.backToList')}
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          {isEdit ? t('goals.editGoal') : t('goals.newGoal')}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {isEdit ? t('goals.editSubtitle') : t('goals.newSubtitle')}
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input
            label={t('goals.goalName')}
            className="md:col-span-2"
            error={errors.name?.message}
            {...register('name')}
          />

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              {t('goals.description')}
            </label>
            <textarea
              rows={3}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
              {...register('description')}
            />
          </div>

          <Controller
            name="target_amount"
            control={control}
            render={({ field }) => (
              <CurrencyInput
                label={t('goals.targetAmount')}
                error={errors.target_amount?.message}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />

          <Controller
            name="saved_amount"
            control={control}
            render={({ field }) => (
              <CurrencyInput
                label={t('goals.savedAmount')}
                error={errors.saved_amount?.message}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />

          <Input
            label={t('goals.deadline')}
            type="date"
            error={errors.deadline?.message}
            {...register('deadline')}
          />

          <Select
            label={t('goals.priority')}
            error={errors.priority?.message}
            options={PRIORITIES.map((value) => ({
              value,
              label: t(`goals.priorities.${value}`),
            }))}
            {...register('priority')}
          />

          <Select
            label={t('goals.category')}
            error={errors.category?.message}
            options={CATEGORIES.map((value) => ({
              value,
              label: t(`goals.categories.${value}`),
            }))}
            {...register('category')}
          />

          {isEdit && (
            <Select
              label={t('goals.status')}
              error={errors.status?.message}
              options={STATUSES.map((value) => ({
                value,
                label: t(`goals.statuses.${value}`),
              }))}
              {...register('status')}
            />
          )}

          <div className="flex gap-3 md:col-span-2">
            <Button type="submit" loading={saving}>
              {isEdit ? t('goals.saveChanges') : t('goals.createGoal')}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate(isEdit ? `/goals/${id}` : '/goals')}
            >
              {t('common.cancel')}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
