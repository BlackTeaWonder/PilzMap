# Pilzlotse – Landingpage

Fake-Door-Landingpage für das Hochschulprojekt (Inno/EP): Sie testet, ob Einsteiger:innen eine geführte erste Pilztour wollen und welche Preise passen.

**Online:** https://blackteawonder.github.io/Pilzlotse/landingpage/

## Inhalt

- `index.html` – die komplette Seite in einer Datei (Schriften, Kartenbibliothek Leaflet 1.9.4 und Geodaten eingebettet). Stand: v16 vom 25.11.2026 (Name: Pilzlotse, vorher Waldlotse; Logo B „Pilz-Pin“ aus dem Branding-Set). Neu seit v10: Hinweis, dass die Handy-Vorschau klickbar ist, Umfrage deutlicher hervorgehoben, Lernen als Übersicht (Kapitel, Meine Lesezeichen, Meine Bücher, Wissensgraph), Pilz-Notruf mit Warndreieck nur unter Beratung. Auf dem Handy öffnet „App im Vollbild ansehen“ die Vorschau randlos wie eine App; „Schließen“ oben rechts, Zurück-Geste oder Escape beenden sie.

## Warteliste und Zählung

- `backend/warteliste.gs` – Google Apps Script. Speichert Anmeldungen (mit Bestätigungsmail, Double-Opt-in) und wichtige Klicks in der Google-Tabelle „Pilzlotse – Warteliste und Auswertung“ (Drive: PilzProjekt / Landingpage Warteliste). Das Blatt „Auswertung“ rechnet Eintragungsquote, Fake-Door-Quote, Preis-Antworten und Kanäle aus.
- Absender der Bestätigungsmails ist pilzlotse@gmx.de: Das Skript läuft im Google-Konto, dem die Tabelle gehört, und verschickt über Gmail „Senden als“ via GMX-Server. Es braucht nur die Berechtigung zum Senden (`gmail.send`), nicht zum Lesen des Postfachs.
- Einrichtung: Schritte A–F oben in `backend/warteliste.gs`; das Manifest liegt in `backend/appsscript.json`. Die Web-App-URL kommt in `CONFIG.waitlist.endpoint` und `CONFIG.trackingEndpoint`.
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
