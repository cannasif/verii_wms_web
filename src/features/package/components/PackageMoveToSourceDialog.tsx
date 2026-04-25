import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { PagedLookupDialog } from '@/components/shared/PagedLookupDialog';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { packageApi } from '../api/package-api';
import type { PHeaderDto, PPackageTreeDto } from '../types/package';

interface PackageMoveToSourceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetSourceType: 'WT' | 'SH';
  targetSourceHeaderId: number;
  targetLabel: string;
  targetPackageStatus?: string;
}

interface PackageTreeNodeRow {
  id: number;
  packageNo: string;
  packageType: string;
  status: string;
  depth: number;
  children: PackageTreeNodeRow[];
}

function mapTree(nodes: PPackageTreeDto[], depth = 0): PackageTreeNodeRow[] {
  return nodes.map((node) => ({
    id: node.package.id,
    packageNo: node.package.packageNo,
    packageType: node.package.packageType,
    status: node.package.status,
    depth,
    children: mapTree(node.children ?? [], depth + 1),
  }));
}

function collectIds(nodes: PackageTreeNodeRow[]): number[] {
  return nodes.flatMap((node) => [node.id, ...collectIds(node.children)]);
}

function PackageTreeMoveRow({
  node,
  selectedIds,
  onToggle,
}: {
  node: PackageTreeNodeRow;
  selectedIds: Set<number>;
  onToggle: (id: number) => void;
}): ReactElement {
  return (
    <>
      <div
        className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-xl border border-slate-200/70 bg-white/70 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/[0.03]"
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
          <div className="text-xs text-slate-500 dark:text-slate-400">{node.packageType}</div>
        </div>
        <Badge variant="outline">{node.status}</Badge>
      </div>
      {node.children.map((child) => (
        <PackageTreeMoveRow key={child.id} node={child} selectedIds={selectedIds} onToggle={onToggle} />
      ))}
    </>
  );
}

export function PackageMoveToSourceDialog({
  open,
  onOpenChange,
  targetSourceType,
  targetSourceHeaderId,
  targetLabel,
  targetPackageStatus,
}: PackageMoveToSourceDialogProps): ReactElement {
  const { t } = useTranslation();
  const [sourceHeaderLookupOpen, setSourceHeaderLookupOpen] = useState(false);
  const [selectedHeaderId, setSelectedHeaderId] = useState<number | null>(null);
  const [selectedHeaderLabel, setSelectedHeaderLabel] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [note, setNote] = useState('');

  const treeQuery = useQuery({
    queryKey: ['package-source-move-tree', selectedHeaderId],
    queryFn: () => packageApi.getPPackageTreeByHeader(selectedHeaderId!),
    enabled: open && selectedHeaderId != null,
  });

  const treeRows = useMemo(() => mapTree(treeQuery.data ?? []), [treeQuery.data]);

  useEffect(() => {
    if (!open) {
      return;
    }

    setSelectedIds(new Set());
    setNote('');
    setSelectedHeaderId(null);
    setSelectedHeaderLabel('');
  }, [open]);

  useEffect(() => {
    setSelectedIds(new Set());
  }, [selectedHeaderId]);

  const moveMutation = useMutation({
    mutationFn: async () => {
      if (selectedIds.size === 0) {
        throw new Error('Önce taşınacak paketleri seçin');
      }

      return await packageApi.movePackagesToSourceHeader({
        targetSourceType,
        targetSourceHeaderId,
        packageIds: Array.from(selectedIds),
        targetPackageStatus,
        note: note.trim() || null,
      });
    },
    onSuccess: (response) => {
      toast.success(response.message || 'Paketler hedef operasyona taşındı');
      onOpenChange(false);
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Paket taşıma işlemi başarısız');
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

  const selectAll = (): void => {
    setSelectedIds(new Set(collectIds(treeRows)));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{targetSourceType === 'SH' ? 'Paleti Yükle' : 'Paketi Taşı'}</DialogTitle>
          <DialogDescription>
            {targetLabel} için mevcut package tree içinden koli veya palet seçip bağlayın.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-4 rounded-2xl border border-slate-200/70 bg-white/80 p-4 dark:border-white/10 dark:bg-white/[0.03]">
            <div className="space-y-2">
              <Label>Kaynak Paketleme İşi</Label>
              <PagedLookupDialog<PHeaderDto>
                open={sourceHeaderLookupOpen}
                onOpenChange={setSourceHeaderLookupOpen}
                title="Kaynak Paketleme İşi"
                description="Taşınacak koli veya paletin bağlı olduğu paketleme işini seçin"
                value={selectedHeaderLabel}
                placeholder="Paketleme işi seçin"
                searchPlaceholder="Paket no, müşteri veya kaynak tipine göre ara"
                emptyText="Taşınabilir paketleme işi bulunamadı"
                queryKey={['package-source-move-headers', targetSourceType, targetSourceHeaderId]}
                fetchPage={({ pageNumber, pageSize, search, signal }) =>
                  packageApi
                    .getPHeadersPaged({ pageNumber, pageSize, search }, { signal })
                    .then((response) => ({
                      ...response,
                      data: response.data.filter((header) => !(header.sourceType === targetSourceType && header.sourceHeaderId === targetSourceHeaderId)),
                    }))
                }
                getKey={(header) => header.id.toString()}
                getLabel={(header) => `${header.packingNo} · ${header.customerCode || header.sourceType || 'Paketleme'}`}
                onSelect={(header) => {
                  setSelectedHeaderId(header.id);
                  setSelectedHeaderLabel(`${header.packingNo} · ${header.customerCode || header.sourceType || 'Paketleme'}`);
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="package-move-note">Not</Label>
              <Textarea
                id="package-move-note"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="İsteğe bağlı taşıma notu"
                rows={4}
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Badge variant="outline">Seçili paket: {selectedIds.size}</Badge>
              <Button type="button" variant="outline" size="sm" onClick={selectAll} disabled={treeRows.length === 0}>
                Tümünü Seç
              </Button>
            </div>
            <div className="max-h-[420px] space-y-2 overflow-y-auto rounded-2xl border border-slate-200/70 bg-slate-50/80 p-3 dark:border-white/10 dark:bg-white/[0.03]">
              {treeQuery.isLoading ? (
                <div className="text-sm text-slate-500">Package tree yükleniyor...</div>
              ) : treeRows.length === 0 ? (
                <div className="text-sm text-slate-500">Taşınabilir paket bulunamadı.</div>
              ) : (
                treeRows.map((node) => (
                  <PackageTreeMoveRow key={node.id} node={node} selectedIds={selectedIds} onToggle={toggleSelection} />
                ))
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel', { defaultValue: 'Missing translation' })}
          </Button>
          <Button type="button" onClick={() => moveMutation.mutate()} disabled={moveMutation.isPending || selectedIds.size === 0}>
            {moveMutation.isPending
              ? (targetSourceType === 'SH' ? 'Yükleniyor...' : 'Taşınıyor...')
              : (targetSourceType === 'SH' ? 'Paleti Yükle' : 'Paketi Taşı')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
