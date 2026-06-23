import { useTranslation } from 'react-i18next';

export default function Loading({ message }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600 dark:border-primary-900 dark:border-t-primary-400" />
      <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">{message || t('common.loading')}</p>
    </div>
  );
}
