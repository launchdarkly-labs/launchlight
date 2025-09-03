# Security Policy

## Reporting a Vulnerability

If you discover a security issue, please email security@launchlight.dev with a detailed report. We aim to respond within 72 hours.

- Do not open a public issue with exploit details.
- Include reproduction steps, affected versions, and potential impact.
- If possible, include a minimal proof of concept.

## Supported Versions

We support the `main` branch and the latest minor versions published to npm.

## Handling of Secrets

- Never expose `LD_REST_API_TOKEN` to client bundles. Only expose `NEXT_PUBLIC_LD_CLIENT_SIDE_ID`.
- Use environment variables and server-only code paths for REST access.

## Responsible Disclosure

We appreciate responsible disclosure and will credit researchers upon request.
