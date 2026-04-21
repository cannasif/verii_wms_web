import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { barcodePrintSourceBrowserApi } from '../api/barcode-print-source-browser.api';
import type {
  BarcodePrintSourceModule,
  BarcodeSourceHeaderOption,
  BarcodeSourceLineOption,
  BarcodeSourcePackageOption,
} from '../types/barcode-designer-editor.types';

interface BarcodePrintSourcePickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceModule: BarcodePrintSourceModule;
  printMode: 'manual' | 'document-line' | 'document-all';
  selectedHeaderId?: number | null;
  selectedLineId?: number | null;
  selectedPackageId?: number | null;
  onConfirm: (payload: {
    header: BarcodeSourceHeaderOption;
    line?: BarcodeSourceLineOption | null;
    packageItem?: BarcodeSourcePackageOption | null;
  }) => void;
}

export function BarcodePrintSourcePickerDialog({
  open,
  onOpenChange,
  sourceModule,
  printMode,
  selectedHeaderId,
  selectedLineId,
  selectedPackageId,
  onConfirm,
}: BarcodePrintSourcePickerDialogProps): ReactElement {
  const [search, setSearch] = useState('');
  const [activeHeaderId, setActiveHeaderId] = useState<number | null>(selectedHeaderId ?? null);
  const [activeLineId, setActiveLineId] = useState<number | null>(selectedLineId ?? null);
  const [activePackageId, setActivePackageId] = useState<number | null>(selectedPackageId ?? null);
  const [packageTab, setPackageTab] = useState<'lines' | 'packages'>('lines');

  useEffect(() => {
    if (open) {
      setActiveHeaderId(selectedHeaderId ?? null);
      setActiveLineId(selectedLineId ?? null);
      setActivePackageId(selectedPackageId ?? null);
      setPackageTab(selectedPackageId ? 'packages' : 'lines');
    }
  }, [open, selectedHeaderId, selectedLineId, selectedPackageId]);

  const headersQuery = useQuery({
    queryKey: ['barcode-print-source-headers', sourceModule, search],
    queryFn: () => barcodePrintSourceBrowserApi.getHeaders(sourceModule, search),
    enabled: open && printMode !== 'manual',
  });

  const linesQuery = useQuery({
    queryKey: ['barcode-print-source-lines', sourceModule, activeHeaderId],
    queryFn: () => barcodePrintSourceBrowserApi.getLines(sourceModule, activeHeaderId!),
    enabled: open && printMode === 'document-line' && !!activeHeaderId,
  });

  const packagesQuery = useQuery({
    queryKey: ['barcode-print-source-packages', activeHeaderId],
    queryFn: () => barcodePrintSourceBrowserApi.getPackages(activeHeaderId!),
    enabled: open && printMode === 'document-line' && sourceModule === 'package' && !!activeHeaderId,
  });

  const selectedHeader = useMemo(
    () => headersQuery.data?.find((item) => item.id === activeHeaderId) ?? null,
    [activeHeaderId, headersQuery.data],
  );

  const selectedLine = useMemo(
    () => linesQuery.data?.find((item) => item.id === activeLineId) ?? null,
    [activeLineId, linesQuery.data],
  );

  const selectedPackage = useMemo(
    () => packagesQuery.data?.find((item) => item.id === activePackageId) ?? null,
    [activePackageId, packagesQuery.data],
  );

  const isPackageModule = sourceModule === 'package' && printMode === 'document-line';
  const confirmDisabled = printMode === 'document-all'
    ? !selectedHeader
    : !selectedHeader || (isPackageModule ? (!selectedLine && !selectedPackage) : !selectedLine);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl">
        <DialogHeader>
          <DialogTitle>Kaynak Belge Sec</DialogTitle>
          <DialogDescription>
            {printMode === 'document-all'
              ? 'Tum belge kalemlerini baski akisina eklemek icin bir header secin.'
              : 'Belge satiri veya paket secerek baski verisini dogrudan operasyon kaynagindan alin.'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 xl:grid-cols-[0.44fr_0.56fr]">
          <section className="space-y-3">
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200/80 bg-slate-50/70 px-3 py-2 dark:border-white/10 dark:bg-slate-900/30">
              <Search className="size-4 text-slate-500" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Belge no, cari, depo veya durum ile ara"
                className="border-0 bg-transparent shadow-none focus-visible:ring-0"
              />
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200/80 dark:border-white/10">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Belge</TableHead>
                    <TableHead>Aciklama</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead>Tarih</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(headersQuery.data ?? []).map((header) => (
                    <TableRow
                      key={header.id}
                      data-state={header.id === activeHeaderId ? 'selected' : undefined}
                      className="cursor-pointer"
                      onClick={() => {
                        setActiveHeaderId(header.id);
                        setActiveLineId(null);
                        setActivePackageId(null);
                      }}
                    >
                      <TableCell className="font-medium">{header.title}</TableCell>
                      <TableCell>{header.subtitle ?? '-'}</TableCell>
                      <TableCell>{header.status ? <Badge variant="outline">{header.status}</Badge> : '-'}</TableCell>
                      <TableCell>{header.documentDate ?? '-'}</TableCell>
                    </TableRow>
                  ))}
                  {!headersQuery.isLoading && (headersQuery.data?.length ?? 0) === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="py-10 text-center text-sm text-slate-500">
                        Secilen modulde belge bulunamadi.
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </div>
          </section>

          <section className="space-y-3">
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-slate-900/30">
              <div className="flex items-center justify-between gap-3">
                <div className="font-medium text-slate-900 dark:text-white">
                  {selectedHeader ? selectedHeader.title : 'Belge secilmedi'}
                </div>
                {selectedHeader?.status ? <Badge variant="outline">{selectedHeader.status}</Badge> : null}
              </div>
              {selectedHeader?.subtitle ? <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{selectedHeader.subtitle}</div> : null}
            </div>

            {printMode === 'document-all' ? (
              <div className="rounded-2xl border border-dashed border-emerald-300/70 bg-emerald-50/70 p-6 text-sm text-emerald-900 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-100">
                Bu secim, header altindaki tum satirlari batch baski hazirligina alir.
              </div>
            ) : (
              <Tabs value={isPackageModule ? packageTab : 'lines'} onValueChange={(value) => setPackageTab(value as 'lines' | 'packages')} className="space-y-3">
                {isPackageModule ? (
                  <TabsList>
                    <TabsTrigger value="lines">Satirlar</TabsTrigger>
                    <TabsTrigger value="packages">Paketler</TabsTrigger>
                  </TabsList>
                ) : null}

                <TabsContent value="lines" className="space-y-0">
                  <div className="overflow-hidden rounded-2xl border border-slate-200/80 dark:border-white/10">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Stok</TableHead>
                          <TableHead>Aciklama</TableHead>
                          <TableHead>Miktar</TableHead>
                          <TableHead>Seri</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(linesQuery.data ?? []).map((line) => (
                          <TableRow
                            key={line.id}
                            data-state={line.id === activeLineId ? 'selected' : undefined}
                            className="cursor-pointer"
                            onClick={() => {
                              setActiveLineId(line.id);
                              setActivePackageId(null);
                            }}
                          >
                            <TableCell className="font-medium">{line.title}</TableCell>
                            <TableCell>{line.subtitle ?? '-'}</TableCell>
                            <TableCell>{line.quantity ?? '-'}</TableCell>
                            <TableCell>{line.serialNo ?? '-'}</TableCell>
                          </TableRow>
                        ))}
                        {!linesQuery.isLoading && activeHeaderId && (linesQuery.data?.length ?? 0) === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="py-10 text-center text-sm text-slate-500">
                              Bu belge icin secilebilir satir bulunamadi.
                            </TableCell>
                          </TableRow>
                        ) : null}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                {isPackageModule ? (
                  <TabsContent value="packages" className="space-y-0">
                    <div className="overflow-hidden rounded-2xl border border-slate-200/80 dark:border-white/10">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Paket No</TableHead>
                            <TableHead>Tip</TableHead>
                            <TableHead>Barkod</TableHead>
                            <TableHead>Durum</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(packagesQuery.data ?? []).map((item) => (
                            <TableRow
                              key={item.id}
                              data-state={item.id === activePackageId ? 'selected' : undefined}
                              className="cursor-pointer"
                              onClick={() => {
                                setActivePackageId(item.id);
                                setActiveLineId(null);
                              }}
                            >
                              <TableCell className="font-medium">{item.title}</TableCell>
                              <TableCell>{item.subtitle ?? '-'}</TableCell>
                              <TableCell>{item.barcode ?? '-'}</TableCell>
                              <TableCell>{item.status ? <Badge variant="outline">{item.status}</Badge> : '-'}</TableCell>
                            </TableRow>
                          ))}
                          {!packagesQuery.isLoading && activeHeaderId && (packagesQuery.data?.length ?? 0) === 0 ? (
                            <TableRow>
                              <TableCell colSpan={4} className="py-10 text-center text-sm text-slate-500">
                                Bu header altinda secilebilir paket bulunamadi.
                              </TableCell>
                            </TableRow>
                          ) : null}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>
                ) : null}
              </Tabs>
            )}
          </section>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Vazgec
          </Button>
          <Button
            onClick={() => {
              if (!selectedHeader) {
                return;
              }
              onConfirm({
                header: selectedHeader,
                line: selectedLine,
                packageItem: selectedPackage,
              });
              onOpenChange(false);
            }}
            disabled={confirmDisabled}
          >
            Secimi Kullan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
