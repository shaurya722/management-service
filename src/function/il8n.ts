import { typeJson } from '@/constant/json';
import i18next from 'i18next';
import FsBackend from 'i18next-fs-backend';
import i18nextMiddleware from 'i18next-http-middleware';
import path from 'path';

i18next
  .use(FsBackend) // Use filesystem backend to load translation files
  .use(i18nextMiddleware.LanguageDetector) // Automatically detect the user's language
  .init({
    fallbackLng: 'en', // Fallback language if a translation is missing
    preload: [...Object.values(typeJson.language)], // Preload supported languages
    ns: ['common'], // Namespace for translations
    defaultNS: 'common',
    backend: {
      loadPath: path.join(__dirname, '../locale/{{lng}}.json'), // Path to translations
    },
    detection: {
      order: ['header'], // Look for the language in the Accept-Language header
      lookupHeader: 'accept-language', // Look specifically for the `accept-language` header
      caches: ['cookie'], // Optionally store language in cookie
    },
  });

export default i18next;
