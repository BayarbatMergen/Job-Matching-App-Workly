// src/i18n/i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { translations } from './translations';

i18n
  .use(initReactI18next) // ⬅️ 중요! 이게 있어야 useTranslation() 작동
  .init({
    compatibilityJSON: 'v3',
    lng: 'ko', // 초기 언어
    fallbackLng: 'ko',
    resources: {
      ko: { translation: translations.ko },
      mn: { translation: translations.mn },
      en: { translation: translations.en },
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
