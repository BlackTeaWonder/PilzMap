# Waldlotse – Landingpage

Fake-Door-Landingpage für das Hochschulprojekt (Inno/EP): Sie testet, ob Einsteiger:innen eine geführte erste Pilztour wollen und welche Preise passen.

**Online:** https://blackteawonder.github.io/PilzMap/landingpage/

## Inhalt

- `index.html` – die komplette Seite in einer Datei (Schriften, Kartenbibliothek Leaflet 1.9.4 und Geodaten eingebettet). Stand: v8 vom 22.11.2026.

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
