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

export const SUPPORTED_LANGUAGES = Object.keys(COMMON_RESOURCES) as SupportedLanguage[];

export function normalizeLanguage(language: string | null | undefined): SupportedLanguage {
  const normalized = language?.split('-')[0]?.toLowerCase();
  if (normalized && normalized in COMMON_RESOURCES) {
    return normalized as SupportedLanguage;
  }
  return DEFAULT_LANGUAGE;
}

function getInitialLanguage(): SupportedLanguage {
  if (typeof window === 'undefined') {
    return DEFAULT_LANGUAGE;
  }

  const persisted = window.localStorage.getItem(STORAGE_KEY);
  const normalizedPersisted = normalizeLanguage(persisted);

  if (persisted && normalizedPersisted !== persisted) {
    window.localStorage.setItem(STORAGE_KEY, normalizedPersisted);
  }

  if (persisted) {
    return normalizedPersisted;
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
  language?: string,
): Promise<void> {
  const resolvedLanguage = normalizeLanguage(language ?? i18n.resolvedLanguage ?? i18n.language ?? DEFAULT_LANGUAGE);
  const filteredNamespaces = Array.from(new Set(namespaces.filter(Boolean)));
  const missingNamespaces = filteredNamespaces.filter((namespace) => !i18n.hasResourceBundle(resolvedLanguage, namespace));

  if (missingNamespaces.length === 0) {
    return;
  }

  await Promise.all(
    missingNamespaces.map(async (namespace) => {
      const resource = await loadLocaleNamespace(resolvedLanguage, namespace);
      i18n.addResourceBundle(resolvedLanguage, namespace, resource, true, true);
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
    window.localStorage.setItem(STORAGE_KEY, normalizeLanguage(language));
  }
});

export async function setAppLanguage(language: string): Promise<void> {
  const normalizedLanguage = normalizeLanguage(language);

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, normalizedLanguage);
  }

  if (i18n.language !== normalizedLanguage && i18n.resolvedLanguage !== normalizedLanguage) {
    await i18n.changeLanguage(normalizedLanguage);
  }
}

export { COMMON_NAMESPACE, DEFAULT_NAMESPACE, PRELOADED_NAMESPACES };
export default i18n;
