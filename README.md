# Akquise CRM

Ein fokussiertes Akquise-Tool für ein kleines Vertriebsteam - kein überladenes CRM.
Die App beantwortet zwei Fragen:

- **Mitarbeiter:** „Wen muss ich heute kontaktieren und was ist bei diesem Lead als Nächstes zu tun?“
- **Admin:** „Was macht mein Akquise-Team gerade und wie erfolgreich ist es?“

Desktop, Tablet und Smartphone werden gleichwertig unterstützt; auf dem Handy lässt sich
die App als PWA installieren und wie eine normale App nutzen.

## Schnellstart

```bash
npm install
cp .env.example .env      # Datenbank und Admin-Zugang anpassen
npm run setup             # Prisma-Client, Datenbank, Demodaten
npm run dev               # http://localhost:3000
```

`npm run setup` legt einen Admin an und - sofern `SEED_DEMO=false` nicht gesetzt ist - ein
kleines Demo-Team mit 20 Leads, Historie, Follow-ups, Terminen und acht Akquise-Vorlagen.

Zugänge nach dem Seed:

| Rolle       | E-Mail                                       | Passwort                                |
| ----------- | -------------------------------------------- | --------------------------------------- |
| Admin       | `admin@example.com` (aus `SEED_ADMIN_EMAIL`) | `admin1234` (aus `SEED_ADMIN_PASSWORD`) |
| Mitarbeiter | `lena@example.com`                           | `demo1234`                              |
| Mitarbeiter | `kevin@example.com`                          | `demo1234`                              |

Für eine leere Produktivinstanz: `SEED_DEMO=false npm run setup`.

> **Vor dem Livegang:** Das Admin-Passwort in der App ändern und die Demo-Zugänge unter
> „Team“ deaktivieren (oder direkt mit `SEED_DEMO=false` starten).

## Skripte

| Befehl                            | Zweck                                               |
| --------------------------------- | --------------------------------------------------- |
| `npm run dev`                     | Entwicklungsserver                                  |
| `npm run build` / `npm run start` | Produktionsbuild und -server                        |
| `npm run db:push`                 | Schema in die Datenbank übertragen                  |
| `npm run db:seed`                 | Admin (und Demodaten) anlegen - mehrfach ausführbar |
| `npm run setup`                   | `generate` + `db:push` + `db:seed`                  |

## Technik

- **Next.js 15** (App Router, Server Actions) und **React 19**
- **Prisma** mit **SQLite** - für mehr Last genügt es, in `prisma/schema.prisma`
  `provider = "postgresql"` zu setzen und `DATABASE_URL` zu ändern; das Modell nutzt
  bewusst keine SQLite-Eigenheiten
- **Tailwind CSS 4** mit eigenem Token-Set (Light/Dark, feste Farbe je Pipeline-Stufe)
- **Eigene Authentifizierung**: `scrypt`-Passworthashes, Sessions in der Datenbank,
  HttpOnly-/SameSite-Cookie mit einem 256-Bit-Zufallstoken - keine externen
  Auth-Abhängigkeiten
- **Keine UI-, Icon- oder Chart-Bibliothek**: Icons, Diagramme, Drag & Drop und der
  CSV-Parser sind Teil des Projekts

## Rollen

|                                        | Admin     | Akquise-Mitarbeiter |
| -------------------------------------- | --------- | ------------------- |
| Leads sehen                            | alle      | nur die eigenen     |
| Leads anlegen / bearbeiten             | ✓         | ✓                   |
| Leads zuweisen, übernehmen, übertragen | ✓         | –                   |
| Leads löschen                          | ✓         | –                   |
| Aktivitäten, Follow-ups, Termine       | ✓         | ✓ (eigene Leads)    |
| Vorlagen                               | verwalten | kopieren            |
| Team, Analytics                        | ✓         | –                   |

Die Sichtbarkeitsregel liegt an einer einzigen Stelle (`src/lib/filters.ts` und
`src/lib/access.ts`) und wird in jeder Abfrage und jeder Server Action angewendet.

## Funktionsumfang

**Dashboard** - „Heute“-Panel (Leads zu bearbeiten, Follow-ups, überfällig, neue Leads,
neue Antworten, Termine), die Arbeitswarteschlange „Jetzt dran“, Pipeline-Verteilung,
eigene Follow-ups und Termine. Mitarbeiter sehen ihre eigenen Kennzahlen, Admins
zusätzlich Team-Tabelle, Quoten und Funnel.

**Leads** - Volltextsuche über Firma, Ansprechpartner, Telefon, E-Mail und Website;
Filter nach Status, Mitarbeiter, Branche, Quelle, Priorität, Potenzial, nächster Aufgabe
und Zeitraum. Filter stehen in der URL, sind also teilbar - und der CSV-Export übernimmt
genau die aktuelle Auswahl. Mobil Karten mit Schnellaktionen, auf dem Desktop eine
dichte Tabelle.

**Lead-Detailseite** - Unternehmensdaten, mehrere Ansprechpartner mit bevorzugtem
Kontaktweg, Pipeline-Stepper, vollständige Aktivitätshistorie, Follow-ups, Termine,
erkanntes Potenzial samt vorgeschlagenem Akquise-Ansatz und die Zurechnung
(gefunden / bearbeitet / Termin / Abschluss).

**Pipeline** - Kanban-Board über acht Stufen mit Drag & Drop (Desktop) bzw. Pfeilen
(Touch), optimistisch aktualisiert.

**Aufgaben** - alle Follow-ups nach überfällig / heute / morgen / Woche / später,
Abhaken und Verschieben um 1 oder 7 Tage direkt aus der Liste.

**Termine** - Agenda-Ansicht, Ergebnis eines Termins per Klick; ein neuer Termin setzt
den Lead automatisch auf „Termin vereinbart“.

**Vorlagen** - Telefon-Skripte, WhatsApp-, Instagram-, LinkedIn- und E-Mail-Vorlagen mit
Platzhaltern; Admin verwaltet, Mitarbeiter kopieren.

**Team** - Zugänge, Rollen, Passwort zurücksetzen, Leads eines Mitarbeiters übertragen
sowie Leistungsvergleich.

**Analytics** - Kontakt-, Antwort-, Termin- und Abschlussquote, Funnel von Lead bis
Kunde, Lead-Quellen, Mitarbeitervergleich, erkannte Potenziale und Verlustgründe -
jeweils für 30 Tage, den Monat, 90 Tage oder gesamt.

**Import & Export** - CSV-Import mit Spaltenerkennung (deutsche und englische
Bezeichnungen), Duplikatprüfung und Fehlerbericht; CSV-Export mit Semikolon und BOM,
damit Excel die Datei direkt korrekt öffnet.

## Zwei Dinge, die die App bewusst automatisch tut

Dokumentation darf nicht mehr Zeit kosten als Akquise. Deshalb:

- **Der Status bewegt sich mit.** Wer einen Kontaktversuch dokumentiert, setzt den Lead
  automatisch auf „Kontakt aufgenommen“; „hat geantwortet“ setzt ihn auf „Antwort
  erhalten“; ein neuer Termin auf „Termin vereinbart“.
- **Der nächste Schritt lässt sich im selben Formular festlegen.** Anruf dokumentieren und
  Follow-up planen ist ein Absenden, nicht zwei.

Für Auswertungen wird zusätzlich festgehalten, welche Stufe ein Lead **maximal** erreicht
hat (`maxStage` und die `first…At`-Zeitstempel). Dadurch zählt ein später verlorener Lead
im Funnel weiterhin für die Stufen, die er tatsächlich durchlaufen hat.

## Duplikatprüfung

Beim Anlegen und Bearbeiten wird schon während der Eingabe gegen Firmenname, Domain,
Telefonnummer und E-Mail geprüft - normalisiert, das heißt ohne Rechtsform, ohne `www.`
und nur über die letzten neun Ziffern der Telefonnummer. Die Prüfung läuft absichtlich
über alle Leads, auch über die von Kolleginnen und Kollegen: Genau so wird verhindert,
dass zwei Mitarbeiter dasselbe Unternehmen anrufen. Gefunden wird gewarnt, nicht
blockiert - „Trotzdem anlegen“ bleibt möglich.

## Benachrichtigungen

Bewusst dezent: ein kleiner Punkt an der Glocke, kein Ton, kein Browser-Push. Überfällige
Follow-ups sind das Einzige, was rot wird. Hinweise zu Follow-ups und Terminen werden
live berechnet und verschwinden von selbst, sobald die Aufgabe erledigt ist; gespeichert
werden nur Ereignisse an fremden Leads (Zuweisung, Statusänderung, neue Antwort) - und
niemals für die Person, die sie selbst ausgelöst hat.

## Projektstruktur

```
prisma/
  schema.prisma          Datenmodell
  seed.mjs               Admin + Demodaten
src/
  app/
    (app)/               Angemeldeter Bereich (Shell mit Sidebar + Bottom-Nav)
    actions/             Server Actions - der komplette Schreibpfad
    api/                 CSV-Export, Import-Vorlage, Suche, Duplikatprüfung
    login/               Anmeldung
    globals.css          Design-Tokens und Komponentenklassen
  components/            UI, Icons, Charts, Lead-Bausteine
  lib/                   Domänenlogik: Auth, Filter, Statistik, Stufenlogik, CSV
```

## Vorbereitet für später

Das Datenmodell trägt die Punkte aus dem Briefing bereits mit, ohne dass sie die
Oberfläche heute belasten:

- **Provision** - `foundById`, `ownerId`, `appointmentSetById`, `closedById` und
  `dealValue` werden von Anfang an gefüllt
- **Lead Score** - Feld `score` (1-100) liegt im Modell
- **Google Calendar** - Termine tragen Datum, Dauer, Art, Teilnehmer und Ergebnis
- **KI-Recherche und -Nachrichten** - erkannte Potenziale sind strukturiert gespeichert
  und mit einem Akquise-Ansatz verknüpft (`src/lib/constants.ts`)
- **Google-Maps-Import** - der CSV-Import ist der vorgesehene Einstiegspunkt

## Hinweise zum Betrieb

- Zeitzone: „heute“ richtet sich nach der Serverzeit. Auf dem Host `TZ=Europe/Berlin`
  setzen.
- SQLite-Datei nicht ins Repository - `.gitignore` deckt `prisma/*.db` ab.
- Der Service Worker liefert Seiten nie aus dem Cache; offline erscheint eine
  Hinweisseite. Leads sind immer aktuell.
