/**
 * Sync Turkish locale files for Operasyonlar features from EN + goods-receipt reference.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');

function flatten(obj, prefix = '') {
  const out = {};
  for (const [k, v] of Object.entries(obj ?? {})) {
    const p = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) Object.assign(out, flatten(v, p));
    else out[p] = v;
  }
  return out;
}

function unflatten(flat) {
  const root = {};
  for (const [p, value] of Object.entries(flat)) {
    const parts = p.split('.');
    let cur = root;
    for (let i = 0; i < parts.length - 1; i++) {
      cur[parts[i]] ??= {};
      cur = cur[parts[i]];
    }
    cur[parts[parts.length - 1]] = value;
  }
  return root;
}

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
}

function writeJson(rel, data) {
  fs.writeFileSync(path.join(ROOT, rel), `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

const grEn = flatten(readJson('src/features/goods-receipt/localization/en.json'));
const grTr = flatten(readJson('src/features/goods-receipt/localization/tr.json'));
const valueMap = new Map();
for (const key of Object.keys(grEn)) {
  const en = grEn[key];
  const tr = grTr[key];
  if (typeof en === 'string' && typeof tr === 'string' && en !== tr) {
    valueMap.set(en, tr);
  }
}

const EXTRA = {
  Actions: 'İşlemler',
  Approve: 'Onayla',
  Reject: 'Reddet',
  Error: 'Veri yüklenirken bir hata oluştu',
  Success: 'İşlem başarıyla tamamlandı',
  Title: 'Başlık',
  Subtitle: 'Alt başlık',
  'Search Placeholder': 'Ara...',
  'View Details': 'Detay',
  'Customer Code': 'Cari Kodu',
  'Customer Name': 'Cari Adı',
  'Document Date': 'Belge Tarihi',
  'Document No': 'Belge No',
  'Document No Placeholder': 'Belge numarası girin',
  'Completion Date': 'Tamamlanma Tarihi',
  'Target Warehouse': 'Hedef Depo',
  'Source Warehouse': 'Kaynak Depo',
  'Created Date': 'Oluşturma Tarihi',
  'Document Type': 'Evrak Tipi',
  Status: 'Durum',
  Completed: 'Tamamlandı',
  'In Progress': 'Devam Ediyor',
  'Pending Approval': 'Onay Bekliyor',
  'No Data': 'Veri bulunamadı',
  Id: 'ID',
  ID: 'ID',
  Order: 'Sipariş',
  Stock: 'Stok',
  'Basic Info': 'Temel Bilgi',
  'Order Selection': 'Sipariş Seçimi',
  'Stock Selection': 'Stok Seçimi',
  'Unknown Step': 'Bilinmeyen adım',
  Customer: 'Müşteri',
  Notes: 'Notlar',
  'Notes Placeholder': 'Not girin',
  'No Project': 'Proje bulunamadı',
  'Project Code': 'Proje Kodu',
  'Operation Users': 'Operasyon Kullanıcıları',
  'Select Customer': 'Müşteri Seç',
  'Select Operation Users': 'Operasyon kullanıcıları seçin',
  'Select Project Code': 'Proje kodu seçin',
  'Select Source Warehouse': 'Kaynak depo seçin',
  'Select Entry Warehouse': 'Giriş deposu seçin',
  'Select Operation Type': 'Operasyon tipi seçin',
  'Transfer Date': 'Transfer Tarihi',
  'Entry Warehouse': 'Giriş Deposu',
  'Operation Type': 'Operasyon Tipi',
  'Batch No': 'Parti No',
  'Batch No Placeholder': 'Parti numarası',
  'Config Code': 'Konfigürasyon Kodu',
  'Config Code Placeholder': 'Konfigürasyon kodu',
  'Lot No': 'Lot No',
  'Lot No Placeholder': 'Lot numarası',
  'Serial No': 'Seri No',
  'Serial No Placeholder': 'Seri numarası',
  'Serial No2': 'Seri No 2',
  'Serial No2 Placeholder': 'Seri no 2',
  'Source Cell Code': 'Kaynak Hücre Kodu',
  'Source Cell Code Placeholder': 'Kaynak hücre kodu',
  'Target Cell Code': 'Hedef Hücre Kodu',
  'Target Cell Code Placeholder': 'Hedef hücre kodu',
  'Barcode Placeholder': 'Barkod okutun veya yazın',
  'Barcode Scanned': 'Barkod okundu',
  'Camera Error': 'Kamera açılamadı',
  Collect: 'Topla',
  'Collect Error': 'Toplama hatası',
  Collected: 'Toplandı',
  Complete: 'Tamamla',
  'Complete Error': 'Tamamlama hatası',
  'Enter Barcode': 'Lütfen barkod giriniz',
  'Invalid Header Id': 'Geçersiz emir',
  'Invalid Quantity': 'Geçersiz miktar',
  'No Order Lines': 'Sipariş kalemi bulunamadı',
  'No Stock Selected': 'Lütfen önce stok bilgisi getirin',
  Quantity: 'Miktar',
  Remaining: 'Kalan',
  'Scan Barcode': 'Barkod okut',
  'Scan Barcode Description': 'Stok toplamak için barkod okutun',
  'Stock Not Found': 'Stok bulunamadı',
  'Stock Not In Order': 'Bu stok emrinde bulunmuyor',
  Total: 'Toplam',
  'View Collected': 'Toplananlar',
  'Yap Kod': 'Yapı Kodu',
  'Initializing system record...': 'Sistem kaydı başlatılıyor...',
  'Approve Error': 'Onaylama başarısız',
  'Approve Success': 'Onaylama başarılı',
  'Reject Error': 'Reddetme başarısız',
  'Reject Success': 'Reddetme başarılı',
  Badge: 'İşlem',
  lines: 'kalem',
  'Customer Prompt': 'Önce bir müşteri seçin',
  'Items Count': '{{count}} kalem',
  'No Items Found': 'Kalem bulunamadı',
  'No Order Selected': 'Sipariş seçilmedi',
  'Order Content': 'Sipariş içeriği',
  Ordered: 'Sipariş',
  Orders: 'Siparişler',
  Pending: 'Bekliyor',
  Started: 'Başlanan',
  'Search Items': 'Kalem ara',
  'Search Stocks': 'Stok ara',
  'Select Customer First': 'Önce müşteri seçin',
  'Select Order Prompt': 'Listeden bir sipariş seçin',
  'Selected Items': 'Seçili Kalemler',
  'Selected items': 'Seçili kalemler',
  'Selected items count': 'Seçili kalem sayısı',
  'No selected items yet': 'Henüz seçili kalem yok',
  'Search items': 'Kalem ara',
  'Search stocks': 'Stok ara',
  Stocks: 'Stoklar',
  Unit: 'Birim',
  'Customer Required': 'Müşteri seçimi zorunludur',
  'Document No Required': 'Belge numarası zorunludur',
  'Source Warehouse Required': 'Kaynak depo zorunludur',
  'Target Warehouse Required': 'Hedef depo zorunludur',
  'Transfer Date Required': 'Transfer tarihi zorunludur',
  'Operation Type Required': 'Operasyon tipi zorunludur',
  'Customer Info': 'Cari Bilgisi',
  'Detail Description': 'Detay açıklaması',
  'Detail Title': 'Detay',
  'Document Info': 'Belge Bilgisi',
  'Warehouse Info': 'Depo Bilgisi',
  'Stock Code': 'Stok Kodu',
  'Stock Name': 'Stok Adı',
  'Order No': 'Sipariş No',
  'Line Details': 'Satır Detayları',
  Lines: 'Satırlar',
  'Order Quantity': 'Sipariş Miktarı',
  'Load Pallet': 'Paleti Yükle',
  'Shipment list loaded': 'Sevkiyat listesi yüklendi',
  'Shipment lines loaded': 'Sevkiyat satırları yüklendi',
  'Shipment serial list loaded': 'Sevkiyat seri listesi yüklendi',
  'Shipment #{{number}}': 'Sevkiyat #{{number}}',
  'Transfer #{{number}}': 'Transfer #{{number}}',
  'Transfer list loaded': 'Transfer listesi yüklendi',
  'Transfer lines loaded': 'Transfer satırları yüklendi',
  'Transfer serial list loaded': 'Transfer seri listesi yüklendi',
  'No Selected Items': 'Seçili kalem yok',
  'Selected Items Count': 'Seçili kalem sayısı',
  'Enter Quantity To Select': 'Seçmek için miktar girin',
  'Selected items count': 'Seçili kalem sayısı',
  'Shipment, Production...': 'Sevkiyat, Üretim...',
};

for (const [en, tr] of Object.entries(EXTRA)) {
  valueMap.set(en, tr);
}

const TITLE_OVERRIDES = {
  'warehouse.inbound.approval.title': 'Onay Bekleyen Depo Giriş Emirleri',
  'warehouse.inbound.assignedList.title': 'Atanmış Depo Giriş Emirleri',
  'warehouse.inbound.create.title': 'Yeni Depo Giriş Emri Oluşturma',
  'warehouse.inbound.edit.title': 'Depo Giriş Düzenle',
  'warehouse.inbound.list.title': 'Depo Giriş Listesi',
  'warehouse.inbound.process.title': 'Depo Giriş İşlemi',
  'warehouse.outbound.approval.title': 'Onay Bekleyen Depo Çıkış Emirleri',
  'warehouse.outbound.assignedList.title': 'Atanmış Depo Çıkış Emirleri',
  'warehouse.outbound.create.title': 'Yeni Depo Çıkış Emri Oluşturma',
  'warehouse.outbound.edit.title': 'Depo Çıkış Düzenle',
  'warehouse.outbound.list.title': 'Depo Çıkış Listesi',
  'warehouse.outbound.process.title': 'Depo Çıkış İşlemi',
  'shipment.approval.title': 'Onay Bekleyen Sevkiyat Emirleri',
  'shipment.assignedList.title': 'Atanmış Sevkiyat Emirleri',
  'shipment.collection.title': 'Sevkiyat Toplama',
  'shipment.create.title': 'Yeni Sevkiyat Emri Oluşturma',
  'shipment.edit.title': 'Sevkiyat Düzenle',
  'shipment.list.title': 'Sevkiyat Listesi',
  'shipment.process.title': 'Sevkiyat İşlemi',
  'transfer.approval.title': 'Onay Bekleyen Transfer Emirleri',
  'transfer.assignedList.title': 'Atanmış Transfer Emirleri',
  'transfer.collection.title': 'Transfer Toplama',
  'transfer.list.title': 'Transfer Listesi',
  'package.create.title': 'Yeni Paketleme Emri',
  'package.list.title': 'Paketleme Listesi',
  'package.settings.title': 'Paketleme Tanımları',
  'package.station.title': 'Paketleme İstasyonu',
  'package.detail.title': 'Paket Detayı',
  'package.edit.title': 'Paket Düzenle',
};

const ERROR_OVERRIDES = {
  'warehouse.inbound.approval.approveError': 'Depo giriş emri onaylanamadı',
  'warehouse.inbound.approval.approveSuccess': 'Depo giriş emri başarıyla onaylandı',
  'warehouse.inbound.approval.rejectError': 'Depo giriş emri reddedilemedi',
  'warehouse.inbound.approval.rejectSuccess': 'Depo giriş emri başarıyla reddedildi',
  'warehouse.inbound.approval.searchPlaceholder': 'Belge no, cari kodu veya depo ile ara',
  'warehouse.outbound.approval.approveError': 'Depo çıkış emri onaylanamadı',
  'warehouse.outbound.approval.approveSuccess': 'Depo çıkış emri başarıyla onaylandı',
  'warehouse.outbound.approval.rejectError': 'Depo çıkış emri reddedilemedi',
  'warehouse.outbound.approval.rejectSuccess': 'Depo çıkış emri başarıyla reddedildi',
  'warehouse.outbound.approval.searchPlaceholder': 'Belge no, cari kodu veya depo ile ara',
  'warehouse.inbound.create.error': 'Depo giriş emri oluşturulamadı',
  'warehouse.inbound.create.success': 'Depo giriş emri oluşturuldu',
  'warehouse.inbound.edit.error': 'Depo giriş kaydedilemedi',
  'warehouse.inbound.edit.success': 'Depo giriş güncellendi',
  'warehouse.inbound.process.error': 'Depo giriş işlemi oluşturulurken hata oluştu',
  'warehouse.inbound.process.success': 'Depo giriş işlemi başarıyla oluşturuldu',
  'warehouse.outbound.create.error': 'Depo çıkış emri oluşturulamadı',
  'warehouse.outbound.create.success': 'Depo çıkış emri oluşturuldu',
  'warehouse.outbound.edit.error': 'Depo çıkış kaydedilemedi',
  'warehouse.outbound.edit.success': 'Depo çıkış güncellendi',
  'warehouse.outbound.process.error': 'Depo çıkış işlemi oluşturulurken hata oluştu',
  'warehouse.outbound.process.success': 'Depo çıkış işlemi başarıyla oluşturuldu',
  'shipment.approval.approveError': 'Sevkiyat emri onaylanamadı',
  'shipment.approval.approveSuccess': 'Sevkiyat emri başarıyla onaylandı',
  'shipment.approval.rejectError': 'Sevkiyat emri reddedilemedi',
  'shipment.approval.rejectSuccess': 'Sevkiyat emri başarıyla reddedildi',
  'shipment.approval.searchPlaceholder': 'Belge no, cari kodu veya depo ile ara',
  'shipment.create.error': 'Sevkiyat emri oluşturulamadı',
  'shipment.create.success': 'Sevkiyat emri oluşturuldu',
  'shipment.edit.error': 'Sevkiyat kaydedilemedi',
  'shipment.edit.success': 'Sevkiyat güncellendi',
  'shipment.process.error': 'Sevkiyat işlemi oluşturulamadı',
  'shipment.process.success': 'Sevkiyat işlemi başarıyla oluşturuldu',
  'transfer.approval.approveError': 'Transfer emri onaylanamadı',
  'transfer.approval.approveSuccess': 'Transfer emri başarıyla onaylandı',
  'transfer.approval.rejectError': 'Transfer emri reddedilemedi',
  'transfer.approval.rejectSuccess': 'Transfer emri başarıyla reddedildi',
  'transfer.approval.searchPlaceholder': 'Belge no, cari kodu veya depo ile ara',
};

const PRESERVE_IF_TURKISH = /[çğıöşüÇĞİÖŞÜ]/;

function translateString(enVal, keyPath, existingVal) {
  if (typeof enVal !== 'string') return enVal;
  if (PRESERVE_IF_TURKISH.test(existingVal) && existingVal !== enVal) return existingVal;
  if (TITLE_OVERRIDES[keyPath]) return TITLE_OVERRIDES[keyPath];
  if (ERROR_OVERRIDES[keyPath]) return ERROR_OVERRIDES[keyPath];
  if (valueMap.has(enVal)) return valueMap.get(enVal);
  if (enVal === 'Subtitle' && keyPath.includes('edit')) return 'Başlık bilgilerini güncelle';
  return enVal;
}

function translateTree(enNode, trNode, prefix, out = {}) {
  for (const [key, enVal] of Object.entries(enNode ?? {})) {
    const keyPath = prefix ? `${prefix}.${key}` : key;
    const existing = trNode?.[key];
    if (enVal && typeof enVal === 'object' && !Array.isArray(enVal)) {
      out[key] = translateTree(enVal, existing ?? {}, keyPath);
    } else {
      out[key] = translateString(enVal, keyPath, existing);
    }
  }
  return out;
}

const FEATURES = [
  'warehouse',
  'shipment',
  'transfer',
  'package',
];

for (const feature of FEATURES) {
  const en = readJson(`src/features/${feature}/localization/en.json`);
  const trPath = `src/features/${feature}/localization/tr.json`;
  const existing = fs.existsSync(path.join(ROOT, trPath)) ? readJson(trPath) : {};
  const translated = translateTree(en, existing, feature === 'warehouse' || feature === 'shipment' || feature === 'package' ? Object.keys(en)[0] === feature ? feature : Object.keys(en).find((k) => k === feature) ?? feature : 'transfer');
  // fix root: en files have mixed roots
  const rootKey = Object.keys(en)[0];
  const rootTr = translateTree(en, existing, '');
  writeJson(trPath, rootTr);
  console.log(`Updated ${trPath}`);
}

// service-allocation full tr from en
const saEn = readJson('src/features/service-allocation/localization/en.json');
const saTrExisting = readJson('src/features/service-allocation/localization/tr.json');
const SA_TR = {
  'serviceAllocation.caseNo': 'Kayıt No',
  'serviceAllocation.customerCode': 'Cari',
  'serviceAllocation.customerId': 'Cari Id',
  'serviceAllocation.stockCode': 'Stok Kodu',
  'serviceAllocation.stockId': 'Stok Id',
  'serviceAllocation.serialNo': 'Seri No',
  'serviceAllocation.status': 'Durum',
  'serviceAllocation.receivedAt': 'Alınma Tarihi',
  'serviceAllocation.closedAt': 'Kapanma Tarihi',
  'serviceAllocation.lines': 'Servis Satırları',
  'serviceAllocation.lineType': 'Satır Tipi',
  'serviceAllocation.processType': 'İşlem Tipi',
  'serviceAllocation.quantity': 'Miktar',
  'serviceAllocation.unit': 'Birim',
  'serviceAllocation.erpOrderNo': 'ERP Sipariş No',
  'serviceAllocation.erpOrderId': 'ERP Sipariş Id',
  'serviceAllocation.description': 'Açıklama',
  'serviceAllocation.intakeWarehouseId': 'Alım Deposu Id',
  'serviceAllocation.currentWarehouseId': 'Güncel Depo Id',
  'serviceAllocation.diagnosisNote': 'Teşhis Notu',
  'serviceAllocation.allocatedQuantity': 'Ayrılan',
  'serviceAllocation.priority': 'Öncelik',
  'serviceAllocation.documentModule': 'Modül',
  'serviceAllocation.documentHeaderId': 'Belge Id',
  'serviceAllocation.linkPurpose': 'Bağlantı Amacı',
  'serviceAllocation.sequence': 'Sıra',
  'serviceAllocation.serviceCaseId': 'Servis Kaydı',
  'serviceAllocation.orderAllocationLineId': 'Atama Satırı',
  'serviceAllocation.linkedAt': 'Bağlanma Tarihi',
  'serviceAllocation.fromWarehouse': 'Kaynak Depo',
  'serviceAllocation.toWarehouse': 'Hedef Depo',
  'serviceAllocation.createCase': 'Servis Kaydı Oluştur',
  'serviceAllocation.breadcrumb.module': 'SERVIS_ATAMA',
  'serviceAllocation.caseList.title': 'Servis Kayıtları',
  'serviceAllocation.caseList.subtitle': 'Servis kayıtlarını görüntüleyin ve yönetin.',
  'serviceAllocation.caseList.error': 'Servis kayıtları yüklenemedi.',
  'serviceAllocation.caseList.empty': 'Servis kaydı bulunamadı.',
  'serviceAllocation.caseList.search': 'Servis kaydı ara...',
  'serviceAllocation.allocationQueue.title': 'Atama Kuyruğu',
  'serviceAllocation.allocationQueue.subtitle': 'Stok atama öncelik kuyruğunu izleyin.',
  'serviceAllocation.allocationQueue.error': 'Atama kuyruğu yüklenemedi.',
  'serviceAllocation.allocationQueue.empty': 'Atama satırı bulunamadı.',
  'serviceAllocation.allocationQueue.search': 'Atama kuyruğunda ara...',
  'serviceAllocation.documentLinks.title': 'Belge Bağlantıları',
  'serviceAllocation.documentLinks.subtitle': 'Modüller arası belge bağlantı kayıtları.',
  'serviceAllocation.documentLinks.error': 'Belge bağlantıları yüklenemedi.',
  'serviceAllocation.documentLinks.empty': 'Belge bağlantısı bulunamadı.',
  'serviceAllocation.documentLinks.search': 'Belge bağlantısı ara...',
  'serviceAllocation.timeline.title': 'Servis Kaydı Zaman Çizelgesi',
  'serviceAllocation.timeline.subtitle': 'Depo hareketleri ve bağlı belgeler.',
  'serviceAllocation.timeline.events': 'Depo Zaman Çizelgesi',
  'serviceAllocation.timeline.linkCount': 'Bağlı Belgeler',
  'serviceAllocation.timeline.lastMovement': 'Son Hareket',
  'serviceAllocation.recompute.missingStock': 'Bu kayıt için gelen stok tanımlı değil.',
  'serviceAllocation.recompute.success': 'Atama yeniden hesaplandı. {{count}} satır işlendi.',
  'serviceAllocation.recompute.error': 'Atama yeniden hesaplanamadı.',
  'serviceAllocation.recompute.action': 'Atamayı Yeniden Hesapla',
  'serviceAllocation.form.createTitle': 'Servis Kaydı Oluştur',
  'serviceAllocation.form.editTitle': 'Servis Kaydını Düzenle',
  'serviceAllocation.form.createSubtitle': 'Yeni servis kaydı girişi yapın.',
  'serviceAllocation.form.editSubtitle': 'Servis kaydı başlık ve satırlarını güncelleyin.',
  'serviceAllocation.form.createSuccess': 'Servis kaydı oluşturuldu.',
  'serviceAllocation.form.updateSuccess': 'Servis kaydı güncellendi.',
  'serviceAllocation.form.saveError': 'Servis kaydı kaydedilemedi.',
  'serviceAllocation.form.initialLine': 'İlk / Ek Servis Satırı',
  'serviceAllocation.form.selectCustomer': 'Cari seçin',
  'serviceAllocation.form.selectStock': 'Stok seçin',
  'serviceAllocation.form.selectWarehouse': 'Depo seçin',
  'serviceAllocation.form.noCustomers': 'Cari bulunamadı.',
  'serviceAllocation.form.noStocks': 'Stok bulunamadı.',
  'serviceAllocation.form.noWarehouses': 'Depo bulunamadı.',
  'serviceAllocation.form.customerLookupDescription': 'Cari kaydını listeden seçin; sistem cari kodu ve tanımlayıcıyı birlikte doldurur.',
  'serviceAllocation.form.incomingStockLookupDescription': 'Gelen ürün için ERP stok kartını seçin; stok kodu ve tanımlayıcı birlikte doldurulur.',
  'serviceAllocation.form.initialLineStockLookupDescription': 'Servis satırında kullanılacak stok kartını seçin; kod, tanımlayıcı ve birim birlikte taşınır.',
  'serviceAllocation.form.warehouseLookupDescription': 'Depoyu listeden seçin; sistem arka planda doğru depo kaydını bağlar.',
  'serviceAllocation.reports.title': 'Servis Raporları',
  'serviceAllocation.reports.subtitle': 'Operasyonel KPI ve dağılım özetleri.',
  'serviceAllocation.reports.totalCases': 'Toplam Servis Kaydı',
  'serviceAllocation.reports.openCases': 'Açık kayıtlar',
  'serviceAllocation.reports.waitingParts': 'Parça Bekleyen',
  'serviceAllocation.reports.reviewWaitingCases': 'Bekleyen kayıtları incele',
  'serviceAllocation.reports.partialAllocations': 'Kısmi Atamalar',
  'serviceAllocation.reports.openPartialAllocations': 'Atama kuyruğunu aç',
  'serviceAllocation.reports.documentLinks': 'Belge Bağlantıları',
  'serviceAllocation.reports.openDocumentLinks': 'Belge bağlantılarını aç',
  'serviceAllocation.reports.criticalQueue': 'Kritik Kuyruk',
  'serviceAllocation.reports.openQueue': 'Kuyruğu Aç',
  'serviceAllocation.reports.waitingCasesTable': 'Parça Bekleyen Kayıtlar',
  'serviceAllocation.reports.noWaitingCases': 'Parça bekleyen kayıt yok.',
  'serviceAllocation.reports.partialAllocationTable': 'Kısmi Atama Satırları',
  'serviceAllocation.reports.noPartialAllocations': 'Kısmi atama bulunamadı.',
  'serviceAllocation.reports.caseDistribution': 'Kayıt Durum Dağılımı',
  'serviceAllocation.reports.linkDistribution': 'Bağlantı Amacı Dağılımı',
  'serviceAllocation.reports.noDistribution': 'Dağılım verisi yok.',
  'serviceAllocation.reports.recentMovements': 'Son Depo Hareketleri',
  'serviceAllocation.reports.shipmentLinks': 'sevkiyat bağlantısı',
  'serviceAllocation.reports.openLinks': 'Bağlantıları Aç',
  'serviceAllocation.reports.noRecentMovements': 'Son depo hareketi bulunamadı.',
  'serviceAllocation.reports.allocationRows': 'Atama Satırları',
  'serviceAllocation.reports.activeRepairCases': 'Aktif Onarım Kayıtları',
  'serviceAllocation.reports.shipmentLinksCount': 'Sevkiyat Bağlantı Sayısı',
};

const saFlatEn = flatten(saEn);
const saFlatTr = { ...flatten(saTrExisting), ...SA_TR };
for (const [key, enVal] of Object.entries(saFlatEn)) {
  if (typeof enVal !== 'string') continue;
  if (saFlatTr[key] && PRESERVE_IF_TURKISH.test(saFlatTr[key])) continue;
  if (SA_TR[key]) continue;
  if (key.startsWith('serviceAllocation.enum.')) {
    saFlatTr[key] = translateString(enVal, key, saFlatTr[key]);
  }
}
// enum translations
const enumTr = {
  Draft: 'Taslak',
  'Waiting For Intake': 'Alım Bekliyor',
  Received: 'Alındı',
  'In Diagnosis': 'Teşhiste',
  'Waiting For Parts': 'Parça Bekliyor',
  'In Repair': 'Onarımda',
  'Ready For Return': 'İadeye Hazır',
  'Returned To Main Warehouse': 'Ana Depoya İade Edildi',
  Closed: 'Kapalı',
  Cancelled: 'İptal',
  'Incoming Product': 'Gelen Ürün',
  'Spare Part': 'Yedek Parça',
  Labor: 'İşçilik',
  'Replacement Product': 'Değişim Ürünü',
  'Normal Sales Order': 'Normal Satış Siparişi',
  'Service Repair': 'Servis Onarımı',
  'Spare Part Supply': 'Yedek Parça Tedariki',
  'Repair Return': 'Onarım İadesi',
  Waiting: 'Bekliyor',
  Blocked: 'Blokeli',
  Allocated: 'Atandı',
  'Partially Allocated': 'Kısmen Atandı',
  Shipped: 'Sevk Edildi',
  Intake: 'Alım',
  'Internal Transfer': 'İç Transfer',
  'Repair Operation': 'Onarım Operasyonu',
  'Return To Main Warehouse': 'Ana Depoya İade',
  Shipment: 'Sevkiyat',
  'Allocation Source': 'Atama Kaynağı',
  'Allocation Result': 'Atama Sonucu',
};
for (const [key, enVal] of Object.entries(saFlatEn)) {
  if (typeof enVal === 'string' && enumTr[enVal]) saFlatTr[key] = enumTr[enVal];
}
for (const [key, val] of Object.entries(SA_TR)) saFlatTr[key] = val;
writeJson('src/features/service-allocation/localization/tr.json', unflatten(saFlatTr));
console.log('Updated service-allocation tr.json');

// transfer-chain placeholder fix
const tcTr = readJson('src/features/transfer-chain/localization/tr.json');
tcTr.form.sourceDocumentTypePlaceholder = 'Sevkiyat, Üretim...';
writeJson('src/features/transfer-chain/localization/tr.json', tcTr);

// common productionTransfer approval subtitle
const commonTrPath = 'src/locales/tr/common.json';
const commonTr = readJson(commonTrPath);
commonTr.productionTransfer ??= {};
commonTr.productionTransfer.approval ??= {};
commonTr.productionTransfer.approval.subtitle = 'Onay bekleyen üretim transferlerini görüntüleyin ve işleyin';
writeJson(commonTrPath, commonTr);

// --- package remaining EN strings ---
const pkgTr = flatten(readJson('src/features/package/localization/tr.json'));
const PKG_TR = {
  'print.templatePlaceholder': 'Şablon seçin',
  'print.profilePlaceholder': 'Profil seçin',
  'print.copies': 'Kopya',
  'print.gs1Title': 'GS1 / SSCC Palet Etiketi',
  'print.gs1Description': 'Palet etiketleri için GS1/SSCC bağlantısı üretin.',
  'print.copySummary': 'Kopya: {{count}}',
  'print.clear': 'Temizle',
  'print.printerProfile': 'Yazıcı Profili',
  'print.templateLabel': 'Şablon',
  'move.fallbackPacking': 'Paketleme',
  'move.note': 'Not',
  'move.treeLoading': 'Paket ağacı yükleniyor...',
  'move.description': 'Mevcut paket ağacından koli veya palet seçip {{target}} için bağlayın.',
  'package.detail.add': 'Ekle',
  'package.detail.addLine': 'Satır Ekle',
  'package.detail.addLineDescription': 'Pakete yeni ürün satırı ekleyin',
  'package.detail.addPackage': 'Paket Ekle',
  'package.detail.addPackageDescription': 'Yeni koli veya palet kaydı ekleyin',
  'package.detail.lineAddError': 'Satır eklenemedi',
  'package.detail.lineAddSuccess': 'Satır eklendi',
  'package.detail.match': 'Eşleştir',
  'package.detail.matchError': 'Eşleştirme başarısız',
  'package.detail.matchSuccess': 'Eşleştirme başarılı',
  'package.detail.noLines': 'Satır yok',
  'package.detail.noPackages': 'Paket yok',
  'package.detail.noStockSelected': 'Stok seçilmedi',
  'package.detail.notFound': 'Bulunamadı',
  'package.detail.packageAddError': 'Paket eklenemedi',
  'package.detail.packageAddSuccess': 'Paket eklendi',
  'package.detail.packageNo': 'Paket No',
  'package.detail.netWeight': 'Net Ağırlık',
  'package.detail.grossWeight': 'Brüt Ağırlık',
  'package.detail.isMixed': 'Karma Paket',
  'package.detail.serialNo': 'Seri No',
  'package.detail.trackingNo': 'Takip No',
  'package.detail.unmatch': 'Eşleşmeyi Kaldır',
  'package.detail.unmatchSuccess': 'Eşleşme kaldırıldı',
  'package.detail.yapAcik': 'Yapı Açıklaması',
  'package.detail.yapKod': 'Yapı Kodu',
  'package.list.createNew': 'Yeni Paketleme',
  'package.list.deleteConfirm': 'Silme Onayı',
  'package.list.deleteConfirmMessage': 'Bu paketleme kaydını silmek istediğinize emin misiniz?',
  'package.list.deleteError': 'Silinemedi',
  'package.list.deleteSuccess': 'Silindi',
  'package.list.noData': 'Veri bulunamadı',
  'package.list.matchedSource': 'Eşleşen Kaynak',
  'package.list.packingNo': 'Paketleme No',
  'package.settings.boxMaterial': 'Koli Malzemesi',
  'package.settings.noPallet': 'Palet yok',
  'package.settings.palletPlaceholder': 'Palet seçin',
  'package.settings.allCustomers': 'Tüm Cariler',
  'package.settings.materials': 'Malzemeler',
  'package.settings.specs': 'Spesifikasyonlar',
  'package.settings.materialList': 'Malzeme listesi',
  'package.settings.specList': 'Spesifikasyon listesi',
  'package.settings.materialFormHelp': 'Koli, palet ve diğer ambalaj malzemelerini tanımlayın.',
  'package.settings.specFormHelp': 'Stok ve müşteri bazlı paketleme kurallarını tanımlayın.',
  'package.settings.dimensionsSection': 'Ölçüler',
  'package.settings.capacitySection': 'Kapasite',
  'package.settings.mixedPolicySection': 'Karma paket kuralları',
  'package.settings.materialTypeOptions.box': 'Koli',
  'package.settings.materialTypeOptions.pallet': 'Palet',
  'package.settings.materialTypeOptions.bag': 'Torba',
  'package.settings.materialTypeOptions.custom': 'Özel',
  'package.station.headerId': 'Paketleme Header Id',
  'package.station.invalidHeader': 'Geçerli bir paketleme header id girin.',
  'package.wizard.headerError': 'Paketleme başlığı kaydedilemedi',
  'package.wizard.lineDeleteError': 'Satır silinemedi',
  'package.wizard.lineError': 'Satır kaydedilemedi',
  'package.wizard.packageDeleteError': 'Paket silinemedi',
  'package.wizard.packageError': 'Paket kaydedilemedi',
  'package.wizard.atLeastOnePackage': 'En az 1 paket eklemelisiniz',
  'package.wizard.cancelMessage': 'İşlemi iptal etmek istediğinizden emin misiniz?',
  'package.wizard.cancelMessageWithData': 'Tüm veriler silinecek. İşlemi iptal etmek istediğinizden emin misiniz?',
  'package.wizard.cancelTitle': 'İşlemi İptal Et',
  'package.wizard.completeError': 'Paketleme tamamlanırken bir hata oluştu',
  'package.wizard.completed': 'Paketleme başarıyla tamamlandı',
  'package.wizard.editHeader': 'Başlığı Düzenle',
  'package.wizard.headerCreated': 'Paketleme başlığı oluşturuldu',
  'package.wizard.headerRequired': 'Önce paketleme başlığı oluşturmalısınız',
  'package.wizard.lineAdded': 'Satır eklendi',
  'package.wizard.lineDeleted': 'Satır silindi',
  'package.wizard.nextStep': 'Sonraki Adım',
  'package.wizard.packageAdded': 'Paket eklendi',
  'package.wizard.packageDeleted': 'Paket silindi',
  'package.wizard.packageUpdated': 'Paket güncellendi',
  'package.wizard.previousStep': 'Önceki Adım',
  'package.wizard.saveAndContinue': 'Kaydet ve İlerle',
  'package.wizard.saveAndExit': 'Kaydet ve Çık',
  'package.wizard.saved': 'Paketleme kaydedildi',
  'package.wizard.stepProgress': 'Adım {{current}}/{{total}}',
  'package.wizard.unknownStep': 'Bilinmeyen adım',
  'package.wizard.step1.title': 'Paketleme Başlığı',
  'package.wizard.step1.description': 'Paketleme başlık bilgilerini giriniz',
  'package.wizard.step2.title': 'Paketler',
  'package.wizard.step2.description': 'Paketleme için koli veya palet ekleyiniz',
  'package.wizard.step2.addPackage': 'Paket Ekle',
  'package.wizard.step2.addPackageDescription': 'Yeni bir paket ekleyin',
  'package.wizard.step2.editPackage': 'Paket Düzenle',
  'package.wizard.step2.editPackageDescription': 'Paket bilgilerini düzenleyin',
  'package.wizard.step2.noPackages': 'Henüz paket eklenmedi',
  'package.wizard.step3.title': 'Paket Satırları',
  'package.wizard.step3.description': 'Paketlere satırlar ekleyiniz (opsiyonel)',
  'package.wizard.step3.addLine': 'Satır Ekle',
  'package.wizard.step3.addLineDescription': 'Pakete ürün satırı ekleyin',
  'package.wizard.step3.noLines': 'Henüz satır eklenmedi',
  'package.wizard.step3.noPackages': 'Önce paket eklemelisiniz',
  'package.wizard.step3.noPackagesMessage': 'Önce en az bir paket ekleyin',
  'package.wizard.step3.stockNotFound': 'Stok bulunamadı',
  'package.wizard.step3.enterBarcode': 'Lütfen barkod giriniz',
  'package.wizard.step3.cameraError': 'Kamera açılamadı',
  'package.wizard.step3.barcodeScanned': 'Barkod okundu',
  'package.wizard.step3.barcodePlaceholder': 'Barkod okutun veya yazın',
  'package.wizard.step3.scanBarcode': 'Barkod Okut',
  'package.wizard.step3.scanBarcodeDescription': 'Barkodu kameraya hizalayın',
  'package.wizard.step4.title': 'Özet ve Tamamla',
  'package.wizard.step4.complete': 'Tamamla ve Kaydet',
  'package.wizard.step4.editHeader': 'Başlığı Düzenle',
  'package.wizard.step4.editLines': 'Satırları Düzenle',
  'package.wizard.step4.editPackages': 'Paketleri Düzenle',
  'package.wizard.step4.headerInfo': 'Başlık Bilgileri',
  'package.wizard.step4.summaryTotals': 'Toplam Bilgileri',
  'package.wizard.step4.packages': 'Paketler',
  'package.wizard.step4.lines': 'Satırlar',
  'package.wizard.step4.noLines': 'Satır bulunamadı',
  'package.wizard.step4.noPackages': 'Paket bulunamadı',
};
for (const [key, val] of Object.entries(PKG_TR)) pkgTr[key] = val;
// generic package string fixes
for (const [key, val] of Object.entries(pkgTr)) {
  if (typeof val !== 'string') continue;
  let next = val
    .replace(/^ADD /, 'Ekle ')
    .replace(/^NO /, '')
    .replace(/ NOT /g, ' ')
    .replace(/Placeholder$/i, '')
    .replace(/Error$/i, ' hatası')
    .replace(/Success$/i, ' başarılı');
  if (next !== val && !PRESERVE_IF_TURKISH.test(val)) pkgTr[key] = next.trim() || val;
}
writeJson('src/features/package/localization/tr.json', unflatten(pkgTr));
console.log('Updated package tr extras');

// --- kkd operational placeholders ---
const kkdTr = readJson('src/features/kkd/localization/tr.json');
const ops = kkdTr.kkd.operational;
Object.assign(ops, {
  deleteConfirm: 'Bu kaydı silmek istediğinize emin misiniz?',
  departmentReport: { breadcrumb: 'KKD / Bölüm Raporu', pageTitle: 'KKD Bölüm Raporu' },
  groupReport: { breadcrumb: 'KKD / Grup Raporu', pageTitle: 'KKD Grup Raporu' },
  roleReport: { breadcrumb: 'KKD / Görev Raporu', pageTitle: 'KKD Görev Raporu' },
  entitlementCheck: {
    breadcrumb: 'Personel ve grup seçerek hak ediş uygunluğunu kontrol edin',
    pageTitle: 'KKD Hak Ediş Kontrolü',
    cardInputs: 'Kontrol Girdileri',
    cardResult: 'Kontrol Sonucu',
    checkButton: 'Kontrol Et',
    employeeLabel: 'Personel',
    emptyState: 'Kontrol sonucu burada görünecek.',
    errSelectEmployee: 'Personel seçmelisiniz',
    errSelectGroup: 'Hak ediş grubu seçmelisiniz',
    extraEntitlement: 'Ek Hak',
    groupEmpty: 'Grup bulunamadı',
    groupLabel: 'Hak Ediş Grubu',
    infoBox: 'Seçilen personel ve grup için kalan hak adetlerini kontrol eder.',
    mainEntitlement: 'Ana Hak',
    nextDate: 'Sonraki Hak Tarihi',
    placeholderGroup: 'Grup seçin',
    resultAllowed: 'Dağıtıma uygun',
    resultBlocked: 'Dağıtıma uygun değil',
    searchGroup: 'Grup ara',
    suggestedSource: 'Önerilen kaynak',
    toastDone: 'Kontrol tamamlandı',
    toastFail: 'Kontrol başarısız',
    toastOk: 'Dağıtıma uygun',
    total: 'Toplam Kalan',
    txnDate: 'İşlem Tarihi',
  },
  overview: {
    pageTitle: 'KKD Operasyon Özeti',
    subtitle: 'Dağıtım, hak kontrolü ve tanım ekranlarına tek yerden erişin.',
    moduleBadge: 'KKD Operasyon',
    actionsTitle: 'Hızlı İşlemler',
    checkEntitlement: 'Hak Kontrolü',
    definitionsTitle: 'Tanım Ekranları',
    flowTitle: 'Operasyon Akışı',
    govOrganizationTitle: 'Organizasyon Tanımları',
    govOrganizationDesc: 'Bölüm, görev ve çalışan kartlarını yönetin.',
    govMatrixTitle: 'Hak Matrisi',
    govMatrixDesc: 'Grup bazlı periyot ve miktar kurallarını tanımlayın.',
    govOverrideTitle: 'Manuel Ek Haklar',
    govOverrideDesc: 'İstisnai personel ihtiyaçları için ek hak atayın.',
    openScreen: 'Ekranı Aç',
    quickDistributionTitle: 'Dağıtım Başlat',
    quickDistributionDesc: 'Personel seçip KKD dağıtım fişi oluşturun.',
    quickCheckTitle: 'Hak Kontrolü',
    quickCheckDesc: 'Dağıtım öncesi kalan hak adedini doğrulayın.',
    quickListTitle: 'Dağıtım Listesi',
    quickListDesc: 'Tamamlanan ve açık dağıtım belgelerini izleyin.',
    quickDefinitionsTitle: 'Tanımlar',
    quickDefinitionsDesc: 'Organizasyon ve hak matrisi ekranlarına gidin.',
    startDistribution: 'Dağıtım Başlat',
    step1: '1. Organizasyon',
    step2: '2. Hak matrisi',
    step3: '3. İlk hak siparişi',
    step4: '4. Dağıtım',
    step5: '5. Kontrol / rapor',
    step6: '6. Doğrulama kayıtları',
    summaryDepartment: 'Bölüm',
    summaryEmployee: 'Çalışan',
    summaryMatrix: 'Hak kuralı',
    summaryOverride: 'Manuel ek hak',
    summaryRole: 'Görev',
    summaryStockGroup: 'Stok grubu',
  },
  initialOrder: {
    pageTitle: 'İlk Hak Siparişi',
    breadcrumb: 'Personel için ilk KKD hak siparişi oluşturun',
    add: 'Ekle',
    remove: 'Kaldır',
    save: 'Kaydet',
    clearCart: 'Sepeti Temizle',
    documentNo: 'Belge No',
    employmentStart: 'İşe Giriş Tarihi',
    entitlementGroup: 'Hak Grubu',
    cardEmployee: 'Personel',
    cardOrder: 'Sipariş',
    cardStock: 'Stok',
    selectStock: 'Stok Seç',
    selectMe: 'Beni Seç',
    selectGroupFirst: 'Önce grup seçin',
    noLines: 'Henüz satır yok',
    totalQty: 'Toplam Miktar',
    lineCount: 'Satır sayısı',
    lineCountN: '{{count}} satır',
    remainingInCart: 'Sepette kalan',
    qrLabel: 'QR / Personel Kodu',
    qrPlaceholder: 'QR okutun veya personel kodu girin',
    resolveQr: 'Personeli Getir',
    stockLabel: 'Stok',
    stockSearchPlaceholder: 'Stok ara',
    selectEmployeeDialog: 'Personel Seç',
    selectEmployeePlaceholder: 'Personel seçin',
    headerPrefix: 'KKD-',
    initialEntitlement: 'İlk Hak',
    altEmployee: 'Alternatif personel',
    errNeedLines: 'En az bir satır ekleyin',
    errNoEmployee: 'Personel seçmelisiniz',
    groupPlaceholder: 'Grup seçin',
    groupStockPlaceholder: 'Grup stoku seçin',
    toastEmployeeFound: 'Personel bulundu',
    toastLineAdded: 'Satır eklendi',
    toastOrderCreated: 'Sipariş oluşturuldu',
  },
  remaining: {
    pageTitle: 'Kalan Haklar',
    breadcrumb: 'Personel bazlı kalan KKD haklarını görüntüleyin',
    listTitle: 'Kalan Hak Listesi',
    cardInput: 'Sorgu',
    dateLabel: 'Tarih',
    empPlaceholder: 'Personel seçin',
    qrLabel: 'QR / Personel Kodu',
    qrPlaceholder: 'QR okutun',
    resolve: 'Getir',
    fetch: 'Listele',
    listEmpty: 'Kayıt bulunamadı',
    lastUse: 'Son kullanım',
    mainShort: 'Ana',
    addShort: 'Ek',
    totalShort: 'Toplam',
    nextOk: 'Uygun',
    errNeedEmployee: 'Personel seçmelisiniz',
    errQr: 'QR çözümlenemedi',
    errList: 'Liste yüklenemedi',
    toastFound: 'Personel bulundu',
    toastList: 'Liste güncellendi',
    altEmployee: 'Alternatif personel',
  },
  validationLog: {
    pageTitle: 'KKD Doğrulama Kayıtları',
    breadcrumb: 'Dağıtım ve kontrol işlemlerinin denetim izi',
    gridTitle: 'Doğrulama Kayıtları',
    detailTitle: 'Kayıt Detayı',
    empty: 'Kayıt bulunamadı',
    errLoad: 'Kayıtlar yüklenemedi',
    searchPh: 'Personel, stok veya mesaj ara',
    pickLog: 'Detay için soldan bir kayıt seçin',
    account: 'Hesap',
    code: 'Kod',
    desc: 'Açıklama',
    employee: 'Personel',
    employeeCust: 'Personel / Cari',
    group: 'Grup',
    message: 'Mesaj',
    qty: 'Miktar',
    stock: 'Stok',
    stockQty: 'Stok / Miktar',
    time: 'Zaman',
    metaBarcode: 'Barkod',
    metaDevice: 'Cihaz',
    metaQr: 'QR',
    metaWh: 'Depo',
  },
  reports: {
    deptLabel: 'Bölüm',
    groupLabel: 'Grup',
    deptSearchPh: 'Bölüm ara',
    groupSearchPh: 'Grup ara',
    roleSearchPh: 'Görev ara',
    emptyDept: 'Bölüm kaydı yok',
    emptyGroup: 'Grup kaydı yok',
    emptyRole: 'Görev kaydı yok',
    errDept: 'Bölüm raporu yüklenemedi',
    errGroup: 'Grup raporu yüklenemedi',
    errRole: 'Görev raporu yüklenemedi',
    colDeptCode: 'Bölüm Kodu',
    colDeptName: 'Bölüm Adı',
    colGroupCode: 'Grup Kodu',
    colGroupName: 'Grup Adı',
    colRoleCode: 'Görev Kodu',
    colRoleName: 'Görev Adı',
    colDocs: 'Belge',
    colEmployees: 'Personel',
    colQty: 'Miktar',
    colLast: 'Son İşlem',
    labelDocEmp: 'Belge / Personel',
    labelQty: 'Miktar',
    labelRole: 'Görev',
    lastMove: 'Son hareket',
    pickRowDept: 'Detay için bölüm satırı seçin',
    pickRowGroup: 'Detay için grup satırı seçin',
    pickRowRole: 'Detay için görev satırı seçin',
    summaryDept: 'Bölüm özeti',
    summaryGroup: 'Grup özeti',
    summaryRole: 'Görev özeti',
    summaryD: 'Bölüm',
    summaryG: 'Grup',
    summaryK: 'Kayıt',
  },
});
kkdTr.kkd.pages = {
  departmentDefinitionsTitle: 'KKD Bölüm Tanımları',
  departmentDefinitionsDescription: 'KKD dağıtımında kullanılacak bölümleri yönetin.',
  departmentDefinitionsBreadcrumb: 'KKD / Bölüm Tanımları',
  roleDefinitionsTitle: 'KKD Görev Tanımları',
  roleDefinitionsDescription: 'Personel görevlerini ve KKD ilişkilerini yönetin.',
  roleDefinitionsBreadcrumb: 'KKD / Görev Tanımları',
  employeeCardsTitle: 'KKD Çalışan Kartları',
  employeeCardsDescription: 'Çalışan kartlarını ve QR/personel kodlarını yönetin.',
  employeeCardsBreadcrumb: 'KKD / Çalışan Kartları',
  entitlementMatrixTitle: 'KKD Hak Matrisi',
  entitlementMatrixDescription: 'Grup, görev ve periyot bazlı hak kurallarını tanımlayın.',
  entitlementMatrixBreadcrumb: 'KKD / Hak Matrisi',
  manualOverridesTitle: 'Manuel Ek Haklar',
  manualOverridesDescription: 'İstisnai durumlar için ek hak atamalarını yönetin.',
  manualOverridesBreadcrumb: 'KKD / Manuel Ek Haklar',
};
writeJson('src/features/kkd/localization/tr.json', kkdTr);
console.log('Updated kkd operational tr');

// subcontracting + transfer-chain locale files for other languages (copy en structure, keep EN text as fallback for de/fr/es/it/ar)
for (const lang of ['de', 'fr', 'es', 'it', 'ar']) {
  for (const feature of ['subcontracting', 'transfer-chain']) {
    const en = readJson(`src/features/${feature}/localization/en.json`);
    const target = `src/features/${feature}/localization/${lang}.json`;
    if (!fs.existsSync(path.join(ROOT, target))) {
      writeJson(target, en);
      console.log(`Created ${target} from en`);
    }
  }
}

console.log('Done.');
