/**
 * The business card, as geometry and one drawing function.
 *
 * ### Why the preview IS the export
 *
 * The obvious build is an HTML card for the preview and a second renderer for
 * the download. That is two implementations of one design, and they drift: the
 * file a visitor downloads stops being the card they approved, usually in the
 * details nobody re-checks (a font fallback, a shadow offset, a rounding).
 * There is one renderer here, it draws to a canvas, and the preview is that
 * canvas at screen size while the download is the same call at print size. A
 * difference between what was seen and what was saved is therefore not
 * expressible.
 *
 * ### Units
 *
 * Everything below is in MILLIMETRES on a standard 85 × 55 mm card, and
 * `scale` turns those into device pixels: `scale` 4 is a ~344 px preview,
 * `scale` 35.4 is 300 dpi for print. So a layout decision is taken once, in the
 * units a printer uses, instead of in pixels that mean something different on
 * every screen.
 *
 * No DOM beyond the 2D context it is handed, so the rules are testable against
 * a recording stub.
 */

/** The ISO 7810 ID-1-ish card every German print shop quotes for. */
export const CARD_MM = { width: 85, height: 55 } as const;

/** Preview scale (px per mm) and the scale a 300 dpi export uses. */
export const PREVIEW_SCALE = 5;
export const PRINT_SCALE = 300 / 25.4;

export type CardSurface = "paper" | "sand" | "navy" | "ink";
export type CardCorner = "sharp" | "soft" | "round";
export type CardShadow = "none" | "hard" | "soft";
export type CardLayout = "left" | "centre" | "band";

export interface CardSpec {
  name: string;
  role: string;
  company: string;
  phone: string;
  email: string;
  website: string;
  /** The one colour the visitor picks; everything else is derived from it. */
  accent: string;
  surface: CardSurface;
  corner: CardCorner;
  shadow: CardShadow;
  layout: CardLayout;
  /** The three-part brand mark under the name. */
  showBar: boolean;
}

export const DEFAULT_SPEC: CardSpec = {
  name: "Max Mustermann",
  role: "Geschäftsführer",
  company: "Musterfirma GmbH",
  phone: "+49 170 1234567",
  email: "max@musterfirma.de",
  website: "musterfirma.de",
  accent: "#820933",
  surface: "paper",
  corner: "soft",
  shadow: "hard",
  layout: "left",
  showBar: true,
};

/** Ground and ink for each surface. Fixed pairs, so contrast cannot be lost. */
export const SURFACES: Record<CardSurface, { ground: string; ink: string; muted: string }> = {
  paper: { ground: "#fafaf7", ink: "#12121a", muted: "#6b6b66" },
  sand: { ground: "#f1efe8", ink: "#12121a", muted: "#6b6b66" },
  navy: { ground: "#050f68", ink: "#ffffff", muted: "#b9c0e8" },
  ink: { ground: "#12121a", ink: "#ffffff", muted: "#9c9ca8" },
};

/** Corner radius in mm. */
export const CORNERS: Record<CardCorner, number> = { sharp: 0, soft: 1.5, round: 4 };

/**
 * On a dark ground the picked accent can fall below readable contrast, and the
 * picker has no way to know that. Rather than refusing the colour, the card
 * lightens it until it carries — the visitor keeps their colour and keeps a
 * card that can be read.
 */
export function readableAccent(accent: string, surface: CardSurface): string {
  const ground = SURFACES[surface].ground;
  if (contrast(accent, ground) >= 3) return accent;
  const [h, s, l] = toHsl(accent);
  const lighter = luminance(ground) < 0.5;
  for (let step = 1; step <= 10; step += 1) {
    const next = fromHsl(h, s, Math.min(0.96, Math.max(0.06, l + (lighter ? step * 0.07 : -step * 0.07))));
    if (contrast(next, ground) >= 3) return next;
  }
  return SURFACES[surface].ink;
}

/** A 2D context, narrowed to what this file uses so a test can stand in. */
export interface Ctx {
  canvas: { width: number; height: number };
  save(): void;
  restore(): void;
  scale(x: number, y: number): void;
  clearRect(x: number, y: number, w: number, h: number): void;
  fillRect(x: number, y: number, w: number, h: number): void;
  beginPath(): void;
  roundRect?(x: number, y: number, w: number, h: number, r: number): void;
  rect(x: number, y: number, w: number, h: number): void;
  fill(): void;
  clip(): void;
  fillText(text: string, x: number, y: number): void;
  measureText(text: string): { width: number };
  fillStyle: string;
  font: string;
  textBaseline: string;
  shadowColor: string;
  shadowBlur: number;
  shadowOffsetX: number;
  shadowOffsetY: number;
}

/** How much room the shadow needs around the card, in mm. */
export function shadowPadding(shadow: CardShadow): number {
  return shadow === "none" ? 0 : shadow === "hard" ? 2 : 3;
}

/** The canvas size for a spec at a given scale, in device pixels. */
export function canvasSize(spec: CardSpec, scale: number): { width: number; height: number } {
  const pad = shadowPadding(spec.shadow);
  return {
    width: Math.round((CARD_MM.width + pad) * scale),
    height: Math.round((CARD_MM.height + pad) * scale),
  };
}

function path(ctx: Ctx, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  if (r > 0 && typeof ctx.roundRect === "function") ctx.roundRect(x, y, w, h, r);
  else ctx.rect(x, y, w, h);
}

/**
 * Draw the card. `scale` is px per mm; everything else is in mm.
 *
 * The caller owns the canvas size (`canvasSize`) — this only draws, so the
 * same call serves a 5 px/mm preview and a 300 dpi export.
 */
export function drawCard(ctx: Ctx, spec: CardSpec, scale: number): void {
  const { ground, ink, muted } = SURFACES[spec.surface];
  const accent = readableAccent(spec.accent, spec.surface);
  const radius = CORNERS[spec.corner];
  const pad = shadowPadding(spec.shadow);

  ctx.save();
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.scale(scale, scale);

  // The shadow, drawn as a filled copy behind the card rather than with the
  // canvas shadow API: a hard offset is a second rectangle, and asking for a
  // blur of 0 gives a different edge in every engine.
  if (spec.shadow === "hard") {
    ctx.fillStyle = "#050f68";
    path(ctx, pad, pad, CARD_MM.width, CARD_MM.height, radius);
    ctx.fill();
  } else if (spec.shadow === "soft") {
    ctx.shadowColor = "rgba(0,0,0,0.22)";
    ctx.shadowBlur = 2.5;
    ctx.shadowOffsetX = 0.8;
    ctx.shadowOffsetY = 1.4;
  }

  ctx.fillStyle = ground;
  path(ctx, 0, 0, CARD_MM.width, CARD_MM.height, radius);
  ctx.fill();
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  // The accent band, for the layout that has one. Clipped to the card so it
  // takes the corner radius with it.
  ctx.save();
  path(ctx, 0, 0, CARD_MM.width, CARD_MM.height, radius);
  ctx.clip();
  if (spec.layout === "band") {
    ctx.fillStyle = accent;
    ctx.fillRect(0, 0, CARD_MM.width, 9);
  }
  ctx.restore();

  const centred = spec.layout === "centre";
  const left = centred ? CARD_MM.width / 2 : 8;
  const top = spec.layout === "band" ? 20 : 15;

  const put = (text: string, y: number, size: number, colour: string, weight = "400") => {
    if (!text) return;
    ctx.font = `${weight} ${size}px "Plus Jakarta Sans", "Helvetica Neue", Arial, sans-serif`;
    ctx.fillStyle = colour;
    ctx.textBaseline = "alphabetic";
    const x = centred ? left - ctx.measureText(text).width / 2 : left;
    ctx.fillText(text, x, y);
  };

  put(spec.name, top, 5.2, ink, "700");
  put(spec.role, top + 5.4, 3, accent, "600");
  put(spec.company, top + 9.8, 3, muted);

  if (spec.showBar) {
    const barY = top + 13.5;
    const widths = [9, 4, 2.5];
    let x = centred ? left - (widths[0]! + widths[1]! + widths[2]! + 2) / 2 : left;
    for (const [index, width] of widths.entries()) {
      ctx.fillStyle = [accent, "#ff7a9c", "#c8a04a"][index]!;
      ctx.fillRect(x, barY, width, 0.9);
      x += width + 1;
    }
  }

  let y = CARD_MM.height - 14;
  for (const line of [spec.phone, spec.email, spec.website]) {
    put(line, y, 2.8, muted);
    y += 4.2;
  }

  ctx.restore();
}

// ── colour helpers ────────────────────────────────────────────────────────
// Small and local on purpose: a colour library would be the pack's only
// runtime dependency, for four functions nobody else needs.

function toRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const value = Number.parseInt(full, 16);
  if (!Number.isFinite(value)) return [0, 0, 0];
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

export function luminance(hex: string): number {
  const channel = (c: number) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  const [r, g, b] = toRgb(hex);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrast(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

function toHsl(hex: string): [number, number, number] {
  const [r255, g255, b255] = toRgb(hex);
  const r = r255 / 255;
  const g = g255 / 255;
  const b = b255 / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [h, s, l];
}

function fromHsl(h: number, s: number, l: number): string {
  const f = (n: number) => {
    const k = (n + h * 12) % 12;
    const a = s * Math.min(l, 1 - l);
    const value = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(value * 255);
  };
  return `#${[f(0), f(8), f(4)].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}
