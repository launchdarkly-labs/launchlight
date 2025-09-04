# Launchlight Web Experiments

Visual authoring of DOM patches, published as LaunchDarkly variations, applied via a tiny injector.

## Quickstarts

### Plain HTML (IIFE)

1. Build the injector:

```bash
pnpm -w --filter @webexp/injector build
```

2. Open `examples/plain-html/index.html` and replace placeholders for `clientSideId` and `flagKey`.

3. Serve the file locally and load it in a browser.

### Next.js / React (ESM)

```ts
import { init } from '@webexp/injector';

init({
  clientSideId: process.env.NEXT_PUBLIC_LD_CLIENT_SIDE_ID!,
  flagKey: 'your-webexp-flag',
  spaMode: true,
  debug: true,
  context: { kind: 'user', key: 'anon', anonymous: true }
});
```

## Editor

- `apps/editor`: Next.js App Router UI for selecting elements, authoring operations, previewing in an iframe, and publishing to LaunchDarkly.
- Protect with basic auth by setting `EDITOR_BASIC_AUTH="user:pass"`.
- Server‑side publish route: `/api/flags/{projectKey}/{envKey}/{flagKey}/publish` (CSRF protected; same-origin or double-submit token).

## Docs

- Operations: `docs/operations.md`
- Metrics: `docs/metrics.md`
- Troubleshooting: `docs/troubleshooting.md`

## Development

```bash
pnpm install
pnpm -w build
pnpm -w dev
```

## CI

- See `.github/workflows/ci.yml` for build/test/size-limit.
- e2e placeholder in `.github/workflows/e2e.yml`.
