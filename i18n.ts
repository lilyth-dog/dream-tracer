import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';

const supportedLngs = ['ko', 'en', 'ja', 'zh'];

i18n
  .use(Backend)
  .use(initReactI18next)
  .init({
    fallbackLng: 'ko',
    supportedLngs,
    lng: 'ko',
    debug: process.env.NODE_ENV === 'development',
    backend: {
      loadPath: '/locales/{{lng}}/common.json',
    },
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
