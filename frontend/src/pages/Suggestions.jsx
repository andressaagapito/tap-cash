import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Lightbulb, Target, TrendingDown, Zap, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { suggestionsApi } from '../api/suggestions';
import Card from '../components/ui/Card';
import Loading from '../components/ui/Loading';
import EmptyState from '../components/ui/EmptyState';
import { formatCurrency, getErrorMessage } from '../utils/format';

const strategyConfig = {
  lowest_amount: { icon: Target, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-300' },
  highest_installment: { icon: TrendingDown, color: 'text-orange-600 bg-orange-50 dark:bg-orange-900/30 dark:text-orange-300' },
  almost_done: { icon: Clock, color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/30 dark:text-purple-300' },
  best_impact: { icon: Zap, color: 'text-green-600 bg-green-50 dark:bg-green-900/30 dark:text-green-300' },
  active_debt: { icon: Lightbulb, color: 'text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-300' },
};

export default function Suggestions() {
  const { t } = useTranslation();
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSuggestions();
  }, []);

  const loadSuggestions = async () => {
    try {
      const { data } = await suggestionsApi.payoff();
      setSuggestions(data);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const getReason = (suggestion) => {
    if (suggestion.strategy === 'almost_done') {
      return t('suggestions.reasons.almost_done', { count: suggestion.pending_installments });
    }
    if (suggestion.strategy === 'best_impact') {
      return t('suggestions.reasons.best_impact', {
        amount: formatCurrency(suggestion.monthly_impact),
      });
    }
    if (suggestion.strategy === 'active_debt') {
      return t('suggestions.reasons.active_debt');
    }
    return t(`suggestions.reasons.${suggestion.strategy}`);
  };

  if (loading) return <Loading />;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t('suggestions.title')}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">{t('suggestions.subtitle')}</p>
      </div>

      {suggestions.length === 0 ? (
        <EmptyState
          icon={Lightbulb}
          title={t('suggestions.emptyTitle')}
          description={t('suggestions.emptyDescription')}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {suggestions.map((s) => {
            const config = strategyConfig[s.strategy] || strategyConfig.active_debt;
            const Icon = config.icon;
            return (
              <Card key={`${s.expense_id}-${s.strategy}`}>
                <div className="flex items-start gap-4">
                  <div className={`rounded-lg p-3 ${config.color}`}>
                    <Icon size={24} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100">{s.name}</h3>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {t(`expenses.paymentMethods.${s.payment_method}`)}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {t(`suggestions.strategies.${s.strategy}`, { defaultValue: s.strategy })}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{getReason(s)}</p>
                    <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <p className="text-slate-400 dark:text-slate-500">{t('suggestions.remaining')}</p>
                        <p className="font-medium">{formatCurrency(s.remaining_amount)}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 dark:text-slate-500">{t('suggestions.pending')}</p>
                        <p className="font-medium">
                          {s.pending_installments || t('common.infinity')}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-400 dark:text-slate-500">{t('suggestions.monthlyImpact')}</p>
                        <p className="font-medium text-green-600">
                          +{formatCurrency(s.monthly_impact)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
