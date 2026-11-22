# Waldlotse – Landingpage

Fake-Door-Landingpage für das Hochschulprojekt (Inno/EP): Sie testet, ob Einsteiger:innen eine geführte erste Pilztour wollen und welche Preise passen.

**Online:** https://blackteawonder.github.io/PilzMap/landingpage/

## Inhalt

- `index.html` – die komplette Seite in einer Datei (Schriften, Kartenbibliothek Leaflet 1.9.4 und Geodaten eingebettet). Stand: v9 vom 22.11.2026. Auf dem Handy öffnet „App im Vollbild ansehen“ die Vorschau randlos wie eine App; „Schließen“ oben rechts, Zurück-Geste oder Escape beenden sie.

## Warteliste und Zählung

- `backend/warteliste.gs` – Google Apps Script. Speichert Anmeldungen (mit Bestätigungsmail, Double-Opt-in) und wichtige Klicks in der Google-Tabelle „Waldlotse – Warteliste und Auswertung“ (Drive: PilzProjekt / Landingpage Warteliste). Das Blatt „Auswertung“ rechnet Eintragungsquote, Fake-Door-Quote, Preis-Antworten und Kanäle aus.
- Einrichtung mit dem Projektkonto waldlotse@gmail.com (Absender der Bestätigungsmails; die Tabelle ist mit ihm geteilt): script.google.com → neues Projekt → Code einfügen → `setup` ausführen → als Web-App bereitstellen (Ausführen als: Ich, Zugriff: Jeder). Die Web-App-URL kommt in `CONFIG.waitlist.endpoint` und `CONFIG.trackingEndpoint`.
- Mit `?test=1` werden keine Klicks verschickt.

## Vor dem Teilen

Im Skript den Block `CONFIG` ergänzen:

- `waitlist.endpoint` – Formular-Adresse des Wartelisten-Dienstes. Leer = Testbetrieb (die Seite sagt dann ehrlich, dass nichts gespeichert wird).
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
