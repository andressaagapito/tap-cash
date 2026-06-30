import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Wallet, KeyRound, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { authApi } from '../api/auth';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import PreferencesBar from '../components/ui/PreferencesBar';
import { getErrorMessage } from '../utils/format';

export default function ForgotPassword() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState('validate'); // 'validate' | 'reset'
  const [email, setEmail] = useState('');
  const [recoveryToken, setRecoveryToken] = useState('');
  const [ticketError, setTicketError] = useState('');
  const [hasFailedValidation, setHasFailedValidation] = useState(false);

  // Schema for Phase 1 (Validate recovery phrase)
  const validateSchema = useMemo(
    () =>
      z.object({
        email: z.string().email(t('validation.invalidEmail')),
        recoveryPhrase: z.string().min(3, t('validation.requiredRecoveryPhrase')),
      }),
    [t]
  );

  // Schema for Phase 2 (Reset password)
  const resetSchema = useMemo(
    () =>
      z
        .object({
          password: z.string().min(8, t('errors.password_weak')),
          confirmPassword: z.string(),
        })
        .refine((data) => data.password === data.confirmPassword, {
          message: t('validation.passwordMismatch'),
          path: ['confirmPassword'],
        }),
    [t]
  );

  const {
    register: registerVal,
    handleSubmit: handleSubmitVal,
    formState: { errors: errorsVal },
  } = useForm({
    resolver: zodResolver(validateSchema),
    mode: 'onSubmit',
  });

  const {
    register: registerReset,
    handleSubmit: handleSubmitReset,
    formState: { errors: errorsReset },
  } = useForm({
    resolver: zodResolver(resetSchema),
    mode: 'onSubmit',
  });

  const onValidateSubmit = async (data) => {
    setLoading(true);
    setTicketError('');
    setHasFailedValidation(false);
    // Keep email stored for ticket if validation fails
    setEmail(data.email);
    try {
      const response = await authApi.forgotPasswordValidate({
        email: data.email,
        recovery_phrase: data.recoveryPhrase,
      });
      setRecoveryToken(response.data.recovery_token);
      setPhase('reset');
      toast.success(t('common.success', { defaultValue: 'Validação realizada!' }));
    } catch (error) {
      console.error('[forgot-password-validate] error:', error);
      const errMsg = getErrorMessage(error);
      setTicketError(errMsg);
      setHasFailedValidation(true);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleSendTicket = () => {
    if (!email) return;
    // Open fake ticket in another window/tab purely on the frontend
    window.open(`/password-reset-ticket?email=${encodeURIComponent(email)}`, '_blank');
    setHasFailedValidation(false);
    setTicketError('');
    toast.success(t('common.success', { defaultValue: 'Ticket enviado!' }));
  };

  const onResetSubmit = async (data) => {
    setLoading(true);
    try {
      await authApi.resetPassword({
        email,
        recovery_token: recoveryToken,
        new_password: data.password,
      });
      toast.success(t('auth.resetSuccess'));
      navigate('/login');
    } catch (error) {
      console.error('[forgot-password-reset] error:', error);
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
            {phase === 'validate' ? (
              <Wallet className="text-primary-600 dark:text-primary-400" size={28} />
            ) : (
              <KeyRound className="text-primary-600 dark:text-primary-400" size={28} />
            )}
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {phase === 'validate' ? t('auth.forgotPasswordTitle') : t('auth.newPasswordLabel')}
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {phase === 'validate' ? t('auth.forgotPasswordSubtitle') : t('auth.forgotPasswordSubtitle')}
          </p>
        </div>

        {phase === 'validate' ? (
          <form onSubmit={handleSubmitVal(onValidateSubmit)} className="space-y-4">
            <Input
              label={t('common.email')}
              type="email"
              placeholder={t('auth.emailPlaceholder')}
              error={errorsVal.email?.message}
              {...registerVal('email')}
            />
            <Input
              label={t('auth.recoveryPhrase')}
              type="password"
              placeholder={t('auth.recoveryPhrasePlaceholder')}
              error={errorsVal.recoveryPhrase?.message}
              {...registerVal('recoveryPhrase')}
            />

            {!hasFailedValidation ? (
              <Button type="submit" className="w-full" loading={loading}>
                {t('auth.validateButton')}
              </Button>
            ) : (
              <div className="space-y-2 pt-2">
                <Button type="submit" className="w-full" variant="ghost" loading={loading}>
                  {t('auth.validateButton')}
                </Button>
                <Button type="button" onClick={handleSendTicket} className="w-full">
                  {t('auth.openTicket')}
                </Button>
              </div>
            )}
          </form>
        ) : (
          <form onSubmit={handleSubmitReset(onResetSubmit)} className="space-y-4">
            <Input
              label={t('auth.newPasswordLabel')}
              type="password"
              placeholder="••••••••"
              error={errorsReset.password?.message}
              {...registerReset('password')}
            />
            <Input
              label={t('auth.confirmNewPasswordLabel')}
              type="password"
              placeholder="••••••••"
              error={errorsReset.confirmPassword?.message}
              {...registerReset('confirmPassword')}
            />
            <Button type="submit" className="w-full" loading={loading}>
              {t('auth.changePasswordButton')}
            </Button>
          </form>
        )}

        <div className="mt-6 flex justify-center">
          <Link to="/login" className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300">
            <ArrowLeft size={16} />
            {t('auth.signIn')}
          </Link>
        </div>
      </div>
    </div>
  );
}
