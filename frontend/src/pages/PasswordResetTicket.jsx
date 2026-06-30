import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import PreferencesBar from '../components/ui/PreferencesBar';
import Button from '../components/ui/Button';

export default function PasswordResetTicket() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || 'usuario@email.com';

  const ticketData = useMemo(() => {
    const now = new Date();
    // YYYYMMDD format
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const datePart = `${year}${month}${day}`;
    // Random 4-digit number
    const randPart = Math.floor(1000 + Math.random() * 9000);
    const protocol = `TCK-${datePart}-${randPart}`;

    // Format local datetime: YYYY-MM-DD HH:MM:SS
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const datetime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

    return {
      protocol,
      datetime,
      recipient: 'new-password@tapcash.com',
      email,
    };
  }, [email]);

  const handleClose = () => {
    window.close();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-primary-900 to-slate-900 p-4">
      <div className="absolute right-4 top-4">
        <PreferencesBar variant="onDark" />
      </div>
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl dark:bg-slate-900 dark:shadow-slate-950/50">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/40">
            <CheckCircle2 className="text-emerald-600 dark:text-emerald-400" size={28} />
          </div>

          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {t('auth.ticketTitle')}
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {t('auth.ticketMessage')}
          </p>

          <div className="my-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-left text-sm dark:border-slate-800 dark:bg-slate-900/50">
            <div className="space-y-3">
              <div className="flex justify-between border-b border-slate-200/60 pb-2 dark:border-slate-800/60">
                <span className="font-medium text-slate-500 dark:text-slate-400">{t('auth.ticketRecipient')}</span>
                <span className="text-slate-800 dark:text-slate-200">{ticketData.recipient}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-2 dark:border-slate-800/60">
                <span className="font-medium text-slate-500 dark:text-slate-400">{t('common.email')}</span>
                <span className="text-slate-800 dark:text-slate-200">{ticketData.email}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-2 dark:border-slate-800/60">
                <span className="font-medium text-slate-500 dark:text-slate-400">{t('auth.ticketProtocol')}</span>
                <span className="font-mono font-bold text-primary-600 dark:text-primary-400">{ticketData.protocol}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-2 dark:border-slate-800/60">
                <span className="font-medium text-slate-500 dark:text-slate-400">{t('auth.ticketDate')}</span>
                <span className="text-slate-800 dark:text-slate-200">{ticketData.datetime}</span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="font-medium text-slate-500 dark:text-slate-400">{t('auth.ticketStatus')}</span>
                <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-700/10 dark:bg-blue-900/40 dark:text-blue-300 dark:ring-blue-500/20">
                  {t('auth.ticketOpen')}
                </span>
              </div>
            </div>
          </div>

          <Button onClick={handleClose} className="w-full flex items-center justify-center gap-2">
            <X size={16} />
            {t('auth.closeWindow', { defaultValue: 'Fechar janela' })}
          </Button>
        </div>
      </div>
    </div>
  );
}
