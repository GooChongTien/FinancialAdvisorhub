import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslations from './locales/en/translation.json';
import zhTranslations from './locales/zh/translation.json';
import msTranslations from './locales/ms/translation.json';
import taTranslations from './locales/ta/translation.json';
import hiTranslations from './locales/hi/translation.json';
import esTranslations from './locales/es/translation.json';

const resources = {
  en: { translation: enTranslations },
  zh: { translation: zhTranslations },
  ms: { translation: msTranslations },
  ta: { translation: taTranslations },
  hi: { translation: hiTranslations },
  es: { translation: esTranslations },
};

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
];

const LANGUAGE_CODES = SUPPORTED_LANGUAGES.map((language) => language.code);

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: LANGUAGE_CODES,
    debug: import.meta.env.DEV,
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
    interpolation: {
      escapeValue: false,
    },
    ns: ['translation'],
    defaultNS: 'translation',
    react: {
      useSuspense: true,
    },
  });

export default i18n;

