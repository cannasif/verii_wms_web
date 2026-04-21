import type {
  BarcodeDesignerCapabilityGroup,
  BarcodeDesignerPhase,
  BarcodeDesignerStackOption,
} from '../types/barcode-designer.types';

export const STACK_OPTIONS: BarcodeDesignerStackOption[] = [
  {
    name: 'react-konva + konva',
    role: 'Designer canvas',
    verdict: 'primary',
    reason: 'React ile uyumlu, drag-drop ve transform odakli custom editor ihtiyacina en uygun secenek.',
    sourceLabel: 'Konva React Docs',
    sourceUrl: 'https://konvajs.org/docs/react/',
  },
  {
    name: 'bwip-js',
    role: 'Barcode render engine',
    verdict: 'primary',
    reason: '1D ve 2D barkod standardi kapsami genis; browser tarafinda canvas ve SVG uretebiliyor.',
    sourceLabel: 'bwip-js npm',
    sourceUrl: 'https://www.npmjs.com/package/bwip-js',
  },
  {
    name: 'pdfme',
    role: 'Template export and document pipeline',
    verdict: 'supporting',
    reason: 'JSON template ve PDF export hattini hizlandirir; designer entegrasyonu icin ikinci fazda degerli.',
    sourceLabel: 'pdfme Getting Started',
    sourceUrl: 'https://pdfme.com/docs/getting-started',
  },
];

export const ARCHITECTURE_GROUPS: BarcodeDesignerCapabilityGroup[] = [
  {
    title: 'Ayrik Feature ve Module',
    description: 'Barkod cozumleme altyapisindan bagimsiz, label tasarim ve render alanini yoneten ayrik urun parcasi.',
    items: [
      'Web: src/features/barcode-designer',
      'API: srcWms/Wms/Modules/BarcodeDesigner',
      'Mevcut barcode-definitions ekranini bozmadan yanina konumlanir',
    ],
  },
  {
    title: 'JSON-First Template Omurgasi',
    description: 'Ilk fazda heterojen canvas elemanlarini iliskisel tablo yerine versiyonlanabilir JSON ile tutmak daha dogru.',
    items: [
      'Canvas ayarlari: genislik, yukseklik, dpi, unit',
      'Elementler: text, barcode, qrcode, datamatrix, line, rect, image',
      'Binding sozlugu: stock, lot, serial, warehouse, location, order, package',
    ],
  },
  {
    title: 'Render ve Preview Hatti',
    description: 'Editor ile cikti motorunu ayirmak, ileride PDF veya printer-specific export eklemeyi kolaylastirir.',
    items: [
      'Canvas preview',
      'SVG/PDF export',
      'Sample data ile onizleme',
      'Printer profile ile boyut ve dpi normalize etme',
    ],
  },
  {
    title: 'WMS Entegrasyonu',
    description: 'Template baglamlari WMS akislarina oturmalidir; bu alan sadece generic label designer olmamali.',
    items: [
      'Shipment etiketi',
      'Paket/koli etiketi',
      'Palet etiketi',
      'Lokasyon etiketi',
      'Uretim etiketi',
    ],
  },
];

export const DELIVERY_PHASES: BarcodeDesignerPhase[] = [
  {
    title: 'MVP',
    items: [
      'Template listesi ve detay sayfasi',
      'Template JSON saklama',
      'Barcode + text + line + rect elementleri',
      'Sample data preview',
      'PDF export',
    ],
  },
  {
    title: '2. Faz',
    items: [
      'Drag-drop designer canvas',
      'GS1 helper presetleri',
      'Printer profilleri',
      'Template publish/draft akisi',
      'Version compare ve rollback',
    ],
  },
  {
    title: '3. Faz',
    items: [
      'Batch print jobs',
      'Audit trail',
      'Module-based preset wizard',
      'Advanced expression/formula engine',
      'Printer-specific output katmani',
    ],
  },
];

export const SAMPLE_TEMPLATE_JSON = `{
  "canvas": {
    "unit": "mm",
    "width": 100,
    "height": 150,
    "dpi": 203,
    "safeArea": { "top": 2, "right": 2, "bottom": 2, "left": 2 }
  },
  "elements": [
    {
      "id": "title",
      "type": "text",
      "text": "{{stockName}}",
      "x": 8,
      "y": 8,
      "width": 70,
      "height": 8
    },
    {
      "id": "main-barcode",
      "type": "barcode",
      "barcodeType": "code128",
      "binding": "stock.barcode",
      "x": 8,
      "y": 22,
      "width": 62,
      "height": 18
    },
    {
      "id": "serial",
      "type": "text",
      "text": "Seri: {{serialNo}}",
      "x": 8,
      "y": 44,
      "width": 40,
      "height": 6
    }
  ],
  "bindings": {
    "stock.barcode": "{{stockCode}}",
    "stock.name": "{{stockName}}",
    "stock.serial": "{{serialNo}}"
  }
}`;
