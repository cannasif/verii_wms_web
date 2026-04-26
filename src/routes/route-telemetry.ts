interface RouteTelemetryEntry {
  routeName: string;
  durationMs: number;
  recordedAt: string;
}

const STORAGE_KEY = 'wms-route-telemetry:v1';
const MAX_ENTRIES = 40;
const SLOW_ROUTE_THRESHOLD_MS = 4000;

function readEntries(): RouteTelemetryEntry[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as RouteTelemetryEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeEntries(entries: RouteTelemetryEntry[]): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(-MAX_ENTRIES)));
  } catch {
    // Ignore storage failures in private browsing or restricted environments.
  }
}

export function recordRouteTelemetry(routeName: string, durationMs: number): void {
  if (typeof window === 'undefined' || !Number.isFinite(durationMs)) {
    return;
  }

  const entry: RouteTelemetryEntry = {
    routeName,
    durationMs: Math.round(durationMs),
    recordedAt: new Date().toISOString(),
  };

  const nextEntries = [...readEntries(), entry];
  writeEntries(nextEntries);

  if (durationMs >= SLOW_ROUTE_THRESHOLD_MS) {
    console.warn(`[route-telemetry] Slow route detected`, entry);
  }
}

