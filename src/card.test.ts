import { describe, expect, it } from "vitest";
import {
  CARD_MM,
  CORNERS,
  DEFAULT_SPEC,
  PRINT_SCALE,
  SURFACES,
  canvasSize,
  contrast,
  drawCard,
  readableAccent,
  shadowPadding,
  type CardSpec,
  type Ctx,
} from "./card";

/**
 * A recording stand-in for the 2D context.
 *
 * The renderer is the only thing in this pack that produces the artefact a
 * visitor downloads, and it has no DOM beyond the context — so it can be
 * driven here and asked what it drew, which is the only way to hold the
 * "preview is the export" promise without a browser.
 */
function recorder() {
  const calls: Array<{ op: string; args: unknown[]; fill?: string; font?: string }> = [];
  const ctx = {
    canvas: { width: 0, height: 0 },
    fillStyle: "",
    font: "",
    textBaseline: "",
    shadowColor: "",
    shadowBlur: 0,
    shadowOffsetX: 0,
    shadowOffsetY: 0,
    save: () => calls.push({ op: "save", args: [] }),
    restore: () => calls.push({ op: "restore", args: [] }),
    scale: (...args: unknown[]) => calls.push({ op: "scale", args }),
    clearRect: (...args: unknown[]) => calls.push({ op: "clearRect", args }),
    fillRect: (...args: unknown[]) => calls.push({ op: "fillRect", args, fill: ctx.fillStyle }),
    beginPath: () => calls.push({ op: "beginPath", args: [] }),
    roundRect: (...args: unknown[]) => calls.push({ op: "roundRect", args }),
    rect: (...args: unknown[]) => calls.push({ op: "rect", args }),
    fill: () => calls.push({ op: "fill", args: [], fill: ctx.fillStyle }),
    clip: () => calls.push({ op: "clip", args: [] }),
    fillText: (...args: unknown[]) => calls.push({ op: "fillText", args, fill: ctx.fillStyle, font: ctx.font }),
    measureText: (text: string) => ({ width: text.length * 1.6 }),
  } as unknown as Ctx & { __calls: typeof calls };
  (ctx as unknown as { __calls: typeof calls }).__calls = calls;
  return { ctx, calls };
}

const draw = (spec: Partial<CardSpec> = {}, scale = 5) => {
  const { ctx, calls } = recorder();
  drawCard(ctx, { ...DEFAULT_SPEC, ...spec }, scale);
  return calls;
};
const texts = (spec: Partial<CardSpec> = {}) =>
  draw(spec)
    .filter((call) => call.op === "fillText")
    .map((call) => String(call.args[0]));

describe("the card's geometry", () => {
  it("is a standard 85 × 55 mm card", () => {
    expect(CARD_MM).toEqual({ width: 85, height: 55 });
  });

  it("reserves room for the shadow it is going to draw, and none when there is none", () => {
    expect(shadowPadding("none")).toBe(0);
    expect(shadowPadding("hard")).toBeGreaterThan(0);
    const bare = canvasSize({ ...DEFAULT_SPEC, shadow: "none" }, 10);
    expect(bare).toEqual({ width: 850, height: 550 });
    expect(canvasSize({ ...DEFAULT_SPEC, shadow: "hard" }, 10).width).toBeGreaterThan(bare.width);
  });

  /**
   * The promise the whole pack is built on: the preview and the download are
   * one renderer at two scales. If the drawing ever depended on the scale for
   * anything but size, the file would stop being the card that was approved.
   */
  it("draws the same thing at preview scale and at print scale", () => {
    const strip = (calls: ReturnType<typeof draw>) =>
      calls.filter((call) => call.op !== "scale").map((call) => `${call.op}:${call.fill ?? ""}:${call.args.join(",")}`);
    expect(strip(draw({}, 5))).toEqual(strip(draw({}, PRINT_SCALE)));
  });

  it("puts the scale on the context once, and nowhere in the coordinates", () => {
    const scaled = draw({}, 12).filter((call) => call.op === "scale");
    expect(scaled).toHaveLength(1);
    expect(scaled[0]!.args).toEqual([12, 12]);
  });
});

describe("what ends up on the card", () => {
  it("writes every line the visitor filled in", () => {
    const spec = {
      name: "Ada Lovelace",
      role: "Analytikerin",
      company: "Analytical Engines",
      phone: "+49 1",
      email: "a@b.de",
      website: "b.de",
    };
    expect(texts(spec)).toEqual([
      "Ada Lovelace",
      "Analytikerin",
      "Analytical Engines",
      "+49 1",
      "a@b.de",
      "b.de",
    ]);
  });

  it("leaves an empty field out rather than printing a blank line", () => {
    expect(texts({ role: "", company: "" })).not.toContain("");
    expect(texts({ role: "", company: "" })).toHaveLength(4);
  });

  it("draws the colour bar only when it is asked for", () => {
    const bars = (showBar: boolean) =>
      draw({ showBar, layout: "left" }).filter((call) => call.op === "fillRect").length;
    expect(bars(true)).toBeGreaterThan(bars(false));
  });

  it("draws a band for the band layout and not for the others", () => {
    const band = draw({ layout: "band", showBar: false }).filter((call) => call.op === "fillRect");
    const left = draw({ layout: "left", showBar: false }).filter((call) => call.op === "fillRect");
    expect(band.length).toBeGreaterThan(left.length);
  });

  it("centres the text for the centred layout", () => {
    const x = (layout: CardSpec["layout"]) =>
      draw({ layout }).find((call) => call.op === "fillText")!.args[1];
    expect(x("centre")).not.toBe(x("left"));
  });
});

describe("the surfaces", () => {
  it("pairs every ground with ink that can be read on it", () => {
    for (const [name, surface] of Object.entries(SURFACES)) {
      expect(contrast(surface.ink, surface.ground), `${name} ink`).toBeGreaterThanOrEqual(7);
      expect(contrast(surface.muted, surface.ground), `${name} muted`).toBeGreaterThanOrEqual(3);
    }
  });

  /**
   * The picker cannot know that a dark red vanishes on navy, and refusing the
   * colour would be answering a question the visitor did not ask. The card
   * lightens it until it carries instead — they keep their colour and keep a
   * card that can be read.
   */
  it("lifts an accent that would vanish on a dark ground", () => {
    const bordeaux = "#820933";
    expect(readableAccent(bordeaux, "paper")).toBe(bordeaux);
    const onNavy = readableAccent(bordeaux, "navy");
    expect(onNavy).not.toBe(bordeaux);
    expect(contrast(onNavy, SURFACES.navy.ground)).toBeGreaterThanOrEqual(3);
  });

  it("leaves a colour that already carries exactly as it was picked", () => {
    for (const surface of ["paper", "sand"] as const) {
      expect(readableAccent("#0b5d2a", surface)).toBe("#0b5d2a");
    }
  });

  it("handles a three-digit hex the colour input may hand it", () => {
    expect(() => readableAccent("#abc", "navy")).not.toThrow();
  });
});

describe("the corners", () => {
  it("draws a plain rectangle only when the radius is nothing", () => {
    const shapes = (corner: CardSpec["corner"]) =>
      draw({ corner }).filter((call) => call.op === "roundRect" || call.op === "rect");
    expect(CORNERS.sharp).toBe(0);
    expect(shapes("sharp").every((call) => call.op === "rect")).toBe(true);
    expect(shapes("round").some((call) => call.op === "roundRect")).toBe(true);
  });
});
