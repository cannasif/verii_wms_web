import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { PagedLookupDialog } from '@/components/shared/PagedLookupDialog';
import { OpsActionButton, OpsFieldShell, OpsTextarea, PageState } from '@/components/shared';
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
import { PermissionNotice } from '@/features/access-control/components/PermissionNotice';
import { useCrudPermission } from '@/features/access-control/hooks/useCrudPermission';
import { ensureNamespaces } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { packageApi } from '../api/package-api';
import type { PHeaderDto, PPackageTreeDto } from '../types/package';

interface PackageMoveToSourceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetSourceType: 'WT' | 'SH';
  targetSourceHeaderId: number;
  targetLabel: string;
  targetPackageStatus?: string;
  variant?: 'default' | 'ops';
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
  disabled = false,
  variant,
}: {
  node: PackageTreeNodeRow;
  selectedIds: Set<number>;
  onToggle: (id: number) => void;
  disabled?: boolean;
  variant: 'default' | 'ops';
}): ReactElement {
  const isOps = variant === 'ops';

  if (isOps) {
    return (
      <>
        <div
          className="wms-ops-package-move-tree-row"
          style={{ marginLeft: `${node.depth * 16}px` }}
        >
          <input
            type="checkbox"
            checked={selectedIds.has(node.id)}
            onChange={() => onToggle(node.id)}
            className="wms-ops-package-move-tree-row__check"
            disabled={disabled}
          />
          <div className="wms-ops-package-move-tree-row__body min-w-0">
            <div className="wms-ops-package-move-tree-row__no">{node.packageNo}</div>
            <div className="wms-ops-package-move-tree-row__type">{node.packageType}</div>
          </div>
          <span className="wms-ops-code-badge shrink-0">{node.status}</span>
        </div>
        {node.children.map((child) => (
          <PackageTreeMoveRow
            key={child.id}
            node={child}
            selectedIds={selectedIds}
            onToggle={onToggle}
            disabled={disabled}
            variant={variant}
          />
        ))}
      </>
    );
  }

  return (
    <>
      <div
        className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-xl border border-slate-200/70 bg-white/70 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/3"
        style={{ marginLeft: `${node.depth * 16}px` }}
      >
        <input
          type="checkbox"
          checked={selectedIds.has(node.id)}
          onChange={() => onToggle(node.id)}
          className="h-4 w-4"
          disabled={disabled}
        />
        <div className="min-w-0">
          <div className="font-medium text-slate-900 dark:text-white">{node.packageNo}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">{node.packageType}</div>
        </div>
        <Badge variant="outline">{node.status}</Badge>
      </div>
      {node.children.map((child) => (
        <PackageTreeMoveRow
          key={child.id}
          node={child}
          selectedIds={selectedIds}
          onToggle={onToggle}
          disabled={disabled}
          variant={variant}
        />
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
  variant = 'ops',
}: PackageMoveToSourceDialogProps): ReactElement {
  const { t, i18n } = useTranslation(['package', 'common']);
  const packagePermission = useCrudPermission('wms.package');
  const transferPermission = useCrudPermission('wms.transfer');
  const shipmentPermission = useCrudPermission('wms.shipment');
  const [sourceHeaderLookupOpen, setSourceHeaderLookupOpen] = useState(false);
  const [selectedHeaderId, setSelectedHeaderId] = useState<number | null>(null);
  const [selectedHeaderLabel, setSelectedHeaderLabel] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [note, setNote] = useState('');
  const isOps = variant === 'ops';

  const moveTitle = targetSourceType === 'SH'
    ? t('move.loadPalletTitle')
    : t('move.movePackageTitle');

  const treeQuery = useQuery({
    queryKey: ['package-source-move-tree', selectedHeaderId],
    queryFn: () => packageApi.getPPackageTreeByHeader(selectedHeaderId!),
    enabled: open && selectedHeaderId != null,
  });

  const treeRows = useMemo(() => mapTree(treeQuery.data ?? []), [treeQuery.data]);
  const canMoveToSource =
    packagePermission.canUpdate
    && (targetSourceType === 'WT' ? transferPermission.canUpdate : shipmentPermission.canUpdate);

  useEffect(() => {
    if (!open) {
      return;
    }

    void ensureNamespaces(['package'], i18n.resolvedLanguage ?? i18n.language);
  }, [open, i18n.language, i18n.resolvedLanguage]);

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
        throw new Error(t('move.selectPackageFirst'));
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
      toast.success(response.message || t('move.success'));
      onOpenChange(false);
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : t('move.failed'));
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

  const renderTreePanel = (): ReactElement => (
    <div className={cn('space-y-3', isOps && 'wms-ops-package-move-tree-panel min-h-0')}>
      <div className="flex items-center justify-between gap-3">
        {isOps ? (
          <span className="wms-ops-code-badge">
            {t('move.selectedPackage', { count: selectedIds.size })}
          </span>
        ) : (
          <Badge variant="outline">{t('move.selectedPackage', { count: selectedIds.size })}</Badge>
        )}
        {isOps ? (
          <OpsActionButton
            type="button"
            variant="secondary"
            onClick={selectAll}
            disabled={!canMoveToSource || treeRows.length === 0}
          >
            {t('move.selectAll')}
          </OpsActionButton>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={selectAll}
            disabled={!canMoveToSource || treeRows.length === 0}
          >
            {t('move.selectAll')}
          </Button>
        )}
      </div>
      <div className={cn(
        'max-h-[420px] space-y-2 overflow-y-auto rounded-2xl border border-slate-200/70 bg-slate-50/80 p-3 dark:border-white/10 dark:bg-white/3',
        isOps && 'wms-ops-package-move-tree rounded-none',
      )}>
        {treeQuery.isLoading ? (
          isOps ? (
            <PageState tone="loading" title={t('move.treeLoading')} compact className="wms-ops-detail-empty" />
          ) : (
            <div className="text-sm text-slate-500">{t('move.treeLoading')}</div>
          )
        ) : treeRows.length === 0 ? (
          isOps ? (
            <PageState tone="empty" title={t('move.emptyTree')} compact className="wms-ops-detail-empty" />
          ) : (
            <div className="text-sm text-slate-500">{t('move.emptyTree')}</div>
          )
        ) : (
          treeRows.map((node) => (
            <PackageTreeMoveRow
              key={node.id}
              node={node}
              selectedIds={selectedIds}
              onToggle={toggleSelection}
              disabled={!canMoveToSource}
              variant={variant}
            />
          ))
        )}
      </div>
    </div>
  );

  const renderSourcePanel = (): ReactElement => {
    const packingJobLookup = (
      <PagedLookupDialog<PHeaderDto>
        open={sourceHeaderLookupOpen}
        onOpenChange={setSourceHeaderLookupOpen}
        title={t('move.sourcePackingJob')}
        description={t('move.sourcePackingJobDescription')}
        value={selectedHeaderLabel}
        disabled={!canMoveToSource}
        placeholder={t('move.sourcePackingJobPlaceholder')}
        searchPlaceholder={t('move.sourcePackingJobSearchPlaceholder')}
        emptyText={t('move.sourcePackingJobEmpty')}
        variant={variant}
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
        getLabel={(header) => `${header.packingNo} · ${header.customerCode || header.sourceType || t('move.fallbackPacking')}`}
        onSelect={(header) => {
          setSelectedHeaderId(header.id);
          setSelectedHeaderLabel(`${header.packingNo} · ${header.customerCode || header.sourceType || t('move.fallbackPacking')}`);
        }}
      />
    );

    return (
    <div className={cn(
      'space-y-4 rounded-2xl border border-slate-200/70 bg-white/80 p-4 dark:border-white/10 dark:bg-white/3',
      isOps && 'wms-ops-detail-panel wms-ops-package-move-source-panel rounded-none border-0 p-0',
    )}>
      {!canMoveToSource ? (
        <PermissionNotice message={t('common.accessDeniedMessage')} />
      ) : null}
      <div className="space-y-2">
        <Label className={isOps ? 'wms-ops-detail-field__label' : undefined}>
          {t('move.sourcePackingJob')}
        </Label>
        {isOps ? (
          <OpsFieldShell className={sourceHeaderLookupOpen ? 'wms-ops-field-shell--active' : undefined}>
            {packingJobLookup}
          </OpsFieldShell>
        ) : (
          packingJobLookup
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="package-move-note" className={isOps ? 'wms-ops-detail-field__label' : undefined}>
          {t('move.note')}
        </Label>
        {isOps ? (
          <OpsTextarea
            id="package-move-note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder={t('move.notePlaceholder')}
            rows={4}
            disabled={!canMoveToSource}
          />
        ) : (
          <Textarea
            id="package-move-note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder={t('move.notePlaceholder')}
            rows={4}
            disabled={!canMoveToSource}
          />
        )}
      </div>
    </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
        isOps
          ? 'wms-ops-form wms-ops-detail-dialog wms-ops-package-move-dialog flex h-[min(90dvh,calc(100vh-1rem))] max-h-[min(90dvh,calc(100vh-1rem))] w-[95vw] max-w-[calc(100vw-1rem)] flex-col gap-0 overflow-hidden border-0 p-0 shadow-none sm:max-w-[95vw] lg:max-w-4xl xl:max-w-5xl'
          : 'max-w-4xl',
      )}>
        <DialogHeader className={cn(
          'shrink-0',
          isOps && 'wms-ops-detail-dialog__header border-b px-4 py-4 pr-12 sm:px-6 sm:pr-14',
        )}>
          <DialogTitle className={isOps ? 'wms-ops-detail-dialog__title' : undefined}>
            {moveTitle}
          </DialogTitle>
          <DialogDescription className={isOps ? 'wms-ops-detail-dialog__description' : undefined}>
            {t('move.description', { target: targetLabel })}
          </DialogDescription>
        </DialogHeader>

        <div className={cn(
          'grid flex-1 gap-6 overflow-y-auto lg:grid-cols-[0.9fr_1.1fr]',
          isOps ? 'wms-ops-package-move-dialog__body px-4 py-4 sm:px-6 sm:py-5' : 'p-1',
        )}>
          {renderSourcePanel()}
          {renderTreePanel()}
        </div>

        <DialogFooter className={cn(
          'shrink-0 gap-2',
          isOps && 'border-t px-4 py-4 sm:px-6 sm:gap-2',
        )}>
          {isOps ? (
            <>
              <OpsActionButton type="button" variant="secondary" onClick={() => onOpenChange(false)}>
                {t('common.cancel')}
              </OpsActionButton>
              <OpsActionButton
                type="button"
                variant="primary"
                onClick={() => moveMutation.mutate()}
                disabled={!canMoveToSource || moveMutation.isPending || selectedIds.size === 0}
              >
                {moveMutation.isPending ? (
                  <Loader2 className="size-3.5 animate-spin" aria-hidden />
                ) : null}
                {moveMutation.isPending
                  ? (targetSourceType === 'SH' ? t('move.loading') : t('move.moving'))
                  : moveTitle}
              </OpsActionButton>
            </>
          ) : (
            <>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t('common.cancel')}
              </Button>
              <Button
                type="button"
                onClick={() => moveMutation.mutate()}
                disabled={!canMoveToSource || moveMutation.isPending || selectedIds.size === 0}
              >
                {moveMutation.isPending
                  ? (targetSourceType === 'SH' ? t('move.loading') : t('move.moving'))
                  : moveTitle}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
