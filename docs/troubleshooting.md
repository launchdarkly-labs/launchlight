# Troubleshooting

## Selectors are brittle or not unique
- Prefer `[data-testid]`, `[data-test]`, `[data-cy]`, or stable IDs/classes.
- The editor shows a warning if the selector is not unique. Consider adding a `data-webexp-id` to the element in your app for durability.

## SPA route changes revert changes
- Ensure SPA mode is enabled (injector/init). Patch engine re-applies ops after route changes and significant DOM mutations.
- Idempotent operations avoid duplicates on reapply.

## Flicker on first paint
- Injector adds an anti‑flicker mask scoped only to targeted nodes during apply. Keep op sets small and selectors precise.

## CSP blocks injected overlay or injector
- If using strict CSP, allowlist the editor overlay and injector script origins.
- Prefer serving the injector from your own domain and avoid `unsafe-inline`.

## Publish errors
- Confirm server env vars: `LD_API_TOKEN`, `LD_PROJECT_KEY`, `LD_ENV_KEY` are present; client only sees `NEXT_PUBLIC_LD_CLIENT_SIDE_ID`.
- CSRF: ensure same-origin requests or include the `XSRF-TOKEN` cookie and `X-XSRF-TOKEN` header with matching values.
