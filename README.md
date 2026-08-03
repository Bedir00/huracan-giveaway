# Bienenglück – Shopify-Theme für Imkereibedarf

Ein individuelles Shopify Online Store 2.0 Theme für einen Imkereibedarf-Shop. Markenwelt: Honiggold & Naturtöne, warme Serifen-Überschriften, klare Produktdarstellung.

## Inhalt

- **Startseite**: Hero-Banner, USP-Leiste, Kategorien (Bienenstöcke & Zargen, Schutzkleidung, Rähmchen & Wachs, Erntetechnik, Fütterung & Gesundheit, Zubehör & Werkzeug), Bestseller, Über-uns-Story, Kundenstimmen, Newsletter
- **Produktseite**: Bildergalerie, Varianten-Auswahl (mit automatischer Preis-/Verfügbarkeits-Aktualisierung), Warenkorb-Formular, Beschreibung, verwandte Produkte
- **Kollektionsseite**: Sortierung, Filter (Preis, Verfügbarkeit, Tags – über Shopify Search & Discovery), Paginierung
- **Warenkorb, Suche, 404, Seiten, Kollektionsübersicht**
- Vollständig auf Deutsch lokalisiert (`locales/de.default.json`)
- Alle Farben, Schriften, Layout-Breite und Social-Media-Links über den Theme-Editor einstellbar (`config/settings_schema.json`)

## Voraussetzungen

- Ein Shopify-Konto/Store
- [Shopify CLI](https://shopify.dev/docs/apps/tools/cli) installiert (`npm install -g @shopify/cli @shopify/theme`)

## Lokale Vorschau

```sh
shopify theme dev --store=dein-shop.myshopify.com
```

Öffnet eine lokale Vorschau des Themes mit Live-Reload.

## Theme in den Store hochladen

```sh
shopify theme push --store=dein-shop.myshopify.com
```

Zum Testen ohne das aktuell veröffentlichte Theme zu ersetzen:

```sh
shopify theme push --store=dein-shop.myshopify.com --unpublished --json
```

Danach im Shopify-Adminbereich unter **Onlineshop → Themes** das neue Theme veröffentlichen, sobald du zufrieden bist.

## Nächste Schritte im Shopify-Admin

1. **Produkte & Kollektionen anlegen**: Kategorien wie Bienenstöcke, Schutzkleidung, Rähmchen & Wachs, Erntetechnik, Fütterung & Gesundheit, Zubehör als Kollektionen erstellen und mit den vorbereiteten Kategorie-Kacheln auf der Startseite (Theme-Editor → Sektion „Kategorien") verknüpfen.
2. **Menü einrichten**: Unter **Onlineshop → Navigation** das Hauptmenü mit den Kollektionen befüllen.
3. **Logo & Bilder hochladen**: Theme-Editor → Sektion „Header" (Logo) und „Hero-Banner" (Titelbild).
4. **Zahlungsarten & Versand** unter **Einstellungen** konfigurieren.
5. **Rechtstexte** (Impressum, Widerruf, AGB, Datenschutz) als Seiten anlegen und im Footer-Menü verlinken – Pflicht für den deutschen Markt.
