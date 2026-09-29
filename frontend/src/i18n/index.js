import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import az from './locales/az.json';
import en from './locales/en.json';
import ru from './locales/ru.json';

export const LANGUAGES = [
  { code: 'az', label: 'AZE', name: 'Azərbaycan' },
  { code: 'en', label: 'ENG', name: 'English' },
  { code: 'ru', label: 'RU', name: 'Русский' },
];

const STORAGE_KEY = 'cosmecos-lang';
const DEFAULT_LANGUAGE = 'en';
const isSupported = (code) => LANGUAGES.some((l) => l.code === code);

/** Saved choice first, then the browser language, then English. */
function initialLanguage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (isSupported(saved)) return saved;
  } catch {
    // Storage can be blocked (private mode); fall through.
  }
  const browser = typeof navigator !== 'undefined' ? navigator.language?.slice(0, 2) : '';
  return isSupported(browser) ? browser : DEFAULT_LANGUAGE;
}

i18n.use(initReactI18next).init({
  resources: { az: { translation: az }, en: { translation: en }, ru: { translation: ru } },
  lng: initialLanguage(),
  fallbackLng: DEFAULT_LANGUAGE,
  supportedLngs: LANGUAGES.map((l) => l.code),
  // React already escapes rendered strings.
  interpolation: { escapeValue: false },
  // Server messages may contain ":"; never treat it as a namespace separator.
  nsSeparator: false,
  returnNull: false,
});

const syncDocument = (lng) => {
  if (typeof document !== 'undefined') document.documentElement.lang = lng;
};
syncDocument(i18n.language);

i18n.on('languageChanged', (lng) => {
  syncDocument(lng);
  try {
    localStorage.setItem(STORAGE_KEY, lng);
  } catch {
    // Ignore: the choice just won't survive a reload.
  }
});

/** Localised message for an API error: known error codes are translated, anything else falls back to the server text. */
export function errorMessage(err) {
  if (!err) return '';
  if (err.status === 0) return i18n.t('errors.network');
  const key = err.code && `errors.${err.code}`;
  if (key && i18n.exists(key)) {
    const text = i18n.t(key);
    const left = err.data?.attemptsLeft;
    return typeof left === 'number' && left > 0 ? `${text} ${i18n.t('otp.attemptsLeft', { count: left })}` : text;
  }
  return err.message;
}

export default i18n;
