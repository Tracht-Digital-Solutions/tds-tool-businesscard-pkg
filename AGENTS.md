# AGENTS.md — tds-tool-businesscard-pkg

Authoritative architecture/gotcha doc for this repo. Read before non-trivial changes.

## What this is

A **tool pack** for the public tools platform: one tool, the Visitenkarten-Designer.
It builds against `@tracht-digital-solutions/tds-tools-contract` and is composed into
`tds-tools-frontend` at build time. Read that contract's `AGENTS.md` first — the rules
about unique ids, package-subpath components and 1.x stability are set there, not here.

## Architecture

- **One renderer, two scales.** `src/card.ts` draws the card to a 2D context in
  MILLIMETRES; `scale` is px per mm. The preview canvas calls it at 5 px/mm, the
  download calls it at 300 dpi. There is no second implementation for the export,
  which is the point: two renderers for one design drift, and they drift in the
  details nobody re-checks — so a file that differs from the approved card is not
  expressible here.
- **No CSS.** Like every pack, styling comes from `tds-shared` through the site.
  Controls carry `field-boxed`, `btn btn-*`, `chip` — `npm run lint:primitives`
  fails the build on a bare one.
- **No runtime dependencies.** The colour maths (luminance, contrast, HSL) is
  ~40 lines at the bottom of `card.ts` rather than a colour library: a pack's
  dependency is installed into every consuming site.
- **Nothing leaves the browser.** No upload, no account, no network call at all.
  Anything that changes that changes what the tool's SEO copy promises.

## Gotchas / invariants

- **`drawCard` must not read the scale for anything but size.** The
  "preview is the export" test compares the two scales' call lists with the
  `scale` call stripped; a branch on `scale` breaks the guarantee and the test.
- **The card is `role="presentation"`.** Every word on it is in the form above
  it; announcing the canvas as well would read the card out twice.
- **An accent is lightened, never refused.** A dark red vanishes on the navy
  surface and the colour input cannot know that. `readableAccent` lifts it until
  it reaches 3:1 and the visitor keeps their colour (`card.test.ts` holds both
  directions: it lifts what needs lifting and touches nothing else).
- **Surface pairs are fixed.** Ground and ink ship together so contrast cannot be
  lost by combining them; the test asserts 7:1 for ink and 3:1 for muted.
- **CI is npm-only.** `npm install --no-package-lock`, never `npm ci`.
  Push to `main` publishes a patch — do NOT bump the version by hand for a patch
  and do not dispatch a second release; see the tools-platform release notes.

## Commands

```bash
npm install --no-package-lock
npm run build
npm run type-check
npm run test:run
npm run lint:primitives
```
