import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Wallet } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { authApi } from '../api/auth';
import { useAuthStore } from '../store/authStore';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import PreferencesBar from '../components/ui/PreferencesBar';
import { getErrorMessage } from '../utils/format';

export default function Register() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [loading, setLoading] = useState(false);

  const schema = useMemo(
    () =>
      z
        .object({
          name: z.string().min(2, t('validation.nameMin')),
          email: z.string().email(t('validation.invalidEmail')),
          password: z.string().min(6, t('validation.passwordMin')),
          confirmPassword: z.string(),
        })
        .refine((data) => data.password === data.confirmPassword, {
          message: t('validation.passwordMismatch'),
          path: ['confirmPassword'],
        }),
    [t]
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const { data: res } = await authApi.register({
        name: data.name,
        email: data.email,
        password: data.password,
      });
      setAuth(res.access_token, res.user);
      toast.success(t('auth.registerSuccess'));
      navigate('/dashboard');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-primary-900 to-slate-900 p-4">
      <div className="absolute right-4 top-4">
        <PreferencesBar variant="onDark" />
      </div>
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl dark:bg-slate-900 dark:shadow-slate-950/50">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-900/40">
            <Wallet className="text-primary-600 dark:text-primary-400" size={28} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t('auth.createAccount')}</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{t('auth.startManaging')}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label={t('common.name')}
            placeholder={t('auth.namePlaceholder')}
            error={errors.name?.message}
            {...register('name')}
          />
          <Input
            label={t('common.email')}
            type="email"
            placeholder={t('auth.emailPlaceholder')}
            error={errors.email?.message}
            {...register('email')}
          />
          <Input
            label={t('common.password')}
            type="password"
            placeholder="••••••"
            error={errors.password?.message}
            {...register('password')}
          />
          <Input
            label={t('auth.confirmPassword')}
            type="password"
            placeholder="••••••"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />
          <Button type="submit" className="w-full" loading={loading}>
            {t('auth.register')}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
          {t('auth.hasAccount')}{' '}
          <Link to="/login" className="font-medium text-primary-600 hover:text-primary-700">
            {t('auth.signIn')}
          </Link>
        </p>
      </div>
    </div>
  );
}
