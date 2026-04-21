import { type ReactElement, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Download, Printer, RefreshCcw, Search, Sparkles } from 'lucide-react';
import type { Stage as KonvaStage } from 'konva/lib/Stage';
import { flushSync } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useUIStore } from '@/stores/ui-store';
import { loadJsPdfModule } from '@/lib/lazy-vendors';
import { packageApi } from '@/features/package/api/package-api';
import { printerManagementApi } from '@/features/printer-management/api/printer-management.api';
import { useCrudPermission } from '@/features/access-control/hooks/useCrudPermission';
import { barcodeDesignerApi } from '../api/barcode-designer.api';
import { BarcodePrintSourcePickerDialog } from './BarcodePrintSourcePickerDialog';
import { BarcodeDesignerCanvas } from './BarcodeDesignerCanvas';
import type {
  BarcodeDesignerTemplateDocument,
  BarcodePrintSourceItem,
  BarcodePrintSourceModule,
  BarcodeSourceHeaderOption,
  BarcodeSourceLineOption,
  BarcodeSourcePackageOption,
} from '../types/barcode-designer-editor.types';
import { DEFAULT_TEMPLATE_DOCUMENT, parseTemplateDocument } from '../utils/barcode-designer-document';
import {
  connectBarcodePrinter,
  discoverBarcodePrinters,
  openBrowserPrintWindow,
  type BarcodePrinterTarget,
} from '../utils/printer-client';

export function BarcodePrintPage(): ReactElement {
  const { t } = useTranslation('common');
  const { id } = useParams();
  const { setPageTitle } = useUIStore();
  const permission = useCrudPermission('wms.print-management');
  const stageRef = useRef<KonvaStage | null>(null);
  const templateId = id ? Number(id) : null;

  const [printQuantity, setPrintQuantity] = useState(1);
  const [printMode, setPrintMode] = useState<'manual' | 'document-line' | 'document-all'>('manual');
  const [sourceModule, setSourceModule] = useState<BarcodePrintSourceModule>('goods-receipt');
  const [sourceHeaderId, setSourceHeaderId] = useState('');
  const [sourceLineId, setSourceLineId] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedHeader, setSelectedHeader] = useState<BarcodeSourceHeaderOption | null>(null);
  const [selectedLine, setSelectedLine] = useState<BarcodeSourceLineOption | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<BarcodeSourcePackageOption | null>(null);
  const [availablePrinters, setAvailablePrinters] = useState<BarcodePrinterTarget[]>([]);
  const [selectedPrinterId, setSelectedPrinterId] = useState('browser-print');
  const [selectedServerPrinterId, setSelectedServerPrinterId] = useState('');
  const [selectedServerPrinterProfileId, setSelectedServerPrinterProfileId] = useState('');
  const [sampleData, setSampleData] = useState({
    stockCode: 'STK-2026-001',
    stockName: 'Camasir Makinesi Motor',
    serialNo: 'SN-000245',
  });
  const [batchInput, setBatchInput] = useState('STK-2026-001|Camasir Makinesi Motor|SN-000245');
  const [resolvedSourceItems, setResolvedSourceItems] = useState<BarcodePrintSourceItem[]>([]);

  const templateQuery = useQuery({
    queryKey: ['barcode-designer-template', templateId],
    queryFn: ({ signal }) => barcodeDesignerApi.getTemplate(templateId!, { signal }),
    enabled: !!templateId,
  });

  const draftQuery = useQuery({
    queryKey: ['barcode-designer-draft', templateId],
    queryFn: ({ signal }) => barcodeDesignerApi.getDraft(templateId!, { signal }),
    enabled: !!templateId,
  });

  const serverPrintersQuery = useQuery({
    queryKey: ['printer-management-printers-for-barcode-print'],
    queryFn: ({ signal }) => printerManagementApi.getPrinters({ signal }),
  });

  const templatePrinterProfilesQuery = useQuery({
    queryKey: ['barcode-designer-template-printer-profiles-for-print', templateId],
    queryFn: ({ signal }) => printerManagementApi.getTemplatePrinterProfiles(templateId!, { signal }),
    enabled: !!templateId,
  });

  const printerProfilesQuery = useQuery({
    queryKey: ['printer-management-profiles-for-barcode-print'],
    queryFn: ({ signal }) => printerManagementApi.getProfiles(undefined, { signal }),
  });

  useEffect(() => {
    setPageTitle(t('sidebar.erpBarcodePrint', { defaultValue: 'Etiket Bas' }));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

  useEffect(() => {
    setSelectedHeader(null);
    setSelectedLine(null);
    setSelectedPackage(null);
    setSourceHeaderId('');
    setSourceLineId('');
  }, [sourceModule, printMode]);

  useEffect(() => {
    void discoverBarcodePrinters().then(setAvailablePrinters).catch(() => setAvailablePrinters([]));
  }, []);

  useEffect(() => {
    const firstActivePrinter = serverPrintersQuery.data?.data?.find((item) => item.isActive);
    if (firstActivePrinter?.id && !selectedServerPrinterId) {
      setSelectedServerPrinterId(String(firstActivePrinter.id));
    }
  }, [selectedServerPrinterId, serverPrintersQuery.data?.data]);

  useEffect(() => {
    const defaultMapping = templatePrinterProfilesQuery.data?.data?.find((item) => item.isDefault);
    if (!defaultMapping) {
      return;
    }

    const matchedPrinter = serverPrintersQuery.data?.data?.find((item) => item.code === defaultMapping.printerCode && item.isActive);
    if (matchedPrinter?.id) {
      setSelectedServerPrinterId(String(matchedPrinter.id));
    }
    setSelectedServerPrinterProfileId(String(defaultMapping.printerProfileId));
  }, [serverPrintersQuery.data?.data, templatePrinterProfilesQuery.data?.data]);

  const availableServerProfiles = useMemo(() => {
    const selectedPrinter = (serverPrintersQuery.data?.data ?? []).find((item) => String(item.id) === selectedServerPrinterId);
    const templateMappings = templatePrinterProfilesQuery.data?.data ?? [];
    const allProfiles = printerProfilesQuery.data?.data ?? [];

    return allProfiles.filter((profile) => {
      if (!profile.isActive) {
        return false;
      }

      const printerMatches = !selectedPrinter || profile.printerCode === selectedPrinter.code;
      const mappedToTemplate = !templateId || templateMappings.some((mapping) => mapping.printerProfileId === profile.id);

      return printerMatches && mappedToTemplate;
    });
  }, [printerProfilesQuery.data?.data, selectedServerPrinterId, serverPrintersQuery.data?.data, templateId, templatePrinterProfilesQuery.data?.data]);

  const documentState = useMemo<BarcodeDesignerTemplateDocument>(() => {
    try {
      if (draftQuery.data?.data?.templateJson) {
        const parsed = parseTemplateDocument(draftQuery.data.data.templateJson);
        return {
          ...parsed,
          bindings: {
            ...parsed.bindings,
            ...sampleData,
            'stock.barcode': sampleData.stockCode,
          },
        };
      }
    } catch {
      return DEFAULT_TEMPLATE_DOCUMENT;
    }

    return {
      ...DEFAULT_TEMPLATE_DOCUMENT,
      bindings: {
        ...DEFAULT_TEMPLATE_DOCUMENT.bindings,
        ...sampleData,
        'stock.barcode': sampleData.stockCode,
      },
    };
  }, [draftQuery.data?.data?.templateJson, sampleData]);

  const previewMutation = useMutation({
    mutationFn: async () => await barcodeDesignerApi.preview({
      templateId,
      templateJson: draftQuery.data?.data?.templateJson ?? JSON.stringify(documentState),
      sourceModule,
      sourceHeaderId: sourceHeaderId.trim() ? Number(sourceHeaderId) : null,
      sourceLineId: sourceLineId.trim() ? Number(sourceLineId) : null,
      printMode,
      sampleData,
    }),
    onSuccess: (response) => {
      toast.success(response.message || 'Print preview hazirlandi');
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Print preview hazirlanamadi');
    },
  });

  const resolveSourceMutation = useMutation({
    mutationFn: async () => {
      if (sourceModule === 'package' && selectedPackage) {
        const lines = await packageApi.getPLinesByPackage(selectedPackage.id);
        const packageItems: BarcodePrintSourceItem[] = lines.map((line) => ({
          sourceModule,
          sourceHeaderId: selectedPackage.headerId,
          sourceLineId: line.id,
          stockCode: line.stockCode,
          stockName: line.stockName ?? `Paket ${selectedPackage.title}`,
          serialNo: line.serialNo ?? selectedPackage.barcode ?? null,
          yapKod: line.yapKod ?? null,
          quantity: line.quantity,
          description: selectedPackage.title,
        }));
        return {
          success: true,
          message: 'Paket icerigi cozuldu',
          exceptionMessage: '',
          data: packageItems,
          errors: [],
          timestamp: new Date().toISOString(),
          statusCode: 200,
          className: 'ApiResponse',
        };
      }

      return await barcodeDesignerApi.resolvePrintSource({
        sourceModule,
        sourceHeaderId: sourceHeaderId.trim() ? Number(sourceHeaderId) : null,
        sourceLineId: sourceLineId.trim() ? Number(sourceLineId) : null,
        printMode,
      });
    },
    onSuccess: (response) => {
      const items = response.data ?? [];
      setResolvedSourceItems(items);
      if (items.length > 0) {
        const first = items[0];
        setSampleData({
          stockCode: first.stockCode ?? sampleData.stockCode,
          stockName: first.stockName ?? sampleData.stockName,
          serialNo: first.serialNo ?? sampleData.serialNo,
        });
        setBatchInput(items.map((item) => `${item.stockCode ?? ''}|${item.stockName ?? ''}|${item.serialNo ?? ''}`).join('\n'));
      }
      toast.success(response.message || 'Kaynak belge çözüldü');
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Kaynak belge çözümlenemedi');
    },
  });

  const connectPrinterMutation = useMutation({
    mutationFn: async (type: 'usb' | 'serial') => await connectBarcodePrinter(type),
    onSuccess: async (printer) => {
      const next = await discoverBarcodePrinters();
      setAvailablePrinters(next);
      setSelectedPrinterId(printer.id);
      toast.success(`${printer.name} baglandi`);
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Yazici baglanamadi');
    },
  });

  const refreshPrintersMutation = useMutation({
    mutationFn: async () => await discoverBarcodePrinters(),
    onSuccess: (printers) => {
      setAvailablePrinters(printers);
      toast.success('Yazici hedefleri yenilendi');
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Yazici hedefleri okunamadi');
    },
  });

  const serverPrintMutation = useMutation({
    mutationFn: async () => {
      if (!selectedServerPrinterId) {
        throw new Error('Sunucu yazicisi secilmedi');
      }

      const rows = batchInput
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);

      const records = rows.length > 0
        ? rows.map((row) => {
            const [stockCode = sampleData.stockCode, stockName = sampleData.stockName, serialNo = sampleData.serialNo] = row.split('|');
            return { stockCode, stockName, serialNo };
          })
        : Array.from({ length: printQuantity }, () => sampleData);

      return await printerManagementApi.createPrintJob({
        printerDefinitionId: Number(selectedServerPrinterId),
        printerProfileId: selectedServerPrinterProfileId ? Number(selectedServerPrinterProfileId) : null,
        barcodeTemplateId: templateId,
        jobName: `${templateQuery.data?.data?.templateCode ?? 'BARCODE'}-${new Date().toISOString()}`,
        outputFormat: 'Pdf',
        copies: Math.max(1, printQuantity),
        payloadJson: JSON.stringify({
          templateJson: draftQuery.data?.data?.templateJson ?? JSON.stringify(documentState),
          sampleData,
          records,
          resolvedSourceItems,
        }),
        previewPayload: draftQuery.data?.data?.templateJson ?? JSON.stringify(documentState),
        sourceModule,
        sourceHeaderId: sourceHeaderId.trim() ? Number(sourceHeaderId) : null,
        sourceLineId: sourceLineId.trim() ? Number(sourceLineId) : null,
      });
    },
    onSuccess: (response) => {
      toast.success(response.message || 'Baski isi kuyruga alindi');
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Baski isi olusturulamadi');
    },
  });

  const buildStageImage = (): string => {
    const stage = stageRef.current;
    if (!stage) {
      throw new Error('Canvas hazir degil');
    }

    return stage.toDataURL({ pixelRatio: 2 });
  };

  const handleExportPdf = async (): Promise<void> => {
    if (!permission.canCreate && !permission.canUpdate) {
      toast.error('Yazdirma yetkiniz yok');
      return;
    }
    const rows = batchInput
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    const batchRecords = rows.length > 0
      ? rows.map((row) => {
          const [stockCode = sampleData.stockCode, stockName = sampleData.stockName, serialNo = sampleData.serialNo] = row.split('|');
          return { stockCode, stockName, serialNo };
        })
      : Array.from({ length: printQuantity }, () => sampleData);

    const { jsPDF } = await loadJsPdfModule();
    const pdf = new jsPDF({
      orientation: documentState.canvas.width > documentState.canvas.height ? 'landscape' : 'portrait',
      unit: 'mm',
      format: [documentState.canvas.width, documentState.canvas.height],
    });

    batchRecords.forEach((record, index) => {
      flushSync(() => {
        setSampleData(record);
      });
      const image = buildStageImage();
      if (index > 0) {
        pdf.addPage([documentState.canvas.width, documentState.canvas.height], documentState.canvas.width > documentState.canvas.height ? 'landscape' : 'portrait');
      }
      pdf.addImage(image, 'PNG', 0, 0, documentState.canvas.width, documentState.canvas.height);
    });

    pdf.save(`${templateQuery.data?.data?.templateCode ?? 'barcode-template'}-batch.pdf`);
  };

  const handleDirectPrint = (): void => {
    try {
      const image = buildStageImage();
      openBrowserPrintWindow(image, documentState.canvas.width, documentState.canvas.height);
      toast.success('Tarayici yazdir penceresi acildi');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Yazdirma baslatilamadi');
    }
  };

  return (
    <div className="crm-page space-y-6">
      <Breadcrumb
        items={[
          { label: t('sidebar.erp', { defaultValue: 'ERP' }) },
          { label: t('sidebar.erpBarcodeDesigner', { defaultValue: 'Barkod Designer' }) },
          { label: t('sidebar.erpBarcodePrint', { defaultValue: 'Etiket Bas' }), isActive: true },
        ]}
      />

      <section className="rounded-3xl border border-slate-200/80 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_32%),linear-gradient(135deg,_rgba(255,255,255,0.96),_rgba(241,245,249,0.92))] p-6 shadow-sm dark:border-white/10 dark:bg-[radial-gradient(circle_at_top_left,_rgba(52,211,153,0.16),_transparent_30%),linear-gradient(135deg,_rgba(15,23,42,0.96),_rgba(15,23,42,0.88))]">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline">{t('sidebar.erp', { defaultValue: 'ERP' })}</Badge>
              <Badge variant="secondary">Print</Badge>
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">{t('sidebar.erpBarcodePrint', { defaultValue: 'Etiket Bas' })}</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                Seçilen template için örnek veriyi doldurun, baskı önizlemesini görün ve PDF çıktısı üretin.
              </p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Button variant="outline" onClick={() => previewMutation.mutate()}>
              <Sparkles className="mr-2 size-4" />
              Preview
            </Button>
            <Button onClick={handleExportPdf} disabled={!permission.canCreate && !permission.canUpdate}>
              <Download className="mr-2 size-4" />
              PDF Bas
            </Button>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[0.34fr_0.66fr]">
        <Card className="border-slate-200/80 bg-white/85 dark:border-white/10 dark:bg-white/[0.03]">
          <CardHeader>
            <CardTitle>Baski Parametreleri</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 text-sm dark:border-white/10 dark:bg-slate-900/30">
              <div className="font-medium text-slate-900 dark:text-white">Template</div>
              <div className="mt-2 text-slate-600 dark:text-slate-300">{templateQuery.data?.data?.displayName ?? '-'}</div>
            </div>
            <div className="space-y-2">
              <Label>Baskı Modu</Label>
              <Select value={printMode} onValueChange={(value) => setPrintMode(value as 'manual' | 'document-line' | 'document-all')}>
                <SelectTrigger>
                  <SelectValue placeholder="Baski modu sec" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manuel</SelectItem>
                  <SelectItem value="document-line">Belirli Belge Satırı</SelectItem>
                  <SelectItem value="document-all">Belgedeki Tum Kalemler</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Kaynak Modül</Label>
              <Select value={sourceModule} onValueChange={(value) => setSourceModule(value as BarcodePrintSourceModule)}>
                <SelectTrigger>
                  <SelectValue placeholder="Kaynak modül seç" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="goods-receipt">Mal Kabul</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                  <SelectItem value="shipment">Sevkiyat</SelectItem>
                  <SelectItem value="warehouse-inbound">Ambar Giriş</SelectItem>
                  <SelectItem value="warehouse-outbound">Ambar Çıkış</SelectItem>
                  <SelectItem value="subcontracting-issue">Fason Çıkış</SelectItem>
                  <SelectItem value="subcontracting-receipt">Fason Giriş</SelectItem>
                  <SelectItem value="package">Paketleme</SelectItem>
                  <SelectItem value="production-transfer">Üretim Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {printMode === 'manual' ? null : (
              <>
                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 text-sm dark:border-white/10 dark:bg-slate-900/30">
                  <div className="font-medium text-slate-900 dark:text-white">
                    {selectedHeader ? selectedHeader.title : 'Belge secilmedi'}
                  </div>
                  <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    {selectedPackage
                      ? `Paket: ${selectedPackage.title}${selectedPackage.barcode ? ` | Barkod ${selectedPackage.barcode}` : ''}`
                      : selectedLine
                      ? `Satir: ${selectedLine.title}${selectedLine.quantity != null ? ` | Qty ${selectedLine.quantity}` : ''}`
                      : printMode === 'document-all'
                        ? 'Tum belge kalemleri basim hazirligina alinacak.'
                        : 'Henuz satir secilmedi.'}
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <Button variant="outline" onClick={() => setPickerOpen(true)} disabled={!permission.canCreate && !permission.canUpdate}>
                      {printMode === 'document-all' ? 'Belge Sec' : 'Belge Satiri Sec'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => resolveSourceMutation.mutate()}
                      disabled={(!permission.canCreate && !permission.canUpdate) || !sourceHeaderId || (printMode === 'document-line' && !sourceLineId && !selectedPackage)}
                    >
                      Kaynak Belgeden Doldur
                    </Button>
                  </div>
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label>Stok Kodu</Label>
              <Input value={sampleData.stockCode} onChange={(event) => setSampleData((current) => ({ ...current, stockCode: event.target.value }))} disabled={!permission.canCreate && !permission.canUpdate} />
            </div>
            <div className="space-y-2">
              <Label>Stok Adı</Label>
              <Input value={sampleData.stockName} onChange={(event) => setSampleData((current) => ({ ...current, stockName: event.target.value }))} disabled={!permission.canCreate && !permission.canUpdate} />
            </div>
            <div className="space-y-2">
              <Label>Seri No</Label>
              <Input value={sampleData.serialNo} onChange={(event) => setSampleData((current) => ({ ...current, serialNo: event.target.value }))} disabled={!permission.canCreate && !permission.canUpdate} />
            </div>
            <div className="space-y-2">
              <Label>Adet</Label>
              <Input type="number" value={printQuantity} onChange={(event) => setPrintQuantity(Math.max(1, Number(event.target.value) || 1))} disabled={!permission.canCreate && !permission.canUpdate} />
            </div>
            <div className="space-y-2">
              <Label>Batch Print Satırları</Label>
              <Textarea
                value={batchInput}
                onChange={(event) => setBatchInput(event.target.value)}
                className="min-h-[120px] text-xs"
                disabled={!permission.canCreate && !permission.canUpdate}
              />
              <div className="text-xs text-slate-500">Her satır: `stokKodu|stokAdi|seriNo`</div>
              <div className="text-xs text-slate-500">Bu alan özellikle barkodu kaybolmuş ürünler için veya belge içindeki çoklu satır baskı hazırlığı için kullanılabilir.</div>
            </div>
            <Button className="w-full" onClick={handleExportPdf} disabled={!permission.canCreate && !permission.canUpdate}>
              <Printer className="mr-2 size-4" />
              Etiket Bas
            </Button>
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 text-sm dark:border-white/10 dark:bg-slate-900/30">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="font-medium text-slate-900 dark:text-white">Yazici ve Yazdir</div>
                <Button variant="outline" size="sm" onClick={() => refreshPrintersMutation.mutate()} disabled={!permission.canCreate && !permission.canUpdate}>
                  <Search className="mr-2 size-4" />
                  Yazici Bul
                </Button>
              </div>
              <div className="space-y-2">
                <Label>Yazdirma Hedefi</Label>
                <Select value={selectedPrinterId} onValueChange={setSelectedPrinterId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Yazici hedefi sec" />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePrinters.map((printer) => (
                      <SelectItem key={printer.id} value={printer.id}>
                        {printer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="mt-3 space-y-2 text-xs text-slate-500">
                <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/70 px-3 py-2 dark:border-emerald-400/20 dark:bg-emerald-500/10">
                  <div className="font-medium text-emerald-900 dark:text-emerald-100">Sunucu Yazicilari</div>
                  <div className="mt-2 space-y-2">
                    <Label>Sunucu Yazici Sec</Label>
                    <Select value={selectedServerPrinterId} onValueChange={setSelectedServerPrinterId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sunucu yazicisi sec" />
                      </SelectTrigger>
                      <SelectContent>
                        {(serverPrintersQuery.data?.data ?? []).map((printer) => (
                          <SelectItem key={printer.id} value={String(printer.id)}>
                            {printer.displayName} ({printer.connectionType})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Label>Sunucu Printer Profile</Label>
                    <Select value={selectedServerPrinterProfileId} onValueChange={setSelectedServerPrinterProfileId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Printer profile sec" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableServerProfiles.map((profile) => (
                          <SelectItem key={profile.id} value={String(profile.id)}>
                            {profile.displayName} ({profile.outputType} / {profile.transportType})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {availableServerProfiles.length === 0 ? (
                      <div className="text-[11px] text-amber-700 dark:text-amber-300">
                        Secili template ve yazici icin uygun printer profile bulunamadi.
                      </div>
                    ) : null}
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <Button onClick={() => serverPrintMutation.mutate()} disabled={(!permission.canCreate && !permission.canUpdate) || !selectedServerPrinterId || !selectedServerPrinterProfileId}>
                      <Printer className="mr-2 size-4" />
                      Sunucuya Baski Gonder
                    </Button>
                    <Button variant="outline" onClick={() => void serverPrintersQuery.refetch()}>
                      <RefreshCcw className="mr-2 size-4" />
                      Sunucu Yazicilarini Yenile
                    </Button>
                  </div>
                </div>
                {availablePrinters.map((printer) => (
                  <div key={printer.id} className="rounded-xl border border-slate-200/80 px-3 py-2 dark:border-white/10">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium text-slate-700 dark:text-slate-200">{printer.name}</span>
                      <Badge variant={printer.ready ? 'secondary' : 'outline'}>{printer.type}</Badge>
                    </div>
                    <div className="mt-1">{printer.description}</div>
                    {!printer.ready && printer.type !== 'browser' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => connectPrinterMutation.mutate(printer.type === 'usb' ? 'usb' : 'serial')}
                      >
                        Baglan
                      </Button>
                    ) : null}
                  </div>
                ))}
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <Button variant="outline" onClick={handleExportPdf} disabled={!permission.canCreate && !permission.canUpdate}>
                  <Download className="mr-2 size-4" />
                  PDF Olustur
                </Button>
                <Button onClick={handleDirectPrint}>
                  <Printer className="mr-2 size-4" />
                  Yazdir
                </Button>
              </div>
              <div className="mt-2 text-[11px] text-slate-500">
                Birincil akış sunucu kuyruguna baski işi gondermektir. Tarayici yazdir ise lokal/fallback senaryo için korunur.
              </div>
            </div>
            {resolvedSourceItems.length > 0 ? (
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 text-xs text-slate-600 dark:border-white/10 dark:bg-slate-900/30 dark:text-slate-300">
                Çözümlenen satır sayısı: {resolvedSourceItems.length}
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 bg-white/85 dark:border-white/10 dark:bg-white/[0.03]">
          <CardHeader>
            <CardTitle>Baski Onizleme</CardTitle>
          </CardHeader>
          <CardContent>
            <BarcodeDesignerCanvas
              document={documentState}
              selectedElementId={null}
              selectedElementIds={[]}
              onSelectElement={() => undefined}
              onClearSelection={() => undefined}
              onMoveElement={() => undefined}
              arrangementGuides={{ x: [], y: [] }}
              stageRef={stageRef}
            />
          </CardContent>
        </Card>
      </div>

      <BarcodePrintSourcePickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        sourceModule={sourceModule}
        printMode={printMode}
        selectedHeaderId={sourceHeaderId.trim() ? Number(sourceHeaderId) : null}
        selectedLineId={sourceLineId.trim() ? Number(sourceLineId) : null}
        selectedPackageId={selectedPackage?.id ?? null}
        onConfirm={({ header, line, packageItem }) => {
          setSelectedHeader(header);
          setSelectedLine(line ?? null);
          setSelectedPackage(packageItem ?? null);
          setSourceHeaderId(String(header.id));
          setSourceLineId(line?.id ? String(line.id) : '');
        }}
      />
    </div>
  );
}
