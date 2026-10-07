# Architecture

## One renderer, two scales

`src/card.ts` draws the card to a 2D context in **millimetres**; `scale` is px per mm.
The preview canvas calls it at 5 px/mm, the download at 300 dpi.

There is deliberately no second implementation for the export. Two renderers for one
design drift in details nobody re-checks, so a file that differs from the approved card
must not be expressible.

- `drawCard` must not read `scale` for anything but size. The "preview is the export"
  test compares both call lists with the `scale` call stripped; a branch on `scale`
  breaks the guarantee and the test.

## Colours

- **An accent is lightened, never refused.** A dark red vanishes on the navy surface,
  and the colour input can't know that. `readableAccent` lifts it until it reaches 3:1,
  and the visitor keeps their colour.
- **Surface pairs are fixed.** Ground and ink ship together, so contrast can't be lost
  by combining them.
- The colour maths (luminance, contrast, HSL) is ~40 lines at the bottom of `card.ts`
  instead of a colour library.

## Packaging

- **No runtime dependencies.** A pack's dependency is installed into every consuming site.
- **`src/card.ts` is published, and it has to be.** `files` lists it by name beside
  `dist`, `tools` and `islands`. The island ships as raw source and compiles in the
  consuming site, so its `../src/card` import must resolve in the **tarball**.
  If it doesn't, every local check passes and `tds-tools-frontend` fails with
  `Could not resolve '../src/card'`. Only `npm pack --dry-run` catches that.

## Privacy

No upload, no account, no network call. Anything that changes this also changes what
the tool's SEO copy promises.
