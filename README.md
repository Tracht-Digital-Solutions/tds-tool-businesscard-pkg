# tds-tool-businesscard

Visitenkarten-Designer für die TDS-Werkzeugplattform (`tds-tools`).

Eine Visitenkarte im Browser gestalten — Inhalt, Akzentfarbe, Fläche, Ecken,
Schatten und Aufteilung — mit Vorschau in Echtzeit und PNG-Download in
Druckauflösung (85 × 55 mm, 300 dpi). Alles lokal: kein Upload, kein Konto,
nichts verlässt die Seite.

## Installation

```bash
npm install @tracht-digital-solutions/tds-tool-businesscard
```

Im Werkzeug-Site-Katalog registrieren wie jeden anderen Pack:

```ts
import businesscard from "@tracht-digital-solutions/tds-tool-businesscard";

composeToolPacks([/* … */, businesscard]);
```

## Aufbau

| Datei | Rolle |
|---|---|
| `src/index.ts` | `ToolPackManifest` — Identität, Slug, SEO, Komponentenpfad |
| `src/card.ts` | Geometrie und der EINE Zeichner (kein DOM außer dem 2D-Kontext) |
| `tools/CardDesigner.astro` | Hülle, die die Werkzeugseite einsetzt |
| `islands/CardDesigner.tsx` | Regler, Vorschau-Canvas und Download |

Die Vorschau **ist** der Export: beides ist derselbe Aufruf von `drawCard`, nur
mit anderem Maßstab. Eine Abweichung zwischen dem, was jemand gesehen, und dem,
was er heruntergeladen hat, lässt sich damit nicht ausdrücken.

## Befehle

```bash
npm install --no-package-lock
npm run build            # tsup → ESM + CJS + d.ts
npm run type-check
npm run test:run
npm run lint:primitives  # kein Bedienelement ohne die geteilten Klassen
```

Mehr zu den Invarianten: `AGENTS.md`.

## Lizenz / License

**Öffentlich einsehbar, alle Rechte vorbehalten.** Der Code kann gelesen und
zur Beurteilung der Programmierkenntnisse betrachtet werden. Es besteht keine
allgemeine Erlaubnis zum Kopieren, Verändern oder kommerziellen Weiterverwenden.
Die vollständigen Bedingungen und Ausnahmen stehen in [LICENSE](LICENSE).

**Publicly viewable, all rights reserved.** Public access permits inspection of
the code, but grants no general permission to copy, modify or commercially reuse
it. See [LICENSE](LICENSE) for the complete terms and exceptions.
