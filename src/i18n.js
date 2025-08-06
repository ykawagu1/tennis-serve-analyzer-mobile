import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

import en from './locales/en/translation.json';
import es from './locales/es/translation.json';
import pt from './locales/pt/translation.json';
import fr from './locales/fr/translation.json';
import de from './locales/de/translation.json';
import ja from './locales/ja/translation.json';

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
      
      en: { translation: en },
      es: { translation: es },
      pt: { translation: pt },
      fr: { translation: fr },
      de: { translation: de },
      ja: { translation: ja }
    },
    lng: deviceLocale.startsWith('ja') ? 'ja' : 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;