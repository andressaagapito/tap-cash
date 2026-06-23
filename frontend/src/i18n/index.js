import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ptBR from './locales/pt-BR.json';
import en from './locales/en.json';
import es from './locales/es.json';

const STORAGE_KEY = 'tapcash-lang';
const savedLanguage = localStorage.getItem(STORAGE_KEY) || 'pt-BR';

i18n.use(initReactI18next).init({
  resources: {
    'pt-BR': { translation: ptBR },
    en: { translation: en },
    es: { translation: es },
  },
  lng: savedLanguage,
  fallbackLng: 'pt-BR',
  interpolation: { escapeValue: false },
});

export function changeLanguage(lang) {
  localStorage.setItem(STORAGE_KEY, lang);
  document.documentElement.lang = lang;
  return i18n.changeLanguage(lang);
}

document.documentElement.lang = savedLanguage;

export default i18n;
