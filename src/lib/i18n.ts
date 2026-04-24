import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import trCommon from '../locales/tr/common.json';
import enCommon from '../locales/en/common.json';
import deCommon from '../locales/de/common.json';
import frCommon from '../locales/fr/common.json';
import arCommon from '../locales/ar/common.json';
import esCommon from '../locales/es/common.json';
import itCommon from '../locales/it/common.json';

const i18n = i18next.createInstance();

type ResourceModule = { default: Record<string, unknown> };

const sharedModules = import.meta.glob('../locales/**/*.json');
const featureModules = import.meta.glob('../features/**/localization/*.json');

type LoaderMap = Record<string, Record<string, () => Promise<ResourceModule>>>;
const loaders: LoaderMap = {};

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

function deepMergeResource(
  base: Record<string, unknown>,
  overlay: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...base };

  for (const key of Object.keys(overlay)) {
    const over = overlay[key];
    const prev = out[key];
    if (isPlainObject(over) && isPlainObject(prev)) {
      out[key] = deepMergeResource(prev, over);
    } else {
      out[key] = over;
    }
  }

  return out;
}

for (const [path, loader] of Object.entries(sharedModules)) {
  const match = path.match(/\.\.\/locales\/([a-z-]+)\/(.+)\.json$/);
  if (!match) continue;

  const lang = match[1];
  const ns = match[2];
  if (!loaders[lang]) loaders[lang] = {};
  loaders[lang][ns] = loader as () => Promise<ResourceModule>;
}

for (const [path, loader] of Object.entries(featureModules)) {
  const match = path.match(/\.\.\/features\/([^/]+)\/localization\/([a-z-]+)\.json$/);
  if (!match) continue;

  const ns = match[1];
  const lang = match[2];
  if (!loaders[lang]) loaders[lang] = {};

  const featureLoader = loader as () => Promise<ResourceModule>;
  const existing = loaders[lang][ns];
  if (existing) {
    const sharedLoader = existing;
    loaders[lang][ns] = async () => {
      const [sharedMod, featureMod] = await Promise.all([sharedLoader(), featureLoader()]);
      return {
        default: deepMergeResource(
          sharedMod.default as Record<string, unknown>,
          featureMod.default as Record<string, unknown>,
        ),
      };
    };
  } else {
    loaders[lang][ns] = featureLoader;
  }
}

const DEFAULT_LANGUAGE = 'tr';
const DEFAULT_NAMESPACE = 'translation';
const COMMON_NAMESPACE = 'common';
const STORAGE_KEY = 'i18nextLng';
const fallbackLng = DEFAULT_LANGUAGE;
const COMMON_RESOURCES = {
  tr: trCommon,
  en: enCommon,
  de: deCommon,
  fr: frCommon,
  ar: arCommon,
  es: esCommon,
  it: itCommon,
} as const;
const supportedLngs = Object.keys(COMMON_RESOURCES);
const PRELOADED_NAMESPACES = [DEFAULT_NAMESPACE, COMMON_NAMESPACE] as const;
const loadedBundlesByLanguage: Record<string, Record<string, Record<string, unknown>>> = {};

type SupportedLanguage = (typeof supportedLngs)[number];

const toCamelCase = (value: string): string =>
  value.replace(/-([a-z])/g, (_, char: string) => char.toUpperCase());

function formatMissingKey(): string {
  return 'Çeviri eksik';
}

function withNamespaceCompatibility(
  ns: string,
  bundle: Record<string, unknown>,
): Record<string, unknown> {
  const camelNs = toCamelCase(ns);
  const nsScopedBundle =
    typeof bundle[ns] === 'object' && bundle[ns] !== null
      ? (bundle[ns] as Record<string, unknown>)
      : bundle;
  const camelScopedBundle =
    typeof bundle[camelNs] === 'object' && bundle[camelNs] !== null
      ? (bundle[camelNs] as Record<string, unknown>)
      : nsScopedBundle;

  return {
    ...nsScopedBundle,
    ...bundle,
    [ns]: nsScopedBundle,
    [camelNs]: camelScopedBundle,
  };
}

export function normalizeLanguage(language: string | null | undefined): SupportedLanguage {
  if (!language) {
    return DEFAULT_LANGUAGE;
  }

  const lower = language.toLowerCase();
  const mapped = lower === 'sa' ? 'ar' : lower;
  if (supportedLngs.includes(mapped)) {
    return mapped;
  }

  const base = mapped.split('-')[0];
  if (supportedLngs.includes(base)) {
    return base;
  }

  return DEFAULT_LANGUAGE;
}

export const SUPPORTED_LANGUAGES = supportedLngs as SupportedLanguage[];

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

const initialLng = getInitialLanguage();

function rebuildLanguageResources(lang: string): void {
  const bundlesForLanguage = loadedBundlesByLanguage[lang] ?? {};
  const scopedBundleByNs: Record<string, Record<string, unknown>> = {};

  for (const [ns, bundle] of Object.entries(bundlesForLanguage)) {
    const scoped =
      typeof bundle[ns] === 'object' && bundle[ns] !== null
        ? (bundle[ns] as Record<string, unknown>)
        : bundle;
    scopedBundleByNs[ns] = scoped;
  }

  for (const [ns, bundle] of Object.entries(bundlesForLanguage)) {
    const compatibilityBundle = withNamespaceCompatibility(ns, bundle);

    for (const [otherNs, scopedBundle] of Object.entries(scopedBundleByNs)) {
      if (otherNs === ns) continue;
      compatibilityBundle[otherNs] = scopedBundle;
      compatibilityBundle[toCamelCase(otherNs)] = scopedBundle;
    }

    i18n.addResourceBundle(lang, ns, compatibilityBundle, true, true);
  }
}

async function loadNamespace(lang: string, ns: string): Promise<void> {
  const target = normalizeLanguage(lang);
  const langLoaders = loaders[target] || {};
  const loader = langLoaders[ns];
  if (!loader) {
    return;
  }

  if (!loadedBundlesByLanguage[target]) {
    loadedBundlesByLanguage[target] = {};
  }

  if (loadedBundlesByLanguage[target][ns]) {
    return;
  }

  const mod = await loader();
  loadedBundlesByLanguage[target][ns] = mod.default;
  rebuildLanguageResources(target);
}

export async function ensureNamespaces(
  namespaces: readonly string[] | string[],
  language?: string,
): Promise<void> {
  const target = normalizeLanguage(language ?? i18n.resolvedLanguage ?? i18n.language ?? fallbackLng);
  const uniqueNamespaces = [...new Set(namespaces.map((ns) => ns.trim()).filter(Boolean))];

  for (const ns of uniqueNamespaces) {
    await loadNamespace(target, ns);
  }

  if (target !== fallbackLng) {
    for (const ns of uniqueNamespaces) {
      await loadNamespace(fallbackLng, ns);
    }
  }
}

export async function loadLanguage(language: string): Promise<void> {
  await ensureNamespaces(PRELOADED_NAMESPACES, language);
}

const initPromise = (async () => {
  const namespaces = Object.keys(loaders[fallbackLng] || {});
  const defaultNS = namespaces.includes(COMMON_NAMESPACE)
    ? COMMON_NAMESPACE
    : namespaces[0] ?? DEFAULT_NAMESPACE;

  await i18n.use(initReactI18next).init({
    resources: Object.fromEntries(
      Object.entries(COMMON_RESOURCES).map(([language, common]) => [
        language,
        {
          [DEFAULT_NAMESPACE]: common,
          [COMMON_NAMESPACE]: common,
        },
      ]),
    ),
    lng: initialLng,
    fallbackLng,
    supportedLngs,
    load: 'languageOnly',
    nonExplicitSupportedLngs: true,
    ns: namespaces.length > 0 ? namespaces : [defaultNS],
    defaultNS,
    interpolation: { escapeValue: false },
    parseMissingKeyHandler: () => formatMissingKey(),
    returnEmptyString: false,
    detection: {
      order: [],
      caches: [],
    },
  });

  await ensureNamespaces(PRELOADED_NAMESPACES, fallbackLng);
  if (initialLng !== fallbackLng) {
    await ensureNamespaces(PRELOADED_NAMESPACES, initialLng);
  }
})();

i18n.on('languageChanged', async (language) => {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, normalizeLanguage(language));
  }

  await ensureNamespaces(PRELOADED_NAMESPACES, language);
});

export async function ensureI18nReady(): Promise<void> {
  await initPromise;
}

export async function setAppLanguage(language: string): Promise<void> {
  const normalizedLanguage = normalizeLanguage(language);

  await loadLanguage(normalizedLanguage);

  if (i18n.language !== normalizedLanguage || i18n.resolvedLanguage !== normalizedLanguage) {
    await i18n.changeLanguage(normalizedLanguage);
  }

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, normalizedLanguage);
  }
}

export { COMMON_NAMESPACE, DEFAULT_NAMESPACE, PRELOADED_NAMESPACES };
export default i18n;
