import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Combobox } from '@/components/ui/combobox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface PortalProduct {
  code: string;
  name: string;
  serialNo: string;
  qty: number;
  unit: string;
}

interface DemoProduct {
  code: string;
  name: string;
  unit: string;
  serialNos: string[];
}

interface PortalSlotDetail {
  slot: string;
  products: PortalProduct[];
}

const PORTAL_SLOT_ROWS = ['A', 'B', 'C', 'D'] as const;
const PORTAL_SLOT_COLS = [11, 12, 13, 14, 15, 16] as const;

const PORTAL_PRODUCTS: Record<string, PortalProduct[]> = {
  A11: [
    { code: 'STK-1001', name: 'Galvaniz Sac 1mm', serialNo: 'GK-A11-001', qty: 120, unit: 'Adet' },
    { code: 'STK-2105', name: 'Rulo Sac 0.8mm', serialNo: 'RL-A11-018', qty: 42, unit: 'Rulo' },
  ],
  A12: [{ code: 'STK-3020', name: 'Profil Demir 40x40', serialNo: 'PR-A12-004', qty: 75, unit: 'Adet' }],
  B14: [
    { code: 'STK-5102', name: 'Paslanmaz Levha', serialNo: 'PL-B14-003', qty: 18, unit: 'Plaka' },
    { code: 'STK-4107', name: 'Kutu Profil 60x40', serialNo: 'KP-B14-011', qty: 33, unit: 'Adet' },
  ],
  C16: [{ code: 'STK-7003', name: 'Aluminyum Sac', serialNo: 'AL-C16-021', qty: 61, unit: 'Adet' }],
  D15: [{ code: 'STK-8801', name: 'Kesim Bekleyen Sac', serialNo: 'KB-D15-002', qty: 9, unit: 'Palet' }],
};

const DEMO_PRODUCT_CATALOG: DemoProduct[] = [
  {
    code: 'STK-9001',
    name: 'Boyalı Sac 1.2mm',
    unit: 'Adet',
    serialNos: ['SN-9001-A001', 'SN-9001-A002', 'SN-9001-A003'],
  },
  {
    code: 'STK-9002',
    name: 'Kutu Profil 30x30',
    unit: 'Adet',
    serialNos: ['SN-9002-B004', 'SN-9002-B005'],
  },
  {
    code: 'STK-9003',
    name: 'Dkp Sac 2mm',
    unit: 'Plaka',
    serialNos: ['SN-9003-C012', 'SN-9003-C013', 'SN-9003-C014'],
  },
  {
    code: 'STK-9004',
    name: 'Alüminyum Rulo',
    unit: 'Rulo',
    serialNos: ['SN-9004-D021', 'SN-9004-D022'],
  },
];

export function OutsideWarehousePage(): ReactElement {
  const { t } = useTranslation();
  const [portalOpen, setPortalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState('A11');
  const [inventoryBySlot, setInventoryBySlot] = useState<Record<string, PortalProduct[]>>(() =>
    Object.fromEntries(
      Object.entries(PORTAL_PRODUCTS).map(([slot, products]) => [slot, products.map((p) => ({ ...p }) as PortalProduct)]),
    ),
  );
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [selectedCatalogCode, setSelectedCatalogCode] = useState(DEMO_PRODUCT_CATALOG[0]?.code ?? '');
  const [selectedSerialNo, setSelectedSerialNo] = useState(DEMO_PRODUCT_CATALOG[0]?.serialNos[0] ?? '');
  const [addQty, setAddQty] = useState(1);
  const [moveTargets, setMoveTargets] = useState<Record<string, string>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmType, setConfirmType] = useState<'remove' | 'move' | null>(null);
  const [confirmPayload, setConfirmPayload] = useState<{ serialNo?: string; product?: PortalProduct }>({});
  const [isPortalClosing, setIsPortalClosing] = useState(false);

  const portalSlots = useMemo<PortalSlotDetail[]>(() => {
    return PORTAL_SLOT_ROWS.flatMap((row) =>
      PORTAL_SLOT_COLS.map((col) => {
        const slot = `${row}${col}`;
        return { slot, products: inventoryBySlot[slot] ?? [] };
      }),
    );
  }, [inventoryBySlot]);

  const selectedSlotDetail =
    portalSlots.find((item) => item.slot === selectedSlot) ?? portalSlots[0];
  const selectedCatalogProduct = DEMO_PRODUCT_CATALOG.find((item) => item.code === selectedCatalogCode);
  const stockOptions = DEMO_PRODUCT_CATALOG.map((item) => ({
    value: item.code,
    label: `${item.code} - ${item.name}`,
  }));
  const serialOptions = (selectedCatalogProduct?.serialNos ?? []).map((serial) => ({
    value: serial,
    label: serial,
  }));

  useEffect(() => {
    if (portalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [portalOpen]);

  useEffect(() => {
    if (!isPortalClosing) return;
    const timer = setTimeout(() => {
      setPortalOpen(false);
      setIsPortalClosing(false);
    }, 200);
    return () => clearTimeout(timer);
  }, [isPortalClosing]);

  useEffect(() => {
    const firstSerial = selectedCatalogProduct?.serialNos[0] ?? '';
    setSelectedSerialNo(firstSerial);
  }, [selectedCatalogCode, selectedCatalogProduct]);

  const handleAddProduct = (): void => {
    const product = DEMO_PRODUCT_CATALOG.find((item) => item.code === selectedCatalogCode);
    if (!product) return;
    if (!selectedSerialNo) return;

    const newProduct: PortalProduct = {
      code: product.code,
      name: product.name,
      serialNo: selectedSerialNo,
      qty: Math.max(1, addQty),
      unit: product.unit,
    };

    setInventoryBySlot((prev) => ({
      ...prev,
      [selectedSlot]: [...(prev[selectedSlot] ?? []), newProduct],
    }));
    setShowAddProduct(false);
    setAddQty(1);
  };

  const handleRemoveProduct = (serialNo: string): void => {
    setInventoryBySlot((prev) => ({
      ...prev,
      [selectedSlot]: (prev[selectedSlot] ?? []).filter((product) => product.serialNo !== serialNo),
    }));
  };

  const handleMoveProduct = (product: PortalProduct): void => {
    const targetSlot =
      moveTargets[product.serialNo] ??
      portalSlots.find((slot) => slot.slot !== selectedSlot)?.slot;

    if (!targetSlot || targetSlot === selectedSlot) return;

    setInventoryBySlot((prev) => ({
      ...prev,
      [selectedSlot]: (prev[selectedSlot] ?? []).filter((item) => item.serialNo !== product.serialNo),
      [targetSlot]: [...(prev[targetSlot] ?? []), product],
    }));
    setMoveTargets((prev) => {
      const next = { ...prev };
      delete next[product.serialNo];
      return next;
    });
  };

  const openConfirmRemove = (serialNo: string): void => {
    setConfirmPayload({ serialNo });
    setConfirmType('remove');
    setConfirmOpen(true);
  };

  const openConfirmMove = (product: PortalProduct): void => {
    const targetSlot =
      moveTargets[product.serialNo] ?? portalSlots.find((slot) => slot.slot !== selectedSlot)?.slot;
    if (!targetSlot || targetSlot === selectedSlot) return;
    setConfirmPayload({ product });
    setConfirmType('move');
    setConfirmOpen(true);
  };

  const handleConfirmYes = (): void => {
    if (confirmType === 'remove' && confirmPayload.serialNo) {
      handleRemoveProduct(confirmPayload.serialNo);
    }
    if (confirmType === 'move' && confirmPayload.product) {
      handleMoveProduct(confirmPayload.product);
    }
    setConfirmOpen(false);
    setConfirmType(null);
    setConfirmPayload({});
  };

  return (
    <div className="crm-page w-full space-y-6">
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent showCloseButton={true} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {confirmType === 'remove' &&
                t('inventory.outsideWarehouse.confirmRemoveTitle')}
              {confirmType === 'move' &&
                t('inventory.outsideWarehouse.confirmMoveTitle')}
            </DialogTitle>
            <DialogDescription>
              {confirmType === 'remove' &&
                t('inventory.outsideWarehouse.confirmRemoveMessage')}
              {confirmType === 'move' &&
                t('inventory.outsideWarehouse.confirmMoveMessage')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setConfirmOpen(false)}>
              {t('common.no')}
            </Button>
            <Button type="button" onClick={handleConfirmYes}>
              {t('common.yes')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="crm-toolbar flex items-center justify-between pb-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white md:text-3xl">
            {t('inventory.outsideWarehouse.title')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
            {t(
              'inventory.outsideWarehouse.subtitle',
            )}
          </p>
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-4 md:p-6">
          <div className="relative mx-auto aspect-16/10 w-full max-w-7xl overflow-hidden rounded-xl border border-slate-300/80 bg-slate-100 shadow-inner dark:border-slate-600/50 dark:bg-[#0d1322]">
            <div className="absolute inset-5 rounded-lg border border-slate-400/50 bg-white/40 dark:border-slate-500/30 dark:bg-black/25" />

          <div className="absolute left-[4%] top-[6%] h-[14%] w-[12%] rounded-sm border-2 border-slate-600/90 bg-slate-200/95 dark:border-slate-500 dark:bg-slate-800/90">
            <div className="absolute right-0 top-0 h-2 w-2 rounded-full border border-slate-700 bg-slate-800 dark:border-slate-400 dark:bg-slate-500" />
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[0.7rem] font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100">
              {t('inventory.outsideWarehouse.security')}
            </div>
          </div>
          <div className="absolute left-[15.5%] top-[10%] h-[0.5%] w-[4%] bg-red-500 rounded-full" aria-hidden />
          <div className="absolute left-[20%] top-[6%] h-[16%] w-[14%] rounded-sm border-2 border-slate-600/90 bg-slate-200/90 dark:border-slate-500 dark:bg-slate-800/80">
            <div className="absolute inset-1.5 grid grid-cols-[1fr_0.35fr_1fr] grid-rows-4 gap-x-0.5 gap-y-0.5">
              {[1, 2, 3, 4].map((n) => (
                <div key={`l-${n}`} className="flex items-center justify-center rounded-[2px] border border-slate-500/80 bg-slate-300/90 text-[0.65rem] font-bold text-slate-800 dark:bg-slate-700 dark:text-slate-200">
                  {n}
                </div>
              ))}
              <div className="row-span-4 bg-slate-400/25 dark:bg-slate-600/25 rounded-[2px] min-w-0" />
              {[5, 6, 7, 8].map((n) => (
                <div key={`r-${n}`} className="flex items-center justify-center rounded-[2px] border border-slate-500/80 bg-slate-300/90 text-[0.65rem] font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                  {n}
                </div>
              ))}
            </div>
            <div className="absolute -bottom-3 left-0 right-0 text-center text-[0.6rem] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              {t('inventory.outsideWarehouse.parking')}
            </div>
          </div>

          <div className="absolute left-[4%] top-[32%] h-[38%] w-[14%] rounded-sm border-2 border-slate-600/90 bg-[repeating-linear-gradient(45deg,transparent,transparent_4px,rgba(100,116,139,0.25)_4px,rgba(100,116,139,0.25)_8px)] dark:bg-[repeating-linear-gradient(45deg,transparent,transparent_4px,rgba(71,85,105,0.4)_4px,rgba(71,85,105,0.4)_8px)] bg-slate-200/80 dark:bg-slate-800/80">
            <div className="absolute right-0 top-[32%] h-[10%] w-[8%] border-2 border-l-0 border-slate-600/90 rounded-r-sm flex items-center justify-center">
              <span className="text-[0.5rem] font-bold text-slate-600 dark:text-slate-400">‖</span>
            </div>
            <div className="absolute right-0 top-[52%] h-[10%] w-[8%] border-2 border-l-0 border-slate-600/90 rounded-r-sm flex items-center justify-center">
              <span className="text-[0.5rem] font-bold text-slate-600 dark:text-slate-400">‖</span>
            </div>
            <div className="absolute left-1/2 top-[88%] -translate-x-1/2 text-[0.72rem] font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100">
              {t('inventory.outsideWarehouse.factory')}
            </div>
          </div>

          <div className="absolute left-[20%] top-[52%] h-[8%] w-[12%] rounded-full border-2 border-slate-500/60 bg-slate-400/25 dark:bg-slate-600/20" />
          <div className="absolute left-[28%] top-[48%] h-[6%] w-[8%] rounded-sm border-2 border-slate-600/90 bg-slate-200/95 dark:border-slate-500 dark:bg-slate-800/90 z-10">
            <div className="absolute left-1/2 top-1/2 h-[55%] w-[45%] -translate-x-1/2 -translate-y-1/2 rounded-sm border border-slate-500/70 bg-slate-300/80 dark:bg-slate-700" />
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[0.58rem] font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100 z-10">
              Hantar
            </div>
          </div>

          <div className="absolute left-[38%] top-[42%] h-[32%] w-[24%] rounded-sm border-2 border-slate-600/90 bg-slate-200/90 dark:border-slate-500 dark:bg-slate-800/80">
            <div className="absolute bottom-0 left-[28%] h-[14%] w-[18%] border-2 border-t-0 border-slate-600/90 rounded-b-sm flex items-center justify-center">
              <span className="text-[0.5rem] font-bold text-slate-600 dark:text-slate-400">‖</span>
            </div>
            <div className="absolute bottom-0 right-[28%] h-[14%] w-[18%] border-2 border-t-0 border-slate-600/90 rounded-b-sm flex items-center justify-center">
              <span className="text-[0.5rem] font-bold text-slate-600 dark:text-slate-400">‖</span>
            </div>
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[0.85rem] font-bold uppercase tracking-[0.15em] text-slate-800 dark:text-slate-100">
              {t('inventory.outsideWarehouse.depot')}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setPortalOpen(true)}
            className="group absolute left-[38%] top-[6%] h-[32%] w-[42%] cursor-pointer rounded-md border-2 border-cyan-500/80 bg-slate-100/95 text-left shadow-sm transition-all duration-200 hover:border-cyan-400 hover:shadow-md active:scale-[0.99] active:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 dark:border-cyan-400/70 dark:bg-slate-800/90 dark:focus-visible:ring-offset-slate-900"
            aria-label={t('inventory.outsideWarehouse.portalClickArea')}
          >
            <Badge variant="secondary" className="absolute right-2 top-2 text-[0.6rem] font-bold uppercase tracking-wider border-cyan-500/40 bg-cyan-500/15 text-cyan-800 dark:bg-cyan-400/20 dark:text-cyan-200">
              {t('inventory.outsideWarehouse.clickable')}
            </Badge>
            <div className="absolute left-[4%] right-[4%] top-[10%] grid grid-cols-4 grid-rows-10 gap-1">
              {Array.from({ length: 40 }).map((_, i) => {
                const row = Math.floor(i / 4);
                const col = i % 4;
                const labels: Record<number, string> = { 0: 'P1', 1: 'P2', 3: 'P4' };
                const hasX = row % 2 === 1 && col % 2 === 0;
                const label = row === 0 && labels[col] ? labels[col] : null;
                return (
                  <div
                    key={i}
                    className="flex items-center justify-center rounded-[2px] border border-slate-500/70 bg-slate-200/90 transition-colors group-hover:border-cyan-400/70 group-hover:bg-cyan-100/80 dark:border-slate-600 dark:bg-slate-700 dark:group-hover:border-cyan-500/50 dark:group-hover:bg-cyan-900/40"
                  >
                    {label && <span className="text-[0.5rem] font-bold text-slate-700 dark:text-slate-200">{label}</span>}
                    {!label && hasX && <span className="text-[0.55rem] font-bold text-slate-500 dark:text-slate-400">×</span>}
                  </div>
                );
              })}
            </div>
            <div className="absolute bottom-[6%] left-1/2 -translate-x-1/2 text-center">
              <span className="block text-[0.6rem] font-bold uppercase tracking-wider text-cyan-800 dark:text-cyan-200">
                {t('inventory.outsideWarehouse.portalArea')}
              </span>
              <span className="block text-[0.5rem] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                Specialized sheet metal storage rack area
              </span>
            </div>
          </button>

          <div className="absolute right-[5%] top-[8%] flex gap-3">
            <div className="flex flex-col gap-1.5">
              <div className="flex gap-1.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-slate-600/90 bg-slate-200/90 text-[0.5rem] font-bold text-slate-700 dark:border-slate-500 dark:bg-slate-800 dark:text-slate-200">
                  TKM
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-slate-600/90 bg-slate-200/90 text-[0.5rem] font-bold text-slate-700 dark:border-slate-500 dark:bg-slate-800 dark:text-slate-200">
                  TKM
                </div>
              </div>
              <div className="grid grid-cols-2 gap-1">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-6 w-6 rounded-[2px] border border-slate-600/90 bg-slate-200/90 dark:border-slate-500 dark:bg-slate-800" />
                ))}
              </div>
              <div className="flex gap-1.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-slate-600/90 bg-slate-200/90 text-[0.5rem] font-bold text-slate-700 dark:border-slate-500 dark:bg-slate-800 dark:text-slate-200">
                  TKM
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-slate-600/90 bg-slate-200/90 text-[0.5rem] font-bold text-slate-700 dark:border-slate-500 dark:bg-slate-800 dark:text-slate-200">
                  TKM
                </div>
              </div>
              <div className="flex gap-1">
                <div className="h-6 w-8 rounded-[2px] border border-slate-600/90 bg-slate-200/90 dark:border-slate-500 dark:bg-slate-800" />
                <div className="h-6 w-8 rounded-[2px] border border-slate-600/90 bg-slate-200/90 dark:border-slate-500 dark:bg-slate-800" />
              </div>
            </div>
          </div>

          <div className="absolute left-[4%] top-[22%] h-2 w-2 rounded-full border border-slate-500/60 bg-slate-400/40 dark:bg-slate-500/30" />
          <div className="absolute left-[6%] top-[58%] h-1.5 w-1.5 rounded-full border border-slate-500/60 bg-slate-400/40 dark:bg-slate-500/30" />
          <div className="absolute left-[35%] top-[78%] h-1.5 w-1.5 rounded-full border border-slate-500/60 bg-slate-400/40 dark:bg-slate-500/30" />

          <div className="absolute right-[4%] top-[4%] flex flex-col items-center gap-0.5">
            <span className="text-[0.55rem] font-semibold tracking-widest text-slate-600 dark:text-slate-300">N</span>
            <div className="h-5 w-5 rounded-full border-2 border-slate-600/80 flex items-center justify-center bg-white/50 dark:border-slate-500 dark:bg-slate-800/50">
              <div className="h-0 w-0 border-x-2 border-b-4 border-x-transparent border-b-slate-600 dark:border-b-cyan-400" />
            </div>
          </div>

          <div className="absolute bottom-[3%] left-[3%] flex items-center gap-2 rounded border border-slate-500/80 bg-white/95 px-2 py-1 shadow-sm dark:border-slate-600 dark:bg-slate-800/90">
            <div className="flex h-1.5 w-10 items-center justify-between border-b-2 border-slate-600 dark:border-slate-400">
              <span className="text-[0.45rem] font-semibold text-slate-600 dark:text-slate-300">0</span>
              <span className="text-[0.45rem] font-semibold text-slate-600 dark:text-slate-300">5m</span>
            </div>
            <span className="text-[0.5rem] font-semibold text-slate-700 dark:text-slate-200">Scale 1:100</span>
          </div>
          <div className="absolute bottom-[3%] right-[3%] rounded border border-slate-500/80 bg-white/95 px-3 py-2 shadow-sm dark:border-slate-600 dark:bg-slate-800/90 text-right space-y-0.5">
            <p className="text-[0.6rem] font-bold uppercase tracking-wide text-slate-800 dark:text-slate-100">
              General layout plan
            </p>
            <p className="text-[0.45rem] text-slate-600 dark:text-slate-400">
              {t('inventory.outsideWarehouse.drawnBy')} / Date / Rev. A
            </p>
            <p className="text-[0.45rem] font-medium text-slate-700 dark:text-slate-300">
              1:100 (Illustrative)
            </p>
          </div>
        </div>
        </CardContent>
      </Card>

      {(portalOpen || isPortalClosing) && (
        <div
          className={`fixed inset-0 z-50 flex flex-col bg-background ${isPortalClosing ? 'portal-overlay-exit' : 'portal-overlay-enter'}`}
          aria-modal="true"
          role="dialog"
          aria-label={t('inventory.outsideWarehouse.portalSchema')}
        >
          <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <Card>
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg">
                {t('inventory.outsideWarehouse.portalSchema')}
              </CardTitle>
              <CardDescription>
                {t(
                  'inventory.outsideWarehouse.portalSchemaHint',
                )}
              </CardDescription>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setShowAddProduct((prev) => !prev)}
                className="border-cyan-500/40 bg-cyan-500/10 text-cyan-700 hover:bg-cyan-500/20 dark:border-cyan-400/30 dark:bg-cyan-400/10 dark:text-cyan-300 dark:hover:bg-cyan-400/20"
              >
                {t('inventory.outsideWarehouse.addProduct')}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsPortalClosing(true)}
              >
                {t('common.close')}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {showAddProduct && (
              <div className="grid gap-3 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4 dark:border-cyan-400/20 dark:bg-cyan-950/30 md:grid-cols-[1fr_1fr_100px_auto]">
                <Combobox
                  options={stockOptions}
                  value={selectedCatalogCode}
                  onValueChange={setSelectedCatalogCode}
                  placeholder={t('inventory.outsideWarehouse.selectStock')}
                  searchPlaceholder={t('inventory.outsideWarehouse.searchStock')}
                  emptyText={t('common.notFound')}
                />
                <Combobox
                  options={serialOptions}
                  value={selectedSerialNo}
                  onValueChange={setSelectedSerialNo}
                  placeholder={t('inventory.outsideWarehouse.selectSerial')}
                  searchPlaceholder={t('inventory.outsideWarehouse.searchSerial')}
                  emptyText={t('common.notFound')}
                  disabled={serialOptions.length === 0}
                />
                <Input
                  type="number"
                  min={1}
                  value={addQty}
                  onChange={(e) => setAddQty(Number(e.target.value))}
                  placeholder={t('inventory.outsideWarehouse.qty')}
                  className="h-9"
                />
                <Button type="button" size="sm" onClick={handleAddProduct} className="h-9">
                  {t('inventory.outsideWarehouse.addToRegion')}
                </Button>
              </div>
            )}

            <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
              <Card className="border-slate-200/80 bg-slate-50/50 dark:border-white/10 dark:bg-slate-900/30">
                <CardContent className="p-3">
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
                    {portalSlots.map((slot) => {
                      const isSelected = slot.slot === selectedSlot;
                      const hasProducts = slot.products.length > 0;
                      return (
                        <button
                          key={slot.slot}
                          type="button"
                          onClick={() => setSelectedSlot(slot.slot)}
                          className={`rounded-lg border-2 px-2 py-2.5 text-center text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 ${
                            isSelected
                              ? 'border-cyan-500 bg-cyan-100 text-cyan-900 shadow-sm dark:border-cyan-400 dark:bg-cyan-900/40 dark:text-cyan-100'
                              : hasProducts
                                ? 'border-emerald-400/60 bg-emerald-50 text-emerald-800 hover:border-cyan-400/80 hover:bg-cyan-50 dark:border-emerald-500/40 dark:bg-emerald-900/25 dark:text-emerald-200 dark:hover:border-cyan-500/50 dark:hover:bg-cyan-900/30'
                                : 'border-slate-200 bg-white text-slate-600 hover:border-cyan-300 hover:bg-cyan-50/50 hover:text-cyan-800 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400 dark:hover:border-cyan-500/40 dark:hover:bg-cyan-900/20'
                          }`}
                        >
                          {slot.slot}
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200/80 dark:border-white/10 dark:bg-slate-900/30 flex flex-col max-h-[70vh]">
                <CardHeader className="pb-2 shrink-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <CardTitle className="text-sm">
                      {t('inventory.outsideWarehouse.selectedArea')}: {selectedSlotDetail.slot}
                    </CardTitle>
                    <Badge variant="secondary" className="text-[10px] font-semibold">
                      {selectedSlotDetail.products.length} {t('inventory.outsideWarehouse.product')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 overflow-y-auto min-h-0 flex-1">
                  {selectedSlotDetail.products.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      {t('inventory.outsideWarehouse.emptyRack')}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {selectedSlotDetail.products.map((product) => (
                        <Card key={product.serialNo} className="overflow-hidden border-slate-200/80 dark:border-white/10">
                          <CardContent className="p-3">
                            <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">{product.name}</p>
                            <p className="mt-0.5 text-[11px] text-muted-foreground">
                              {product.code} • {t('inventory.outsideWarehouse.serialNo')}: {product.serialNo} • {t('inventory.outsideWarehouse.qty')}: {product.qty} {product.unit}
                            </p>
                            <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                              <Combobox
                                options={portalSlots
                                  .filter((slot) => slot.slot !== selectedSlot)
                                  .map((slot) => ({ value: slot.slot, label: slot.slot }))}
                                value={
                                  moveTargets[product.serialNo] ??
                                  portalSlots.find((slot) => slot.slot !== selectedSlot)?.slot ??
                                  selectedSlot
                                }
                                onValueChange={(value) =>
                                  setMoveTargets((prev) => ({ ...prev, [product.serialNo]: value }))
                                }
                                placeholder={t('inventory.outsideWarehouse.selectRack')}
                                searchPlaceholder={t('inventory.outsideWarehouse.searchRack')}
                                emptyText={t('common.notFound')}
                                listClassName="max-h-[180px]"
                                className="h-8 min-w-0 w-full sm:flex-1 text-[11px]"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-8 border-amber-400/50 bg-amber-50 px-2.5 text-[11px] font-semibold text-amber-800 hover:bg-amber-100 dark:border-amber-500/40 dark:bg-amber-900/20 dark:text-amber-200 dark:hover:bg-amber-900/35"
                                onClick={() => openConfirmMove(product)}
                              >
                                {t('inventory.outsideWarehouse.move')}
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-8 border-rose-400/50 bg-rose-50 px-2.5 text-[11px] font-semibold text-rose-800 hover:bg-rose-100 dark:border-rose-500/40 dark:bg-rose-900/20 dark:text-rose-200 dark:hover:bg-rose-900/35"
                                onClick={() => openConfirmRemove(product.serialNo)}
                              >
                                {t('inventory.outsideWarehouse.remove')}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
          </div>
        </div>
      )}
    </div>
  );
}
