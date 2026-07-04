import type { RouteObject } from 'react-router-dom';
import { PurchaseApprovalRulesPage, PurchaseCreatePage, PurchaseDefinitionPage, PurchaseListPage } from '@/features/purchase';
import { withRoute } from '../route-utils';

export const purchaseChildRoutes: RouteObject[] = [
  {
    path: 'purchase',
    children: [
      { path: 'requests', Component: withRoute(() => <PurchaseListPage kind="request" />, { routeName: 'purchase-requests', namespaces: ['common'] }) },
      { path: 'requests/create', Component: withRoute(() => <PurchaseCreatePage kind="request" />, { routeName: 'purchase-request-create', namespaces: ['common'] }) },
      { path: 'requests/:id/edit', Component: withRoute(() => <PurchaseCreatePage kind="request" />, { routeName: 'purchase-request-edit', namespaces: ['common'] }) },
      { path: 'rfqs', Component: withRoute(() => <PurchaseListPage kind="rfq" />, { routeName: 'purchase-rfqs', namespaces: ['common'] }) },
      { path: 'rfqs/create', Component: withRoute(() => <PurchaseCreatePage kind="rfq" />, { routeName: 'purchase-rfq-create', namespaces: ['common'] }) },
      { path: 'rfqs/:id/edit', Component: withRoute(() => <PurchaseCreatePage kind="rfq" />, { routeName: 'purchase-rfq-edit', namespaces: ['common'] }) },
      { path: 'supplier-quotations', Component: withRoute(() => <PurchaseListPage kind="quotation" />, { routeName: 'purchase-supplier-quotations', namespaces: ['common'] }) },
      { path: 'supplier-quotations/create', Component: withRoute(() => <PurchaseCreatePage kind="quotation" />, { routeName: 'purchase-supplier-quotation-create', namespaces: ['common'] }) },
      { path: 'supplier-quotations/:id/edit', Component: withRoute(() => <PurchaseCreatePage kind="quotation" />, { routeName: 'purchase-supplier-quotation-edit', namespaces: ['common'] }) },
      { path: 'orders', Component: withRoute(() => <PurchaseListPage kind="order" />, { routeName: 'purchase-orders', namespaces: ['common'] }) },
      { path: 'orders/create', Component: withRoute(() => <PurchaseCreatePage kind="order" />, { routeName: 'purchase-order-create', namespaces: ['common'] }) },
      { path: 'orders/:id/edit', Component: withRoute(() => <PurchaseCreatePage kind="order" />, { routeName: 'purchase-order-edit', namespaces: ['common'] }) },
      { path: 'definitions/payment-types', Component: withRoute(() => <PurchaseDefinitionPage category="PaymentType" />, { routeName: 'purchase-payment-type-definitions', namespaces: ['common'] }) },
      { path: 'definitions/purchase-types', Component: withRoute(() => <PurchaseDefinitionPage category="PurchaseType" />, { routeName: 'purchase-type-definitions', namespaces: ['common'] }) },
      { path: 'definitions/delivery-types', Component: withRoute(() => <PurchaseDefinitionPage category="DeliveryType" />, { routeName: 'purchase-delivery-type-definitions', namespaces: ['common'] }) },
      { path: 'approval-rules', Component: withRoute(() => <PurchaseApprovalRulesPage />, { routeName: 'purchase-approval-rules', namespaces: ['common'] }) },
    ],
  },
];
