// src/i18n/index.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { translations } from './translations';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LANGUAGE_KEY = 'appLanguage';

export const setAppLanguage = async (lang) => {
  await AsyncStorage.setItem(LANGUAGE_KEY, lang);
  i18n.changeLanguage(lang);
};

export const initI18n = async () => {
  const storedLang = await AsyncStorage.getItem(LANGUAGE_KEY);
  const lng = storedLang || 'ko'; // 없으면 기본은 한국어

  await i18n
    .use(initReactI18next)
    .init({
      compatibilityJSON: 'v3',
      lng,
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
};

export default i18n;
