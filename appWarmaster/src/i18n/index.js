import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import esCommon from './locales/es/common.json';
import enCommon from './locales/en/common.json';

i18n
  .use(LanguageDetector)        // detecta idioma del navegador
  .use(initReactI18next)
  .init({
    fallbackLng: 'es',          // si falla, español
    defaultNS: 'common',
    resources: {
      es: { common: esCommon },
      en: { common: enCommon }
    },
    interpolation: {
      escapeValue: false        // React ya escapa
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']  // recuerda la elección
    }
  });

export default i18n;