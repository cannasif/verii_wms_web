# WMS Web Architecture Playbook

Bu dosya `verii_wms_web` projesi için ana mimari kontrattır. Projede çalışan geliştirici veya AI agent, yeni geliştirme/refactor öncesinde bu dokümanı referans almalıdır. Amaç WMS Web'in CRM benzeri feature-first yapısını korumak, modülleri birbirine dolaştırmamak ve uzun vadede sürdürülebilir bir frontend mimarisi sağlamaktır.

Bu doküman şu sorulara cevap verir:

- Yeni ekran/modül nereye eklenir?
- Route, menu, permission, localization hangi sırayla bağlanır?
- Hangi kod feature içinde kalır, hangisi shared'e taşınır?
- API, hook, type, component standardı nedir?
- AI agent hangi sınırları aşmamalıdır?
- Senior-grade kabul kriterleri nelerdir?

## 1. Mimari Kuzey Yıldızı

WMS Web feature-first, route-composed, permission-aware ve localization-ready bir React uygulamasıdır.

Ana ilke:

```txt
Feature dışına açılan her şey public API'den geçer.
Ortak olan shared'e gider.
Domain'e özel olan feature içinde kalır.
Route feature iç klasörlerini bilmez.
Permission sadece menüyü değil ekran içi aksiyonları da yönetir.
```

Bu proje teknik türlere göre değil, iş domain'lerine göre organize edilir. Yani "bütün componentler tek yerde, bütün servisler tek yerde" modeli kullanılmaz.

Yanlış zihinsel model:

```txt
src/components/all-domain-components
src/services/all-api-calls
src/types/all-dtos
```

Doğru zihinsel model:

```txt
src/features/shipment
src/features/transfer
src/features/package
src/features/goods-receipt
src/features/shared
```

## 2. Ana Klasör Sözleşmesi

Gerçek proje yapısı aşağıdaki katmanlara göre okunmalıdır:

```txt
src/
  components/
    shared/                  # App shell, navbar, data grid, route guard gibi uygulama geneli UI
    ui/                      # shadcn/design-system atomları
  config/                    # Statik config kaynakları
  features/
    <feature-name>/          # Domain/operasyon feature'ları
    shared/                  # Feature'lar arası operasyonel ortak parçalar
  hooks/                     # Feature bağımsız genel React hook'ları
  layouts/                   # Layout seviyesinde genel bileşenler
  lib/                       # Axios, query client, i18n, runtime config, utility altyapısı
  locales/                   # Global/common localization JSON kaynakları
  routes/                    # Route composition ve lazy route mapping
  stores/                    # Zustand global store'ları
  types/                     # Uygulama geneli base sözleşmeler
  utils/                     # Feature bağımsız yardımcılar
```

Klasörlerin sorumlulukları karıştırılmamalıdır:

- `components/ui`: İş kuralı içermez. Button, Input, Dialog gibi atomik UI.
- `components/shared`: App shell ve tüm uygulama tarafından kullanılan UI davranışları.
- `features/<name>`: İş domain'i ve ekran davranışı.
- `features/shared`: Birden fazla feature'ın operasyonel ortak kullandığı component/API/type.
- `lib`: Framework/altyapı konfigürasyonu.
- `stores`: Uygulama geneli UI/auth/permission state.
- `types`: Feature bağımsız base model ve API wrapper sözleşmeleri.

## 3. Feature Klasör Standardı

Her feature için hedef yapı:

```txt
src/features/<feature-name>/
  api/                       # Endpoint client'ları, request mapper'ları
  components/                # Sayfalar, dialoglar, feature-specific UI
  hooks/                     # React Query hook'ları, feature-specific hook'lar
  localization/              # Feature namespace translation kaynakları
  schemas/                   # Zod schema veya form validation schema
  types/                     # DTO, view model, form model, enum/type
  utils/                     # Feature-specific pure helper'lar
  index.ts                   # Public API
```

Küçük feature'larda bazı klasörler olmayabilir. Ancak feature büyüdüğünde bu sözleşmeye yaklaşmalıdır.

Örnek:

```txt
src/features/package/
  api/package-api.ts
  components/PackageListPage.tsx
  components/PackageCreatePage.tsx
  components/PackagingSettingsPage.tsx
  hooks/usePackageQueries.ts
  localization/tr.json
  localization/en.json
  types/package.types.ts
  utils/package-status.ts
  index.tsx
```

## 4. Public API ve Boundary Kuralı

Feature dışından kullanılan her şey feature `index.ts` veya `index.tsx` üzerinden export edilmelidir.

Doğru:

```ts
// src/features/shipment/index.tsx
export { ShipmentListPage } from './components/ShipmentListPage';
export { ShipmentCreatePage } from './components/ShipmentCreatePage';
export type { ShipmentHeaderDto } from './types/shipment.types';
```

Tüketim:

```ts
import { ShipmentListPage } from '@/features/shipment';
import type { ShipmentHeaderDto } from '@/features/shipment';
```

Yanlış:

```ts
import { ShipmentListPage } from '@/features/shipment/components/ShipmentListPage';
import type { ShipmentHeaderDto } from '@/features/shipment/types/shipment.types';
```

Aynı feature içindeki dosyalar relative import kullanabilir:

```ts
import { ShipmentDetailDialog } from './ShipmentDetailDialog';
import type { ShipmentHeaderDto } from '../types/shipment.types';
```

Public API kuralı neden önemli:

- Dosya taşımaları route ve başka feature'ları kırmaz.
- Feature iç yapısı gizli kalır.
- AI agent yanlış dosya bağımlılığı kurmaz.
- CRM parity yapısına yaklaşılır.

## 5. Route Sözleşmesi

Route dosyaları feature iç klasörlerine girmemelidir.

Doğru:

```ts
const TransferListPage = lazyNamed(() => import('@/features/transfer'), 'TransferListPage');
```

Yanlış:

```ts
const TransferListPage = lazyNamed(
  () => import('@/features/transfer/components/TransferListPage'),
  'TransferListPage',
);
```

Route ekleme sırası:

1. Feature page component oluştur.
2. Feature `index` dosyasından export et.
3. `src/routes/modules/*` içinde `lazyNamed(() => import('@/features/<feature>'), '<ExportName>')` kullan.
4. `withRoute` ile route metadata ver.
5. Gerekirse namespace ekle.
6. `src/components/shared/nav-items.tsx` içinde menüyü ekle.
7. `src/features/access-control/utils/permission-config.ts` içinde route permission ekle.
8. Ekran içi action gating ekle.
9. `npm run build` çalıştır.

Route örneği:

```ts
const YardOperationListPage = lazyNamed(
  () => import('@/features/yard-operation'),
  'YardOperationListPage',
);

{
  path: 'yard-operation/list',
  element: withRoute(YardOperationListPage, {
    routeName: 'yard-operation-list',
    namespaces: ['yard-operation', 'common'],
  }),
}
```

## 6. Menu ve Permission Sözleşmesi

WMS Web'de permission üç katmanda düşünülür:

1. Menü görünürlüğü
2. Route erişimi
3. Ekran içi action-level gating

Menu kaynağı:

```txt
src/components/shared/nav-items.tsx
```

Permission mapping:

```txt
src/features/access-control/utils/permission-config.ts
```

Route guard ve filter:

```txt
src/features/access-control/components/RoutePermissionGuard.tsx
src/features/access-control/utils/filterNavItems.ts
src/components/shared/main-layout/useResolvedNavItems.ts
```

Yeni ekran eklerken sadece route eklemek yeterli değildir. Menu ve permission birlikte tamamlanmalıdır.

Permission kod standardı:

```txt
wms.<module>.view
wms.<module>.create
wms.<module>.update
wms.<module>.delete
wms.<module>.approve
```

Alt domain varsa:

```txt
wms.warehouse.inbound.view
wms.warehouse.outbound.create
wms.subcontracting.issue.update
```

Action gating örneği:

```ts
const permission = useCrudPermission('wms.shipment');

if (!permission.canView) {
  return <PermissionNotice />;
}
```

```tsx
<Button disabled={!permission.canDelete}>
  {t('common.delete')}
</Button>
```

Kritik kural: UI permission güvenlik değildir. Backend enforcement yoksa action gerçekten güvenli değildir. UI sadece kullanıcı deneyimi katmanıdır.

## 7. Shared Feature Sözleşmesi

`src/features/shared` domain feature değildir. Birden fazla feature tarafından kullanılan operasyonel ortak parçalar için kullanılır.

Mevcut örnekler:

```txt
src/features/shared/api/lookup-api.ts
src/features/shared/api/barcode-api.ts
src/features/shared/components/SearchableSelect.tsx
src/features/shared/components/ProcessStockSelection.tsx
src/features/shared/collection/BarcodeCandidatePicker.tsx
src/features/shared/types/operation-reference.types.ts
src/features/shared/index.ts
```

Shared'e taşınabilecek parçalar:

- Birden fazla feature'ın kullandığı select/lookup componentleri
- Barcode candidate picker
- Lookup API client
- Ortak operasyon referans tipleri
- Genel stock selection UI

Shared'e taşınmaması gereken parçalar:

- Tek feature'a ait business rule
- Tek feature'ın form step'i
- Tek feature'ın status mapper'ı
- Domain-specific action/approval logic

Doğru:

```ts
import { SearchableSelect } from '@/features/shared';
import type { Product, Warehouse } from '@/features/shared';
```

Yanlış:

```ts
import { SearchableSelect } from '@/features/goods-receipt/components/steps/components/SearchableSelect';
import type { Product } from '@/features/goods-receipt/types/goods-receipt';
```

Compatibility re-export gerekiyorsa geçici olarak bırakılabilir:

```ts
export { SearchableSelect } from '@/features/shared/components/SearchableSelect';
```

Yeni kod compatibility path'i kullanmamalıdır.

## 8. Type Sözleşmesi

Type konumlandırma kararı şu sırayla verilir:

1. Sadece bir feature mı kullanıyor? `src/features/<feature>/types`
2. Birden fazla operasyon feature mı kullanıyor? `src/features/shared/types`
3. Uygulama geneli base sözleşme mi? `src/types`

Örnekler:

```txt
src/features/package/types/package.types.ts       # Package-specific
src/features/shared/types/operation-reference.types.ts
src/types/document-models.ts                      # Base document contracts
src/types/api.ts                                  # ApiResponse/PagedResponse
```

Yanlış yaklaşım:

```ts
import type { Product } from '@/features/goods-receipt/types/goods-receipt';
```

Doğru yaklaşım:

```ts
import type { Product } from '@/features/shared';
```

## 9. API ve TanStack Query Sözleşmesi

API çağrısı component içine yazılmaz. Feature API client veya hook üzerinden gider.

Doğru:

```ts
// features/shipment/api/shipment-api.ts
export const shipmentApi = {
  getPaged(params: ShipmentPagedParams) {
    return axiosInstance.get('/shipment', { params });
  },
};
```

```ts
// features/shipment/hooks/useShipmentQueries.ts
export function useShipmentListQuery(params: ShipmentPagedParams) {
  return useQuery({
    queryKey: ['shipment', 'list', params],
    queryFn: () => shipmentApi.getPaged(params),
    staleTime: 30_000,
  });
}
```

Yanlış:

```ts
useEffect(() => {
  fetch('/shipment').then(...);
}, []);
```

Kurallar:

- Server state için TanStack Query kullan.
- Her query için anlamlı `queryKey` yaz.
- Her query için bilinçli `staleTime` ver.
- Mutation sonrası ilgili query invalidate edilmeli.
- Component sadece hook tüketmeli.
- Saf `axios` import edilmemeli; proje axios instance kullanılmalı.

## 10. State Management Sözleşmesi

State üçe ayrılır:

- Server state: TanStack Query
- Global UI/auth/permission state: Zustand
- Form state: React Hook Form + Zod

Mevcut store alanları:

```txt
src/stores/auth-store.ts
src/stores/ui-store.ts
src/stores/permissions-store.ts
src/stores/app-shell-store.ts
```

Yanlış kullanım:

- API response'u Zustand'a koymak
- Form alanlarını global store'da tutmak
- Cache davranışını elle component state ile yönetmek

Doğru kullanım:

- Liste/detail verisi TanStack Query
- Sidebar, branch, auth, permission gibi global durumlar Zustand
- Form inputları React Hook Form

## 11. Form ve Validation Sözleşmesi

Formlarda hedef standart:

- React Hook Form
- Zod schema
- Feature-specific schema `schemas/` veya `types/` altında
- Validation metinleri localization ile

Örnek:

```ts
export const createPackageFormSchema = (t: TFunction) =>
  z.object({
    documentNo: z.string().min(1, t('package.validation.documentNoRequired')),
  });
```

Kural:

- Hard-text validation mesajı yazma.
- Schema feature içinde dursun.
- Ortak schema ise shared veya `src/lib/zod-required.ts` benzeri altyapıya taşınabilir.

## 12. Localization Sözleşmesi

WMS Web çok dilli bir projedir. Hard-text kabul edilmez.

Global kaynak:

```txt
src/locales/<lang>/common.json
```

Feature kaynakları:

```txt
src/features/<feature>/localization/tr.json
src/features/<feature>/localization/en.json
src/features/<feature>/localization/de.json
src/features/<feature>/localization/fr.json
src/features/<feature>/localization/ar.json
src/features/<feature>/localization/es.json
src/features/<feature>/localization/it.json
```

Yeni büyük feature için feature localization tercih edilir. Küçük ve genel metinler common içinde kalabilir.

Route namespace örneği:

```ts
withRoute(PackageListPage, {
  routeName: 'package-list',
  namespaces: ['package', 'common'],
});
```

Hard-text audit checklist:

- Page title
- Button text
- Empty state
- Error text
- Validation text
- Status label
- Table column label
- Dialog title/action

## 13. Runtime Config ve Environment Sözleşmesi

Runtime config şu dosyalardan yönetilir:

```txt
public/config.json
src/lib/api-config.ts
```

Hard-code URL yapılmamalıdır. API URL ve realtime davranışı runtime config ile yönetilmelidir.

Örnek:

```json
{
  "apiUrl": "https://api.v3rii.com",
  "baseUrl": "/",
  "realtimeNotificationsEnabled": false
}
```

SignalR/realtime için kurallar:

- Token console'a düşmemeli.
- Proxy/WebSocket hazır değilse runtime flag ile kapatılabilmeli.
- Realtime hata verdiğinde ekran kırılmamalı.
- Notification servis degrade edebilmelidir.

## 14. UI ve Component Sözleşmesi

Projede shadcn tabanlı UI yaklaşımı kullanılır. Yeni component geliştirirken önce mevcut UI/shared componentler kontrol edilmelidir.

Öncelik sırası:

1. `components/ui`
2. `components/shared`
3. `features/shared`
4. Feature-specific component

Component kuralları:

- Props destructuring kullan.
- `any` kullanma.
- Explicit return type yaz.
- Karmaşık logic'i hook/helper'a çıkar.
- Component içinde doğrudan API çağrısı yapma.
- Gereksiz comment yazma; kod kendi kendini anlatmalı.
- İş kuralı içeren component `components/ui` altına konmaz.

Kabul edilebilir comment:

```ts
// Runtime config cache is an optimization only.
```

Kabul edilmeyen comment:

```ts
// Butona tıklayınca kaydeder.
```

## 15. Naming Sözleşmesi

Klasörler:

```txt
kebab-case
```

Örnek:

```txt
features/bilginoglu-hakedis
features/warehouse-3d
features/document-series-management
```

Component dosyaları:

```txt
PascalCase.tsx
```

Hook dosyaları:

```txt
useSomething.ts
```

Type dosyaları:

```txt
<feature>.types.ts
```

API dosyaları:

```txt
<feature>-api.ts veya <feature>.api.ts
```

## 16. Feature Taşıma ve Refactor Sözleşmesi

Bir feature yanlış yerdeyse ayrı root'a taşınır.

Örnek doğru taşıma:

```txt
src/features/inventory/3d-warehouse
```

yerine:

```txt
src/features/warehouse-3d
```

Refactor sırasında:

- Önce import taraması yap.
- Yeni feature index exportlarını ekle.
- Route importlarını public root'a çek.
- Eski path için gerekiyorsa compatibility re-export bırak.
- Build al.

Compatibility bridge kalıcı mimari değildir. Yeni kodlar bridge üzerinden yazılmamalıdır.

## 17. Yeni Feature Ekleme Şablonu

Örnek: `yard-operation`

```txt
src/features/yard-operation/
  api/yard-operation-api.ts
  components/YardOperationListPage.tsx
  components/YardOperationCreatePage.tsx
  components/YardOperationDetailDialog.tsx
  hooks/useYardOperationQueries.ts
  localization/tr.json
  localization/en.json
  localization/de.json
  localization/fr.json
  localization/ar.json
  localization/es.json
  localization/it.json
  schemas/yard-operation-schema.ts
  types/yard-operation.types.ts
  utils/yard-operation-status.ts
  index.ts
```

`index.ts`:

```ts
export { YardOperationListPage } from './components/YardOperationListPage';
export { YardOperationCreatePage } from './components/YardOperationCreatePage';
export type { YardOperationDto } from './types/yard-operation.types';
```

Route:

```ts
const YardOperationListPage = lazyNamed(
  () => import('@/features/yard-operation'),
  'YardOperationListPage',
);
```

Menu:

```ts
{
  title: 'sidebar.yardOperations',
  titleFallback: 'Saha Operasyonları',
  href: '/yard-operation/list',
}
```

Permission:

```ts
'/yard-operation/list': 'wms.yard-operation.view'
```

Hook:

```ts
export function useYardOperationListQuery(params: YardOperationPagedParams) {
  return useQuery({
    queryKey: ['yard-operation', 'list', params],
    queryFn: () => yardOperationApi.getPaged(params),
    staleTime: 30_000,
  });
}
```

## 18. Senior-Grade Kabul Kriterleri

Bir geliştirme senior-grade kabul edilmek için aşağıdakileri sağlamalıdır:

- Feature doğru klasörde mi?
- Public API export var mı?
- Route deep import yapmıyor mu?
- Menu ve permission mapping tamam mı?
- UI action gating var mı?
- Backend enforcement ihtiyacı not edildi mi?
- API çağrıları component içinde değil mi?
- TanStack Query hook'ları doğru queryKey/staleTime kullanıyor mu?
- Type'lar doğru yerde mi?
- Ortak component yanlış domain'den ödünç alınmıyor mu?
- Localization tamam mı?
- Runtime config hard-code edilmedi mi?
- Build geçiyor mu?
- Kırıcı taşıma varsa compatibility re-export düşünüldü mü?

## 19. AI Agent İçin Zorunlu Çalışma Sırası

AI agent şu sırayı izlemelidir:

1. Bu dosyayı oku: `docs/wms-web-architecture.md`
2. Eğer feature boundary değişiyorsa şunu da oku: `docs/wms-web-feature-architecture-guide.md`
3. `.cursor/rules/frontend-development-rules.mdc` içindeki kısa kuralları dikkate al.
4. İlgili feature `index` dosyasını incele.
5. Benzer feature örneklerini incele.
6. Değişiklik feature-specific mi shared mi karar ver.
7. Route/menu/permission/localization etkisini kontrol et.
8. Cross-feature deep import oluşturma.
9. Gerekiyorsa compatibility re-export bırak.
10. `npm run build` çalıştır.

Karar veremiyorsan şu soruyu sor:

```txt
Bu kod tek bir domain feature'a mı ait, yoksa birden fazla feature'ın ortak operasyonel ihtiyacı mı?
```

## 20. Mimari Kontrol Komutları

Route/component deep import kontrolü:

```bash
rg "import\\('@/features/.*/components/|import\\('@/features/.*/pages/" src/routes src/components -n
```

Eski goods-receipt ortak type bağımlılığı:

```bash
rg "@/features/goods-receipt/types/goods-receipt" src -n
```

Eski SearchableSelect path bağımlılığı:

```bash
rg "goods-receipt/components/steps/components/SearchableSelect" src -n
```

Feature root listesi:

```bash
find src/features -mindepth 1 -maxdepth 1 -type d | sort
```

Build:

```bash
npm run build
```

## 21. Mevcut Bilinen Mimari Durum

Bu doküman yazıldığı anda proje şu standarda çekilmiştir:

- `warehouse-3d` bağımsız feature root altındadır.
- `report` feature route'a bağlıdır.
- Route lazy importları public feature root üzerinden yapılır.
- `SearchableSelect` `features/shared` altındadır.
- `Product`, `Customer`, `Project`, `Warehouse` ortak operation reference type olarak `features/shared/types` altındadır.
- Eski path'ler için compatibility export bırakılmıştır.
- Runtime notification flag config üzerinden yönetilir.

## 22. Son Kural

Bu projede hızlı çözüm yerine sürdürülebilir çözüm tercih edilir. Bir şey çalışıyor diye doğru yerde olduğu varsayılmaz. Kodun doğru yerde olması, doğru boundary ile export edilmesi, permission/localization/build sürecinden geçmesi gerekir.

Kısa karar cümlesi:

```txt
Bir modülün içini başka modül bilmeyecek; herkes public API ve shared kontratlar üzerinden konuşacak.
```
