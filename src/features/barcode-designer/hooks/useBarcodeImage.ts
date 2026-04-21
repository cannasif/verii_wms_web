import { useEffect, useState } from 'react';
import { loadBwipLinearModule } from '@/lib/lazy-vendors';
import type { BarcodeSymbology } from '../types/barcode-designer-editor.types';
import { createBarcodePreviewDataUrl } from '../utils/barcode-preview';

function resolveBcid(type: BarcodeSymbology): string {
  switch (type) {
    case 'qrcode':
      return 'qrcode';
    case 'datamatrix':
      return 'datamatrix';
    default:
      return 'code128';
  }
}

export function useBarcodeImage(type: BarcodeSymbology, value: string, width: number, height: number): HTMLImageElement | null {
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function render(): Promise<void> {
      if (!value.trim()) {
        setImage(null);
        return;
      }

      try {
        const nextImage = new window.Image();

        if (type === 'code128') {
          const bwipjs = await loadBwipLinearModule();
          const canvas = document.createElement('canvas');
          bwipjs.toCanvas(canvas, {
            bcid: resolveBcid(type),
            text: value,
            scale: 3,
            height: Math.max(10, Math.round(height / 3)),
            includetext: false,
          });
          nextImage.src = canvas.toDataURL('image/png');
        } else {
          const previewDataUrl = createBarcodePreviewDataUrl(type, value, width, height);
          if (!previewDataUrl) {
            setImage(null);
            return;
          }
          nextImage.src = previewDataUrl;
        }

        nextImage.onload = () => {
          if (!cancelled) {
            setImage(nextImage);
          }
        };
      } catch {
        if (!cancelled) {
          setImage(null);
        }
      }
    }

    void render();

    return () => {
      cancelled = true;
    };
  }, [height, type, value, width]);

  return image;
}
