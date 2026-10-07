# Testing

`npm run test:run` runs vitest.

- **Preview is the export:** the test renders at both scales and compares the call
  lists with the `scale` call stripped.
- `card.test.ts` holds `readableAccent` in both directions: it lifts what needs lifting
  and touches nothing else.
- Fixed surface pairs are asserted at 7:1 for ink and 3:1 for muted.
- Nothing here can catch a missing file in the published tarball. Run
  `npm pack --dry-run` before a release that moves files (see
  [architecture.md](architecture.md#packaging)).
