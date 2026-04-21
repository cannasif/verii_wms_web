import type {
  BarcodeBindingField,
  BarcodeDesignerBarcodeElement,
  BarcodeDesignerElement,
  BarcodeSymbology,
  BarcodeDesignerTemplateDocument,
} from '../types/barcode-designer-editor.types';

export const DEFAULT_TEMPLATE_DOCUMENT: BarcodeDesignerTemplateDocument = {
  canvas: {
    unit: 'mm',
    width: 100,
    height: 150,
    dpi: 203,
  },
  elements: [
    {
      id: 'title',
      type: 'text',
      x: 18,
      y: 16,
      width: 220,
      height: 24,
      fontSize: 18,
      text: '{{stockName}}',
    },
    {
      id: 'main-barcode',
      type: 'barcode',
      x: 18,
      y: 62,
      width: 260,
      height: 80,
      barcodeType: 'code128',
      binding: 'stock.barcode',
    },
    {
      id: 'serial',
      type: 'text',
      x: 18,
      y: 158,
      width: 200,
      height: 18,
      fontSize: 14,
      text: 'Seri: {{serialNo}}',
    },
    {
      id: 'frame',
      type: 'rect',
      x: 12,
      y: 10,
      width: 300,
      height: 190,
    },
  ],
  bindings: {
    'stock.barcode': '{{stockCode}}',
    stockName: 'Camasir Makinesi Motor',
    serialNo: 'SN-000245',
    stockCode: 'STK-2026-001',
    stockMainImageUrl: 'https://placehold.co/320x200/png',
    customerCode: 'CARI001',
    customerName: 'V3rii Musteri',
    companyCode: 'FRM001',
    companyName: 'V3rii A.S.',
  },
};

export const BARCODE_BINDING_FIELDS = [
  { key: 'stockCode', label: 'Stok Kodu', path: 'stock > identity > stockCode', sample: 'STK-2026-001', target: 'text' },
  { key: 'stockName', label: 'Stok Adi', path: 'stock > identity > stockName', sample: 'Camasir Makinesi Motor', target: 'text' },
  { key: 'stock.barcode', label: 'Stok Barkodu', path: 'stock > barcode > primary', sample: '{{stockCode}}', target: 'barcode' },
  { key: 'stockMainImageUrl', label: 'Stok Ana Gorseli', path: 'stock > media > mainImageUrl', sample: 'https://placehold.co/320x200/png', target: 'image' },
  { key: 'customerCode', label: 'Musteri / Firma Kodu', path: 'customer > identity > customerCode', sample: 'CARI001', target: 'text' },
  { key: 'customerName', label: 'Musteri / Firma Adi', path: 'customer > identity > customerName', sample: 'V3rii Musteri', target: 'text' },
  { key: 'companyCode', label: 'Firma Kodu', path: 'company > identity > companyCode', sample: 'FRM001', target: 'text' },
  { key: 'companyName', label: 'Firma Adi', path: 'company > identity > companyName', sample: 'V3rii A.S.', target: 'text' },
  { key: 'serialNo', label: 'Seri No', path: 'tracking > serial > serialNo', sample: 'SN-000245', target: 'text' },
  { key: 'shipmentNo', label: 'Sevkiyat No', path: 'logistics > shipment > shipmentNo', sample: 'SHIP-2026-0001', target: 'text' },
  { key: 'warehouseCode', label: 'Depo Kodu', path: 'logistics > warehouse > warehouseCode', sample: 'ANA', target: 'text' },
  { key: 'locationCode', label: 'Lokasyon Kodu', path: 'logistics > location > locationCode', sample: 'A-01-02', target: 'text' },
] as const;

export interface BarcodeTemplatePresetDefinition {
  id: string;
  category: 'product' | 'carton' | 'pallet' | 'logistic';
  labelType: string;
  displayName: string;
  description: string;
  recommendedFor: string;
  document: BarcodeDesignerTemplateDocument;
}

export const BARCODE_TEMPLATE_PRESETS: BarcodeTemplatePresetDefinition[] = [
  {
    id: 'product-basic',
    category: 'product',
    labelType: 'product',
    displayName: 'Urun Etiketi',
    description: 'Tek urun, seri ve temel barkod yeniden basim ihtiyaclari icin hizli baslangic.',
    recommendedFor: 'Mal kabul, ambar giris, urun bazli tekrar baski',
    document: DEFAULT_TEMPLATE_DOCUMENT,
  },
  {
    id: 'gs1-carton',
    category: 'carton',
    labelType: 'carton',
    displayName: 'GS1-128 Koli Etiketi',
    description: 'GTIN, lot ve son kullanma tarihi tasiyan koli sevkiyat etiketi.',
    recommendedFor: 'Koli bazli lojistik hareket ve depolama',
    document: {
      canvas: { unit: 'mm', width: 100, height: 70, dpi: 203 },
      elements: [
        { id: 'frame', type: 'rect', x: 8, y: 8, width: 360, height: 235 },
        { id: 'title', type: 'text', x: 20, y: 18, width: 240, height: 20, fontSize: 18, text: 'Koli / Carton' },
        { id: 'stock-name', type: 'text', x: 20, y: 42, width: 300, height: 20, fontSize: 16, text: '{{stockName}}' },
        { id: 'gs1-hri', type: 'text', x: 20, y: 72, width: 320, height: 18, fontSize: 13, text: '{{gs1.hri}}' },
        { id: 'gs1-barcode', type: 'barcode', x: 20, y: 100, width: 300, height: 72, barcodeType: 'code128', binding: 'gs1.value' },
        { id: 'lot', type: 'text', x: 20, y: 190, width: 140, height: 16, fontSize: 12, text: 'Lot: {{lotNo}}' },
        { id: 'expiry', type: 'text', x: 180, y: 190, width: 140, height: 16, fontSize: 12, text: 'SKT: {{expiryDate}}' },
      ],
      bindings: {
        stockName: 'Koli Urunu',
        'gs1.value': '010869990001234510LOT001',
        'gs1.hri': '(01)08699900012345(10)LOT001',
        lotNo: 'LOT001',
        expiryDate: '260630',
      },
    },
  },
  {
    id: 'sscc-pallet',
    category: 'pallet',
    labelType: 'pallet',
    displayName: 'SSCC Palet Etiketi',
    description: 'SSCC odakli, palet seviyesinde izleme ve lojistik dogrulama etiketi.',
    recommendedFor: 'Palet, SSCC, GS1 logistic label',
    document: {
      canvas: { unit: 'mm', width: 100, height: 150, dpi: 203 },
      elements: [
        { id: 'frame', type: 'rect', x: 8, y: 8, width: 360, height: 530 },
        { id: 'title', type: 'text', x: 20, y: 18, width: 260, height: 24, fontSize: 20, text: 'GS1 Logistic Label' },
        { id: 'sscc-title', type: 'text', x: 20, y: 58, width: 120, height: 18, fontSize: 14, text: 'SSCC' },
        { id: 'sscc-hri', type: 'text', x: 20, y: 84, width: 320, height: 20, fontSize: 16, text: '{{gs1.hri}}' },
        { id: 'sscc-barcode', type: 'barcode', x: 20, y: 118, width: 320, height: 92, barcodeType: 'code128', binding: 'gs1.value' },
        { id: 'ship-to', type: 'text', x: 20, y: 238, width: 280, height: 18, fontSize: 13, text: 'Ship To: {{shipTo}}' },
        { id: 'count', type: 'text', x: 20, y: 264, width: 120, height: 18, fontSize: 13, text: 'Count: {{count}}' },
        { id: 'gtin', type: 'text', x: 20, y: 290, width: 320, height: 18, fontSize: 13, text: 'GTIN: {{gtin}}' },
      ],
      bindings: {
        'gs1.value': '000123456789012345',
        'gs1.hri': '(00)0123456789012345',
        shipTo: '8699990000000',
        count: '48',
        gtin: '08699900012345',
      },
    },
  },
  {
    id: 'logistic-unit',
    category: 'logistic',
    labelType: 'logistic',
    displayName: 'Lojistik Birim Etiketi',
    description: 'Karisik sevkiyat, musterili lojistik birim ve depo lokasyon bilgisi icin.',
    recommendedFor: 'Lojistik birim, transfer, sevkiyat konsolidasyonu',
    document: {
      canvas: { unit: 'mm', width: 148, height: 105, dpi: 203 },
      elements: [
        { id: 'frame', type: 'rect', x: 10, y: 10, width: 535, height: 370 },
        { id: 'header', type: 'text', x: 20, y: 20, width: 300, height: 24, fontSize: 18, text: '{{customerName}}' },
        { id: 'desc', type: 'text', x: 20, y: 50, width: 340, height: 18, fontSize: 14, text: '{{stockName}}' },
        { id: 'logistic-barcode', type: 'barcode', x: 20, y: 88, width: 320, height: 90, barcodeType: 'code128', binding: 'gs1.value' },
        { id: 'logistic-hri', type: 'text', x: 20, y: 188, width: 360, height: 20, fontSize: 13, text: '{{gs1.hri}}' },
        { id: 'qr-copy', type: 'barcode', x: 390, y: 82, width: 110, height: 110, barcodeType: 'qrcode', binding: 'shipmentNo' },
        { id: 'shipment', type: 'text', x: 20, y: 228, width: 240, height: 18, fontSize: 13, text: 'Shipment: {{shipmentNo}}' },
        { id: 'warehouse', type: 'text', x: 20, y: 252, width: 180, height: 18, fontSize: 13, text: 'WH: {{warehouseCode}}' },
        { id: 'location', type: 'text', x: 210, y: 252, width: 180, height: 18, fontSize: 13, text: 'LOC: {{locationCode}}' },
      ],
      bindings: {
        customerName: 'Lojistik Musteri',
        stockName: 'Karisik Sevkiyat Birimi',
        'gs1.value': '000123456789012345',
        'gs1.hri': '(00)0123456789012345',
        shipmentNo: 'SHIP-2026-0001',
        warehouseCode: 'ANA',
        locationCode: 'A-01-02',
      },
    },
  },
];

export const PIXELS_PER_MM = 3.78;

export function mmToPx(value: number): number {
  return Math.round(value * PIXELS_PER_MM);
}

export function pxToCm(value: number): number {
  return Number((value / PIXELS_PER_MM / 10).toFixed(2));
}

export function cmToPx(value: number): number {
  return Math.round(value * 10 * PIXELS_PER_MM);
}

export function mmToCm(value: number): number {
  return Number((value / 10).toFixed(2));
}

export function cmToMm(value: number): number {
  return Number((value * 10).toFixed(2));
}

export function getGridSizePx(): number {
  return cmToPx(1);
}

export function snapToGridPx(value: number): number {
  const grid = getGridSizePx();
  return Math.round(value / grid) * grid;
}

function getElementDimensions(element: BarcodeDesignerElement): { width: number; height: number } {
  if ('width' in element && 'height' in element) {
    return { width: element.width, height: element.height };
  }

  if (element.type === 'line') {
    const xPoints = element.points.filter((_value, index) => index % 2 === 0);
    const yPoints = element.points.filter((_value, index) => index % 2 === 1);
    return {
      width: Math.max(...xPoints, 180),
      height: Math.max(...yPoints, 24),
    };
  }

  return { width: 120, height: 48 };
}

export function getSuggestedElementLayout(
  document: BarcodeDesignerTemplateDocument,
  target: 'text' | 'barcode' | 'image',
  desiredX?: number,
  desiredY?: number,
): { x: number; y: number; width: number; height: number; fontSize?: number } {
  const presets = {
    text: { width: cmToPx(4.8), height: cmToPx(0.8), fontSize: 14 },
    barcode: { width: cmToPx(6.4), height: cmToPx(1.9) },
    image: { width: cmToPx(3.2), height: cmToPx(2.1) },
  } as const;

  const preset = presets[target];
  const canvasWidth = mmToPx(document.canvas.width);
  const canvasHeight = mmToPx(document.canvas.height);
  const margin = cmToPx(0.4);
  const maxX = Math.max(margin, canvasWidth - preset.width - margin);
  const maxY = Math.max(margin, canvasHeight - preset.height - margin);

  const desiredClampedX = desiredX != null ? Math.min(Math.max(desiredX, margin), maxX) : null;
  const desiredClampedY = desiredY != null ? Math.min(Math.max(desiredY, margin), maxY) : null;

  if (desiredClampedX != null && desiredClampedY != null) {
    return { x: desiredClampedX, y: desiredClampedY, ...preset };
  }

  const stepY = cmToPx(1.05);
  const startX = margin;
  const startY = margin;

  for (let row = 0; row < 24; row += 1) {
    const candidateY = Math.min(startY + (row * stepY), maxY);
    const overlaps = document.elements.some((element) => {
      const { width, height } = getElementDimensions(element);
      const horizontal = startX < element.x + width + margin && startX + preset.width + margin > element.x;
      const vertical = candidateY < element.y + height + margin && candidateY + preset.height + margin > element.y;
      return horizontal && vertical;
    });

    if (!overlaps) {
      return { x: startX, y: candidateY, ...preset };
    }
  }

  return { x: startX, y: startY, ...preset };
}

export function getRecommendedBindingTarget(field: Pick<BarcodeBindingField, 'key' | 'path' | 'label' | 'sampleValue' | 'targetType'>): 'text' | 'barcode' | 'image' {
  const fingerprint = `${field.key} ${field.path} ${field.label} ${field.sampleValue}`.toLocaleLowerCase('tr-TR');

  if (
    fingerprint.includes('image')
    || fingerprint.includes('gorsel')
    || fingerprint.includes('logo')
    || fingerprint.includes('media')
    || fingerprint.includes('http://')
    || fingerprint.includes('https://')
    || fingerprint.includes('.png')
    || fingerprint.includes('.jpg')
    || fingerprint.includes('.jpeg')
    || fingerprint.includes('.svg')
  ) {
    return 'image';
  }

  if (
    fingerprint.includes('barcode')
    || fingerprint.includes('barkod')
    || fingerprint.includes('qr')
    || fingerprint.includes('datamatrix')
    || fingerprint.includes('gs1.value')
    || fingerprint.includes('sscc')
  ) {
    return 'barcode';
  }

  return field.targetType;
}

export function getSuggestedBarcodeSymbology(field: Pick<BarcodeBindingField, 'key' | 'path' | 'label'>): BarcodeSymbology {
  const fingerprint = `${field.key} ${field.path} ${field.label}`.toLocaleLowerCase('tr-TR');

  if (fingerprint.includes('qr')) {
    return 'qrcode';
  }

  if (fingerprint.includes('datamatrix') || fingerprint.includes('matrix')) {
    return 'datamatrix';
  }

  return 'code128';
}

export function stringifyTemplateDocument(document: BarcodeDesignerTemplateDocument): string {
  return JSON.stringify(document, null, 2);
}

export function parseTemplateDocument(value: string): BarcodeDesignerTemplateDocument {
  const parsed = JSON.parse(value) as BarcodeDesignerTemplateDocument;
  return {
    canvas: parsed.canvas ?? DEFAULT_TEMPLATE_DOCUMENT.canvas,
    elements: Array.isArray(parsed.elements) ? parsed.elements : DEFAULT_TEMPLATE_DOCUMENT.elements,
    bindings: parsed.bindings ?? DEFAULT_TEMPLATE_DOCUMENT.bindings,
  };
}

export function resolveBindingValue(binding: string, bindings: Record<string, string>): string {
  return bindings[binding] ?? bindings[binding.replace('stock.', '')] ?? binding;
}

export function resolveTemplateText(input: string, bindings: Record<string, string>): string {
  return input.replace(/\{\{([^}]+)\}\}/g, (_match, key: string) => bindings[key.trim()] ?? '');
}

export function getPrimaryBarcodeElement(document: BarcodeDesignerTemplateDocument): BarcodeDesignerBarcodeElement | null {
  return document.elements.find((item): item is BarcodeDesignerBarcodeElement => item.type === 'barcode') ?? null;
}
