const CHUNK_RELOAD_KEY = 'wms:chunk-reload-at';
const CHUNK_RELOAD_COOLDOWN_MS = 30_000;

function isChunkLoadError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message ?? '';
  return (
    message.includes('Failed to fetch dynamically imported module') ||
    message.includes('Importing a module script failed') ||
    message.includes('error loading dynamically imported module') ||
    message.includes('Unable to preload CSS') ||
    message.includes('Loading chunk')
  );
}

export function tryRecoverFromChunkError(error: unknown): boolean {
  if (!isChunkLoadError(error)) {
    return false;
  }

  const lastReloadAt = Number(sessionStorage.getItem(CHUNK_RELOAD_KEY) ?? '0');
  if (Number.isFinite(lastReloadAt) && Date.now() - lastReloadAt < CHUNK_RELOAD_COOLDOWN_MS) {
    return false;
  }

  sessionStorage.setItem(CHUNK_RELOAD_KEY, String(Date.now()));
  window.location.reload();
  return true;
}
