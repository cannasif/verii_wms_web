import type { BarcodeDesignerTemplateDocument } from '../types/barcode-designer-editor.types';
import { PIXELS_PER_MM } from './barcode-designer-document';

export interface BarcodeTemplateValidationIssue {
  level: 'error' | 'warning';
  elementId: string;
  title: string;
  detail: string;
}

function pxToMm(value: number): number {
  return Number((value / PIXELS_PER_MM).toFixed(1));
}

export function validateBarcodeTemplate(document: BarcodeDesignerTemplateDocument): BarcodeTemplateValidationIssue[] {
  const issues: BarcodeTemplateValidationIssue[] = [];
  const canvasWidthPx = document.canvas.width * PIXELS_PER_MM;
  const canvasHeightPx = document.canvas.height * PIXELS_PER_MM;

  for (const element of document.elements) {
    if (element.type !== 'barcode') {
      continue;
    }

    const widthMm = pxToMm(element.width);
    const heightMm = pxToMm(element.height);
    const leftQuietZoneMm = pxToMm(element.x);
    const rightQuietZoneMm = pxToMm(Math.max(0, canvasWidthPx - (element.x + element.width)));
    const topQuietZoneMm = pxToMm(element.y);
    const bottomQuietZoneMm = pxToMm(Math.max(0, canvasHeightPx - (element.y + element.height)));
    const quietZoneMm = element.barcodeType === 'code128' ? 5 : 2;

    if (leftQuietZoneMm < quietZoneMm || rightQuietZoneMm < quietZoneMm) {
      issues.push({
        level: 'warning',
        elementId: element.id,
        title: 'Quiet zone dar',
        detail: `${element.id} icin yatay bosluk ${quietZoneMm} mm altinda. Sol ${leftQuietZoneMm} mm, sag ${rightQuietZoneMm} mm.`,
      });
    }

    if (topQuietZoneMm < 1 || bottomQuietZoneMm < 1) {
      issues.push({
        level: 'warning',
        elementId: element.id,
        title: 'Dikey bosluk dusuk',
        detail: `${element.id} kenarlara cok yakin. Ust ${topQuietZoneMm} mm, alt ${bottomQuietZoneMm} mm.`,
      });
    }

    if (element.barcodeType === 'code128') {
      if (widthMm < 32) {
        issues.push({
          level: 'error',
          elementId: element.id,
          title: 'Code128 cok dar',
          detail: `${element.id} genisligi ${widthMm} mm. Guvenli okuma icin en az 32 mm onerilir.`,
        });
      }

      if (heightMm < 13) {
        issues.push({
          level: 'warning',
          elementId: element.id,
          title: 'Code128 yuksekligi dusuk',
          detail: `${element.id} yuksekligi ${heightMm} mm. GS1-128 / SSCC icin en az 13 mm onerilir.`,
        });
      }

      if (element.binding.startsWith('gs1.') && !document.bindings['gs1.hri']) {
        issues.push({
          level: 'warning',
          elementId: element.id,
          title: 'GS1 HRI eksik',
          detail: `${element.id} GS1 binding kullaniyor ama gs1.hri metni tanimli degil.`,
        });
      }
    }

    if ((element.barcodeType === 'qrcode' || element.barcodeType === 'datamatrix') && (widthMm < 12 || heightMm < 12)) {
      issues.push({
        level: 'error',
        elementId: element.id,
        title: `${element.barcodeType.toUpperCase()} boyutu kucuk`,
        detail: `${element.id} icin ${widthMm}x${heightMm} mm olculeri 2D barkod icin cok dusuk.`,
      });
    }

    if (element.binding.startsWith('gs1.') && element.barcodeType !== 'code128') {
      issues.push({
        level: 'warning',
        elementId: element.id,
        title: 'GS1 baglama tipi uyumsuz',
        detail: `${element.id} GS1 binding kullaniyor ama barcode tipi ${element.barcodeType}. GS1-128 icin Code128 kullanilmasi beklenir.`,
      });
    }
  }

  return issues;
}
