import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const DE_PATH = path.join(ROOT, 'src/locales/de/common.json');
const EN_PATH = path.join(ROOT, 'src/locales/en/common.json');
const OVERRIDES_PATH = path.join(ROOT, 'scripts/de-manual-overrides.json');

const KEY_OVERRIDES = fs.existsSync(OVERRIDES_PATH)
  ? JSON.parse(fs.readFileSync(OVERRIDES_PATH, 'utf8'))
  : {};

const KEEP_AS_IS = new Set([
  '0',
  '••••••••',
  'VERII WMS',
  'ERP',
  'Excel',
  'PDF',
  'ID',
  'Dashboard',
  'System',
  'Transfer',
  'Lot',
  'Workflow',
  'Depot',
  'YapKodlar',
  '34ABC123',
  'Optional',
  'Details',
  'Detail',
  'Status',
  'Name',
  'Filter',
  'Türkçe',
  'Deutsch',
  'English',
  'Français',
  'Español',
  'Italiano',
  'العربية',
]);

const EN_TO_DE = {
  'Previous': 'Zurück',
  'Delete': 'Löschen',
  'Reset': 'Zurücksetzen',
  'Back': 'Zurück',
  'Add': 'Hinzufügen',
  'Over': 'Überschuss',
  'Breadcrumb': 'Brotkrumen-Navigation',
  'Delete operation failed.': 'Löschvorgang fehlgeschlagen.',
  'Packaging could not be deleted.': 'Verpackung konnte nicht gelöscht werden.',
  'Package could not be deleted.': 'Paket konnte nicht gelöscht werden.',
  'Package line could not be deleted.': 'Paketposition konnte nicht gelöscht werden.',
  'User could not be deleted.': 'Benutzer konnte nicht gelöscht werden.',
  'Bu işlem için yetkiniz yok.': 'Sie haben keine Berechtigung für diese Aktion.',
  'Kayıt başarıyla kaydedildi': 'Datensatz erfolgreich gespeichert',
  'Kayıt silindi': 'Datensatz gelöscht',
  'Pasif': 'Passiv',
  'Oluştur': 'Erstellen',
  'Send Reset Link': 'Link zum Zurücksetzen senden',
  'Back to login': 'Zurück zur Anmeldung',
  'Reset Password': 'Passwort zurücksetzen',
  'Invalid or missing reset link.': 'Ungültiger oder fehlender Link zum Zurücksetzen.',
  'Please enter a valid email address.': 'Bitte geben Sie eine gültige E-Mail-Adresse ein.',
  'Passwords do not match.': 'Passwörter stimmen nicht überein.',
  'Transfer Order List': 'Transferauftragsliste',
  'Subcontracting Receipt Transfer Parameters': 'Fremdfertigungseingang-Transferparameter',
  'Subcontracting Issue Transfer Parameters': 'Fremdfertigungsausgabe-Transferparameter',
  'Hangfire Monitoring': 'Hangfire-Überwachung',
  'Create Subcontracting Issue Order': 'Fremdfertigungsausgabeauftrag erstellen',
  'Create Subcontracting Receipt Order': 'Fremdfertigungseingangsauftrag erstellen',
  'Subcontracting Receipt List': 'Fremdfertigungseingangsliste',
  'Transfer / Create Production Transfer': 'Transfer / Produktionsumlagerung erstellen',
  'Quality Inspection Records': 'Qualitätsprüfungsprotokolle',
  'Quality Inspection List': 'Qualitätsprüfungsliste',
  'OCR Customer Stock Match': 'OCR-Kundenbestandsabgleich',
  'OCR Match Records': 'OCR-Abgleichdatensätze',
  'Yard Acceptance Control': 'Hofannahmekontrolle',
  'Check and Monitoring': 'Prüfung und Überwachung',
  'PPE Eligibility Check': 'PSA-Anspruchsprüfung',
  'PPE Manual Overrides': 'Manuelle PSA-Ausnahmen',
  'Linked Stock': 'Verknüpfter Bestand',
  'Stock Mirror': 'Bestandsspiegel',
  'Reject': 'Ablehnen',
  'No orders found for this customer': 'Keine Aufträge für diesen Kunden gefunden',
  'You can select order items to add to the goods receipt list': 'Sie können Auftragspositionen auswählen, die der Wareneingangsliste hinzugefügt werden sollen',
  'Return Code': 'Rückgabecode',
  'Audit': 'Prüfprotokoll',
  'Invalid quantity': 'Ungültige Menge',
  'Product collected': 'Produkt erfasst',
  'Invalid goods receipt order': 'Ungültiger Wareneingangsauftrag',
  'Camera could not be opened': 'Kamera konnte nicht geöffnet werden',
  'Delete Image': 'Bild löschen',
  'Plate is required for vehicle check-in.': 'Für die Fahrzeuganmeldung ist ein Kennzeichen erforderlich.',
  'Vehicle image deleted.': 'Fahrzeugbild gelöscht.',
  'Quick Check': 'Schnellprüfung',
  'No Check': 'Keine Prüfung',
  'Returned': 'Zurückgegeben',
  'Send to Return': 'Zur Rücksendung senden',
  'Add Line': 'Position hinzufügen',
  'No inspection lines added yet.': 'Es wurden noch keine Prüfpositionen hinzugefügt.',
  'Quality Inspection Form': 'Qualitätsprüfungsformular',
  'Review': 'Prüfen',
  'Return': 'Rücksenden',
  'Resolution': 'Auflösung',
  'Sipariş bazlı': 'Auftragsbasiert',
  'Stok bazlı': 'Bestandsbasiert',
  'Free Transfer': 'Freier Transfer',
  'An error occurred while creating transfer process': 'Beim Erstellen des Transferprozesses ist ein Fehler aufgetreten',
  'Detailed information of the transfer order': 'Detaillierte Informationen zum Transferauftrag',
  'Warehouse Information': 'Lagerinformationen',
  'Users to Perform Operation': 'Benutzer für die Durchführung des Vorgangs',
  'Select users to perform the operation': 'Benutzer für die Durchführung des Vorgangs auswählen',
  'Invalid transfer order': 'Ungültiger Transferauftrag',
  'Barcode deleted successfully': 'Barcode erfolgreich gelöscht',
  'Barcode could not be deleted': 'Barcode konnte nicht gelöscht werden',
  'Delete Product': 'Produkt löschen',
  'Transfer updated successfully': 'Transfer erfolgreich aktualisiert',
  'Invalid shipment order': 'Ungültiger Versandauftrag',
  'Enter your notes': 'Notizen eingeben',
  '🖱️ Left Click + Drag': '🖱️ Linksklick + Ziehen',
  '🖱️ Right Click + Drag': '🖱️ Rechtsklick + Ziehen',
  '🖱️ Scroll': '🖱️ Scrollen',
  '🖱️ Click Shelf': '🖱️ Regal anklicken',
  '3D warehouse view is heavy. To keep first render fast, model and stock layers load only when you request it.': 'Die 3D-Lageransicht ist ressourcenintensiv. Für eine schnelle erste Darstellung werden Modell- und Bestandsebenen erst bei Bedarf geladen.',
  'Load 3D View': '3D-Ansicht laden',
  'SIT Collection': 'SIT-Erfassung',
  'Invalid SIT order': 'Ungültiger SIT-Auftrag',
  'SRT Collection': 'SRT-Erfassung',
  'Invalid SRT order': 'Ungültiger SRT-Auftrag',
  'New Subcontracting Issue Order': 'Neuer Fremdfertigungsausgabeauftrag',
  'Edit Subcontracting Issue': 'Fremdfertigungsausgabe bearbeiten',
  'Update subcontracting issue header information without changing line or collection flow': 'Kopfdaten der Fremdfertigungsausgabe aktualisieren, ohne Positions- oder Erfassungsablauf zu ändern',
  'Subcontracting issue order updated successfully': 'Fremdfertigungsausgabeauftrag erfolgreich aktualisiert',
  'An error occurred while updating subcontracting issue order': 'Beim Aktualisieren des Fremdfertigungsausgabeauftrags ist ein Fehler aufgetreten',
  'Subcontracting Issue Order List': 'Fremdfertigungsausgabeauftragsliste',
  'Emirsiz Fason Çıkış İşlemi': 'Auftragslose Fremdfertigungsausgabe',
  'Fason çıkış işlemi oluşturuldu': 'Fremdfertigungsausgabe erfolgreich erstellt',
  'Fason çıkış işlemi oluşturulamadı': 'Fremdfertigungsausgabe konnte nicht erstellt werden',
  'Header + ImportLine + Route mantığında fason çıkış işlemi oluşturun.': 'Erstellen Sie eine Fremdfertigungsausgabe nach Header-, ImportLine- und Route-Logik.',
  'New Subcontracting Receipt Order': 'Neuer Fremdfertigungseingangsauftrag',
  'Edit Subcontracting Receipt': 'Fremdfertigungseingang bearbeiten',
  'Update subcontracting receipt header information without changing line or collection flow': 'Kopfdaten des Fremdfertigungseingangs aktualisieren, ohne Positions- oder Erfassungsablauf zu ändern',
  'Subcontracting receipt order updated successfully': 'Fremdfertigungseingangsauftrag erfolgreich aktualisiert',
  'An error occurred while updating subcontracting receipt order': 'Beim Aktualisieren des Fremdfertigungseingangsauftrags ist ein Fehler aufgetreten',
  'Delete Parameter': 'Parameter löschen',
  'Delete Packaging': 'Verpackung löschen',
  'Delete Package': 'Paket löschen',
  'Production plan could not be deleted.': 'Produktionsplan konnte nicht gelöscht werden.',
  'Production transfer could not be deleted.': 'Produktionsumlagerung konnte nicht gelöscht werden.',
  'We will soft delete "{{documentNo}}". Only draft plans with no shopfloor activity can be deleted.': '„{{documentNo}}“ wird per Soft Delete deaktiviert. Nur Entwurfspläne ohne Shopfloor-Aktivität können gelöscht werden.',
  'We will soft delete "{{documentNo}}". Only open transfers with no field processing can be deleted.': '„{{documentNo}}“ wird per Soft Delete deaktiviert. Nur offene Transfers ohne Feldverarbeitung können gelöscht werden.',
  'Template could not be deleted.': 'Vorlage konnte nicht gelöscht werden.',
  'Manual Overrides': 'Manuelle Ausnahmen',
  'Entitlement Check': 'Anspruchsprüfung',
  'You do not have permission for this action.': 'Sie haben keine Berechtigung für diese Aktion.',
};

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

function isBrokenGerman(value) {
  if (typeof value !== 'string') return false;
  return /\b(Löschen Product|Löschen Parameter|Löschen Verpackung|Löschen Paket|Löschen Image|Invalid SIT|Invalid SRT|Left Click|Right Click|Click Shelf|Load 3D|SIT Collection|SRT Collection|New Subcontracting|Edit Subcontracting|Subcontracting issue|Subcontracting receipt|Subcontracting Receipt Order List|Subcontracting Transfer Order|Fason|Emirsiz|Stok bazlı|Sipariş bazlı|Kayıt |Pasif|Oluştur|Einnahmen aus Produktgebühren|Soft Löschen|when an order|Hinzufügen transfer|subcontracting issue list|subcontracting receipt list|Toggle theme|Require All Order Items|Add New|All Statuses|Warehouse Code|Packing No|Matched Source|Source Type|Header Information|Previous Step|Configuration Code|Emirsiz Process|Stok Seçimi|Stoklar|Seçilen Kalemler|kalem|Stok kodu)\b/i.test(value);
}

function hasTurkish(value) {
  if (typeof value !== 'string') return false;
  if (/[çğışÇĞİŞ]/.test(value)) return true;
  return /\b(Fason|Emirsiz|Stok|Seçilen|Seçili|kalem|bulunmamaktadır|işlem|giriş|Kayıt|Pasif|Oluştur|Sipariş|mantığında|Stoklar|Stok kodu|Seçilenleri)\b/i.test(value);
}

function needsFix(current, enValue) {
  if (typeof current !== 'string') return false;
  if (KEEP_AS_IS.has(current) || KEEP_AS_IS.has(enValue)) return false;
  if (current === enValue) return true;
  if (hasTurkish(current) || hasTurkish(enValue)) return true;
  if (isBrokenGerman(current)) return true;
  return false;
}

function resolveTranslation(key, current, enValue) {
  if (KEY_OVERRIDES[key]) return KEY_OVERRIDES[key];
  if (typeof enValue === 'string' && EN_TO_DE[enValue]) return EN_TO_DE[enValue];
  if (typeof current === 'string' && EN_TO_DE[current]) return EN_TO_DE[current];
  if (typeof enValue === 'string' && KEEP_AS_IS.has(enValue)) return enValue;
  if (typeof current === 'string' && KEEP_AS_IS.has(current)) return current;
  return null;
}

function main() {
  const enFlat = flatten(JSON.parse(fs.readFileSync(EN_PATH, 'utf8')));
  const deFlat = flatten(JSON.parse(fs.readFileSync(DE_PATH, 'utf8')));

  for (const [key, enValue] of Object.entries(enFlat)) {
    if (!(key in deFlat)) {
      deFlat[key] = enValue;
    }
  }

  let fixed = 0;
  let unresolved = [];

  for (const [key, enValue] of Object.entries(enFlat)) {
    const current = deFlat[key];
    if (!needsFix(current, enValue)) continue;

    const next = resolveTranslation(key, current, enValue);
    if (next && next !== current) {
      deFlat[key] = next;
      fixed += 1;
    } else if (needsFix(current, enValue) && !KEEP_AS_IS.has(String(enValue)) && !KEEP_AS_IS.has(String(current))) {
      unresolved.push({ key, en: enValue, de: current });
    }
  }

  fs.writeFileSync(DE_PATH, `${JSON.stringify(unflatten(deFlat), null, 2)}\n`);
  console.log(`Fixed: ${fixed}`);
  console.log(`Unresolved: ${unresolved.length}`);
  if (unresolved.length > 0) {
    fs.writeFileSync(path.join(ROOT, 'scripts/de-unresolved.json'), JSON.stringify(unresolved, null, 2));
    console.log(unresolved.slice(0, 20).map((item) => item.key).join(', '));
  }
}

main();
