import i18n from '../i18n';

export const CATEGORY_KEYS = [
  'food', 'housing', 'transport', 'health', 'education',
  'leisure', 'clothing', 'subscriptions', 'other',
];

function getIntlLocale() {
  const lang = i18n.language || 'pt-BR';
  if (lang === 'en') return 'en-US';
  if (lang === 'es') return 'es-ES';
  return 'pt-BR';
}

export function formatCurrency(value) {
  const num = Number(value) || 0;
  return new Intl.NumberFormat(getIntlLocale(), {
    style: 'currency',
    currency: 'BRL',
  }).format(num);
}

export function formatMoneyInput(value) {
  if (value === '' || value === null || value === undefined) return '';
  const num = typeof value === 'number' ? value : parseFloat(parseMoneyInput(String(value)));
  if (Number.isNaN(num)) return '';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(num);
}

export function parseMoneyInput(value) {
  if (!value?.toString().trim()) return '';
  let normalized = value.toString().replace(/[^\d,.-]/g, '');
  if (normalized.includes(',')) {
    normalized = normalized.replace(/\./g, '').replace(',', '.');
  }
  const num = parseFloat(normalized);
  if (Number.isNaN(num)) return '';
  return num.toFixed(2);
}

export function parseMoneyNumber(value) {
  const parsed = parseMoneyInput(value);
  if (!parsed) return NaN;
  return parseFloat(parsed);
}

export function formatDate(dateStr) {
  if (!dateStr) return '-';
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString(getIntlLocale());
}

export function getMonthName(monthNumber) {
  const date = new Date(2024, monthNumber - 1, 1);
  return date.toLocaleDateString(getIntlLocale(), { month: 'long' });
}

export function hasInstallmentBreakdown(paymentMethod) {
  return paymentMethod === 'credit_card';
}

export function isKnownCategory(category) {
  return CATEGORY_KEYS.includes(category);
}

export function resolveCategoryForSubmit(category, customCategory) {
  if (category === 'other') {
    return customCategory?.trim() || '';
  }
  return category;
}

export function splitCategoryForForm(category, customCategoryNames = []) {
  if (!category || isKnownCategory(category)) {
    return { category: category || '', custom_category: '' };
  }
  const isSavedCustom = customCategoryNames.some(
    (name) => name.toLowerCase() === category.toLowerCase()
  );
  if (isSavedCustom) {
    return { category, custom_category: '' };
  }
  return { category: 'other', custom_category: category };
}

export function translateCategory(t, category) {
  if (!category) return '-';
  const key = `categories.${category}`;
  const translated = t(key, { defaultValue: '' });
  return translated || category;
}

export function getErrorMessage(error) {
  const data = error?.response?.data;
  const detailKey = data?.detail_key;
  const detail = data?.detail;

  if (detailKey?.startsWith('errors.')) {
    return i18n.t(detailKey, { defaultValue: detail });
  }
  if (typeof detail === 'string' && detail.startsWith('errors.')) {
    return i18n.t(detail, { defaultValue: detail });
  }
  if (Array.isArray(detail)) {
    return detail.map((d) => d.msg).join(', ');
  }
  if (typeof detail === 'string') {
    return detail;
  }
  return i18n.t('common.genericError');
}
