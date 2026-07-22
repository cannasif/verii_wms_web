import { useEffect, useState, type ReactElement } from 'react';
import { getApiBaseUrl } from '@/lib/axios';

interface VehicleCheckInAuthImageProps {
  imageId: number;
  alt: string;
  className?: string;
}

function getAccessToken(): string | null {
  return localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
}

export function VehicleCheckInAuthImage({ imageId, alt, className }: VehicleCheckInAuthImageProps): ReactElement {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;

    const base = getApiBaseUrl().replace(/\/$/, '');
    const url = `${base}/api/VehicleCheckIn/images/${imageId}/file`;
    const token = getAccessToken();
    const headers = new Headers();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    void fetch(url, { headers })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`image_load_failed_${response.status}`);
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
  }, [imageId]);

  if (!src) {
    return <div className={className ?? 'h-48 w-full bg-[color-mix(in_oklab,var(--wms-ops-accent)_8%,transparent)]'} aria-label={alt} />;
  }

  return <img src={src} alt={alt} className={className ?? 'h-48 w-full object-cover'} />;
}
