import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enCommon from '../locales/en/common.json';

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'zh-CN', name: 'Simplified Chinese', nativeName: '简体中文' },
] as const;

export type SupportedLocale = (typeof SUPPORTED_LANGUAGES)[number]['code'];

// Lazy bundle loader mapping
const localeLoaders: Record<string, () => Promise<{ default: Record<string, unknown> }>> = {
  id: () => import('../locales/id/common.json'),
  es: () => import('../locales/es/common.json'),
  fr: () => import('../locales/fr/common.json'),
  de: () => import('../locales/de/common.json'),
  pt: () => import('../locales/pt/common.json'),
  ja: () => import('../locales/ja/common.json'),
  ko: () => import('../locales/ko/common.json'),
  'zh-CN': () => import('../locales/zh-CN/common.json'),
};

const getInitialLanguage = (): string => {
  if (typeof window === 'undefined') return 'en';
  const saved = localStorage.getItem('stack_language');
  if (saved && SUPPORTED_LANGUAGES.some((l) => l.code === saved)) {
    return saved;
  }
  return 'en';
};

// Initialize i18n with default 'en' synchronously so there's zero flash
if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    lng: getInitialLanguage(),
    fallbackLng: 'en',
    defaultNS: 'common',
    resources: {
      en: {
        common: enCommon,
      },
    },
    interpolation: {
      escapeValue: false,
    },
  });

  // If initial language is not 'en', load bundle lazily
  const currentLng = getInitialLanguage();
  if (currentLng !== 'en' && localeLoaders[currentLng]) {
    localeLoaders[currentLng]().then((bundle) => {
      i18n.addResourceBundle(currentLng, 'common', bundle.default, true, true);
      i18n.changeLanguage(currentLng);
    });
  }
}

/**
 * Change language and lazy-load bundle if not loaded yet
 */
export async function changeAppLanguage(lang: SupportedLocale): Promise<void> {
  if (lang !== 'en' && !i18n.hasResourceBundle(lang, 'common') && localeLoaders[lang]) {
    const bundle = await localeLoaders[lang]();
    i18n.addResourceBundle(lang, 'common', bundle.default, true, true);
  }
  await i18n.changeLanguage(lang);
  if (typeof window !== 'undefined') {
    localStorage.setItem('stack_language', lang);
  }
}

export default i18n;
