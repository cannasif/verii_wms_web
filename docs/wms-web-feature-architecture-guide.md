# WMS Web Feature Architecture Guide

> Ana mimari rehber: [WMS Web Architecture Playbook](./wms-web-architecture.md)
>
> Bu dosya feature boundary konusuna odaklanan tamamlayıcı rehberdir. Yeni geliştirme veya AI agent çalışması öncesinde önce ana playbook okunmalı, sonra gerekiyorsa bu dosyadaki feature detaylarına bakılmalıdır.

Bu doküman, `verii_wms_web` projesinde feature tabanlı mimarinin nasıl korunacağını anlatır. Amaç sadece klasörleri tarif etmek değildir; yeni geliştirme yapan bir geliştirici veya AI agent, bu rehberi okuyarak mevcut yapının dışına çıkmadan ilerleyebilmelidir.

Bu rehber özellikle şu işler için referans alınmalıdır:

- Yeni feature/modül ekleme
- Var olan feature içinde ekran, API client, hook veya type ekleme
- Ortak component/type/helper taşıma
- Route/menu/permission/localization entegrasyonu
- CRM parity seviyesinde public feature boundary koruma
- Refactor yaparken kırıcı deep import veya domain bağımlılığı oluşturmama

## Temel Prensip

WMS Web feature-first bir React uygulamasıdır. Domain veya operasyon modülleri `src/features/<feature-name>` altında yaşar. Feature dışından bir modülün iç dosyalarına doğrudan girmek yerine, mümkün olduğunca feature root `index.ts` veya `index.tsx` public API kullanılmalıdır.

Doğru yaklaşım:

```ts
const ShipmentListPage = lazyNamed(() => import('@/features/shipment'), 'ShipmentListPage');
import { SearchableSelect } from '@/features/shared';
import type { Product, Warehouse } from '@/features/shared';
```

Kaçınılması gereken yaklaşım:

```ts
const ShipmentListPage = lazyNamed(
  () => import('@/features/shipment/components/ShipmentListPage'),
  'ShipmentListPage',
);

import { SearchableSelect } from '@/features/goods-receipt/components/steps/components/SearchableSelect';
import type { Product } from '@/features/goods-receipt/types/goods-receipt';
```

Bu kuralın nedeni basittir: Bir feature'ın iç yapısı değişebilir, ama public API stabil kalmalıdır. AI agent veya geliştirici bir ekranı taşıdığında bütün projeyi kırmamalıdır.

## Ana Klasör Haritası

```txt
src/
  components/
    shared/              # Uygulama geneli layout, route guard, navbar, data grid gibi UI altyapıları
    ui/                  # Design-system seviyesinde atomik UI bileşenleri
  features/
    <feature-name>/      # Domain/operasyon bazlı feature alanları
    shared/              # Feature'lar arası operasyonel ortak API/component/type alanı
  hooks/                 # Feature bağımsız genel React hook'ları
  lib/                   # Runtime config, utility, API config gibi altyapı kodları
  locales/               # Global/common localization kaynakları
  routes/                # Route composition ve route-level lazy loading
  stores/                # Global state store'ları
  types/                 # Uygulama geneli base model/type sözleşmeleri
```

## Feature Klasör Standardı

Her domain feature için hedef yapı aşağıdaki gibidir:

```txt
src/features/<feature-name>/
  api/                   # API client, query param mapper, endpoint çağrıları
  components/            # Sayfalar, dialoglar, feature'a özel UI parçaları
  hooks/                 # React Query hook'ları veya feature-specific UI hook'ları
  localization/          # Feature bazlı i18n dosyaları varsa burada
  types/                 # DTO, form model, view model, enum/type sözleşmeleri
  utils/                 # Feature'a özel pure helper fonksiyonları
  index.ts               # Public API export noktası
```

Bu klasörlerin hepsi her feature'da zorunlu değildir. Küçük feature'larda sadece `components` ve `index.ts` yeterli olabilir. Ancak feature büyüdükçe aynı sözleşme korunmalıdır.

Örnek:

```txt
src/features/package/
  api/package-api.ts
  components/PackageListPage.tsx
  components/PackageCreatePage.tsx
  hooks/usePackageQueries.ts
  localization/tr.ts
  types/package.types.ts
  utils/package-status.ts
  index.tsx
```

## Public API Kuralı

Feature dışından erişilecek sayfa, component, hook veya type varsa önce feature `index` dosyasından export edilmelidir.

Doğru:

```ts
// src/features/package/index.tsx
export { PackageListPage } from './components/PackageListPage';
export { PackageCreatePage } from './components/PackageCreatePage';
export type { PackageHeaderDto } from './types/package.types';
```

Sonra tüketim:

```ts
import { PackageListPage } from '@/features/package';
import type { PackageHeaderDto } from '@/features/package';
```

Yanlış:

```ts
import { PackageListPage } from '@/features/package/components/PackageListPage';
import type { PackageHeaderDto } from '@/features/package/types/package.types';
```

İstisna: Aynı feature içindeki dosyalar birbirini relative import ile kullanabilir.

```ts
// src/features/package/components/PackageListPage.tsx
import { PackageDetailDialog } from './PackageDetailDialog';
import type { PackageHeaderDto } from '../types/package.types';
```

## Route Kuralı

Route dosyaları feature iç klasörlerine girmemelidir. Route-level lazy importlar public feature root üzerinden yapılmalıdır.

Doğru:

```ts
const TransferListPage = lazyNamed(() => import('@/features/transfer'), 'TransferListPage');
const ReportsPage = lazyNamed(() => import('@/features/report'), 'ReportsPage');
```

Yanlış:

```ts
const TransferListPage = lazyNamed(
  () => import('@/features/transfer/components/TransferListPage'),
  'TransferListPage',
);
```

Route ekleme checklist:

- Feature `index` dosyasında sayfa export edildi mi?
- Route `lazyNamed(() => import('@/features/<feature>'), '<ExportName>')` şeklinde mi?
- Route `withRoute` ile route name aldı mı?
- Gerekirse localization namespace eklendi mi?
- Menüde aynı path var mı?
- Permission config içinde route scope tanımlı mı?

## Shared Feature Kuralı

`src/features/shared` domain feature değildir. Operasyon feature'larının ortak kullandığı component, API helper, lookup type ve collection yardımcıları burada bulunur.

Şu tür parçalar shared olabilir:

- `SearchableSelect`
- `ProcessStockSelection`
- Barcode candidate picker
- Lookup API client
- Operation reference types: `Customer`, `Project`, `Warehouse`, `Product`

Şu tür parçalar shared olmamalıdır:

- Sadece tek feature'a ait status mapper
- Tek feature'a özel form section
- Tek feature'ın business kuralını taşıyan helper
- Domain-specific audit, package, shipment veya transfer davranışı

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

Eğer bir component iki veya daha fazla feature tarafından kullanılmaya başladıysa, ilk fırsatta `features/shared` altına taşınmalıdır. Eski path kırılma riski taşıyorsa compatibility re-export bırakılabilir.

Örnek compatibility re-export:

```ts
// Eski path: src/features/goods-receipt/components/steps/components/SearchableSelect.tsx
export { SearchableSelect } from '@/features/shared/components/SearchableSelect';
```

## Global Types Kuralı

`src/types` alanı feature bağımsız temel sözleşmeler içindir.

Buraya uygun örnekler:

- `ApiResponse`
- `PagedResponse`
- `BaseDocumentHeaderDto`
- `BaseDocumentLineDto`
- `BaseWorkflowOrder`
- `DocumentType`

Buraya uygun olmayan örnekler:

- `ShipmentCreateForm`
- `PackageStatusBadgeProps`
- `GoodsReceiptBulkCreateRequest`

Feature'a özel type feature altında kalmalıdır. Bir type birden fazla operasyon feature tarafından kullanılıyorsa önce `features/shared/types` düşünülmelidir; gerçekten uygulama geneli base sözleşmeyse `src/types` kullanılmalıdır.

## API Client Kuralı

Her feature kendi API client'ını `api/` altında tutmalıdır.

```txt
src/features/shipment/api/shipment-api.ts
src/features/package/api/package-api.ts
src/features/transfer/api/transfer-api.ts
```

Feature dışından API client tüketmek gerekiyorsa mümkünse feature public API'den export edilmelidir. Çok yaygın lookup/barcode gibi ortak API'ler `features/shared/api` altında tutulabilir.

Doğru:

```ts
import { lookupApi } from '@/features/shared/api/lookup-api';
```

Kabul edilebilir ama ileride public export'a çekilebilir:

```ts
import { shipmentApi } from '@/features/shipment/api/shipment-api';
```

Yanlış:

```ts
import { someInternalMapper } from '@/features/shipment/api/internal/someInternalMapper';
```

## Hook Kuralı

Feature'a ait query/mutation hook'ları feature altında kalmalıdır.

```txt
src/features/transfer/hooks/useTransferQueries.ts
src/features/package/hooks/usePackageQueries.ts
```

Ortak permission, auth veya lookup hook'ları feature boundary dikkate alınarak konumlandırılmalıdır:

- Access-control kaynaklı hook: `features/access-control/hooks`
- Auth kullanıcı/branch hook'u: `features/auth/hooks`
- Tamamen feature bağımsız hook: `src/hooks`

Feature içinden başka feature'ın hook'unu kullanmak gerekiyorsa bu ilişki domain olarak mantıklı olmalıdır. Örneğin access-control permission hook'larının birçok feature tarafından kullanılması normaldir. Ancak `goods-receipt` içindeki feature-specific hook'un shipment tarafından kullanılması mimari borçtur.

## Localization Kuralı

WMS Web'de iki localization katmanı vardır:

- Global/common metinler: `src/locales/<lang>/common.json`
- Feature bazlı metinler: `src/features/<feature>/localization`

Yeni büyük feature için feature-localization tercih edilmelidir. Tekrarlı domain metinlerini global common içine yığmak yerine feature namespace kullanılmalıdır.

Örnek:

```txt
src/features/package/localization/tr.ts
src/features/package/localization/en.ts
```

Route tarafında namespace gerekiyorsa `withRoute` içine eklenmelidir:

```ts
element: withRoute(PackageListPage, {
  routeName: 'package-list',
  namespaces: ['package', 'common'],
})
```

Hard-text bırakılmamalıdır. Özellikle button, title, validation, empty state, status ve error metinleri localization üzerinden gelmelidir.

## Permission ve UI Gating Kuralı

WMS Web'de permission sadece menüyü saklamak için değildir. Ekran içi action-level gating de uygulanmalıdır.

Minimum beklenti:

- Menü visibility permission ile filtrelenir.
- Route guard permission kontrol eder.
- Sayfa içindeki create/update/delete/approve/complete gibi aksiyonlar `useCrudPermission` veya ilgili access-control hook'u ile kapatılır.
- Backend enforcement yoksa UI gating tek başına güvenlik kabul edilmez.

Örnek:

```ts
const permissions = useCrudPermission('wms.shipment');

if (!permissions.canView) {
  return <PermissionNotice />;
}
```

Button örneği:

```tsx
<Button disabled={!permissions.canDelete}>
  {t('common.delete')}
</Button>
```

## Runtime Config ve SignalR Kuralı

Runtime config `public/config.json` ve `src/lib/api-config.ts` üzerinden yönetilir. Ortam bazlı URL veya realtime davranışları hard-code edilmemelidir.

Özellikle realtime notification için:

- Token console'a düşmemelidir.
- WebSocket/proxy hazır değilse runtime flag ile kapatılabilmelidir.
- Hata kullanıcı deneyimini kırmamalıdır.

Doğru yaklaşım:

```json
{
  "apiBaseUrl": "https://api.v3rii.com",
  "realtimeNotificationsEnabled": false
}
```

## Feature Taşıma Kuralı

Bir feature yanlış klasördeyse, örneğin `inventory/3d-warehouse` gibi nested domain feature durumu varsa, ayrı feature root'a taşınmalıdır.

Doğru hedef:

```txt
src/features/warehouse-3d/
```

Eski path kullanılma ihtimali varsa compatibility export bırakılabilir:

```ts
// src/features/inventory/index.tsx
export { OutsideWarehousePage, Warehouse3dPage } from '@/features/warehouse-3d';
```

Ancak uzun vadede compatibility bridge kaldırılabilir. Yeni kod eski bridge'i değil yeni feature root'u kullanmalıdır.

## Yeni Feature Ekleme Örneği

Örnek feature: `yard-operation`

Klasör:

```txt
src/features/yard-operation/
  api/yard-operation-api.ts
  components/YardOperationListPage.tsx
  components/YardOperationDetailDialog.tsx
  hooks/useYardOperationQueries.ts
  localization/tr.ts
  localization/en.ts
  types/yard-operation.types.ts
  utils/yard-operation-status.ts
  index.ts
```

`index.ts`:

```ts
export { YardOperationListPage } from './components/YardOperationListPage';
export { YardOperationDetailDialog } from './components/YardOperationDetailDialog';
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
  href: '/yard-operations',
}
```

Permission:

```ts
'/yard-operations': 'wms.yard-operation.view'
```

Component import:

```ts
import { SearchableSelect } from '@/features/shared';
import type { Warehouse } from '@/features/shared';
```

## Yapılacaklar ve Yapılmayacaklar

Yap:

- Feature dışına açılacak her şeyi `index` üzerinden export et.
- Route lazy importlarını feature root üzerinden yap.
- Ortak UI/type/helper tekrarlarını `features/shared` altında topla.
- Feature-specific logic'i feature içinde tut.
- Eski path kırılacaksa temporary compatibility re-export bırak.
- Her refactor sonrası `npm run build` çalıştır.
- Hard-text ekleme; localization kullan.
- Permission ve action gating'i ekle.

Yapma:

- Route içinde `@/features/x/components/Page` import etme.
- Bir feature'dan başka feature'ın iç component/type dosyasını ödünç alma.
- `goods-receipt` gibi operasyon feature'larını shared type deposu gibi kullanma.
- `src/types` altına feature-specific DTO doldurma.
- Runtime URL veya realtime davranışını hard-code etme.
- Büyük refactor sırasında compatibility path'leri düşünmeden taşıma yapma.

## AI Agent İçin Çalışma Talimatı

Bu projede çalışan AI agent aşağıdaki sırayı takip etmelidir:

1. İlgili feature klasörünü ve `index` dosyasını oku.
2. Benzer feature örneklerini incele.
3. Değişiklik feature-specific ise feature içinde tut.
4. Ortak kullanılacaksa `features/shared` veya `src/types` kararını bu dokümana göre ver.
5. Route gerekiyorsa feature public API üzerinden import et.
6. Menu ve permission config'i kontrol et.
7. Localization dosyalarını kontrol et.
8. Cross-feature deep import oluşturma.
9. Compatibility gerekiyorsa re-export bırak.
10. `npm run build` ile doğrula.

AI agent karar veremiyorsa şu soruyu sormalıdır:

```txt
Bu kod sadece tek domain feature'a mı ait, yoksa birden fazla operasyon feature tarafından kullanılan ortak bir sözleşme mi?
```

Cevap tek feature ise feature içinde kalır. Cevap ortak ise `features/shared` veya `src/types` değerlendirilir.

## Mimari Sağlık Kontrol Komutları

Route deep import kontrolü:

```bash
rg "import\\('@/features/.*/components/|import\\('@/features/.*/pages/" src/routes src/components -n
```

Eski goods-receipt ortak type bağımlılığı kontrolü:

```bash
rg "@/features/goods-receipt/types/goods-receipt" src -n
```

Eski SearchableSelect path kontrolü:

```bash
rg "goods-receipt/components/steps/components/SearchableSelect" src -n
```

Build doğrulama:

```bash
npm run build
```

## Mevcut Bilinen Durum

Bu rehber yazıldığı anda WMS Web'de aşağıdaki standardizasyonlar yapılmıştır:

- `warehouse-3d`, `inventory/3d-warehouse` altından çıkarılarak bağımsız feature root'a taşındı.
- `report` feature boş olmaktan çıkarılıp `/reports` route'una bağlandı.
- Route lazy importları büyük ölçüde feature public API üzerinden çalışıyor.
- `SearchableSelect` `features/shared` altına taşındı.
- `Customer`, `Project`, `Warehouse`, `Product` ortak operasyon referans tipleri `features/shared/types` altına taşındı.
- Eski path'ler için kırılmayı önleyen compatibility export'lar bırakıldı.
- Build doğrulaması başarılıdır.

## Sonuç

Bu proje için hedef mimari şudur:

```txt
Feature dışına açılan her şey public API'den geçer.
Ortak olan shared'e gider.
Domain'e özel olan feature içinde kalır.
Route feature içini bilmez.
AI/geliştirici yeni kod yazarken bu sınırları bozmaz.
```

Bu kurallar korunursa WMS Web, CRM benzeri feature-first yapıya yakın kalır ve modül bazlı geliştirme büyüdükçe sürdürülebilir olur.
