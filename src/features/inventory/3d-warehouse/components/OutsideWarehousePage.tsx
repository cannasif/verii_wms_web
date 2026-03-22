import { type ReactElement, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
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
import { GripVertical } from 'lucide-react';

type ProductType = 'solar-panel' | 'solar-frame' | 'galv-pipe' | 'sheet-metal' | 'alum-profile';

interface ProductVisual {
  color: string;
  bgColor: string;
  borderColor: string;
  labelKey: string;
}

interface ProductImage {
  url: string;
  alt: string;
}

interface PortalProduct {
  code: string;
  name: string;
  serialNo: string;
  qty: number;
  unit: string;
  type: ProductType;
}

interface DemoProduct {
  code: string;
  name: string;
  unit: string;
  type: ProductType;
  serialNos: string[];
}

interface PortalSlotDetail {
  slot: string;
  products: PortalProduct[];
}

const PRODUCT_TYPE_VISUALS: Record<ProductType, ProductVisual> = {
  'solar-panel':  { color: '#f59e0b', bgColor: 'rgba(245,158,11,0.14)', borderColor: 'rgba(245,158,11,0.45)', labelKey: 'inventory.outsideWarehouse.typeSolarPanel' },
  'solar-frame':  { color: '#34d399', bgColor: 'rgba(52,211,153,0.12)', borderColor: 'rgba(52,211,153,0.40)', labelKey: 'inventory.outsideWarehouse.typeSolarFrame' },
  'galv-pipe':    { color: '#60a5fa', bgColor: 'rgba(96,165,250,0.13)', borderColor: 'rgba(96,165,250,0.42)', labelKey: 'inventory.outsideWarehouse.typeGalvPipe' },
  'sheet-metal':  { color: '#94a3b8', bgColor: 'rgba(148,163,184,0.11)', borderColor: 'rgba(148,163,184,0.38)', labelKey: 'inventory.outsideWarehouse.typeSheetMetal' },
  'alum-profile': { color: '#c4b5fd', bgColor: 'rgba(196,181,253,0.11)', borderColor: 'rgba(196,181,253,0.38)', labelKey: 'inventory.outsideWarehouse.typeAlumProfile' },
};

const PRODUCT_TYPE_IMAGES: Record<ProductType, ProductImage> = {
  'solar-panel': {
    url: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=600&q=80',
    alt: 'Solar panel modules on metal structure',
  },
  'solar-frame': {
    url: 'https://images.unsplash.com/photo-1592839716176-6c11b22a8906?auto=format&fit=crop&w=600&q=80',
    alt: 'Metal mounting frame for solar panels',
  },
  'galv-pipe': {
    url: 'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=600&q=80',
    alt: 'Stack of galvanized steel pipes in warehouse',
  },
  'sheet-metal': {
    url: 'https://images.unsplash.com/photo-1588200908342-23b585c03e26?auto=format&fit=crop&w=600&q=80',
    alt: 'Sheet metal plates stacked on pallet',
  },
  'alum-profile': {
    url: 'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=600&q=80',
    alt: 'Aluminium profiles stacked in industrial rack',
  },
};

function ProductTypeImage({
  type,
  size = 32,
  rounded = true,
}: {
  type: ProductType;
  size?: number;
  rounded?: boolean;
}): ReactElement {
  const img = PRODUCT_TYPE_IMAGES[type];
  const radius = rounded ? 6 : 2;

  return (
    <div
      style={{
        width: size,
        height: Math.round(size * 0.72),
        borderRadius: radius,
        overflow: 'hidden',
        border: `1px solid ${PRODUCT_TYPE_VISUALS[type].borderColor}`,
        backgroundColor: PRODUCT_TYPE_VISUALS[type].bgColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <img
        src={img.url}
        alt={img.alt}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
          filter: 'saturate(1.05) contrast(1.05)',
        }}
      />
    </div>
  );
}

const PORTAL_SLOT_ROWS = ['A', 'B', 'C', 'D'] as const;
const PORTAL_SLOT_COLS = [11, 12, 13, 14, 15, 16] as const;

const PORTAL_PRODUCTS: Record<string, PortalProduct[]> = {
  A11: [
    { code: 'SP-400W-M6', name: 'Güneş Paneli 400W', serialNo: 'GP-A11-001', qty: 24, unit: 'Adet', type: 'solar-panel' },
    { code: 'SP-600W-M8', name: 'Güneş Paneli 600W', serialNo: 'GP-A11-042', qty: 12, unit: 'Adet', type: 'solar-panel' },
  ],
  A12: [
    { code: 'GB-2IN-6M', name: 'Galvaniz Boru 2" x 6m', serialNo: 'GB-A12-018', qty: 60, unit: 'Adet', type: 'galv-pipe' },
  ],
  B13: [
    { code: 'SF-AL40-3M', name: 'Solar Montaj Çerçevesi', serialNo: 'SC-B13-005', qty: 40, unit: 'Adet', type: 'solar-frame' },
    { code: 'SF-AL60-3M', name: 'Solar Ray Profili 60mm', serialNo: 'SR-B13-011', qty: 80, unit: 'Adet', type: 'solar-frame' },
  ],
  B15: [
    { code: 'SL-2MM-1250', name: 'Sac Levha 2mm 1250x2500', serialNo: 'SL-B15-003', qty: 15, unit: 'Plaka', type: 'sheet-metal' },
  ],
  C11: [
    { code: 'AP-40X40-6M', name: 'Alüminyum Profil 40x40', serialNo: 'AP-C11-021', qty: 50, unit: 'Adet', type: 'alum-profile' },
  ],
  C14: [
    { code: 'SP-400W-M6', name: 'Güneş Paneli 400W', serialNo: 'GP-C14-033', qty: 18, unit: 'Adet', type: 'solar-panel' },
  ],
  D12: [
    { code: 'SL-1MM-1000', name: 'Sac Levha 1mm 1000x2000', serialNo: 'SL-D12-007', qty: 30, unit: 'Plaka', type: 'sheet-metal' },
    { code: 'SL-3MM-1500', name: 'Sac Levha 3mm 1500x3000', serialNo: 'SL-D12-022', qty: 8,  unit: 'Plaka', type: 'sheet-metal' },
  ],
  D16: [
    { code: 'GB-4IN-6M', name: 'Galvaniz Boru 4" x 6m', serialNo: 'GB-D16-002', qty: 20, unit: 'Adet', type: 'galv-pipe' },
  ],
};

const DEMO_PRODUCT_CATALOG: DemoProduct[] = [
  { code: 'SP-400W-M6',  name: 'Güneş Paneli 400W Monokristal',  unit: 'Adet', type: 'solar-panel',  serialNos: ['GP-NEW-A001','GP-NEW-A002','GP-NEW-A003'] },
  { code: 'SP-600W-M8',  name: 'Güneş Paneli 600W Bifacial',     unit: 'Adet', type: 'solar-panel',  serialNos: ['GP-NEW-B004','GP-NEW-B005'] },
  { code: 'SF-AL40-3M',  name: 'Solar Montaj Çerçevesi 40mm',    unit: 'Adet', type: 'solar-frame',  serialNos: ['SC-NEW-C006','SC-NEW-C007','SC-NEW-C008'] },
  { code: 'SF-AL60-3M',  name: 'Solar Ray Profili 60mm',         unit: 'Adet', type: 'solar-frame',  serialNos: ['SR-NEW-D009','SR-NEW-D010'] },
  { code: 'GB-2IN-6M',   name: 'Galvaniz Boru 2" x 6m',         unit: 'Adet', type: 'galv-pipe',    serialNos: ['GB-NEW-E011','GB-NEW-E012','GB-NEW-E013'] },
  { code: 'GB-4IN-6M',   name: 'Galvaniz Boru 4" x 6m',         unit: 'Adet', type: 'galv-pipe',    serialNos: ['GB-NEW-F014','GB-NEW-F015'] },
  { code: 'SL-2MM-1250', name: 'Sac Levha 2mm 1250x2500',        unit: 'Plaka', type: 'sheet-metal', serialNos: ['SL-NEW-G016','SL-NEW-G017'] },
  { code: 'SL-1MM-1000', name: 'Sac Levha 1mm 1000x2000',        unit: 'Plaka', type: 'sheet-metal', serialNos: ['SL-NEW-H018','SL-NEW-H019','SL-NEW-H020'] },
  { code: 'AP-40X40-6M', name: 'Alüminyum Profil 40x40 x 6m',   unit: 'Adet', type: 'alum-profile', serialNos: ['AP-NEW-I021','AP-NEW-I022'] },
];

const BP = {
  bg: '#091525',
  bgCard: 'rgba(9,21,37,0.92)',
  line: '#4a85a8',
  lineLight: 'rgba(74,133,168,0.35)',
  lineMid: 'rgba(74,133,168,0.55)',
  wallFill: 'rgba(22,55,90,0.55)',
  wallHatch: 'repeating-linear-gradient(45deg,rgba(90,155,194,0.12) 0px,rgba(90,155,194,0.12) 1px,transparent 1px,transparent 5px)',
  textPrimary: '#c8e6f0',
  textMid: '#7ec0d8',
  textDim: '#3d7aa0',
  cyan: '#22d3ee',
  cyanFill: 'rgba(34,211,238,0.12)',
  gridDot: 'rgba(70,140,180,0.18)',
} as const;

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
  const [addTypeFilter, setAddTypeFilter] = useState<ProductType | 'all'>('all');
  const [moveTargets, setMoveTargets] = useState<Record<string, string>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmType, setConfirmType] = useState<'remove' | 'move' | null>(null);
  const [confirmPayload, setConfirmPayload] = useState<{ serialNo?: string; product?: PortalProduct }>({});
  const [isPortalClosing, setIsPortalClosing] = useState(false);

  const [draggingProduct, setDraggingProduct] = useState<PortalProduct | null>(null);
  const [draggingFromSlot, setDraggingFromSlot] = useState<string | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<string | null>(null);
  const dragLeaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, product: PortalProduct): void => {
    setDraggingProduct(product);
    setDraggingFromSlot(selectedSlot);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', product.serialNo);
  };

  const handleDragEnd = (): void => {
    setDraggingProduct(null);
    setDraggingFromSlot(null);
    setDragOverSlot(null);
  };

  const handleSlotDragOver = (e: React.DragEvent<HTMLButtonElement>, slot: string): void => {
    e.preventDefault();
    if (dragLeaveTimerRef.current) {
      clearTimeout(dragLeaveTimerRef.current);
      dragLeaveTimerRef.current = null;
    }
    e.dataTransfer.dropEffect = 'move';
    setDragOverSlot(slot);
  };

  const handleSlotDragLeave = (): void => {
    dragLeaveTimerRef.current = setTimeout(() => {
      setDragOverSlot(null);
    }, 50);
  };

  const handleSlotDrop = (e: React.DragEvent<HTMLButtonElement>, targetSlot: string): void => {
    e.preventDefault();
    if (dragLeaveTimerRef.current) {
      clearTimeout(dragLeaveTimerRef.current);
      dragLeaveTimerRef.current = null;
    }
    setDragOverSlot(null);

    if (!draggingProduct || !draggingFromSlot || targetSlot === draggingFromSlot) {
      setDraggingProduct(null);
      setDraggingFromSlot(null);
      return;
    }

    setInventoryBySlot((prev) => ({
      ...prev,
      [draggingFromSlot]: (prev[draggingFromSlot] ?? []).filter(
        (item) => item.serialNo !== draggingProduct.serialNo,
      ),
      [targetSlot]: [...(prev[targetSlot] ?? []), draggingProduct],
    }));
    setSelectedSlot(targetSlot);
    setDraggingProduct(null);
    setDraggingFromSlot(null);
  };

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
      type: product.type,
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

  const totalOccupied = portalSlots.filter((s) => s.products.length > 0).length;
  const totalSlots = portalSlots.length;

  return (
    <div className="crm-page w-full space-y-6">
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent showCloseButton={true} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {confirmType === 'remove' && t('inventory.outsideWarehouse.confirmRemoveTitle')}
              {confirmType === 'move' && t('inventory.outsideWarehouse.confirmMoveTitle')}
            </DialogTitle>
            <DialogDescription>
              {confirmType === 'remove' && t('inventory.outsideWarehouse.confirmRemoveMessage')}
              {confirmType === 'move' && t('inventory.outsideWarehouse.confirmMoveMessage')}
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
            {t('inventory.outsideWarehouse.subtitle')}
          </p>
        </div>
      </div>

      <Card className="overflow-hidden border-slate-200 dark:border-slate-700/60">
        <CardContent className="p-0">
          <div
            className="relative mx-auto w-full overflow-hidden select-none"
            style={{
              aspectRatio: '16 / 9',
              background: BP.bg,
              fontFamily: '"Courier New", Courier, monospace',
            }}
          >
            {/* ── Blueprint dot grid ── */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: `radial-gradient(circle, ${BP.gridDot} 1px, transparent 1px)`,
                backgroundSize: '3.33% 4.44%',
              }}
            />

            {/* ── Outer frame ── */}
            <div
              className="absolute pointer-events-none"
              style={{ inset: '1%', border: `1px solid ${BP.lineLight}` }}
            />
            {/* ── Inner drawing frame ── */}
            <div
              className="absolute pointer-events-none"
              style={{ inset: '2.2%', bottom: '11%', border: `2px solid ${BP.line}` }}
            />

            {/* ── Grid col references (A–J) ── */}
            <div
              className="absolute pointer-events-none"
              style={{
                top: '1%',
                left: '2.2%',
                right: '2.2%',
                height: '1.2%',
                display: 'flex',
              }}
            >
              {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'].map((l, i) => (
                <div
                  key={l}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderLeft: i === 0 ? `1px solid ${BP.lineLight}` : 'none',
                    borderRight: `1px solid ${BP.lineLight}`,
                    fontSize: '0.42rem',
                    color: BP.textDim,
                    fontWeight: 700,
                    letterSpacing: '0.05em',
                  }}
                >
                  {l}
                </div>
              ))}
            </div>

            {/* ── Grid row references (1–5) ── */}
            <div
              className="absolute pointer-events-none"
              style={{
                left: '1%',
                width: '1.2%',
                top: '2.2%',
                bottom: '11%',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {['1', '2', '3', '4', '5'].map((n, i) => (
                <div
                  key={n}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderTop: i === 0 ? `1px solid ${BP.lineLight}` : 'none',
                    borderBottom: `1px solid ${BP.lineLight}`,
                    fontSize: '0.42rem',
                    color: BP.textDim,
                    fontWeight: 700,
                  }}
                >
                  {n}
                </div>
              ))}
            </div>

            {/* ════════════════════════════════════════
                NORTH ARROW
            ════════════════════════════════════════ */}
            <div
              className="absolute pointer-events-none"
              style={{ right: '3.2%', top: '3.5%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}
            >
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  border: `1.5px solid ${BP.line}`,
                  borderRadius: '50%',
                  background: BP.bgCard,
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    bottom: '50%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 0,
                    height: 0,
                    borderLeft: '4px solid transparent',
                    borderRight: '4px solid transparent',
                    borderBottom: `10px solid ${BP.cyan}`,
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 0,
                    height: 0,
                    borderLeft: '4px solid transparent',
                    borderRight: '4px solid transparent',
                    borderTop: `10px solid ${BP.lineMid}`,
                  }}
                />
              </div>
              <span style={{ color: BP.cyan, fontSize: '0.42rem', fontWeight: 700, letterSpacing: '0.12em' }}>N</span>
            </div>

            {/* ════════════════════════════════════════
                SECURITY CABIN
            ════════════════════════════════════════ */}
            <div
              className="absolute"
              style={{
                left: '4%',
                top: '5%',
                width: '9.5%',
                height: '14%',
                border: `2px solid ${BP.line}`,
                background: BP.wallFill,
              }}
            >
              <div className="absolute inset-0" style={{ backgroundImage: BP.wallHatch }} />
              {/* door gap bottom-center */}
              <div style={{ position: 'absolute', bottom: -2, left: '38%', width: '18%', height: 3, background: BP.bg }} />
              {/* door swing arc */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: '38%',
                  width: '22%',
                  height: '28%',
                  borderTop: `1px solid ${BP.line}`,
                  borderRight: `1px solid ${BP.line}`,
                  borderRadius: '0 100% 0 0',
                }}
              />
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{ paddingBottom: '15%' }}
              >
                <span
                  style={{
                    color: BP.textPrimary,
                    fontSize: '0.55rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    textAlign: 'center',
                    lineHeight: 1.3,
                  }}
                >
                  {t('inventory.outsideWarehouse.security')}
                </span>
              </div>
              {/* Label tag */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '-14%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  whiteSpace: 'nowrap',
                  color: BP.textDim,
                  fontSize: '0.38rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                }}
              >
                SEC-01
              </div>
            </div>

            {/* ════════════════════════════════════════
                PARKING ZONE
            ════════════════════════════════════════ */}
            <div
              className="absolute"
              style={{
                left: '15.5%',
                top: '5%',
                width: '18%',
                height: '18%',
                border: `2px solid ${BP.line}`,
                background: 'rgba(15,40,70,0.3)',
              }}
            >
              {/* Entry gap top */}
              <div style={{ position: 'absolute', top: -2, left: '30%', width: '40%', height: 3, background: BP.bg }} />
              {/* Stalls */}
              <div
                style={{
                  position: 'absolute',
                  inset: '15% 5% 20%',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4,1fr)',
                  gridTemplateRows: 'repeat(2,1fr)',
                  gap: '2px',
                }}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <div
                    key={n}
                    style={{
                      border: `1px solid ${BP.lineMid}`,
                      background: 'rgba(40,90,130,0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.48rem',
                      color: BP.textMid,
                      fontWeight: 700,
                    }}
                  >
                    {n}
                  </div>
                ))}
              </div>
              {/* Aisle divider */}
              <div
                style={{
                  position: 'absolute',
                  top: '56%',
                  left: 0,
                  right: 0,
                  borderTop: `1px dashed ${BP.lineLight}`,
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: '4%',
                  left: 0,
                  right: 0,
                  textAlign: 'center',
                  color: BP.textMid,
                  fontSize: '0.5rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                {t('inventory.outsideWarehouse.parking')}
              </div>
            </div>

            {/* ════════════════════════════════════════
                FACTORY BUILDING
            ════════════════════════════════════════ */}
            <div
              className="absolute"
              style={{
                left: '4%',
                top: '27%',
                width: '13%',
                height: '44%',
                border: `2px solid ${BP.line}`,
                background: BP.wallFill,
              }}
            >
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(135deg,rgba(90,155,194,0.1) 0px,rgba(90,155,194,0.1) 1px,transparent 1px,transparent 6px)',
                }}
              />
              {/* Window symbols on right wall */}
              {[22, 42, 62].map((top) => (
                <div
                  key={top}
                  style={{
                    position: 'absolute',
                    right: -3,
                    top: `${top}%`,
                    width: 4,
                    height: '7%',
                    border: `1px solid ${BP.line}`,
                    background: 'rgba(180,220,240,0.18)',
                  }}
                />
              ))}
              {/* Door gap bottom-right */}
              <div style={{ position: 'absolute', right: -2, bottom: '10%', width: 3, height: '12%', background: BP.bg }} />
              {/* Door arc */}
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  bottom: '10%',
                  width: '12%',
                  height: '12%',
                  borderTop: `1px solid ${BP.line}`,
                  borderLeft: `1px solid ${BP.line}`,
                  borderRadius: '100% 0 0 0',
                }}
              />
              {/* Center crosshair lines */}
              <div
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: 0,
                  bottom: 0,
                  borderLeft: `1px dashed ${BP.lineLight}`,
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: 0,
                  right: 0,
                  borderTop: `1px dashed ${BP.lineLight}`,
                }}
              />
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{ paddingBottom: '15%' }}
              >
                <span
                  style={{
                    color: BP.textPrimary,
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                    writingMode: 'vertical-rl',
                    transform: 'rotate(180deg)',
                  }}
                >
                  {t('inventory.outsideWarehouse.factory')}
                </span>
              </div>
            </div>

            {/* ── Dimension: Factory height ── */}
            <div
              className="absolute pointer-events-none"
              style={{
                left: '2.4%',
                top: '27%',
                width: '1.4%',
                height: '44%',
                borderTop: `1px solid ${BP.lineMid}`,
                borderBottom: `1px solid ${BP.lineMid}`,
                borderLeft: `1px solid ${BP.lineMid}`,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <span
                style={{
                  color: BP.lineMid,
                  fontSize: '0.36rem',
                  transform: 'rotate(-90deg)',
                  whiteSpace: 'nowrap',
                  marginLeft: '-10px',
                  letterSpacing: '0.05em',
                }}
              >
                22.0 M
              </span>
            </div>

            {/* ════════════════════════════════════════
                ROAD / CIRCULATION CENTERLINES
            ════════════════════════════════════════ */}
            <div
              className="absolute pointer-events-none"
              style={{
                left: '15.5%',
                top: '25%',
                width: 0,
                height: '62%',
                borderLeft: `1px dashed ${BP.lineLight}`,
              }}
            />
            <div
              className="absolute pointer-events-none"
              style={{
                left: '17%',
                top: '26%',
                width: '21%',
                height: 0,
                borderTop: `1px dashed ${BP.lineLight}`,
              }}
            />

            {/* ════════════════════════════════════════
                ROUNDABOUT
            ════════════════════════════════════════ */}
            <div
              className="absolute"
              style={{
                left: '19.5%',
                top: '52%',
                width: '10%',
                height: '9%',
                border: `1.5px solid ${BP.lineMid}`,
                borderRadius: '50%',
                background: 'rgba(15,40,70,0.2)',
              }}
            />
            <div
              className="absolute"
              style={{
                left: '21.5%',
                top: '54.5%',
                width: '6%',
                height: '4%',
                border: `1px solid ${BP.lineLight}`,
                borderRadius: '50%',
                background: 'rgba(10,30,55,0.4)',
              }}
            />

            {/* ════════════════════════════════════════
                HANGAR
            ════════════════════════════════════════ */}
            <div
              className="absolute"
              style={{
                left: '27%',
                top: '46%',
                width: '9%',
                height: '9%',
                border: `2px solid ${BP.line}`,
                background: BP.wallFill,
              }}
            >
              <div className="absolute inset-0" style={{ backgroundImage: BP.wallHatch }} />
              {/* Rolling door symbol */}
              <div
                style={{
                  position: 'absolute',
                  bottom: -2,
                  left: '15%',
                  width: '70%',
                  height: 2,
                  background: BP.bg,
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: '15%',
                  width: '70%',
                  borderBottom: `2px solid ${BP.line}`,
                }}
              />
              {[25, 50, 75].map((x) => (
                <div
                  key={x}
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: `${x}%`,
                    width: 0,
                    height: '20%',
                    borderLeft: `1px solid ${BP.lineMid}`,
                  }}
                />
              ))}
              <div className="absolute inset-0 flex items-center justify-center" style={{ paddingBottom: '15%' }}>
                <span
                  style={{
                    color: BP.textPrimary,
                    fontSize: '0.5rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  HANGAR
                </span>
              </div>
            </div>

            {/* ════════════════════════════════════════
                DEPOT BUILDING
            ════════════════════════════════════════ */}
            <div
              className="absolute"
              style={{
                left: '37%',
                top: '43%',
                width: '22%',
                height: '30%',
                border: `2px solid ${BP.line}`,
                background: BP.wallFill,
              }}
            >
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(45deg,rgba(90,155,194,0.08) 0px,rgba(90,155,194,0.08) 1px,transparent 1px,transparent 7px)',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: 0,
                  bottom: 0,
                  borderLeft: `1px dashed ${BP.lineLight}`,
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: 0,
                  right: 0,
                  borderTop: `1px dashed ${BP.lineLight}`,
                }}
              />
              {/* Two door symbols at bottom */}
              {[22, 55].map((l) => (
                <div key={l}>
                  <div
                    style={{
                      position: 'absolute',
                      bottom: -2,
                      left: `${l}%`,
                      width: '18%',
                      height: 3,
                      background: BP.bg,
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: `${l}%`,
                      width: '18%',
                      height: '18%',
                      borderTop: `1px solid ${BP.line}`,
                      borderRight: `1px solid ${BP.line}`,
                      borderRadius: '0 100% 0 0',
                    }}
                  />
                </div>
              ))}
              <div className="absolute inset-0 flex items-center justify-center">
                <span
                  style={{
                    color: BP.textPrimary,
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.15em',
                  }}
                >
                  {t('inventory.outsideWarehouse.depot')}
                </span>
              </div>
            </div>

            {/* ════════════════════════════════════════
                PORTAL / RACK ZONE  (CLICKABLE)
            ════════════════════════════════════════ */}
            <button
              type="button"
              onClick={() => setPortalOpen(true)}
              className="group absolute cursor-pointer text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-1"
              style={{
                left: '37%',
                top: '5%',
                width: '43%',
                height: '34%',
                border: `2px solid ${BP.cyan}`,
                background: 'rgba(8,35,60,0.6)',
                transition: 'border-color 0.2s, background 0.2s',
                outline: 'none',
              }}
              aria-label={t('inventory.outsideWarehouse.portalClickArea')}
            >
              {/* Hover glow */}
              <div
                className="absolute inset-0 transition-all duration-200 group-hover:bg-cyan-400/5"
              />

              {/* Corner bracket decorations */}
              {(['top-0 left-0', 'top-0 right-0', 'bottom-0 left-0', 'bottom-0 right-0'] as const).map((pos) => (
                <div
                  key={pos}
                  className={`absolute ${pos} pointer-events-none`}
                  style={{ width: 10, height: 10 }}
                />
              ))}
              <div style={{ position: 'absolute', top: 4, left: 4, width: 10, height: 10, borderTop: `2px solid ${BP.cyan}`, borderLeft: `2px solid ${BP.cyan}` }} />
              <div style={{ position: 'absolute', top: 4, right: 4, width: 10, height: 10, borderTop: `2px solid ${BP.cyan}`, borderRight: `2px solid ${BP.cyan}` }} />
              <div style={{ position: 'absolute', bottom: 4, left: 4, width: 10, height: 10, borderBottom: `2px solid ${BP.cyan}`, borderLeft: `2px solid ${BP.cyan}` }} />
              <div style={{ position: 'absolute', bottom: 4, right: 4, width: 10, height: 10, borderBottom: `2px solid ${BP.cyan}`, borderRight: `2px solid ${BP.cyan}` }} />

              {/* CLICKABLE badge */}
              <Badge
                variant="secondary"
                className="absolute left-2 top-2 z-10 border-cyan-500/50 bg-cyan-500/20 text-cyan-300 group-hover:bg-cyan-500/30"
                style={{
                  fontSize: '0.48rem',
                  fontFamily: '"Courier New", Courier, monospace',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                }}
              >
                {t('inventory.outsideWarehouse.clickable')}
              </Badge>

              {/* Occupancy badge */}
              <div
                style={{
                  position: 'absolute',
                  right: '2%',
                  top: '8%',
                  background: 'rgba(34,211,238,0.12)',
                  border: `1px solid rgba(34,211,238,0.4)`,
                  padding: '1px 5px',
                  fontSize: '0.42rem',
                  color: BP.cyan,
                  fontFamily: '"Courier New", Courier, monospace',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  whiteSpace: 'nowrap',
                }}
              >
                {totalOccupied}/{totalSlots} OCC.
              </div>

              {/* Rack grid */}
              <div
                style={{
                  position: 'absolute',
                  top: '18%',
                  bottom: '22%',
                  left: '4%',
                  right: '4%',
                }}
              >
                {/* Row labels */}
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: '10%',
                    bottom: 0,
                    width: '5%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-around',
                    alignItems: 'center',
                  }}
                >
                  {PORTAL_SLOT_ROWS.map((row) => (
                    <span key={row} style={{ color: BP.textMid, fontSize: '0.52rem', fontWeight: 700 }}>
                      {row}
                    </span>
                  ))}
                </div>

                {/* Col labels */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    height: '10%',
                    left: '6%',
                    right: 0,
                    display: 'flex',
                    justifyContent: 'space-around',
                    alignItems: 'center',
                  }}
                >
                  {PORTAL_SLOT_COLS.map((col) => (
                    <span key={col} style={{ color: BP.textMid, fontSize: '0.45rem', fontWeight: 700, flex: 1, textAlign: 'center' }}>
                      {col}
                    </span>
                  ))}
                </div>

                {/* Cells */}
                <div
                  style={{
                    position: 'absolute',
                    top: '12%',
                    left: '6%',
                    right: 0,
                    bottom: 0,
                    display: 'grid',
                    gridTemplateColumns: 'repeat(6,1fr)',
                    gridTemplateRows: 'repeat(4,1fr)',
                    gap: '2px',
                  }}
                >
                  {PORTAL_SLOT_ROWS.flatMap((row) =>
                    PORTAL_SLOT_COLS.map((col) => {
                      const slot = `${row}${col}`;
                      const slotItems = inventoryBySlot[slot] ?? [];
                      const hasProducts = slotItems.length > 0;
                      const slotPrimaryType: ProductType = slotItems[0]?.type ?? 'sheet-metal';
                      return (
                        <div
                          key={slot}
                          style={{
                            border: hasProducts
                              ? `1px solid ${PRODUCT_TYPE_VISUALS[slotPrimaryType].borderColor}`
                              : `1px solid rgba(74,133,168,0.35)`,
                            background: hasProducts
                              ? PRODUCT_TYPE_VISUALS[slotPrimaryType].bgColor
                              : 'rgba(22,55,90,0.25)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative',
                            transition: 'all 0.15s',
                            overflow: 'hidden',
                          }}
                          className={hasProducts ? '' : 'group-hover:border-cyan-400/50 group-hover:bg-cyan-900/20'}
                        >
                          {hasProducts && (
                            <div style={{ transform: 'scale(0.95)' }}>
                              <ProductTypeImage type={slotPrimaryType} size={18} rounded={false} />
                            </div>
                          )}
                          <span
                            style={{
                              position: 'absolute',
                              bottom: '3%',
                              right: '3%',
                              color: hasProducts
                                ? PRODUCT_TYPE_VISUALS[slotPrimaryType].color
                                : BP.textDim,
                              fontSize: '0.28rem',
                              fontWeight: 700,
                              opacity: 0.8,
                            }}
                          >
                            {slot}
                          </span>
                        </div>
                      );
                    }),
                  )}
                </div>
              </div>

              {/* Zone label */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '5%',
                  left: 0,
                  right: 0,
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '1px',
                }}
              >
                <span
                  style={{
                    color: BP.cyan,
                    fontSize: '0.6rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                  }}
                >
                  {t('inventory.outsideWarehouse.portalArea')}
                </span>
                <span
                  style={{
                    color: BP.textDim,
                    fontSize: '0.38rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}
                >
                  SPECIALIZED SHEET METAL RACK AREA — DWG REF: OW-RA-01
                </span>
              </div>
            </button>

            {/* ── Dimension: Rack zone width ── */}
            <div
              className="absolute pointer-events-none"
              style={{
                left: '37%',
                top: '3.2%',
                width: '43%',
                height: '1.5%',
                borderLeft: `1px solid ${BP.lineMid}`,
                borderRight: `1px solid ${BP.lineMid}`,
                borderTop: `1px solid ${BP.lineMid}`,
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'center',
              }}
            >
              <span style={{ color: BP.lineMid, fontSize: '0.38rem', marginTop: '-1px', letterSpacing: '0.06em' }}>
                43.0 M
              </span>
            </div>

            {/* ════════════════════════════════════════
                EQUIPMENT / TKM STORAGE
            ════════════════════════════════════════ */}
            <div
              className="absolute"
              style={{
                right: '3.2%',
                top: '12%',
                display: 'flex',
                flexDirection: 'column',
                gap: '3px',
                alignItems: 'center',
              }}
            >
              <span style={{ color: BP.textDim, fontSize: '0.38rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1px' }}>
                EQP. AREA
              </span>
              <div style={{ display: 'flex', gap: '3px' }}>
                {['TKM-1', 'TKM-2'].map((label) => (
                  <div
                    key={label}
                    style={{
                      width: 26,
                      height: 26,
                      border: `1.5px solid ${BP.line}`,
                      borderRadius: '50%',
                      background: BP.wallFill,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.35rem',
                      color: BP.textMid,
                      fontWeight: 700,
                    }}
                  >
                    TKM
                  </div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px' }}>
                {[1, 2, 3, 4].map((n) => (
                  <div
                    key={n}
                    style={{
                      width: 20,
                      height: 16,
                      border: `1px solid ${BP.lineMid}`,
                      background: 'rgba(22,55,90,0.3)',
                    }}
                  />
                ))}
              </div>
              <div style={{ display: 'flex', gap: '3px' }}>
                {['TKM-3', 'TKM-4'].map((label) => (
                  <div
                    key={label}
                    style={{
                      width: 26,
                      height: 26,
                      border: `1.5px solid ${BP.line}`,
                      borderRadius: '50%',
                      background: BP.wallFill,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.35rem',
                      color: BP.textMid,
                      fontWeight: 700,
                    }}
                  >
                    TKM
                  </div>
                ))}
              </div>
            </div>

            {/* ════════════════════════════════════════
                SCALE BAR
            ════════════════════════════════════════ */}
            <div
              className="absolute pointer-events-none"
              style={{ bottom: '13.5%', left: '3.5%', display: 'flex', flexDirection: 'column', gap: '2px' }}
            >
              <div style={{ display: 'flex' }}>
                {[0, 1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    style={{
                      width: 18,
                      height: 5,
                      background: i % 2 === 0 ? BP.line : BP.bg,
                      border: `1px solid ${BP.line}`,
                      borderLeft: i === 0 ? `1px solid ${BP.line}` : 'none',
                    }}
                  />
                ))}
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  width: 90,
                  color: BP.textMid,
                  fontSize: '0.38rem',
                  letterSpacing: '0.04em',
                }}
              >
                <span>0</span>
                <span>5M</span>
                <span>10M</span>
              </div>
              <span style={{ color: BP.textDim, fontSize: '0.4rem', fontWeight: 700, letterSpacing: '0.1em' }}>
                SCALE 1:100
              </span>
            </div>

            {/* ════════════════════════════════════════
                LEGEND
            ════════════════════════════════════════ */}
            <div
              className="absolute pointer-events-none"
              style={{
                bottom: '13%',
                left: '16%',
                border: `1px solid ${BP.lineMid}`,
                padding: '3px 6px',
                background: BP.bgCard,
                minWidth: 80,
              }}
            >
              <div
                style={{
                  color: BP.textDim,
                  fontSize: '0.4rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  marginBottom: '3px',
                  borderBottom: `1px solid ${BP.lineLight}`,
                  paddingBottom: '2px',
                }}
              >
                LEGEND
              </div>
              {[
                { color: BP.cyan, label: t('inventory.outsideWarehouse.legendRackZone') },
                { color: BP.line, label: t('inventory.outsideWarehouse.legendBuildingWall') },
                { color: 'rgba(34,211,238,0.6)', label: t('inventory.outsideWarehouse.legendOccupiedSlot') },
                { color: BP.lineLight, label: t('inventory.outsideWarehouse.legendEmptySlot') },
              ].map(({ color, label }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                  <div style={{ width: 10, height: 6, background: color, flexShrink: 0, border: `1px solid ${color}` }} />
                  <span style={{ color: BP.textMid, fontSize: '0.38rem', letterSpacing: '0.04em' }}>{label}</span>
                </div>
              ))}
            </div>

            {/* ════════════════════════════════════════
                TITLE BLOCK
            ════════════════════════════════════════ */}
            <div
              className="absolute pointer-events-none"
              style={{
                bottom: '1.5%',
                left: '2.2%',
                right: '2.2%',
                height: '10%',
                border: `1px solid ${BP.line}`,
                background: BP.bgCard,
                display: 'grid',
                gridTemplateColumns: '1fr 1.4fr 0.9fr 110px',
              }}
            >
              {/* Project */}
              <div
                style={{
                  borderRight: `1px solid ${BP.lineMid}`,
                  padding: '3px 8px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  gap: 2,
                }}
              >
                <span style={{ color: BP.textDim, fontSize: '0.36rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  PROJECT
                </span>
                <span style={{ color: BP.textPrimary, fontSize: '0.55rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  V3RII WMS
                </span>
                <span style={{ color: BP.textDim, fontSize: '0.34rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  WAREHOUSE MANAGEMENT SYSTEM
                </span>
              </div>

              {/* Drawing title */}
              <div
                style={{
                  borderRight: `1px solid ${BP.lineMid}`,
                  padding: '3px 8px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  gap: 2,
                }}
              >
                <span style={{ color: BP.textDim, fontSize: '0.36rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  DRAWING TITLE
                </span>
                <span style={{ color: BP.textPrimary, fontSize: '0.52rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  OUTDOOR WAREHOUSE LAYOUT PLAN
                </span>
                <span style={{ color: BP.textDim, fontSize: '0.34rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  GENERAL ARRANGEMENT — SITE FLOOR PLAN
                </span>
              </div>

              {/* Scale / Drawn by */}
              <div
                style={{
                  borderRight: `1px solid ${BP.lineMid}`,
                  padding: '3px 8px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  gap: 3,
                }}
              >
                <div style={{ display: 'flex', gap: 10 }}>
                  <div>
                    <span style={{ color: BP.textDim, fontSize: '0.34rem', textTransform: 'uppercase' }}>SCALE: </span>
                    <span style={{ color: BP.textPrimary, fontSize: '0.4rem', fontWeight: 700 }}>1:100</span>
                  </div>
                  <div>
                    <span style={{ color: BP.textDim, fontSize: '0.34rem', textTransform: 'uppercase' }}>DATE: </span>
                    <span style={{ color: BP.textPrimary, fontSize: '0.4rem', fontWeight: 700 }}>2026</span>
                  </div>
                </div>
                <div>
                  <span style={{ color: BP.textDim, fontSize: '0.34rem', textTransform: 'uppercase' }}>DRAWN BY: </span>
                  <span style={{ color: BP.textPrimary, fontSize: '0.38rem', fontWeight: 700 }}>
                    {t('inventory.outsideWarehouse.drawnBy')}
                  </span>
                </div>
                <div>
                  <span style={{ color: BP.textDim, fontSize: '0.34rem', textTransform: 'uppercase' }}>DWG NO: </span>
                  <span style={{ color: BP.textPrimary, fontSize: '0.38rem', fontWeight: 700 }}>WMS-OW-001</span>
                </div>
              </div>

              {/* Rev block */}
              <div style={{ padding: '3px 6px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 2 }}>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1.5fr',
                    borderBottom: `1px solid ${BP.lineLight}`,
                    paddingBottom: 2,
                    marginBottom: 1,
                  }}
                >
                  {['REV', 'DATE', 'DESCRIPTION'].map((h) => (
                    <span
                      key={h}
                      style={{
                        color: BP.textDim,
                        fontSize: '0.32rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        textAlign: 'center',
                      }}
                    >
                      {h}
                    </span>
                  ))}
                </div>
                {[
                  { rev: 'A', date: '2026', desc: 'INITIAL' },
                ].map(({ rev, date, desc }) => (
                  <div key={rev} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr' }}>
                    <span style={{ color: BP.textPrimary, fontSize: '0.38rem', fontWeight: 700, textAlign: 'center' }}>{rev}</span>
                    <span style={{ color: BP.textPrimary, fontSize: '0.38rem', fontWeight: 700, textAlign: 'center' }}>{date}</span>
                    <span style={{ color: BP.textMid, fontSize: '0.35rem', textAlign: 'center' }}>{desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ════════════════════════════════════════
          PORTAL OVERLAY — AUTOCAD RACK ELEVATION
      ════════════════════════════════════════ */}
      {(portalOpen || isPortalClosing) && (
        <div
          className={`fixed inset-0 z-50 flex flex-col ${isPortalClosing ? 'portal-overlay-exit' : 'portal-overlay-enter'}`}
          style={{ background: '#070f1e', fontFamily: '"Courier New", Courier, monospace' }}
          aria-modal="true"
          role="dialog"
          aria-label={t('inventory.outsideWarehouse.portalSchema')}
        >
          {/* ── HEADER BAR ── */}
          <div
            style={{
              background: '#0a1829',
              borderBottom: '2px solid #2e6089',
              padding: '10px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 22, height: 22, borderTop: '2px solid #22d3ee', borderLeft: '2px solid #22d3ee', flexShrink: 0 }} />
              <div>
                <div style={{ color: '#c8e6f0', fontSize: '0.88rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                  {t('inventory.outsideWarehouse.portalSchema')}
                </div>
                <div style={{ color: '#3d7aa0', fontSize: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: 2 }}>
                  DWG: WMS-OW-RACK-001 &nbsp;·&nbsp; REV: A &nbsp;·&nbsp; SCALE 1:20 &nbsp;·&nbsp; 4-SEVİYE × 6-KOLİ
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  display: 'flex',
                  gap: 14,
                  padding: '4px 14px',
                  border: '1px solid #1e3f5c',
                  background: 'rgba(9,21,37,0.7)',
                  fontSize: '0.48rem',
                  color: '#7ec0d8',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  alignItems: 'center',
                }}
              >
                <span>
                  <strong style={{ color: '#22d3ee', fontSize: '0.62rem' }}>{totalOccupied}</strong> DOLU
                </span>
                <span style={{ color: '#1e3f5c' }}>|</span>
                <span>
                  <strong style={{ color: '#7ec0d8', fontSize: '0.62rem' }}>{totalSlots - totalOccupied}</strong> BOŞ
                </span>
                <span style={{ color: '#1e3f5c' }}>|</span>
                <span>
                  <strong style={{ color: '#c8e6f0', fontSize: '0.62rem' }}>{totalSlots}</strong> TOPLAM
                </span>
              </div>

              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setShowAddProduct((prev) => !prev)}
                className={showAddProduct
                  ? 'border-cyan-400/60 bg-cyan-500/20 text-cyan-200 hover:bg-cyan-500/30'
                  : 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20'
                }
              >
                {showAddProduct ? `✕ ${t('inventory.outsideWarehouse.closeAddProduct')}` : `+ ${t('inventory.outsideWarehouse.addProduct')}`}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsPortalClosing(true)}
                className="border-slate-600 text-slate-300 hover:bg-slate-800"
              >
                {t('common.close')}
              </Button>
              <div style={{ width: 22, height: 22, borderTop: '2px solid #22d3ee', borderRight: '2px solid #22d3ee', flexShrink: 0 }} />
            </div>
          </div>

          {/* ── MAIN BODY ── */}
          <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

            {/* ══════════════════════════════════
                LEFT: RACK ELEVATION DRAWING
            ══════════════════════════════════ */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '20px 24px 16px',
                background: '#070f1e',
                position: 'relative',
              }}
            >
              {/* Blueprint dot grid */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage: 'radial-gradient(circle, rgba(70,140,180,0.1) 1px, transparent 1px)',
                  backgroundSize: '28px 28px',
                }}
              />

              {/* Add product form */}
              {showAddProduct && (() => {
                const typeFilters: Array<{ key: ProductType | 'all'; label: string }> = [
                  { key: 'all', label: t('inventory.outsideWarehouse.allTypes') },
                  { key: 'solar-panel', label: t('inventory.outsideWarehouse.typeSolarPanel') },
                  { key: 'solar-frame', label: t('inventory.outsideWarehouse.typeSolarFrame') },
                  { key: 'galv-pipe', label: t('inventory.outsideWarehouse.typeGalvPipe') },
                  { key: 'sheet-metal', label: t('inventory.outsideWarehouse.typeSheetMetal') },
                  { key: 'alum-profile', label: t('inventory.outsideWarehouse.typeAlumProfile') },
                ];
                const filteredCatalog = addTypeFilter === 'all'
                  ? DEMO_PRODUCT_CATALOG
                  : DEMO_PRODUCT_CATALOG.filter((p) => p.type === addTypeFilter);
                const activeCatalogProduct = DEMO_PRODUCT_CATALOG.find((p) => p.code === selectedCatalogCode);

                return (
                  <div
                    className="relative z-10 mb-5"
                    style={{
                      border: '1px solid rgba(34,211,238,0.25)',
                      background: '#070f1e',
                    }}
                  >
                    {/* Panel header */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 16px',
                        borderBottom: '1px solid rgba(34,211,238,0.15)',
                        background: '#0a1829',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 12, height: 12, borderTop: '2px solid #22d3ee', borderLeft: '2px solid #22d3ee' }} />
                        <span style={{ color: '#22d3ee', fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                          ÜRÜN EKLE
                        </span>
                        <div style={{ width: 1, height: 14, background: '#1a3050' }} />
                        <span style={{ color: '#3d7aa0', fontSize: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                          HEDEF SLOT:
                        </span>
                        <span
                          style={{
                            color: '#c8e6f0',
                            fontSize: '0.6rem',
                            fontWeight: 700,
                            background: 'rgba(34,211,238,0.1)',
                            border: '1px solid rgba(34,211,238,0.3)',
                            padding: '1px 8px',
                            letterSpacing: '0.08em',
                          }}
                        >
                          {selectedSlot}
                        </span>
                        <span style={{ color: '#3d7aa0', fontSize: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          · RAF KOD: OW-RA-{selectedSlot}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowAddProduct(false)}
                        style={{
                          color: '#3d7aa0',
                          fontSize: '0.75rem',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          lineHeight: 1,
                          padding: '2px 6px',
                        }}
                        className="hover:text-slate-300"
                      >
                        ✕
                      </button>
                    </div>

                    {/* Main body: 2 columns */}
                    <div style={{ display: 'flex', gap: 0 }}>

                      {/* LEFT — Catalog */}
                      <div style={{ flex: 1, padding: '14px 16px', borderRight: '1px solid #0d2035' }}>
                        {/* Type filter pills */}
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                          {typeFilters.map(({ key, label }) => {
                            const isActive = addTypeFilter === key;
                            const vis = key !== 'all' ? PRODUCT_TYPE_VISUALS[key] : null;
                            return (
                              <button
                                key={key}
                                type="button"
                                onClick={() => setAddTypeFilter(key)}
                                style={{
                                  padding: '3px 10px',
                                  fontSize: '0.42rem',
                                  fontWeight: 700,
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.08em',
                                  border: `1px solid ${isActive ? (vis?.color ?? '#22d3ee') : '#1a3050'}`,
                                  background: isActive ? (vis ? vis.bgColor : 'rgba(34,211,238,0.1)') : 'rgba(7,15,30,0.6)',
                                  color: isActive ? (vis?.color ?? '#22d3ee') : '#2a5070',
                                  cursor: 'pointer',
                                  transition: 'all 0.12s',
                                  fontFamily: '"Courier New", Courier, monospace',
                                }}
                              >
                                {label}
                              </button>
                            );
                          })}
                        </div>

                        {/* Product cards grid */}
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                            gap: 8,
                            maxHeight: 210,
                            overflowY: 'auto',
                          }}
                        >
                          {filteredCatalog.map((item) => {
                            const isSelected = selectedCatalogCode === item.code;
                            const vis = PRODUCT_TYPE_VISUALS[item.type];
                            return (
                              <button
                                key={item.code}
                                type="button"
                                onClick={() => setSelectedCatalogCode(item.code)}
                                style={{
                                  border: `2px solid ${isSelected ? vis.color : '#1a3050'}`,
                                  background: isSelected ? vis.bgColor : 'rgba(10,22,42,0.6)',
                                  padding: 0,
                                  cursor: 'pointer',
                                  textAlign: 'left',
                                  transition: 'all 0.12s',
                                  position: 'relative',
                                  overflow: 'hidden',
                                  fontFamily: '"Courier New", Courier, monospace',
                                }}
                                className="hover:border-slate-500"
                              >
                                {/* Photo */}
                                <div style={{ width: '100%', height: 64, overflow: 'hidden', position: 'relative' }}>
                                  <img
                                    src={PRODUCT_TYPE_IMAGES[item.type].url}
                                    alt={PRODUCT_TYPE_IMAGES[item.type].alt}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                  />
                                  {/* Overlay gradient */}
                                  <div
                                    style={{
                                      position: 'absolute',
                                      bottom: 0,
                                      left: 0,
                                      right: 0,
                                      height: '50%',
                                      background: 'linear-gradient(transparent, rgba(7,15,30,0.85))',
                                    }}
                                  />
                                  {/* Type badge */}
                                  <div
                                    style={{
                                      position: 'absolute',
                                      top: 4,
                                      left: 4,
                                      background: vis.bgColor,
                                      border: `1px solid ${vis.borderColor}`,
                                      padding: '1px 4px',
                                      fontSize: '0.32rem',
                                      color: vis.color,
                                      fontWeight: 700,
                                      textTransform: 'uppercase',
                                      letterSpacing: '0.06em',
                                    }}
                                  >
                                    {t(vis.labelKey)}
                                  </div>
                                  {/* Selected checkmark */}
                                  {isSelected && (
                                    <div
                                      style={{
                                        position: 'absolute',
                                        top: 4,
                                        right: 4,
                                        width: 16,
                                        height: 16,
                                        borderRadius: '50%',
                                        background: vis.color,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '0.55rem',
                                        color: '#070f1e',
                                        fontWeight: 900,
                                      }}
                                    >
                                      ✓
                                    </div>
                                  )}
                                </div>
                                {/* Card footer */}
                                <div style={{ padding: '5px 6px' }}>
                                  <div
                                    style={{
                                      color: isSelected ? '#c8e6f0' : '#7ec0d8',
                                      fontSize: '0.45rem',
                                      fontWeight: 700,
                                      textTransform: 'uppercase',
                                      letterSpacing: '0.04em',
                                      lineHeight: 1.3,
                                      overflow: 'hidden',
                                      display: '-webkit-box',
                                      WebkitLineClamp: 2,
                                      WebkitBoxOrient: 'vertical' as const,
                                    }}
                                  >
                                    {item.name}
                                  </div>
                                  <div style={{ color: '#2a5070', fontSize: '0.38rem', marginTop: 2 }}>
                                    {item.code}
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* RIGHT — Config & Action */}
                      <div style={{ width: 280, flexShrink: 0, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {activeCatalogProduct ? (
                          <>
                            {/* Selected product preview */}
                            <div
                              style={{
                                border: `1px solid ${PRODUCT_TYPE_VISUALS[activeCatalogProduct.type].borderColor}`,
                                background: PRODUCT_TYPE_VISUALS[activeCatalogProduct.type].bgColor,
                                overflow: 'hidden',
                              }}
                            >
                              {/* Product photo */}
                              <div style={{ width: '100%', height: 90, overflow: 'hidden', position: 'relative' }}>
                                <img
                                  src={PRODUCT_TYPE_IMAGES[activeCatalogProduct.type].url}
                                  alt={activeCatalogProduct.name}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                />
                                <div
                                  style={{
                                    position: 'absolute',
                                    inset: 0,
                                    background: 'linear-gradient(to bottom, transparent 40%, rgba(7,15,30,0.9) 100%)',
                                  }}
                                />
                                <div style={{ position: 'absolute', bottom: 6, left: 8, right: 8 }}>
                                  <div style={{ color: '#fff', fontSize: '0.58rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', lineHeight: 1.2 }}>
                                    {activeCatalogProduct.name}
                                  </div>
                                </div>
                              </div>
                              <div style={{ padding: '6px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: PRODUCT_TYPE_VISUALS[activeCatalogProduct.type].color, fontSize: '0.4rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                  {t(PRODUCT_TYPE_VISUALS[activeCatalogProduct.type].labelKey)}
                                </span>
                                <span style={{ color: '#2a5070', fontSize: '0.38rem' }}>{activeCatalogProduct.code} · {activeCatalogProduct.unit}</span>
                              </div>
                            </div>

                            {/* Serial no field */}
                            <div>
                              <div style={{ color: '#3d7aa0', fontSize: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 5 }}>
                                SERİ NO
                              </div>
                              <Combobox
                                options={serialOptions}
                                value={selectedSerialNo}
                                onValueChange={setSelectedSerialNo}
                                placeholder={t('inventory.outsideWarehouse.selectSerial')}
                                searchPlaceholder={t('inventory.outsideWarehouse.searchSerial')}
                                emptyText={t('common.notFound')}
                                disabled={serialOptions.length === 0}
                                listClassName="max-h-[160px]"
                              />
                            </div>

                            {/* Qty field */}
                            <div>
                              <div style={{ color: '#3d7aa0', fontSize: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 5 }}>
                                MİKTAR ({activeCatalogProduct.unit})
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <button
                                  type="button"
                                  onClick={() => setAddQty((v) => Math.max(1, v - 1))}
                                  style={{
                                    width: 32,
                                    height: 36,
                                    border: '1px solid #1a3050',
                                    background: 'rgba(10,22,42,0.8)',
                                    color: '#7ec0d8',
                                    fontSize: '1rem',
                                    cursor: 'pointer',
                                    fontFamily: '"Courier New", Courier, monospace',
                                    flexShrink: 0,
                                  }}
                                >
                                  −
                                </button>
                                <Input
                                  type="number"
                                  min={1}
                                  value={addQty}
                                  onChange={(e) => setAddQty(Math.max(1, Number(e.target.value)))}
                                  className="h-9 border-slate-700 bg-slate-900/60 text-slate-100 text-center"
                                  style={{ fontFamily: '"Courier New", Courier, monospace', fontWeight: 700 }}
                                />
                                <button
                                  type="button"
                                  onClick={() => setAddQty((v) => v + 1)}
                                  style={{
                                    width: 32,
                                    height: 36,
                                    border: '1px solid #1a3050',
                                    background: 'rgba(10,22,42,0.8)',
                                    color: '#7ec0d8',
                                    fontSize: '1rem',
                                    cursor: 'pointer',
                                    fontFamily: '"Courier New", Courier, monospace',
                                    flexShrink: 0,
                                  }}
                                >
                                  +
                                </button>
                              </div>
                            </div>

                            {/* Target slot info */}
                            <div
                              style={{
                                border: '1px solid #1a3050',
                                padding: '8px 10px',
                                background: 'rgba(7,15,30,0.6)',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div>
                                  <div style={{ color: '#2a5070', fontSize: '0.36rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>HEDEF SLOT</div>
                                  <div style={{ color: '#c8e6f0', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', marginTop: 1 }}>{selectedSlot}</div>
                                  <div style={{ color: '#1e3f5c', fontSize: '0.36rem', marginTop: 1 }}>
                                    OW-RA-{selectedSlot} · SEVİYE {selectedSlot[0]} · BAY {selectedSlot.slice(1)}
                                  </div>
                                </div>
                                <div
                                  style={{
                                    width: 32,
                                    height: 32,
                                    border: '1px solid rgba(34,211,238,0.3)',
                                    background: 'rgba(34,211,238,0.08)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.55rem',
                                    color: '#22d3ee',
                                    fontWeight: 700,
                                  }}
                                >
                                  ⬡
                                </div>
                              </div>
                            </div>

                            {/* Add button */}
                            <button
                              type="button"
                              onClick={handleAddProduct}
                              style={{
                                width: '100%',
                                padding: '10px',
                                background: PRODUCT_TYPE_VISUALS[activeCatalogProduct.type].color,
                                border: 'none',
                                color: '#070f1e',
                                fontSize: '0.58rem',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.12em',
                                cursor: 'pointer',
                                fontFamily: '"Courier New", Courier, monospace',
                                transition: 'opacity 0.15s',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 6,
                              }}
                              className="hover:opacity-90 active:opacity-75"
                            >
                              <span style={{ fontSize: '0.7rem' }}>+</span>
                              {t('inventory.outsideWarehouse.addToRegion')}
                            </button>
                          </>
                        ) : (
                          <div
                            style={{
                              flex: 1,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#1e3f5c',
                              fontSize: '0.48rem',
                              textTransform: 'uppercase',
                              letterSpacing: '0.1em',
                              textAlign: 'center',
                            }}
                          >
                            ← KATALOGDAN BİR ÜRÜN SEÇİN
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* ── RACK DRAWING ── */}
              <div className="relative z-10">
                {/* Drawing title */}
                <div
                  style={{
                    textAlign: 'center',
                    marginBottom: 6,
                    color: '#3d7aa0',
                    fontSize: '0.46rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.2em',
                  }}
                >
                  RAF ÜNİTESİ — ÖN GÖRÜNÜM / RACK UNIT — FRONT ELEVATION
                </div>

                <div style={{ display: 'flex' }}>
                  {/* LEFT MARGIN: level labels */}
                  <div
                    style={{
                      width: 64,
                      flexShrink: 0,
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    {/* Spacer for col-header row */}
                    <div style={{ height: 36, flexShrink: 0 }} />

                    {/* D → A from top to bottom */}
                    {(['D', 'C', 'B', 'A'] as const).map((row, idx) => (
                      <div
                        key={row}
                        style={{
                          flex: 1,
                          minHeight: 110,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'flex-end',
                          justifyContent: 'center',
                          paddingRight: 10,
                          borderRight: '3px solid #2e6089',
                          gap: 2,
                        }}
                      >
                        <span style={{ color: '#22d3ee', fontSize: '1.3rem', fontWeight: 700, lineHeight: 1 }}>{row}</span>
                        <span style={{ color: '#3d7aa0', fontSize: '0.36rem', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                          {['SEV-4', 'SEV-3', 'SEV-2', 'SEV-1'][idx]}
                        </span>
                        <span style={{ color: '#1e3f5c', fontSize: '0.34rem', whiteSpace: 'nowrap' }}>
                          {['+3.6M', '+2.4M', '+1.2M', '±0.0M'][idx]}
                        </span>
                      </div>
                    ))}

                    {/* Foundation spacer */}
                    <div style={{ height: 18, flexShrink: 0, borderRight: '3px solid #2e6089' }} />
                  </div>

                  {/* MAIN RACK GRID */}
                  <div style={{ flex: 1 }}>
                    {/* Column headers */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(6, 1fr)',
                        height: 36,
                        borderLeft: '3px solid #3d6e96',
                        borderRight: '3px solid #3d6e96',
                        borderBottom: '2px solid #3d6e96',
                        background: 'rgba(10,20,45,0.8)',
                      }}
                    >
                      {PORTAL_SLOT_COLS.map((col, i) => (
                        <div
                          key={col}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderLeft: i > 0 ? '1px solid #1e3f5c' : 'none',
                            gap: 1,
                          }}
                        >
                          <span style={{ color: '#7ec0d8', fontSize: '0.65rem', fontWeight: 700 }}>{col}</span>
                          <span style={{ color: '#2a4a68', fontSize: '0.32rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>KOLİ</span>
                        </div>
                      ))}
                    </div>

                    {/* Rack rows: D (top) → A (bottom) */}
                    {(['D', 'C', 'B', 'A'] as const).map((row, rowIdx) => (
                      <div
                        key={row}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(6, 1fr)',
                          minHeight: 110,
                          borderLeft: '3px solid #3d6e96',
                          borderRight: '3px solid #3d6e96',
                          borderBottom: rowIdx < 3 ? '2px solid #2a5070' : '3px solid #3d6e96',
                        }}
                      >
                        {PORTAL_SLOT_COLS.map((col, colIdx) => {
                          const slot = `${row}${col}`;
                          const slotProducts = inventoryBySlot[slot] ?? [];
                          const isOccupied = slotProducts.length > 0;
                          const isSelected = selectedSlot === slot;
                          const isDragTarget = dragOverSlot === slot;
                          const isSameSlot = draggingFromSlot === slot;
                          const isValidDropTarget = !!draggingProduct && !isSameSlot;

                          const cellBg = isDragTarget && isValidDropTarget
                            ? 'rgba(34,211,238,0.18)'
                            : isSameSlot && draggingProduct
                              ? 'rgba(239,68,68,0.08)'
                              : isSelected
                                ? 'rgba(34,211,238,0.1)'
                                : isOccupied
                                  ? 'rgba(12,40,72,0.8)'
                                  : 'rgba(7,15,30,0.7)';

                          const cellOutline = isSelected || (isDragTarget && isValidDropTarget)
                            ? '2px solid #22d3ee'
                            : isSameSlot && draggingProduct
                              ? '2px solid rgba(239,68,68,0.5)'
                              : 'none';

                          return (
                            <button
                              key={slot}
                              type="button"
                              onClick={() => setSelectedSlot(slot)}
                              onDragOver={(e) => handleSlotDragOver(e, slot)}
                              onDragLeave={handleSlotDragLeave}
                              onDrop={(e) => handleSlotDrop(e, slot)}
                              style={{
                                position: 'relative',
                                borderLeft: colIdx > 0 ? '2px solid #1a3558' : 'none',
                                background: cellBg,
                                outline: cellOutline,
                                outlineOffset: '-2px',
                                cursor: draggingProduct
                                  ? isSameSlot ? 'not-allowed' : 'copy'
                                  : 'pointer',
                                transition: 'background 0.12s',
                                overflow: 'hidden',
                                padding: 0,
                                minHeight: 110,
                              }}
                            >
                              {/* Upright column accent */}
                              <div
                                style={{
                                  position: 'absolute',
                                  top: 0,
                                  bottom: 0,
                                  left: 0,
                                  width: 3,
                                  background: isOccupied
                                    ? 'rgba(34,211,238,0.2)'
                                    : 'rgba(42,80,112,0.3)',
                                }}
                              />
                              <div
                                style={{
                                  position: 'absolute',
                                  top: 0,
                                  bottom: 0,
                                  right: 0,
                                  width: 3,
                                  background: isOccupied
                                    ? 'rgba(34,211,238,0.2)'
                                    : 'rgba(42,80,112,0.3)',
                                }}
                              />

                              {/* Shelf beam (top) */}
                              <div
                                style={{
                                  position: 'absolute',
                                  top: 0,
                                  left: 3,
                                  right: 3,
                                  height: 4,
                                  background: isOccupied
                                    ? 'rgba(34,211,238,0.25)'
                                    : 'rgba(42,80,112,0.4)',
                                }}
                              />

                              {/* Bolt circles (4 corners) */}
                              {[
                                { top: 5, left: 6 },
                                { top: 5, right: 6 },
                                { bottom: 5, left: 6 },
                                { bottom: 5, right: 6 },
                              ].map((pos, pi) => (
                                <div
                                  key={pi}
                                  style={{
                                    position: 'absolute',
                                    ...pos,
                                    width: 5,
                                    height: 5,
                                    borderRadius: '50%',
                                    border: `1px solid ${isOccupied ? 'rgba(34,211,238,0.5)' : '#1a3558'}`,
                                    background: isOccupied ? 'rgba(34,211,238,0.15)' : 'rgba(26,53,88,0.6)',
                                  }}
                                />
                              ))}

                              {/* Cross-brace pattern (empty slots only) */}
                              {!isOccupied && !isDragTarget && (
                                <div
                                  style={{
                                    position: 'absolute',
                                    inset: '18px 8px 8px',
                                    backgroundImage: [
                                      'linear-gradient(45deg, transparent 44%, rgba(42,80,112,0.2) 44%, rgba(42,80,112,0.2) 56%, transparent 56%)',
                                      'linear-gradient(-45deg, transparent 44%, rgba(42,80,112,0.2) 44%, rgba(42,80,112,0.2) 56%, transparent 56%)',
                                    ].join(','),
                                    backgroundSize: '14px 14px',
                                    pointerEvents: 'none',
                                  }}
                                />
                              )}

                              {/* Occupied: product-type coloured visual */}
                              {isOccupied && (() => {
                                const primaryType = slotProducts[0]?.type ?? 'sheet-metal';
                                const vis = PRODUCT_TYPE_VISUALS[primaryType];
                                const mixedTypes = slotProducts.some((p) => p.type !== primaryType);
                                return (
                                  <div
                                    style={{
                                      position: 'absolute',
                                      inset: '20px 6px 6px',
                                      border: `1px solid ${vis.borderColor}`,
                                      background: vis.bgColor,
                                      display: 'flex',
                                      flexDirection: 'column',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      gap: 3,
                                      overflow: 'hidden',
                                    }}
                                  >
                                    {/* Pallet base slats */}
                                    <div
                                      style={{
                                        position: 'absolute',
                                        bottom: 0,
                                        left: 0,
                                        right: 0,
                                        height: '18%',
                                        background: `${vis.color}0d`,
                                        borderTop: `1px solid ${vis.color}33`,
                                      }}
                                    >
                                      {[20, 40, 60, 80].map((x) => (
                                        <div
                                          key={x}
                                          style={{
                                            position: 'absolute',
                                            left: `${x}%`,
                                            top: 0,
                                            bottom: 0,
                                            width: 1,
                                            background: `${vis.color}30`,
                                          }}
                                        />
                                      ))}
                                    </div>

                                    {/* Product photo thumbnail */}
                                    <ProductTypeImage type={primaryType} size={34} />

                                    {/* Product count badge */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                      <span style={{ color: vis.color, fontSize: '1rem', fontWeight: 700, lineHeight: 1 }}>
                                        {slotProducts.length}
                                      </span>
                                      {mixedTypes && (
                                        <span style={{ color: vis.color, fontSize: '0.55rem', opacity: 0.7 }}>+</span>
                                      )}
                                    </div>

                                    {/* Type label */}
                                    <span
                                      style={{
                                        color: vis.color,
                                        fontSize: '0.34rem',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.08em',
                                        fontWeight: 700,
                                        opacity: 0.85,
                                        textAlign: 'center',
                                        maxWidth: '88%',
                                        lineHeight: 1.2,
                                      }}
                                    >
                                      {mixedTypes ? t('inventory.outsideWarehouse.mixedStock') : t(vis.labelKey)}
                                    </span>
                                  </div>
                                );
                              })()}

                              {/* DragOver overlay */}
                              {isDragTarget && isValidDropTarget && (
                                <div
                                  style={{
                                    position: 'absolute',
                                    inset: 0,
                                    background: 'rgba(34,211,238,0.15)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 4,
                                    zIndex: 5,
                                  }}
                                >
                                  <span style={{ color: '#22d3ee', fontSize: '1.6rem', lineHeight: 1 }}>↓</span>
                                  <span
                                    style={{
                                      color: '#22d3ee',
                                      fontSize: '0.48rem',
                                      fontWeight: 700,
                                      textTransform: 'uppercase',
                                      letterSpacing: '0.1em',
                                    }}
                                  >
                                    BIRAK
                                  </span>
                                </div>
                              )}

                              {/* Selected top bar */}
                              {isSelected && (
                                <div
                                  style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    height: 3,
                                    background: '#22d3ee',
                                  }}
                                />
                              )}

                              {/* Slot label */}
                              <div
                                style={{
                                  position: 'absolute',
                                  top: 7,
                                  left: 0,
                                  right: 0,
                                  textAlign: 'center',
                                  color: isSelected
                                    ? '#22d3ee'
                                    : isOccupied
                                      ? 'rgba(34,211,238,0.55)'
                                      : '#1e3f5c',
                                  fontSize: '0.52rem',
                                  fontWeight: 700,
                                  letterSpacing: '0.06em',
                                  textTransform: 'uppercase',
                                }}
                              >
                                {slot}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    ))}

                    {/* Foundation bar */}
                    <div
                      style={{
                        height: 18,
                        borderLeft: '3px solid #3d6e96',
                        borderRight: '3px solid #3d6e96',
                        borderBottom: '3px solid #3d6e96',
                        background: 'rgba(25,55,90,0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          backgroundImage:
                            'repeating-linear-gradient(45deg, rgba(60,110,150,0.25) 0px, rgba(60,110,150,0.25) 1px, transparent 1px, transparent 8px)',
                        }}
                      />
                      <span
                        style={{
                          color: '#2a5070',
                          fontSize: '0.36rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.14em',
                          zIndex: 1,
                        }}
                      >
                        ZEMİN / FLOOR LEVEL — ±0.0 M
                      </span>
                    </div>
                  </div>
                </div>

                {/* Legend */}
                <div
                  style={{
                    display: 'flex',
                    gap: 16,
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    marginTop: 12,
                    padding: '6px 14px',
                    border: '1px solid #1a3050',
                    background: 'rgba(7,15,30,0.7)',
                  }}
                >
                  <span
                    style={{
                      color: '#2a5070',
                      fontSize: '0.38rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.12em',
                      fontWeight: 700,
                      marginRight: 2,
                    }}
                  >
                    AÇIKLAMA:
                  </span>
                  {[
                    { bg: 'rgba(34,211,238,0.1)', border: '#22d3ee', label: t('inventory.outsideWarehouse.legendSelectedSlot') },
                    { bg: 'rgba(12,40,72,0.8)', border: 'rgba(34,211,238,0.3)', label: t('inventory.outsideWarehouse.legendOccupiedSlot') },
                    { bg: 'rgba(7,15,30,0.7)', border: '#1a3558', label: t('inventory.outsideWarehouse.legendEmptySlot') },
                    { bg: 'rgba(34,211,238,0.18)', border: '#22d3ee', label: t('inventory.outsideWarehouse.legendDropTarget') },
                  ].map(({ bg, border, label }) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <div
                        style={{
                          width: 14,
                          height: 10,
                          background: bg,
                          border: `1px solid ${border}`,
                          flexShrink: 0,
                        }}
                      />
                      <span
                        style={{
                          color: '#4a7aaa',
                          fontSize: '0.38rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                        }}
                      >
                        {label}
                      </span>
                    </div>
                  ))}
                  <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ color: '#2a5070', fontSize: '0.36rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      SÜRÜKLE-BIRAK:
                    </span>
                    <span style={{ color: '#3d6e96', fontSize: '0.36rem' }}>
                      Sağ paneldeki ürün kartını raf hücresine sürükle
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ══════════════════════════════════
                RIGHT: DETAIL PANEL
            ══════════════════════════════════ */}
            <div
              style={{
                width: 360,
                flexShrink: 0,
                borderLeft: '2px solid #1a3050',
                background: '#09162a',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              {/* Panel header */}
              <div
                style={{
                  padding: '14px 16px',
                  borderBottom: '1px solid #1a3050',
                  background: '#0a1829',
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 5,
                  }}
                >
                  <span
                    style={{
                      color: '#c8e6f0',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                    }}
                  >
                    SLOT: {selectedSlotDetail.slot}
                  </span>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    {draggingProduct && (
                      <span
                        style={{
                          color: '#22d3ee',
                          fontSize: '0.4rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                        }}
                        className="animate-pulse"
                      >
                        ↗ RAF'A SÜRÜKLE
                      </span>
                    )}
                    <span
                      style={{
                        background:
                          selectedSlotDetail.products.length > 0
                            ? 'rgba(34,211,238,0.12)'
                            : 'rgba(42,80,112,0.2)',
                        border: `1px solid ${selectedSlotDetail.products.length > 0 ? 'rgba(34,211,238,0.35)' : '#1a3050'}`,
                        color: selectedSlotDetail.products.length > 0 ? '#22d3ee' : '#3d6e96',
                        padding: '2px 10px',
                        fontSize: '0.44rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                      }}
                    >
                      {selectedSlotDetail.products.length} ÜRÜN
                    </span>
                  </div>
                </div>
                <div
                  style={{
                    color: '#1e3f5c',
                    fontSize: '0.38rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.07em',
                  }}
                >
                  RAF KOD: OW-RA-{selectedSlotDetail.slot} &nbsp;·&nbsp; SEVİYE {selectedSlotDetail.slot[0]} &nbsp;·&nbsp; BAY {selectedSlotDetail.slot.slice(1)}
                </div>
              </div>

              {/* Product list */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '12px 12px 20px' }}>
                {selectedSlotDetail.products.length === 0 ? (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minHeight: 200,
                      gap: 10,
                      color: '#1e3f5c',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: '2.5rem', opacity: 0.25 }}>⬡</div>
                    <span
                      style={{
                        fontSize: '0.48rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.12em',
                      }}
                    >
                      BOŞ SLOT
                    </span>
                    <span style={{ fontSize: '0.4rem', color: '#162a42' }}>
                      {t('inventory.outsideWarehouse.emptyRack')}
                    </span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {selectedSlotDetail.products.map((product) => {
                      const isDraggingThis = draggingProduct?.serialNo === product.serialNo;
                      return (
                        <div
                          key={product.serialNo}
                          draggable
                          onDragStart={(e) => handleDragStart(e, product)}
                          onDragEnd={handleDragEnd}
                          style={{
                            opacity: isDraggingThis ? 0.4 : 1,
                            transform: isDraggingThis ? 'scale(0.97)' : 'scale(1)',
                            transition: 'all 0.14s',
                            cursor: isDraggingThis ? 'grabbing' : 'grab',
                          }}
                        >
                          <div
                            style={{
                              border: `1px solid ${isDraggingThis ? 'rgba(34,211,238,0.45)' : '#162a42'}`,
                              background: isDraggingThis
                                ? 'rgba(34,211,238,0.04)'
                                : 'rgba(9,22,42,0.8)',
                              padding: '10px 12px',
                              transition: 'all 0.14s',
                            }}
                          >
                            {/* Drag handle + name */}
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                              <GripVertical
                                style={{
                                  width: 14,
                                  height: 14,
                                  color: '#1e3f5c',
                                  flexShrink: 0,
                                  marginTop: 2,
                                }}
                              />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                {/* Product type badge + icon */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                                  <ProductTypeImage type={product.type} size={26} />
                                  <span
                                    style={{
                                      color: PRODUCT_TYPE_VISUALS[product.type].color,
                                      fontSize: '0.36rem',
                                      fontWeight: 700,
                                      textTransform: 'uppercase',
                                      letterSpacing: '0.1em',
                                      background: PRODUCT_TYPE_VISUALS[product.type].bgColor,
                                      border: `1px solid ${PRODUCT_TYPE_VISUALS[product.type].borderColor}`,
                                      padding: '1px 6px',
                                    }}
                                  >
                                    {t(PRODUCT_TYPE_VISUALS[product.type].labelKey)}
                                  </span>
                                </div>
                                <div
                                  style={{
                                    color: '#c8e6f0',
                                    fontSize: '0.6rem',
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.04em',
                                    lineHeight: 1.3,
                                  }}
                                >
                                  {product.name}
                                </div>
                                <div
                                  style={{
                                    color: '#2a5070',
                                    fontSize: '0.42rem',
                                    marginTop: 3,
                                    letterSpacing: '0.03em',
                                  }}
                                >
                                  {product.code} &nbsp;·&nbsp; S/N: {product.serialNo}
                                </div>
                                <div
                                  style={{
                                    color: PRODUCT_TYPE_VISUALS[product.type].color,
                                    fontSize: '0.52rem',
                                    fontWeight: 700,
                                    marginTop: 4,
                                  }}
                                >
                                  {product.qty} {product.unit}
                                </div>
                              </div>
                            </div>

                            {/* Controls */}
                            <div
                              style={{
                                display: 'flex',
                                gap: 6,
                                flexWrap: 'wrap',
                                alignItems: 'center',
                                paddingTop: 8,
                                borderTop: '1px solid #0f2035',
                              }}
                            >
                              <div style={{ flex: 1, minWidth: 100 }}>
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
                                  className="h-8 text-[11px]"
                                />
                              </div>
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
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
