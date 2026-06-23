import { useMemo, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
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
import { resolveApiBaseUrl } from '../utils/apiUrl';
import { getErrorMessage } from '../utils/format';

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [loading, setLoading] = useState(false);

  const schema = useMemo(
    () =>
      z.object({
        email: z.string().email(t('validation.invalidEmail')),
        password: z.string().min(6, t('validation.passwordMin')),
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
    const apiUrl = resolveApiBaseUrl();
    console.log('[login] URL chamada:', `${apiUrl}/auth/login`);

    try {
      const response = await authApi.login(data);
      console.log('[login] status:', response.status);
      console.log('[login] response.data:', response.data);

      const { access_token: accessToken, user } = response.data;

      if (!accessToken) {
        throw new Error('access_token ausente na resposta do login');
      }

      setAuth(accessToken, user);

      const saved = useAuthStore.getState();
      console.log('[login] token salvo no store:', saved.token ? 'sim' : 'não');
      console.log('[login] usuário salvo no store:', saved.user);

      toast.success(t('auth.loginSuccess'));

      const redirectTo = location.state?.from?.pathname || '/dashboard';
      navigate(redirectTo, { replace: true });
    } catch (error) {
      console.error('[login] erro:', error);
      console.error('[login] status erro:', error?.response?.status);
      console.error('[login] data erro:', error?.response?.data);

      if (!error?.response) {
        toast.error(
          t('auth.networkError', {
            defaultValue:
              'Não foi possível conectar à API. Verifique VITE_API_URL e o CORS do backend.',
          })
        );
      } else {
        toast.error(getErrorMessage(error));
      }
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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t('app.name')}</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{t('app.tagline')}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
          <Button type="submit" className="w-full" loading={loading}>
            {t('auth.login')}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
          {t('auth.noAccount')}{' '}
          <Link to="/register" className="font-medium text-primary-600 hover:text-primary-700">
            {t('auth.signUp')}
          </Link>
        </p>
      </div>
    </div>
  );
}
