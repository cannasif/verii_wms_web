import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const EN_PATH = path.join(ROOT, 'src/locales/en/common.json');
const DE_PATH = path.join(ROOT, 'src/locales/de/common.json');
const TR_PATH = path.join(ROOT, 'src/locales/tr/common.json');
const OVERRIDES_PATH = path.join(ROOT, 'scripts/de-manual-overrides.json');
const PATCH_PATH = path.join(ROOT, 'scripts/operations-de-patch.json');

const OPS_ROOTS = new Set([
  'goodsReceipt',
  'warehouse',
  'subcontracting',
  'qualityControl',
  'transfer',
  'production',
  'productionTransfer',
  'shipment',
  'package',
  'serviceAllocation',
  'inventoryCount',
  'vehicleCheckIn',
  'ocrGoodsReceiptMatch',
  'steelGoodReceiptAcceptance',
  'sacMalKabul',
  'kkd',
]);

const KEEP_AS_IS = new Set([
  'ERP',
  'ID',
  'PDF',
  'Excel',
  'QR',
  'WMS',
  'LOT',
  'API',
  'KKD',
  'OCR',
  'YapKod',
  'Netsis',
  'Hangfire',
  'Dashboard',
  'Status',
  'Name',
  'Filter',
  'Details',
  'Optional',
  'Transfer',
  'Workflow',
  'Depot',
  'System',
  'Backflush',
  'Hybrid',
  'Serial',
  'Parallel',
  'Manual',
  'Mode',
  'Source',
  'Target',
  'Output',
  'Input',
  'Lag {{minutes}} min',
  'PR_HEADER',
  'PR_ORDER',
  'PR_ORDER_OUTPUT',
  'PR_ORDER_CONSUMPTION',
  'PR_HEADER_ASSIGNMENT',
  'SIT',
  'SRT',
  'PT',
]);

const EXACT = {
  Previous: 'Zurück',
  Next: 'Weiter',
  Delete: 'Löschen',
  Reset: 'Zurücksetzen',
  Back: 'Zurück',
  Add: 'Hinzufügen',
  View: 'Anzeigen',
  Reject: 'Ablehnen',
  Approve: 'Genehmigen',
  Details: 'Details anzeigen',
  Actions: 'Aktionen',
  Status: 'Status',
  Create: 'Erstellen',
  Edit: 'Bearbeiten',
  Update: 'Aktualisieren',
  Save: 'Speichern',
  Cancel: 'Abbrechen',
  Clear: 'Leeren',
  Search: 'Suchen',
  Close: 'Schließen',
  Open: 'Offen',
  Completed: 'Abgeschlossen',
  Draft: 'Entwurf',
  Required: 'Erforderlich',
  Optional: 'Optional',
  Loading: 'Wird geladen...',
  'No data': 'Keine Daten',
  'Document No': 'Belegnummer',
  'Document Date': 'Belegdatum',
  'Plan No': 'Plannummer',
  'Order No': 'Auftragsnummer',
  'Main Stock': 'Hauptbestand',
  'Main YapKod': 'Haupt-YapKod',
  Planned: 'Geplant',
  Quantity: 'Menge',
  Stock: 'Bestand',
  Warehouse: 'Lager',
  Description: 'Beschreibung',
  Note: 'Notiz',
  Type: 'Typ',
  Unit: 'Einheit',
  Customer: 'Kunde',
  Supplier: 'Lieferant',
  Priority: 'Priorität',
  'Project Code': 'Projektcode',
  'Source warehouse': 'Quelllager',
  'Target warehouse': 'Ziellager',
  'Quick entry': 'Schnellerfassung',
  'Manual planning': 'Manuelle Planung',
  'Update mode': 'Aktualisierungsmodus',
  'Clone mode': 'Kopiermodus',
  'Permission information': 'Berechtigungshinweis',
  'Add order': 'Auftrag hinzufügen',
  'Add assignment': 'Zuweisung hinzufügen',
  'Add output': 'Output hinzufügen',
  'Add consumption': 'Verbrauch hinzufügen',
  'Add dependency': 'Abhängigkeit hinzufügen',
  'Add scope': 'Bereich hinzufügen',
  'Add Line': 'Position hinzufügen',
  'Edit Count Order': 'Inventurauftrag bearbeiten',
  'Blind count': 'Blindinventur',
  'Open count': 'Offene Inventur',
  'Apply Mode': 'Anwendungsmodus',
  Select: 'Auswählen',
  Selected: 'Ausgewählt',
  'Select all': 'Alle auswählen',
  Review: 'Prüfen',
  Return: 'Rücksenden',
  Resolution: 'Auflösung',
  'Quick Check': 'Schnellprüfung',
  'No Check': 'Keine Prüfung',
  Returned: 'Zurückgegeben',
  Tracking: 'Nachverfolgung',
  Qty: 'Menge',
  Order: 'Auftrag',
  Orders: 'Aufträge',
  Outputs: 'Outputs',
  Consumption: 'Verbrauch',
  Dependencies: 'Abhängigkeiten',
  'New order': 'Neuer Auftrag',
  'No stock selected': 'Kein Bestand ausgewählt',
  'Order no.': 'Auftragsnr.',
  'Order type': 'Auftragstyp',
  'Stock to produce': 'Zu produzierender Bestand',
  'YapKod to produce': 'Zu produzierender YapKod',
  'Sequence no.': 'Sequenznr.',
  'Allow manual start': 'Manuellen Start erlauben',
  'Auto-start when dependencies done': 'Autostart nach Abhängigkeiten',
  'Consumption stock': 'Verbrauchsbestand',
  Predecessor: 'Vorgänger',
  Successor: 'Nachfolger',
  'Lag (min)': 'Verzögerung (Min.)',
  'Output ready': 'Output bereit',
  'Transfer ready': 'Transfer bereit',
  'Serial entry': 'Serieneingabe',
  'User ID': 'Benutzer-ID',
  'Role ID': 'Rollen-ID',
  'Team ID': 'Team-ID',
  'Plan type': 'Plantyp',
  'Execution mode': 'Ausführungsmodus',
  'Planned start': 'Geplanter Start',
  'Planned end': 'Geplantes Ende',
  'Planned quantity': 'Geplante Menge',
  'Main product code': 'Hauptproduktcode',
  'Fill fields': 'Felder ausfüllen',
  'Load by work order': 'Über Arbeitsauftrag laden',
  'Load by stock': 'Über Bestand laden',
  'Plan header': 'Plan-Kopf',
  'Production orders': 'Fertigungsaufträge',
  'Planned outputs': 'Geplante Outputs',
  'Planned consumption': 'Geplanter Verbrauch',
  'Order assignments': 'Auftragszuweisungen',
  'Order dependencies': 'Auftragsabhängigkeiten',
  'Order {{index}}': 'Auftrag {{index}}',
  'Drag to reorder': 'Ziehen zum Neuordnen',
  'Expand stage details': 'Stufendetails erweitern',
  'Collapse stage details': 'Stufendetails einklappen',
  'Create Production Plan': 'Produktionsplan erstellen',
  'Edit Production Plan': 'Produktionsplan bearbeiten',
  'Create Production Transfer Order': 'Produktionsumlagerungsauftrag erstellen',
  'Edit Production Transfer Order': 'Produktionsumlagerungsauftrag bearbeiten',
  'Clone Production Transfer Order': 'Produktionsumlagerungsauftrag kopieren',
  'Production Plans Awaiting Approval': 'Produktionspläne auf Genehmigung wartend',
  'Production plan saved': 'Produktionsplan gespeichert',
  'Production plan updated': 'Produktionsplan aktualisiert',
  'Production plan could not be saved': 'Produktionsplan konnte nicht gespeichert werden',
  'Production plan approved successfully': 'Produktionsplan erfolgreich genehmigt',
  'Production plan could not be approved': 'Produktionsplan konnte nicht genehmigt werden',
  'Production plan rejected successfully': 'Produktionsplan erfolgreich abgelehnt',
  'Production plan could not be rejected': 'Produktionsplan konnte nicht abgelehnt werden',
  'An error occurred while loading data': 'Beim Laden der Daten ist ein Fehler aufgetreten.',
  'Goods Receipt Process': 'Wareneingangsprozess',
  'Goods receipt process created successfully': 'Wareneingangsprozess erfolgreich erstellt',
  'An error occurred while creating goods receipt process':
    'Beim Erstellen des Wareneingangsprozesses ist ein Fehler aufgetreten.',
  'Basic Information': 'Grundinformationen',
  'Stock Selection': 'Bestandsauswahl',
  'Unknown step': 'Unbekannter Schritt',
  'Order Based': 'Bestellbasiert',
  'Stock Based': 'Bestandsbasiert',
  'Goods Receipt Orders Awaiting Approval': 'Wareneingangsaufträge auf Genehmigung wartend',
  'Goods Receipt Direct Entry': 'Wareneingang Direkterfassung',
  'Goods Receipt List': 'Wareneingangsliste',
  'Create Shipment Order': 'Versandauftrag erstellen',
  'Create Production Order': 'Fertigungsauftrag erstellen',
  'Assigned Production Orders': 'Zugewiesene Fertigungsaufträge',
  'Production Approval': 'Produktionsgenehmigung',
  'Production List': 'Produktionsliste',
  'Transfer Order List': 'Transferauftragsliste',
  'Subcontracting Issue Order List': 'Fremdfertigungsausgabeauftragsliste',
  'Subcontracting Receipt Order List': 'Fremdfertigungseingangsauftragsliste',
  'Warehouse Information': 'Lagerinformationen',
  'Invalid transfer order': 'Ungültiger Transferauftrag',
  'Invalid shipment order': 'Ungültiger Versandauftrag',
  'Invalid goods receipt order': 'Ungültiger Wareneingangsauftrag',
  'Invalid quantity': 'Ungültige Menge',
  'Product collected': 'Produkt erfasst',
  'Camera could not be opened': 'Kamera konnte nicht geöffnet werden',
  'No orders found for this customer': 'Keine Bestellungen für diesen Kunden gefunden',
  'You can select order items to add to the goods receipt list':
    'Sie können Auftragspositionen auswählen, die der Wareneingangsliste hinzugefügt werden sollen',
  'Return Code': 'Rückgabecode',
  Audit: 'Prüfprotokoll',
  'Quality Inspection Form': 'Qualitätsprüfungsformular',
  'No inspection lines added yet.': 'Es wurden noch keine Prüfpositionen hinzugefügt.',
  'Quality Inspection List': 'Qualitätsprüfungsliste',
  'Quality Inspection Records': 'Qualitätsprüfungsprotokolle',
  'Free Transfer': 'Freier Transfer',
  'Enter your notes': 'Notizen eingeben',
  'Delete Parameter': 'Parameter löschen',
  'Delete Packaging': 'Verpackung löschen',
  'Delete Package': 'Paket löschen',
  'Delete Image': 'Bild löschen',
  'Could not load ERP template': 'ERP-Vorlage konnte nicht geladen werden',
  'Save readiness': 'Speicherbereitschaft',
  'Review before saving': 'Vor dem Speichern prüfen',
  'Quick entry is only the start': 'Schnellerfassung ist nur der Anfang',
  'Plan assignments': 'Planzuweisungen',
  'Total output qty': 'Gesamte Output-Menge',
  'Total consumption qty': 'Gesamte Verbrauchsmenge',
  'Main stock': 'Hauptbestand',
  'Production process': 'Produktionsprozess',
  'Production Plans Awaiting Approval': 'Produktionspläne auf Genehmigung wartend',
};

const PHRASES = [
  ['Goods Receipt', 'Wareneingang'],
  ['Goods receipt', 'Wareneingang'],
  ['Warehouse inbound', 'Lagerzugang'],
  ['Warehouse outbound', 'Lagerabgang'],
  ['Warehouse Inbound', 'Lagerzugang'],
  ['Warehouse Outbound', 'Lagerabgang'],
  ['Shipment', 'Versand'],
  ['Subcontracting', 'Fremdfertigung'],
  ['Production Transfer', 'Produktionsumlagerung'],
  ['Production Plan', 'Produktionsplan'],
  ['Production plan', 'Produktionsplan'],
  ['Production', 'Produktion'],
  ['Inventory Count', 'Inventur'],
  ['Inventory count', 'Inventur'],
  ['Quality Control', 'Qualitätskontrolle'],
  ['Service Allocation', 'Servicezuweisung'],
  ['Vehicle Check-In', 'Fahrzeuganmeldung'],
  ['Awaiting Approval', 'auf Genehmigung wartend'],
  ['Awaiting ERP Approval', 'auf ERP-Genehmigung wartend'],
  ['Assigned ', 'Zugewiesene '],
  ['Assigned', 'Zugewiesen'],
  ['Create ', 'Erstellen '],
  ['Edit ', 'Bearbeiten '],
  ['Delete ', 'Löschen '],
  ['Add ', 'Hinzufügen '],
  ['Update ', 'Aktualisieren '],
  ['Select ', 'Auswählen '],
  ['Search ', 'Suchen '],
  ['Manage ', 'Verwalten '],
  ['Define ', 'Definieren '],
  ['Review ', 'Prüfen '],
  ['Open ', 'Öffnen '],
  ['List', 'Liste'],
  ['Orders', 'Aufträge'],
  ['Order', 'Auftrag'],
  ['Lines', 'Positionen'],
  ['Line', 'Position'],
  ['Serial', 'Seriennummer'],
  ['Warehouse', 'Lager'],
  ['Document', 'Beleg'],
  ['Stock', 'Bestand'],
  ['Quantity', 'Menge'],
  ['Description', 'Beschreibung'],
  ['Approval', 'Genehmigung'],
  ['Process', 'Prozess'],
  ['Direct Entry', 'Direkterfassung'],
  ['shopfloor', 'Shopfloor'],
  ['dependencies', 'Abhängigkeiten'],
  ['dependency', 'Abhängigkeit'],
  ['consumption', 'Verbrauch'],
  ['output', 'Output'],
  ['outputs', 'Outputs'],
  ['transfer', 'Transfer'],
  ['transfers', 'Transfers'],
  ['operator', 'Operator'],
  ['operators', 'Operatoren'],
  ['stage', 'Stufe'],
  ['stages', 'Stufen'],
  ['parallel', 'Parallel'],
  ['serial', 'Seriell'],
  ['hybrid', 'Hybrid'],
  ['manual', 'Manuell'],
  ['planned', 'Geplant'],
  ['completed', 'Abgeschlossen'],
  ['permission', 'Berechtigung'],
  ['permissions', 'Berechtigungen'],
  ['could not be loaded', 'konnte nicht geladen werden'],
  ['could not be saved', 'konnte nicht gespeichert werden'],
  ['could not be created', 'konnte nicht erstellt werden'],
  ['could not be updated', 'konnte nicht aktualisiert werden'],
  ['could not be deleted', 'konnte nicht gelöscht werden'],
  ['could not be approved', 'konnte nicht genehmigt werden'],
  ['could not be rejected', 'konnte nicht abgelehnt werden'],
  ['successfully', 'erfolgreich'],
  ['An error occurred while', 'Beim'],
  ['while loading', 'beim Laden'],
  ['while creating', 'beim Erstellen'],
  ['while updating', 'beim Aktualisieren'],
  ['Search by', 'Suchen nach'],
  ['searchPlaceholder', 'Suchen nach'],
  ['noData', 'Keine Daten'],
  ['No ', 'Keine '],
  ['no ', 'keine '],
  [' not ', ' nicht '],
  [' is ', ' ist '],
  [' are ', ' sind '],
  [' you ', ' Sie '],
  [' You ', ' Sie '],
  [' your ', ' Ihre '],
  [' this ', ' dieser '],
  [' This ', ' Dieser '],
  [' the ', ' der '],
  [' The ', ' Der '],
  [' for ', ' für '],
  [' with ', ' mit '],
  [' from ', ' von '],
  [' to ', ' zu '],
  [' and ', ' und '],
  [' or ', ' oder '],
  [' if ', ' wenn '],
  [' when ', ' wenn '],
  [' before ', ' vor '],
  [' after ', ' nach '],
  [' then ', ' dann '],
  [' first ', ' zuerst '],
  [' next ', ' nächste '],
  [' current ', ' aktuelle '],
  [' selected ', ' ausgewählte '],
  [' required', ' erforderlich'],
  [' optional', ' optional'],
  [' missing', ' fehlt'],
  [' empty', ' leer'],
  [' saved', ' gespeichert'],
  [' updated', ' aktualisiert'],
  [' created', ' erstellt'],
  [' deleted', ' gelöscht'],
  [' loaded', ' geladen'],
  [' approved', ' genehmigt'],
  [' rejected', ' abgelehnt'],
  [' completed', ' abgeschlossen'],
  [' open', ' offen'],
  [' draft', ' Entwurf'],
  [' clone', ' Kopie'],
  [' copy', ' Kopie'],
  [' template', ' Vorlage'],
  [' suggestion', ' Vorschlag'],
  [' suggestions', ' Vorschläge'],
  [' scope', ' Bereich'],
  [' cell', ' Fach'],
  [' rack', ' Regal'],
  [' count mode', ' Inventurmodus'],
  [' count type', ' Inventurtyp'],
  [' count order', ' Inventurauftrag'],
  [' packaging', ' Verpackung'],
  [' package', ' Paket'],
  [' shipment', ' Versand'],
  [' subcontracting', ' Fremdfertigung'],
  [' inspection', ' Inspektion'],
  [' quarantine', ' Quarantäne'],
  [' rule', ' Regel'],
  [' rules', ' Regeln'],
  [' parameter', ' Parameter'],
  [' settings', ' Einstellungen'],
  [' service', ' Service'],
  [' allocation', ' Zuweisung'],
  [' document', ' Beleg'],
  [' header', ' Kopf'],
  [' subtitle', ' Untertitel'],
  [' title', ' Titel'],
  [' hint', ' Hinweis'],
  [' guide', ' Leitfaden'],
  [' summary', ' Zusammenfassung'],
  [' review', ' Prüfung'],
  [' detail', ' Detail'],
  [' details', ' Details'],
  [' information', ' Informationen'],
  [' configuration', ' Konfiguration'],
  [' validation', ' Validierung'],
  [' monitoring', ' Überwachung'],
  [' report', ' Bericht'],
  [' reports', ' Berichte'],
  [' linked', ' Verknüpft'],
  [' link', ' Verknüpfung'],
  [' purpose', ' Zweck'],
  [' role', ' Rolle'],
  [' source', ' Quelle'],
  [' target', ' Ziel'],
  [' warehouse', ' Lager'],
  [' stock', ' Bestand'],
  [' quantity', ' Menge'],
  [' line', ' Position'],
  [' lines', ' Positionen'],
  [' item', ' Artikel'],
  [' items', ' Artikel'],
  [' user', ' Benutzer'],
  [' users', ' Benutzer'],
  [' customer', ' Kunde'],
  [' supplier', ' Lieferant'],
  [' project', ' Projekt'],
  [' plan', ' Plan'],
  [' order', ' Auftrag'],
  [' orders', ' Aufträge'],
  [' production', ' Produktion'],
  [' transfer', ' Transfer'],
  [' inbound', ' Zugang'],
  [' outbound', ' Abgang'],
  [' receipt', ' Eingang'],
  [' issue', ' Ausgabe'],
  [' approval', ' Genehmigung'],
  [' assigned', ' Zugewiesen'],
  [' process', ' Prozess'],
  [' operation', ' Operation'],
  [' operations', ' Operationen'],
];

function flatten(obj, prefix = '', out = {}) {
  for (const [key, value] of Object.entries(obj ?? {})) {
    const nextKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      flatten(value, nextKey, out);
    } else {
      out[nextKey] = value;
    }
  }
  return out;
}

function unflatten(flat) {
  const root = {};
  for (const [key, value] of Object.entries(flat)) {
    const parts = key.split('.');
    let current = root;
    for (let index = 0; index < parts.length - 1; index += 1) {
      current[parts[index]] = current[parts[index]] ?? {};
      current = current[parts[index]];
    }
    current[parts.at(-1)] = value;
  }
  return root;
}

function isOpsKey(key) {
  const root = key.split('.')[0];
  if (OPS_ROOTS.has(root)) return true;
  if (key.startsWith('sidebar.')) {
    return /goodsReceipt|warehouse|subcontract|transfer|production|shipment|package|service|quality|inventoryCount|operations|inbound|outbound|bilginoglu|kkd|vehicleCheckIn|ocr|sacMalKabul|steelGood/i.test(
      key,
    );
  }
  return false;
}

function hasTurkish(value) {
  if (typeof value !== 'string') return false;
  if (/[çğışÇĞİŞ]/.test(value)) return true;
  return /\b(Fason|Emirsiz|Stok|Seçilen|Seçili|kalem|bulunmamaktadır|işlem|giriş|Kayıt|Pasif|Oluştur|Sipariş|Stoklar|Uretim|Asama|Planlama|Planlamaci|depo sec|ana urun|is emri|Bu ekran|Transfer Amaci|Transfer Rehberi|tuketim|cikti|akis|hucre|atanmis|bulunamadi|olustur|guncelle|miktar|sorumlu|operasyon|netsis|operator taraf|kayit aninda|henuz|lutfen|secin|secimi|yapkod|gelismis|modu|temel|paralel|seri|karma|montaj|govde|paketleme|birlestir|mal kabul|sevkiyat|onay|islem|listesi|emri|plani|kaynak|hedef|stok|satir|kullanici|rol sec|urun|acik|giris|cikis|sayim|kalite|karantina|fis|irsaliye|mamul|hammadde|yari|fire|iade|besle|tasima|tasin|vergi|fatura|degil|goster|yukle|giril|guncel|tamamla|baslat|bitir|devam|iptal|kopya|taslak|tasiy|uret|icin|veya|once|sonra|nasil|nedir|yap|yapiyor|belge|satir|not|aciklam|ornek|ornegin|ilk |son |her |bu |bir |icin |gibi |olarak |degil |henuz |lutfen |secili |secilen |ekle |sil |temizle |ara\b|yukle|kayit|goster|giril|guncel|tamamla|baslat|bitir|devam|iptal|kopya|taslak|tasiy|tasin)\b/i.test(
    value,
  );
}

function isGoodGerman(value, enValue) {
  if (typeof value !== 'string' || !value.trim()) return false;
  if (value === enValue && !KEEP_AS_IS.has(value)) return false;
  if (hasTurkish(value)) return false;
  if (/[äöüßÄÖÜ]/.test(value)) return true;
  if (
    /\b(nicht|für|wurde|konnte|Bitte|Speichern|Abbrechen|Löschen|Bearbeiten|Hinzufügen|Wird|geladen|Fehler|Erfolg|Seite|Suche|Filtern|Lager|Bestand|Benutzer|Berechtigung|Datensatz|Wareneingang|Versand|Produktion|Inventur|Qualität|Dokument|Genehmigung|Prozess|Direkterfassung|Position|Auftrag|Transfer|Operator|Stufe|Geplant|Abgeschlossen|Entwurf|Optional|Erforderlich|Keine|Kein|Auswählen|Aktualisieren|Erstellen|Verwalten|Definieren|Prüfen|Zurück|Weiter|Schließen|Öffnen|Beschreibung|Menge|Einheit|Kunde|Lieferant|Projekt|Plan|Zweck|Quelle|Ziel|Verbrauch|Abhängigkeit|Zuweisung|Leitfaden|Hinweis|Zusammenfassung|Informationen|Konfiguration|Validierung|Bericht|Verknüpft|Fremdfertigung|Inspektion|Quarantäne|Regel|Parameter|Einstellungen|Service|Beleg|Kopf|Untertitel|Detail|Details|Seriennummer|Fach|Regal|Inventur|Verpackung|Paket|Zugang|Abgang|Eingang|Ausgabe|Zugewiesen|Operation|Operationen|Shopfloor|Autostart|Manuell|Parallel|Seriell|Hybrid|Schnellerfassung|Speicherbereitschaft|Fertigungsauftrag|Produktionsplan|Produktionsumlagerung|Materialzuführung|Halbfertigware|Fertigware|Umlagerung|Vorschlag|Vorschläge|Bereich|Blindinventur|Offene|Anwendungsmodus|Prüfprotokoll|Rückgabecode|Ungültig|Ungültige|erfolgreich|fehlgeschlagen|ausstehend|zugewiesen|verfügbar|erforderlich|optional|gespeichert|gelöscht|aktualisiert|erstellt|geladen|ausgewählt|genehmigt|abgelehnt|Belegnummer|Belegdatum|Plannummer|Auftragsnummer|Hauptbestand|Quelllager|Ziellager|Wareneingangs|Versandauftrag|Transferauftrag|Fremdfertigungs|Qualitätsprüfung|Qualitätsparameter|Servicere|Fahrzeuganmeldung|Inventurauftrag|Produktionsbedarf|Transferzweck|Positionsrolle|Quellfach|Zielfach|Gesamtmenge|Kopfinformationen|Materialbezogene|Zuführung|Halbfertigwarentransport|Fertigwareneinlagerung|Zusammenhang|Verknüpfen|Verbrauch versorgen|Erzeugnis bewegen|Rückführung|Ausschusstransport|Bildschirm|Nach|Von|Mit|Der|Die|Das|Den|Dem|Des|Eine|Ein|Einen|Einem|Einer|Sie|Ihre|Ihr|Dieser|Diese|Dieses|Wählen|Wählen Sie|Geben Sie|Legen Sie fest|Laden Sie|Definieren Sie|Verwalten Sie|Prüfen Sie|Erstellen Sie|Bearbeiten Sie|Aktualisieren Sie|Speichern Sie|Fügen Sie|Ersetzen Sie|Entfernen Sie|Nutzen Sie|Sehen Sie|Klicken Sie|Ziehen Sie|Nutzen|Nutzt|Wird genutzt|Steuert|Bewegt|Deckt|Hilft|Macht|Erzeugt|Schlägt vor|Enthält|Beinhaltet|Zeigt|Gibt|Weiß|Kann|Können|Müssen|Soll|Sollen|Darf|Dürfen|Haben|Hat|War|Waren|Wird|Werden|Wurde|Wurden|Konnte|Konnten|Enthält|Enthalten)\b/i.test(
      value,
    )
  ) {
    return true;
  }
  return false;
}

function translatePhraseRules(text) {
  let result = text;
  for (const [from, to] of PHRASES) {
    result = result.split(from).join(to);
  }
  return result;
}

function translateErrorPattern(text) {
  const patterns = [
    [/^(.+) could not be loaded\.$/, '$1 konnte nicht geladen werden.'],
    [/^(.+) list could not be loaded\.$/, '$1-Liste konnte nicht geladen werden.'],
    [/^(.+) detail could not be loaded\.$/, '$1-Details konnten nicht geladen werden.'],
    [/^(.+) could not be saved\.$/, '$1 konnte nicht gespeichert werden.'],
    [/^(.+) could not be created\.$/, '$1 konnte nicht erstellt werden.'],
    [/^(.+) could not be updated\.$/, '$1 konnte nicht aktualisiert werden.'],
    [/^(.+) could not be deleted\.$/, '$1 konnte nicht gelöscht werden.'],
    [/^(.+) could not be approved\.$/, '$1 konnte nicht genehmigt werden.'],
    [/^(.+) could not be rejected\.$/, '$1 konnte nicht abgelehnt werden.'],
    [/^Assigned (.+) list could not be loaded\.$/, 'Zugewiesene $1-Liste konnte nicht geladen werden.'],
    [/^(.+) orders awaiting approval could not be loaded\.$/, '$1-Aufträge zur Genehmigung ausstehend konnten nicht geladen werden.'],
    [/^(.+) plans awaiting approval could not be loaded\.$/, '$1-Pläne zur Genehmigung ausstehend konnten nicht geladen werden.'],
    [/^Search by (.+)$/, 'Suchen nach $1'],
    [/^Manage (.+)\.$/, 'Verwalten Sie $1.'],
    [/^Define (.+)\.$/, 'Definieren Sie $1.'],
    [/^Select (.+)\.$/, 'Wählen Sie $1 aus.'],
    [/^Review (.+)\.$/, 'Prüfen Sie $1.'],
    [/^You need (.+) permission to (.+) this (.+)\.$/, 'Zum $2 dieses $3 ist die Berechtigung $1 erforderlich.'],
    [/^You can (.+)\.$/, 'Sie können $1.'],
    [/^This (.+) has already been saved\..+$/, 'Dieser $1 wurde bereits gespeichert.'],
    [/^There are no (.+) yet\..+$/, 'Es gibt noch keine $1.'],
    [/^No (.+) found( for (.+))?\.$/, 'Keine $1 gefunden$3.'],
    [/^An error occurred while (.+)\.$/, 'Beim $1 ist ein Fehler aufgetreten.'],
  ];

  for (const [pattern, replacement] of patterns) {
    if (pattern.test(text)) {
      return text.replace(pattern, replacement);
    }
  }
  return null;
}

function translateLocal(text) {
  if (typeof text !== 'string') return text;
  if (KEEP_AS_IS.has(text)) return text;
  if (EXACT[text]) return EXACT[text];

  const errorTranslation = translateErrorPattern(text);
  if (errorTranslation) return translatePhraseRules(errorTranslation);

  const phraseTranslation = translatePhraseRules(text);
  if (phraseTranslation !== text) {
    const englishWords = phraseTranslation.match(/\b[A-Za-z]{4,}\b/g) ?? [];
    const germanHints = phraseTranslation.match(
      /\b(nicht|für|wurde|konnte|Bitte|Speichern|Lager|Bestand|Auftrag|Transfer|Produktion|Position|Verbrauch|Genehmigung|Berechtigung|Definieren|Verwalten|Prüfen|Auswählen|Erstellen|Bearbeiten|Aktualisieren|Keine|Kein|Sie|Ihre|Der|Die|Das|Wählen|Geben|Laden|Hinzufügen|Ersetzen|Entfernen|Nutzen|Zeigt|Gibt|Kann|Müssen|Wird|Wurde|Konnte|erfolgreich|fehlgeschlagen|ausstehend|zugewiesen|erforderlich|optional|gespeichert|geladen|genehmigt|abgelehnt|Wareneingang|Versand|Inventur|Qualität|Fremdfertigung|Inspektion|Quarantäne|Service|Beleg|Plan|Zweck|Quelle|Ziel|Operator|Stufe|Geplant|Abgeschlossen|Entwurf|Schnellerfassung|Shopfloor|Autostart|Manuell|Parallel|Seriell|Hybrid|Material|Halbfertigware|Fertigware|Umlagerung|Vorschlag|Bereich|Fach|Regal|Verpackung|Paket|Zugang|Abgang|Eingang|Ausgabe|Zugewiesen|Operation|Operationen|Produktionsplan|Produktionsumlagerung|Fertigungsauftrag|Transferzweck|Positionsrolle|Quellfach|Zielfach|Gesamtmenge|Kopfinformationen|Materialzuführung|Halbfertigwarentransport|Fertigwareneinlagerung|Zusammenhang|Verknüpfen|Verbrauch|Abhängigkeit|Zuweisung|Leitfaden|Hinweis|Zusammenfassung|Informationen|Konfiguration|Validierung|Bericht|Verknüpft|Parameter|Einstellungen|Bildschirm|Nach|Von|Mit)\b/gi,
    );
    if ((germanHints?.length ?? 0) >= 1 && englishWords.length <= Math.max(3, (germanHints?.length ?? 0) + 2)) {
      return phraseTranslation;
    }
  }

  return null;
}

function needsFix(current, enValue, trValue) {
  if (typeof current !== 'string') return false;
  if (KEEP_AS_IS.has(current)) return false;
  if (isGoodGerman(current, enValue)) return false;
  if (current === trValue && trValue !== enValue) return true;
  if (current === enValue && typeof enValue === 'string' && enValue.length > 0) return true;
  if (hasTurkish(current)) return true;
  return false;
}

function resolveTranslation(key, sourceText) {
  if (KEY_OVERRIDES[key]) return KEY_OVERRIDES[key];
  if (PATCH_OVERRIDES[key]) return PATCH_OVERRIDES[key];
  if (typeof sourceText === 'string' && EXACT[sourceText]) return EXACT[sourceText];
  const local = translateLocal(sourceText);
  if (local && local !== sourceText && !hasTurkish(local)) return local;
  return null;
}

const KEY_OVERRIDES = fs.existsSync(OVERRIDES_PATH)
  ? JSON.parse(fs.readFileSync(OVERRIDES_PATH, 'utf8'))
  : {};
const PATCH_OVERRIDES = fs.existsSync(PATCH_PATH)
  ? JSON.parse(fs.readFileSync(PATCH_PATH, 'utf8'))
  : {};

const enFlat = flatten(JSON.parse(fs.readFileSync(EN_PATH, 'utf8')));
const trFlat = flatten(JSON.parse(fs.readFileSync(TR_PATH, 'utf8')));
const deFlat = flatten(JSON.parse(fs.readFileSync(DE_PATH, 'utf8')));

let fixed = 0;
let skippedGood = 0;
let unresolved = [];

for (const [key, enValue] of Object.entries(enFlat)) {
  if (!isOpsKey(key)) continue;
  const current = deFlat[key] ?? enValue;
  const trValue = trFlat[key];
  if (!needsFix(current, enValue, trValue)) {
    skippedGood += 1;
    continue;
  }

  const sourceText =
    typeof enValue === 'string' && enValue !== trValue && !hasTurkish(enValue)
      ? enValue
      : typeof trValue === 'string'
        ? trValue
        : enValue;

  const next = resolveTranslation(key, sourceText);
  if (next && next !== current && !hasTurkish(next)) {
    deFlat[key] = next;
    fixed += 1;
  } else if (needsFix(current, enValue, trValue)) {
    unresolved.push({ key, en: enValue, tr: trValue, de: current, source: sourceText });
  }
}

fs.writeFileSync(DE_PATH, `${JSON.stringify(unflatten(deFlat), null, 2)}\n`);
fs.writeFileSync(
  path.join(ROOT, 'scripts/operations-de-unresolved.json'),
  JSON.stringify(unresolved, null, 2),
);

console.log(`Fixed: ${fixed}`);
console.log(`Already good: ${skippedGood}`);
console.log(`Unresolved: ${unresolved.length}`);
if (unresolved.length > 0) {
  console.log(unresolved.slice(0, 25).map((item) => item.key).join('\n'));
}
