import { type ReactElement, type ReactNode, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronRight, GripVertical, Info } from 'lucide-react';
import { useUIStore } from '@/stores/ui-store';
import { FormPageShell } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Switch } from '@/components/ui/switch';
import { Stepper } from '@/components/ui/stepper';
import { Combobox, type ComboboxOption } from '@/components/ui/combobox';
import { cn } from '@/lib/utils';
import { lookupApi } from '@/services/lookup-api';
import { userApi } from '@/features/user-management/api/user-api';
import { permissionGroupApi } from '@/features/access-control/api/permissionGroupApi';
import { usePermissionAccess } from '@/features/access-control/hooks/usePermissionAccess';
import { productionApi } from '../api/production-api';
import {
  createEmptyConsumptionDraft,
  createEmptyDependencyDraft,
  createEmptyHeaderAssignmentDraft,
  createEmptyOrderDraft,
  createEmptyOrderAssignmentDraft,
  createEmptyOutputDraft,
  createEmptyProductionPlanDraft,
  type ProductionConsumptionDraft,
  type ProductionDependencyDraft,
  type ProductionHeaderAssignmentDraft,
  type ProductionOrderDraft,
  type ProductionOrderAssignmentDraft,
  type ProductionOutputDraft,
  type ProductionPlanDraft,
  type ProductionHeaderDetail,
  } from '../types/production';

function rebuildDependenciesForDraft(draft: ProductionPlanDraft): ProductionDependencyDraft[] {
  const sortedOrders = [...draft.orders].sort(
    (left, right) => (left.sequenceNo ?? Number.MAX_SAFE_INTEGER) - (right.sequenceNo ?? Number.MAX_SAFE_INTEGER),
  );

  if (draft.header.executionMode === 'Parallel') {
    return [];
  }

  if (draft.header.executionMode === 'Serial') {
    return sortedOrders.slice(1).map((order, index) => ({
      ...createEmptyDependencyDraft(),
      predecessorOrderLocalId: sortedOrders[index].localId,
      successorOrderLocalId: order.localId,
    }));
  }

  const groups = new Map<number, ProductionOrderDraft[]>();
  for (const order of draft.orders) {
    const key = order.sequenceNo ?? 1;
    const current = groups.get(key) ?? [];
    current.push(order);
    groups.set(key, current);
  }
  const sequenceKeys = Array.from(groups.keys()).sort((left, right) => left - right);
  const dependencies: ProductionDependencyDraft[] = [];
  for (let index = 1; index < sequenceKeys.length; index += 1) {
    const predecessors = groups.get(sequenceKeys[index - 1]) ?? [];
    const successors = groups.get(sequenceKeys[index]) ?? [];
    predecessors.forEach((predecessor) => {
      successors.forEach((successor) => {
        dependencies.push({
          ...createEmptyDependencyDraft(),
          predecessorOrderLocalId: predecessor.localId,
          successorOrderLocalId: successor.localId,
        });
      });
    });
  }
  return dependencies;
}

const executionModes = ['Serial', 'Parallel', 'Hybrid'] as const;
const planTypes = ['Production', 'Assembly', 'Packaging', 'Rework'] as const;
const orderTypes = ['Production', 'SemiFinished', 'Assembly', 'Packaging', 'Rework'] as const;
const trackingModes = ['None', 'Lot', 'Serial'] as const;
const serialModes = ['Optional', 'Required'] as const;
const dependencyTypes = ['FinishToStart', 'StartToStart', 'FinishToFinish', 'StartToFinish'] as const;
const assignmentTypes = ['Primary', 'Support', 'Supervisor', 'Observer'] as const;
const priorityOptions = [
  { value: 10, label: 'Dusuk' },
  { value: 20, label: 'Normal' },
  { value: 30, label: 'Yuksek' },
  { value: 40, label: 'Kritik' },
] as const;
const stagePresetOptions = [
  { value: 'raw-material', label: 'Hammadde Hazirlama' },
  { value: 'sub-assembly', label: 'Alt Montaj' },
  { value: 'assembly', label: 'Montaj' },
  { value: 'packaging', label: 'Paketleme' },
  { value: 'quality', label: 'Kalite / Kontrol' },
  { value: 'final', label: 'Nihai Mamul' },
] as const;

interface ErpTemplateInput {
  orderNo: string;
  stockCode: string;
  quantity: number;
  yapKod: string;
}

function SectionHeader({ title, description, action }: { title: string; description: string; action?: ReactElement }): ReactElement {
  return (
    <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between md:gap-4">
      <div className="min-w-0 space-y-1">
        <h3 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-50">{title}</h3>
        <p className="text-xs leading-snug text-slate-500 dark:text-slate-400">{description}</p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

function Field({ label, children }: { label: ReactNode; children: ReactElement }): ReactElement {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function SummaryStat({ label, value, tone }: { label: string; value: string | number; tone: string }): ReactElement {
  return (
    <Card className={cn('gap-1.5 border border-slate-200/60 py-3 shadow-sm dark:border-white/10', tone)}>
      <CardHeader className="gap-1 space-y-0 py-0">
        <CardDescription className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</CardDescription>
        <CardTitle className="text-xl font-semibold tabular-nums tracking-tight">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}

function PlannerHintCard({ title, body, tone = 'emerald' }: { title: string; body: string; tone?: 'emerald' | 'sky' | 'amber' }): ReactElement {
  const toneClassMap: Record<string, string> = {
    emerald: 'border-emerald-200/70 bg-emerald-50/70 text-emerald-900 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-100',
    sky: 'border-sky-200/70 bg-sky-50/70 text-sky-900 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-100',
    amber: 'border-amber-200/70 bg-amber-50/80 text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-100',
  };

  return (
    <div className={cn('rounded-xl border p-3 text-xs leading-relaxed', toneClassMap[tone])}>
      <div className="font-semibold">{title}</div>
      <div className="mt-1 whitespace-pre-line text-[13px] leading-snug opacity-95">{body}</div>
    </div>
  );
}

function InfoCallout({ title, body }: { title: string; body: string }): ReactElement {
  return (
    <div className="flex gap-2.5 rounded-xl border border-slate-200/70 bg-slate-50/80 p-3 text-xs text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
      <div className="mt-0.5 shrink-0 rounded-full bg-slate-900/5 p-1.5 text-slate-600 dark:bg-white/10 dark:text-slate-200">
        <Info className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0">
        <div className="font-semibold text-slate-900 dark:text-slate-100">{title}</div>
        <div className="mt-1 leading-snug text-[13px] text-slate-600 dark:text-slate-300">{body}</div>
      </div>
    </div>
  );
}

function RequiredMark(): ReactElement {
  return <span className="ml-1 text-rose-500">*</span>;
}

function mapDetailToDraft(detail: ProductionHeaderDetail): ProductionPlanDraft {
  const orderLocalIdById = new Map<number, string>();
  const orders = detail.orders.map((order, index) => {
    const localId = `order-existing-${order.id}-${index}`;
    orderLocalIdById.set(order.id, localId);
    return {
      localId,
      orderNo: order.orderNo,
      orderType: (order.orderType as ProductionOrderDraft['orderType']) || 'Production',
      producedStockCode: order.producedStockCode,
      producedYapKod: order.producedYapKod ?? '',
      plannedQuantity: order.plannedQuantity,
      sourceWarehouseCode: order.sourceWarehouseCode ?? '',
      targetWarehouseCode: order.targetWarehouseCode ?? '',
      sequenceNo: order.sequenceNo ?? undefined,
      parallelGroupNo: order.parallelGroupNo ?? undefined,
      canStartManually: order.canStartManually,
      autoStartWhenDependenciesDone: order.autoStartWhenDependenciesDone,
      assignments: order.assignments.map((assignment, assignmentIndex) => ({
        localId: `order-assignment-existing-${assignment.id}-${assignmentIndex}`,
        assignedUserId: assignment.assignedUserId ?? undefined,
        assignedRoleId: assignment.assignedRoleId ?? undefined,
        assignedTeamId: assignment.assignedTeamId ?? undefined,
        assignmentType: (assignment.assignmentType as ProductionOrderAssignmentDraft['assignmentType']) || 'Primary',
        note: assignment.note ?? '',
      })),
    };
  });

  return {
    source: 'manual',
    header: {
      documentNo: detail.header.documentNo ?? '',
      documentDate: detail.header.documentDate ? detail.header.documentDate.split('T')[0] : '',
      description: detail.header.description1 ?? '',
      executionMode: (detail.header.executionMode as ProductionPlanDraft['header']['executionMode']) || 'Serial',
      planType: (detail.header.planType as ProductionPlanDraft['header']['planType']) || 'Production',
      priority: detail.header.priority ?? 20,
      projectCode: detail.header.projectCode ?? '',
      customerCode: '',
      mainStockCode: detail.header.mainStockCode ?? '',
      mainYapKod: detail.header.mainYapKod ?? '',
      plannedQuantity: detail.header.plannedQuantity ?? 1,
      plannedStartDate: '',
      plannedEndDate: '',
      assignments: detail.headerAssignments.map((assignment, index) => ({
        localId: `header-assignment-existing-${assignment.id}-${index}`,
        assignedUserId: assignment.assignedUserId ?? undefined,
        assignedRoleId: assignment.assignedRoleId ?? undefined,
        assignedTeamId: assignment.assignedTeamId ?? undefined,
        assignmentType: (assignment.assignmentType as ProductionHeaderAssignmentDraft['assignmentType']) || 'Primary',
      })),
    },
    orders,
    outputs: detail.orders.flatMap((order, orderIndex) =>
      order.outputs.map((row, rowIndex) => ({
        localId: `output-existing-${row.id}-${rowIndex}`,
        orderLocalId: orderLocalIdById.get(order.id) ?? `order-existing-${order.id}-${orderIndex}`,
        stockCode: row.stockCode,
        yapKod: row.yapKod ?? '',
        plannedQuantity: row.plannedQuantity,
        unit: row.unit ?? 'ADET',
        trackingMode: (row.trackingMode as ProductionOutputDraft['trackingMode']) || 'None',
        serialEntryMode: (row.serialEntryMode as ProductionOutputDraft['serialEntryMode']) || 'Optional',
        targetWarehouseCode: row.targetWarehouseCode ?? '',
        targetCellCode: row.targetCellCode ?? '',
      })),
    ),
    consumptions: detail.orders.flatMap((order, orderIndex) =>
      order.consumptions.map((row, rowIndex) => ({
        localId: `consumption-existing-${row.id}-${rowIndex}`,
        orderLocalId: orderLocalIdById.get(order.id) ?? `order-existing-${order.id}-${orderIndex}`,
        stockCode: row.stockCode,
        yapKod: row.yapKod ?? '',
        plannedQuantity: row.plannedQuantity,
        unit: row.unit ?? 'ADET',
        trackingMode: (row.trackingMode as ProductionConsumptionDraft['trackingMode']) || 'None',
        serialEntryMode: (row.serialEntryMode as ProductionConsumptionDraft['serialEntryMode']) || 'Optional',
        sourceWarehouseCode: row.sourceWarehouseCode ?? '',
        sourceCellCode: row.sourceCellCode ?? '',
        isBackflush: row.isBackflush,
        isMandatory: row.isMandatory,
      })),
    ),
    dependencies: detail.dependencies.map((dependency, index) => ({
      localId: `dependency-existing-${dependency.id}-${index}`,
      predecessorOrderLocalId: orderLocalIdById.get(dependency.predecessorOrderId) ?? '',
      successorOrderLocalId: orderLocalIdById.get(dependency.successorOrderId) ?? '',
      dependencyType: (dependency.dependencyType as ProductionDependencyDraft['dependencyType']) || 'FinishToStart',
      requiredTransferCompleted: dependency.requiredTransferCompleted,
      requiredOutputAvailable: dependency.requiredOutputAvailable,
      lagMinutes: dependency.lagMinutes,
    })),
  };
}

export function ProductionCreatePage(): ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setPageTitle } = useUIStore();
  const permissionAccess = usePermissionAccess();
  const editId = Number(searchParams.get('editId') ?? '');
  const isEditMode = Number.isFinite(editId) && editId > 0;
  const canCreateProduction = permissionAccess.can('wms.production.create');
  const canUpdateProduction = permissionAccess.can('wms.production.update');
  const canSaveProduction = isEditMode ? canUpdateProduction : canCreateProduction;
  const [draft, setDraft] = useState<ProductionPlanDraft>(() => createEmptyProductionPlanDraft());
  const [mode, setMode] = useState<'manual' | 'erp'>('manual');
  const [erpFetchMode, setErpFetchMode] = useState<'workOrder' | 'stock'>('workOrder');
  const [editorMode, setEditorMode] = useState<'planner' | 'advanced'>('planner');
  const [plannerStep, setPlannerStep] = useState(1);
  const [erpInput, setErpInput] = useState<ErpTemplateInput>({ orderNo: '', stockCode: '', quantity: 1, yapKod: '' });
  const [plannerDragOrderIndex, setPlannerDragOrderIndex] = useState<number | null>(null);
  const [plannerDropTargetIndex, setPlannerDropTargetIndex] = useState<number | null>(null);
  const [stagePanelsOpen, setStagePanelsOpen] = useState<Record<string, boolean>>({});

  const isStagePanelExpanded = (localId: string): boolean => stagePanelsOpen[localId] !== false;

  const toggleStagePanel = (localId: string): void => {
    setStagePanelsOpen((prev) => {
      const open = prev[localId] !== false;
      return { ...prev, [localId]: open ? false : true };
    });
  };

  const productsQuery = useQuery({
    queryKey: ['production-create-products'],
    queryFn: () => lookupApi.getProducts(),
    staleTime: 5 * 60 * 1000,
  });
  const yapKodlarQuery = useQuery({
    queryKey: ['production-create-yapkodlar'],
    queryFn: () => lookupApi.getYapKodlar(),
    staleTime: 5 * 60 * 1000,
  });
  const warehousesQuery = useQuery({
    queryKey: ['production-create-warehouses'],
    queryFn: () => lookupApi.getWarehouses(),
    staleTime: 5 * 60 * 1000,
  });
  const usersQuery = useQuery({
    queryKey: ['production-create-users'],
    queryFn: () => userApi.getList({ pageNumber: 0, pageSize: 200, sortBy: 'Username', sortDirection: 'asc' }),
    staleTime: 5 * 60 * 1000,
  });
  const rolesQuery = useQuery({
    queryKey: ['production-create-permission-groups'],
    queryFn: () => permissionGroupApi.getList({ pageNumber: 0, pageSize: 200, sortBy: 'Name', sortDirection: 'asc' }),
    staleTime: 5 * 60 * 1000,
  });
  const editDetailQuery = useQuery({
    queryKey: ['production-edit-detail', editId],
    queryFn: () => productionApi.getHeaderDetail(editId),
    enabled: isEditMode,
    staleTime: 60 * 1000,
  });

  const executionModeLabel = (value: (typeof executionModes)[number]): string => t(`production.create.enums.executionMode.${value}`);
  const planTypeLabel = (value: (typeof planTypes)[number]): string => t(`production.create.enums.planType.${value}`);
  const orderTypeLabel = (value: (typeof orderTypes)[number]): string => t(`production.create.enums.orderType.${value}`);
  const trackingModeLabel = (value: (typeof trackingModes)[number]): string => t(`production.create.enums.trackingMode.${value}`);
  const serialModeLabel = (value: (typeof serialModes)[number]): string => t(`production.create.enums.serialMode.${value}`);
  const dependencyTypeLabel = (value: (typeof dependencyTypes)[number]): string => t(`production.create.enums.dependencyType.${value}`);
  const assignmentTypeLabel = (value: (typeof assignmentTypes)[number]): string => t(`production.create.enums.assignmentType.${value}`);
  const priorityLabel = (value: number): string => priorityOptions.find((item) => item.value === value)?.label ?? 'Normal';

  useEffect(() => {
    setPageTitle(isEditMode ? t('production.create.editTitle', { defaultValue: 'Uretim Planini Duzenle' }) : t('production.create.title'));
    return () => setPageTitle(null);
  }, [isEditMode, setPageTitle, t]);

  useEffect(() => {
    if (!editDetailQuery.data) {
      return;
    }

    setDraft(mapDetailToDraft(editDetailQuery.data));
    setMode('manual');
  }, [editDetailQuery.data]);

  const orderOptions = useMemo(
    () =>
      draft.orders.map((order, index) => ({
        value: order.localId,
        label: order.orderNo || order.producedStockCode || t('production.create.orderDraftLabel', { index: index + 1 }),
      })),
    [draft.orders, t],
  );
  const orderComboboxOptions = useMemo<ComboboxOption[]>(
    () => orderOptions.map((option) => ({ value: option.value, label: option.label })),
    [orderOptions],
  );
  const productOptions = useMemo<ComboboxOption[]>(
    () =>
      (productsQuery.data ?? []).map((item) => ({
        value: item.stokKodu,
        label: `${item.stokKodu} - ${item.stokAdi}`,
      })),
    [productsQuery.data],
  );
  const selectedMainStockCode = draft.header.mainStockCode || erpInput.stockCode;
  const yapKodOptions = useMemo<ComboboxOption[]>(
    () =>
      (yapKodlarQuery.data ?? [])
        .filter((item) => !selectedMainStockCode || !item.yplndrStokKod || item.yplndrStokKod === selectedMainStockCode)
        .map((item) => ({
          value: item.yapKod,
          label: `${item.yapKod} - ${item.yapAcik}`,
        })),
    [selectedMainStockCode, yapKodlarQuery.data],
  );
  const plannerSteps = useMemo(
    () => ([
      { label: t('production.create.planner.steps.header', { defaultValue: 'Plan Temeli' }), description: t('production.create.planner.steps.headerDesc', { defaultValue: 'Ne uretecegini ve kac adet olacagini belirle' }) },
      { label: t('production.create.planner.steps.stages', { defaultValue: 'Asamalar' }), description: t('production.create.planner.steps.stagesDesc', { defaultValue: 'Uretimi hangi asamalara bolecegini kurgula' }) },
      { label: t('production.create.planner.steps.materials', { defaultValue: 'Cikti ve Tuketim' }), description: t('production.create.planner.steps.materialsDesc', { defaultValue: 'Her asama icin ne uretilip ne tuketilecegini yaz' }) },
      { label: t('production.create.planner.steps.flow', { defaultValue: 'Akis ve Atama' }), description: t('production.create.planner.steps.flowDesc', { defaultValue: 'Seri, paralel ve sorumlu dagilimini netlestir' }) },
    ]),
    [t],
  );
  const warehouseOptions = useMemo<ComboboxOption[]>(
    () =>
      (warehousesQuery.data ?? []).map((item) => ({
        value: String(item.depoKodu),
        label: `${item.depoKodu} - ${item.depoIsmi}`,
      })),
    [warehousesQuery.data],
  );
  const userOptions = useMemo<ComboboxOption[]>(
    () =>
      (usersQuery.data?.data ?? []).map((item) => ({
        value: String(item.id),
        label: item.fullName || item.username || item.email,
      })),
    [usersQuery.data],
  );
  const roleOptions = useMemo<ComboboxOption[]>(
    () =>
      (rolesQuery.data?.data ?? []).map((item) => ({
        value: String(item.id),
        label: item.name,
      })),
    [rolesQuery.data],
  );
  const getYapKodOptionsForStock = (stockCode?: string): ComboboxOption[] =>
    (yapKodlarQuery.data ?? [])
      .filter((item) => !stockCode || !item.yplndrStokKod || item.yplndrStokKod === stockCode)
      .map((item) => ({
        value: item.yapKod,
        label: `${item.yapKod} - ${item.yapAcik}`,
      }));

  const canFetchErpTemplate = erpFetchMode === 'workOrder'
    ? erpInput.orderNo.trim().length > 0
    : erpInput.stockCode.trim().length > 0;

  const templateMutation = useMutation({
    mutationFn: () => productionApi.getErpTemplate({
      orderNo: erpFetchMode === 'workOrder' ? erpInput.orderNo : '',
      stockCode: erpFetchMode === 'stock' ? erpInput.stockCode : '',
      quantity: erpInput.quantity,
      yapKod: erpFetchMode === 'stock' ? erpInput.yapKod : '',
    }),
    onSuccess: (template) => {
      setDraft({ ...template, source: 'manual' });
      setErpInput((prev) => ({
        ...prev,
        stockCode: template.header.mainStockCode ?? prev.stockCode,
        yapKod: template.header.mainYapKod ?? prev.yapKod,
        quantity: template.header.plannedQuantity ?? prev.quantity,
      }));
      setMode('manual');
      toast.success(t('production.create.erpLoaded'));
    },
    onError: (error: Error) => {
      toast.error(error.message || t('production.create.erpError'));
    },
  });

  const createMutation = useMutation({
    mutationFn: () => (isEditMode ? productionApi.updateProductionPlan(editId, draft) : productionApi.createProductionPlan(draft)),
    onSuccess: () => {
      toast.success(isEditMode
        ? t('production.create.updateSuccess', { defaultValue: 'Uretim plani guncellendi' })
        : t('production.create.success'));
      navigate('/production/list');
    },
    onError: (error: Error) => {
      toast.error(error.message || t('production.create.error'));
    },
  });

  const updateHeader = <K extends keyof ProductionPlanDraft['header']>(key: K, value: ProductionPlanDraft['header'][K]): void => {
    setDraft((prev) => ({
      ...prev,
      header: { ...prev.header, [key]: value },
    }));
  };

  const updateOrder = (localId: string, updater: (order: ProductionOrderDraft) => ProductionOrderDraft): void => {
    setDraft((prev) => ({ ...prev, orders: prev.orders.map((order) => (order.localId === localId ? updater(order) : order)) }));
  };

  const updateOutput = (localId: string, updater: (row: ProductionOutputDraft) => ProductionOutputDraft): void => {
    setDraft((prev) => ({ ...prev, outputs: prev.outputs.map((row) => (row.localId === localId ? updater(row) : row)) }));
  };

  const updateConsumption = (localId: string, updater: (row: ProductionConsumptionDraft) => ProductionConsumptionDraft): void => {
    setDraft((prev) => ({ ...prev, consumptions: prev.consumptions.map((row) => (row.localId === localId ? updater(row) : row)) }));
  };

  const updateDependency = (localId: string, updater: (row: ProductionDependencyDraft) => ProductionDependencyDraft): void => {
    setDraft((prev) => ({ ...prev, dependencies: prev.dependencies.map((row) => (row.localId === localId ? updater(row) : row)) }));
  };

  const updateHeaderAssignment = (localId: string, updater: (row: ProductionHeaderAssignmentDraft) => ProductionHeaderAssignmentDraft): void => {
    setDraft((prev) => ({
      ...prev,
      header: {
        ...prev.header,
        assignments: prev.header.assignments.map((row) => (row.localId === localId ? updater(row) : row)),
      },
    }));
  };

  const updateOrderAssignment = (orderLocalId: string, assignmentLocalId: string, updater: (row: ProductionOrderAssignmentDraft) => ProductionOrderAssignmentDraft): void => {
    updateOrder(orderLocalId, (order) => ({
      ...order,
      assignments: order.assignments.map((row) => (row.localId === assignmentLocalId ? updater(row) : row)),
    }));
  };

  const removeOrder = (localId: string): void => {
    setDraft((prev) => ({
      ...prev,
      orders: prev.orders.filter((order) => order.localId !== localId),
      outputs: prev.outputs.filter((row) => row.orderLocalId !== localId),
      consumptions: prev.consumptions.filter((row) => row.orderLocalId !== localId),
      dependencies: prev.dependencies.filter((row) => row.predecessorOrderLocalId !== localId && row.successorOrderLocalId !== localId),
    }));
  };

  const addOrder = (): void => {
    const order = createEmptyOrderDraft();
    setDraft((prev) => ({
      ...prev,
      orders: [...prev.orders, order],
      outputs: [...prev.outputs, createEmptyOutputDraft(order.localId)],
    }));
  };
  const seedSingleStagePlan = (): void => {
    setDraft((prev) => {
      const order = createEmptyOrderDraft();
      order.orderNo = `${prev.header.documentNo || 'EMIR'}-01`;
      order.producedStockCode = prev.header.mainStockCode;
      order.producedYapKod = prev.header.mainYapKod;
      order.plannedQuantity = prev.header.plannedQuantity || 1;
      order.sequenceNo = 1;
      return {
        ...prev,
        header: {
          ...prev.header,
          executionMode: 'Serial',
        },
        orders: [order],
        outputs: [{
          ...createEmptyOutputDraft(order.localId),
          stockCode: prev.header.mainStockCode,
          yapKod: prev.header.mainYapKod,
          plannedQuantity: prev.header.plannedQuantity || 1,
        }],
        consumptions: [],
        dependencies: [],
      };
    });
  };
  const seedSerialFlowPlan = (): void => {
    setDraft((prev) => {
      const quantity = prev.header.plannedQuantity || 1;
      const stage1 = createEmptyOrderDraft();
      const stage2 = createEmptyOrderDraft();
      stage1.orderNo = `${prev.header.documentNo || 'EMIR'}-01`;
      stage1.producedStockCode = prev.header.mainStockCode || 'YARI-MAMUL-01';
      stage1.producedYapKod = prev.header.mainYapKod;
      stage1.plannedQuantity = quantity;
      stage1.sequenceNo = 1;
      stage2.orderNo = `${prev.header.documentNo || 'EMIR'}-02`;
      stage2.producedStockCode = prev.header.mainStockCode;
      stage2.producedYapKod = prev.header.mainYapKod;
      stage2.plannedQuantity = quantity;
      stage2.sequenceNo = 2;
      return {
        ...prev,
        header: { ...prev.header, executionMode: 'Serial' },
        orders: [stage1, stage2],
        outputs: [
          { ...createEmptyOutputDraft(stage1.localId), stockCode: stage1.producedStockCode, yapKod: stage1.producedYapKod, plannedQuantity: quantity },
          { ...createEmptyOutputDraft(stage2.localId), stockCode: stage2.producedStockCode, yapKod: stage2.producedYapKod, plannedQuantity: quantity },
        ],
        consumptions: [],
        dependencies: [{
          ...createEmptyDependencyDraft(),
          predecessorOrderLocalId: stage1.localId,
          successorOrderLocalId: stage2.localId,
        }],
      };
    });
  };
  const seedParallelFlowPlan = (): void => {
    setDraft((prev) => {
      const quantity = prev.header.plannedQuantity || 1;
      const stage1 = createEmptyOrderDraft();
      const stage2 = createEmptyOrderDraft();
      const stage3 = createEmptyOrderDraft();
      stage1.orderNo = `${prev.header.documentNo || 'EMIR'}-01`;
      stage1.producedStockCode = 'ALT-PARCA-01';
      stage1.plannedQuantity = quantity;
      stage1.sequenceNo = 1;
      stage1.parallelGroupNo = 1;
      stage2.orderNo = `${prev.header.documentNo || 'EMIR'}-02`;
      stage2.producedStockCode = 'ALT-PARCA-02';
      stage2.plannedQuantity = quantity;
      stage2.sequenceNo = 1;
      stage2.parallelGroupNo = 1;
      stage3.orderNo = `${prev.header.documentNo || 'EMIR'}-03`;
      stage3.producedStockCode = prev.header.mainStockCode;
      stage3.producedYapKod = prev.header.mainYapKod;
      stage3.plannedQuantity = quantity;
      stage3.sequenceNo = 2;
      stage3.parallelGroupNo = 2;
      return {
        ...prev,
        header: { ...prev.header, executionMode: 'Hybrid' },
        orders: [stage1, stage2, stage3],
        outputs: [
          { ...createEmptyOutputDraft(stage1.localId), stockCode: stage1.producedStockCode, plannedQuantity: quantity },
          { ...createEmptyOutputDraft(stage2.localId), stockCode: stage2.producedStockCode, plannedQuantity: quantity },
          { ...createEmptyOutputDraft(stage3.localId), stockCode: stage3.producedStockCode, yapKod: stage3.producedYapKod, plannedQuantity: quantity },
        ],
        consumptions: [],
        dependencies: [
          { ...createEmptyDependencyDraft(), predecessorOrderLocalId: stage1.localId, successorOrderLocalId: stage3.localId },
          { ...createEmptyDependencyDraft(), predecessorOrderLocalId: stage2.localId, successorOrderLocalId: stage3.localId },
        ],
      };
    });
  };

  const removeOutput = (localId: string): void => {
    setDraft((prev) => ({ ...prev, outputs: prev.outputs.filter((row) => row.localId !== localId) }));
  };

  const removeConsumption = (localId: string): void => {
    setDraft((prev) => ({ ...prev, consumptions: prev.consumptions.filter((row) => row.localId !== localId) }));
  };

  const removeDependency = (localId: string): void => {
    setDraft((prev) => ({ ...prev, dependencies: prev.dependencies.filter((row) => row.localId !== localId) }));
  };

  const addHeaderAssignment = (): void => {
    setDraft((prev) => ({
      ...prev,
      header: {
        ...prev.header,
        assignments: [...prev.header.assignments, createEmptyHeaderAssignmentDraft()],
      },
    }));
  };

  const removeHeaderAssignment = (localId: string): void => {
    setDraft((prev) => ({
      ...prev,
      header: {
        ...prev.header,
        assignments: prev.header.assignments.filter((row) => row.localId !== localId),
      },
    }));
  };

  const addOrderAssignment = (orderLocalId: string): void => {
    updateOrder(orderLocalId, (order) => ({
      ...order,
      assignments: [...order.assignments, createEmptyOrderAssignmentDraft()],
    }));
  };

  const removeOrderAssignment = (orderLocalId: string, assignmentLocalId: string): void => {
    updateOrder(orderLocalId, (order) => ({
      ...order,
      assignments: order.assignments.filter((row) => row.localId !== assignmentLocalId),
    }));
  };
  const addOutputForOrder = (orderLocalId: string): void => {
    setDraft((prev) => ({ ...prev, outputs: [...prev.outputs, createEmptyOutputDraft(orderLocalId)] }));
  };
  const addConsumptionForOrder = (orderLocalId: string): void => {
    setDraft((prev) => ({ ...prev, consumptions: [...prev.consumptions, createEmptyConsumptionDraft(orderLocalId)] }));
  };
  const applyFlowTemplate = (): void => {
    setDraft((prev) => ({ ...prev, dependencies: rebuildDependenciesForDraft(prev) }));
  };

  const reorderPlannerOrders = (fromIndex: number, toIndex: number): void => {
    if (fromIndex === toIndex) return;
    setDraft((prev) => {
      if (fromIndex < 0 || toIndex < 0 || fromIndex >= prev.orders.length || toIndex >= prev.orders.length) {
        return prev;
      }
      const nextOrders = [...prev.orders];
      const [removed] = nextOrders.splice(fromIndex, 1);
      nextOrders.splice(toIndex, 0, removed);
      const renumbered = nextOrders.map((order, index) => ({
        ...order,
        sequenceNo: index + 1,
        parallelGroupNo: index + 1,
      }));
      const nextDraft: ProductionPlanDraft = { ...prev, orders: renumbered };
      return { ...nextDraft, dependencies: rebuildDependenciesForDraft(nextDraft) };
    });
  };
  const applyStagePreset = (orderLocalId: string, preset: (typeof stagePresetOptions)[number]['value']): void => {
    updateOrder(orderLocalId, (order) => {
      const baseDocument = draft.header.documentNo || 'PLAN';
      switch (preset) {
        case 'raw-material':
          return { ...order, orderNo: `${baseDocument}-HAMMADDE`, orderType: 'Production' };
        case 'sub-assembly':
          return { ...order, orderNo: `${baseDocument}-ALT-MONTAJ`, orderType: 'SemiFinished' };
        case 'assembly':
          return { ...order, orderNo: `${baseDocument}-MONTAJ`, orderType: 'Assembly' };
        case 'packaging':
          return { ...order, orderNo: `${baseDocument}-PAKET`, orderType: 'Packaging' };
        case 'quality':
          return { ...order, orderNo: `${baseDocument}-KONTROL`, orderType: 'Production' };
        case 'final':
          return {
            ...order,
            orderNo: `${baseDocument}-FINAL`,
            orderType: 'Production',
            producedStockCode: draft.header.mainStockCode || order.producedStockCode,
            producedYapKod: draft.header.mainYapKod || order.producedYapKod,
          };
        default:
          return order;
      }
    });
  };
  const setStagePlacement = (orderLocalId: string, mode: 'first' | 'parallel' | 'after'): void => {
    const currentIndex = draft.orders.findIndex((item) => item.localId === orderLocalId);
    const previousOrder = currentIndex > 0 ? draft.orders[currentIndex - 1] : undefined;

    updateOrder(orderLocalId, (order) => {
      if (mode === 'first' || !previousOrder) {
        return { ...order, sequenceNo: 1, parallelGroupNo: 1 };
      }

      if (mode === 'parallel') {
        return {
          ...order,
          sequenceNo: previousOrder.sequenceNo ?? 1,
          parallelGroupNo: previousOrder.parallelGroupNo ?? 1,
        };
      }

      return {
        ...order,
        sequenceNo: (previousOrder.sequenceNo ?? 1) + 1,
        parallelGroupNo: (previousOrder.parallelGroupNo ?? 1) + 1,
      };
    });
  };

  const summary = useMemo(
    () => ({
      orderCount: draft.orders.length,
      outputCount: draft.outputs.length,
      consumptionCount: draft.consumptions.length,
      dependencyCount: draft.dependencies.length,
      totalPlannedOutput: draft.outputs.reduce((total, row) => total + (row.plannedQuantity || 0), 0),
      totalPlannedConsumption: draft.consumptions.reduce((total, row) => total + (row.plannedQuantity || 0), 0),
    }),
    [draft],
  );

  const validationNotes = useMemo(() => {
    const notes: string[] = [];
    if (!draft.header.documentNo.trim()) notes.push(t('production.create.validation.documentNo'));
    if (!draft.header.mainStockCode.trim()) notes.push(t('production.create.validation.mainStock'));
    if (draft.orders.some((order) => !order.orderNo.trim())) notes.push(t('production.create.validation.orderNo'));
    if (draft.outputs.some((row) => !row.orderLocalId)) notes.push(t('production.create.validation.outputOrder'));
    if (draft.consumptions.some((row) => !row.orderLocalId)) notes.push(t('production.create.validation.consumptionOrder'));
    return notes;
  }, [draft, t]);
  const groupedOutputs = useMemo(
    () => draft.orders.map((order) => ({ order, rows: draft.outputs.filter((row) => row.orderLocalId === order.localId) })),
    [draft.orders, draft.outputs],
  );
  const groupedConsumptions = useMemo(
    () => draft.orders.map((order) => ({ order, rows: draft.consumptions.filter((row) => row.orderLocalId === order.localId) })),
    [draft.orders, draft.consumptions],
  );
  const plannerSummary = useMemo(
    () => ({
      stageCount: draft.orders.length,
      serialStages: draft.orders.filter((order) => (order.sequenceNo ?? 0) > 0).length,
      assignedStages: draft.orders.filter((order) => order.assignments.length > 0).length,
    }),
    [draft.orders],
  );
  const plannerStepNotes = useMemo(() => {
    const step1: string[] = [];
    if (!draft.header.documentNo.trim()) step1.push('Plan numarasi zorunlu.');
    if (!draft.header.mainStockCode.trim()) step1.push('Ana urun secilmeden devam etmeyin.');
    if ((draft.header.plannedQuantity || 0) <= 0) step1.push('Planlanan miktar 0’dan buyuk olmali.');

    const step2: string[] = [];
    draft.orders.forEach((order, index) => {
      const stageLabel = order.orderNo.trim() || `Asama ${index + 1}`;
      if (!order.orderNo.trim()) step2.push(`${stageLabel}: asama adi zorunlu.`);
      if (!order.producedStockCode.trim()) step2.push(`${stageLabel}: uretilecek stok secilmeli.`);
      if ((order.plannedQuantity || 0) <= 0) step2.push(`${stageLabel}: miktar 0’dan buyuk olmali.`);
    });

    const step3: string[] = [];
    draft.orders.forEach((order, index) => {
      const stageLabel = order.orderNo.trim() || `Asama ${index + 1}`;
      if (!draft.outputs.some((row) => row.orderLocalId === order.localId)) {
        step3.push(`${stageLabel}: en az bir cikti satiri eklenmeli.`);
      }
    });
    draft.outputs.forEach((row, index) => {
      if (!row.stockCode.trim()) step3.push(`Cikti ${index + 1}: stok secilmeli.`);
      if ((row.plannedQuantity || 0) <= 0) step3.push(`Cikti ${index + 1}: miktar 0’dan buyuk olmali.`);
    });
    draft.consumptions.forEach((row, index) => {
      if (!row.stockCode.trim()) step3.push(`Tuketim ${index + 1}: stok secilmeli.`);
      if ((row.plannedQuantity || 0) <= 0) step3.push(`Tuketim ${index + 1}: miktar 0’dan buyuk olmali.`);
    });

    const step4: string[] = [];
    if (draft.orders.length > 1 && draft.header.executionMode !== 'Parallel' && draft.dependencies.length === 0) {
      step4.push('Seri veya karma planda asamalar arasi akis baglantisi kurulmalidir.');
    }

    return { 1: step1, 2: step2, 3: step3, 4: step4 } as const;
  }, [draft]);

  const handleModeChange = (value: 'manual' | 'erp'): void => {
    setMode(value);
    if (value === 'manual') {
      setDraft((prev) => ({ ...prev, source: 'manual' }));
    }
  };

  const renderErpFetchPanel = (): ReactElement => (
    <div className="space-y-3">
      <Tabs value={erpFetchMode} onValueChange={(value) => setErpFetchMode(value as 'workOrder' | 'stock')} className="gap-2">
        <TabsList className="grid h-9 grid-cols-2 p-0.5">
          <TabsTrigger className="px-2.5 text-xs" value="workOrder">
            {t('production.create.erp.fetchByWorkOrder', { defaultValue: 'Is emrinden getir' })}
          </TabsTrigger>
          <TabsTrigger className="px-2.5 text-xs" value="stock">
            {t('production.create.erp.fetchByStock', { defaultValue: 'Stok bilgisinden getir' })}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="workOrder" className="space-y-3">
          <PlannerHintCard
            title={t('production.create.erp.fetchByWorkOrder', { defaultValue: 'Is emrinden getir' })}
            body={t('production.create.erp.fetchByWorkOrderDescription', {
              defaultValue: 'ERP tarafinda hazir bir is emri varsa sadece is emrini secin. Sistem gerekli alt kirilimlari taslak olarak forma getirir.',
            })}
            tone="sky"
          />
          <div className="grid gap-3 md:grid-cols-[1.3fr_0.7fr]">
            <Field label={t('production.create.mainOrderNo', { defaultValue: 'Ana Is Emri No' })}>
              <Input
                value={erpInput.orderNo}
                onChange={(e) => setErpInput((prev) => ({ ...prev, orderNo: e.target.value }))}
                placeholder={t('production.create.mainOrderNoPlaceholder', { defaultValue: 'Is emri no ile alanlari doldurun' })}
              />
            </Field>
            <div className="flex items-end">
              <Button
                type="button"
                className="w-full"
                size="sm"
                onClick={() => templateMutation.mutate()}
                disabled={templateMutation.isPending || !canFetchErpTemplate}
              >
                {templateMutation.isPending ? t('common.loading') : t('production.create.erp.fetch')}
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="stock" className="space-y-3">
          <PlannerHintCard
            title={t('production.create.erp.fetchByStock', { defaultValue: 'Stok bilgisinden getir' })}
            body={t('production.create.erp.fetchByStockDescription', {
              defaultValue: 'Hazir bir is emri yoksa ana urunu, varsa yapkodunu ve miktari secin. Sistem stok bilgisinden uygun uretim taslagini getirir.',
            })}
            tone="sky"
          />
          <div className="grid gap-3 md:grid-cols-4">
            <Field label={t('production.create.mainStockCode')}>
              <Combobox
                options={productOptions}
                value={erpInput.stockCode}
                onValueChange={(value) => setErpInput((prev) => ({ ...prev, stockCode: value, yapKod: prev.stockCode === value ? prev.yapKod : '' }))}
                placeholder={t('production.create.productSelect', { defaultValue: 'Ana urun secin' })}
                searchPlaceholder={t('production.create.productSearch', { defaultValue: 'Urunlerde ara' })}
                emptyText={t('production.create.productEmpty', { defaultValue: 'Urun bulunamadi' })}
              />
            </Field>
            <Field label={t('production.create.mainYapKod')}>
              <Combobox
                options={getYapKodOptionsForStock(erpInput.stockCode)}
                value={erpInput.yapKod}
                onValueChange={(value) => setErpInput((prev) => ({ ...prev, yapKod: value }))}
                placeholder={t('production.create.yapKodSelect', { defaultValue: 'Ana yapkod secin' })}
                searchPlaceholder={t('production.create.yapKodSearch', { defaultValue: 'Yapkodlarda ara' })}
                emptyText={t('production.create.yapKodEmpty', { defaultValue: 'Bu urune uygun yapkod bulunamadi' })}
              />
            </Field>
            <Field label={t('production.create.plannedQuantity')}>
              <Input type="number" min="0" step="0.001" value={erpInput.quantity} onChange={(e) => setErpInput((prev) => ({ ...prev, quantity: Number(e.target.value) || 0 }))} />
            </Field>
            <div className="flex items-end">
              <Button
                type="button"
                className="w-full"
                size="sm"
                onClick={() => templateMutation.mutate()}
                disabled={templateMutation.isPending || !canFetchErpTemplate}
              >
                {templateMutation.isPending ? t('common.loading') : t('production.create.erp.fetch')}
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <PlannerHintCard title={t('production.create.erpNote.title')} body={t('production.create.erpNote.body')} tone="sky" />
    </div>
  );

  return (
    <div className="space-y-4">
      <FormPageShell
        title={isEditMode ? t('production.create.editTitle', { defaultValue: 'Uretim Planini Duzenle' }) : t('production.create.title')}
        description={isEditMode ? t('production.create.editSubtitle', { defaultValue: 'Sadece draft durumundaki ve islem gormemis planlari guncelleyebilirsiniz.' }) : t('production.create.subtitle')}
        isLoading={editDetailQuery.isLoading}
        isError={editDetailQuery.isError}
        errorTitle={t('common.error')}
        errorDescription={editDetailQuery.error instanceof Error ? editDetailQuery.error.message : t('production.create.error')}
        className="gap-4 py-4 shadow-md **:data-[slot=card-content]:px-5 **:data-[slot=card-header]:gap-1.5 **:data-[slot=card-header]:px-5 **:data-[slot=card-description]:text-xs **:data-[slot=card-description]:leading-snug"
        actions={(
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="outline" onClick={() => navigate('/production/list')}>
              {t('common.cancel')}
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setDraft(isEditMode && editDetailQuery.data ? mapDetailToDraft(editDetailQuery.data) : createEmptyProductionPlanDraft())}>
              {t('common.clear')}
            </Button>
            <Button type="button" size="sm" onClick={() => createMutation.mutate()} disabled={!canSaveProduction || createMutation.isPending || draft.orders.length === 0}>
              {createMutation.isPending ? t('common.saving') : isEditMode ? t('common.update', { defaultValue: 'Guncelle' }) : t('common.save')}
            </Button>
          </div>
        )}
      >
        <div className="space-y-4 text-sm leading-normal">
          {!canSaveProduction ? (
            <InfoCallout
              title={t('production.create.permissionInfoTitle')}
              body={isEditMode ? t('production.create.permissionInfoUpdate') : t('production.create.permissionInfoCreate')}
            />
          ) : null}
          {isEditMode ? (
            <InfoCallout
              title={t('production.create.editModeTitle', { defaultValue: 'Kayit guncelleme modu' })}
              body={t('production.create.editModeBody', { defaultValue: 'Bu plan daha once kaydedildi, burada guncelliyorsunuz. Kaydettiginizde draft plani yeni bir kayit acmadan mevcut haliyle guncelleyecegiz.' })}
            />
          ) : null}
          <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
            <SummaryStat label={t('production.create.summary.orders')} value={summary.orderCount} tone="bg-[radial-gradient(circle_at_top_left,_rgba(15,118,110,0.12),_transparent_55%)]" />
            <SummaryStat label={t('production.create.summary.outputs')} value={summary.outputCount} tone="bg-[radial-gradient(circle_at_top_left,_rgba(2,132,199,0.12),_transparent_55%)]" />
            <SummaryStat label={t('production.create.summary.consumptions')} value={summary.consumptionCount} tone="bg-[radial-gradient(circle_at_top_left,_rgba(202,138,4,0.12),_transparent_55%)]" />
            <SummaryStat label={t('production.create.summary.dependencies')} value={summary.dependencyCount} tone="bg-[radial-gradient(circle_at_top_left,_rgba(124,58,237,0.12),_transparent_55%)]" />
            <SummaryStat label={t('production.create.summary.totalOutput')} value={summary.totalPlannedOutput} tone="bg-[radial-gradient(circle_at_top_left,_rgba(225,29,72,0.10),_transparent_55%)]" />
            <SummaryStat label={t('production.create.summary.totalConsumption')} value={summary.totalPlannedConsumption} tone="bg-[radial-gradient(circle_at_top_left,_rgba(217,119,6,0.10),_transparent_55%)]" />
          </div>
          <Tabs value={editorMode} onValueChange={(value) => setEditorMode(value as 'planner' | 'advanced')} className="gap-3 space-y-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <TabsList className="h-8 p-0.5">
                <TabsTrigger className="px-2.5 text-xs" value="planner">{t('production.create.plannerTab', { defaultValue: 'Planlamaci Modu' })}</TabsTrigger>
                <TabsTrigger className="px-2.5 text-xs" value="advanced">{t('production.create.advancedTab', { defaultValue: 'Gelismis Teknik Mod' })}</TabsTrigger>
              </TabsList>
              <Badge className="text-xs font-normal" variant="secondary">
                {t('production.create.review.source')}: {draft.source === 'erp' ? t('production.create.review.sourceErp') : t('production.create.review.sourceManual')}
              </Badge>
            </div>

            <TabsContent value="planner" className="mt-4 space-y-4">
              <Card className="gap-4 py-4">
                <CardHeader>
                  <CardTitle className="text-base">{t('production.create.planner.title', { defaultValue: 'Uretim Planlama Akisi' })}</CardTitle>
                  <CardDescription>{t('production.create.planner.subtitle', { defaultValue: 'Planlamacinin once urunu, sonra asamalari, en son akis ve sorumlulari kurmasi icin sade akisi takip edin.' })}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <InfoCallout
                    title={t('production.create.info.overviewTitle', { defaultValue: 'Bu ekran ne yapiyor?' })}
                    body={t('production.create.info.overviewBody', { defaultValue: 'Bu ekran once ana urunu ve miktari secmenizi, sonra uretimi asamalara bolmenizi, en son da hangi asamanin once veya ayni anda ilerleyecegini belirlemenizi saglar. Kayit aninda sistem plani uretim emirlerine cevirir.' })}
                  />
                  {plannerStepNotes[plannerStep as 1 | 2 | 3 | 4].length > 0 ? (
                    <PlannerHintCard
                      title={t('production.create.planner.stepMissingTitle', { defaultValue: 'Bu adimda tamamlanmasi gerekenler' })}
                      body={plannerStepNotes[plannerStep as 1 | 2 | 3 | 4].map((item) => `• ${item}`).join('\n')}
                      tone="amber"
                    />
                  ) : (
                    <PlannerHintCard
                      title={t('production.create.planner.stepReadyTitle', { defaultValue: 'Bu adim tamam gibi gorunuyor' })}
                      body={t('production.create.planner.stepReadyBody', { defaultValue: 'Zorunlu alanlar dolu. Isterseniz bir sonraki adıma gecebilirsiniz.' })}
                      tone="sky"
                    />
                  )}
                  <Stepper
                    className="[&_.mx-4]:mx-2 [&_.mt-2]:mt-1.5 [&_.h-10]:h-8 [&_.w-10]:w-8 [&_p.text-sm]:text-xs [&_svg]:h-4 [&_svg]:w-4"
                    steps={plannerSteps}
                    currentStep={plannerStep}
                  />
                  <div className="flex flex-wrap justify-between gap-2">
                    <Button type="button" size="sm" variant="outline" onClick={() => setPlannerStep((prev) => Math.max(prev - 1, 1))} disabled={plannerStep === 1}>
                      {t('common.back', { defaultValue: 'Geri' })}
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => setPlannerStep((prev) => Math.min(prev + 1, plannerSteps.length))} disabled={plannerStep === plannerSteps.length}>
                      {t('common.next', { defaultValue: 'Ileri' })}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {plannerStep === 1 && (
                <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
                  <Card className="gap-4 py-4">
                    <CardHeader>
                      <CardTitle className="text-base">{t('production.create.planner.header.title', { defaultValue: 'Ne Uretecegiz?' })}</CardTitle>
                      <CardDescription>{t('production.create.planner.header.subtitle', { defaultValue: 'Planin ana urununu, miktarini ve kaynagini secin.' })}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <InfoCallout
                        title={t('production.create.info.headerTitle', { defaultValue: 'Ana urun secimi nasil dusunulmeli?' })}
                        body={t('production.create.info.headerBody', { defaultValue: 'Ana urun, planin sonunda elde etmek istediginiz mamuldur. Ana yapkod bu mamulun varyantini anlatir. Hazir bir is emri veya stok bilgisi varsa hizli giris ile bu alanlari otomatik doldurabilirsiniz.' })}
                      />
                      <Tabs className="gap-2" value={mode} onValueChange={(value) => handleModeChange(value as 'manual' | 'erp')}>
                        <TabsList className="h-8 p-0.5">
                          <TabsTrigger className="px-2.5 text-xs" value="manual">{t('production.create.modeManual')}</TabsTrigger>
                          <TabsTrigger className="px-2.5 text-xs" value="erp">{t('production.create.modeErp')}</TabsTrigger>
                        </TabsList>
                        <TabsContent value="manual" className="space-y-3">
                          <PlannerHintCard
                            title={t('production.create.modeManual', { defaultValue: 'Manuel Planlama' })}
                            body={t('production.create.modeManualDescription')}
                          />
                        </TabsContent>
                        <TabsContent value="erp" className="space-y-3">
                          {renderErpFetchPanel()}
                        </TabsContent>
                      </Tabs>

                      <div className="grid gap-3 md:grid-cols-3">
                        <Field label={<>{t('common.documentNo')}<RequiredMark /></>}><Input value={draft.header.documentNo} onChange={(e) => updateHeader('documentNo', e.target.value)} /></Field>
                        <Field label={t('common.documentDate')}><Input type="date" value={draft.header.documentDate} onChange={(e) => updateHeader('documentDate', e.target.value)} /></Field>
                        <Field label={t('common.projectCode')}><Input value={draft.header.projectCode} onChange={(e) => updateHeader('projectCode', e.target.value)} /></Field>
                        <Field label={<>{t('production.create.mainStockCode')}<RequiredMark /></>}>
                          <Combobox
                            options={productOptions}
                            value={draft.header.mainStockCode}
                            onValueChange={(value) => updateHeader('mainStockCode', value)}
                            placeholder={t('production.create.productSelect', { defaultValue: 'Ana urun secin' })}
                            searchPlaceholder={t('production.create.productSearch', { defaultValue: 'Urunlerde ara' })}
                            emptyText={t('production.create.productEmpty', { defaultValue: 'Urun bulunamadi' })}
                          />
                        </Field>
                        <Field label={t('production.create.mainYapKod')}>
                          <Combobox
                            options={yapKodOptions}
                            value={draft.header.mainYapKod}
                            onValueChange={(value) => updateHeader('mainYapKod', value)}
                            placeholder={t('production.create.yapKodSelect', { defaultValue: 'Ana yapkod secin' })}
                            searchPlaceholder={t('production.create.yapKodSearch', { defaultValue: 'Yapkodlarda ara' })}
                            emptyText={t('production.create.yapKodEmpty', { defaultValue: 'Bu urune uygun yapkod bulunamadi' })}
                          />
                        </Field>
                        <Field label={<>{t('production.create.plannedQuantity')}<RequiredMark /></>}><Input type="number" min="0" step="0.001" value={draft.header.plannedQuantity} onChange={(e) => updateHeader('plannedQuantity', Number(e.target.value) || 0)} /></Field>
                        <Field label={t('production.create.planType')}>
                          <Select value={draft.header.planType} onValueChange={(value) => updateHeader('planType', value as ProductionPlanDraft['header']['planType'])}>
                            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                            <SelectContent>{planTypes.map((value) => <SelectItem key={value} value={value}>{planTypeLabel(value)}</SelectItem>)}</SelectContent>
                          </Select>
                        </Field>
                        <Field label={t('production.create.executionMode')}>
                          <Select value={draft.header.executionMode} onValueChange={(value) => updateHeader('executionMode', value as ProductionPlanDraft['header']['executionMode'])}>
                            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                            <SelectContent>{executionModes.map((value) => <SelectItem key={value} value={value}>{executionModeLabel(value)}</SelectItem>)}</SelectContent>
                          </Select>
                        </Field>
                        <Field label={t('common.priority')}>
                          <Select value={String(draft.header.priority)} onValueChange={(value) => updateHeader('priority', Number(value))}>
                            <SelectTrigger className="w-full"><SelectValue placeholder={priorityLabel(draft.header.priority)} /></SelectTrigger>
                            <SelectContent>{priorityOptions.map((option) => <SelectItem key={option.value} value={String(option.value)}>{option.label}</SelectItem>)}</SelectContent>
                          </Select>
                        </Field>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="gap-4 py-4">
                    <CardHeader>
                      <CardTitle className="text-base">{t('production.create.readiness.title')}</CardTitle>
                      <CardDescription>{t('production.create.planner.header.side', { defaultValue: 'Planin dogru kurulmasi icin ilk kontrol noktalari.' })}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <PlannerHintCard
                        title={t('production.create.planner.modeHintTitle', { defaultValue: 'Plan modu ne demek?' })}
                        body={
                          draft.header.executionMode === 'Serial'
                            ? t('production.create.planner.serialHint', { defaultValue: 'Seri modda bir asama bitmeden sonraki asama baslamaz.' })
                            : draft.header.executionMode === 'Parallel'
                            ? t('production.create.planner.parallelHint', { defaultValue: 'Paralel modda asamalar ayni anda ilerleyebilir.' })
                            : t('production.create.planner.hybridHint', { defaultValue: 'Karma modda bazi asamalar ayni anda, bazi asamalar sirayla ilerler.' })
                        }
                        tone="amber"
                      />
                      {validationNotes.length === 0 ? (
                        <PlannerHintCard title={t('production.create.readiness.title')} body={t('production.create.readiness.ready')} />
                      ) : (
                        <div className="rounded-xl border border-amber-200/70 bg-amber-50/80 p-3 text-xs text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-100">
                          <div className="font-semibold">{t('production.create.readiness.missing')}</div>
                          <ul className="mt-1.5 list-disc space-y-0.5 pl-4 leading-snug">
                            {validationNotes.map((note) => <li key={note}>{note}</li>)}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {plannerStep === 2 && (
                <div className="space-y-4">
                  <Card className="gap-4 py-4">
                    <CardHeader>
                      <CardTitle className="text-base">{t('production.create.planner.stageTemplates.title', { defaultValue: 'Hazir Asama Kurgulari' })}</CardTitle>
                      <CardDescription>{t('production.create.planner.stageTemplates.subtitle', { defaultValue: 'Planlamaciya hiz kazandirmak icin hazir iskeletler sunuyoruz. Gerekirse sonra duzenlenir.' })}</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-2 md:grid-cols-3">
                      <Button type="button" size="sm" variant="outline" onClick={seedSingleStagePlan}>{t('production.create.planner.stageTemplates.single', { defaultValue: 'Tek Asamali Plan' })}</Button>
                      <Button type="button" size="sm" variant="outline" onClick={seedSerialFlowPlan}>{t('production.create.planner.stageTemplates.serial', { defaultValue: '2 Asamali Seri Plan' })}</Button>
                      <Button type="button" size="sm" variant="outline" onClick={seedParallelFlowPlan}>{t('production.create.planner.stageTemplates.parallel', { defaultValue: 'Paralel Hazirlik + Son Montaj' })}</Button>
                    </CardContent>
                  </Card>

                  <Card className="gap-4 py-4">
                    <CardHeader>
                      <SectionHeader
                        title={t('production.create.orders.title')}
                        description={t('production.create.planner.ordersGuide', { defaultValue: 'Her kart tek bir uretim asamasidir. Planlamaci bu kartlari asama mantigiyla doldurur.' })}
                        action={<Button type="button" size="sm" variant="outline" onClick={addOrder}>{t('production.create.addOrder')}</Button>}
                      />
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <InfoCallout
                        title={t('production.create.info.stageTitle', { defaultValue: 'Asama nedir?' })}
                        body={t('production.create.info.stageBody', { defaultValue: 'Her kart tek bir uretim asamasidir. Ornek: govde hazirlama, montaj, paketleme. Seri modda bir asama bitmeden sonraki baslamaz. Paralel veya karma modda ayni sequence numarasina sahip asamalar birlikte ilerleyebilir.' })}
                      />
                      <p className="text-xs leading-snug text-muted-foreground">{t('production.create.planner.dragReorderHint')}</p>
                      <div className="flex flex-col gap-2" role="list">
                        {draft.orders.map((order, index) => (
                          <div
                            key={order.localId}
                            className={cn(
                              'rounded-xl transition-[opacity,box-shadow]',
                              plannerDropTargetIndex === index && plannerDragOrderIndex !== index && 'ring-2 ring-primary/45 ring-offset-2 ring-offset-background',
                              plannerDragOrderIndex === index && 'opacity-50',
                            )}
                            onDragOver={(e) => {
                              e.preventDefault();
                              e.dataTransfer.dropEffect = 'move';
                              if (plannerDragOrderIndex !== null) setPlannerDropTargetIndex(index);
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              const raw = e.dataTransfer.getData('application/x-production-order-index');
                              const from = Number.parseInt(raw, 10);
                              if (!Number.isNaN(from) && from !== index) reorderPlannerOrders(from, index);
                              setPlannerDragOrderIndex(null);
                              setPlannerDropTargetIndex(null);
                            }}
                            onDragLeave={(e) => {
                              if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                                setPlannerDropTargetIndex((current) => (current === index ? null : current));
                              }
                            }}
                            role="listitem"
                          >
                            <Card className="gap-3 border-slate-200/70 py-3 shadow-sm dark:border-white/10">
                              <CardHeader className="pb-2">
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    className="mt-0.5 shrink-0 cursor-grab touch-none rounded-md p-1.5 text-muted-foreground hover:bg-muted/80 active:cursor-grabbing"
                                    aria-label={t('production.create.planner.dragHandleAria')}
                                    draggable
                                    onDragStart={(e) => {
                                      e.dataTransfer.setData('application/x-production-order-index', String(index));
                                      e.dataTransfer.effectAllowed = 'move';
                                      setPlannerDragOrderIndex(index);
                                    }}
                                    onDragEnd={() => {
                                      setPlannerDragOrderIndex(null);
                                      setPlannerDropTargetIndex(null);
                                    }}
                                  >
                                    <GripVertical className="h-4 w-4" />
                                  </button>
                                  <div className="min-w-0 flex-1 space-y-2">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                      <div className="min-w-0 space-y-0.5">
                                        <CardTitle className="text-base">{order.orderNo || t('production.create.orderDraftLabel', { index: index + 1 })}</CardTitle>
                                        <CardDescription>{t('production.create.planner.stageCardHint', { defaultValue: 'Asamanin urunu, miktari ve akistaki yeri burada belirlenir.' })}</CardDescription>
                                      </div>
                                      <div className="flex shrink-0 flex-wrap items-center gap-1">
                                        <Badge className="text-xs font-normal" variant="secondary">{t('production.create.orderBadge', { index: index + 1 })}</Badge>
                                        <Badge className="text-xs font-normal" variant="outline">
                                          {t('production.create.planner.flowBadge', { defaultValue: 'Akis' })}: {order.sequenceNo ?? index + 1}
                                          {order.parallelGroupNo ? ` / P${order.parallelGroupNo}` : ''}
                                        </Badge>
                                        <Button
                                          type="button"
                                          size="sm"
                                          variant="ghost"
                                          className="h-8 px-2"
                                          onClick={() => toggleStagePanel(order.localId)}
                                        >
                                          {isStagePanelExpanded(order.localId) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                          <span className="sr-only">
                                            {isStagePanelExpanded(order.localId) ? t('production.create.planner.collapseStage') : t('production.create.planner.expandStage')}
                                          </span>
                                        </Button>
                                        <Button type="button" size="sm" variant="ghost" onClick={() => removeOrder(order.localId)} disabled={draft.orders.length === 1}>{t('common.delete')}</Button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </CardHeader>
                              {isStagePanelExpanded(order.localId) ? (
                          <CardContent className="space-y-3 pt-0">
                            <InfoCallout
                              title={t('production.create.planner.stageSimpleTitle', { defaultValue: 'Bu asamayi basitce kurun' })}
                              body={t('production.create.planner.stageSimpleBody', { defaultValue: 'Asama tipi secin, bu asamanin ne uretecegini yazin, sonra da once mi ayni anda mi yoksa sonra mi ilerleyecegini secin. Sistem teknik baglantiyi arka planda kurar.' })}
                            />
                            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200/70 bg-slate-50/70 p-2.5 text-xs dark:border-white/10 dark:bg-white/5">
                              <Badge className="text-xs font-normal" variant={index === 0 ? 'default' : 'secondary'}>
                                {index === 0
                                  ? t('production.create.planner.firstStage', { defaultValue: 'Ilk asama' })
                                  : order.parallelGroupNo === draft.orders[index - 1]?.parallelGroupNo && order.sequenceNo === draft.orders[index - 1]?.sequenceNo
                                    ? t('production.create.planner.parallelStage', { defaultValue: 'Oncekiyle ayni anda' })
                                    : t('production.create.planner.afterStage', { defaultValue: 'Oncekinden sonra' })}
                              </Badge>
                              <span className="text-muted-foreground">
                                {t('production.create.planner.flowBadge', { defaultValue: 'Akis' })}: {order.sequenceNo ?? index + 1}
                                {order.parallelGroupNo ? ` / P${order.parallelGroupNo}` : ''}
                              </span>
                            </div>
                            <div className="grid gap-3 md:grid-cols-3">
                              <Field label={t('production.create.planner.stagePreset', { defaultValue: 'Bu asama ne yapiyor?' })}>
                                <Select onValueChange={(value) => applyStagePreset(order.localId, value as (typeof stagePresetOptions)[number]['value'])}>
                                  <SelectTrigger className="w-full"><SelectValue placeholder={t('production.create.planner.stagePresetPlaceholder', { defaultValue: 'Asama tipini secin' })} /></SelectTrigger>
                                  <SelectContent>{stagePresetOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
                                </Select>
                              </Field>
                                <Field label={t('production.create.planner.flowChoice', { defaultValue: 'Akista yeri ne olsun?' })}>
                                <div className="flex flex-wrap gap-1.5">
                                  <Button type="button" size="sm" variant="outline" onClick={() => setStagePlacement(order.localId, 'first')}>
                                    {t('production.create.planner.firstStage', { defaultValue: 'Ilk asama' })}
                                  </Button>
                                  <Button type="button" size="sm" variant="outline" onClick={() => setStagePlacement(order.localId, 'parallel')} disabled={index === 0}>
                                    {t('production.create.planner.parallelStage', { defaultValue: 'Oncekiyle ayni anda' })}
                                  </Button>
                                  <Button type="button" size="sm" variant="outline" onClick={() => setStagePlacement(order.localId, 'after')} disabled={index === 0}>
                                    {t('production.create.planner.afterStage', { defaultValue: 'Oncekinden sonra' })}
                                  </Button>
                                </div>
                              </Field>
                              <Field label={<>{t('production.create.plannedQuantity')}<RequiredMark /></>}>
                                <Input type="number" min="0" step="0.001" value={order.plannedQuantity} onChange={(e) => updateOrder(order.localId, (current) => ({ ...current, plannedQuantity: Number(e.target.value) || 0 }))} />
                              </Field>
                            </div>
                            <div className="grid gap-3 md:grid-cols-4">
                              <Field label={<>{t('production.create.planner.stageName', { defaultValue: 'Asama adi' })}<RequiredMark /></>}>
                                <Input value={order.orderNo} onChange={(e) => updateOrder(order.localId, (current) => ({ ...current, orderNo: e.target.value }))} placeholder={t('production.create.planner.stageNamePlaceholder', { defaultValue: 'Ornek: Govde Hazirlama, Son Montaj' })} />
                              </Field>
                              <Field label={<>{t('production.create.producedStockCode')}<RequiredMark /></>}>
                                <Combobox
                                  options={productOptions}
                                  value={order.producedStockCode}
                                  onValueChange={(value) =>
                                    updateOrder(order.localId, (current) => ({
                                      ...current,
                                      producedStockCode: value,
                                      producedYapKod:
                                        current.producedStockCode === value ||
                                        getYapKodOptionsForStock(value).some((item) => item.value === current.producedYapKod)
                                          ? current.producedYapKod
                                          : '',
                                    }))}
                                  placeholder={t('production.create.productSelect', { defaultValue: 'Uretilecek stok secin' })}
                                  searchPlaceholder={t('production.create.productSearch', { defaultValue: 'Urunlerde ara' })}
                                  emptyText={t('production.create.productEmpty', { defaultValue: 'Urun bulunamadi' })}
                                />
                              </Field>
                              <Field label={t('production.create.producedYapKod')}>
                                <Combobox
                                  options={getYapKodOptionsForStock(order.producedStockCode)}
                                  value={order.producedYapKod}
                                  onValueChange={(value) => updateOrder(order.localId, (current) => ({ ...current, producedYapKod: value }))}
                                  placeholder={t('production.create.yapKodSelect', { defaultValue: 'YapKod secin' })}
                                  searchPlaceholder={t('production.create.yapKodSearch', { defaultValue: 'YapKodlarda ara' })}
                                  emptyText={t('production.create.yapKodEmpty', { defaultValue: 'YapKod bulunamadi' })}
                                />
                              </Field>
                              <Field label={t('production.create.orderType')}>
                                <Select value={order.orderType} onValueChange={(value) => updateOrder(order.localId, (current) => ({ ...current, orderType: value as ProductionOrderDraft['orderType'] }))}>
                                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                                  <SelectContent>{orderTypes.map((value) => <SelectItem key={value} value={value}>{orderTypeLabel(value)}</SelectItem>)}</SelectContent>
                                </Select>
                              </Field>
                            </div>
                            <Field label={t('production.create.sourceWarehouse')}>
                              <Combobox
                                options={warehouseOptions}
                                value={order.sourceWarehouseCode}
                                onValueChange={(value) => updateOrder(order.localId, (current) => ({ ...current, sourceWarehouseCode: value }))}
                                placeholder={t('production.create.sourceWarehouseSelect', { defaultValue: 'Kaynak depo secin' })}
                                searchPlaceholder={t('production.create.warehouseSearch', { defaultValue: 'Depolarda ara' })}
                                emptyText={t('production.create.warehouseEmpty', { defaultValue: 'Depo bulunamadi' })}
                              />
                            </Field>
                            <Field label={t('production.create.targetWarehouse')}>
                              <Combobox
                                options={warehouseOptions}
                                value={order.targetWarehouseCode}
                                onValueChange={(value) => updateOrder(order.localId, (current) => ({ ...current, targetWarehouseCode: value }))}
                                placeholder={t('production.create.targetWarehouseSelect', { defaultValue: 'Hedef depo secin' })}
                                searchPlaceholder={t('production.create.warehouseSearch', { defaultValue: 'Depolarda ara' })}
                                emptyText={t('production.create.warehouseEmpty', { defaultValue: 'Depo bulunamadi' })}
                              />
                            </Field>
                            {(() => {
                              const stageLabel = order.orderNo.trim() || `Asama ${index + 1}`;
                              const stageNotes = plannerStepNotes[2].filter((item) => item.startsWith(stageLabel));
                              return stageNotes.length > 0 ? (
                                <div className="md:col-span-2">
                                  <PlannerHintCard
                                    title={t('production.create.planner.stageMissingTitle', { defaultValue: 'Bu asamada eksik kalanlar' })}
                                    body={stageNotes.map((item) => `• ${item}`).join('\n')}
                                    tone="amber"
                                  />
                                </div>
                              ) : (
                                <div className="md:col-span-2">
                                  <PlannerHintCard
                                    title={t('production.create.planner.stageReadyTitle', { defaultValue: 'Bu asama gecmeye hazir' })}
                                    body={t('production.create.planner.stageReadyBody', { defaultValue: 'Asama adi, uretilecek stok ve miktar tamam. Isterseniz bir sonraki asamaya gecebilirsiniz.' })}
                                    tone="sky"
                                  />
                                </div>
                              );
                            })()}
                          </CardContent>
                              ) : null}
                            </Card>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {plannerStep === 3 && (
                <div className="grid gap-4 xl:grid-cols-2">
                  <Card className="gap-4 py-4">
                    <CardHeader>
                      <CardTitle className="text-base">{t('production.create.outputs.title')}</CardTitle>
                      <CardDescription>{t('production.create.planner.outputsGuide', { defaultValue: 'Her asamanin ne uretecegini planlayin. Gerekirse ayni asamaya birden fazla cikti ekleyebilirsiniz.' })}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <InfoCallout
                        title={t('production.create.info.outputTitle', { defaultValue: 'Cikti neyi anlatir?' })}
                        body={t('production.create.info.outputBody', { defaultValue: 'Cikti, ilgili asama sonunda elde edilen urundur. Ara mamul olabilir, nihai mamul olabilir. Burada planlanan miktar yazilir; gercekte ne kadar uretildigi process ekraninda kaydedilir.' })}
                      />
                      {plannerStepNotes[3].some((item) => item.startsWith('Cikti') || item.includes('cikti satiri')) ? (
                        <PlannerHintCard
                          title={t('production.create.planner.outputsMissingTitle', { defaultValue: 'Cikti tarafinda eksik kalanlar' })}
                          body={plannerStepNotes[3].filter((item) => item.startsWith('Cikti') || item.includes('cikti satiri')).map((item) => `• ${item}`).join('\n')}
                          tone="amber"
                        />
                      ) : null}
                      {groupedOutputs.map(({ order, rows }) => (
                        <div key={order.localId} className="rounded-lg border border-slate-200/70 bg-muted/20 p-3 dark:border-white/10">
                          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                            <div className="min-w-0">
                              <div className="text-sm font-medium">{order.orderNo || order.producedStockCode || t('production.create.orderPlaceholder')}</div>
                              <div className="text-xs text-muted-foreground">{order.producedStockCode || '-'}</div>
                            </div>
                            <Button type="button" size="sm" variant="outline" onClick={() => addOutputForOrder(order.localId)}>{t('production.create.addOutput')}</Button>
                          </div>
                          <div className="space-y-2">
                            {rows.map((row) => (
                              <div key={row.localId} className="grid gap-2 md:grid-cols-5">
                                <Combobox
                                  options={productOptions}
                                  value={row.stockCode}
                                  onValueChange={(value) =>
                                    updateOutput(row.localId, (current) => ({
                                      ...current,
                                      stockCode: value,
                                      yapKod:
                                        current.stockCode === value ||
                                        getYapKodOptionsForStock(value).some((item) => item.value === current.yapKod)
                                          ? current.yapKod
                                          : '',
                                    }))}
                                  placeholder={t('production.create.productSelect', { defaultValue: 'Urun secin' })}
                                  searchPlaceholder={t('production.create.productSearch', { defaultValue: 'Urunlerde ara' })}
                                  emptyText={t('production.create.productEmpty', { defaultValue: 'Urun bulunamadi' })}
                                />
                                <Combobox
                                  options={getYapKodOptionsForStock(row.stockCode)}
                                  value={row.yapKod}
                                  onValueChange={(value) => updateOutput(row.localId, (current) => ({ ...current, yapKod: value }))}
                                  placeholder={t('production.create.yapKodSelect', { defaultValue: 'YapKod secin' })}
                                  searchPlaceholder={t('production.create.yapKodSearch', { defaultValue: 'YapKodlarda ara' })}
                                  emptyText={t('production.create.yapKodEmpty', { defaultValue: 'YapKod bulunamadi' })}
                                />
                                <Input type="number" min="0" step="0.001" placeholder={t('production.create.columns.quantity')} value={row.plannedQuantity} onChange={(e) => updateOutput(row.localId, (current) => ({ ...current, plannedQuantity: Number(e.target.value) || 0 }))} />
                                <Select value={row.trackingMode} onValueChange={(value) => updateOutput(row.localId, (current) => ({ ...current, trackingMode: value as ProductionOutputDraft['trackingMode'] }))}>
                                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                                  <SelectContent>{trackingModes.map((value) => <SelectItem key={value} value={value}>{trackingModeLabel(value)}</SelectItem>)}</SelectContent>
                                </Select>
                                <Button type="button" size="sm" variant="ghost" onClick={() => removeOutput(row.localId)}>{t('common.delete')}</Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card className="gap-4 py-4">
                    <CardHeader>
                      <CardTitle className="text-base">{t('production.create.consumptions.title')}</CardTitle>
                      <CardDescription>{t('production.create.planner.consumptionsGuide', { defaultValue: 'Her asamanin ne tuketecegini planlayin. Gercekte kullanilan seri daha sonra operasyon sirasinda secilir.' })}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <InfoCallout
                        title={t('production.create.info.consumptionTitle', { defaultValue: 'Tuketim neyi anlatir?' })}
                        body={t('production.create.info.consumptionBody', { defaultValue: 'Tuketim, bu asamayi tamamlamak icin gereken malzemedir. Planlama ekraninda neyin gerekli oldugu yazilir. Hangi seri veya lotun kullanildigi ise daha sonra operator tarafinda process ekraninda girilir veya ERP/Netsis tarafindan dogrulanir.' })}
                      />
                      {plannerStepNotes[3].some((item) => item.startsWith('Tuketim')) ? (
                        <PlannerHintCard
                          title={t('production.create.planner.consumptionsMissingTitle', { defaultValue: 'Tuketim tarafinda kontrol edilmesi gerekenler' })}
                          body={plannerStepNotes[3].filter((item) => item.startsWith('Tuketim')).map((item) => `• ${item}`).join('\n')}
                          tone="sky"
                        />
                      ) : null}
                      {groupedConsumptions.map(({ order, rows }) => (
                        <div key={order.localId} className="rounded-lg border border-slate-200/70 bg-muted/20 p-3 dark:border-white/10">
                          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                            <div className="min-w-0">
                              <div className="text-sm font-medium">{order.orderNo || order.producedStockCode || t('production.create.orderPlaceholder')}</div>
                              <div className="text-xs text-muted-foreground">{t('production.create.planner.consumptionForStage', { defaultValue: 'Bu asama icin gerekli tuketimler' })}</div>
                            </div>
                            <Button type="button" size="sm" variant="outline" onClick={() => addConsumptionForOrder(order.localId)}>{t('production.create.addConsumption')}</Button>
                          </div>
                          <div className="space-y-2">
                            {rows.map((row) => (
                              <div key={row.localId} className="grid gap-2 md:grid-cols-6">
                                <Combobox
                                  options={productOptions}
                                  value={row.stockCode}
                                  onValueChange={(value) =>
                                    updateConsumption(row.localId, (current) => ({
                                      ...current,
                                      stockCode: value,
                                      yapKod:
                                        current.stockCode === value ||
                                        getYapKodOptionsForStock(value).some((item) => item.value === current.yapKod)
                                          ? current.yapKod
                                          : '',
                                    }))}
                                  placeholder={t('production.create.sourceStockSelect', { defaultValue: 'Tuketilecek stok secin' })}
                                  searchPlaceholder={t('production.create.productSearch', { defaultValue: 'Urunlerde ara' })}
                                  emptyText={t('production.create.productEmpty', { defaultValue: 'Urun bulunamadi' })}
                                />
                                <Combobox
                                  options={getYapKodOptionsForStock(row.stockCode)}
                                  value={row.yapKod}
                                  onValueChange={(value) => updateConsumption(row.localId, (current) => ({ ...current, yapKod: value }))}
                                  placeholder={t('production.create.yapKodSelect', { defaultValue: 'YapKod secin' })}
                                  searchPlaceholder={t('production.create.yapKodSearch', { defaultValue: 'YapKodlarda ara' })}
                                  emptyText={t('production.create.yapKodEmpty', { defaultValue: 'YapKod bulunamadi' })}
                                />
                                <Input type="number" min="0" step="0.001" placeholder={t('production.create.columns.quantity')} value={row.plannedQuantity} onChange={(e) => updateConsumption(row.localId, (current) => ({ ...current, plannedQuantity: Number(e.target.value) || 0 }))} />
                                <Select value={row.serialEntryMode} onValueChange={(value) => updateConsumption(row.localId, (current) => ({ ...current, serialEntryMode: value as ProductionConsumptionDraft['serialEntryMode'] }))}>
                                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                                  <SelectContent>{serialModes.map((value) => <SelectItem key={value} value={value}>{serialModeLabel(value)}</SelectItem>)}</SelectContent>
                                </Select>
                                <div className="flex h-9 items-center justify-between gap-2 rounded-lg border border-slate-200/70 px-2 dark:border-white/10">
                                  <span className="text-xs">{t('production.create.isBackflush', { defaultValue: 'Backflush' })}</span>
                                  <Switch className="scale-90" checked={row.isBackflush} onCheckedChange={(checked) => updateConsumption(row.localId, (current) => ({ ...current, isBackflush: checked }))} />
                                </div>
                                <Button type="button" size="sm" variant="ghost" onClick={() => removeConsumption(row.localId)}>{t('common.delete')}</Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              )}

              {plannerStep === 4 && (
                <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
                  <Card className="gap-4 py-4">
                    <CardHeader>
                      <SectionHeader
                        title={t('production.create.dependencies.title')}
                        description={t('production.create.planner.flowGuide', { defaultValue: 'Planlamaci asamalarin sirayla mi ayni anda mi ilerleyecegini burada kontrol eder. Sistem isterseniz baglantilari otomatik kurar.' })}
                        action={<Button type="button" size="sm" variant="outline" onClick={applyFlowTemplate}>{t('production.create.planner.applyFlow', { defaultValue: 'Akisi Otomatik Kur' })}</Button>}
                      />
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <InfoCallout
                        title={t('production.create.info.flowTitle', { defaultValue: 'Akis neyi kontrol eder?' })}
                        body={t('production.create.info.flowBody', { defaultValue: 'Akis, hangi asamanin once bitecegini ve hangisinin onu bekleyecegini belirler. Bu alan sayesinde birlestirme veya son montaj gibi asamalar, gerekli onceki asamalar bitmeden baslatilmaz.' })}
                      />
                      {plannerStepNotes[4].length > 0 ? (
                        <PlannerHintCard
                          title={t('production.create.planner.flowMissingTitle', { defaultValue: 'Akis tarafinda tamamlanmasi gerekenler' })}
                          body={plannerStepNotes[4].map((item) => `• ${item}`).join('\n')}
                          tone="amber"
                        />
                      ) : null}
                      <div className="grid gap-3 md:grid-cols-3">
                        <SummaryStat label={t('production.create.planner.summary.stages', { defaultValue: 'Asama' })} value={plannerSummary.stageCount} tone="bg-[radial-gradient(circle_at_top_left,_rgba(2,132,199,0.12),_transparent_55%)]" />
                        <SummaryStat label={t('production.create.planner.summary.ordered', { defaultValue: 'Sirali Asama' })} value={plannerSummary.serialStages} tone="bg-[radial-gradient(circle_at_top_left,_rgba(217,119,6,0.10),_transparent_55%)]" />
                        <SummaryStat label={t('production.create.planner.summary.assigned', { defaultValue: 'Atanmis Asama' })} value={plannerSummary.assignedStages} tone="bg-[radial-gradient(circle_at_top_left,_rgba(15,118,110,0.12),_transparent_55%)]" />
                      </div>
                      {draft.dependencies.length === 0 ? (
                        <PlannerHintCard title={t('production.create.dependencies.empty')} body={t('production.create.planner.flowEmpty', { defaultValue: 'Henuz asamalar arasi baglanti kurulmamıs. Seri veya karma planlarda otomatik akis kur butonunu kullanin.' })} tone="amber" />
                      ) : draft.dependencies.map((dependency) => {
                        const predecessor = orderOptions.find((option) => option.value === dependency.predecessorOrderLocalId)?.label ?? '-';
                        const successor = orderOptions.find((option) => option.value === dependency.successorOrderLocalId)?.label ?? '-';
                        return (
                          <div key={dependency.localId} className="rounded-lg border border-slate-200/70 bg-muted/15 p-3 dark:border-white/10">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <Badge className="max-w-40 truncate text-xs font-normal" variant="secondary">{predecessor}</Badge>
                              <span className="text-xs text-muted-foreground">{dependencyTypeLabel(dependency.dependencyType)}</span>
                              <Badge className="max-w-40 truncate text-xs font-normal" variant="secondary">{successor}</Badge>
                            </div>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {dependency.requiredOutputAvailable ? <Badge className="text-xs font-normal" variant="outline">{t('production.create.outputReady')}</Badge> : null}
                              {dependency.requiredTransferCompleted ? <Badge className="text-xs font-normal" variant="outline">{t('production.create.transferReady')}</Badge> : null}
                              {dependency.lagMinutes > 0 ? <Badge className="text-xs font-normal" variant="outline">{t('production.create.lagMinutes')}: {dependency.lagMinutes}</Badge> : null}
                            </div>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>

                  <div className="space-y-4">
                    <Card className="gap-4 py-4">
                      <CardHeader>
                        <SectionHeader
                          title={t('production.create.headerAssignments.title')}
                          description={t('production.create.planner.headerAssignmentGuide', { defaultValue: 'Plani yonetecek ana ekip veya sorumluyu burada belirleyin.' })}
                          action={<Button type="button" size="sm" variant="outline" onClick={addHeaderAssignment}>{t('production.create.addHeaderAssignment')}</Button>}
                        />
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {draft.header.assignments.map((assignment) => (
                          <div key={assignment.localId} className="grid gap-2 md:grid-cols-4">
                            <Select value={assignment.assignmentType} onValueChange={(value) => updateHeaderAssignment(assignment.localId, (row) => ({ ...row, assignmentType: value as ProductionHeaderAssignmentDraft['assignmentType'] }))}>
                              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                              <SelectContent>{assignmentTypes.map((value) => <SelectItem key={value} value={value}>{assignmentTypeLabel(value)}</SelectItem>)}</SelectContent>
                            </Select>
                            <Combobox
                              options={userOptions}
                              value={assignment.assignedUserId ? String(assignment.assignedUserId) : ''}
                              onValueChange={(value) => updateHeaderAssignment(assignment.localId, (row) => ({ ...row, assignedUserId: value ? Number(value) : undefined }))}
                              placeholder={t('production.create.assignedUserSelect', { defaultValue: 'Sorumlu kullanici secin' })}
                              searchPlaceholder={t('production.create.userSearch', { defaultValue: 'Kullanicilarda ara' })}
                              emptyText={t('production.create.userEmpty', { defaultValue: 'Kullanici bulunamadi' })}
                            />
                            <Combobox
                              options={roleOptions}
                              value={assignment.assignedRoleId ? String(assignment.assignedRoleId) : ''}
                              onValueChange={(value) => updateHeaderAssignment(assignment.localId, (row) => ({ ...row, assignedRoleId: value ? Number(value) : undefined }))}
                              placeholder={t('production.create.assignedRoleSelect', { defaultValue: 'Rol secin' })}
                              searchPlaceholder={t('production.create.roleSearch', { defaultValue: 'Rollerde ara' })}
                              emptyText={t('production.create.roleEmpty', { defaultValue: 'Rol bulunamadi' })}
                            />
                            <Button type="button" size="sm" variant="ghost" onClick={() => removeHeaderAssignment(assignment.localId)}>{t('common.delete')}</Button>
                          </div>
                        ))}
                        {draft.header.assignments.length === 0 ? (
                          <div className="text-xs text-muted-foreground">{t('production.create.headerAssignments.empty')}</div>
                        ) : null}
                      </CardContent>
                    </Card>

                    <Card className="gap-4 py-4">
                      <CardHeader>
                        <CardTitle className="text-base">{t('production.create.orderAssignments.title')}</CardTitle>
                        <CardDescription>{t('production.create.planner.orderAssignmentGuide', { defaultValue: 'Her asama farkli operatore veya role atanabilir.' })}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {draft.orders.map((order) => (
                          <div key={order.localId} className="rounded-lg border border-slate-200/70 bg-muted/15 p-3 dark:border-white/10">
                            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                              <div className="text-sm font-medium">{order.orderNo || order.producedStockCode || t('production.create.orderPlaceholder')}</div>
                              <Button type="button" size="sm" variant="outline" onClick={() => addOrderAssignment(order.localId)}>{t('production.create.addOrderAssignment')}</Button>
                            </div>
                            <div className="space-y-2">
                              {order.assignments.map((assignment) => (
                                <div key={assignment.localId} className="grid gap-2 md:grid-cols-[1fr_1fr_1.2fr_auto]">
                                  <Select value={assignment.assignmentType} onValueChange={(value) => updateOrderAssignment(order.localId, assignment.localId, (row) => ({ ...row, assignmentType: value as ProductionOrderAssignmentDraft['assignmentType'] }))}>
                                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                                    <SelectContent>{assignmentTypes.map((value) => <SelectItem key={value} value={value}>{assignmentTypeLabel(value)}</SelectItem>)}</SelectContent>
                                  </Select>
                                  <Combobox
                                    options={userOptions}
                                    value={assignment.assignedUserId ? String(assignment.assignedUserId) : ''}
                                    onValueChange={(value) => updateOrderAssignment(order.localId, assignment.localId, (row) => ({ ...row, assignedUserId: value ? Number(value) : undefined }))}
                                    placeholder={t('production.create.assignedUserSelect', { defaultValue: 'Kullanici secin' })}
                                    searchPlaceholder={t('production.create.userSearch', { defaultValue: 'Kullanicilarda ara' })}
                                    emptyText={t('production.create.userEmpty', { defaultValue: 'Kullanici bulunamadi' })}
                                  />
                                  <Input placeholder={t('production.create.assignmentNote')} value={assignment.note} onChange={(e) => updateOrderAssignment(order.localId, assignment.localId, (row) => ({ ...row, note: e.target.value }))} />
                                  <Button type="button" size="sm" variant="ghost" onClick={() => removeOrderAssignment(order.localId, assignment.localId)}>{t('common.delete')}</Button>
                                </div>
                              ))}
                              {order.assignments.length === 0 ? (
                                <div className="text-xs text-muted-foreground">{t('production.create.orderAssignments.empty')}</div>
                              ) : null}
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="advanced" className="mt-4 space-y-4">
              <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
                <Card className="gap-4 py-4">
                  <CardHeader>
                    <CardTitle className="text-base">{t('production.create.source.title')}</CardTitle>
                    <CardDescription>{t('production.create.source.subtitle')}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Tabs className="gap-2" value={mode} onValueChange={(value) => handleModeChange(value as 'manual' | 'erp')}>
                      <TabsList className="h-8 p-0.5">
                        <TabsTrigger className="px-2.5 text-xs" value="manual">{t('production.create.modeManual')}</TabsTrigger>
                        <TabsTrigger className="px-2.5 text-xs" value="erp">{t('production.create.modeErp')}</TabsTrigger>
                      </TabsList>
                      <TabsContent value="manual" className="space-y-3">
                        <PlannerHintCard title={t('production.create.modeManual', { defaultValue: 'Manuel Planlama' })} body={t('production.create.modeManualDescription')} />
                      </TabsContent>
                      <TabsContent value="erp" className="space-y-3">
                        {renderErpFetchPanel()}
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>

                <Card className="gap-4 py-4">
                  <CardHeader>
                    <CardTitle className="text-base">{t('production.create.readiness.title')}</CardTitle>
                    <CardDescription>{t('production.create.readiness.subtitle')}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-wrap gap-1.5">
                      <Badge className="text-xs font-normal" variant="secondary">
                        {t('production.create.review.source')}: {draft.source === 'erp' ? t('production.create.review.sourceErp') : t('production.create.review.sourceManual')}
                      </Badge>
                      <Badge className="text-xs font-normal" variant="secondary">
                        {t('production.create.review.execution')}: {executionModeLabel(draft.header.executionMode)}
                      </Badge>
                      <Badge className="max-w-full truncate text-xs font-normal" variant="secondary">
                        {t('production.create.review.mainStock')}: {draft.header.mainStockCode || '-'}
                      </Badge>
                    </div>
                    {validationNotes.length === 0 ? (
                      <PlannerHintCard title={t('production.create.readiness.title')} body={t('production.create.readiness.ready')} />
                    ) : (
                      <div className="rounded-xl border border-amber-200/70 bg-amber-50/80 p-3 text-xs text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-100">
                        <div className="font-semibold">{t('production.create.readiness.missing')}</div>
                        <ul className="mt-1.5 list-disc space-y-0.5 pl-4 leading-snug">
                          {validationNotes.map((note) => <li key={note}>{note}</li>)}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card className="gap-4 py-4">
                <CardHeader>
                  <CardTitle className="text-base">{t('production.create.header.title')}</CardTitle>
                  <CardDescription>{t('production.create.header.subtitle')}</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-3">
                  <Field label={t('common.documentNo')}><Input value={draft.header.documentNo} onChange={(e) => updateHeader('documentNo', e.target.value)} /></Field>
                  <Field label={t('common.documentDate')}><Input type="date" value={draft.header.documentDate} onChange={(e) => updateHeader('documentDate', e.target.value)} /></Field>
                  <Field label={t('common.projectCode')}><Input value={draft.header.projectCode} onChange={(e) => updateHeader('projectCode', e.target.value)} /></Field>
                  <Field label={t('production.create.planType')}>
                    <Select value={draft.header.planType} onValueChange={(value) => updateHeader('planType', value as ProductionPlanDraft['header']['planType'])}>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>{planTypes.map((value) => <SelectItem key={value} value={value}>{planTypeLabel(value)}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                  <Field label={t('production.create.executionMode')}>
                    <Select value={draft.header.executionMode} onValueChange={(value) => updateHeader('executionMode', value as ProductionPlanDraft['header']['executionMode'])}>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>{executionModes.map((value) => <SelectItem key={value} value={value}>{executionModeLabel(value)}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                  <Field label={t('common.priority')}>
                    <Select value={String(draft.header.priority)} onValueChange={(value) => updateHeader('priority', Number(value))}>
                      <SelectTrigger className="w-full"><SelectValue placeholder={priorityLabel(draft.header.priority)} /></SelectTrigger>
                      <SelectContent>{priorityOptions.map((option) => <SelectItem key={option.value} value={String(option.value)}>{option.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                  <Field label={t('production.create.mainStockCode')}>
                    <Combobox
                      options={productOptions}
                      value={draft.header.mainStockCode}
                      onValueChange={(value) => updateHeader('mainStockCode', value)}
                      placeholder={t('production.create.productSelect', { defaultValue: 'Ana urun secin' })}
                      searchPlaceholder={t('production.create.productSearch', { defaultValue: 'Urunlerde ara' })}
                      emptyText={t('production.create.productEmpty', { defaultValue: 'Urun bulunamadi' })}
                    />
                  </Field>
                  <Field label={t('production.create.mainYapKod')}>
                    <Combobox
                      options={yapKodOptions}
                      value={draft.header.mainYapKod}
                      onValueChange={(value) => updateHeader('mainYapKod', value)}
                      placeholder={t('production.create.yapKodSelect', { defaultValue: 'Ana yapkod secin' })}
                      searchPlaceholder={t('production.create.yapKodSearch', { defaultValue: 'Yapkodlarda ara' })}
                      emptyText={t('production.create.yapKodEmpty', { defaultValue: 'Bu urune uygun yapkod bulunamadi' })}
                    />
                  </Field>
                  <Field label={t('production.create.plannedQuantity')}><Input type="number" min="0" step="0.001" value={draft.header.plannedQuantity} onChange={(e) => updateHeader('plannedQuantity', Number(e.target.value) || 0)} /></Field>
                  <Field label={t('production.create.plannedStartDate')}><Input type="date" value={draft.header.plannedStartDate} onChange={(e) => updateHeader('plannedStartDate', e.target.value)} /></Field>
                  <Field label={t('production.create.plannedEndDate')}><Input type="date" value={draft.header.plannedEndDate} onChange={(e) => updateHeader('plannedEndDate', e.target.value)} /></Field>
                  <div className="space-y-1.5 md:col-span-3">
                    <Label className="text-xs font-medium text-muted-foreground">{t('common.description')}</Label>
                    <Textarea className="min-h-17 text-sm" value={draft.header.description} onChange={(e) => updateHeader('description', e.target.value)} rows={2} />
                  </div>
                </CardContent>
              </Card>

              <Card className="gap-4 py-4">
                <CardHeader>
                  <SectionHeader
                    title={t('production.create.orders.title')}
                    description={t('production.create.orders.subtitle')}
                    action={<Button type="button" size="sm" variant="outline" onClick={addOrder}>{t('production.create.addOrder')}</Button>}
                  />
                </CardHeader>
                <CardContent>
                  <Accordion type="multiple" className="space-y-2">
                    {draft.orders.map((order, index) => (
                      <AccordionItem key={order.localId} value={order.localId} className="rounded-xl border border-slate-200/70 px-3 dark:border-white/10">
                        <AccordionTrigger className="py-3 hover:no-underline data-[state=open]:pb-2">
                          <div className="flex flex-1 flex-wrap items-center gap-2 text-left">
                            <Badge className="text-xs font-normal" variant="secondary">{t('production.create.orderBadge', { index: index + 1 })}</Badge>
                            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{order.orderNo || t('production.create.orderPlaceholder')}</span>
                            <span className="text-xs text-muted-foreground">{order.producedStockCode || t('production.create.stockPlaceholder')}</span>
                            <span className="text-xs tabular-nums text-muted-foreground">{order.plannedQuantity} {t('common.unit')}</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-3 pb-3">
                          <div className="grid gap-3 md:grid-cols-4">
                            <Field label={t('production.create.orderNo')}><Input value={order.orderNo} onChange={(e) => updateOrder(order.localId, (current) => ({ ...current, orderNo: e.target.value }))} /></Field>
                            <Field label={t('production.create.orderType')}>
                              <Select value={order.orderType} onValueChange={(value) => updateOrder(order.localId, (current) => ({ ...current, orderType: value as ProductionOrderDraft['orderType'] }))}>
                                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                                <SelectContent>{orderTypes.map((value) => <SelectItem key={value} value={value}>{orderTypeLabel(value)}</SelectItem>)}</SelectContent>
                              </Select>
                            </Field>
                            <Field label={t('production.create.producedStockCode')}><Input value={order.producedStockCode} onChange={(e) => updateOrder(order.localId, (current) => ({ ...current, producedStockCode: e.target.value }))} /></Field>
                            <Field label={t('production.create.producedStockCode')}>
                              <Combobox
                                options={productOptions}
                                value={order.producedStockCode}
                                onValueChange={(value) =>
                                  updateOrder(order.localId, (current) => ({
                                    ...current,
                                    producedStockCode: value,
                                    producedYapKod:
                                      current.producedStockCode === value ||
                                      getYapKodOptionsForStock(value).some((item) => item.value === current.producedYapKod)
                                        ? current.producedYapKod
                                        : '',
                                  }))}
                                placeholder={t('production.create.productSelect', { defaultValue: 'Uretilecek stok secin' })}
                                searchPlaceholder={t('production.create.productSearch', { defaultValue: 'Urunlerde ara' })}
                                emptyText={t('production.create.productEmpty', { defaultValue: 'Urun bulunamadi' })}
                              />
                            </Field>
                            <Field label={t('production.create.producedYapKod')}>
                              <Combobox
                                options={getYapKodOptionsForStock(order.producedStockCode)}
                                value={order.producedYapKod}
                                onValueChange={(value) => updateOrder(order.localId, (current) => ({ ...current, producedYapKod: value }))}
                                placeholder={t('production.create.yapKodSelect', { defaultValue: 'YapKod secin' })}
                                searchPlaceholder={t('production.create.yapKodSearch', { defaultValue: 'YapKodlarda ara' })}
                                emptyText={t('production.create.yapKodEmpty', { defaultValue: 'YapKod bulunamadi' })}
                              />
                            </Field>
                            <Field label={t('production.create.plannedQuantity')}><Input type="number" min="0" step="0.001" value={order.plannedQuantity} onChange={(e) => updateOrder(order.localId, (current) => ({ ...current, plannedQuantity: Number(e.target.value) || 0 }))} /></Field>
                            <Field label={t('production.create.sourceWarehouse')}>
                              <Combobox
                                options={warehouseOptions}
                                value={order.sourceWarehouseCode}
                                onValueChange={(value) => updateOrder(order.localId, (current) => ({ ...current, sourceWarehouseCode: value }))}
                                placeholder={t('production.create.sourceWarehouseSelect', { defaultValue: 'Kaynak depo secin' })}
                                searchPlaceholder={t('production.create.warehouseSearch', { defaultValue: 'Depolarda ara' })}
                                emptyText={t('production.create.warehouseEmpty', { defaultValue: 'Depo bulunamadi' })}
                              />
                            </Field>
                            <Field label={t('production.create.targetWarehouse')}>
                              <Combobox
                                options={warehouseOptions}
                                value={order.targetWarehouseCode}
                                onValueChange={(value) => updateOrder(order.localId, (current) => ({ ...current, targetWarehouseCode: value }))}
                                placeholder={t('production.create.targetWarehouseSelect', { defaultValue: 'Hedef depo secin' })}
                                searchPlaceholder={t('production.create.warehouseSearch', { defaultValue: 'Depolarda ara' })}
                                emptyText={t('production.create.warehouseEmpty', { defaultValue: 'Depo bulunamadi' })}
                              />
                            </Field>
                            <Field label={t('production.create.sequenceNo')}><Input type="number" value={order.sequenceNo ?? ''} onChange={(e) => updateOrder(order.localId, (current) => ({ ...current, sequenceNo: e.target.value === '' ? undefined : Number(e.target.value) }))} /></Field>
                          </div>
                          <div className="grid gap-3 md:grid-cols-3">
                            <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-200/70 p-2.5 dark:border-white/10">
                              <div className="min-w-0">
                                <div className="text-xs font-medium">{t('production.create.canStartManually')}</div>
                                <div className="text-[11px] leading-snug text-muted-foreground">{t('production.create.canStartManuallyHint')}</div>
                              </div>
                              <Switch className="shrink-0 scale-90" checked={order.canStartManually} onCheckedChange={(checked) => updateOrder(order.localId, (current) => ({ ...current, canStartManually: checked }))} />
                            </div>
                            <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-200/70 p-2.5 dark:border-white/10">
                              <div className="min-w-0">
                                <div className="text-xs font-medium">{t('production.create.autoStart')}</div>
                                <div className="text-[11px] leading-snug text-muted-foreground">{t('production.create.autoStartHint')}</div>
                              </div>
                              <Switch className="shrink-0 scale-90" checked={order.autoStartWhenDependenciesDone} onCheckedChange={(checked) => updateOrder(order.localId, (current) => ({ ...current, autoStartWhenDependenciesDone: checked }))} />
                            </div>
                            <div className="flex items-center justify-end">
                              <Button type="button" size="sm" variant="ghost" onClick={() => removeOrder(order.localId)} disabled={draft.orders.length === 1}>{t('common.delete')}</Button>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>

              <div className="grid gap-4 xl:grid-cols-2">
                <Card className="gap-4 py-4">
                  <CardHeader>
                    <SectionHeader
                      title={t('production.create.outputs.title')}
                      description={t('production.create.outputs.subtitle')}
                      action={<Button type="button" size="sm" variant="outline" onClick={() => setDraft((prev) => ({ ...prev, outputs: [...prev.outputs, createEmptyOutputDraft(orderOptions[0]?.value ?? '')] }))}>{t('production.create.addOutput')}</Button>}
                    />
                  </CardHeader>
                  <CardContent className="overflow-x-auto">
                    <Table className="text-xs">
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t('production.create.columns.order')}</TableHead>
                          <TableHead>{t('production.create.columns.stock')}</TableHead>
                          <TableHead>{t('production.create.yapKod', { defaultValue: 'Yap Kod' })}</TableHead>
                          <TableHead>{t('production.create.columns.quantity')}</TableHead>
                          <TableHead>{t('production.create.trackingMode')}</TableHead>
                          <TableHead>{t('common.actions')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {draft.outputs.map((row) => (
                          <TableRow key={row.localId}>
                            <TableCell>
                              <Combobox options={orderComboboxOptions} value={row.orderLocalId} onValueChange={(value) => updateOutput(row.localId, (current) => ({ ...current, orderLocalId: value }))} placeholder={t('production.create.selectOrderPlaceholder')} />
                            </TableCell>
                            <TableCell>
                              <Combobox
                                options={productOptions}
                                value={row.stockCode}
                                onValueChange={(value) =>
                                  updateOutput(row.localId, (current) => ({
                                    ...current,
                                    stockCode: value,
                                    yapKod:
                                      current.stockCode === value ||
                                      getYapKodOptionsForStock(value).some((item) => item.value === current.yapKod)
                                        ? current.yapKod
                                        : '',
                                  }))}
                                placeholder={t('production.create.productSelect', { defaultValue: 'Urun secin' })}
                                searchPlaceholder={t('production.create.productSearch', { defaultValue: 'Urunlerde ara' })}
                                emptyText={t('production.create.productEmpty', { defaultValue: 'Urun bulunamadi' })}
                              />
                            </TableCell>
                            <TableCell>
                              <Combobox
                                options={getYapKodOptionsForStock(row.stockCode)}
                                value={row.yapKod}
                                onValueChange={(value) => updateOutput(row.localId, (current) => ({ ...current, yapKod: value }))}
                                placeholder={t('production.create.yapKodSelect', { defaultValue: 'YapKod secin' })}
                                searchPlaceholder={t('production.create.yapKodSearch', { defaultValue: 'YapKodlarda ara' })}
                                emptyText={t('production.create.yapKodEmpty', { defaultValue: 'YapKod bulunamadi' })}
                              />
                            </TableCell>
                            <TableCell><Input type="number" min="0" step="0.001" value={row.plannedQuantity} onChange={(e) => updateOutput(row.localId, (current) => ({ ...current, plannedQuantity: Number(e.target.value) || 0 }))} /></TableCell>
                            <TableCell>
                              <Select value={row.trackingMode} onValueChange={(value) => updateOutput(row.localId, (current) => ({ ...current, trackingMode: value as ProductionOutputDraft['trackingMode'] }))}>
                                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                                <SelectContent>{trackingModes.map((value) => <SelectItem key={value} value={value}>{trackingModeLabel(value)}</SelectItem>)}</SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell><Button type="button" size="sm" variant="ghost" onClick={() => removeOutput(row.localId)}>{t('common.delete')}</Button></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                <Card className="gap-4 py-4">
                  <CardHeader>
                    <SectionHeader
                      title={t('production.create.consumptions.title')}
                      description={t('production.create.consumptions.subtitle')}
                      action={<Button type="button" size="sm" variant="outline" onClick={() => setDraft((prev) => ({ ...prev, consumptions: [...prev.consumptions, createEmptyConsumptionDraft(orderOptions[0]?.value ?? '')] }))}>{t('production.create.addConsumption')}</Button>}
                    />
                  </CardHeader>
                  <CardContent className="overflow-x-auto">
                    <Table className="text-xs">
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t('production.create.columns.order')}</TableHead>
                          <TableHead>{t('production.create.sourceStock')}</TableHead>
                          <TableHead>{t('production.create.yapKod', { defaultValue: 'Yap Kod' })}</TableHead>
                          <TableHead>{t('production.create.columns.quantity')}</TableHead>
                          <TableHead>{t('production.create.serialEntryMode')}</TableHead>
                          <TableHead>{t('common.actions')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {draft.consumptions.map((row) => (
                          <TableRow key={row.localId}>
                            <TableCell>
                              <Combobox options={orderComboboxOptions} value={row.orderLocalId} onValueChange={(value) => updateConsumption(row.localId, (current) => ({ ...current, orderLocalId: value }))} placeholder={t('production.create.selectOrderPlaceholder')} />
                            </TableCell>
                            <TableCell>
                              <Combobox
                                options={productOptions}
                                value={row.stockCode}
                                onValueChange={(value) =>
                                  updateConsumption(row.localId, (current) => ({
                                    ...current,
                                    stockCode: value,
                                    yapKod:
                                      current.stockCode === value ||
                                      getYapKodOptionsForStock(value).some((item) => item.value === current.yapKod)
                                        ? current.yapKod
                                        : '',
                                  }))}
                                placeholder={t('production.create.sourceStockSelect', { defaultValue: 'Tuketilecek stok secin' })}
                                searchPlaceholder={t('production.create.productSearch', { defaultValue: 'Urunlerde ara' })}
                                emptyText={t('production.create.productEmpty', { defaultValue: 'Urun bulunamadi' })}
                              />
                            </TableCell>
                            <TableCell>
                              <Combobox
                                options={getYapKodOptionsForStock(row.stockCode)}
                                value={row.yapKod}
                                onValueChange={(value) => updateConsumption(row.localId, (current) => ({ ...current, yapKod: value }))}
                                placeholder={t('production.create.yapKodSelect', { defaultValue: 'YapKod secin' })}
                                searchPlaceholder={t('production.create.yapKodSearch', { defaultValue: 'YapKodlarda ara' })}
                                emptyText={t('production.create.yapKodEmpty', { defaultValue: 'YapKod bulunamadi' })}
                              />
                            </TableCell>
                            <TableCell><Input type="number" min="0" step="0.001" value={row.plannedQuantity} onChange={(e) => updateConsumption(row.localId, (current) => ({ ...current, plannedQuantity: Number(e.target.value) || 0 }))} /></TableCell>
                            <TableCell>
                              <Select value={row.serialEntryMode} onValueChange={(value) => updateConsumption(row.localId, (current) => ({ ...current, serialEntryMode: value as ProductionConsumptionDraft['serialEntryMode'] }))}>
                                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                                <SelectContent>{serialModes.map((value) => <SelectItem key={value} value={value}>{serialModeLabel(value)}</SelectItem>)}</SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell><Button type="button" size="sm" variant="ghost" onClick={() => removeConsumption(row.localId)}>{t('common.delete')}</Button></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>

              <Card className="gap-4 py-4">
                <CardHeader>
                  <SectionHeader
                    title={t('production.create.dependencies.title')}
                    description={t('production.create.dependencies.subtitle')}
                    action={<Button type="button" size="sm" variant="outline" onClick={() => setDraft((prev) => ({ ...prev, dependencies: [...prev.dependencies, createEmptyDependencyDraft()] }))}>{t('production.create.addDependency')}</Button>}
                  />
                </CardHeader>
                <CardContent className="space-y-2">
                  {draft.dependencies.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-slate-200 p-3 text-xs text-muted-foreground dark:border-white/10">
                      {t('production.create.dependencies.empty')}
                    </div>
                  ) : draft.dependencies.map((dependency) => (
                    <div key={dependency.localId} className="grid gap-2 rounded-lg border border-slate-200/70 bg-muted/10 p-3 md:grid-cols-[1.2fr_1fr_1.2fr_0.8fr_auto] dark:border-white/10">
                      <Combobox options={orderComboboxOptions} value={dependency.predecessorOrderLocalId} onValueChange={(value) => updateDependency(dependency.localId, (current) => ({ ...current, predecessorOrderLocalId: value }))} placeholder={t('production.create.predecessor')} />
                      <Select value={dependency.dependencyType} onValueChange={(value) => updateDependency(dependency.localId, (current) => ({ ...current, dependencyType: value as ProductionDependencyDraft['dependencyType'] }))}>
                        <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                        <SelectContent>{dependencyTypes.map((value) => <SelectItem key={value} value={value}>{dependencyTypeLabel(value)}</SelectItem>)}</SelectContent>
                      </Select>
                      <Combobox options={orderComboboxOptions} value={dependency.successorOrderLocalId} onValueChange={(value) => updateDependency(dependency.localId, (current) => ({ ...current, successorOrderLocalId: value }))} placeholder={t('production.create.successor')} />
                      <Input type="number" value={dependency.lagMinutes} onChange={(e) => updateDependency(dependency.localId, (current) => ({ ...current, lagMinutes: Number(e.target.value) || 0 }))} placeholder={t('production.create.lagMinutes')} />
                      <Button type="button" size="sm" variant="ghost" onClick={() => removeDependency(dependency.localId)}>{t('common.delete')}</Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </FormPageShell>
    </div>
  );
}
