import { Fragment, useMemo, type ReactElement, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WMS_NAV_ITEMS, type NavItem } from './nav-items';

/** Route'a en uygun (en uzun href eşleşmeli) nav zincirini döndürür. */
function findTrail(items: NavItem[], pathname: string): NavItem[] | null {
  let best: { trail: NavItem[]; length: number } | null = null;

  const walk = (nodes: NavItem[], trail: NavItem[]): void => {
    for (const item of nodes) {
      const nextTrail = [...trail, item];
      if (item.href && (pathname === item.href || pathname.startsWith(`${item.href}/`))) {
        if (!best || item.href.length > best.length) {
          best = { trail: nextTrail, length: item.href.length };
        }
      }
      if (item.children?.length) {
        walk(item.children, nextTrail);
      }
    }
  };

  walk(items, []);
  return best ? (best as { trail: NavItem[] }).trail : null;
}

/**
 * Premium skin'de terminal eyebrow'u ("GİRİŞ_OP / MAL_KABUL") yerine
 * navigasyon ağacındaki gerçek tam adlardan minimal breadcrumb üretir
 * ("Giriş Operasyonları › Mal Kabul"). Route eşleşmezse string'i
 * okunaklı hale getirerek gösterir.
 */
export function PremiumEyebrow({ eyebrow }: { eyebrow: ReactNode }): ReactElement {
  const { t } = useTranslation();
  const { pathname } = useLocation();

  const segments = useMemo(() => {
    const trail = findTrail(WMS_NAV_ITEMS, pathname);
    if (trail && trail.length > 1) {
      const resolve = (item: NavItem): string =>
        t(item.title, { defaultValue: item.titleFallback ?? item.title });
      // Sayfanın kendisi başlıkta zaten var; üst grupları göster.
      const parents = trail.slice(0, -1).map(resolve);
      // Derin ağaçta minimal kalsın: ana operasyon grubu + en yakın grup.
      if (parents.length > 2) {
        return [parents[1], parents[parents.length - 1]];
      }
      return parents;
    }
    if (typeof eyebrow === 'string') {
      return eyebrow
        .split('/')
        .map((segment) => segment.replace(/_/g, ' ').trim().toLocaleLowerCase('tr'))
        .filter(Boolean);
    }
    return null;
  }, [eyebrow, pathname, t]);

  if (!segments) {
    return <div className="wms-premium-crumbs">{eyebrow}</div>;
  }

  return (
    <nav className="wms-premium-crumbs">
      {segments.map((segment, index) => (
        <Fragment key={`${segment}-${index}`}>
          {index > 0 ? <ChevronRight className="wms-premium-crumbs__sep" aria-hidden /> : null}
          <span
            className={cn(
              'wms-premium-crumbs__item',
              index === segments.length - 1 && 'wms-premium-crumbs__item--current',
            )}
          >
            {segment}
          </span>
        </Fragment>
      ))}
    </nav>
  );
}
