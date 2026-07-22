import { useEffect, useState, type ReactElement } from 'react';
import { getApiBaseUrl } from '@/lib/axios';

interface InspectionPhotoThumbProps {
  photoId: number;
  alt: string;
  className?: string;
}

function getAccessToken(): string | null {
  return localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
}

export function InspectionPhotoThumb({ photoId, alt, className }: InspectionPhotoThumbProps): ReactElement {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;

    const base = getApiBaseUrl().replace(/\/$/, '');
    const url = `${base}/api/SteelGoodReciptAcceptanse/inspection/photos/${photoId}/file`;
    const token = getAccessToken();
    const headers = new Headers();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    void fetch(url, { headers })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`photo_load_failed_${response.status}`);
        }
        return response.blob();
      })
      .then((blob) => {
        if (cancelled) {
          return;
        }
        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
      })
      .catch(() => {
        if (!cancelled) {
          setSrc(null);
        }
      });

    return () => {
      cancelled = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [photoId]);

  if (!src) {
    return <div className={className ?? 'h-20 w-20 bg-[color-mix(in_oklab,var(--wms-ops-accent)_8%,transparent)]'} aria-label={alt} />;
  }

  return <img src={src} alt={alt} className={className ?? 'h-20 w-20 object-cover'} />;
}
