# Pilzlotse – Landingpage

Fake-Door-Landingpage für das Hochschulprojekt (Inno/EP): Sie testet, ob Einsteiger:innen eine geführte erste Pilztour wollen und welche Preise passen.

**Online:** https://blackteawonder.github.io/Pilzlotse/landingpage/

## Inhalt

- `index.html` – die komplette Seite in einer Datei (Schriften, Kartenbibliothek Leaflet 1.9.4 und Geodaten eingebettet). Stand: v17 vom 28.11.2026 (Warteliste über Brevo). v16 vom 25.11.2026 (Name: Pilzlotse, vorher Waldlotse; Logo B „Pilz-Pin“ aus dem Branding-Set). Neu seit v10: Hinweis, dass die Handy-Vorschau klickbar ist, Umfrage deutlicher hervorgehoben, Lernen als Übersicht (Kapitel, Meine Lesezeichen, Meine Bücher, Wissensgraph), Pilz-Notruf mit Warndreieck nur unter Beratung. Auf dem Handy öffnet „App im Vollbild ansehen“ die Vorschau randlos wie eine App; „Schließen“ oben rechts, Zurück-Geste oder Escape beenden sie.

## Warteliste und Zählung

- **Warteliste (seit v17): Brevo.** Das Formular schickt die Anmeldung direkt an das Brevo-Formular „Warteliste Landingpage“ (Liste „Warteliste Pilzlotse“, #3). Felder: `EMAIL`, `GRUPPE`, `KANAL`, `TARIF`, `ZAHLUNGSBEREITSCHAFTZAHLUNGSBEREITSCHAFT` (ID in Brevo versehentlich doppelt, funktioniert so), dazu Honeypot `email_address_check` (leer), `locale=de`, `html_type=simple`.
- Double-Opt-in verschickt Brevo von hallo@pilzlotse.de (Domain bei Brevo authentifiziert). Nach dem Klick auf den Bestätigungslink leitet Brevo auf `?bestaetigt=1` weiter; die Seite zeigt dann „Danke, deine Anmeldung ist bestätigt!“ und zählt `doi_confirmed`.
- **Klickzählung:** läuft noch über `backend/warteliste.gs` (Google Apps Script, `CONFIG.trackingEndpoint`). Der Wartelisten-Teil des Skripts wird nicht mehr genutzt. Umstellung auf Supabase oder Plausible ist offen; danach `trackingEndpoint` und `trackingProvider` ändern.
- **Umfrage:** sichtbar bis `surveyUntil` (10.12.2026), danach blendet die Seite alle Umfrage-Hinweise aus. Anbieter steht in `surveyProvider` (FAQ und Datenschutzhinweis übernehmen ihn).
- Mit `?test=1` werden keine Klicks verschickt.

## Vor dem Teilen

Im Skript den Block `CONFIG` prüfen:

- `waitlist.endpoint` – Formular-Adresse des Wartelisten-Dienstes. Leer = Testbetrieb (die Seite sagt dann ehrlich, dass nichts gespeichert wird).
- `waitlist.deleteBy` – Löschdatum der Warteliste (JJJJ-MM-TT), erscheint im Datenschutzhinweis.
- `legal` – Name, Anschrift und E-Mail für Impressum und Datenschutz. Solange leer, steht dort ein Platzhalter.

## Nützlich

- `?test=1` zeigt die Testansicht mit allen gezählten Klicks.
- `?ref=instagram` (oder ein anderer Kanal) markiert, woher Besucher:innen kommen.

## Karte in der App-Vorschau

- Schutzgebiete und Waldrefugien: Ausschnitt Tübingen/Schönbuch aus den GeoJSON-Dateien in `www/`, vereinfacht.
- Routen: echte Wege aus OpenStreetMap (© OpenStreetMap-Mitwirkende, ODbL), berechnet mit BRouter.
- Kartenbilder lädt der Browser erst nach Tippen auf „Karte laden“ (OpenStreetMap, ersatzweise OpenTopoMap oder CyclOSM). Als lokale Datei oder in einer Datei-Vorschau kommen sie nicht an.

## Veröffentlichung

Der Workflow `.github/workflows/deploy.yml` stellt die App (`www/`) und diese Seite (`landingpage/` → `/landingpage/`) gemeinsam auf GitHub Pages. Der APK-Build ist davon nicht betroffen.
