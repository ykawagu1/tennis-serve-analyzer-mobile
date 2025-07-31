import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import ja from './locales/ja/translation.json';
import en from './locales/en/translation.json';

const deviceLocale = typeof Localization.locale === 'string' ? Localization.locale : 'en';

// ←★ここから追記
console.log('★ expo-localization:', Localization);
console.log('★ Localization.locale:', Localization.locale);
console.log('★ deviceLocale:', deviceLocale);
// ←★ここまで追記

i18n
  .use(initReactI18next)
  .init({
    resources: {
      ja: { translation: ja },
      en: { translation: en }
    },
    lng: deviceLocale.startsWith('ja') ? 'ja' : 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;