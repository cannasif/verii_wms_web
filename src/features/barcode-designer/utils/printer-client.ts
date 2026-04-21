export type BarcodePrinterConnectionType = 'browser' | 'usb' | 'serial';

export interface BarcodePrinterTarget {
  id: string;
  name: string;
  type: BarcodePrinterConnectionType;
  description: string;
  ready: boolean;
}

const STORAGE_KEY = 'barcode-designer-printer-targets';

function readStoredTargets(): BarcodePrinterTarget[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as BarcodePrinterTarget[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStoredTargets(targets: BarcodePrinterTarget[]): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(targets));
}

export async function discoverBarcodePrinters(): Promise<BarcodePrinterTarget[]> {
  const targets: BarcodePrinterTarget[] = [
    {
      id: 'browser-print',
      name: 'Tarayici / Sistem Yazdir',
      type: 'browser',
      description: 'Tarayicinin yazdir penceresini acar ve sistemdeki yazicilari kullanir.',
      ready: true,
    },
  ];

  const nav = typeof navigator !== 'undefined' ? (navigator as Navigator & { usb?: { requestDevice: (options: unknown) => Promise<{ serialNumber?: string; productId?: number; productName?: string }> }; serial?: { requestPort: () => Promise<{ getInfo: () => { usbVendorId?: number; usbProductId?: number } }> } }) : undefined;

  if (nav?.usb) {
    targets.push({
      id: 'webusb-printer',
      name: 'WebUSB Termal Yazici',
      type: 'usb',
      description: 'USB baglantili yazicilar icin tarayici izni gerekir.',
      ready: false,
    });
  }

  if (nav?.serial) {
    targets.push({
      id: 'webserial-printer',
      name: 'WebSerial Termal Yazici',
      type: 'serial',
      description: 'Seri port veya USB-Serial donusturuculu yazicilar icin kullanilir.',
      ready: false,
    });
  }

  const stored = readStoredTargets();
  return [...targets, ...stored.filter((item) => !targets.some((candidate) => candidate.id === item.id))];
}

export async function connectBarcodePrinter(type: Exclude<BarcodePrinterConnectionType, 'browser'>): Promise<BarcodePrinterTarget> {
  const nav = navigator as Navigator & { usb?: { requestDevice: (options: unknown) => Promise<{ serialNumber?: string; productId?: number; productName?: string }> }; serial?: { requestPort: () => Promise<{ getInfo: () => { usbVendorId?: number; usbProductId?: number } }> } };

  if (type === 'usb') {
    if (!nav.usb) {
      throw new Error('Bu tarayici WebUSB desteklemiyor');
    }

    const device = await nav.usb.requestDevice({ filters: [] });
    const target: BarcodePrinterTarget = {
      id: `usb-${device.serialNumber ?? device.productId}`,
      name: device.productName || 'USB Yazici',
      type: 'usb',
      description: 'WebUSB ile baglandi',
      ready: true,
    };
    const next = [...readStoredTargets().filter((item) => item.id !== target.id), target];
    writeStoredTargets(next);
    return target;
  }

  if (!nav.serial) {
    throw new Error('Bu tarayici WebSerial desteklemiyor');
  }

  const port = await nav.serial.requestPort();
  const info = port.getInfo();
  const target: BarcodePrinterTarget = {
    id: `serial-${info.usbVendorId ?? 'port'}-${info.usbProductId ?? 'unknown'}`,
    name: 'Serial Yazici',
    type: 'serial',
    description: 'WebSerial ile baglandi',
    ready: true,
  };
  const next = [...readStoredTargets().filter((item) => item.id !== target.id), target];
  writeStoredTargets(next);
  return target;
}

export function openBrowserPrintWindow(imageDataUrl: string, widthMm: number, heightMm: number): void {
  const popup = window.open('', '_blank', 'width=960,height=720');
  if (!popup) {
    throw new Error('Yazdirma penceresi acilamadi');
  }

  popup.document.write(`
    <html>
      <head>
        <title>Barcode Print</title>
        <style>
          @page { size: ${widthMm}mm ${heightMm}mm; margin: 0; }
          body { margin: 0; display: flex; align-items: center; justify-content: center; background: #fff; }
          img { width: ${widthMm}mm; height: ${heightMm}mm; object-fit: contain; }
        </style>
      </head>
      <body>
        <img src="${imageDataUrl}" alt="barcode-label" />
        <script>
          window.onload = function() {
            window.focus();
            window.print();
          };
        </script>
      </body>
    </html>
  `);
  popup.document.close();
}
