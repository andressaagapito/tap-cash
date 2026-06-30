import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { CreditCard, Plus, LayoutGrid, List } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cardsApi } from '../api/cards';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal, { ConfirmModal } from '../components/ui/Modal';
import Loading from '../components/ui/Loading';
import EmptyState from '../components/ui/EmptyState';
import CardStylePicker from '../components/cards/CardStylePicker';
import CreditCardTile from '../components/cards/CreditCardTile';
import CreditCardList from '../components/cards/CreditCardListItem';
import { DEFAULT_CARD_COLOR, DEFAULT_CARD_ICON } from '../utils/cardStyle';
import { getErrorMessage } from '../utils/format';

const emptyForm = {
  name: '',
  institution: '',
  limit: '',
  closing_day: '',
  due_day: '',
  color: DEFAULT_CARD_COLOR,
  icon: DEFAULT_CARD_ICON,
};

const VIEW_STORAGE_KEY = 'tapcash-cards-view';

function getInitialView() {
  try {
    return localStorage.getItem(VIEW_STORAGE_KEY) === 'list' ? 'list' : 'grid';
  } catch {
    return 'grid';
  }
}

export default function Cards() {
  const { t } = useTranslation();
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState(getInitialView);

  const setCardsView = (nextView) => {
    setView(nextView);
    try {
      localStorage.setItem(VIEW_STORAGE_KEY, nextView);
    } catch {
      // ignore storage errors
    }
  };

  const schema = useMemo(
    () =>
      z.object({
        name: z.string().min(1, t('validation.requiredName')),
        institution: z.string().min(1, t('validation.requiredInstitution')),
        limit: z.string().optional(),
        closing_day: z.string().optional(),
        due_day: z.string().optional(),
        color: z.string(),
        icon: z.string(),
      }),
    [t]
  );

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema), defaultValues: emptyForm });

  const color = watch('color');
  const icon = watch('icon');
  const previewName = watch('name');
  const previewInstitution = watch('institution');

  useEffect(() => {
    loadCards();
  }, []);

  const loadCards = async () => {
    try {
      const { data } = await cardsApi.list();
      setCards(data);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingCard(null);
    reset(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (card) => {
    setEditingCard(card);
    reset({
      name: card.name,
      institution: card.institution,
      limit: card.limit?.toString() || '',
      closing_day: card.closing_day?.toString() || '',
      due_day: card.due_day?.toString() || '',
      color: card.color || DEFAULT_CARD_COLOR,
      icon: card.icon || DEFAULT_CARD_ICON,
    });
    setModalOpen(true);
  };

  const onSubmit = async (formData) => {
    setSaving(true);
    const payload = {
      name: formData.name,
      institution: formData.institution,
      limit: formData.limit ? parseFloat(formData.limit) : null,
      closing_day: formData.closing_day ? parseInt(formData.closing_day) : null,
      due_day: formData.due_day ? parseInt(formData.due_day) : null,
      color: formData.color,
      icon: formData.icon,
    };

    try {
      if (editingCard) {
        await cardsApi.update(editingCard.uuid, payload);
        toast.success(t('cards.updated'));
      } else {
        await cardsApi.create(payload);
        toast.success(t('cards.created'));
      }
      setModalOpen(false);
      loadCards();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await cardsApi.delete(deleteId);
      toast.success(t('cards.deleted'));
      setDeleteId(null);
      loadCards();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t('cards.title')}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{t('cards.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          {cards.length > 0 && (
            <div
              className="flex rounded-lg border border-slate-200 p-1 dark:border-slate-700"
              role="group"
              aria-label={t('cards.viewMode')}
            >
              <button
                type="button"
                onClick={() => setCardsView('grid')}
                title={t('cards.viewGrid')}
                className={`rounded-md p-2 transition-colors ${
                  view === 'grid'
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                    : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                }`}
              >
                <LayoutGrid size={18} />
              </button>
              <button
                type="button"
                onClick={() => setCardsView('list')}
                title={t('cards.viewList')}
                className={`rounded-md p-2 transition-colors ${
                  view === 'list'
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                    : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                }`}
              >
                <List size={18} />
              </button>
            </div>
          )}
          <Button onClick={openCreate}>
            <Plus size={18} />
            {t('cards.newCard')}
          </Button>
        </div>
      </div>

      {cards.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title={t('cards.emptyTitle')}
          description={t('cards.emptyDescription')}
          action={
            <Button onClick={openCreate}>
              <Plus size={18} />
              {t('cards.registerCard')}
            </Button>
          }
        />
      ) : view === 'list' ? (
        <CreditCardList cards={cards} onEdit={openEdit} onDelete={setDeleteId} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <CreditCardTile
              key={card.id}
              card={card}
              onEdit={openEdit}
              onDelete={setDeleteId}
            />
          ))}
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCard ? t('cards.editCard') : t('cards.newCard')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSubmit(onSubmit)} loading={saving}>
              {t('common.save')}
            </Button>
          </>
        }
      >
        <form className="space-y-4">
          <CreditCardTile
            preview
            card={{
              name: previewName || t('cards.cardName'),
              institution: previewInstitution || t('cards.institution'),
              color,
              icon,
            }}
          />

          <Input label={t('cards.cardName')} error={errors.name?.message} {...register('name')} />
          <Input label={t('cards.institution')} error={errors.institution?.message} {...register('institution')} />
          <Input label={t('cards.limitOptional')} type="number" step="0.01" {...register('limit')} />
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('cards.closingDay')} type="number" min="1" max="31" {...register('closing_day')} />
            <Input label={t('cards.dueDay')} type="number" min="1" max="31" {...register('due_day')} />
          </div>
          <CardStylePicker
            color={color}
            icon={icon}
            onColorChange={(value) => setValue('color', value)}
            onIconChange={(value) => setValue('icon', value)}
          />
        </form>
      </Modal>

      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title={t('cards.deleteTitle')}
        message={t('cards.deleteMessage')}
        loading={saving}
      />
    </div>
  );
}
