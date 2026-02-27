import { type ReactElement, useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useUIStore } from '@/stores/ui-store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useSitStokBarcode } from '../hooks/useSitStokBarcode';
import { useAddSitBarcode } from '../hooks/useAddSitBarcode';
import { useSitCollectedBarcodes } from '../hooks/useSitCollectedBarcodes';
import { useAssignedSitOrderLines } from '../hooks/useAssignedSitOrderLines';
import { useCompleteSit } from '../hooks/useCompleteSit';
import { Barcode, Package, ArrowLeft, Loader2, CheckCircle2, List, Camera, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Html5Qrcode, Html5QrcodeScanType, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import type { StokBarcodeDto } from '../types/subcontracting';

export function SitCollectionPage(): ReactElement {
  const { headerId } = useParams<{ headerId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { setPageTitle } = useUIStore();
  const [barcodeInput, setBarcodeInput] = useState('');
  const [searchBarcode, setSearchBarcode] = useState('');
  const [enableSearch, setEnableSearch] = useState(false);
  const [selectedStock, setSelectedStock] = useState<StokBarcodeDto | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const qrCodeScannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerRef = useRef<HTMLDivElement>(null);

  const headerIdNum = headerId ? parseInt(headerId, 10) : 0;

  const { data: orderLinesData, isLoading: isLoadingOrderLines } = useAssignedSitOrderLines(headerIdNum);
  const { data: collectedData } = useSitCollectedBarcodes(headerIdNum);
  const { data: barcodeData, isLoading: isSearching } = useSitStokBarcode(searchBarcode, '1', enableSearch);
  const addBarcodeMutation = useAddSitBarcode();
  const completeSitMutation = useCompleteSit();

  useEffect(() => {
    setPageTitle(t('subcontracting.sit.collection.title', 'SIT Toplama'));
    return () => {
      setPageTitle(null);
    };
  }, [t, setPageTitle]);

  useEffect(() => {
    if (barcodeData?.success && barcodeData.data && barcodeData.data.length > 0) {
      setSelectedStock(barcodeData.data[0]);
      setEnableSearch(false);
    } else if (barcodeData && !barcodeData.success) {
      toast.error(t('subcontracting.sit.collection.stockNotFound', 'Stok bulunamadı'));
      setEnableSearch(false);
    }
  }, [barcodeData, t]);

  const handleBarcodeSearch = useCallback(() => {
    if (!barcodeInput.trim()) {
      toast.error(t('subcontracting.sit.collection.enterBarcode', 'Lütfen barkod giriniz'));
      return;
    }
    setSearchBarcode(barcodeInput);
    setEnableSearch(true);
  }, [barcodeInput, t]);

  const handleCollect = (): void => {
    if (!selectedStock) {
      toast.error(t('subcontracting.sit.collection.noStockSelected', 'Lütfen önce stok bilgisi getirin'));
      return;
    }

    if (quantity <= 0) {
      toast.error(t('subcontracting.sit.collection.invalidQuantity', 'Geçersiz miktar'));
      return;
    }

    const matchingLine = orderLinesData?.data?.lines.find(
      (line) => line.stockCode === selectedStock.stokKodu
    );

    if (!matchingLine) {
      toast.error(t('subcontracting.sit.collection.stockNotInOrder', 'Bu stok SIT emrinde bulunmuyor'));
      return;
    }

    addBarcodeMutation.mutate(
      {
        headerId: headerIdNum,
        lineId: matchingLine.id,
        barcode: selectedStock.barkod,
        stockCode: selectedStock.stokKodu,
        stockName: selectedStock.stokAdi,
        yapKod: selectedStock.yapKod || '',
        yapAcik: selectedStock.yapAcik || '',
        quantity: quantity,
        serialNo: '',
        serialNo2: '',
        serialNo3: '',
        serialNo4: '',
        sourceCellCode: '',
        targetCellCode: '',
      },
      {
        onSuccess: (response) => {
          if (response.success) {
            toast.success(t('subcontracting.sit.collection.collected', 'Ürün toplandı'));
            setBarcodeInput('');
            setSelectedStock(null);
            setQuantity(1);
          } else {
            toast.error(response.message || t('subcontracting.sit.collection.collectError', 'Toplama hatası'));
          }
        },
        onError: (error: Error) => {
          toast.error(error.message || t('subcontracting.sit.collection.collectError', 'Toplama hatası'));
        },
      }
    );
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      handleBarcodeSearch();
    }
  };

  const handleComplete = (): void => {
    if (!headerIdNum) {
      toast.error(t('subcontracting.sit.collection.invalidHeaderId', 'Geçersiz SIT emri'));
      return;
    }

    completeSitMutation.mutate(headerIdNum, {
      onSuccess: (response) => {
        if (response.success) {
          toast.success(t('subcontracting.sit.collection.completed', 'SIT emri başarıyla tamamlandı'));
          navigate('/subcontracting/issue/assigned');
        } else {
          toast.error(response.message || t('subcontracting.sit.collection.completeError', 'Tamamlama hatası'));
        }
      },
      onError: (error: Error) => {
        toast.error(error.message || t('subcontracting.sit.collection.completeError', 'Tamamlama hatası'));
      },
    });
  };

  const handleOpenCamera = (): void => {
    setIsCameraOpen(true);
  };

  const handleCloseCamera = (): void => {
    if (qrCodeScannerRef.current) {
      qrCodeScannerRef.current.stop().catch(() => {});
      qrCodeScannerRef.current.clear();
      qrCodeScannerRef.current = null;
    }
    setIsCameraOpen(false);
  };

  useEffect(() => {
    if (!isCameraOpen) return;

    const initCamera = async (): Promise<void> => {
      await new Promise<void>((resolve) => {
        if (scannerContainerRef.current && document.getElementById('barcode-scanner-sit')) {
          resolve();
        } else {
          const checkElement = setInterval(() => {
            if (scannerContainerRef.current && document.getElementById('barcode-scanner-sit')) {
              clearInterval(checkElement);
              resolve();
            }
          }, 50);
          setTimeout(() => {
            clearInterval(checkElement);
            resolve();
          }, 1000);
        }
      });

      if (!scannerContainerRef.current || !document.getElementById('barcode-scanner-sit')) {
        toast.error(t('subcontracting.sit.collection.cameraError', 'Kamera açılamadı'));
        setIsCameraOpen(false);
        return;
      }

      const scannerId = 'barcode-scanner-sit';
      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.CODE_93,
          Html5QrcodeSupportedFormats.CODABAR,
          Html5QrcodeSupportedFormats.ITF,
        ],
      };

      const html5QrCode = new Html5Qrcode(scannerId);
      qrCodeScannerRef.current = html5QrCode;

      try {
        const devices = await Html5Qrcode.getCameras();
        let cameraId: string | { facingMode: string } = { facingMode: 'environment' };
        
        const backCamera = devices.find((device) => 
          device.label.toLowerCase().includes('back') || 
          device.label.toLowerCase().includes('rear') ||
          device.label.toLowerCase().includes('environment')
        );
        
        if (backCamera) {
          cameraId = backCamera.id;
        }

        await html5QrCode.start(
          cameraId,
          config,
          (decodedText) => {
            setBarcodeInput(decodedText);
            handleCloseCamera();
            toast.success(t('subcontracting.sit.collection.barcodeScanned', 'Barkod okundu'));
            setTimeout(() => {
              handleBarcodeSearch();
            }, 100);
          },
          () => {
            // Error callback - ignore
          }
        );
      } catch (err) {
        toast.error(t('subcontracting.sit.collection.cameraError', 'Kamera açılamadı'));
        console.error('Camera error:', err);
        handleCloseCamera();
      }
    };

    const timeoutId = setTimeout(() => {
      initCamera();
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      if (qrCodeScannerRef.current) {
        qrCodeScannerRef.current.stop().catch(() => {
          // Ignore errors when stopping
        });
        qrCodeScannerRef.current.clear();
        qrCodeScannerRef.current = null;
      }
    };
  }, [isCameraOpen, t, handleBarcodeSearch]);

  const totalCollectedCount = useMemo(() => {
    if (!collectedData?.data) return 0;
    return collectedData.data.reduce((total, item) => total + item.routes.length, 0);
  }, [collectedData?.data]);

  const orderLinesWithCollected = useMemo(() => {
    if (!orderLinesData?.data?.lines) return [];
    
    const collectedMap: Record<number, number> = {};
    
    if (collectedData?.data) {
      collectedData.data.forEach((item) => {
        const lineId = item.importLine.lineId;
        const totalCollected = item.routes.reduce((sum, route) => sum + route.quantity, 0);
        
        if (collectedMap[lineId]) {
          collectedMap[lineId] += totalCollected;
        } else {
          collectedMap[lineId] = totalCollected;
        }
      });
    }

    return orderLinesData.data.lines.map((line) => ({
      ...line,
      collectedQuantity: collectedMap[line.id] || 0,
      remainingQuantity: line.quantity - (collectedMap[line.id] || 0),
    }));
  }, [orderLinesData?.data?.lines, collectedData?.data]);

  return (
    <div className="flex md:w-1/2 flex-col h-[calc(100vh-10rem)] overflow-hidden">
      <div className="shrink-0 p-4 space-y-4 border-b bg-background">
        <div className="flex items-center justify-between gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/subcontracting/issue/assigned')}>
            <ArrowLeft className="size-4 mr-2" />
            {t('common.back', 'Geri')}
          </Button>
          <Button variant="outline" size="sm">
            <List className="size-4 mr-2" />
            {t('subcontracting.sit.collection.viewCollected', 'Toplananlar')} ({totalCollectedCount})
          </Button>
        </div>

        <Card className='py-0'>
          <CardContent className="p-3 space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Barcode className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-muted-foreground size-4 hidden md:block" />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute left-1 top-1/2 transform -translate-y-1/2 md:hidden h-8 w-8"
                  onClick={handleOpenCamera}
                >
                  <Camera className="size-4 text-muted-foreground" />
                </Button>
                <Input
                  placeholder={t('subcontracting.sit.collection.barcodePlaceholder', 'Barkod okutun veya yazın')}
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="pl-10 md:pl-9 h-10"
                />
              </div>
              <Button onClick={handleBarcodeSearch} disabled={isSearching} size="default">
                {isSearching ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  t('common.search', 'Ara')
                )}
              </Button>
            </div>

            {selectedStock && (
              <div className="border rounded-lg p-3 space-y-2 bg-muted/50">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <Badge variant="outline" className="mb-1 text-xs">
                      {selectedStock.stokKodu}
                    </Badge>
                    <p className="text-sm font-medium line-clamp-1">{selectedStock.stokAdi}</p>
                  </div>
                  <Badge variant="secondary" className="shrink-0">
                    <Package className="size-3 mr-1" />
                    {selectedStock.olcuAdi}
                  </Badge>
                </div>
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                      className="h-9"
                      placeholder={t('subcontracting.sit.collection.quantity', 'Miktar')}
                    />
                  </div>
                  <Button
                    onClick={handleCollect}
                    disabled={addBarcodeMutation.isPending}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white h-9"
                  >
                    {addBarcodeMutation.isPending ? (
                      <Loader2 className="size-4 animate-spin mr-1" />
                    ) : null}
                    {t('subcontracting.sit.collection.collect', 'Topla')}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide p-4 space-y-2 border border-#fee rounded-md">
        {isLoadingOrderLines ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        ) : orderLinesWithCollected.length > 0 ? (
          orderLinesWithCollected.map((line) => (
            <Card key={line.id} className="border py-2">
              <CardContent className="px-3">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                      {line.stockCode}
                    </Badge>
                    <p className="text-xs font-medium line-clamp-2 mt-1">{line.stockName}</p>
                    {line.yapKod && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {t('subcontracting.sit.collection.yapKod', 'Yapı')}: {line.yapKod}
                      </p>
                    )}
                  </div>
                  {line.remainingQuantity === 0 && (
                    <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                  )}
                </div>

                <div className="grid grid-cols-3 gap-1.5 mb-1.5">
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground mb-0.5">
                      {t('subcontracting.sit.collection.total', 'Toplam')}
                    </p>
                    <p className="text-sm font-bold leading-none">
                      {line.quantity}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground mb-0.5">
                      {t('subcontracting.sit.collection.collected', 'Toplanan')}
                    </p>
                    <p className="text-sm font-bold text-emerald-600 leading-none">
                      {line.collectedQuantity}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground mb-0.5">
                      {t('subcontracting.sit.collection.remaining', 'Kalan')}
                    </p>
                    <p className={`text-sm font-bold leading-none ${line.remainingQuantity === 0 ? 'text-emerald-600' : 'text-orange-600'}`}>
                      {line.remainingQuantity}
                    </p>
                  </div>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-1">
                  <div
                    className="bg-emerald-500 h-1 rounded-full transition-all duration-300"
                    style={{ width: `${(line.collectedQuantity / line.quantity) * 100}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">
              {t('subcontracting.sit.collection.noOrderLines', 'SIT emri kalemleri bulunamadı')}
            </p>
          </div>
        )}
      </div>

      <div className="shrink-0 p-4 border-t bg-background">
        <Button
          onClick={handleComplete}
          disabled={completeSitMutation.isPending}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          size="lg"
        >
          {completeSitMutation.isPending ? (
            <Loader2 className="size-4 animate-spin mr-2" />
          ) : (
            <Check className="size-4 mr-2" />
          )}
          {t('subcontracting.sit.collection.complete', 'Tamamla')}
        </Button>
      </div>

      <Dialog open={isCameraOpen} onOpenChange={(open) => {
        if (!open) {
          handleCloseCamera();
        }
      }}>
        <DialogContent className="max-w-[95vw] w-full p-0 gap-0" showCloseButton={true}>
          <DialogHeader className="p-4 pb-2">
            <DialogTitle>{t('subcontracting.sit.collection.scanBarcode', 'Barkod Okut')}</DialogTitle>
            <DialogDescription>
              {t('subcontracting.sit.collection.scanBarcodeDescription', 'Barkodu kameraya hizalayın')}
            </DialogDescription>
          </DialogHeader>
          <div className="relative w-full" style={{ minHeight: '300px' }}>
            <div
              id="barcode-scanner-sit"
              ref={scannerContainerRef}
              className="w-full"
              style={{ minHeight: '300px' }}
            />
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="border-2 border-white rounded-lg" style={{ width: '250px', height: '250px' }}>
                <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-white rounded-tl-lg"></div>
                <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-white rounded-tr-lg"></div>
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-white rounded-bl-lg"></div>
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-white rounded-br-lg"></div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

