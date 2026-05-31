import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const TR_PATH = path.join(ROOT, 'src/locales/tr/common.json');
const EN_PATH = path.join(ROOT, 'src/locales/en/common.json');
const UNRESOLVED_PATH = path.join(ROOT, 'scripts/operations-de-unresolved.json');
const PATCH_PATH = path.join(ROOT, 'scripts/operations-de-patch.json');

const KEY_OVERRIDES = {
  'production.approval.mainYapKod': 'Haupt-YapKod',
  'production.create.mainYapKod': 'Haupt-YapKod',
  'production.create.summary.outputs': 'Outputs',
  'production.detail.columns.actual': 'Ist',
  'production.detail.columns.assignment': 'Zuweisung',
  'production.detail.dependencyColumns.rules': 'Regeln',
  'production.create.title': 'Fertigungsauftrag erstellen',
  'production.create.editTitle': 'Fertigungsauftrag bearbeiten',
  'sidebar.productionCreate': 'Fertigungsauftrag erstellen',
};

const TR_PHRASES = [
  ['Bu plan taslak durumda. Henüz sahada işlenmediyse düzenleme ekranına dönüp planı güncelleyebilirsiniz.', 'Dieser Plan ist noch ein Entwurf. Wenn er im Shopfloor noch nicht verarbeitet wurde, können Sie in den Bearbeitungsmodus wechseln und den Plan aktualisieren.'],
  ['Bu adimda tamamlanmasi gerekenler', 'In diesem Schritt noch erforderlich'],
  ['Bu adim tamam gibi gorunuyor', 'Dieser Schritt wirkt abgeschlossen'],
  ['Zorunlu alanlar dolu. Isterseniz bir sonraki adıma gecebilirsiniz.', 'Pflichtfelder sind ausgefüllt. Sie können zum nächsten Schritt wechseln.'],
  ['Ne Uretecegiz?', 'Was produzieren wir?'],
  ['Planin ana urununu, miktarini ve kaynagini secin.', 'Wählen Sie Hauptprodukt, Menge und Quelle des Plans.'],
  ['Planin dogru kurulmasi icin ilk kontrol noktalari.', 'Erste Kontrollpunkte für einen korrekt aufgebauten Plan.'],
  ['Plan modu ne demek?', 'Was bedeutet der Planmodus?'],
  ['Seri modda bir asama bitmeden sonraki asama baslamaz.', 'Im Serienmodus startet die nächste Stufe erst, wenn die vorherige abgeschlossen ist.'],
  ['Paralel modda asamalar ayni anda ilerleyebilir.', 'Im Parallelmodus können Stufen gleichzeitig laufen.'],
  ['Karma modda bazi asamalar ayni anda, bazi asamalar sirayla ilerler.', 'Im Hybridmodus laufen einige Stufen parallel und andere nacheinander.'],
  ['Hazir Asama Kurgulari', 'Vorgefertigte Stufenstrukturen'],
  ['Planlamaciya hiz kazandirmak icin hazir iskeletler sunuyoruz. Gerekirse sonra duzenlenir.', 'Wir bieten vorgefertigte Gerüste, um Planern Zeit zu sparen. Bei Bedarf später anpassbar.'],
  ['Tek Asamali Plan', 'Einstufiger Plan'],
  ['2 Asamali Seri Plan', 'Zweistufiger Serienplan'],
  ['Paralel Hazirlik + Son Montaj', 'Parallele Vorbereitung + Endmontage'],
  ['Her kart tek bir uretim asamasidir. Planlamaci bu kartlari asama mantigiyla doldurur.', 'Jede Karte ist eine Produktionsstufe. Der Planer füllt die Karten nach Stufenlogik aus.'],
  ['Asamanin urunu, miktari ve akistaki yeri burada belirlenir.', 'Produkt, Menge und Position im Ablauf der Stufe werden hier festgelegt.'],
  ['Akis', 'Ablauf'],
  ['Bu asamayi basitce kurun', 'Diese Stufe einfach aufbauen'],
  ['Asama tipi secin, bu asamanin ne uretecegini yazin, sonra da once mi ayni anda mi yoksa sonra mi ilerleyecegini secin. Sistem teknik baglantiyi arka planda kurar.', 'Wählen Sie den Stufentyp, tragen Sie das Ergebnis der Stufe ein und legen Sie fest, ob sie zuerst, parallel oder danach läuft. Das System baut die technische Verknüpfung im Hintergrund.'],
  ['Ilk asama', 'Erste Stufe'],
  ['Oncekiyle ayni anda', 'Gleichzeitig mit der vorherigen'],
  ['Oncekinden sonra', 'Nach der vorherigen'],
  ['Bu asama ne yapiyor?', 'Was macht diese Stufe?'],
  ['Asama tipini secin', 'Stufentyp auswählen'],
  ['Akista yeri ne olsun?', 'Welche Position im Ablauf?'],
  ['Asama adi', 'Stufenname'],
  ['Ornek: Govde Hazirlama, Son Montaj', 'Beispiel: Rohling vorbereiten, Endmontage'],
  ['Bu asamada eksik kalanlar', 'In dieser Stufe fehlende Angaben'],
  ['Bu asama gecmeye hazir', 'Diese Stufe ist bereit zum Weitergehen'],
  ['Asama adi, uretilecek stok ve miktar tamam. Isterseniz bir sonraki asamaya gecebilirsiniz.', 'Stufenname, zu produzierender Bestand und Menge sind vollständig. Sie können zur nächsten Stufe wechseln.'],
  ['Her asamanin ne uretecegini planlayin. Gerekirse ayni asamaya birden fazla cikti ekleyebilirsiniz.', 'Planen Sie pro Stufe das Ergebnis. Bei Bedarf können Sie mehrere Outputs pro Stufe hinzufügen.'],
  ['Cikti tarafinda eksik kalanlar', 'Fehlende Angaben bei Outputs'],
  ['Her asamanin ne tuketecegini planlayin. Gercekte kullanilan seri daha sonra operasyon sirasinda secilir.', 'Planen Sie pro Stufe den Verbrauch. Die tatsächlich verwendete Serie wird später im Operationsschritt ausgewählt.'],
  ['Tuketim tarafinda kontrol edilmesi gerekenler', 'Beim Verbrauch zu prüfende Punkte'],
  ['Bu asama icin gerekli tuketimler', 'Für diese Stufe erforderlicher Verbrauch'],
  ['Planlamaci asamalarin sirayla mi ayni anda mi ilerleyecegini burada kontrol eder. Sistem isterseniz baglantilari otomatik kurar.', 'Der Planer steuert hier, ob Stufen nacheinander oder gleichzeitig laufen. Das System kann Verknüpfungen automatisch erstellen.'],
  ['Akisi Otomatik Kur', 'Ablauf automatisch einrichten'],
  ['Akis tarafinda tamamlanmasi gerekenler', 'Im Ablauf noch zu vervollständigen'],
  ['Asama', 'Stufe'],
  ['Sirali Asama', 'Geordnete Stufe'],
  ['Atanmis Asama', 'Zugewiesene Stufe'],
  ['Henuz asamalar arasi baglanti kurulmamıs. Seri veya karma planlarda otomatik akis kur butonunu kullanin.', 'Zwischen den Stufen besteht noch keine Verknüpfung. Nutzen Sie in Serien- oder Hybridplänen die Schaltfläche zum automatischen Ablauf.'],
  ['Plani yonetecek ana ekip veya sorumluyu burada belirleyin.', 'Legen Sie hier das Hauptteam oder den Verantwortlichen für den Plan fest.'],
  ['Her asama farkli operatore veya role atanabilir.', 'Jede Stufe kann einem anderen Operator oder einer anderen Rolle zugewiesen werden.'],
  ['Emir {{index}}', 'Auftrag {{index}}'],
  ['Yeni emir', 'Neuer Auftrag'],
  ['Stok seçilmedi', 'Kein Bestand ausgewählt'],
  ['Emir no.', 'Auftragsnr.'],
  ['Emir tipi', 'Auftragstyp'],
  ['Üretilecek stok', 'Zu produzierender Bestand'],
  ['Üretilecek YapKod', 'Zu produzierender YapKod'],
  ['Kaynak depo', 'Quelllager'],
  ['Hedef depo', 'Ziellager'],
  ['Sıra no.', 'Sequenznr.'],
  ['Elle başlatılabilir', 'Manueller Start möglich'],
  ['Operatör bağımlılık tamamlanmadan da emri başlatabilir.', 'Der Operator kann den Auftrag starten, bevor Abhängigkeiten abgeschlossen sind.'],
  ['Bağımlılık bitince otomatik başla', 'Autostart nach Abhängigkeiten'],
  ['Bir sonraki adım ERP veya shopfloor tarafında otomatik açılsın.', 'Der nächste Schritt soll automatisch in ERP oder Shopfloor geöffnet werden.'],
  ['Emir atamaları', 'Auftragszuweisungen'],
  ['Bu emir shopfloor tarafında kime düşer, burada netleştirin.', 'Klären Sie hier, wem dieser Auftrag im Shopfloor zugeordnet ist.'],
  ['Bu emre özel atama eklenmedi.', 'Für diesen Auftrag wurden keine Zuweisungen hinzugefügt.'],
  ['Planlanan çıktılar', 'Geplante Outputs'],
  ['PR_ORDER_OUTPUT tarafında hangi emrin ne üreteceği burada netleşir.', 'Hier wird in PR_ORDER_OUTPUT festgelegt, welcher Auftrag was produziert.'],
  ['Takip', 'Nachverfolgung'],
  ['Planlanan tüketimler', 'Geplanter Verbrauch'],
  ['PR_ORDER_CONSUMPTION satırları burada tanımlanır; operatör sonradan gerçek seri/lot bilgisini girebilir.', 'PR_ORDER_CONSUMPTION-Positionen werden hier definiert; der Operator kann später tatsächliche Serien-/Losdaten erfassen.'],
  ['Tüketim stoğu', 'Verbrauchsbestand'],
  ['Seri giriş', 'Serieneingabe'],
  ['Emir bağımlılıkları', 'Auftragsabhängigkeiten'],
  ['Seri, paralel veya hibrit akışta bir emrin ne zaman açılabileceğini burada tanımlayın. Gerekirse transfer tamamlanma koşulu ekleyin.', 'Definieren Sie hier, wann ein Auftrag in seriellem, parallelem oder hybridem Ablauf starten darf. Fügen Sie bei Bedarf Transfer-Abschlussbedingungen hinzu.'],
  ['Bu plan için henüz bağımlılık tanımlanmadı. Paralel akışta boş bırakabilir, seri akışta emirleri birbirine bağlayabilirsiniz.', 'Für diesen Plan sind noch keine Abhängigkeiten definiert. Im parallelen Ablauf leer lassen, im seriellen Ablauf Aufträge verknüpfen.'],
  ['Önceki emir', 'Vorgängerauftrag'],
  ['Sonraki emir', 'Nachfolgerauftrag'],
  ['Bekleme (dk)', 'Verzögerung (Min.)'],
  ['Çıktı hazır', 'Output bereit'],
  ['Transfer hazır', 'Transfer bereit'],
  ['Seri', 'Seriell'],
  ['Paralel', 'Parallel'],
  ['Hibrit', 'Hybrid'],
  ['Üretim', 'Produktion'],
  ['Montaj', 'Montage'],
  ['Paketleme', 'Verpackung'],
  ['Yeniden işleme', 'Nacharbeit'],
  ['Yarı mamul', 'Halbfertigware'],
  ['Yok', 'Keine'],
  ['İsteğe bağlı', 'Optional'],
  ['Zorunlu', 'Pflicht'],
  ['Bitişten başlangıca', 'Ende zu Start'],
  ['Başlangıçtan başlangıca', 'Start zu Start'],
  ['Bitişten bitişe', 'Ende zu Ende'],
  ['Başlangıçtan bitişe', 'Start zu Ende'],
  ['Birincil', 'Primär'],
  ['Destek', 'Unterstützung'],
  ['Sorumlu', 'Verantwortlich'],
  ['Gözlemci', 'Beobachter'],
  ['İzin bilgisi', 'Berechtigungshinweis'],
  ['Bu planı kaydetmek için üretim oluşturma izni gerekli.', 'Zum Speichern dieses Plans ist die Berechtigung zum Erstellen von Produktion erforderlich.'],
  ['Bu planı güncellemek için üretim güncelleme izni gerekli.', 'Zum Aktualisieren dieses Plans ist die Berechtigung zum Bearbeiten von Produktion erforderlich.'],
  ['Kaynak depo secin', 'Quelllager auswählen'],
  ['Depolarda ara', 'In Lagern suchen'],
  ['Depo bulunamadi', 'Kein Lager gefunden'],
  ['Hedef depo secin', 'Ziellager auswählen'],
  ['Ana Is Emri No', 'Haupt-Arbeitsauftragsnr.'],
  ['Is emri no ile alanlari doldurun', 'Felder über Arbeitsauftragsnr. ausfüllen'],
  ['Ana urun secin', 'Hauptprodukt auswählen'],
  ['Urunlerde ara', 'In Produkten suchen'],
  ['Urun bulunamadi', 'Kein Produkt gefunden'],
  ['Ana yapkod secin', 'Haupt-YapKod auswählen'],
  ['Yapkodlarda ara', 'In YapKods suchen'],
  ['Bu urune uygun yapkod bulunamadi', 'Kein passender YapKod für dieses Produkt gefunden'],
  ['Planlamaci Modu', 'Planermodus'],
  ['Gelismis Teknik Mod', 'Erweiterter Technikmodus'],
  ['Bu ekran ne yapiyor?', 'Was macht dieser Bildschirm?'],
  ['Bu ekran once ana urunu ve miktari secmenizi, sonra uretimi asamalara bolmenizi, en son da hangi asamanin once veya ayni anda ilerleyecegini belirlemenizi saglar. Kayit aninda sistem plani uretim emirlerine cevirir.', 'Dieser Bildschirm lässt Sie zuerst Hauptprodukt und Menge wählen, dann die Produktion in Stufen gliedern und schließlich festlegen, welche Stufe zuerst oder parallel läuft. Beim Speichern wandelt das System den Plan in Fertigungsaufträge um.'],
  ['Ana urun secimi nasil dusunulmeli?', 'Wie sollte die Auswahl des Hauptprodukts gedacht werden?'],
  ['Ana urun, planin sonunda elde etmek istediginiz mamuldur. Ana yapkod bu mamulun varyantini anlatir. Hazir bir is emri veya stok bilgisi varsa hizli giris ile bu alanlari otomatik doldurabilirsiniz.', 'Das Hauptprodukt ist das Endprodukt des Plans. Der Haupt-YapKod beschreibt die Variante. Mit Schnellerfassung können vorhandene Arbeitsauftrags- oder Bestandsdaten diese Felder automatisch füllen.'],
  ['Asama nedir?', 'Was ist eine Stufe?'],
  ['Her kart tek bir uretim asamasidir. Ornek: govde hazirlama, montaj, paketleme. Seri modda bir asama bitmeden sonraki baslamaz. Paralel veya karma modda ayni sequence numarasina sahip asamalar birlikte ilerleyebilir.', 'Jede Karte ist eine Produktionsstufe, z. B. Rohling vorbereiten, Montage, Verpackung. Im Serienmodus startet die nächste Stufe erst nach Abschluss der vorherigen. Im Parallel- oder Hybridmodus können Stufen mit gleicher Sequenznummer gemeinsam laufen.'],
  ['Cikti neyi anlatir?', 'Was bedeutet Output?'],
  ['Cikti, ilgili asama sonunda elde edilen urundur. Ara mamul olabilir, nihai mamul olabilir. Burada planlanan miktar yazilir; gercekte ne kadar uretildigi process ekraninda kaydedilir.', 'Output ist das Ergebnis am Ende der Stufe. Es kann Halbfertig- oder Fertigware sein. Hier steht die geplante Menge; die tatsächlich produzierte Menge wird im Prozessbildschirm erfasst.'],
  ['Tuketim neyi anlatir?', 'Was bedeutet Verbrauch?'],
  ['Tuketim, bu asamayi tamamlamak icin gereken malzemedir. Planlama ekraninda neyin gerekli oldugu yazilir. Hangi seri veya lotun kullanildigi ise daha sonra operator tarafinda process ekraninda girilir veya ERP/Netsis tarafindan dogrulanir.', 'Verbrauch ist das Material, das zum Abschluss der Stufe benötigt wird. Im Planungsbildschirm wird der Bedarf erfasst; verwendete Serie oder Los werden später im Prozessbildschirm erfasst oder über ERP/Netsis verifiziert.'],
  ['Akis neyi kontrol eder?', 'Was steuert der Ablauf?'],
  ['Akis, hangi asamanin once bitecegini ve hangisinin onu bekleyecegini belirler. Bu alan sayesinde birlestirme veya son montaj gibi asamalar, gerekli onceki asamalar bitmeden baslatilmaz.', 'Der Ablauf legt fest, welche Stufe zuerst endet und welche wartet. So starten Zusammenbau oder Endmontage erst, wenn die erforderlichen Vorstufen abgeschlossen sind.'],
  ['Tuketilecek stok secin', 'Zu verbrauchenden Bestand auswählen'],
  ['Sorumlu kullanici secin', 'Verantwortlichen Benutzer auswählen'],
  ['Kullanicilarda ara', 'In Benutzern suchen'],
  ['Kullanici bulunamadi', 'Kein Benutzer gefunden'],
  ['Rol secin', 'Rolle auswählen'],
  ['Rollerde ara', 'In Rollen suchen'],
  ['Rol bulunamadi', 'Keine Rolle gefunden'],
  ['Yap Kod', 'Yap-Kod'],
  ['Asamalar', 'Stufen'],
  ['Ana YapKod', 'Haupt-YapKod'],
  ['Atanmis Uretim Emirleri', 'Zugewiesene Fertigungsaufträge'],
  ['Atanmis uretim emirleri yuklenemedi', 'Zugewiesene Fertigungsaufträge konnten nicht geladen werden.'],
  ['Size atanmis bekleyen uretim emri bulunamadi', 'Keine zugewiesenen ausstehenden Fertigungsaufträge gefunden'],
  ['Belge no veya ana stok ara', 'Nach Belegnummer oder Hauptbestand suchen'],
  ['Bu Asama Icin Transfer Ac', 'Transfer für diese Stufe öffnen'],
  ['Operator Akisi', 'Operator-Ablauf'],
  ['Secili Asama', 'Ausgewählte Stufe'],
  ['Cikti ilerlemesi', 'Output-Fortschritt'],
  ['Tuketim ilerlemesi', 'Verbrauchsfortschritt'],
  ['Tuketilmesi Gereken Kalemler', 'Zu verbrauchende Positionen'],
  ['Uretilmesi Gereken Ciktilar', 'Zu produzierende Outputs'],
  ['Asama gorunumu', 'Stufenansicht'],
  ['Once size atanmis bir asama secin. Tuketim kalemleri secilen asamadan otomatik gelir.', 'Wählen Sie zuerst eine Ihnen zugewiesene Stufe. Verbrauchspositionen kommen automatisch aus der gewählten Stufe.'],
  ['Atanmis tuketim kalemini secin', 'Zugewiesene Verbrauchsposition auswählen'],
  ['Once size atanmis bir asama secin. Uretilecek cikti kalemleri secilen asamadan otomatik gelir.', 'Wählen Sie zuerst eine Ihnen zugewiesene Stufe. Output-Positionen kommen automatisch aus der gewählten Stufe.'],
  ['Atanmis cikti kalemini secin', 'Zugewiesene Output-Position auswählen'],
  ['1. Tuketim kalemini secin. 2. Miktari kontrol edin. 3. Gerekirse seri girip kaydedin.', '1. Verbrauchsposition wählen. 2. Menge prüfen. 3. Bei Bedarf Serie erfassen und speichern.'],
  ['1. Uretilecek cikti kalemini secin. 2. Miktari kontrol edin. 3. Gerekirse seri girip kaydedin.', '1. Output-Position wählen. 2. Menge prüfen. 3. Bei Bedarf Serie erfassen und speichern.'],
  ['Üretim süreci', 'Produktionsprozess'],
  ['Plan detayını inceleyin, emir bazında operasyon başlatın ve gerçek tüketim ile çıktı hareketlerini kaydedin.', 'Prüfen Sie Plandetails, starten Sie Operationen pro Auftrag und erfassen Sie tatsächlichen Verbrauch sowie Output-Bewegungen.'],
  ['Plan detayını aç', 'Plandetails öffnen'],
  ['Üretim planı detayı yüklenemedi.', 'Produktionsplandetails konnten nicht geladen werden.'],
  ['Operasyon başlatıldı.', 'Operation gestartet.'],
  ['Operasyon başlatılamadı.', 'Operation konnte nicht gestartet werden.'],
  ['Operasyon duraklatıldı.', 'Operation pausiert.'],
  ['Operasyon duraklatılamadı.', 'Operation konnte nicht pausiert werden.'],
  ['Operasyon devam ediyor.', 'Operation läuft weiter.'],
  ['Operasyon devam ettirilemedi.', 'Operation konnte nicht fortgesetzt werden.'],
  ['Operasyon tamamlandı.', 'Operation abgeschlossen.'],
  ['Operasyon tamamlanamadı.', 'Operation konnte nicht abgeschlossen werden.'],
  ['Tüketim kaydı oluşturuldu.', 'Verbrauchsdatensatz erstellt.'],
  ['Tüketim kaydı oluşturulamadı.', 'Verbrauchsdatensatz konnte nicht erstellt werden.'],
  ['Çıktı kaydı oluşturuldu.', 'Output-Datensatz erstellt.'],
  ['Çıktı kaydı oluşturulamadı.', 'Output-Datensatz konnte nicht erstellt werden.'],
  ['Emirler', 'Aufträge'],
  ['Aktif operasyon', 'Aktive Operation'],
  ['Operasyon zaman çizelgesi', 'Operations-Zeitachse'],
  ['Başlat, duraklat, devam et ve tamamla olaylarını zaman sırasıyla izleyin.', 'Verfolgen Sie Start-, Pause-, Fortsetzungs- und Abschlussereignisse chronologisch.'],
  ['Henüz operasyon olayı yok. Emir seçip operasyon başlattığınızda zaman akışı burada görünür.', 'Noch keine Operationsereignisse. Nach Auftragswahl und Start erscheint der Zeitablauf hier.'],
  ['{{count}} dk', '{{count}} Min.'],
  ['Neden kodu', 'Ursachencode'],
  ['Plan detayı', 'Plandetail'],
  ['Atamalar, emirler, çıktılar ve tüketimler tek ekranda görünsün.', 'Zuweisungen, Aufträge, Outputs und Verbrauch auf einem Bildschirm anzeigen.'],
  ['Tüm emirler', 'Alle Aufträge'],
  ['Stok / emir ara', 'Bestand / Auftrag suchen'],
  ['Örn. emir no veya stok kodu', 'z. B. Auftragsnr. oder Bestandscode'],
  ['Seçili emir — açık kalan miktar', 'Ausgewählter Auftrag — offene Menge'],
  ['Çıktı açığı: {{value}}', 'Output-Abweichung: {{value}}'],
  ['Tüketim açığı: {{value}}', 'Verbrauchsabweichung: {{value}}'],
  ['Bağımlılık durumu', 'Abhängigkeitsstatus'],
  ['Seçili emir bloke. Beklenen emirler: {{orders}}', 'Ausgewählter Auftrag blockiert. Erwartete Aufträge: {{orders}}'],
  ['Seçili emir için aktif bağımlılık engeli yok.', 'Für den ausgewählten Auftrag besteht keine aktive Abhängigkeitssperre.'],
  ['Bu emir doğrudan bağlı bir önceki emir beklemiyor.', 'Dieser Auftrag wartet nicht direkt auf einen Vorgängerauftrag.'],
  ['Bloke', 'Blockiert'],
  ['Hazır', 'Bereit'],
  ['Durum: {{status}}', 'Status: {{status}}'],
  ['Transfer gerekli', 'Transfer erforderlich'],
  ['Çıktı gerekli', 'Output erforderlich'],
  ['Gecikme {{minutes}} dk', 'Verzögerung {{minutes}} Min.'],
  ['{{type}} / U:{{user}} / R:{{role}}', '{{type}} / B:{{user}} / R:{{role}}'],
  ['Bu emri seç', 'Diesen Auftrag auswählen'],
  ['Çıktılar', 'Outputs'],
  ['Tüketimler', 'Verbrauch'],
  ['Açık: {{value}}', 'Offen: {{value}}'],
  ['Tamam', 'Fertig'],
];

function flatten(obj, prefix = '', out = {}) {
  for (const [key, value] of Object.entries(obj ?? {})) {
    const nextKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) flatten(value, nextKey, out);
    else out[nextKey] = value;
  }
  return out;
}

function translateTr(text) {
  if (typeof text !== 'string') return null;
  if (KEY_OVERRIDES[text]) return KEY_OVERRIDES[text];
  for (const [from, to] of TR_PHRASES) {
    if (text === from) return to;
  }
  let result = text;
  for (const [from, to] of TR_PHRASES) {
    if (result.includes(from)) result = result.split(from).join(to);
  }
  return result !== text ? result : null;
}

const unresolved = JSON.parse(fs.readFileSync(UNRESOLVED_PATH, 'utf8'));
const trFlat = flatten(JSON.parse(fs.readFileSync(TR_PATH, 'utf8')));
const enFlat = flatten(JSON.parse(fs.readFileSync(EN_PATH, 'utf8')));
const existingPatch = fs.existsSync(PATCH_PATH) ? JSON.parse(fs.readFileSync(PATCH_PATH, 'utf8')) : {};
const patch = { ...existingPatch };
let added = 0;

for (const item of unresolved) {
  if (patch[item.key]) continue;
  if (KEY_OVERRIDES[item.key]) {
    patch[item.key] = KEY_OVERRIDES[item.key];
    added += 1;
    continue;
  }
  const trText = trFlat[item.key];
  const enText = enFlat[item.key];
  const source = typeof trText === 'string' && trText !== enText ? trText : item.source;
  const translated = translateTr(source);
  if (translated && translated !== item.de) {
    patch[item.key] = translated;
    added += 1;
  }
}

fs.writeFileSync(PATCH_PATH, JSON.stringify(patch, null, 2));
console.log(`Patch size: ${Object.keys(patch).length}, added: ${added}`);
