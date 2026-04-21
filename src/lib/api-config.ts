export const DEFAULT_API_BASE_URL = 'https://api.v3rii.com';
const RUNTIME_CONFIG_CACHE_KEY = 'wms-runtime-config:v1';
const SHOULD_FETCH_RUNTIME_CONFIG = import.meta.env.PROD || import.meta.env.VITE_ENABLE_RUNTIME_CONFIG_IN_DEV === 'true';

interface RuntimeConfig {
  apiUrl?: string;
  baseUrl?: string;
}

interface ResolvedRuntimeConfig {
  apiUrl: string;
  baseUrl: string;
}

function isValidApiUrl(value: string | undefined | null): boolean {
  if (!value || typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  try {
    const u = new URL(trimmed);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

function normalizeBaseUrl(url: string): string {
  return url.trim().replace(/\/$/, '');
}

function normalizeAppBasePath(value: string | undefined | null): string {
  if (!value || typeof value !== 'string') {
    return '/';
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return '/';
  }

  try {
    if (/^https?:\/\//i.test(trimmed)) {
      const url = new URL(trimmed);
      const normalizedPath = url.pathname.trim();
      if (!normalizedPath || normalizedPath === '/') {
        return '/';
      }

      return `/${normalizedPath.replace(/^\/+|\/+$/g, '')}`;
    }
  } catch {
    return '/';
  }

  if (trimmed === '/') {
    return '/';
  }

  return `/${trimmed.replace(/^\/+|\/+$/g, '')}`;
}

let cachedApiUrl = normalizeBaseUrl(DEFAULT_API_BASE_URL);
let cachedAppBasePath = normalizeAppBasePath(import.meta.env.BASE_URL || '/');
let configPromise: Promise<ResolvedRuntimeConfig> | null = null;
const runtimeBasePath = import.meta.env.BASE_URL || '/';

function getWindowOriginFallback(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return normalizeBaseUrl(window.location.origin);
  }

  return null;
}

function resolveEnvRuntimeConfig(): ResolvedRuntimeConfig {
  const envUrl = import.meta.env.VITE_API_URL;
  const devFallback = getWindowOriginFallback();

  return {
    apiUrl: isValidApiUrl(envUrl)
      ? normalizeBaseUrl(envUrl)
      : (import.meta.env.DEV && devFallback ? devFallback : normalizeBaseUrl(DEFAULT_API_BASE_URL)),
    baseUrl: normalizeAppBasePath(import.meta.env.BASE_URL || '/'),
  };
}

function readCachedRuntimeConfig(): ResolvedRuntimeConfig | null {
  if (!import.meta.env.PROD || typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(RUNTIME_CONFIG_CACHE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as RuntimeConfig;
    if (!isValidApiUrl(parsed.apiUrl)) {
      return null;
    }

    return {
      apiUrl: normalizeBaseUrl(parsed.apiUrl!),
      baseUrl: normalizeAppBasePath(parsed.baseUrl ?? import.meta.env.BASE_URL ?? '/'),
    };
  } catch {
    return null;
  }
}

function writeCachedRuntimeConfig(config: ResolvedRuntimeConfig): void {
  if (!import.meta.env.PROD || typeof window === 'undefined') {
    return;
  }

  try {
    window.sessionStorage.setItem(RUNTIME_CONFIG_CACHE_KEY, JSON.stringify(config));
  } catch {
    // Ignore storage quota / private mode errors.
  }
}

function toBaseRelativePath(fileName: string): string {
  const normalizedBase = runtimeBasePath.endsWith('/') ? runtimeBasePath : `${runtimeBasePath}/`;
  return `${normalizedBase}${fileName}`;
}

async function fetchRuntimeConfig(): Promise<ResolvedRuntimeConfig> {
  const fallbackConfig = resolveEnvRuntimeConfig();
  const cachedConfig = readCachedRuntimeConfig();

  if (!SHOULD_FETCH_RUNTIME_CONFIG) {
    return fallbackConfig;
  }

  try {
    if (cachedConfig) {
      cachedApiUrl = cachedConfig.apiUrl;
      cachedAppBasePath = cachedConfig.baseUrl;
    }

    const response = await fetch(toBaseRelativePath('config.json'), {
      cache: 'no-cache',
    });
    if (!response.ok) return cachedConfig ?? fallbackConfig;
    const config = (await response.json()) as RuntimeConfig;

    const resolved = {
      apiUrl: isValidApiUrl(config?.apiUrl) ? normalizeBaseUrl(config.apiUrl!) : fallbackConfig.apiUrl,
      baseUrl: normalizeAppBasePath(config?.baseUrl ?? fallbackConfig.baseUrl),
    };

    writeCachedRuntimeConfig(resolved);
    return resolved;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('[api-config] config.json yuklenemedi, fallback kullaniliyor:', error);
    }
  }

  return cachedConfig ?? fallbackConfig;
}

export function loadConfig(): Promise<string> {
  if (!configPromise) {
    configPromise = fetchRuntimeConfig().then((config) => {
      cachedApiUrl = config.apiUrl;
      cachedAppBasePath = config.baseUrl;
      return config;
    });
  }

  return configPromise.then((config) => config.apiUrl);
}

export async function getApiUrl(): Promise<string> {
  return loadConfig();
}

export function getApiBaseUrl(): string {
  if (import.meta.env.DEV) {
    return resolveEnvRuntimeConfig().apiUrl;
  }

  const env = import.meta.env.VITE_API_URL;
  if (isValidApiUrl(env)) return normalizeBaseUrl(env);
  return cachedApiUrl || normalizeBaseUrl(DEFAULT_API_BASE_URL);
}

export function getAppBasePath(): string {
  return cachedAppBasePath || normalizeAppBasePath(import.meta.env.BASE_URL || '/');
}

export function resolveAppPath(path: string): string {
  if (!path) {
    return getAppBasePath();
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const [pathnameWithQuery, hashFragment] = path.split('#', 2);
  const [pathnamePart, queryString] = pathnameWithQuery.split('?', 2);
  const normalizedPathname = pathnamePart.startsWith('/') ? pathnamePart : `/${pathnamePart}`;
  const basePath = getAppBasePath();

  const resolvedPath =
    basePath === '/'
      ? normalizedPathname
      : `${basePath}${normalizedPathname === '/' ? '' : normalizedPathname}`;

  const resolvedQuery = queryString ? `?${queryString}` : '';
  const resolvedHash = hashFragment ? `#${hashFragment}` : '';

  return `${resolvedPath}${resolvedQuery}${resolvedHash}`;
}

export function isCurrentAppPath(path: string): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  return currentPath === resolveAppPath(path);
}
