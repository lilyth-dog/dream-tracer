"use client";
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';

const supportedLngs = ['ko', 'en', 'ja', 'zh'];
const detectInitialLanguage = () => {
  if (typeof window === 'undefined') return 'ko'
  try {
    const stored = localStorage.getItem('lang')
    if (stored && supportedLngs.includes(stored)) return stored
    const nav = navigator.language?.slice(0, 2)
    if (nav && supportedLngs.includes(nav)) return nav
  } catch {}
  return 'ko'
}
const initialLng = detectInitialLanguage()

i18n
  .use(Backend)
              .use(initReactI18next)
              .init({
                fallbackLng: 'ko',
                supportedLngs,
                lng: initialLng,
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

// 언어 변경 시 localStorage 동기화
try {
  i18n.on('languageChanged', (lng) => {
    try { localStorage.setItem('lang', lng); } catch {}
  })
} catch {}

export default i18n;


