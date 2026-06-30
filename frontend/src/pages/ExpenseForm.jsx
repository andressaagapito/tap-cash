import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, useWatch, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { expensesApi } from '../api/expenses';
import { cardsApi } from '../api/cards';
import { categoriesApi } from '../api/categories';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import CurrencyInput from '../components/ui/CurrencyInput';
import Select from '../components/ui/Select';
import Card from '../components/ui/Card';
import Loading from '../components/ui/Loading';
import { ConfirmModal } from '../components/ui/Modal';
import {
  CATEGORY_KEYS,
  getErrorMessage,
  parseMoneyNumber,
  resolveCategoryForSubmit,
  splitCategoryForForm,
  translateCategory,
} from '../utils/format';

const PAYMENT_METHODS = ['credit_card', 'debit_card', 'pix', 'bank_slip'];
const RECURRING_METHODS = ['credit_card', 'pix', 'bank_slip'];

export default function ExpenseForm() {
  const { t } = useTranslation();
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const [cards, setCards] = useState([]);
  const [customCategories, setCustomCategories] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [deleteCategoryTarget, setDeleteCategoryTarget] = useState(null);
  const [deletingCategory, setDeletingCategory] = useState(false);

  const schema = useMemo(
    () =>
      z
        .object({
          name: z.string().min(1, t('validation.requiredName')),
          payment_method: z.enum(PAYMENT_METHODS),
          type: z.enum(['one_time', 'recurring']),
          purchase_date: z.string().min(1, t('validation.requiredDate')),
          total_amount: z.string().min(1, t('validation.requiredAmount')),
          installment_amount: z.string().optional(),
          total_installments: z.string().optional(),
          recurrence_months: z.string().optional(),
          card_id: z.string().optional(),
          category: z.string().min(1, t('validation.requiredCategory')),
          custom_category: z.string().optional(),
          auto_calculate_total: z.boolean().optional(),
          paid_installments: z.string().optional(),
          notes: z.string().optional(),
          status: z.enum(['active', 'paid_off', 'cancelled']).optional(),
        })
        .superRefine((data, ctx) => {
          if (data.category === 'other' && !data.custom_category?.trim()) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: t('validation.requiredCustomCategory'),
              path: ['custom_category'],
            });
          }
          if (data.payment_method === 'credit_card') {
            const installment = parseMoneyNumber(data.installment_amount || '');
            if (!data.installment_amount?.trim() || Number.isNaN(installment) || installment <= 0) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: t('validation.requiredInstallmentAmount'),
                path: ['installment_amount'],
              });
            }
          }
          const total = parseMoneyNumber(data.total_amount || '');
          if (!data.total_amount?.trim() || Number.isNaN(total) || total <= 0) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: t('validation.requiredAmount'),
              path: ['total_amount'],
            });
          }

          const paidCount = parseInt(data.paid_installments || '0', 10);
          const maxInstallments =
            data.type === 'recurring'
              ? parseInt(data.recurrence_months || '', 10) || null
              : parseInt(data.total_installments || '1', 10);

          if (Number.isNaN(paidCount) || paidCount < 0) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: t('validation.paidInstallmentsExceedsTotal'),
              path: ['paid_installments'],
            });
          } else if (maxInstallments && paidCount > maxInstallments) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: t('validation.paidInstallmentsExceedsTotal'),
              path: ['paid_installments'],
            });
          }
        }),
    [t]
  );

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    shouldUnregister: false,
    defaultValues: {
      payment_method: 'credit_card',
      type: 'one_time',
      total_installments: '1',
      status: 'active',
      custom_category: '',
      auto_calculate_total: false,
      paid_installments: '0',
    },
  });

  const paymentMethod = useWatch({ control, name: 'payment_method' });
  const type = useWatch({ control, name: 'type' });
  const category = useWatch({ control, name: 'category' });
  const installmentAmount = useWatch({ control, name: 'installment_amount' });
  const totalInstallments = useWatch({ control, name: 'total_installments' });
  const recurrenceMonths = useWatch({ control, name: 'recurrence_months' });
  const autoCalculateTotal = useWatch({ control, name: 'auto_calculate_total' });

  const showCardSelect = paymentMethod === 'credit_card';
  const isCreditCard = paymentMethod === 'credit_card';
  const allowRecurring = RECURRING_METHODS.includes(paymentMethod);
  const isDebit = paymentMethod === 'debit_card';

  const builtInCategoryKeys = useMemo(
    () => CATEGORY_KEYS.filter((key) => key !== 'other'),
    []
  );

  const categoryOptions = useMemo(
    () => [
      { value: '', label: t('common.select') },
      ...builtInCategoryKeys.map((key) => ({
        value: key,
        label: translateCategory(t, key),
      })),
      ...customCategories.map((item) => ({
        value: item.name,
        label: item.name,
      })),
      { value: 'other', label: translateCategory(t, 'other') },
    ],
    [builtInCategoryKeys, customCategories, t]
  );

  const selectedCustomCategory = customCategories.find((item) => item.name === category);

  useEffect(() => {
    const init = async () => {
      const categories = await loadCustomCategories();
      await loadCards();
      if (isEdit) {
        await loadExpense(categories);
      }
    };
    init();
  }, [id]);

  useEffect(() => {
    if (isDebit) {
      setValue('type', 'one_time');
      setValue('total_installments', '1');
    }
  }, [isDebit, setValue]);

  useEffect(() => {
    if (!allowRecurring && type === 'recurring') {
      setValue('type', 'one_time');
    }
  }, [allowRecurring, type, setValue]);

  const installmentCount =
    type === 'recurring' ? parseInt(recurrenceMonths) || 0 : parseInt(totalInstallments) || 0;

  const showPaidInstallments =
    paymentMethod !== 'debit_card' &&
    (isCreditCard || type === 'recurring' || installmentCount > 1 || installmentCount === 1);

  useEffect(() => {
    if (!isCreditCard || !autoCalculateTotal) return;

    const installment = parseMoneyNumber(installmentAmount);
    if (!installmentAmount || Number.isNaN(installment) || installment <= 0 || installmentCount <= 0) {
      return;
    }

    setValue('total_amount', (installment * installmentCount).toFixed(2));
  }, [
    isCreditCard,
    autoCalculateTotal,
    installmentAmount,
    installmentCount,
    setValue,
  ]);

  const loadCustomCategories = async () => {
    try {
      const { data } = await categoriesApi.list();
      setCustomCategories(data);
      return data;
    } catch (error) {
      toast.error(getErrorMessage(error));
      return [];
    }
  };

  const loadCards = async () => {
    try {
      const { data } = await cardsApi.list();
      setCards(data);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const loadExpense = async (categories = customCategories) => {
    try {
      const { data } = await expensesApi.get(id);
      const customNames = categories.map((item) => item.name);
      const categoryFields = splitCategoryForForm(data.category, customNames);
      const installment = Number(data.installment_amount);
      const count =
        data.type === 'recurring'
          ? Number(data.recurrence_months) || 0
          : Number(data.total_installments) || 0;
      const expectedTotal = installment * count;
      const autoCalculateTotal =
        count > 0 && Math.abs(Number(data.total_amount) - expectedTotal) < 0.02;

      reset({
        name: data.name,
        payment_method: data.payment_method || 'credit_card',
        type: data.type,
        purchase_date: data.purchase_date,
        total_amount: data.total_amount.toString(),
        installment_amount: data.installment_amount.toString(),
        total_installments: data.total_installments.toString(),
        recurrence_months: data.recurrence_months?.toString() || '',
        auto_calculate_total: autoCalculateTotal,
        card_id: data.card_uuid || '',
        category: categoryFields.category,
        custom_category: categoryFields.custom_category,
        paid_installments: String(data.manual_paid_installments ?? 0),
        notes: data.notes || '',
        status: data.status,
      });
    } catch (error) {
      toast.error(getErrorMessage(error));
      navigate('/expenses');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (formData) => {
    setSaving(true);
    const resolvedCategory = resolveCategoryForSubmit(formData.category, formData.custom_category);
    const payload = {
      name: formData.name,
      payment_method: formData.payment_method,
      type: formData.type,
      purchase_date: formData.purchase_date,
      total_amount: parseMoneyNumber(formData.total_amount),
      installment_amount:
        formData.payment_method === 'credit_card' && formData.installment_amount
          ? parseMoneyNumber(formData.installment_amount)
          : undefined,
      total_installments: parseInt(formData.total_installments) || 1,
      recurrence_months: formData.recurrence_months
        ? parseInt(formData.recurrence_months)
        : null,
      card_uuid: formData.payment_method === 'credit_card' && formData.card_id
        ? formData.card_id
        : null,
      category: resolvedCategory,
      notes: formData.notes || null,
      status: isEdit ? formData.status || 'active' : 'active',
      initial_paid_installments: Number.parseInt(formData.paid_installments ?? '0', 10) || 0,
    };

    try {
      if (isEdit) {
        await expensesApi.update(id, payload);
        toast.success(t('expenses.updated'));
      } else {
        await expensesApi.create(payload);
        toast.success(t('expenses.created'));
      }
      navigate('/expenses');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!deleteCategoryTarget) return;

    setDeletingCategory(true);
    try {
      await categoriesApi.delete(deleteCategoryTarget.uuid);
      setCustomCategories((current) =>
        current.filter((item) => item.uuid !== deleteCategoryTarget.uuid)
      );
      if (category === deleteCategoryTarget.name) {
        setValue('category', '');
        setValue('custom_category', '');
      }
      toast.success(t('expenses.categoryDeleted'));
      setDeleteCategoryTarget(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setDeletingCategory(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          {isEdit ? t('expenses.editExpense') : t('expenses.newExpense')}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {isEdit ? t('expenses.editSubtitle') : t('expenses.newSubtitle')}
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Input
            label={t('expenses.expenseName')}
            className="md:col-span-1"
            error={errors.name?.message}
            {...register('name')}
          />

          <Select
            label={t('expenses.paymentMethod')}
            error={errors.payment_method?.message}
            options={PAYMENT_METHODS.map((method) => ({
              value: method,
              label: t(`expenses.paymentMethods.${method}`),
            }))}
            {...register('payment_method')}
          />

          <Select
            label={t('expenses.type')}
            error={errors.type?.message}
            options={[
              { value: 'one_time', label: t('expenses.types.one_time') },
              ...(allowRecurring
                ? [{ value: 'recurring', label: t('expenses.types.recurring') }]
                : []),
            ]}
            {...register('type')}
          />

          <Input
            label={t('expenses.purchaseDate')}
            type="date"
            error={errors.purchase_date?.message}
            {...register('purchase_date')}
          />

          {isCreditCard ? (
            <>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  {t('expenses.autoCalculateTotal')}
                </label>
                <label
                  className="flex h-[38px] cursor-pointer items-center gap-2"
                  title={t('expenses.autoCalculateTotalHint')}
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                    {...register('auto_calculate_total')}
                  />
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {t('expenses.autoCalculateTotalHint')}
                  </span>
                </label>
              </div>

              <Controller
                name="installment_amount"
                control={control}
                render={({ field }) => (
                  <CurrencyInput
                    label={t('expenses.installmentAmount')}
                    error={errors.installment_amount?.message}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                  />
                )}
              />

              {type === 'one_time' ? (
                <Input
                  label={t('expenses.installmentsCount')}
                  type="number"
                  min="1"
                  {...register('total_installments')}
                />
              ) : (
                <Input
                  label={t('expenses.recurrenceMonths')}
                  type="number"
                  min="1"
                  {...register('recurrence_months')}
                />
              )}

              <Controller
                name="total_amount"
                control={control}
                render={({ field }) => (
                  <CurrencyInput
                    label={t('expenses.totalAmount')}
                    error={errors.total_amount?.message}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    readOnly={autoCalculateTotal}
                    className={autoCalculateTotal ? 'bg-slate-50 dark:bg-slate-800' : ''}
                  />
                )}
              />
            </>
          ) : (
            <>
              <Controller
                name="total_amount"
                control={control}
                render={({ field }) => (
                  <CurrencyInput
                    label={t('expenses.totalAmount')}
                    error={errors.total_amount?.message}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                  />
                )}
              />

              {type === 'recurring' && (
                <Input
                  label={t('expenses.recurrenceMonths')}
                  type="number"
                  min="1"
                  {...register('recurrence_months')}
                />
              )}
            </>
          )}

          {showPaidInstallments ? (
            <div>
              <Input
                label={t('expenses.paidInstallmentsCount')}
                type="number"
                min="0"
                max={installmentCount > 0 ? installmentCount : undefined}
                error={errors.paid_installments?.message}
                {...register('paid_installments')}
              />
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {t('expenses.paidInstallmentsHint')}
              </p>
            </div>
          ) : (
            <input type="hidden" {...register('paid_installments')} />
          )}

          {showCardSelect && (
            <Select
              label={t('expenses.card')}
              options={[
                { value: '', label: t('common.none') },
                ...cards.map((c) => ({ value: c.uuid, label: c.name })),
              ]}
              {...register('card_id')}
            />
          )}

          <div>
            <Select
              label={t('expenses.category')}
              error={errors.category?.message}
              options={categoryOptions}
              {...register('category')}
            />
            {selectedCustomCategory && (
              <button
                type="button"
                className="mt-1 text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                onClick={() => setDeleteCategoryTarget(selectedCustomCategory)}
              >
                {t('expenses.deleteCategory')}
              </button>
            )}
          </div>

          {category === 'other' && (
            <Input
              label={t('expenses.customCategory')}
              error={errors.custom_category?.message}
              placeholder={t('expenses.customCategoryPlaceholder')}
              {...register('custom_category')}
            />
          )}

          {isEdit && (
            <Select
              label={t('expenses.status')}
              options={[
                { value: 'active', label: t('expenses.statuses.active') },
                { value: 'paid_off', label: t('expenses.statuses.paid_off') },
                { value: 'cancelled', label: t('expenses.statuses.cancelled') },
              ]}
              {...register('status')}
            />
          )}

          {(paymentMethod === 'pix' || paymentMethod === 'bank_slip') && type === 'recurring' && (
            <p className="md:col-span-3 text-sm text-slate-500 dark:text-slate-400">
              {t('expenses.recurringPaymentHint')}
            </p>
          )}

          <div className="md:col-span-3">
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              {t('expenses.notes')}
            </label>
            <textarea
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
              rows={3}
              {...register('notes')}
            />
          </div>

          <div className="flex gap-3 md:col-span-3">
            <Button type="button" variant="secondary" onClick={() => navigate('/expenses')}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" loading={saving}>
              {isEdit ? t('expenses.saveChanges') : t('expenses.registerExpense')}
            </Button>
          </div>
        </form>
      </Card>

      <ConfirmModal
        isOpen={!!deleteCategoryTarget}
        onClose={() => setDeleteCategoryTarget(null)}
        onConfirm={handleDeleteCategory}
        title={t('expenses.deleteCategoryTitle')}
        message={t('expenses.deleteCategoryMessage', { name: deleteCategoryTarget?.name })}
        loading={deletingCategory}
      />
    </div>
  );
}
