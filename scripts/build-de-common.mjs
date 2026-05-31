import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const EN_PATH = path.join(ROOT, 'src/locales/en/common.json');
const DE_PATH = path.join(ROOT, 'src/locales/de/common.json');
const CACHE_PATH = path.join(ROOT, 'scripts/de-translation-cache.json');

const EXACT = {
  'Previous': 'Zurück',
  'Next': 'Weiter',
  'Delete': 'Löschen',
  'Filters': 'Filter',
  'Reset': 'Zurücksetzen',
  'Back': 'Zurück',
  'Optional': 'Optional',
  'Completed': 'Abgeschlossen',
  'Over': 'Überschuss',
  'Add': 'Hinzufügen',
  'View': 'Anzeigen',
  'Document No': 'Belegnummer',
  'Document Date': 'Belegdatum',
  'Project Code': 'Projektcode',
  'Priority': 'Priorität',
  'Description': 'Beschreibung',
  'Unit': 'Einheit',
  'Clear': 'Leeren',
  'Status': 'Status',
  'Refresh': 'Aktualisieren',
  'Note': 'Notiz',
  'Create': 'Erstellen',
  'Active': 'Aktiv',
  'Passive': 'Passiv',
  'Dashboard': 'Dashboard',
  'Inventory': 'Inventar',
  'Transfer': 'Transfer',
  'Details': 'Details',
  'Error': 'Fehler',
  'Date': 'Datum',
  'Default': 'Standard',
  'Updated Date': 'Aktualisierungsdatum',
  'Created Date': 'Erstellungsdatum',
  'Actions': 'Aktionen',
  'Search': 'Suchen',
  'Export': 'Exportieren',
  'Save': 'Speichern',
  'Cancel': 'Abbrechen',
  'Close': 'Schließen',
  'Edit': 'Bearbeiten',
  'Update': 'Aktualisieren',
  'Confirm': 'Bestätigen',
  'Yes': 'Ja',
  'No': 'Nein',
  'Required': 'Erforderlich',
  'Loading...': 'Wird geladen...',
  'Processing...': 'Wird verarbeitet...',
  'No data': 'Keine Daten',
  'Not found': 'Nicht gefunden',
  'System Admin': 'Systemadministrator',
  'Load failed': 'Laden fehlgeschlagen',
  'Updated': 'Aktualisiert',
  'Name': 'Name',
  'Code': 'Code',
  'Type': 'Typ',
  'Group': 'Gruppe',
  'Customer': 'Kunde',
  'Supplier': 'Lieferant',
  'Employee': 'Mitarbeiter',
  'Department': 'Abteilung',
  'Role': 'Rolle',
  'Stock': 'Bestand',
  'Warehouse': 'Lager',
  'Quantity': 'Menge',
  'Approval': 'Genehmigung',
  'Approved': 'Genehmigt',
  'Rejected': 'Abgelehnt',
  'Waiting': 'Wartend',
  'Draft': 'Entwurf',
  'Cancelled': 'Storniert',
  'Processing': 'In Bearbeitung',
  'Arrived': 'Eingetroffen',
  'Placed': 'Eingelagert',
  'Select all': 'Alle auswählen',
  'Active': 'Aktiv',
  'Permissions': 'Berechtigungen',
  'Permission Groups': 'Berechtigungsgruppen',
  'Permission Definitions': 'Berechtigungsdefinitionen',
  'Manage permission codes used in the system': 'Verwalten Sie im System verwendete Berechtigungscodes',
  'Add Definition': 'Definition hinzufügen',
  'Add Group': 'Gruppe hinzufügen',
  'Display name': 'Anzeigename',
  'Optional description': 'Optionale Beschreibung',
  'Group name': 'Gruppenname',
  'No permission definitions available': 'Keine Berechtigungsdefinitionen verfügbar',
  'Edit Permission Definition': 'Berechtigungsdefinition bearbeiten',
  'Add Permission Definition': 'Berechtigungsdefinition hinzufügen',
  'Update permission definition details': 'Details der Berechtigungsdefinition aktualisieren',
  'Create a new permission definition': 'Neue Berechtigungsdefinition erstellen',
  'Edit Permission Group': 'Berechtigungsgruppe bearbeiten',
  'Add Permission Group': 'Berechtigungsgruppe hinzufügen',
  'Update permission group details': 'Details der Berechtigungsgruppe aktualisieren',
  'Create a new permission group': 'Neue Berechtigungsgruppe erstellen',
  'Delete Permission Definition': 'Berechtigungsdefinition löschen',
  'Delete Permission Group': 'Berechtigungsgruppe löschen',
  'Turkish': 'Türkisch',
  'English': 'Englisch',
  'German': 'Deutsch',
  'French': 'Französisch',
  'Spanish': 'Spanisch',
  'Italian': 'Italienisch',
  'Arabic': 'Arabisch',
  'Page preparing...': 'Seite wird vorbereitet...',
  'You must select at least one item before continuing.': 'Sie müssen mindestens einen Artikel auswählen, bevor Sie fortfahren.',
  'An error occurred. Please try again.': 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.',
  'Record saved successfully': 'Datensatz erfolgreich gespeichert',
  'Record deleted': 'Datensatz gelöscht',
  'You do not have permission for this action.': 'Sie haben keine Berechtigung für diese Aktion.',
  '{{current}} - {{total}} of {{totalCount}}': '{{current}} - {{total}} von {{totalCount}}',
  '{{from}}-{{to}} of {{total}}': '{{from}}-{{to}} von {{total}}',
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
  ['Document Series', 'Belegserie'],
  ['Barcode Designer', 'Barcode-Designer'],
  ['Barcode Definitions', 'Barcode-Definitionen'],
  ['Printer Management', 'Druckerverwaltung'],
  ['Service Allocation', 'Servicezuweisung'],
  ['Vehicle Check-In', 'Fahrzeuganmeldung'],
  ['OCR Goods Receipt Match', 'OCR-Wareneingangsabgleich'],
  ['Steel Good Receipt Acceptance', 'Stahl-Wareneingangsbestätigung'],
  ['Trace Explorer', 'Trace-Explorer'],
  ['WMS Scope Policies', 'WMS-Bereichsrichtlinien'],
  ['WMS Scope Assignments', 'WMS-Bereichszuweisungen'],
  ['Permission Definitions', 'Berechtigungsdefinitionen'],
  ['Permission Groups', 'Berechtigungsgruppen'],
  ['User Group Assignments', 'Benutzergruppenzuweisungen'],
  ['Initial Order', 'Erstausgabe'],
  ['Manual Overrides', 'Manuelle Überschreibungen'],
  ['Role Entitlement Matrix', 'Rollenanspruchsmatrix'],
  ['Employee Cards', 'Mitarbeiterkarten'],
  ['Department Definitions', 'Abteilungsdefinitionen'],
  ['Role Definitions', 'Rollendefinitionen'],
  ['Remaining Entitlements', 'Verbleibende Ansprüche'],
  ['Validation Logs', 'Validierungsprotokolle'],
  ['Distribution List', 'Verteilungsliste'],
  ['Entitlement Check', 'Anspruchsprüfung'],
  ['Direct Entry', 'Direkterfassung'],
  ['Awaiting Approval', 'zur Genehmigung ausstehend'],
  ['Awaiting ERP Approval', 'zur ERP-Genehmigung ausstehend'],
  ['Assigned ', 'Zugewiesene '],
  ['Assigned', 'Zugewiesen'],
  ['Manage ', 'Verwalten Sie '],
  ['Create ', 'Erstellen '],
  ['Edit ', 'Bearbeiten '],
  ['Delete ', 'Löschen '],
  ['Add ', 'Hinzufügen '],
  ['Update ', 'Aktualisieren '],
  ['Select ', 'Auswählen '],
  ['Search ', 'Suchen '],
  ['List', 'Liste'],
  ['Definitions', 'Definitionen'],
  ['Parameters', 'Parameter'],
  ['Operations', 'Operationen'],
  ['Reports', 'Berichte'],
  ['Settings', 'Einstellungen'],
  ['Overview', 'Übersicht'],
  ['Details', 'Details'],
  ['Records', 'Datensätze'],
  ['Order', 'Auftrag'],
  ['Orders', 'Aufträge'],
  ['Lines', 'Positionen'],
  ['Line', 'Position'],
  ['Serial', 'Seriennummer'],
  ['Serials', 'Seriennummern'],
  ['Package', 'Paket'],
  ['Packages', 'Pakete'],
  ['Packaging', 'Verpackung'],
  ['Matching operation failed.', 'Abgleichvorgang fehlgeschlagen.'],
  ['Available headers could not be loaded.', 'Verfügbare Kopfdaten konnten nicht geladen werden.'],
  ['Orders could not be loaded.', 'Aufträge konnten nicht geladen werden.'],
  ['Order lines could not be loaded.', 'Auftragspositionen konnten nicht geladen werden.'],
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

function isGoodGerman(value, enValue) {
  if (typeof value !== 'string' || !value.trim()) return false;
  if (value === enValue) return false;
  if (/[çğıöşüÇĞİÖŞÜ]/.test(value)) return false;
  if (/[\u0600-\u06FF]/.test(value)) return false;
  if (/[äöüßÄÖÜ]/.test(value)) return true;
  if (/\b(nicht|für|wurde|konnte|Bitte|Speichern|Abbrechen|Löschen|Bearbeiten|Hinzufügen|Wird|geladen|Fehler|Erfolg|Warnung|Seite|Suche|Filtern|Exportieren|Lager|Bestand|Benutzer|Berechtigung|Datensatz|Anfrage|Filiale|Formular|Aktionen|Ausgewählt|Schließen|Weiter|Zurück|Bestätigen|Aktualisieren|Erforderlich|Optional|Keine|Kein|Wareneingang|Warenausgang|Versand|Produktion|Inventur|Qualität|Dokument|Barcode|Drucker|Benachrichtigung|Parameter|Einstellungen|Operationen|Berichte|Definitionen|Verwaltung|Zuweisung|Richtlinie|Abteilung|Mitarbeiter|Anspruch|Verteilung|Bestellung|Validierung|Verbleibend|Matrix|Genehmiger|Verbraucht|Startdatum|Enddatum|Gruppencode|Kundencode|Mitarbeitercode|Vorname|Nachname|Waren|Liefer|Empfang|Ausgabe|Eingang|Anzeig|Auswahl|Verarbeit|Abgeschloss|Storniert|Entwurf|Genehmigt|Abgelehnt|Wartend|Gesamt|Herunterladen|Hochladen|Drucken|Kopieren|Zurücksetzen|Anwenden|Ausblenden|Sichtbar|Versteckt|Brotkrumen|Systemadministrator|Pro Seite|Einträge|Spalten|Filialen|Kunden|Projekte|Produkte|Rollen|Benachrichtigungen|Berechtigungen|Gruppen|Richtlinien|Zuweisungen|Menge|Einheit|Beschreibung|Priorität|Projekt|Datum|Nummer|Kunde|Lieferant|Notiz|Übersicht|Zusammenfassung|Verlauf|Protokoll|Prüfung|Inspektion|Quarantäne|Freigabe|Ablehnung|Rückgabe|Regel|Regeln|Einstellung|Einstellungen|Konfiguration|Vorlage|Vorlagen|Absenden|Schließen|Öffnen|Starten|Beenden|Fortsetzen|Erstellen|Entfernen|Importieren|Verwalten|Liste|Aktiv|Passiv|Hinweis|Information|Bestätigung|Zugriff|verweigert|Abmelden|Anmelden|Passwort|Zweigstelle|Sprache|Erscheinungsbild|Dunkel|Hell|Standard|Menü|Navigation|Seitenleiste|Kopfzeile|Fußzeile|Startseite|Willkommen|Hilfe|Support|Dokumentation|Anleitung|Kontakt|Feedback|Version|Copyright|Rechte|vorbehalten|konnte nicht|wurde nicht|wurden nicht|konnten nicht|Bitte zuerst|Bitte wählen|Bitte auswählen|Erfolgreich|fehlgeschlagen|ausstehend|zugewiesen|verfügbar|erforderlich|optional|gespeichert|gelöscht|aktualisiert|erstellt|geladen|ausgewählt|Anzeigename|Gruppenname|Belegnummer|Belegdatum|Projektcode|Aktualisierungsdatum|Erstellungsdatum)\b/i.test(value)) {
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
    [/^(.+) could not be created\.$/, '$1 konnte nicht erstellt werden.'],
    [/^(.+) could not be updated\.$/, '$1 konnte nicht aktualisiert werden.'],
    [/^(.+) could not be deleted\.$/, '$1 konnte nicht gelöscht werden.'],
    [/^Assigned (.+) list could not be loaded\.$/, 'Zugewiesene $1-Liste konnte nicht geladen werden.'],
    [/^(.+) orders awaiting approval could not be loaded\.$/, '$1-Aufträge zur Genehmigung ausstehend konnten nicht geladen werden.'],
    [/^(.+) plans awaiting approval could not be loaded\.$/, '$1-Pläne zur Genehmigung ausstehend konnten nicht geladen werden.'],
    [/^Are you sure you want to delete "(.+)"\? This action cannot be undone\.$/, 'Möchten Sie „$1“ wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.'],
    [/^We will soft delete "(.+)"\..+$/, '„$1“ wird per Soft Delete deaktiviert.'],
    [/^Manage (.+) records\.$/, 'Verwalten Sie $1-Datensätze.'],
    [/^Manage (.+)\.$/, 'Verwalten Sie $1.'],
    [/^Define (.+)\.$/, 'Definieren Sie $1.'],
    [/^Select (.+)\.$/, 'Wählen Sie $1 aus.'],
  ];

  for (const [pattern, replacement] of patterns) {
    const match = text.match(pattern);
    if (match) {
      return text.replace(pattern, replacement);
    }
  }
  return null;
}

function translateLocal(text) {
  if (typeof text !== 'string') return text;
  if (EXACT[text]) return EXACT[text];

  const errorTranslation = translateErrorPattern(text);
  if (errorTranslation) return translatePhraseRules(errorTranslation);

  const phraseTranslation = translatePhraseRules(text);
  if (phraseTranslation !== text && !/[A-Za-z]{3,}/.test(phraseTranslation.replace(/<[^>]+>/g, '').replace(/\{\{[^}]+\}\}/g, ''))) {
    return phraseTranslation;
  }

  if (phraseTranslation !== text) {
    const englishWords = phraseTranslation.match(/\b[A-Za-z]{3,}\b/g) ?? [];
    if (englishWords.length <= 2) return phraseTranslation;
  }

  return null;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function translateRemote(text, cache) {
  if (cache[text]) return cache[text];

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|de`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Translation HTTP ${response.status}`);
      const payload = await response.json();
      const translated = payload?.responseData?.translatedText;
      if (!translated || typeof translated !== 'string') {
        throw new Error('Empty translation response');
      }
      cache[text] = translated;
      await sleep(350);
      return translated;
    } catch (error) {
      if (attempt === 3) throw error;
      await sleep(1000 * attempt);
    }
  }

  throw new Error(`Translation failed for: ${text}`);
}

function writeOutputs(outputFlat, cache) {
  fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));
  fs.writeFileSync(DE_PATH, `${JSON.stringify(unflatten(outputFlat), null, 2)}\n`);
}

async function main() {
  const offline = process.argv.includes('--offline');
  const enTree = JSON.parse(fs.readFileSync(EN_PATH, 'utf8'));
  const deTree = fs.existsSync(DE_PATH) ? JSON.parse(fs.readFileSync(DE_PATH, 'utf8')) : {};
  const enFlat = flatten(enTree);
  const deFlat = flatten(deTree);
  const cache = fs.existsSync(CACHE_PATH) ? JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8')) : {};
  const outputFlat = {};
  const pendingRemote = [];

  for (const [key, enValue] of Object.entries(enFlat)) {
    const existing = deFlat[key];
    if (isGoodGerman(existing, enValue)) {
      outputFlat[key] = existing;
      continue;
    }

    if (typeof enValue !== 'string') {
      outputFlat[key] = enValue;
      continue;
    }

    const local = translateLocal(enValue);
    if (local && local !== enValue) {
      outputFlat[key] = local;
      cache[enValue] = local;
      continue;
    }

    if (cache[enValue]) {
      outputFlat[key] = cache[enValue];
      continue;
    }

    pendingRemote.push({ key, enValue });
  }

  console.log(`Local translated: ${Object.keys(outputFlat).length}`);
  console.log(`Remote pending: ${pendingRemote.length}`);

  if (offline) {
    for (const item of pendingRemote) {
      outputFlat[item.key] = item.enValue;
    }
    writeOutputs(outputFlat, cache);
    console.log('Offline mode: skipped remote API');
  } else {
  let index = 0;
  for (const item of pendingRemote) {
    index += 1;
    try {
      outputFlat[item.key] = await translateRemote(item.enValue, cache);
    } catch (error) {
      console.warn(`Fallback EN for ${item.key}: ${error instanceof Error ? error.message : error}`);
      outputFlat[item.key] = item.enValue;
    }

    if (index % 25 === 0) {
      writeOutputs(outputFlat, cache);
      console.log(`Remote progress: ${index}/${pendingRemote.length}`);
    }
  }

  writeOutputs(outputFlat, cache);
  }

  const finalFlat = flatten(JSON.parse(fs.readFileSync(DE_PATH, 'utf8')));
  let sameAsEn = 0;
  let turkish = 0;
  for (const [key, value] of Object.entries(finalFlat)) {
    if (value === enFlat[key]) sameAsEn += 1;
    if (/[çğıöşüÇĞİÖŞÜ]/.test(String(value))) turkish += 1;
  }
  console.log(`Final keys: ${Object.keys(finalFlat).length}`);
  console.log(`Still same as EN: ${sameAsEn}`);
  console.log(`Still Turkish: ${turkish}`);
}

await main();
