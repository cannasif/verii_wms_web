import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const EN_PATH = path.join(ROOT, 'src/locales/en/common.json');
const DE_PATH = path.join(ROOT, 'src/locales/de/common.json');
const PATCH_PATH = path.join(ROOT, 'scripts/operations-de-patch.json');

const MODULES = [
  'kkd',
  'steelGoodReceiptAcceptance',
  'serviceAllocation',
  'inventoryCount',
  'production',
  'package',
  'warehouse',
  'productionTransfer',
  'subcontracting',
];

const EXACT = {
  Routine: 'Routine',
  Detail: 'Details anzeigen',
  'Yap Code': 'Yap-Code',
  Closed: 'Geschlossen',
  Lot: 'Los',
  '34ABC123': '34ABC123',
  UPS: 'UPS',
  DHL: 'DHL',
  FedEx: 'FedEx',
  TNT: 'TNT',
  CEVA: 'CEVA',
  'Initial rights and stock selection': 'Erstansprüche und Bestandsauswahl',
  'Resolve QR': 'QR auflösen',
  'Initial right': 'Erstanspruch',
  'Total quantity': 'Gesamtmenge',
  'Clear cart': 'Warenkorb leeren',
  Items: 'Artikel',
  Header: 'Kopf',
  Resolve: 'Auflösen',
  Main: 'Haupt',
  Extra: 'Zusatz',
  Total: 'Gesamt',
  'Could not resolve QR.': 'QR konnte nicht aufgelöst werden.',
  'Could not load remaining entitlements.': 'Verbleibende Ansprüche konnten nicht geladen werden.',
  'Group not found': 'Gruppe nicht gefunden',
  'Grup bulunamadı': 'Gruppe nicht gefunden',
  'Search D-Code, stock, or serial': 'D-Code, Bestand oder Seriennummer suchen',
  'Yard code': 'Hofcode',
  'Yard / area code': 'Hof- / Bereichscode',
  'Saving...': 'Wird gespeichert...',
  'Plates at same location': 'Bleche am gleichen Standort',
  'Approved quantity': 'Freigegebene Menge',
  'Stack {{n}}': 'Stapel {{n}}',
  Stacked: 'Gestapelt',
  'Place Beside': 'Daneben platzieren',
  'PPE initial entry order': 'PSA-Ersteintrittsauftrag',
  'PPE remaining entitlements': 'Verbleibende PSA-Ansprüche',
  'PPE eligibility check': 'PSA-Anspruchsprüfung',
  'PPE distribution': 'PSA-Verteilung',
  'Employee selection': 'Mitarbeiterauswahl',
  'Order summary': 'Auftragsübersicht',
  'QR code': 'QR-Code',
  'Scan employee QR code': 'Mitarbeiter-QR-Code scannen',
  'Select me': 'Mich auswählen',
  'Alternative employee': 'Alternativer Mitarbeiter',
  'Select employee from list': 'Mitarbeiter aus Liste auswählen',
  'Employment start': 'Beschäftigungsbeginn',
  'Entitlement group': 'Anspruchsgruppe',
  'Select a group from initial rights': 'Gruppe aus Erstansprüchen auswählen',
  'Remaining in cart': 'Verbleibend im Warenkorb',
  'Select stock': 'Bestand auswählen',
  'Select stock for group': 'Bestand für Gruppe auswählen',
  'Select a group first': 'Zuerst eine Gruppe auswählen',
  'Search by code or name': 'Nach Code oder Name suchen',
  'No lines yet.': 'Noch keine Positionen.',
  Lines: 'Positionen',
  Remove: 'Entfernen',
  'Document no.': 'Belegnr.',
  'Employee found': 'Mitarbeiter gefunden',
  'PPE initial order created': 'PSA-Erstauftrag erstellt',
  'Line added': 'Position hinzugefügt',
  'No PPE employee record for this user': 'Kein PSA-Mitarbeiterdatensatz für diesen Benutzer',
  'Employee and at least one line are required': 'Mitarbeiter und mindestens eine Position sind erforderlich',
  Date: 'Datum',
  'Employee and date': 'Mitarbeiter und Datum',
  'Load remaining entitlements': 'Verbleibende Ansprüche laden',
  'Remaining entitlements loaded.': 'Verbleibende Ansprüche geladen.',
  'Select an employee first.': 'Wählen Sie zuerst einen Mitarbeiter aus.',
  'Last usage': 'Letzte Nutzung',
  'Next eligible date': 'Nächstes berechtigtes Datum',
  'Select an employee and query to see remaining entitlements here.':
    'Wählen Sie einen Mitarbeiter und starten Sie die Abfrage, um verbleibende Ansprüche hier zu sehen.',
  'Check inputs': 'Prüfeingaben',
  'Entitlement result': 'Anspruchsergebnis',
  'Check entitlement': 'Anspruch prüfen',
  'Transaction date': 'Transaktionsdatum',
  'This screen shows remaining entitlements before QR/barcode flow. It uses the same entitlement API as distribution; results match operations.':
    'Dieser Bildschirm zeigt verbleibende Ansprüche vor dem QR-/Barcode-Ablauf. Er nutzt dieselbe Anspruchs-API wie die Verteilung; Ergebnisse entsprechen den Operationen.',
  Eligible: 'Berechtigt',
  'Not eligible': 'Nicht berechtigt',
  'Suggested source': 'Vorgeschlagene Quelle',
  'Run a check with employee, group, and quantity to see results here.':
    'Führen Sie eine Prüfung mit Mitarbeiter, Gruppe und Menge durch, um Ergebnisse hier zu sehen.',
  'Select group code': 'Gruppencode auswählen',
  'Search group code or name': 'Gruppencode oder Name suchen',
  'No group found': 'Keine Gruppe gefunden',
  'Select a group code first.': 'Wählen Sie zuerst einen Gruppencode aus.',
  'Entitlement check passed.': 'Anspruchsprüfung bestanden.',
  'Entitlement check completed.': 'Anspruchsprüfung abgeschlossen.',
  'Entitlement check failed.': 'Anspruchsprüfung fehlgeschlagen.',
  'PPE distribution completed': 'PSA-Verteilung abgeschlossen',
  'Line added to cart': 'Position zum Warenkorb hinzugefügt',
  'Employee, warehouse, and lines are required.': 'Mitarbeiter, Lager und Positionen sind erforderlich.',
  'Employee and warehouse': 'Mitarbeiter und Lager',
  'Scan employee QR': 'Mitarbeiter-QR scannen',
  'Select warehouse': 'Lager auswählen',
  'Select employee from list instead of QR': 'Mitarbeiter aus Liste statt QR auswählen',
  'Open PPE orders for customer': 'Offene PSA-Aufträge für Kunden',
  'Available entitlements': 'Verfügbare Ansprüche',
  'Group entitlements for the job appear after an employee is selected.':
    'Gruppenansprüche für die Tätigkeit erscheinen nach Mitarbeiterauswahl.',
  'Loading entitlements...': 'Ansprüche werden geladen...',
  'No active group entitlement for this person.': 'Kein aktiver Gruppenanspruch für diese Person.',
  'Open orders matching the employee’s customer are listed after you pick an employee.':
    'Offene Aufträge zum Kunden des Mitarbeiters werden nach Auswahl des Mitarbeiters gelistet.',
  'Loading open orders...': 'Offene Aufträge werden geladen...',
  'No pending open PPE order for this customer.': 'Kein offener PSA-Auftrag für diesen Kunden.',
  Packing: 'Verpackung',
  Packed: 'Verpackt',
  Staged: 'Bereitgestellt',
  Transferred: 'Übertragen',
  Shipped: 'Versendet',
  Box: 'Karton',
  Pallet: 'Palette',
  Bag: 'Beutel',
  Custom: 'Benutzerdefiniert',
  'Configuration Code': 'Konfigurationscode',
  'Config Code': 'Konfigurationscode',
};

const PHRASES = [
  ['PPE ', 'PSA-'],
  ['Goods Receipt', 'Wareneingang'],
  ['Steel ', 'Stahl-'],
  ['Yard ', 'Hof-'],
  ['Warehouse', 'Lager'],
  ['Employee', 'Mitarbeiter'],
  ['Entitlement', 'Anspruch'],
  ['entitlement', 'Anspruch'],
  ['Distribution', 'Verteilung'],
  ['distribution', 'Verteilung'],
  ['Remaining', 'Verbleibend'],
  ['remaining', 'verbleibend'],
  ['Initial', 'Erst'],
  ['initial', 'Erst'],
  ['Resolve', 'Auflösen'],
  ['resolve', 'auflösen'],
  ['Select', 'Auswählen'],
  ['select', 'auswählen'],
  ['Search', 'Suchen'],
  ['search', 'suchen'],
  ['Loading', 'Wird geladen'],
  ['loading', 'wird geladen'],
  ['Could not', 'Konnte nicht'],
  ['could not', 'konnte nicht'],
  ['No ', 'Keine '],
  ['not found', 'nicht gefunden'],
  ['required', 'erforderlich'],
  ['Required', 'Erforderlich'],
  ['completed', 'abgeschlossen'],
  ['Completed', 'Abgeschlossen'],
  ['failed', 'fehlgeschlagen'],
  ['Failed', 'Fehlgeschlagen'],
  ['passed', 'bestanden'],
  ['Check', 'Prüfung'],
  ['check', 'prüfen'],
  ['Order', 'Auftrag'],
  ['order', 'Auftrag'],
  ['Stock', 'Bestand'],
  ['stock', 'Bestand'],
  ['Group', 'Gruppe'],
  ['group', 'Gruppe'],
  ['Customer', 'Kunde'],
  ['customer', 'Kunde'],
  ['Quantity', 'Menge'],
  ['quantity', 'Menge'],
  ['Document', 'Beleg'],
  ['document', 'Beleg'],
  ['Line', 'Position'],
  ['line', 'Position'],
  ['Lines', 'Positionen'],
  ['lines', 'Positionen'],
  ['Cart', 'Warenkorb'],
  ['cart', 'Warenkorb'],
  ['Header', 'Kopf'],
  ['header', 'Kopf'],
  ['Main', 'Haupt'],
  ['Extra', 'Zusatz'],
  ['Total', 'Gesamt'],
  ['Date', 'Datum'],
  ['date', 'Datum'],
  ['Transaction', 'Transaktion'],
  ['transaction', 'Transaktion'],
  ['Result', 'Ergebnis'],
  ['result', 'Ergebnis'],
  ['Eligible', 'Berechtigt'],
  ['eligible', 'berechtigt'],
  ['Suggested', 'Vorgeschlagen'],
  ['suggested', 'vorgeschlagen'],
  ['Source', 'Quelle'],
  ['source', 'Quelle'],
  ['Next', 'Nächstes'],
  ['next', 'nächstes'],
  ['Usage', 'Nutzung'],
  ['usage', 'Nutzung'],
  ['Open', 'Offen'],
  ['open', 'offen'],
  ['Available', 'Verfügbar'],
  ['available', 'verfügbar'],
  ['Active', 'Aktiv'],
  ['active', 'aktiv'],
  ['Pending', 'Ausstehend'],
  ['pending', 'ausstehend'],
  ['Matching', 'Passende'],
  ['matching', 'passende'],
  ['List', 'Liste'],
  ['list', 'Liste'],
  ['Report', 'Bericht'],
  ['report', 'Bericht'],
  ['Validation', 'Validierung'],
  ['validation', 'Validierung'],
  ['Log', 'Protokoll'],
  ['log', 'Protokoll'],
  ['Department', 'Abteilung'],
  ['Role', 'Rolle'],
  ['Approval', 'Genehmigung'],
  ['Inspection', 'Inspektion'],
  ['Placement', 'Platzierung'],
  ['placement', 'Platzierung'],
  ['Accepted', 'Angenommen'],
  ['accepted', 'angenommen'],
  ['Rejected', 'Abgelehnt'],
  ['rejected', 'abgelehnt'],
  ['Approved', 'Freigegeben'],
  ['approved', 'freigegeben'],
  ['Stack', 'Stapel'],
  ['stack', 'Stapel'],
  ['Plate', 'Blech'],
  ['plate', 'Blech'],
  ['Serial', 'Seriennummer'],
  ['serial', 'Seriennummer'],
  ['Area', 'Bereich'],
  ['area', 'Bereich'],
  ['Location', 'Standort'],
  ['location', 'Standort'],
  ['Saving', 'Speichern'],
  ['saving', 'speichern'],
  ['Search by', 'Suchen nach'],
  ['Pick ', 'Wählen '],
  ['Add ', 'Hinzufügen '],
  ['Edit ', 'Bearbeiten '],
  ['Create ', 'Erstellen '],
  ['Update ', 'Aktualisieren '],
  ['Delete ', 'Löschen '],
  ['Manage ', 'Verwalten '],
  ['Define ', 'Definieren '],
  ['Review ', 'Prüfen '],
  ['Count ', 'Inventur '],
  ['count ', 'Inventur '],
  ['Service ', 'Service-'],
  ['Allocation', 'Zuweisung'],
  ['allocation', 'Zuweisung'],
  ['Case', 'Vorgang'],
  ['case', 'Vorgang'],
  ['Cases', 'Vorgänge'],
  ['cases', 'Vorgänge'],
  ['Queue', 'Warteschlange'],
  ['queue', 'Warteschlange'],
  ['Document link', 'Belegverknüpfung'],
  ['document link', 'Belegverknüpfung'],
  ['Reports', 'Berichte'],
  ['reports', 'Berichte'],
];

function flatten(obj, prefix = '', out = {}) {
  for (const [key, value] of Object.entries(obj ?? {})) {
    const nextKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) flatten(value, nextKey, out);
    else out[nextKey] = value;
  }
  return out;
}

function hasTurkish(value) {
  if (typeof value !== 'string') return false;
  if (/[çğışÇĞİŞ]/.test(value)) return true;
  return /\b(bulunamadı|bulunamadi|hazır değil|hazir degil|çözümlenemedi|cozumlenemedi|getirilemedi|Yerleştirme|yerlestirme|Grup bulunamadı)\b/i.test(value);
}

function translate(text) {
  if (typeof text !== 'string' || !text.trim()) return null;
  if (EXACT[text]) return EXACT[text];

  let result = text;
  for (const [from, to] of PHRASES) {
    if (result.includes(from)) result = result.split(from).join(to);
  }

  if (result !== text && !hasTurkish(result)) return result;
  return null;
}

const enFlat = flatten(JSON.parse(fs.readFileSync(EN_PATH, 'utf8')));
const deFlat = flatten(JSON.parse(fs.readFileSync(DE_PATH, 'utf8')));
const patch = fs.existsSync(PATCH_PATH) ? JSON.parse(fs.readFileSync(PATCH_PATH, 'utf8')) : {};
let added = 0;

for (const [key, enValue] of Object.entries(enFlat)) {
  const root = key.split('.')[0];
  if (!MODULES.includes(root)) continue;
  if (typeof enValue !== 'string') continue;
  const current = deFlat[key];
  if (current === enValue || hasTurkish(current)) {
    const next = patch[key] ?? translate(enValue) ?? translate(current);
    if (next && next !== current && !hasTurkish(next)) {
      patch[key] = next;
      added += 1;
    }
  }
}

fs.writeFileSync(PATCH_PATH, JSON.stringify(patch, null, 2));
console.log(`Patch size: ${Object.keys(patch).length}, added: ${added}`);
