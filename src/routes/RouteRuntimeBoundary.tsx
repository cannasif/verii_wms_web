import { type PropsWithChildren, type ReactElement, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ensureNamespaces } from '@/lib/i18n';

interface RouteRuntimeBoundaryProps extends PropsWithChildren {
  routeName: string;
  namespaces?: string[];
}

function markPerformance(label: string): void {
  if (typeof performance === 'undefined' || typeof performance.mark !== 'function') {
    return;
  }

  performance.mark(label);
}

function measurePerformance(name: string, startMark: string, endMark: string): void {
  if (typeof performance === 'undefined' || typeof performance.measure !== 'function') {
    return;
  }

  try {
    performance.measure(name, startMark, endMark);
  } catch {
    // Ignore duplicate or missing mark errors in unsupported browsers/devtools.
  }
}

export function RouteRuntimeBoundary({
  routeName,
  namespaces = [],
  children,
}: RouteRuntimeBoundaryProps): ReactElement {
  const { i18n } = useTranslation();
  const [ready, setReady] = useState(namespaces.length === 0);
  const startMark = useMemo(() => `route:${routeName}:start:${Date.now()}`, [routeName]);

  useEffect(() => {
    markPerformance(startMark);
  }, [startMark]);

  useEffect(() => {
    let active = true;

    if (namespaces.length === 0) {
      setReady(true);
      return undefined;
    }

    setReady(false);
    void ensureNamespaces(namespaces, i18n.resolvedLanguage ?? i18n.language)
      .then(() => {
        if (active) {
          setReady(true);
        }
      })
      .catch(() => {
        if (active) {
          setReady(true);
        }
      });

    return () => {
      active = false;
    };
  }, [i18n.language, i18n.resolvedLanguage, namespaces]);

  useEffect(() => {
    if (!ready) {
      return undefined;
    }

    const frameId = window.requestAnimationFrame(() => {
      const endMark = `route:${routeName}:ready:${Date.now()}`;
      markPerformance(endMark);
      measurePerformance(`route:${routeName}:render`, startMark, endMark);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [ready, routeName, startMark]);

  if (!ready) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center px-6 py-10 text-sm text-slate-500 dark:text-slate-400">
        Sayfa hazırlanıyor...
      </div>
    );
  }

  return <>{children}</>;
}
