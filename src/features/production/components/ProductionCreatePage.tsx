import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronRight, GripVertical } from 'lucide-react';
import { useUIStore } from '@/stores/ui-store';
import { OpsActionButton, OpsFormPageShell, OpsInput, OpsSelect, OpsSelectItem, OpsTextarea, PageState } from '@/components/shared';
import { PagedLookupDialog } from '@/components/shared/PagedLookupDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Stepper } from '@/components/ui/stepper';
import { Combobox, type ComboboxOption } from '@/components/ui/combobox';
import { cn } from '@/lib/utils';
import { lookupApi } from '@/features/shared/api/lookup-api';
import type { StockLookup, WarehouseLookup, YapKodLookup } from '@/features/shared/api/lookup-types';
import { userApi } from '@/features/user-management/api/user-api';
import { permissionGroupApi } from '@/features/access-control/api/permissionGroupApi';
import { PermissionNotice } from '@/features/access-control/components/PermissionNotice';
import { useCrudPermission } from '@/features/access-control/hooks/useCrudPermission';
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
import {
  ProductionOpsDeleteButton,
  ProductionOpsBadge,
  ProductionOpsCircuitToggle,
  ProductionOpsCircuitToggleField,
  ProductionPlanLineGrid,
  ProductionPlanLinePaginatedBody,
  ProductionPlanLineGridCell,
  ProductionPlanLineGridHead,
  ProductionPlanLineGridHeader,
  ProductionPlanLineGridRow,
  ProductionOpsCallout as InfoCallout,
  ProductionOpsField as Field,
  ProductionOpsHintCard as PlannerHintCard,
  ProductionOpsReadinessMissing,
  ProductionRequiredMark as RequiredMark,
  ProductionOpsSectionHeader as SectionHeader,
  ProductionOpsSummaryStat as SummaryStat,
} from './production-ops-ui';

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
  stockId?: number | null;
  stockCode: string;
  quantity: number;
  yapKod: string;
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
      producedStockId: undefined,
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
      mainStockId: undefined,
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
        stockId: undefined,
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
        stockId: undefined,
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
  const permission = useCrudPermission('wms.production');
  const editId = Number(searchParams.get('editId') ?? '');
  const isEditMode = Number.isFinite(editId) && editId > 0;
  const canCreateProduction = permission.canCreate;
  const canUpdateProduction = permission.canUpdate;
  const canSaveProduction = isEditMode ? canUpdateProduction : canCreateProduction;
  const [draft, setDraft] = useState<ProductionPlanDraft>(() => createEmptyProductionPlanDraft());
  const [mode, setMode] = useState<'manual' | 'erp'>('manual');
  const [erpFetchMode, setErpFetchMode] = useState<'workOrder' | 'stock'>('workOrder');
  const [editorMode, setEditorMode] = useState<'planner' | 'advanced'>('planner');
  const [plannerStep, setPlannerStep] = useState(1);
  const [erpInput, setErpInput] = useState<ErpTemplateInput>({ orderNo: '', stockId: undefined, stockCode: '', quantity: 1, yapKod: '' });
  const [plannerDragOrderIndex, setPlannerDragOrderIndex] = useState<number | null>(null);
  const [plannerDropTargetIndex, setPlannerDropTargetIndex] = useState<number | null>(null);
  const [stagePanelsOpen, setStagePanelsOpen] = useState<Record<string, boolean>>({});
  const [mainStockLookupOpen, setMainStockLookupOpen] = useState(false);
  const [mainYapKodLookupOpen, setMainYapKodLookupOpen] = useState(false);
  const [erpStockLookupOpen, setErpStockLookupOpen] = useState(false);
  const [erpYapKodLookupOpen, setErpYapKodLookupOpen] = useState(false);
  const [selectedMainStockLabel, setSelectedMainStockLabel] = useState('');
  const [selectedMainYapKodLabel, setSelectedMainYapKodLabel] = useState('');
  const [selectedErpStockLabel, setSelectedErpStockLabel] = useState('');
  const [selectedErpYapKodLabel, setSelectedErpYapKodLabel] = useState('');
  const [lookupLabels, setLookupLabels] = useState<Record<string, string>>({});
  const [activeLookupKey, setActiveLookupKey] = useState<string | null>(null);

  const isStagePanelExpanded = (localId: string): boolean => stagePanelsOpen[localId] !== false;
  const getLookupLabel = (key: string, fallback?: string): string => lookupLabels[key] || fallback || '';
  const setLookupLabel = (key: string, value: string): void => {
    setLookupLabels((prev) => ({ ...prev, [key]: value }));
  };

  const toggleStagePanel = (localId: string): void => {
    setStagePanelsOpen((prev) => {
      const open = prev[localId] !== false;
      return { ...prev, [localId]: open ? false : true };
    });
  };

  const usersQuery = useQuery({
    queryKey: ['production-create-users'],
    queryFn: () => userApi.getList({ pageNumber: 1, pageSize: 200, sortBy: 'Username', sortDirection: 'asc' }),
    staleTime: 5 * 60 * 1000,
  });
  const rolesQuery = useQuery({
    queryKey: ['production-create-permission-groups'],
    queryFn: () => permissionGroupApi.getList({ pageNumber: 1, pageSize: 200, sortBy: 'Name', sortDirection: 'asc' }),
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

  useEffect(() => {
    setPageTitle(isEditMode ? t('production.create.editTitle', { defaultValue: 'Missing translation' }) : t('production.create.title'));
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
  const plannerSteps = useMemo(
    () => ([
      { label: t('production.create.planner.steps.header', { defaultValue: 'Missing translation' }), description: t('production.create.planner.steps.headerDesc', { defaultValue: 'Missing translation' }) },
      { label: t('production.create.planner.steps.stages', { defaultValue: 'Missing translation' }), description: t('production.create.planner.steps.stagesDesc', { defaultValue: 'Missing translation' }) },
      { label: t('production.create.planner.steps.materials', { defaultValue: 'Missing translation' }), description: t('production.create.planner.steps.materialsDesc', { defaultValue: 'Missing translation' }) },
      { label: t('production.create.planner.steps.flow', { defaultValue: 'Missing translation' }), description: t('production.create.planner.steps.flowDesc', { defaultValue: 'Missing translation' }) },
    ]),
    [t],
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
        ? t('production.create.updateSuccess', { defaultValue: 'Missing translation' })
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
            {t('production.create.erp.fetchByWorkOrder', { defaultValue: 'Missing translation' })}
          </TabsTrigger>
          <TabsTrigger className="px-2.5 text-xs" value="stock">
            {t('production.create.erp.fetchByStock', { defaultValue: 'Missing translation' })}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="workOrder" className="space-y-3">
          <PlannerHintCard
            title={t('production.create.erp.fetchByWorkOrder', { defaultValue: 'Missing translation' })}
            body={t('production.create.erp.fetchByWorkOrderDescription', {
              defaultValue: 'Missing translation',
            })}
            tone="sky"
          />
          <div className="grid gap-3 md:grid-cols-[1.3fr_0.7fr]">
            <Field label={t('production.create.mainOrderNo', { defaultValue: 'Missing translation' })}>
              <OpsInput
                value={erpInput.orderNo}
                onChange={(e) => setErpInput((prev) => ({ ...prev, orderNo: e.target.value }))}
                placeholder={t('production.create.mainOrderNoPlaceholder', { defaultValue: 'Missing translation' })}
              />
            </Field>
            <div className="flex items-end">
              <OpsActionButton
                type="button"
                className="w-full"
                onClick={() => templateMutation.mutate()}
                disabled={templateMutation.isPending || !canFetchErpTemplate}
              >
                {templateMutation.isPending ? t('common.loading') : t('production.create.erp.fetch')}
              </OpsActionButton>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="stock" className="space-y-3">
          <PlannerHintCard
            title={t('production.create.erp.fetchByStock', { defaultValue: 'Missing translation' })}
            body={t('production.create.erp.fetchByStockDescription', {
              defaultValue: 'Missing translation',
            })}
            tone="sky"
          />
          <div className="grid gap-3 md:grid-cols-4">
            <Field label={t('production.create.mainStockCode')}>
              <PagedLookupDialog<StockLookup>
                variant="ops"
                open={erpStockLookupOpen}
                onOpenChange={setErpStockLookupOpen}
                title={t('production.create.mainStockCode')}
                description={t('production.create.productSelect', { defaultValue: 'Missing translation' })}
                value={selectedErpStockLabel || erpInput.stockCode}
                placeholder={t('production.create.productSelect', { defaultValue: 'Missing translation' })}
                searchPlaceholder={t('production.create.productSearch', { defaultValue: 'Missing translation' })}
                emptyText={t('production.create.productEmpty', { defaultValue: 'Missing translation' })}
                queryKey={['production-create', 'erp-stock']}
                fetchPage={({ pageNumber, pageSize, search, signal }) =>
                  lookupApi.getProductsPaged({ pageNumber, pageSize, search }, { signal })
                }
                getKey={(item) => item.id.toString()}
                getLabel={(item) => `${item.stokKodu} - ${item.stokAdi}`}
                onSelect={(item) => {
                  setErpInput((prev) => ({
                    ...prev,
                    stockId: item.id,
                    stockCode: item.stokKodu,
                    yapKod: prev.stockId === item.id ? prev.yapKod : '',
                  }));
                  setSelectedErpStockLabel(`${item.stokKodu} - ${item.stokAdi}`);
                  if (erpInput.stockId !== item.id) {
                    setSelectedErpYapKodLabel('');
                  }
                }}
              />
            </Field>
            <Field label={t('production.create.mainYapKod')}>
              <PagedLookupDialog<YapKodLookup>
                variant="ops"
                open={erpYapKodLookupOpen}
                onOpenChange={setErpYapKodLookupOpen}
                title={t('production.create.mainYapKod')}
                description={erpInput.stockCode || t('production.create.mainStockCode')}
                value={selectedErpYapKodLabel || erpInput.yapKod}
                placeholder={t('production.create.yapKodSelect', { defaultValue: 'Missing translation' })}
                searchPlaceholder={t('production.create.yapKodSearch', { defaultValue: 'Missing translation' })}
                emptyText={t('production.create.yapKodEmpty', { defaultValue: 'Missing translation' })}
                disabled={!erpInput.stockId}
                queryKey={['production-create', 'erp-yapkod', erpInput.stockId ?? 'none']}
                fetchPage={({ pageNumber, pageSize, search, signal }) =>
                  lookupApi.getYapKodlarPaged({ pageNumber, pageSize, search }, { stockId: erpInput.stockId ?? undefined }, { signal })
                }
                getKey={(item) => item.id.toString()}
                getLabel={(item) => `${item.yapKod}${item.yapAcik ? ` - ${item.yapAcik}` : ''}`}
                onSelect={(item) => {
                  setErpInput((prev) => ({ ...prev, yapKod: item.yapKod }));
                  setSelectedErpYapKodLabel(`${item.yapKod}${item.yapAcik ? ` - ${item.yapAcik}` : ''}`);
                }}
              />
            </Field>
            <Field label={t('production.create.plannedQuantity')}>
              <OpsInput type="number" min="0" step="0.001" value={erpInput.quantity} onChange={(e) => setErpInput((prev) => ({ ...prev, quantity: Number(e.target.value) || 0 }))} />
            </Field>
            <div className="flex items-end">
              <OpsActionButton
                type="button"
                className="w-full"
                onClick={() => templateMutation.mutate()}
                disabled={templateMutation.isPending || !canFetchErpTemplate}
              >
                {templateMutation.isPending ? t('common.loading') : t('production.create.erp.fetch')}
              </OpsActionButton>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <PlannerHintCard title={t('production.create.erpNote.title')} body={t('production.create.erpNote.body')} tone="sky" />
    </div>
  );

  return (
    <OpsFormPageShell
      className="wms-ops-erp-skin wms-ops-production-page"
      eyebrow={
        <>
          <span>{t('production.breadcrumb.parent')}</span>
          <span className="mx-2 opacity-60">/</span>
          <span>{t('production.breadcrumb.module')}</span>
          {isEditMode ? (
            <>
              <span className="mx-2 opacity-60">/</span>
              <span>{t('common.edit')}</span>
            </>
          ) : null}
        </>
      }
      title={isEditMode ? t('production.create.editTitle', { defaultValue: 'Missing translation' }) : t('production.create.title')}
      description={isEditMode ? t('production.create.editSubtitle', { defaultValue: 'Missing translation' }) : t('production.create.subtitle')}
      actions={(
        <div className="wms-ops-actions flex flex-wrap gap-2">
          <OpsActionButton type="button" variant="secondary" onClick={() => navigate('/production/list')}>
            {t('common.cancel')}
          </OpsActionButton>
          <OpsActionButton type="button" variant="secondary" onClick={() => setDraft(isEditMode && editDetailQuery.data ? mapDetailToDraft(editDetailQuery.data) : createEmptyProductionPlanDraft())}>
            {t('common.clear')}
          </OpsActionButton>
          <OpsActionButton type="button" onClick={() => createMutation.mutate()} disabled={!canSaveProduction || createMutation.isPending || draft.orders.length === 0}>
            {createMutation.isPending ? t('common.saving') : isEditMode ? t('common.update', { defaultValue: 'Missing translation' }) : t('common.save')}
          </OpsActionButton>
        </div>
      )}
    >
      {editDetailQuery.isLoading ? (
        <PageState tone="loading" title={t('common.loading')} compact />
      ) : null}

      {editDetailQuery.isError ? (
        <PageState
          tone="error"
          title={t('common.error')}
          description={editDetailQuery.error instanceof Error ? editDetailQuery.error.message : t('production.create.error')}
          compact
        />
      ) : null}

      {!editDetailQuery.isLoading && !editDetailQuery.isError ? (
        <div className="wms-ops-production-content space-y-4 leading-normal">
          {!permission.canMutate ? <PermissionNotice /> : null}
          {!canSaveProduction ? (
            <InfoCallout
              title={t('production.create.permissionInfoTitle')}
              body={isEditMode ? t('production.create.permissionInfoUpdate') : t('production.create.permissionInfoCreate')}
            />
          ) : null}
          {isEditMode ? (
            <InfoCallout
              title={t('production.create.editModeTitle', { defaultValue: 'Missing translation' })}
              body={t('production.create.editModeBody', { defaultValue: 'Missing translation' })}
            />
          ) : null}
          <div className="wms-ops-stat-grid grid gap-2 md:grid-cols-3 xl:grid-cols-6">
            <SummaryStat label={t('production.create.summary.orders')} value={summary.orderCount} />
            <SummaryStat label={t('production.create.summary.outputs')} value={summary.outputCount} />
            <SummaryStat label={t('production.create.summary.consumptions')} value={summary.consumptionCount} />
            <SummaryStat label={t('production.create.summary.dependencies')} value={summary.dependencyCount} />
            <SummaryStat label={t('production.create.summary.totalOutput')} value={summary.totalPlannedOutput} />
            <SummaryStat label={t('production.create.summary.totalConsumption')} value={summary.totalPlannedConsumption} />
          </div>
          <Tabs value={editorMode} onValueChange={(value) => setEditorMode(value as 'planner' | 'advanced')} className="gap-3 space-y-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <TabsList className="h-8 p-0.5">
                <TabsTrigger className="px-2.5 text-xs" value="planner">{t('production.create.plannerTab', { defaultValue: 'Missing translation' })}</TabsTrigger>
                <TabsTrigger className="px-2.5 text-xs" value="advanced">{t('production.create.advancedTab', { defaultValue: 'Missing translation' })}</TabsTrigger>
              </TabsList>
              <ProductionOpsBadge>
                {t('production.create.review.source')}: {draft.source === 'erp' ? t('production.create.review.sourceErp') : t('production.create.review.sourceManual')}
              </ProductionOpsBadge>
            </div>

            <TabsContent value="planner" className="mt-4 space-y-4">
              <Card className="gap-4 py-4">
                <CardHeader>
                  <CardTitle className="text-base">{t('production.create.planner.title', { defaultValue: 'Missing translation' })}</CardTitle>
                  <CardDescription>{t('production.create.planner.subtitle', { defaultValue: 'Missing translation' })}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <InfoCallout
                    title={t('production.create.info.overviewTitle', { defaultValue: 'Missing translation' })}
                    body={t('production.create.info.overviewBody', { defaultValue: 'Missing translation' })}
                  />
                  {plannerStepNotes[plannerStep as 1 | 2 | 3 | 4].length > 0 ? (
                    <PlannerHintCard
                      title={t('production.create.planner.stepMissingTitle', { defaultValue: 'Missing translation' })}
                      body={plannerStepNotes[plannerStep as 1 | 2 | 3 | 4].map((item) => `• ${item}`).join('\n')}
                      tone="amber"
                    />
                  ) : (
                    <PlannerHintCard
                      title={t('production.create.planner.stepReadyTitle', { defaultValue: 'Missing translation' })}
                      body={t('production.create.planner.stepReadyBody', { defaultValue: 'Missing translation' })}
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
                      {t('common.back', { defaultValue: 'Missing translation' })}
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => setPlannerStep((prev) => Math.min(prev + 1, plannerSteps.length))} disabled={plannerStep === plannerSteps.length}>
                      {t('common.next', { defaultValue: 'Missing translation' })}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {plannerStep === 1 && (
                <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
                  <Card className="gap-4 py-4">
                    <CardHeader>
                      <CardTitle className="text-base">{t('production.create.planner.header.title', { defaultValue: 'Missing translation' })}</CardTitle>
                      <CardDescription>{t('production.create.planner.header.subtitle', { defaultValue: 'Missing translation' })}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <InfoCallout
                        title={t('production.create.info.headerTitle', { defaultValue: 'Missing translation' })}
                        body={t('production.create.info.headerBody', { defaultValue: 'Missing translation' })}
                      />
                      <Tabs className="gap-2" value={mode} onValueChange={(value) => handleModeChange(value as 'manual' | 'erp')}>
                        <TabsList className="h-8 p-0.5">
                          <TabsTrigger className="px-2.5 text-xs" value="manual">{t('production.create.modeManual')}</TabsTrigger>
                          <TabsTrigger className="px-2.5 text-xs" value="erp">{t('production.create.modeErp')}</TabsTrigger>
                        </TabsList>
                        <TabsContent value="manual" className="space-y-3">
                          <PlannerHintCard
                            title={t('production.create.modeManual', { defaultValue: 'Missing translation' })}
                            body={t('production.create.modeManualDescription')}
                          />
                        </TabsContent>
                        <TabsContent value="erp" className="space-y-3">
                          {renderErpFetchPanel()}
                        </TabsContent>
                      </Tabs>

                      <div className="grid gap-3 md:grid-cols-3">
                        <Field label={<>{t('common.documentNo')}<RequiredMark /></>}><OpsInput value={draft.header.documentNo} onChange={(e) => updateHeader('documentNo', e.target.value)} /></Field>
                        <Field label={t('common.documentDate')}><OpsInput type="date" value={draft.header.documentDate} onChange={(e) => updateHeader('documentDate', e.target.value)} /></Field>
                        <Field label={t('common.projectCode')}><OpsInput value={draft.header.projectCode} onChange={(e) => updateHeader('projectCode', e.target.value)} /></Field>
                        <Field label={<>{t('production.create.mainStockCode')}<RequiredMark /></>}>
                          <PagedLookupDialog<StockLookup>
                            variant="ops"
                            open={mainStockLookupOpen}
                            onOpenChange={setMainStockLookupOpen}
                            title={t('production.create.mainStockCode')}
                            description={t('production.create.productSelect', { defaultValue: 'Missing translation' })}
                            value={selectedMainStockLabel || draft.header.mainStockCode}
                            placeholder={t('production.create.productSelect', { defaultValue: 'Missing translation' })}
                            searchPlaceholder={t('production.create.productSearch', { defaultValue: 'Missing translation' })}
                            emptyText={t('production.create.productEmpty', { defaultValue: 'Missing translation' })}
                            queryKey={['production-create', 'main-stock']}
                            fetchPage={({ pageNumber, pageSize, search, signal }) =>
                              lookupApi.getProductsPaged({ pageNumber, pageSize, search }, { signal })
                            }
                            getKey={(item) => item.id.toString()}
                            getLabel={(item) => `${item.stokKodu} - ${item.stokAdi}`}
                            onSelect={(item) => {
                              updateHeader('mainStockId', item.id);
                              updateHeader('mainStockCode', item.stokKodu);
                              if (draft.header.mainStockId !== item.id) {
                                updateHeader('mainYapKod', '');
                                setSelectedMainYapKodLabel('');
                              }
                              setSelectedMainStockLabel(`${item.stokKodu} - ${item.stokAdi}`);
                            }}
                          />
                        </Field>
                        <Field label={t('production.create.mainYapKod')}>
                          <PagedLookupDialog<YapKodLookup>
                            variant="ops"
                            open={mainYapKodLookupOpen}
                            onOpenChange={setMainYapKodLookupOpen}
                            title={t('production.create.mainYapKod')}
                            description={draft.header.mainStockCode || t('production.create.mainStockCode')}
                            value={selectedMainYapKodLabel || draft.header.mainYapKod}
                            placeholder={t('production.create.yapKodSelect', { defaultValue: 'Missing translation' })}
                            searchPlaceholder={t('production.create.yapKodSearch', { defaultValue: 'Missing translation' })}
                            emptyText={t('production.create.yapKodEmpty', { defaultValue: 'Missing translation' })}
                            disabled={!draft.header.mainStockId}
                            queryKey={['production-create', 'main-yapkod', draft.header.mainStockId ?? 'none']}
                            fetchPage={({ pageNumber, pageSize, search, signal }) =>
                              lookupApi.getYapKodlarPaged({ pageNumber, pageSize, search }, { stockId: draft.header.mainStockId ?? undefined }, { signal })
                            }
                            getKey={(item) => item.id.toString()}
                            getLabel={(item) => `${item.yapKod}${item.yapAcik ? ` - ${item.yapAcik}` : ''}`}
                            onSelect={(item) => {
                              updateHeader('mainYapKod', item.yapKod);
                              setSelectedMainYapKodLabel(`${item.yapKod}${item.yapAcik ? ` - ${item.yapAcik}` : ''}`);
                            }}
                          />
                        </Field>
                        <Field label={<>{t('production.create.plannedQuantity')}<RequiredMark /></>}><OpsInput type="number" min="0" step="0.001" value={draft.header.plannedQuantity} onChange={(e) => updateHeader('plannedQuantity', Number(e.target.value) || 0)} /></Field>
                        <Field label={t('production.create.planType')}>
                          <OpsSelect value={draft.header.planType} onValueChange={(value) => updateHeader('planType', value as ProductionPlanDraft['header']['planType'])}>
                            {planTypes.map((value) => <OpsSelectItem key={value} value={value}>{planTypeLabel(value)}</OpsSelectItem>)}
                          </OpsSelect>
                        </Field>
                        <Field label={t('production.create.executionMode')}>
                          <OpsSelect value={draft.header.executionMode} onValueChange={(value) => updateHeader('executionMode', value as ProductionPlanDraft['header']['executionMode'])}>
                            {executionModes.map((value) => <OpsSelectItem key={value} value={value}>{executionModeLabel(value)}</OpsSelectItem>)}
                          </OpsSelect>
                        </Field>
                        <Field label={t('common.priority')}>
                          <OpsSelect value={String(draft.header.priority)} onValueChange={(value) => updateHeader('priority', Number(value))}>
                            {priorityOptions.map((option) => <OpsSelectItem key={option.value} value={String(option.value)}>{option.label}</OpsSelectItem>)}
                          </OpsSelect>
                        </Field>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="gap-4 py-4">
                    <CardHeader>
                      <CardTitle className="text-base">{t('production.create.readiness.title')}</CardTitle>
                      <CardDescription>{t('production.create.planner.header.side', { defaultValue: 'Missing translation' })}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <PlannerHintCard
                        title={t('production.create.planner.modeHintTitle', { defaultValue: 'Missing translation' })}
                        body={
                          draft.header.executionMode === 'Serial'
                            ? t('production.create.planner.serialHint', { defaultValue: 'Missing translation' })
                            : draft.header.executionMode === 'Parallel'
                            ? t('production.create.planner.parallelHint', { defaultValue: 'Missing translation' })
                            : t('production.create.planner.hybridHint', { defaultValue: 'Missing translation' })
                        }
                        tone="amber"
                      />
                      {validationNotes.length === 0 ? (
                        <PlannerHintCard title={t('production.create.readiness.title')} body={t('production.create.readiness.ready')} />
                      ) : (
                        <ProductionOpsReadinessMissing
                          title={t('production.create.readiness.missing')}
                          items={validationNotes}
                        />
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {plannerStep === 2 && (
                <div className="space-y-4">
                  <Card className="gap-4 py-4">
                    <CardHeader>
                      <CardTitle className="text-base">{t('production.create.planner.stageTemplates.title', { defaultValue: 'Missing translation' })}</CardTitle>
                      <CardDescription>{t('production.create.planner.stageTemplates.subtitle', { defaultValue: 'Missing translation' })}</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-2 md:grid-cols-3">
                      <Button type="button" size="sm" variant="outline" onClick={seedSingleStagePlan}>{t('production.create.planner.stageTemplates.single', { defaultValue: 'Missing translation' })}</Button>
                      <Button type="button" size="sm" variant="outline" onClick={seedSerialFlowPlan}>{t('production.create.planner.stageTemplates.serial', { defaultValue: 'Missing translation' })}</Button>
                      <Button type="button" size="sm" variant="outline" onClick={seedParallelFlowPlan}>{t('production.create.planner.stageTemplates.parallel', { defaultValue: 'Missing translation' })}</Button>
                    </CardContent>
                  </Card>

                  <Card className="gap-4 py-4">
                    <CardHeader>
                      <SectionHeader
                        title={t('production.create.orders.title')}
                        description={t('production.create.planner.ordersGuide', { defaultValue: 'Missing translation' })}
                        action={<Button type="button" size="sm" variant="outline" onClick={addOrder}>{t('production.create.addOrder')}</Button>}
                      />
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <InfoCallout
                        title={t('production.create.info.stageTitle', { defaultValue: 'Missing translation' })}
                        body={t('production.create.info.stageBody', { defaultValue: 'Missing translation' })}
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
                            <Card className="gap-3 py-3 shadow-none">
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
                                        <CardDescription>{t('production.create.planner.stageCardHint', { defaultValue: 'Missing translation' })}</CardDescription>
                                      </div>
                                      <div className="flex shrink-0 flex-wrap items-center gap-1">
                                        <ProductionOpsBadge>{t('production.create.orderBadge', { index: index + 1 })}</ProductionOpsBadge>
                                        <ProductionOpsBadge tone="info">
                                          {t('production.create.planner.flowBadge', { defaultValue: 'Missing translation' })}: {order.sequenceNo ?? index + 1}
                                          {order.parallelGroupNo ? ` / P${order.parallelGroupNo}` : ''}
                                        </ProductionOpsBadge>
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
                              title={t('production.create.planner.stageSimpleTitle', { defaultValue: 'Missing translation' })}
                              body={t('production.create.planner.stageSimpleBody', { defaultValue: 'Missing translation' })}
                            />
                            <div className="wms-ops-production-panel flex flex-wrap items-center gap-2 p-2.5 text-xs">
                              <ProductionOpsBadge tone={index === 0 ? 'active' : 'default'}>
                                {index === 0
                                  ? t('production.create.planner.firstStage', { defaultValue: 'Missing translation' })
                                  : order.parallelGroupNo === draft.orders[index - 1]?.parallelGroupNo && order.sequenceNo === draft.orders[index - 1]?.sequenceNo
                                    ? t('production.create.planner.parallelStage', { defaultValue: 'Missing translation' })
                                    : t('production.create.planner.afterStage', { defaultValue: 'Missing translation' })}
                              </ProductionOpsBadge>
                              <span className="text-muted-foreground">
                                {t('production.create.planner.flowBadge', { defaultValue: 'Missing translation' })}: {order.sequenceNo ?? index + 1}
                                {order.parallelGroupNo ? ` / P${order.parallelGroupNo}` : ''}
                              </span>
                            </div>
                            <div className="grid gap-3 md:grid-cols-3">
                              <Field label={t('production.create.planner.stagePreset', { defaultValue: 'Missing translation' })}>
                                <OpsSelect value="" onValueChange={(value) => applyStagePreset(order.localId, value as (typeof stagePresetOptions)[number]['value'])} placeholder={t('production.create.planner.stagePresetPlaceholder', { defaultValue: 'Missing translation' })}>
  {stagePresetOptions.map((option) => <OpsSelectItem key={option.value} value={option.value}>{option.label}</OpsSelectItem>)}
</OpsSelect>
                              </Field>
                                <Field label={t('production.create.planner.flowChoice', { defaultValue: 'Missing translation' })}>
                                <div className="flex flex-wrap gap-1.5">
                                  <Button type="button" size="sm" variant="outline" onClick={() => setStagePlacement(order.localId, 'first')}>
                                    {t('production.create.planner.firstStage', { defaultValue: 'Missing translation' })}
                                  </Button>
                                  <Button type="button" size="sm" variant="outline" onClick={() => setStagePlacement(order.localId, 'parallel')} disabled={index === 0}>
                                    {t('production.create.planner.parallelStage', { defaultValue: 'Missing translation' })}
                                  </Button>
                                  <Button type="button" size="sm" variant="outline" onClick={() => setStagePlacement(order.localId, 'after')} disabled={index === 0}>
                                    {t('production.create.planner.afterStage', { defaultValue: 'Missing translation' })}
                                  </Button>
                                </div>
                              </Field>
                              <Field label={<>{t('production.create.plannedQuantity')}<RequiredMark /></>}>
                                <OpsInput type="number" min="0" step="0.001" value={order.plannedQuantity} onChange={(e) => updateOrder(order.localId, (current) => ({ ...current, plannedQuantity: Number(e.target.value) || 0 }))} />
                              </Field>
                            </div>
                            <div className="grid gap-3 md:grid-cols-4">
                              <Field label={<>{t('production.create.planner.stageName', { defaultValue: 'Missing translation' })}<RequiredMark /></>}>
                                <OpsInput value={order.orderNo} onChange={(e) => updateOrder(order.localId, (current) => ({ ...current, orderNo: e.target.value }))} placeholder={t('production.create.planner.stageNamePlaceholder', { defaultValue: 'Missing translation' })} />
                              </Field>
                              <Field label={<>{t('production.create.producedStockCode')}<RequiredMark /></>}>
                                <PagedLookupDialog<StockLookup>
                                  variant="ops"
                                  open={activeLookupKey === `planner-order-stock-${order.localId}`}
                                  onOpenChange={(open) => setActiveLookupKey(open ? `planner-order-stock-${order.localId}` : null)}
                                  title={t('production.create.producedStockCode')}
                                  description={order.orderNo || t('production.create.orderPlaceholder')}
                                  value={getLookupLabel(`planner-order-stock-${order.localId}`, order.producedStockCode)}
                                  placeholder={t('production.create.productSelect', { defaultValue: 'Missing translation' })}
                                  searchPlaceholder={t('production.create.productSearch', { defaultValue: 'Missing translation' })}
                                  emptyText={t('production.create.productEmpty', { defaultValue: 'Missing translation' })}
                                  queryKey={['production-create', 'planner-order-stock', order.localId]}
                                  fetchPage={({ pageNumber, pageSize, search, signal }) =>
                                    lookupApi.getProductsPaged({ pageNumber, pageSize, search }, { signal })
                                  }
                                  getKey={(item) => item.id.toString()}
                                  getLabel={(item) => `${item.stokKodu} - ${item.stokAdi}`}
                                  onSelect={(item) => {
                                    updateOrder(order.localId, (current) => ({
                                      ...current,
                                      producedStockId: item.id,
                                      producedStockCode: item.stokKodu,
                                      producedYapKod: current.producedStockId === item.id ? current.producedYapKod : '',
                                    }));
                                    if (order.producedStockId !== item.id) {
                                      setLookupLabel(`planner-order-yapkod-${order.localId}`, '');
                                    }
                                    setLookupLabel(`planner-order-stock-${order.localId}`, `${item.stokKodu} - ${item.stokAdi}`);
                                  }}
                                />
                              </Field>
                              <Field label={t('production.create.producedYapKod')}>
                                <PagedLookupDialog<YapKodLookup>
                                  variant="ops"
                                  open={activeLookupKey === `planner-order-yapkod-${order.localId}`}
                                  onOpenChange={(open) => setActiveLookupKey(open ? `planner-order-yapkod-${order.localId}` : null)}
                                  title={t('production.create.producedYapKod')}
                                  description={order.producedStockCode || t('production.create.producedStockCode')}
                                  value={getLookupLabel(`planner-order-yapkod-${order.localId}`, order.producedYapKod)}
                                  placeholder={t('production.create.yapKodSelect', { defaultValue: 'Missing translation' })}
                                  searchPlaceholder={t('production.create.yapKodSearch', { defaultValue: 'Missing translation' })}
                                  emptyText={t('production.create.yapKodEmpty', { defaultValue: 'Missing translation' })}
                                  disabled={!order.producedStockId}
                                  queryKey={['production-create', 'planner-order-yapkod', order.localId, order.producedStockId ?? 'none']}
                                  fetchPage={({ pageNumber, pageSize, search, signal }) =>
                                    lookupApi.getYapKodlarPaged({ pageNumber, pageSize, search }, { stockId: order.producedStockId ?? undefined }, { signal })
                                  }
                                  getKey={(item) => item.id.toString()}
                                  getLabel={(item) => `${item.yapKod}${item.yapAcik ? ` - ${item.yapAcik}` : ''}`}
                                  onSelect={(item) => {
                                    updateOrder(order.localId, (current) => ({ ...current, producedYapKod: item.yapKod }));
                                    setLookupLabel(`planner-order-yapkod-${order.localId}`, `${item.yapKod}${item.yapAcik ? ` - ${item.yapAcik}` : ''}`);
                                  }}
                                />
                              </Field>
                              <Field label={t('production.create.orderType')}>
                                <OpsSelect value={order.orderType} onValueChange={(value) => updateOrder(order.localId, (current) => ({ ...current, orderType: value as ProductionOrderDraft['orderType'] }))}>
  {orderTypes.map((value) => <OpsSelectItem key={value} value={value}>{orderTypeLabel(value)}</OpsSelectItem>)}
</OpsSelect>
                              </Field>
                            </div>
                            <Field label={t('production.create.sourceWarehouse')}>
                              <PagedLookupDialog<WarehouseLookup>
                                variant="ops"
                                open={activeLookupKey === `planner-order-source-warehouse-${order.localId}`}
                                onOpenChange={(open) => setActiveLookupKey(open ? `planner-order-source-warehouse-${order.localId}` : null)}
                                title={t('production.create.sourceWarehouse')}
                                description={order.orderNo || t('production.create.orderPlaceholder')}
                                value={getLookupLabel(`planner-order-source-warehouse-${order.localId}`, order.sourceWarehouseCode)}
                                placeholder={t('production.create.sourceWarehouseSelect', { defaultValue: 'Missing translation' })}
                                searchPlaceholder={t('production.create.warehouseSearch', { defaultValue: 'Missing translation' })}
                                emptyText={t('production.create.warehouseEmpty', { defaultValue: 'Missing translation' })}
                                queryKey={['production-create', 'planner-order-source-warehouse', order.localId]}
                                fetchPage={({ pageNumber, pageSize, search, signal }) =>
                                  lookupApi.getWarehousesPaged({ pageNumber, pageSize, search }, undefined, { signal })
                                }
                                getKey={(item) => item.id.toString()}
                                getLabel={(item) => `${item.depoKodu} - ${item.depoIsmi}`}
                                onSelect={(item) => {
                                  updateOrder(order.localId, (current) => ({ ...current, sourceWarehouseCode: String(item.depoKodu) }));
                                  setLookupLabel(`planner-order-source-warehouse-${order.localId}`, `${item.depoKodu} - ${item.depoIsmi}`);
                                }}
                              />
                            </Field>
                            <Field label={t('production.create.targetWarehouse')}>
                              <PagedLookupDialog<WarehouseLookup>
                                variant="ops"
                                open={activeLookupKey === `planner-order-target-warehouse-${order.localId}`}
                                onOpenChange={(open) => setActiveLookupKey(open ? `planner-order-target-warehouse-${order.localId}` : null)}
                                title={t('production.create.targetWarehouse')}
                                description={order.orderNo || t('production.create.orderPlaceholder')}
                                value={getLookupLabel(`planner-order-target-warehouse-${order.localId}`, order.targetWarehouseCode)}
                                placeholder={t('production.create.targetWarehouseSelect', { defaultValue: 'Missing translation' })}
                                searchPlaceholder={t('production.create.warehouseSearch', { defaultValue: 'Missing translation' })}
                                emptyText={t('production.create.warehouseEmpty', { defaultValue: 'Missing translation' })}
                                queryKey={['production-create', 'planner-order-target-warehouse', order.localId]}
                                fetchPage={({ pageNumber, pageSize, search, signal }) =>
                                  lookupApi.getWarehousesPaged({ pageNumber, pageSize, search }, undefined, { signal })
                                }
                                getKey={(item) => item.id.toString()}
                                getLabel={(item) => `${item.depoKodu} - ${item.depoIsmi}`}
                                onSelect={(item) => {
                                  updateOrder(order.localId, (current) => ({ ...current, targetWarehouseCode: String(item.depoKodu) }));
                                  setLookupLabel(`planner-order-target-warehouse-${order.localId}`, `${item.depoKodu} - ${item.depoIsmi}`);
                                }}
                              />
                            </Field>
                            {(() => {
                              const stageLabel = order.orderNo.trim() || `Asama ${index + 1}`;
                              const stageNotes = plannerStepNotes[2].filter((item) => item.startsWith(stageLabel));
                              return stageNotes.length > 0 ? (
                                <div className="md:col-span-2">
                                  <PlannerHintCard
                                    title={t('production.create.planner.stageMissingTitle', { defaultValue: 'Missing translation' })}
                                    body={stageNotes.map((item) => `• ${item}`).join('\n')}
                                    tone="amber"
                                  />
                                </div>
                              ) : (
                                <div className="md:col-span-2">
                                  <PlannerHintCard
                                    title={t('production.create.planner.stageReadyTitle', { defaultValue: 'Missing translation' })}
                                    body={t('production.create.planner.stageReadyBody', { defaultValue: 'Missing translation' })}
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
                      <CardDescription>{t('production.create.planner.outputsGuide', { defaultValue: 'Missing translation' })}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <InfoCallout
                        title={t('production.create.info.outputTitle', { defaultValue: 'Missing translation' })}
                        body={t('production.create.info.outputBody', { defaultValue: 'Missing translation' })}
                      />
                      {plannerStepNotes[3].some((item) => item.startsWith('Cikti') || item.includes('cikti satiri')) ? (
                        <PlannerHintCard
                          title={t('production.create.planner.outputsMissingTitle', { defaultValue: 'Missing translation' })}
                          body={plannerStepNotes[3].filter((item) => item.startsWith('Cikti') || item.includes('cikti satiri')).map((item) => `• ${item}`).join('\n')}
                          tone="amber"
                        />
                      ) : null}
                      {groupedOutputs.map(({ order, rows }) => (
                        <div key={order.localId} className="wms-ops-production-panel">
                          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                            <div className="min-w-0">
                              <div className="wms-ops-production-panel__title">{order.orderNo || order.producedStockCode || t('production.create.orderPlaceholder')}</div>
                              <div className="text-xs text-muted-foreground">{order.producedStockCode || '-'}</div>
                            </div>
                            <Button type="button" size="sm" variant="outline" onClick={() => addOutputForOrder(order.localId)}>{t('production.create.addOutput')}</Button>
                          </div>
                          <div className="wms-ops-production-line-table-wrap">
                            <ProductionPlanLineGrid variant="planner-output">
                              <ProductionPlanLineGridHeader>
                                <ProductionPlanLineGridHead>{t('production.create.columns.stock')}</ProductionPlanLineGridHead>
                                <ProductionPlanLineGridHead>{t('production.create.yapKod', { defaultValue: 'Missing translation' })}</ProductionPlanLineGridHead>
                                <ProductionPlanLineGridHead>{t('production.create.columns.quantity')}</ProductionPlanLineGridHead>
                                <ProductionPlanLineGridHead>{t('production.create.trackingMode')}</ProductionPlanLineGridHead>
                                <ProductionPlanLineGridHead className="wms-ops-production-line-grid__head--actions">{t('common.actions')}</ProductionPlanLineGridHead>
                              </ProductionPlanLineGridHeader>
                              <ProductionPlanLinePaginatedBody
                                items={rows}
                                getRowKey={(row) => row.localId}
                                renderRow={(row) => (
                              <ProductionPlanLineGridRow key={row.localId}>
                                <ProductionPlanLineGridCell>
                                <PagedLookupDialog<StockLookup>
                                  variant="ops"
                                  open={activeLookupKey === `planner-output-stock-${row.localId}`}
                                  onOpenChange={(open) => setActiveLookupKey(open ? `planner-output-stock-${row.localId}` : null)}
                                  title={t('production.create.columns.stock')}
                                  description={order.orderNo || t('production.create.orderPlaceholder')}
                                  value={getLookupLabel(`planner-output-stock-${row.localId}`, row.stockCode)}
                                  placeholder={t('production.create.productSelect', { defaultValue: 'Missing translation' })}
                                  searchPlaceholder={t('production.create.productSearch', { defaultValue: 'Missing translation' })}
                                  emptyText={t('production.create.productEmpty', { defaultValue: 'Missing translation' })}
                                  queryKey={['production-create', 'planner-output-stock', row.localId]}
                                  fetchPage={({ pageNumber, pageSize, search, signal }) =>
                                    lookupApi.getProductsPaged({ pageNumber, pageSize, search }, { signal })
                                  }
                                  getKey={(item) => item.id.toString()}
                                  getLabel={(item) => `${item.stokKodu} - ${item.stokAdi}`}
                                  onSelect={(item) => {
                                    updateOutput(row.localId, (current) => ({
                                      ...current,
                                      stockId: item.id,
                                      stockCode: item.stokKodu,
                                      yapKod: current.stockId === item.id ? current.yapKod : '',
                                    }));
                                    if (row.stockId !== item.id) {
                                      setLookupLabel(`planner-output-yapkod-${row.localId}`, '');
                                    }
                                    setLookupLabel(`planner-output-stock-${row.localId}`, `${item.stokKodu} - ${item.stokAdi}`);
                                  }}
                                />
                                </ProductionPlanLineGridCell>
                                <ProductionPlanLineGridCell>
                                <PagedLookupDialog<YapKodLookup>
                                  variant="ops"
                                  open={activeLookupKey === `planner-output-yapkod-${row.localId}`}
                                  onOpenChange={(open) => setActiveLookupKey(open ? `planner-output-yapkod-${row.localId}` : null)}
                                  title={t('production.create.yapKodSelect', { defaultValue: 'Missing translation' })}
                                  description={row.stockCode || t('production.create.columns.stock')}
                                  value={getLookupLabel(`planner-output-yapkod-${row.localId}`, row.yapKod)}
                                  placeholder={t('production.create.yapKodSelect', { defaultValue: 'Missing translation' })}
                                  searchPlaceholder={t('production.create.yapKodSearch', { defaultValue: 'Missing translation' })}
                                  emptyText={t('production.create.yapKodEmpty', { defaultValue: 'Missing translation' })}
                                  disabled={!row.stockId}
                                  queryKey={['production-create', 'planner-output-yapkod', row.localId, row.stockId ?? 'none']}
                                  fetchPage={({ pageNumber, pageSize, search, signal }) =>
                                    lookupApi.getYapKodlarPaged({ pageNumber, pageSize, search }, { stockId: row.stockId ?? undefined }, { signal })
                                  }
                                  getKey={(item) => item.id.toString()}
                                  getLabel={(item) => `${item.yapKod}${item.yapAcik ? ` - ${item.yapAcik}` : ''}`}
                                  onSelect={(item) => {
                                    updateOutput(row.localId, (current) => ({ ...current, yapKod: item.yapKod }));
                                    setLookupLabel(`planner-output-yapkod-${row.localId}`, `${item.yapKod}${item.yapAcik ? ` - ${item.yapAcik}` : ''}`);
                                  }}
                                />
                                </ProductionPlanLineGridCell>
                                <ProductionPlanLineGridCell>
                                <OpsInput className="wms-ops-production-qty-input" type="number" min="0" step="0.001" placeholder={t('production.create.columns.quantity')} value={row.plannedQuantity} onChange={(e) => updateOutput(row.localId, (current) => ({ ...current, plannedQuantity: Number(e.target.value) || 0 }))} />
                                </ProductionPlanLineGridCell>
                                <ProductionPlanLineGridCell>
                                <OpsSelect value={row.trackingMode} onValueChange={(value) => updateOutput(row.localId, (current) => ({ ...current, trackingMode: value as ProductionOutputDraft['trackingMode'] }))}>
  {trackingModes.map((value) => <OpsSelectItem key={value} value={value}>{trackingModeLabel(value)}</OpsSelectItem>)}
</OpsSelect>
                                </ProductionPlanLineGridCell>
                                <ProductionPlanLineGridCell className="wms-ops-production-line-grid__cell--actions">
                                <ProductionOpsDeleteButton label={t('common.delete')} onClick={() => removeOutput(row.localId)} />
                                </ProductionPlanLineGridCell>
                              </ProductionPlanLineGridRow>
                                )}
                              />
                            </ProductionPlanLineGrid>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card className="gap-4 py-4">
                    <CardHeader>
                      <CardTitle className="text-base">{t('production.create.consumptions.title')}</CardTitle>
                      <CardDescription>{t('production.create.planner.consumptionsGuide', { defaultValue: 'Missing translation' })}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <InfoCallout
                        title={t('production.create.info.consumptionTitle', { defaultValue: 'Missing translation' })}
                        body={t('production.create.info.consumptionBody', { defaultValue: 'Missing translation' })}
                      />
                      {plannerStepNotes[3].some((item) => item.startsWith('Tuketim')) ? (
                        <PlannerHintCard
                          title={t('production.create.planner.consumptionsMissingTitle', { defaultValue: 'Missing translation' })}
                          body={plannerStepNotes[3].filter((item) => item.startsWith('Tuketim')).map((item) => `• ${item}`).join('\n')}
                          tone="sky"
                        />
                      ) : null}
                      {groupedConsumptions.map(({ order, rows }) => (
                        <div key={order.localId} className="wms-ops-production-panel">
                          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                            <div className="min-w-0">
                              <div className="wms-ops-production-panel__title">{order.orderNo || order.producedStockCode || t('production.create.orderPlaceholder')}</div>
                              <div className="text-xs text-muted-foreground">{t('production.create.planner.consumptionForStage', { defaultValue: 'Missing translation' })}</div>
                            </div>
                            <Button type="button" size="sm" variant="outline" onClick={() => addConsumptionForOrder(order.localId)}>{t('production.create.addConsumption')}</Button>
                          </div>
                          <div className="wms-ops-production-line-table-wrap">
                            <ProductionPlanLineGrid variant="planner-consumption">
                              <ProductionPlanLineGridHeader>
                                <ProductionPlanLineGridHead>{t('production.create.sourceStock')}</ProductionPlanLineGridHead>
                                <ProductionPlanLineGridHead>{t('production.create.yapKod', { defaultValue: 'Missing translation' })}</ProductionPlanLineGridHead>
                                <ProductionPlanLineGridHead>{t('production.create.columns.quantity')}</ProductionPlanLineGridHead>
                                <ProductionPlanLineGridHead>{t('production.create.serialEntryMode')}</ProductionPlanLineGridHead>
                                <ProductionPlanLineGridHead>{t('production.create.isBackflush', { defaultValue: 'Missing translation' })}</ProductionPlanLineGridHead>
                                <ProductionPlanLineGridHead className="wms-ops-production-line-grid__head--actions">{t('common.actions')}</ProductionPlanLineGridHead>
                              </ProductionPlanLineGridHeader>
                              <ProductionPlanLinePaginatedBody
                                items={rows}
                                getRowKey={(row) => row.localId}
                                renderRow={(row) => (
                              <ProductionPlanLineGridRow key={row.localId}>
                                <ProductionPlanLineGridCell>
                                <PagedLookupDialog<StockLookup>
                                  variant="ops"
                                  open={activeLookupKey === `planner-consumption-stock-${row.localId}`}
                                  onOpenChange={(open) => setActiveLookupKey(open ? `planner-consumption-stock-${row.localId}` : null)}
                                  title={t('production.create.sourceStock')}
                                  description={order.orderNo || t('production.create.orderPlaceholder')}
                                  value={getLookupLabel(`planner-consumption-stock-${row.localId}`, row.stockCode)}
                                  placeholder={t('production.create.sourceStockSelect', { defaultValue: 'Missing translation' })}
                                  searchPlaceholder={t('production.create.productSearch', { defaultValue: 'Missing translation' })}
                                  emptyText={t('production.create.productEmpty', { defaultValue: 'Missing translation' })}
                                  queryKey={['production-create', 'planner-consumption-stock', row.localId]}
                                  fetchPage={({ pageNumber, pageSize, search, signal }) =>
                                    lookupApi.getProductsPaged({ pageNumber, pageSize, search }, { signal })
                                  }
                                  getKey={(item) => item.id.toString()}
                                  getLabel={(item) => `${item.stokKodu} - ${item.stokAdi}`}
                                  onSelect={(item) => {
                                    updateConsumption(row.localId, (current) => ({
                                      ...current,
                                      stockId: item.id,
                                      stockCode: item.stokKodu,
                                      yapKod: current.stockId === item.id ? current.yapKod : '',
                                    }));
                                    if (row.stockId !== item.id) {
                                      setLookupLabel(`planner-consumption-yapkod-${row.localId}`, '');
                                    }
                                    setLookupLabel(`planner-consumption-stock-${row.localId}`, `${item.stokKodu} - ${item.stokAdi}`);
                                  }}
                                />
                                </ProductionPlanLineGridCell>
                                <ProductionPlanLineGridCell>
                                <PagedLookupDialog<YapKodLookup>
                                  variant="ops"
                                  open={activeLookupKey === `planner-consumption-yapkod-${row.localId}`}
                                  onOpenChange={(open) => setActiveLookupKey(open ? `planner-consumption-yapkod-${row.localId}` : null)}
                                  title={t('production.create.yapKodSelect', { defaultValue: 'Missing translation' })}
                                  description={row.stockCode || t('production.create.sourceStock')}
                                  value={getLookupLabel(`planner-consumption-yapkod-${row.localId}`, row.yapKod)}
                                  placeholder={t('production.create.yapKodSelect', { defaultValue: 'Missing translation' })}
                                  searchPlaceholder={t('production.create.yapKodSearch', { defaultValue: 'Missing translation' })}
                                  emptyText={t('production.create.yapKodEmpty', { defaultValue: 'Missing translation' })}
                                  disabled={!row.stockId}
                                  queryKey={['production-create', 'planner-consumption-yapkod', row.localId, row.stockId ?? 'none']}
                                  fetchPage={({ pageNumber, pageSize, search, signal }) =>
                                    lookupApi.getYapKodlarPaged({ pageNumber, pageSize, search }, { stockId: row.stockId ?? undefined }, { signal })
                                  }
                                  getKey={(item) => item.id.toString()}
                                  getLabel={(item) => `${item.yapKod}${item.yapAcik ? ` - ${item.yapAcik}` : ''}`}
                                  onSelect={(item) => {
                                    updateConsumption(row.localId, (current) => ({ ...current, yapKod: item.yapKod }));
                                    setLookupLabel(`planner-consumption-yapkod-${row.localId}`, `${item.yapKod}${item.yapAcik ? ` - ${item.yapAcik}` : ''}`);
                                  }}
                                />
                                </ProductionPlanLineGridCell>
                                <ProductionPlanLineGridCell>
                                <OpsInput className="wms-ops-production-qty-input" type="number" min="0" step="0.001" placeholder={t('production.create.columns.quantity')} value={row.plannedQuantity} onChange={(e) => updateConsumption(row.localId, (current) => ({ ...current, plannedQuantity: Number(e.target.value) || 0 }))} />
                                </ProductionPlanLineGridCell>
                                <ProductionPlanLineGridCell>
                                <OpsSelect value={row.serialEntryMode} onValueChange={(value) => updateConsumption(row.localId, (current) => ({ ...current, serialEntryMode: value as ProductionConsumptionDraft['serialEntryMode'] }))}>
  {serialModes.map((value) => <OpsSelectItem key={value} value={value}>{serialModeLabel(value)}</OpsSelectItem>)}
</OpsSelect>
                                </ProductionPlanLineGridCell>
                                <ProductionPlanLineGridCell>
                                <ProductionOpsCircuitToggle
                                  compact
                                  checked={row.isBackflush}
                                  onCheckedChange={(checked) => updateConsumption(row.localId, (current) => ({ ...current, isBackflush: checked }))}
                                  aria-label={t('production.create.isBackflush', { defaultValue: 'Missing translation' })}
                                />
                                </ProductionPlanLineGridCell>
                                <ProductionPlanLineGridCell className="wms-ops-production-line-grid__cell--actions">
                                <ProductionOpsDeleteButton label={t('common.delete')} onClick={() => removeConsumption(row.localId)} />
                                </ProductionPlanLineGridCell>
                              </ProductionPlanLineGridRow>
                                )}
                              />
                            </ProductionPlanLineGrid>
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
                        description={t('production.create.planner.flowGuide', { defaultValue: 'Missing translation' })}
                        action={<Button type="button" size="sm" variant="outline" onClick={applyFlowTemplate}>{t('production.create.planner.applyFlow', { defaultValue: 'Missing translation' })}</Button>}
                      />
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <InfoCallout
                        title={t('production.create.info.flowTitle', { defaultValue: 'Missing translation' })}
                        body={t('production.create.info.flowBody', { defaultValue: 'Missing translation' })}
                      />
                      {plannerStepNotes[4].length > 0 ? (
                        <PlannerHintCard
                          title={t('production.create.planner.flowMissingTitle', { defaultValue: 'Missing translation' })}
                          body={plannerStepNotes[4].map((item) => `• ${item}`).join('\n')}
                          tone="amber"
                        />
                      ) : null}
                      <div className="grid gap-3 md:grid-cols-3">
                        <SummaryStat label={t('production.create.planner.summary.stages', { defaultValue: 'Missing translation' })} value={plannerSummary.stageCount} />
                        <SummaryStat label={t('production.create.planner.summary.ordered', { defaultValue: 'Missing translation' })} value={plannerSummary.serialStages} />
                        <SummaryStat label={t('production.create.planner.summary.assigned', { defaultValue: 'Missing translation' })} value={plannerSummary.assignedStages} />
                      </div>
                      {draft.dependencies.length === 0 ? (
                        <PlannerHintCard title={t('production.create.dependencies.empty')} body={t('production.create.planner.flowEmpty', { defaultValue: 'Missing translation' })} tone="amber" />
                      ) : draft.dependencies.map((dependency) => {
                        const predecessor = orderOptions.find((option) => option.value === dependency.predecessorOrderLocalId)?.label ?? '-';
                        const successor = orderOptions.find((option) => option.value === dependency.successorOrderLocalId)?.label ?? '-';
                        return (
                          <div key={dependency.localId} className="wms-ops-production-panel">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <ProductionOpsBadge className="max-w-40 truncate">{predecessor}</ProductionOpsBadge>
                              <span className="text-xs text-muted-foreground">{dependencyTypeLabel(dependency.dependencyType)}</span>
                              <ProductionOpsBadge className="max-w-40 truncate">{successor}</ProductionOpsBadge>
                            </div>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {dependency.requiredOutputAvailable ? <ProductionOpsBadge tone="info">{t('production.create.outputReady')}</ProductionOpsBadge> : null}
                              {dependency.requiredTransferCompleted ? <ProductionOpsBadge tone="info">{t('production.create.transferReady')}</ProductionOpsBadge> : null}
                              {dependency.lagMinutes > 0 ? <ProductionOpsBadge tone="info">{t('production.create.lagMinutes')}: {dependency.lagMinutes}</ProductionOpsBadge> : null}
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
                          description={t('production.create.planner.headerAssignmentGuide', { defaultValue: 'Missing translation' })}
                          action={<Button type="button" size="sm" variant="outline" onClick={addHeaderAssignment}>{t('production.create.addHeaderAssignment')}</Button>}
                        />
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {draft.header.assignments.map((assignment) => (
                          <div key={assignment.localId} className="grid gap-2 md:grid-cols-4">
                            <OpsSelect value={assignment.assignmentType} onValueChange={(value) => updateHeaderAssignment(assignment.localId, (row) => ({ ...row, assignmentType: value as ProductionHeaderAssignmentDraft['assignmentType'] }))}>
  {assignmentTypes.map((value) => <OpsSelectItem key={value} value={value}>{assignmentTypeLabel(value)}</OpsSelectItem>)}
</OpsSelect>
                            <Combobox
                              variant="ops"
                              options={userOptions}
                              value={assignment.assignedUserId ? String(assignment.assignedUserId) : ''}
                              onValueChange={(value) => updateHeaderAssignment(assignment.localId, (row) => ({ ...row, assignedUserId: value ? Number(value) : undefined }))}
                              placeholder={t('production.create.assignedUserSelect', { defaultValue: 'Missing translation' })}
                              searchPlaceholder={t('production.create.userSearch', { defaultValue: 'Missing translation' })}
                              emptyText={t('production.create.userEmpty', { defaultValue: 'Missing translation' })}
                            />
                            <Combobox
                              variant="ops"
                              options={roleOptions}
                              value={assignment.assignedRoleId ? String(assignment.assignedRoleId) : ''}
                              onValueChange={(value) => updateHeaderAssignment(assignment.localId, (row) => ({ ...row, assignedRoleId: value ? Number(value) : undefined }))}
                              placeholder={t('production.create.assignedRoleSelect', { defaultValue: 'Missing translation' })}
                              searchPlaceholder={t('production.create.roleSearch', { defaultValue: 'Missing translation' })}
                              emptyText={t('production.create.roleEmpty', { defaultValue: 'Missing translation' })}
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
                        <CardDescription>{t('production.create.planner.orderAssignmentGuide', { defaultValue: 'Missing translation' })}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {draft.orders.map((order) => (
                          <div key={order.localId} className="wms-ops-production-panel">
                            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                              <div className="wms-ops-production-panel__title">{order.orderNo || order.producedStockCode || t('production.create.orderPlaceholder')}</div>
                              <Button type="button" size="sm" variant="outline" onClick={() => addOrderAssignment(order.localId)}>{t('production.create.addOrderAssignment')}</Button>
                            </div>
                            <div className="space-y-2">
                              {order.assignments.map((assignment) => (
                                <div key={assignment.localId} className="grid gap-2 md:grid-cols-[1fr_1fr_1.2fr_auto]">
                                  <OpsSelect value={assignment.assignmentType} onValueChange={(value) => updateOrderAssignment(order.localId, assignment.localId, (row) => ({ ...row, assignmentType: value as ProductionOrderAssignmentDraft['assignmentType'] }))}>
  {assignmentTypes.map((value) => <OpsSelectItem key={value} value={value}>{assignmentTypeLabel(value)}</OpsSelectItem>)}
</OpsSelect>
                                  <Combobox
                                    variant="ops"
                                    options={userOptions}
                                    value={assignment.assignedUserId ? String(assignment.assignedUserId) : ''}
                                    onValueChange={(value) => updateOrderAssignment(order.localId, assignment.localId, (row) => ({ ...row, assignedUserId: value ? Number(value) : undefined }))}
                                    placeholder={t('production.create.assignedUserSelect', { defaultValue: 'Missing translation' })}
                                    searchPlaceholder={t('production.create.userSearch', { defaultValue: 'Missing translation' })}
                                    emptyText={t('production.create.userEmpty', { defaultValue: 'Missing translation' })}
                                  />
                                  <OpsInput placeholder={t('production.create.assignmentNote')} value={assignment.note} onChange={(e) => updateOrderAssignment(order.localId, assignment.localId, (row) => ({ ...row, note: e.target.value }))} />
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
                        <PlannerHintCard title={t('production.create.modeManual', { defaultValue: 'Missing translation' })} body={t('production.create.modeManualDescription')} />
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
                      <ProductionOpsBadge>
                        {t('production.create.review.source')}: {draft.source === 'erp' ? t('production.create.review.sourceErp') : t('production.create.review.sourceManual')}
                      </ProductionOpsBadge>
                      <ProductionOpsBadge>
                        {t('production.create.review.execution')}: {executionModeLabel(draft.header.executionMode)}
                      </ProductionOpsBadge>
                      <ProductionOpsBadge className="max-w-full truncate">
                        {t('production.create.review.mainStock')}: {draft.header.mainStockCode || '-'}
                      </ProductionOpsBadge>
                    </div>
                    {validationNotes.length === 0 ? (
                      <PlannerHintCard title={t('production.create.readiness.title')} body={t('production.create.readiness.ready')} />
                    ) : (
                      <ProductionOpsReadinessMissing
                        title={t('production.create.readiness.missing')}
                        items={validationNotes}
                      />
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
                  <Field label={t('common.documentNo')}><OpsInput value={draft.header.documentNo} onChange={(e) => updateHeader('documentNo', e.target.value)} /></Field>
                  <Field label={t('common.documentDate')}><OpsInput type="date" value={draft.header.documentDate} onChange={(e) => updateHeader('documentDate', e.target.value)} /></Field>
                  <Field label={t('common.projectCode')}><OpsInput value={draft.header.projectCode} onChange={(e) => updateHeader('projectCode', e.target.value)} /></Field>
                  <Field label={t('production.create.planType')}>
                    <OpsSelect value={draft.header.planType} onValueChange={(value) => updateHeader('planType', value as ProductionPlanDraft['header']['planType'])}>
  {planTypes.map((value) => <OpsSelectItem key={value} value={value}>{planTypeLabel(value)}</OpsSelectItem>)}
</OpsSelect>
                  </Field>
                  <Field label={t('production.create.executionMode')}>
                    <OpsSelect value={draft.header.executionMode} onValueChange={(value) => updateHeader('executionMode', value as ProductionPlanDraft['header']['executionMode'])}>
  {executionModes.map((value) => <OpsSelectItem key={value} value={value}>{executionModeLabel(value)}</OpsSelectItem>)}
</OpsSelect>
                  </Field>
                  <Field label={t('common.priority')}>
                    <OpsSelect value={String(draft.header.priority)} onValueChange={(value) => updateHeader('priority', Number(value))}>
  {priorityOptions.map((option) => <OpsSelectItem key={option.value} value={String(option.value)}>{option.label}</OpsSelectItem>)}
</OpsSelect>
                  </Field>
                  <Field label={t('production.create.mainStockCode')}>
                    <PagedLookupDialog<StockLookup>
                      variant="ops"
                      open={mainStockLookupOpen}
                      onOpenChange={setMainStockLookupOpen}
                      title={t('production.create.mainStockCode')}
                      description={t('production.create.productSelect', { defaultValue: 'Missing translation' })}
                      value={selectedMainStockLabel || draft.header.mainStockCode}
                      placeholder={t('production.create.productSelect', { defaultValue: 'Missing translation' })}
                      searchPlaceholder={t('production.create.productSearch', { defaultValue: 'Missing translation' })}
                      emptyText={t('production.create.productEmpty', { defaultValue: 'Missing translation' })}
                      queryKey={['production-create', 'advanced-main-stock']}
                      fetchPage={({ pageNumber, pageSize, search, signal }) =>
                        lookupApi.getProductsPaged({ pageNumber, pageSize, search }, { signal })
                      }
                      getKey={(item) => item.id.toString()}
                      getLabel={(item) => `${item.stokKodu} - ${item.stokAdi}`}
                      onSelect={(item) => {
                        updateHeader('mainStockId', item.id);
                        updateHeader('mainStockCode', item.stokKodu);
                        if (draft.header.mainStockId !== item.id) {
                          updateHeader('mainYapKod', '');
                          setSelectedMainYapKodLabel('');
                        }
                        setSelectedMainStockLabel(`${item.stokKodu} - ${item.stokAdi}`);
                      }}
                    />
                  </Field>
                  <Field label={t('production.create.mainYapKod')}>
                    <PagedLookupDialog<YapKodLookup>
                      variant="ops"
                      open={mainYapKodLookupOpen}
                      onOpenChange={setMainYapKodLookupOpen}
                      title={t('production.create.mainYapKod')}
                      description={draft.header.mainStockCode || t('production.create.mainStockCode')}
                      value={selectedMainYapKodLabel || draft.header.mainYapKod}
                      placeholder={t('production.create.yapKodSelect', { defaultValue: 'Missing translation' })}
                      searchPlaceholder={t('production.create.yapKodSearch', { defaultValue: 'Missing translation' })}
                      emptyText={t('production.create.yapKodEmpty', { defaultValue: 'Missing translation' })}
                      disabled={!draft.header.mainStockId}
                      queryKey={['production-create', 'advanced-main-yapkod', draft.header.mainStockId ?? 'none']}
                      fetchPage={({ pageNumber, pageSize, search, signal }) =>
                        lookupApi.getYapKodlarPaged({ pageNumber, pageSize, search }, { stockId: draft.header.mainStockId ?? undefined }, { signal })
                      }
                      getKey={(item) => item.id.toString()}
                      getLabel={(item) => `${item.yapKod}${item.yapAcik ? ` - ${item.yapAcik}` : ''}`}
                      onSelect={(item) => {
                        updateHeader('mainYapKod', item.yapKod);
                        setSelectedMainYapKodLabel(`${item.yapKod}${item.yapAcik ? ` - ${item.yapAcik}` : ''}`);
                      }}
                    />
                  </Field>
                  <Field label={t('production.create.plannedQuantity')}><OpsInput type="number" min="0" step="0.001" value={draft.header.plannedQuantity} onChange={(e) => updateHeader('plannedQuantity', Number(e.target.value) || 0)} /></Field>
                  <Field label={t('production.create.plannedStartDate')}><OpsInput type="date" value={draft.header.plannedStartDate} onChange={(e) => updateHeader('plannedStartDate', e.target.value)} /></Field>
                  <Field label={t('production.create.plannedEndDate')}><OpsInput type="date" value={draft.header.plannedEndDate} onChange={(e) => updateHeader('plannedEndDate', e.target.value)} /></Field>
                  <Field label={t('common.description')} className="md:col-span-3">
                    <OpsTextarea className="min-h-17 text-sm" value={draft.header.description} onChange={(e) => updateHeader('description', e.target.value)} rows={3} />
                  </Field>
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
                      <AccordionItem key={order.localId} value={order.localId} className="wms-ops-production-panel px-3">
                        <AccordionTrigger className="py-3 hover:no-underline data-[state=open]:pb-2">
                          <div className="flex flex-1 flex-wrap items-center gap-2 text-left">
                            <ProductionOpsBadge>{t('production.create.orderBadge', { index: index + 1 })}</ProductionOpsBadge>
                            <span className="wms-ops-production-panel__title">{order.orderNo || t('production.create.orderPlaceholder')}</span>
                            <span className="text-xs text-muted-foreground">{order.producedStockCode || t('production.create.stockPlaceholder')}</span>
                            <span className="text-xs tabular-nums text-muted-foreground">{order.plannedQuantity} {t('common.unit')}</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-3 pb-3">
                          <div className="grid gap-3 md:grid-cols-4">
                            <Field label={t('production.create.orderNo')}><OpsInput value={order.orderNo} onChange={(e) => updateOrder(order.localId, (current) => ({ ...current, orderNo: e.target.value }))} /></Field>
                            <Field label={t('production.create.orderType')}>
                              <OpsSelect value={order.orderType} onValueChange={(value) => updateOrder(order.localId, (current) => ({ ...current, orderType: value as ProductionOrderDraft['orderType'] }))}>
  {orderTypes.map((value) => <OpsSelectItem key={value} value={value}>{orderTypeLabel(value)}</OpsSelectItem>)}
</OpsSelect>
                            </Field>
                            <Field label={t('production.create.producedStockCode')}><OpsInput value={order.producedStockCode} onChange={(e) => updateOrder(order.localId, (current) => ({ ...current, producedStockCode: e.target.value }))} /></Field>
                            <Field label={t('production.create.producedStockCode')}>
                              <PagedLookupDialog<StockLookup>
                                variant="ops"
                                open={activeLookupKey === `advanced-order-stock-${order.localId}`}
                                onOpenChange={(open) => setActiveLookupKey(open ? `advanced-order-stock-${order.localId}` : null)}
                                title={t('production.create.producedStockCode')}
                                description={order.orderNo || t('production.create.orderPlaceholder')}
                                value={getLookupLabel(`advanced-order-stock-${order.localId}`, order.producedStockCode)}
                                placeholder={t('production.create.productSelect', { defaultValue: 'Missing translation' })}
                                searchPlaceholder={t('production.create.productSearch', { defaultValue: 'Missing translation' })}
                                emptyText={t('production.create.productEmpty', { defaultValue: 'Missing translation' })}
                                queryKey={['production-create', 'advanced-order-stock', order.localId]}
                                fetchPage={({ pageNumber, pageSize, search, signal }) =>
                                  lookupApi.getProductsPaged({ pageNumber, pageSize, search }, { signal })
                                }
                                getKey={(item) => item.id.toString()}
                                getLabel={(item) => `${item.stokKodu} - ${item.stokAdi}`}
                                onSelect={(item) => {
                                  updateOrder(order.localId, (current) => ({
                                    ...current,
                                    producedStockId: item.id,
                                    producedStockCode: item.stokKodu,
                                    producedYapKod: current.producedStockId === item.id ? current.producedYapKod : '',
                                  }));
                                  if (order.producedStockId !== item.id) {
                                    setLookupLabel(`advanced-order-yapkod-${order.localId}`, '');
                                  }
                                  setLookupLabel(`advanced-order-stock-${order.localId}`, `${item.stokKodu} - ${item.stokAdi}`);
                                }}
                              />
                            </Field>
                            <Field label={t('production.create.producedYapKod')}>
                              <PagedLookupDialog<YapKodLookup>
                                variant="ops"
                                open={activeLookupKey === `advanced-order-yapkod-${order.localId}`}
                                onOpenChange={(open) => setActiveLookupKey(open ? `advanced-order-yapkod-${order.localId}` : null)}
                                title={t('production.create.producedYapKod')}
                                description={order.producedStockCode || t('production.create.producedStockCode')}
                                value={getLookupLabel(`advanced-order-yapkod-${order.localId}`, order.producedYapKod)}
                                placeholder={t('production.create.yapKodSelect', { defaultValue: 'Missing translation' })}
                                searchPlaceholder={t('production.create.yapKodSearch', { defaultValue: 'Missing translation' })}
                                emptyText={t('production.create.yapKodEmpty', { defaultValue: 'Missing translation' })}
                                disabled={!order.producedStockId}
                                queryKey={['production-create', 'advanced-order-yapkod', order.localId, order.producedStockId ?? 'none']}
                                fetchPage={({ pageNumber, pageSize, search, signal }) =>
                                  lookupApi.getYapKodlarPaged({ pageNumber, pageSize, search }, { stockId: order.producedStockId ?? undefined }, { signal })
                                }
                                getKey={(item) => item.id.toString()}
                                getLabel={(item) => `${item.yapKod}${item.yapAcik ? ` - ${item.yapAcik}` : ''}`}
                                onSelect={(item) => {
                                  updateOrder(order.localId, (current) => ({ ...current, producedYapKod: item.yapKod }));
                                  setLookupLabel(`advanced-order-yapkod-${order.localId}`, `${item.yapKod}${item.yapAcik ? ` - ${item.yapAcik}` : ''}`);
                                }}
                              />
                            </Field>
                            <Field label={t('production.create.plannedQuantity')}><OpsInput type="number" min="0" step="0.001" value={order.plannedQuantity} onChange={(e) => updateOrder(order.localId, (current) => ({ ...current, plannedQuantity: Number(e.target.value) || 0 }))} /></Field>
                            <Field label={t('production.create.sourceWarehouse')}>
                              <PagedLookupDialog<WarehouseLookup>
                                variant="ops"
                                open={activeLookupKey === `advanced-order-source-warehouse-${order.localId}`}
                                onOpenChange={(open) => setActiveLookupKey(open ? `advanced-order-source-warehouse-${order.localId}` : null)}
                                title={t('production.create.sourceWarehouse')}
                                description={order.orderNo || t('production.create.orderPlaceholder')}
                                value={getLookupLabel(`advanced-order-source-warehouse-${order.localId}`, order.sourceWarehouseCode)}
                                placeholder={t('production.create.sourceWarehouseSelect', { defaultValue: 'Missing translation' })}
                                searchPlaceholder={t('production.create.warehouseSearch', { defaultValue: 'Missing translation' })}
                                emptyText={t('production.create.warehouseEmpty', { defaultValue: 'Missing translation' })}
                                queryKey={['production-create', 'advanced-order-source-warehouse', order.localId]}
                                fetchPage={({ pageNumber, pageSize, search, signal }) =>
                                  lookupApi.getWarehousesPaged({ pageNumber, pageSize, search }, undefined, { signal })
                                }
                                getKey={(item) => item.id.toString()}
                                getLabel={(item) => `${item.depoKodu} - ${item.depoIsmi}`}
                                onSelect={(item) => {
                                  updateOrder(order.localId, (current) => ({ ...current, sourceWarehouseCode: String(item.depoKodu) }));
                                  setLookupLabel(`advanced-order-source-warehouse-${order.localId}`, `${item.depoKodu} - ${item.depoIsmi}`);
                                }}
                              />
                            </Field>
                            <Field label={t('production.create.targetWarehouse')}>
                              <PagedLookupDialog<WarehouseLookup>
                                variant="ops"
                                open={activeLookupKey === `advanced-order-target-warehouse-${order.localId}`}
                                onOpenChange={(open) => setActiveLookupKey(open ? `advanced-order-target-warehouse-${order.localId}` : null)}
                                title={t('production.create.targetWarehouse')}
                                description={order.orderNo || t('production.create.orderPlaceholder')}
                                value={getLookupLabel(`advanced-order-target-warehouse-${order.localId}`, order.targetWarehouseCode)}
                                placeholder={t('production.create.targetWarehouseSelect', { defaultValue: 'Missing translation' })}
                                searchPlaceholder={t('production.create.warehouseSearch', { defaultValue: 'Missing translation' })}
                                emptyText={t('production.create.warehouseEmpty', { defaultValue: 'Missing translation' })}
                                queryKey={['production-create', 'advanced-order-target-warehouse', order.localId]}
                                fetchPage={({ pageNumber, pageSize, search, signal }) =>
                                  lookupApi.getWarehousesPaged({ pageNumber, pageSize, search }, undefined, { signal })
                                }
                                getKey={(item) => item.id.toString()}
                                getLabel={(item) => `${item.depoKodu} - ${item.depoIsmi}`}
                                onSelect={(item) => {
                                  updateOrder(order.localId, (current) => ({ ...current, targetWarehouseCode: String(item.depoKodu) }));
                                  setLookupLabel(`advanced-order-target-warehouse-${order.localId}`, `${item.depoKodu} - ${item.depoIsmi}`);
                                }}
                              />
                            </Field>
                            <Field label={t('production.create.sequenceNo')}><OpsInput type="number" value={order.sequenceNo ?? ''} onChange={(e) => updateOrder(order.localId, (current) => ({ ...current, sequenceNo: e.target.value === '' ? undefined : Number(e.target.value) }))} /></Field>
                          </div>
                          <div className="grid gap-3 md:grid-cols-3">
                            <ProductionOpsCircuitToggleField
                              checked={order.canStartManually}
                              onCheckedChange={(checked) => updateOrder(order.localId, (current) => ({ ...current, canStartManually: checked }))}
                              title={t('production.create.canStartManually')}
                              description={t('production.create.canStartManuallyHint')}
                            />
                            <ProductionOpsCircuitToggleField
                              checked={order.autoStartWhenDependenciesDone}
                              onCheckedChange={(checked) => updateOrder(order.localId, (current) => ({ ...current, autoStartWhenDependenciesDone: checked }))}
                              title={t('production.create.autoStart')}
                              description={t('production.create.autoStartHint')}
                            />
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

              <div className="grid min-w-0 gap-4 xl:grid-cols-2">
                <Card className="min-w-0 gap-4 py-4">
                  <CardHeader>
                    <SectionHeader
                      title={t('production.create.outputs.title')}
                      description={t('production.create.outputs.subtitle')}
                      action={<Button type="button" size="sm" variant="outline" onClick={() => setDraft((prev) => ({ ...prev, outputs: [...prev.outputs, createEmptyOutputDraft(orderOptions[0]?.value ?? '')] }))}>{t('production.create.addOutput')}</Button>}
                    />
                  </CardHeader>
                  <CardContent className="wms-ops-production-line-table-wrap">
                    <ProductionPlanLineGrid variant="output">
                      <ProductionPlanLineGridHeader>
                        <ProductionPlanLineGridHead>{t('production.create.columns.order')}</ProductionPlanLineGridHead>
                        <ProductionPlanLineGridHead>{t('production.create.columns.stock')}</ProductionPlanLineGridHead>
                        <ProductionPlanLineGridHead>{t('production.create.yapKod', { defaultValue: 'Missing translation' })}</ProductionPlanLineGridHead>
                        <ProductionPlanLineGridHead>{t('production.create.columns.quantity')}</ProductionPlanLineGridHead>
                        <ProductionPlanLineGridHead>{t('production.create.trackingMode')}</ProductionPlanLineGridHead>
                        <ProductionPlanLineGridHead className="wms-ops-production-line-grid__head--actions">{t('common.actions')}</ProductionPlanLineGridHead>
                      </ProductionPlanLineGridHeader>
                      <ProductionPlanLinePaginatedBody
                        items={draft.outputs}
                        getRowKey={(row) => row.localId}
                        renderRow={(row) => (
                          <ProductionPlanLineGridRow key={row.localId}>
                            <ProductionPlanLineGridCell>
                              <Combobox
                              variant="ops" options={orderComboboxOptions} value={row.orderLocalId} onValueChange={(value) => updateOutput(row.localId, (current) => ({ ...current, orderLocalId: value }))} placeholder={t('production.create.selectOrderPlaceholder')} />
                            </ProductionPlanLineGridCell>
                            <ProductionPlanLineGridCell>
                              <PagedLookupDialog<StockLookup>
                                variant="ops"
                                open={activeLookupKey === `advanced-output-stock-${row.localId}`}
                                onOpenChange={(open) => setActiveLookupKey(open ? `advanced-output-stock-${row.localId}` : null)}
                                title={t('production.create.columns.stock')}
                                description={t('production.create.outputs.title')}
                                value={getLookupLabel(`advanced-output-stock-${row.localId}`, row.stockCode)}
                                placeholder={t('production.create.productSelect', { defaultValue: 'Missing translation' })}
                                searchPlaceholder={t('production.create.productSearch', { defaultValue: 'Missing translation' })}
                                emptyText={t('production.create.productEmpty', { defaultValue: 'Missing translation' })}
                                queryKey={['production-create', 'advanced-output-stock', row.localId]}
                                fetchPage={({ pageNumber, pageSize, search, signal }) =>
                                  lookupApi.getProductsPaged({ pageNumber, pageSize, search }, { signal })
                                }
                                getKey={(item) => item.id.toString()}
                                getLabel={(item) => `${item.stokKodu} - ${item.stokAdi}`}
                                onSelect={(item) => {
                                  updateOutput(row.localId, (current) => ({
                                    ...current,
                                    stockId: item.id,
                                    stockCode: item.stokKodu,
                                    yapKod: current.stockId === item.id ? current.yapKod : '',
                                  }));
                                  if (row.stockId !== item.id) {
                                    setLookupLabel(`advanced-output-yapkod-${row.localId}`, '');
                                  }
                                  setLookupLabel(`advanced-output-stock-${row.localId}`, `${item.stokKodu} - ${item.stokAdi}`);
                                }}
                              />
                            </ProductionPlanLineGridCell>
                            <ProductionPlanLineGridCell>
                              <PagedLookupDialog<YapKodLookup>
                                variant="ops"
                                open={activeLookupKey === `advanced-output-yapkod-${row.localId}`}
                                onOpenChange={(open) => setActiveLookupKey(open ? `advanced-output-yapkod-${row.localId}` : null)}
                                title={t('production.create.yapKodSelect', { defaultValue: 'Missing translation' })}
                                description={row.stockCode || t('production.create.columns.stock')}
                                value={getLookupLabel(`advanced-output-yapkod-${row.localId}`, row.yapKod)}
                                placeholder={t('production.create.yapKodSelect', { defaultValue: 'Missing translation' })}
                                searchPlaceholder={t('production.create.yapKodSearch', { defaultValue: 'Missing translation' })}
                                emptyText={t('production.create.yapKodEmpty', { defaultValue: 'Missing translation' })}
                                disabled={!row.stockId}
                                queryKey={['production-create', 'advanced-output-yapkod', row.localId, row.stockId ?? 'none']}
                                fetchPage={({ pageNumber, pageSize, search, signal }) =>
                                  lookupApi.getYapKodlarPaged({ pageNumber, pageSize, search }, { stockId: row.stockId ?? undefined }, { signal })
                                }
                                getKey={(item) => item.id.toString()}
                                getLabel={(item) => `${item.yapKod}${item.yapAcik ? ` - ${item.yapAcik}` : ''}`}
                                onSelect={(item) => {
                                  updateOutput(row.localId, (current) => ({ ...current, yapKod: item.yapKod }));
                                  setLookupLabel(`advanced-output-yapkod-${row.localId}`, `${item.yapKod}${item.yapAcik ? ` - ${item.yapAcik}` : ''}`);
                                }}
                              />
                            </ProductionPlanLineGridCell>
                            <ProductionPlanLineGridCell>
                              <OpsInput className="wms-ops-production-qty-input" type="number" min="0" step="0.001" value={row.plannedQuantity} onChange={(e) => updateOutput(row.localId, (current) => ({ ...current, plannedQuantity: Number(e.target.value) || 0 }))} />
                            </ProductionPlanLineGridCell>
                            <ProductionPlanLineGridCell>
                              <OpsSelect value={row.trackingMode} onValueChange={(value) => updateOutput(row.localId, (current) => ({ ...current, trackingMode: value as ProductionOutputDraft['trackingMode'] }))}>
  {trackingModes.map((value) => <OpsSelectItem key={value} value={value}>{trackingModeLabel(value)}</OpsSelectItem>)}
</OpsSelect>
                            </ProductionPlanLineGridCell>
                            <ProductionPlanLineGridCell className="wms-ops-production-line-grid__cell--actions">
                              <ProductionOpsDeleteButton label={t('common.delete')} onClick={() => removeOutput(row.localId)} />
                            </ProductionPlanLineGridCell>
                          </ProductionPlanLineGridRow>
                        )}
                      />
                    </ProductionPlanLineGrid>
                  </CardContent>
                </Card>

                <Card className="min-w-0 gap-4 py-4">
                  <CardHeader>
                    <SectionHeader
                      title={t('production.create.consumptions.title')}
                      description={t('production.create.consumptions.subtitle')}
                      action={<Button type="button" size="sm" variant="outline" onClick={() => setDraft((prev) => ({ ...prev, consumptions: [...prev.consumptions, createEmptyConsumptionDraft(orderOptions[0]?.value ?? '')] }))}>{t('production.create.addConsumption')}</Button>}
                    />
                  </CardHeader>
                  <CardContent className="wms-ops-production-line-table-wrap">
                    <ProductionPlanLineGrid variant="consumption">
                      <ProductionPlanLineGridHeader>
                        <ProductionPlanLineGridHead>{t('production.create.columns.order')}</ProductionPlanLineGridHead>
                        <ProductionPlanLineGridHead>{t('production.create.sourceStock')}</ProductionPlanLineGridHead>
                        <ProductionPlanLineGridHead>{t('production.create.yapKod', { defaultValue: 'Missing translation' })}</ProductionPlanLineGridHead>
                        <ProductionPlanLineGridHead>{t('production.create.columns.quantity')}</ProductionPlanLineGridHead>
                        <ProductionPlanLineGridHead>{t('production.create.serialEntryMode')}</ProductionPlanLineGridHead>
                        <ProductionPlanLineGridHead className="wms-ops-production-line-grid__head--actions">{t('common.actions')}</ProductionPlanLineGridHead>
                      </ProductionPlanLineGridHeader>
                      <ProductionPlanLinePaginatedBody
                        items={draft.consumptions}
                        getRowKey={(row) => row.localId}
                        renderRow={(row) => (
                          <ProductionPlanLineGridRow key={row.localId}>
                            <ProductionPlanLineGridCell>
                              <Combobox
                              variant="ops" options={orderComboboxOptions} value={row.orderLocalId} onValueChange={(value) => updateConsumption(row.localId, (current) => ({ ...current, orderLocalId: value }))} placeholder={t('production.create.selectOrderPlaceholder')} />
                            </ProductionPlanLineGridCell>
                            <ProductionPlanLineGridCell>
                              <PagedLookupDialog<StockLookup>
                                variant="ops"
                                open={activeLookupKey === `advanced-consumption-stock-${row.localId}`}
                                onOpenChange={(open) => setActiveLookupKey(open ? `advanced-consumption-stock-${row.localId}` : null)}
                                title={t('production.create.sourceStock')}
                                description={t('production.create.consumptions.title')}
                                value={getLookupLabel(`advanced-consumption-stock-${row.localId}`, row.stockCode)}
                                placeholder={t('production.create.sourceStockSelect', { defaultValue: 'Missing translation' })}
                                searchPlaceholder={t('production.create.productSearch', { defaultValue: 'Missing translation' })}
                                emptyText={t('production.create.productEmpty', { defaultValue: 'Missing translation' })}
                                queryKey={['production-create', 'advanced-consumption-stock', row.localId]}
                                fetchPage={({ pageNumber, pageSize, search, signal }) =>
                                  lookupApi.getProductsPaged({ pageNumber, pageSize, search }, { signal })
                                }
                                getKey={(item) => item.id.toString()}
                                getLabel={(item) => `${item.stokKodu} - ${item.stokAdi}`}
                                onSelect={(item) => {
                                  updateConsumption(row.localId, (current) => ({
                                    ...current,
                                    stockId: item.id,
                                    stockCode: item.stokKodu,
                                    yapKod: current.stockId === item.id ? current.yapKod : '',
                                  }));
                                  if (row.stockId !== item.id) {
                                    setLookupLabel(`advanced-consumption-yapkod-${row.localId}`, '');
                                  }
                                  setLookupLabel(`advanced-consumption-stock-${row.localId}`, `${item.stokKodu} - ${item.stokAdi}`);
                                }}
                              />
                            </ProductionPlanLineGridCell>
                            <ProductionPlanLineGridCell>
                              <PagedLookupDialog<YapKodLookup>
                                variant="ops"
                                open={activeLookupKey === `advanced-consumption-yapkod-${row.localId}`}
                                onOpenChange={(open) => setActiveLookupKey(open ? `advanced-consumption-yapkod-${row.localId}` : null)}
                                title={t('production.create.yapKodSelect', { defaultValue: 'Missing translation' })}
                                description={row.stockCode || t('production.create.sourceStock')}
                                value={getLookupLabel(`advanced-consumption-yapkod-${row.localId}`, row.yapKod)}
                                placeholder={t('production.create.yapKodSelect', { defaultValue: 'Missing translation' })}
                                searchPlaceholder={t('production.create.yapKodSearch', { defaultValue: 'Missing translation' })}
                                emptyText={t('production.create.yapKodEmpty', { defaultValue: 'Missing translation' })}
                                disabled={!row.stockId}
                                queryKey={['production-create', 'advanced-consumption-yapkod', row.localId, row.stockId ?? 'none']}
                                fetchPage={({ pageNumber, pageSize, search, signal }) =>
                                  lookupApi.getYapKodlarPaged({ pageNumber, pageSize, search }, { stockId: row.stockId ?? undefined }, { signal })
                                }
                                getKey={(item) => item.id.toString()}
                                getLabel={(item) => `${item.yapKod}${item.yapAcik ? ` - ${item.yapAcik}` : ''}`}
                                onSelect={(item) => {
                                  updateConsumption(row.localId, (current) => ({ ...current, yapKod: item.yapKod }));
                                  setLookupLabel(`advanced-consumption-yapkod-${row.localId}`, `${item.yapKod}${item.yapAcik ? ` - ${item.yapAcik}` : ''}`);
                                }}
                              />
                            </ProductionPlanLineGridCell>
                            <ProductionPlanLineGridCell>
                              <OpsInput className="wms-ops-production-qty-input" type="number" min="0" step="0.001" value={row.plannedQuantity} onChange={(e) => updateConsumption(row.localId, (current) => ({ ...current, plannedQuantity: Number(e.target.value) || 0 }))} />
                            </ProductionPlanLineGridCell>
                            <ProductionPlanLineGridCell>
                              <OpsSelect value={row.serialEntryMode} onValueChange={(value) => updateConsumption(row.localId, (current) => ({ ...current, serialEntryMode: value as ProductionConsumptionDraft['serialEntryMode'] }))}>
  {serialModes.map((value) => <OpsSelectItem key={value} value={value}>{serialModeLabel(value)}</OpsSelectItem>)}
</OpsSelect>
                            </ProductionPlanLineGridCell>
                            <ProductionPlanLineGridCell className="wms-ops-production-line-grid__cell--actions">
                              <ProductionOpsDeleteButton label={t('common.delete')} onClick={() => removeConsumption(row.localId)} />
                            </ProductionPlanLineGridCell>
                          </ProductionPlanLineGridRow>
                        )}
                      />
                    </ProductionPlanLineGrid>
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
                    <div className="wms-ops-production-empty">
                      {t('production.create.dependencies.empty')}
                    </div>
                  ) : draft.dependencies.map((dependency) => (
                    <div key={dependency.localId} className="wms-ops-production-panel grid gap-2 p-3 md:grid-cols-[1.2fr_1fr_1.2fr_0.8fr_auto]">
                      <Combobox variant="ops" options={orderComboboxOptions} value={dependency.predecessorOrderLocalId} onValueChange={(value) => updateDependency(dependency.localId, (current) => ({ ...current, predecessorOrderLocalId: value }))} placeholder={t('production.create.predecessor')} />
                      <OpsSelect value={dependency.dependencyType} onValueChange={(value) => updateDependency(dependency.localId, (current) => ({ ...current, dependencyType: value as ProductionDependencyDraft['dependencyType'] }))}>
  {dependencyTypes.map((value) => <OpsSelectItem key={value} value={value}>{dependencyTypeLabel(value)}</OpsSelectItem>)}
</OpsSelect>
                      <Combobox variant="ops" options={orderComboboxOptions} value={dependency.successorOrderLocalId} onValueChange={(value) => updateDependency(dependency.localId, (current) => ({ ...current, successorOrderLocalId: value }))} placeholder={t('production.create.successor')} />
                      <OpsInput type="number" value={dependency.lagMinutes} onChange={(e) => updateDependency(dependency.localId, (current) => ({ ...current, lagMinutes: Number(e.target.value) || 0 }))} placeholder={t('production.create.lagMinutes')} />
                      <Button type="button" size="sm" variant="ghost" onClick={() => removeDependency(dependency.localId)}>{t('common.delete')}</Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      ) : null}
    </OpsFormPageShell>
  );
}
