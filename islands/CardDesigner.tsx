import { useEffect, useMemo, useRef, useState } from "react";
import {
  CARD_MM,
  CORNERS,
  DEFAULT_SPEC,
  PREVIEW_SCALE,
  PRINT_SCALE,
  SURFACES,
  canvasSize,
  drawCard,
  readableAccent,
  type CardCorner,
  type CardLayout,
  type CardShadow,
  type CardSpec,
  type CardSurface,
} from "../src/card";

/** See the tools-site convention: labels are translated, logic is not. */
type Lang = "de" | "en";

interface Strings {
  content: string;
  name: string;
  role: string;
  company: string;
  phone: string;
  email: string;
  website: string;
  look: string;
  accent: string;
  surface: string;
  corner: string;
  shadow: string;
  layout: string;
  bar: string;
  preview: string;
  download: string;
  downloadHint: string;
  reset: string;
  accentAdjusted: string;
  surfaces: Record<CardSurface, string>;
  corners: Record<CardCorner, string>;
  shadows: Record<CardShadow, string>;
  layouts: Record<CardLayout, string>;
}

const STRINGS: Record<Lang, Strings> = {
  de: {
    content: "Inhalt",
    name: "Name",
    role: "Position",
    company: "Firma",
    phone: "Telefon",
    email: "E-Mail",
    website: "Webseite",
    look: "Aussehen",
    accent: "Akzentfarbe",
    surface: "Fläche",
    corner: "Ecken",
    shadow: "Schatten",
    layout: "Aufteilung",
    bar: "Farbbalken zeigen",
    preview: "Vorschau",
    download: "Als PNG herunterladen",
    downloadHint: "85 × 55 mm, 300 dpi — Druckauflösung.",
    reset: "Zurücksetzen",
    accentAdjusted: "Die Farbe wurde aufgehellt, damit sie auf dieser Fläche lesbar bleibt.",
    surfaces: { paper: "Papier", sand: "Sand", navy: "Navy", ink: "Anthrazit" },
    corners: { sharp: "Scharf", soft: "Leicht", round: "Rund" },
    shadows: { none: "Ohne", hard: "Hart", soft: "Weich" },
    layouts: { left: "Linksbündig", centre: "Zentriert", band: "Mit Farbband" },
  },
  en: {
    content: "Content",
    name: "Name",
    role: "Role",
    company: "Company",
    phone: "Phone",
    email: "Email",
    website: "Website",
    look: "Look",
    accent: "Accent colour",
    surface: "Surface",
    corner: "Corners",
    shadow: "Shadow",
    layout: "Layout",
    bar: "Show the colour bar",
    preview: "Preview",
    download: "Download as PNG",
    downloadHint: "85 × 55 mm at 300 dpi — print resolution.",
    reset: "Reset",
    accentAdjusted: "The colour was lightened so it stays readable on this surface.",
    surfaces: { paper: "Paper", sand: "Sand", navy: "Navy", ink: "Charcoal" },
    corners: { sharp: "Sharp", soft: "Slight", round: "Round" },
    shadows: { none: "None", hard: "Hard", soft: "Soft" },
    layouts: { left: "Left aligned", centre: "Centred", band: "With a colour band" },
  },
};

/**
 * A business card, designed in the browser.
 *
 * The preview and the download are the SAME renderer (`src/card.ts`) at two
 * scales, so the file that lands in the visitor's downloads folder cannot
 * differ from the card they approved. Everything is local: no upload, no
 * account, nothing leaves the page.
 */
export default function CardDesigner({ lang = "de" as Lang }: { lang?: Lang }) {
  const t = STRINGS[lang];
  const [spec, setSpec] = useState<CardSpec>(DEFAULT_SPEC);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const set = <K extends keyof CardSpec>(key: K, value: CardSpec[K]) =>
    setSpec((current) => ({ ...current, [key]: value }));

  const preview = useMemo(() => canvasSize(spec, PREVIEW_SCALE), [spec]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    // Device pixels, so the card is not a blurred copy of itself on a retina
    // screen; CSS keeps the box at the layout size.
    const dpr = Math.min(3, window.devicePixelRatio || 1);
    canvas.width = Math.round(preview.width * dpr);
    canvas.height = Math.round(preview.height * dpr);
    drawCard(ctx as unknown as Parameters<typeof drawCard>[0], spec, PREVIEW_SCALE * dpr);
  }, [spec, preview.width, preview.height]);

  const download = () => {
    const size = canvasSize(spec, PRINT_SCALE);
    const out = document.createElement("canvas");
    out.width = size.width;
    out.height = size.height;
    const ctx = out.getContext("2d");
    if (!ctx) return;
    drawCard(ctx as unknown as Parameters<typeof drawCard>[0], spec, PRINT_SCALE);
    const a = document.createElement("a");
    a.href = out.toDataURL("image/png");
    a.download = "visitenkarte.png";
    a.click();
  };

  /** The picker's colour, and the one the card actually uses. */
  const applied = readableAccent(spec.accent, spec.surface);
  const adjusted = applied.toLowerCase() !== spec.accent.toLowerCase();

  const field = "field-boxed w-full";
  const text = (key: "name" | "role" | "company" | "phone" | "email" | "website") => (
    <label className="block text-sm">
      <span className="mb-1 block opacity-80">{t[key]}</span>
      <input className={field} value={spec[key]} onChange={(event) => set(key, event.target.value)} />
    </label>
  );

  const choice = <K extends "surface" | "corner" | "shadow" | "layout">(
    key: K,
    values: readonly CardSpec[K][],
    names: Record<string, string>,
  ) => (
    <fieldset>
      <legend className="mb-1 block text-sm opacity-80">{t[key]}</legend>
      <div className="flex flex-wrap gap-2">
        {values.map((value) => (
          <button
            key={String(value)}
            type="button"
            className={spec[key] === value ? "chip chip-active" : "chip"}
            aria-pressed={spec[key] === value}
            onClick={() => set(key, value)}
          >
            {names[String(value)]}
          </button>
        ))}
      </div>
    </fieldset>
  );

  return (
    <div className="bc-tool grid gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
      <div className="bc-tool__form space-y-5">
        <fieldset className="space-y-3">
          <legend className="eyebrow mb-1">{t.content}</legend>
          {text("name")}
          {text("role")}
          {text("company")}
          {text("phone")}
          {text("email")}
          {text("website")}
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="eyebrow mb-1">{t.look}</legend>

          <label className="block text-sm">
            <span className="mb-1 block opacity-80">{t.accent}</span>
            {/* The shared control geometry, like every other text control in
                the pack — a colour input with no `field` class loses its
                border to Tailwind's preflight and reads as a floating swatch.

                The width is an inline style and NOT a `w-24` utility:
                `.field-boxed` carries `width: 100%` and comes from tds-shared
                UNLAYERED, so it beats any utility class regardless of order.
                With the utility the picker rendered as a full-width bar,
                which is the one shape nobody reads as a colour. */}
            <input
              type="color"
              className="field-boxed"
              style={{ width: "6rem" }}
              value={spec.accent}
              onChange={(event) => set("accent", event.target.value)}
              aria-describedby={adjusted ? "bc-accent-note" : undefined}
            />
          </label>
          {adjusted && (
            <p id="bc-accent-note" className="text-sm opacity-80">
              {t.accentAdjusted}
            </p>
          )}

          {choice("surface", Object.keys(SURFACES) as CardSurface[], t.surfaces)}
          {choice("corner", Object.keys(CORNERS) as CardCorner[], t.corners)}
          {choice("shadow", ["none", "hard", "soft"] as CardShadow[], t.shadows)}
          {choice("layout", ["left", "centre", "band"] as CardLayout[], t.layouts)}

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={spec.showBar}
              onChange={(event) => set("showBar", event.target.checked)}
            />
            <span>{t.bar}</span>
          </label>
        </fieldset>

        <button type="button" className="btn btn-ghost" onClick={() => setSpec(DEFAULT_SPEC)}>
          {t.reset}
        </button>
      </div>

      <div className="bc-tool__preview space-y-3">
        <p className="eyebrow">{t.preview}</p>
        {/* The card is decoration for assistive tech: every word on it is in
            the form above, and reading the canvas out would say them twice. */}
        <canvas
          ref={canvasRef}
          role="presentation"
          style={{ width: `${preview.width}px`, height: `${preview.height}px`, maxWidth: "100%" }}
        />
        <div className="space-y-1">
          <button type="button" className="btn btn-primary" onClick={download}>
            {t.download}
          </button>
          <p className="text-sm opacity-80">{t.downloadHint}</p>
        </div>
      </div>
    </div>
  );
}

export { CARD_MM };
