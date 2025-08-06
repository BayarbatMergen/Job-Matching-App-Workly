// src/i18n/index.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { translations } from './translations';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LANGUAGE_KEY = 'appLanguage';

export const setAppLanguage = async (lang) => {
  try {
    await AsyncStorage.setItem(LANGUAGE_KEY, lang);
    if (i18n.language !== lang) {
      console.log(`🌐 언어 변경: ${i18n.language} → ${lang}`);
      await i18n.changeLanguage(lang);
    }
  } catch (error) {
    console.error('❌ 언어 저장 오류:', error);
  }
};

export const initI18n = async () => {
  try {
    const storedLang = await AsyncStorage.getItem(LANGUAGE_KEY);
    console.log('🌐 저장된 언어:', storedLang);
    const lng = storedLang || 'ko';

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

    console.log('✅ i18n 초기화 완료. 현재 언어:', i18n.language);
  } catch (error) {
    console.error('❌ i18n 초기화 실패:', error);
  }
};

export default i18n;
