import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Printer } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { barcodeDesignerApi } from '@/features/barcode-designer/api/barcode-designer.api';
import type { BarcodeTemplate } from '@/features/barcode-designer/types/barcode-designer-editor.types';
import { printerManagementApi } from '@/features/printer-management/api/printer-management.api';
import type { PrinterProfile } from '@/features/printer-management/types/printer-management.types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { OpsCircuitToggleField } from '@/components/shared';
import { packageApi } from '../api/package-api';
import type { PPackageTreeDto } from '../types/package';

interface PackageLabelPrintDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  packingHeaderId: number;
  initialPackageIds?: number[];
  title?: string;
  description?: string;
}

interface PackageTreeNodeRow {
  id: number;
  packageNo: string;
  packageType: string;
  status: string;
  depth: number;
  totalProductQuantity?: number;
  children: PackageTreeNodeRow[];
}

function mapTreeNodes(nodes: PPackageTreeDto[], depth = 0): PackageTreeNodeRow[] {
  return nodes.map((node) => ({
    id: node.package.id,
    packageNo: node.package.packageNo,
    packageType: node.package.packageType,
    status: node.package.status,
    totalProductQuantity: node.package.totalProductQuantity,
    depth,
    children: mapTreeNodes(node.children ?? [], depth + 1),
  }));
}

function flattenTreeIds(nodes: PackageTreeNodeRow[]): number[] {
  return nodes.flatMap((node) => [node.id, ...flattenTreeIds(node.children)]);
}

function collectSubtreeIds(nodes: PackageTreeNodeRow[], rootId: number): number[] {
  for (const node of nodes) {
    if (node.id === rootId) {
      return [node.id, ...flattenTreeIds(node.children)];
    }
    const nested = collectSubtreeIds(node.children, rootId);
    if (nested.length > 0) {
      return nested;
    }
  }

  return [];
}

function getStatusTone(status: string): string {
  switch (status) {
    case 'Draft':
      return 'bg-slate-100 text-slate-700';
    case 'Packed':
      return 'bg-emerald-100 text-emerald-700';
    case 'Sealed':
      return 'bg-cyan-100 text-cyan-700';
    case 'Loaded':
      return 'bg-blue-100 text-blue-700';
    case 'Transferred':
      return 'bg-amber-100 text-amber-700';
    case 'Shipped':
      return 'bg-violet-100 text-violet-700';
    case 'Cancelled':
      return 'bg-rose-100 text-rose-700';
    default:
      return 'bg-slate-100 text-slate-700';
  }
}

function PackageTreeRow({
  node,
  selectedIds,
  onToggle,
  onSelectSubtree,
  subtreeLabel,
}: {
  node: PackageTreeNodeRow;
  selectedIds: Set<number>;
  onToggle: (id: number) => void;
  onSelectSubtree: (id: number) => void;
  subtreeLabel: string;
}): ReactElement {
  return (
    <>
      <div
        className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-3 rounded-xl border border-slate-200/70 bg-white/70 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/3"
        style={{ marginLeft: `${node.depth * 16}px` }}
      >
        <input
          type="checkbox"
          checked={selectedIds.has(node.id)}
          onChange={() => onToggle(node.id)}
          className="h-4 w-4"
        />
        <div className="min-w-0">
          <div className="font-medium text-slate-900 dark:text-white">{node.packageNo}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {node.packageType} · {node.totalProductQuantity ?? 0}
          </div>
        </div>
        <Badge className={getStatusTone(node.status)}>{node.status}</Badge>
        <Button type="button" variant="ghost" size="sm" onClick={() => onSelectSubtree(node.id)}>
          {subtreeLabel}
        </Button>
      </div>
      {node.children.map((child) => (
        <PackageTreeRow
          key={child.id}
          node={child}
          selectedIds={selectedIds}
          onToggle={onToggle}
          onSelectSubtree={onSelectSubtree}
          subtreeLabel={subtreeLabel}
        />
      ))}
    </>
  );
}

export function PackageLabelPrintDialog({
  open,
  onOpenChange,
  packingHeaderId,
  initialPackageIds,
  title,
  description,
}: PackageLabelPrintDialogProps): ReactElement {
  const { t } = useTranslation(['package', 'common']);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [selectedPrinterId, setSelectedPrinterId] = useState('');
  const [selectedPrinterProfileId, setSelectedPrinterProfileId] = useState('');
  const [copies, setCopies] = useState(1);
  const [useGs1SsccForPallets, setUseGs1SsccForPallets] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set(initialPackageIds ?? []));

  const treeQuery = useQuery({
    queryKey: ['package-tree-print-dialog', packingHeaderId],
    queryFn: () => packageApi.getPPackageTreeByHeader(packingHeaderId),
    enabled: open && packingHeaderId > 0,
  });

  const templatesQuery = useQuery({
    queryKey: ['package-tree-print-templates'],
    queryFn: ({ signal }) => barcodeDesignerApi.getTemplates({ signal }),
    enabled: open,
  });

  const printersQuery = useQuery({
    queryKey: ['package-tree-print-printers'],
    queryFn: ({ signal }) => printerManagementApi.getPrinters({ signal }),
    enabled: open,
  });

  const templateMappingsQuery = useQuery({
    queryKey: ['package-tree-print-template-mappings', selectedTemplateId],
    queryFn: ({ signal }) => printerManagementApi.getTemplatePrinterProfiles(selectedTemplateId!, { signal }),
    enabled: open && selectedTemplateId != null,
  });

  const profilesQuery = useQuery({
    queryKey: ['package-tree-print-profiles'],
    queryFn: ({ signal }) => printerManagementApi.getProfiles(undefined, { signal }),
    enabled: open,
  });

  const treeRows = useMemo(() => mapTreeNodes(treeQuery.data ?? []), [treeQuery.data]);
  const allIds = useMemo(() => flattenTreeIds(treeRows), [treeRows]);

  const selectedTemplate = useMemo<BarcodeTemplate | null>(() => {
    const templates = templatesQuery.data?.data ?? [];
    return templates.find((item) => item.id === selectedTemplateId) ?? null;
  }, [selectedTemplateId, templatesQuery.data?.data]);

  const availableProfiles = useMemo<PrinterProfile[]>(() => {
    const selectedPrinter = (printersQuery.data?.data ?? []).find((item) => String(item.id) === selectedPrinterId);
    const templateMappings = templateMappingsQuery.data?.data ?? [];
    const allProfiles = profilesQuery.data?.data ?? [];

    return allProfiles.filter((profile) => {
      if (!profile.isActive) {
        return false;
      }

      const printerMatches = !selectedPrinter || profile.printerCode === selectedPrinter.code;
      const mappedToTemplate = !selectedTemplateId || templateMappings.some((mapping) => mapping.printerProfileId === profile.id);

      return printerMatches && mappedToTemplate;
    });
  }, [printersQuery.data?.data, profilesQuery.data?.data, selectedPrinterId, selectedTemplateId, templateMappingsQuery.data?.data]);

  useEffect(() => {
    if (!open) {
      return;
    }

    setSelectedIds(new Set(initialPackageIds ?? []));
  }, [initialPackageIds, open]);

  useEffect(() => {
    if (selectedTemplateId != null) {
      return;
    }

    const templates = templatesQuery.data?.data ?? [];
    const defaultTemplate = templates.find((item) => item.isActive) ?? templates[0];
    if (defaultTemplate?.id) {
      setSelectedTemplateId(defaultTemplate.id);
    }
  }, [selectedTemplateId, templatesQuery.data?.data]);

  useEffect(() => {
    const activePrinter = printersQuery.data?.data?.find((item) => item.isActive && item.isDefault)
      ?? printersQuery.data?.data?.find((item) => item.isActive);

    if (activePrinter?.id && !selectedPrinterId) {
      setSelectedPrinterId(String(activePrinter.id));
    }
  }, [printersQuery.data?.data, selectedPrinterId]);

  useEffect(() => {
    const defaultMapping = templateMappingsQuery.data?.data?.find((item) => item.isDefault)
      ?? templateMappingsQuery.data?.data?.[0];

    if (!defaultMapping) {
      return;
    }

    setSelectedPrinterProfileId(String(defaultMapping.printerProfileId));
    const matchingPrinter = (printersQuery.data?.data ?? []).find((item) => item.code === defaultMapping.printerCode && item.isActive);
    if (matchingPrinter?.id) {
      setSelectedPrinterId(String(matchingPrinter.id));
    }
  }, [printersQuery.data?.data, templateMappingsQuery.data?.data]);

  const printMutation = useMutation({
    mutationFn: async () => {
      if (selectedIds.size === 0) {
        throw new Error(t('print.selectPackageFirst'));
      }
      if (!selectedTemplateId) {
        throw new Error(t('print.selectTemplateFirst'));
      }
      if (!selectedPrinterId) {
        throw new Error(t('print.selectPrinterFirst'));
      }

      return await packageApi.printLabels({
        printerDefinitionId: Number(selectedPrinterId),
        printerProfileId: selectedPrinterProfileId ? Number(selectedPrinterProfileId) : null,
        barcodeTemplateId: selectedTemplateId,
        packingHeaderId,
        packageIds: Array.from(selectedIds),
        copies: Math.max(1, copies),
        printMode: 'tree',
        includeChildren: true,
        useGs1SsccForPallets,
      });
    },
    onSuccess: (response) => {
      toast.success(response.message || t('print.queued'));
      onOpenChange(false);
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : t('print.failed'));
    },
  });

  const toggleSelection = (id: number): void => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectSubtree = (id: number): void => {
    const subtreeIds = collectSubtreeIds(treeRows, id);
    setSelectedIds((current) => {
      const next = new Set(current);
      subtreeIds.forEach((item) => next.add(item));
      return next;
    });
  };

  const selectAll = (): void => {
    setSelectedIds(new Set(allIds));
  };

  const clearSelection = (): void => {
    setSelectedIds(new Set());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="wms-ops-form wms-ops-erp-skin max-w-4xl">
        <DialogHeader>
          <DialogTitle>{title ?? t('print.title')}</DialogTitle>
          <DialogDescription>
            {description ?? t('print.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{t('print.selectedPackage', { count: selectedIds.size })}</Badge>
              <Button type="button" variant="outline" size="sm" onClick={selectAll} disabled={allIds.length === 0}>
                {t('print.selectAll')}
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={clearSelection} disabled={selectedIds.size === 0}>
                {t('print.clear')}
              </Button>
            </div>
            <div className="max-h-[420px] space-y-2 overflow-y-auto rounded-2xl border border-slate-200/70 bg-slate-50/80 p-3 dark:border-white/10 dark:bg-white/3">
              {treeQuery.isLoading ? (
                <div className="text-sm text-slate-500">{t('print.treeLoading')}</div>
              ) : treeRows.length === 0 ? (
                <div className="text-sm text-slate-500">{t('print.emptyTree')}</div>
              ) : (
                treeRows.map((node) => (
                  <PackageTreeRow
                    key={node.id}
                    node={node}
                    selectedIds={selectedIds}
                    onToggle={toggleSelection}
                    onSelectSubtree={selectSubtree}
                    subtreeLabel={t('print.subtree')}
                  />
                ))
              )}
            </div>
          </div>

          <div className="space-y-4 rounded-2xl border border-slate-200/70 bg-white/80 p-4 dark:border-white/10 dark:bg-white/3">
            <div className="space-y-2">
              <Label>{t('print.barcodeTemplate')}</Label>
              <Select value={selectedTemplateId ? String(selectedTemplateId) : ''} onValueChange={(value) => setSelectedTemplateId(Number(value))}>
                <SelectTrigger>
                  <SelectValue placeholder={t('print.templatePlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {(templatesQuery.data?.data ?? []).map((template) => (
                    <SelectItem key={template.id} value={String(template.id)}>
                      {template.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('print.printer')}</Label>
              <Select value={selectedPrinterId} onValueChange={setSelectedPrinterId}>
                <SelectTrigger>
                  <SelectValue placeholder={t('print.printerPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {(printersQuery.data?.data ?? []).filter((item) => item.isActive).map((printer) => (
                    <SelectItem key={printer.id} value={String(printer.id)}>
                      {printer.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('print.printerProfile')}</Label>
              <Select value={selectedPrinterProfileId} onValueChange={setSelectedPrinterProfileId}>
                <SelectTrigger>
                  <SelectValue placeholder={t('print.profilePlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {availableProfiles.map((profile) => (
                    <SelectItem key={profile.id} value={String(profile.id)}>
                      {profile.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="package-print-copies">{t('print.copies')}</Label>
              <Input
                id="package-print-copies"
                type="number"
                min={1}
                value={copies}
                onChange={(event) => setCopies(Math.max(1, Number(event.target.value) || 1))}
              />
            </div>

            <OpsCircuitToggleField
              checked={useGs1SsccForPallets}
              onCheckedChange={setUseGs1SsccForPallets}
              title={t('print.gs1Title')}
              description={t('print.gs1Description')}
            />

            <div className="rounded-xl bg-slate-50 px-3 py-3 text-xs text-slate-600 dark:bg-white/3 dark:text-slate-300">
              <div className="flex items-center gap-2 font-medium text-slate-800 dark:text-white">
                <Printer className="size-4" />
                {t('print.summary')}
              </div>
              <div className="mt-2">
                {t('print.templateLabel')}: {selectedTemplate?.displayName ?? '-'}
              </div>
              <div>{t('print.selectedPackageSummary', { count: selectedIds.size })}</div>
              <div>{t('print.copySummary', { count: copies })}</div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t('common:cancel')}
          </Button>
          <Button type="button" onClick={() => printMutation.mutate()} disabled={printMutation.isPending || selectedIds.size === 0}>
            {printMutation.isPending ? t('print.printing') : t('print.print')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
