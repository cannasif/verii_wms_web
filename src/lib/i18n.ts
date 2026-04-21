import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import trCommon from '../locales/tr/common.json';
import enCommon from '../locales/en/common.json';
import deCommon from '../locales/de/common.json';
import frCommon from '../locales/fr/common.json';
import arCommon from '../locales/ar/common.json';
import esCommon from '../locales/es/common.json';
import itCommon from '../locales/it/common.json';

const DEFAULT_LANGUAGE = 'tr';
const DEFAULT_NAMESPACE = 'translation';
const COMMON_NAMESPACE = 'common';
const PRELOADED_NAMESPACES = [DEFAULT_NAMESPACE, COMMON_NAMESPACE];
const STORAGE_KEY = 'i18nextLng';

const localeModules = {
  ...import.meta.glob('../locales/*/access-control.json'),
  ...import.meta.glob('../locales/*/user-management.json'),
  ...import.meta.glob('../locales/*/mail-settings.json'),
  ...import.meta.glob('../locales/*/hangfire-monitoring.json'),
};

const COMMON_RESOURCES = {
  tr: trCommon,
  en: enCommon,
  de: deCommon,
  fr: frCommon,
  ar: arCommon,
  es: esCommon,
  it: itCommon,
} as const;

type SupportedLanguage = keyof typeof COMMON_RESOURCES;

function getInitialLanguage(): SupportedLanguage {
  if (typeof window === 'undefined') {
    return DEFAULT_LANGUAGE;
  }

  const persisted = window.localStorage.getItem(STORAGE_KEY);
  if (persisted && persisted in COMMON_RESOURCES) {
    return persisted as SupportedLanguage;
  }

  return DEFAULT_LANGUAGE;
}

function getLocaleModulePath(language: string, namespace: string): string {
  return `../locales/${language}/${namespace}.json`;
}

async function loadLocaleNamespace(language: string, namespace: string): Promise<Record<string, unknown>> {
  const directKey = getLocaleModulePath(language, namespace);
  const fallbackKey = getLocaleModulePath(DEFAULT_LANGUAGE, namespace);
  const loader = localeModules[directKey] ?? localeModules[fallbackKey];

  if (!loader) {
    return {};
  }

  const loaded = await loader();
  return (loaded as { default?: Record<string, unknown> }).default ?? {};
}

export async function ensureNamespaces(
  namespaces: string[] | readonly string[],
  language = i18n.resolvedLanguage ?? i18n.language ?? DEFAULT_LANGUAGE,
): Promise<void> {
  const filteredNamespaces = Array.from(new Set(namespaces.filter(Boolean)));
  const missingNamespaces = filteredNamespaces.filter((namespace) => !i18n.hasResourceBundle(language, namespace));

  if (missingNamespaces.length === 0) {
    return;
  }

  await Promise.all(
    missingNamespaces.map(async (namespace) => {
      const resource = await loadLocaleNamespace(language, namespace);
      i18n.addResourceBundle(language, namespace, resource, true, true);
    }),
  );
}

i18n
  .use(initReactI18next)
  .init({
    resources: Object.fromEntries(
      Object.entries(COMMON_RESOURCES).map(([language, common]) => [
        language,
        {
          [DEFAULT_NAMESPACE]: common,
          [COMMON_NAMESPACE]: common,
        },
      ]),
    ),
    ns: PRELOADED_NAMESPACES,
    defaultNS: DEFAULT_NAMESPACE,
    lng: getInitialLanguage(),
    fallbackLng: DEFAULT_LANGUAGE,
    interpolation: {
      escapeValue: false,
    },
  });

i18n.on('languageChanged', (language) => {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, language);
  }
});

export { COMMON_NAMESPACE, DEFAULT_NAMESPACE, PRELOADED_NAMESPACES };
export default i18n;
