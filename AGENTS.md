# AGENTS.md — tds-tool-businesscard-pkg

Tool pack for the public tools platform with one tool, the Visitenkarten-Designer.
It builds against `@tracht-digital-solutions/tds-tools-contract` and is composed into
`tds-tools-frontend` at build time. Nothing leaves the browser: no upload, no account,
no network call.

The platform rules (unique ids, package-subpath components, contract stability)
live in `tds-tools-contract-pkg/AGENTS.md`. Read that first.

## Commands

```bash
npm install --no-package-lock   # never npm ci; CI has no lockfile
npm run build                   # tsup
npm run type-check              # tsc
npm run test:run                # vitest
npm run lint:primitives         # fails on a control without a shared class
npm pack --dry-run              # before any release that moves files around
```

## Hard rules

- **Every push to `main` publishes a `@latest` patch** and deploys `tds-tools-frontend` (dispatches its `release.yml`).
  Don't bump the version by hand for a patch, and don't dispatch a second release.
  A docs-only commit carries `[skip ci]`.
- One renderer for preview and export (`src/card.ts`). Never add a second one.
- `src/card.ts` must stay in `files`; the island imports it from the tarball.
- No runtime dependencies, no CSS, no network calls.
- Stay inside the `0.1.x` line. The site pins `^0.1.4`, so a minor bump needs a coordinated repin.

## Topic files

| File | Read before |
|---|---|
| [docs/agents/architecture.md](docs/agents/architecture.md) | Changing the renderer, colours, `files` or dependencies |
| [docs/agents/conventions.md](docs/agents/conventions.md) | Touching any markup or styling in `islands/` or `tools/` |
| [docs/agents/testing.md](docs/agents/testing.md) | Writing or changing tests |

Workspace rules: `../CLAUDE.md`. Cross-repo state: `../MIGRATION-STATUS.md`.
