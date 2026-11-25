/**
 * Pilzlotse – Warteliste und Zählung für die Landingpage
 * (https://blackteawonder.github.io/Pilzlotse/landingpage/)
 *
 * Speichert Einträge in die Warteliste mit Double-Opt-in und zählt wichtige Klicks
 * (Besuche, Preisangebote, Umfrage, Vollbild) in der Google-Tabelle
 * „Pilzlotse – Warteliste und Auswertung“ (Drive: PilzProjekt / Landingpage Warteliste).
 * Keine Cookies, keine IP-Adressen (Apps Script gibt sie nicht weiter).
 *
 * Absender der Bestätigungsmails ist pilzlotse@gmx.de. Das Skript läuft im Google-Konto
 * maylila2000@gmail.com (dort liegt die Tabelle) und verschickt über die Gmail-Funktion „Senden als“,
 * die die Mail über den GMX-Server zustellt. Empfänger sehen nur pilzlotse@gmx.de.
 * Das Skript darf dafür nur Mails senden, nicht dein Postfach lesen (Berechtigung gmail.send).
 *
 * Einrichtung (einmalig, am Computer, ca. 15 Minuten):
 *  A. GMX (Konto waldlotse@gmx.de mit der zusätzlichen Adresse pilzlotse@gmx.de):
 *     Einstellungen → POP3/IMAP Abruf → „POP3 und IMAP Zugriff erlauben“.
 *  B. Gmail (maylila2000@gmail.com): Einstellungen → Konten und Import → „Senden als“ →
 *     „Weitere E-Mail-Adresse hinzufügen“: Name „Pilzlotse (Studienprojekt HKA)“, Adresse pilzlotse@gmx.de,
 *     Haken bei „Als Alias behandeln“ entfernen; SMTP-Server mail.gmx.net, Port 587, Nutzername pilzlotse@gmx.de (Anmeldung geht mit jeder Adresse des Kontos),
 *     GMX-Passwort, TLS. Den Bestätigungscode aus dem GMX-Postfach eintragen.
 *  C. script.google.com (als maylila2000@gmail.com) → Neues Projekt „Pilzlotse Warteliste“ →
 *     Projekteinstellungen → „appsscript.json-Manifestdatei im Editor anzeigen“ →
 *     appsscript.json durch die Datei appsscript.json aus diesem Ordner ersetzen, Code.gs durch diesen Code.
 *  D. Funktion „setup“ ausführen → Berechtigungen erteilen (Google warnt „App nicht überprüft“:
 *     Erweitert → Weiter zu … – das ist dein eigenes Skript). setup schickt eine Testmail an pilzlotse@gmx.de:
 *     Absender muss dort „Pilzlotse (Studienprojekt HKA) <pilzlotse@gmx.de>“ sein.
 *  E. Bereitstellen → Neue Bereitstellung → Typ „Web-App“ · Ausführen als: Ich · Zugriff: Jeder.
 *  F. Die Web-App-URL (endet auf /exec) in der Landingpage bei CONFIG.waitlist.endpoint
 *     und CONFIG.trackingEndpoint eintragen.
 *  Nach jeder Code-Änderung: Bereitstellen → Bereitstellungen verwalten → Bearbeiten → Version „Neu“.
 *
 * Limit: höchstens MAILS_PER_DAY Bestätigungsmails pro Tag. Darüber hinaus wird der Eintrag gespeichert
 * und die Mail am nächsten Morgen nachgeschickt.
 */

var CONFIG = {
  SHEET_ID: '1MWsyLL0I9YvEzomx5Jd5wJaW1tiwd17iyPLwKbfl3jU',
  SENDER_NAME: 'Pilzlotse (Studienprojekt HKA)',
  LANDINGPAGE_URL: 'https://blackteawonder.github.io/Pilzlotse/landingpage/',
  FROM_ADDRESS: 'pilzlotse@gmx.de',
  CONTACT_MAIL: 'pilzlotse@gmx.de',
  UNCONFIRMED_DELETE_DAYS: 30,
  MAILS_PER_DAY: 90
};

var SHEET_LIST = 'Warteliste';   // A Eingetragen | B E-Mail | C Mit wem | D Kanal | E Preisangebot | F Zahlungsbereitschaft | G Bestätigungsmail | H Bestätigt | I Token
var SHEET_EVENTS = 'Ereignisse'; // A Zeitpunkt | B Ereignis | C Sitzung | D Kanal | E Angebot | F Antwort | G Detail | H Version
var COL = { DATE: 1, EMAIL: 2, MAIL: 7, CONFIRMED: 8, TOKEN: 9 };

// Nur diese Ereignisse werden gespeichert (die Seite schickt auch nur diese).
var EVENTS = ['view', 'email_focus', 'group_select', 'submit_ok', 'submit_invalid', 'submit_error',
  'price_click', 'price_wtp', 'price_to_waitlist', 'cta_waitlist', 'survey_click', 'faq_open',
  'demo_fullscreen', 'demo_to_waitlist', 'demo_paywall', 'demo_tour_done', 'demo_wald_finden', 'demo_map_tiles'];
var GROUPS = ['allein', 'partner_freunde', 'kinder', 'gruppe'];
var PLANS = ['kostenlos', 'kapitel', 'saisonpass', 'buch'];
var WTP = ['Ja', 'Vielleicht', 'Eher nicht'];

/** Einmalig ausführen: prüft die Tabelle und legt die tägliche Aufgabe an. */
function setup() {
  var ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  ['Auswertung', SHEET_LIST, SHEET_EVENTS].forEach(function (n) {
    if (!ss.getSheetByName(n)) throw new Error('Blatt fehlt: ' + n);
  });
  ScriptApp.getProjectTriggers().forEach(function (t) { ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('daily').timeBased().everyDays(1).atHour(7).create();
  sendMail_(CONFIG.FROM_ADDRESS, 'Pilzlotse: Testmail aus dem Warteliste-Skript',
    'Wenn diese Mail von ' + CONFIG.FROM_ADDRESS + ' kommt, ist „Senden als“ richtig eingerichtet.',
    '<p>Wenn diese Mail von <b>' + CONFIG.FROM_ADDRESS + '</b> kommt, ist „Senden als“ richtig eingerichtet.</p>');
  Logger.log('Bereit. Tabelle: ' + ss.getUrl() + ' · Testmail an ' + CONFIG.FROM_ADDRESS + ' verschickt. Bitte dort den Absender prüfen.');
}

/** Empfängt Anmeldungen (Formulardaten) und Klicks (JSON als Text) von der Landingpage. */
function doPost(e) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return text_('busy');
  try {
    var ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    var p = (e && e.parameter) || {};
    if (p.email) return signup_(ss, p);

    var d;
    try { d = JSON.parse((e && e.postData && e.postData.contents) || '{}'); } catch (x) { return text_('ignored'); }
    if (!d || EVENTS.indexOf(d.e) === -1) return text_('ignored');
    var q = (d.p && typeof d.p === 'object') ? d.p : {};
    ss.getSheetByName(SHEET_EVENTS).appendRow([
      new Date(), d.e, cell_(d.sid, 20), cell_(d.ref, 40),
      cell_(q.plan, 20), cell_(q.a || q.v, 20), cell_(JSON.stringify(q), 300), cell_(d.v, 20)
    ]);
    return text_('ok');
  } catch (err) {
    console.error(err);
    return text_('error');
  } finally {
    lock.releaseLock();
  }
}

function signup_(ss, p) {
  var email = String(p.email).trim().toLowerCase().slice(0, 200);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || p.einwilligung !== 'ja') return text_('invalid');
  var list = ss.getSheetByName(SHEET_LIST);
  if (findRow_(list, COL.EMAIL, email) !== -1) return text_('ok'); // schon eingetragen: keine zweite Mail
  var token = Utilities.getUuid();
  list.appendRow([new Date(), cell_(email, 200), pick_(p.gruppe, GROUPS), cell_(p.kanal, 40),
    pick_(p.tarif, PLANS), pick_(p.zahlen, WTP), 'ausstehend', '', token]);
  var row = list.getLastRow();
  if (canSend_()) {
    sendConfirmMail_(email, token);
    list.getRange(row, COL.MAIL).setValue('gesendet');
  }
  return text_('ok');
}

/** Bestätigungs- und Abmeldelinks aus der Mail. */
function doGet(e) {
  var p = (e && e.parameter) || {};
  var list = SpreadsheetApp.openById(CONFIG.SHEET_ID).getSheetByName(SHEET_LIST);

  if (p.confirm) {
    var r = findRow_(list, COL.TOKEN, p.confirm);
    if (r === -1) return page_('Link nicht gefunden', 'Dieser Bestätigungslink ist ungültig oder der Eintrag wurde bereits gelöscht.');
    if (!list.getRange(r, COL.CONFIRMED).getValue()) list.getRange(r, COL.CONFIRMED).setValue(new Date());
    return page_('Bestätigt!', 'Du stehst jetzt auf der Warteliste von Pilzlotse. Wir melden uns, sobald du die App testen kannst.');
  }
  if (p.unsubscribe) {
    var r2 = findRow_(list, COL.TOKEN, p.unsubscribe);
    if (r2 !== -1) list.deleteRow(r2);
    return page_('Abgemeldet', 'Deine E-Mail-Adresse wurde von der Warteliste gelöscht.');
  }
  return text_('Pilzlotse-Warteliste läuft.');
}

/** Täglich: ausstehende Bestätigungsmails nachschicken, unbestätigte Einträge nach X Tagen löschen. */
function daily() {
  var list = SpreadsheetApp.openById(CONFIG.SHEET_ID).getSheetByName(SHEET_LIST);
  var data = list.getDataRange().getValues();
  var limit = new Date(Date.now() - CONFIG.UNCONFIRMED_DELETE_DAYS * 864e5);
  for (var i = data.length - 1; i >= 1; i--) {
    var row = data[i];
    if (!row[COL.CONFIRMED - 1] && row[0] instanceof Date && row[0] < limit) { list.deleteRow(i + 1); continue; }
    if (row[COL.MAIL - 1] === 'ausstehend' && canSend_()) {
      sendConfirmMail_(String(row[COL.EMAIL - 1]), String(row[COL.TOKEN - 1]));
      list.getRange(i + 1, COL.MAIL).setValue('gesendet');
    }
  }
}

function sendConfirmMail_(email, token) {
  var base = ScriptApp.getService().getUrl();
  var confirmUrl = base + '?confirm=' + encodeURIComponent(token);
  var unsubUrl = base + '?unsubscribe=' + encodeURIComponent(token);
  var plain =
    'Hallo,\n\n' +
    'danke für dein Interesse an Pilzlotse, deinem ersten Pilzguide.\n' +
    'Bitte bestätige deine E-Mail-Adresse, damit wir dir schreiben dürfen, sobald du die App testen kannst:\n\n' +
    confirmUrl + '\n\n' +
    'Du hast dich nicht eingetragen? Dann ignoriere diese Mail einfach. Ohne Bestätigung löschen wir die Adresse nach ' + CONFIG.UNCONFIRMED_DELETE_DAYS + ' Tagen.\n\n' +
    'Abmelden: ' + unsubUrl + '\n\n' +
    'Pilzlotse ist ein Studienprojekt an der Hochschule Karlsruhe.\n' +
    'Impressum und Datenschutz: ' + CONFIG.LANDINGPAGE_URL + ' (unten auf der Seite)\n' +
    'Kontakt: ' + CONFIG.CONTACT_MAIL;
  var html =
    '<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#15332D;max-width:520px">' +
    '<p>Hallo,</p><p>danke für dein Interesse an <b>Pilzlotse</b>, deinem ersten Pilzguide.</p>' +
    '<p>Bitte bestätige deine E-Mail-Adresse, damit wir dir schreiben dürfen, sobald du die App testen kannst:</p>' +
    '<p><a href="' + confirmUrl + '" style="display:inline-block;background:#174336;color:#FFF8DF;padding:12px 20px;border-radius:10px;text-decoration:none">E-Mail-Adresse bestätigen</a></p>' +
    '<p style="font-size:13px;color:#3B5550">Du hast dich nicht eingetragen? Dann ignoriere diese Mail einfach. Ohne Bestätigung löschen wir die Adresse nach ' + CONFIG.UNCONFIRMED_DELETE_DAYS + ' Tagen.</p>' +
    '<p style="font-size:13px;color:#3B5550">Pilzlotse ist ein Studienprojekt an der Hochschule Karlsruhe · <a href="' + CONFIG.LANDINGPAGE_URL + '" style="color:#3F6E44">Impressum und Datenschutz</a> · <a href="' + unsubUrl + '" style="color:#3F6E44">Abmelden</a></p>' +
    '</div>';
  sendMail_(email, 'Bitte bestätige deine Anmeldung bei Pilzlotse', plain, html);
}

/** Verschickt über die Gmail-API mit dem „Senden als“-Absender (nur Berechtigung gmail.send). */
function sendMail_(to, subject, plain, html) {
  var b64 = function (s) { return Utilities.base64Encode(s, Utilities.Charset.UTF_8).replace(/.{76}/g, '$&\r\n'); };
  var word = function (s) { return '=?UTF-8?B?' + Utilities.base64Encode(s, Utilities.Charset.UTF_8) + '?='; };
  var boundary = 'wl' + Utilities.getUuid().replace(/-/g, '');
  var raw = [
    'From: ' + word(CONFIG.SENDER_NAME) + ' <' + CONFIG.FROM_ADDRESS + '>',
    'To: ' + to,
    'Reply-To: ' + CONFIG.CONTACT_MAIL,
    'Subject: ' + word(subject),
    'MIME-Version: 1.0',
    'Content-Type: multipart/alternative; boundary="' + boundary + '"',
    '',
    '--' + boundary,
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    b64(plain),
    '--' + boundary,
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    b64(html),
    '--' + boundary + '--',
    ''
  ].join('\r\n');
  Gmail.Users.Messages.send({ raw: Utilities.base64EncodeWebSafe(raw, Utilities.Charset.UTF_8) }, 'me');
}

/** Tageszähler für Bestätigungsmails. */
function canSend_() {
  var props = PropertiesService.getScriptProperties();
  var key = 'mails_' + Utilities.formatDate(new Date(), 'Europe/Berlin', 'yyyy-MM-dd');
  var n = Number(props.getProperty(key) || 0);
  if (n >= CONFIG.MAILS_PER_DAY) return false;
  props.setProperty(key, String(n + 1));
  return true;
}

function findRow_(sheet, col, value) {
  if (!value) return -1;
  var last = sheet.getLastRow();
  if (last < 2) return -1;
  var vals = sheet.getRange(2, col, last - 1, 1).getValues();
  for (var i = 0; i < vals.length; i++) if (String(vals[i][0]) === String(value)) return i + 2;
  return -1;
}

/** Text kürzen und Formel-Einschleusung verhindern (= + - @ am Anfang). */
function cell_(v, n) {
  var s = String(v == null ? '' : v).slice(0, n || 200);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}
function pick_(v, allowed) { return allowed.indexOf(String(v || '')) === -1 ? '' : String(v); }
function text_(s) { return ContentService.createTextOutput(s); }
function page_(title, msg) {
  var html =
    '<div style="margin:0;padding:1px 0;font-family:Arial,sans-serif;background:#0E1511;color:#E3EADB;min-height:100vh">' +
    '<div style="max-width:520px;margin:12vh auto;padding:28px;background:#162019;border-radius:18px;border:1px solid rgba(197,243,111,.25)">' +
    '<h1 style="font-size:26px;margin:0 0 10px;color:#C5F36F">' + title + '</h1><p style="font-size:16px;line-height:1.6">' + msg + '</p>' +
    '<p><a href="' + CONFIG.LANDINGPAGE_URL + '" target="_top" style="color:#C5F36F">Zurück zu Pilzlotse</a></p></div></div>';
  return HtmlService.createHtmlOutput(html).setTitle('Pilzlotse').addMetaTag('viewport', 'width=device-width, initial-scale=1');
}
