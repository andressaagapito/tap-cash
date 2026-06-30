import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { financialProfileApi } from '../api/financialProfile';
import { authApi } from '../api/auth';
import { useAuthStore } from '../store/authStore';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Loading from '../components/ui/Loading';
import PreferencesBar from '../components/ui/PreferencesBar';
import { getErrorMessage } from '../utils/format';

export default function Profile() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newRecoveryPhrase, setNewRecoveryPhrase] = useState('');
  const [updatingPhrase, setUpdatingPhrase] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileLastName, setProfileLastName] = useState(user?.last_name || '');
  const [updatingProfileInfo, setUpdatingProfileInfo] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileName(user.name || '');
      setProfileLastName(user.last_name || '');
    }
  }, [user]);

  const handleUpdateProfileInfo = async (e) => {
    e.preventDefault();
    if (!profileName.trim()) {
      toast.error(t('validation.requiredName'));
      return;
    }
    setUpdatingProfileInfo(true);
    try {
      const response = await authApi.updateProfile({
        name: profileName,
        last_name: profileLastName,
      });
      useAuthStore.setState({ user: response.data });
      toast.success(t('profile.updated'));
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setUpdatingProfileInfo(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!newPassword.trim()) {
      toast.error(t('validation.passwordMin'));
      return;
    }
    setUpdatingPassword(true);
    try {
      const response = await authApi.updateProfile({
        password: newPassword,
      });
      useAuthStore.setState({ user: response.data });
      toast.success(t('profile.updated'));
      setNewPassword('');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleUpdateRecoveryPhrase = async (e) => {
    e.preventDefault();
    if (!newRecoveryPhrase.trim()) {
      toast.error(t('validation.requiredRecoveryPhrase'));
      return;
    }
    setUpdatingPhrase(true);
    try {
      const response = await authApi.updateProfile({
        recovery_phrase: newRecoveryPhrase,
      });
      useAuthStore.setState({ user: response.data });
      toast.success(t('profile.updated'));
      setNewRecoveryPhrase('');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setUpdatingPhrase(false);
    }
  };

  const schema = useMemo(
    () =>
      z.object({
        monthly_salary: z.string().min(1, t('validation.requiredSalary')),
        auto_mark_installments_paid: z.boolean(),
      }),
    [t]
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data } = await financialProfileApi.get();
      reset({
        monthly_salary: data.monthly_salary.toString(),
        auto_mark_installments_paid: data.auto_mark_installments_paid ?? false,
      });
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (formData) => {
    setSaving(true);
    try {
      await financialProfileApi.update({
        monthly_salary: parseFloat(formData.monthly_salary),
        auto_mark_installments_paid: formData.auto_mark_installments_paid,
      });
      toast.success(t('profile.updated'));
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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t('profile.title')}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{t('profile.subtitle')}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Card>
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-full bg-primary-100 p-3 dark:bg-primary-900/40">
                <User className="text-primary-600 dark:text-primary-400" size={24} />
              </div>
              <div>
                <h2 className="font-semibold text-slate-900 dark:text-slate-100">
                  {user?.name} {user?.last_name || ''}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">{user?.email}</p>
              </div>
            </div>
            <form onSubmit={handleUpdateProfileInfo} className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label={t('common.name')}
                  placeholder={t('auth.namePlaceholder')}
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                />
                <Input
                  label={t('common.lastName')}
                  placeholder={t('auth.lastNamePlaceholder')}
                  value={profileLastName}
                  onChange={(e) => setProfileLastName(e.target.value)}
                />
              </div>
              <Button type="submit" loading={updatingProfileInfo}>
                {t('common.save')}
              </Button>
            </form>
          </Card>

          <Card>
            <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
              {t('profile.securityTitle')}
            </h2>

            {/* Formulario Alterar Senha */}
            <div className="border-b border-slate-200 pb-6 mb-6 dark:border-slate-800">
              <h3 className="mb-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                {t('profile.changePassword')}
              </h3>
              <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
                {t('profile.lastPasswordChange')}
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {user?.password_updated_at ? new Date(user.password_updated_at).toLocaleString() : t('profile.neverChanged')}
                </span>
              </p>
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <Input
                  label={t('profile.passwordLabel')}
                  type="password"
                  placeholder={t('profile.newPasswordPlaceholder')}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <Button type="submit" loading={updatingPassword}>
                  {t('common.save')}
                </Button>
              </form>
            </div>

            {/* Formulario Alterar Palavra-passe */}
            <div>
              <h3 className="mb-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                {t('profile.recoveryPhraseLabel')}
              </h3>
              <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">
                {t('profile.lastRecoveryPhraseChange')}
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {user?.recovery_phrase_updated_at ? new Date(user.recovery_phrase_updated_at).toLocaleString() : t('profile.neverChanged')}
                </span>
              </p>
              <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
                {t('profile.recoveryPhraseDescription')}
              </p>
              <form onSubmit={handleUpdateRecoveryPhrase} className="space-y-4">
                <Input
                  label={t('profile.recoveryPhraseLabel')}
                  type="password"
                  placeholder={t('auth.recoveryPhrasePlaceholder')}
                  value={newRecoveryPhrase}
                  onChange={(e) => setNewRecoveryPhrase(e.target.value)}
                />
                <Button type="submit" loading={updatingPhrase}>
                  {t('common.save')}
                </Button>
              </form>
            </div>
          </Card>
        </div>

        <Card>
          <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">{t('profile.monthlySalary')}</h2>
          <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">{t('profile.salaryDescription')}</p>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label={t('profile.salaryLabel')}
              type="number"
              step="0.01"
              min="0"
              error={errors.monthly_salary?.message}
              {...register('monthly_salary')}
            />

            <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
              <h3 className="font-medium text-slate-900 dark:text-slate-100">{t('profile.autoMarkTitle')}</h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t('profile.autoMarkDescription')}</p>
              <label className="mt-3 flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                  {...register('auto_mark_installments_paid')}
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">{t('profile.autoMarkLabel')}</span>
              </label>
            </div>

            <Button type="submit" loading={saving}>
              {t('common.save')}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
