# Metrics and Experiments

This guide explains how to configure metrics for Launchlight experiments with LaunchDarkly Experiments.

## Built-in metrics via LaunchDarkly

- Page views: Configure “page viewed” metrics in LaunchDarkly to count a page load or route view.
  - Scope by URL patterns (string match or regex) and environment.
  - Recommended: target the pages touched by your web experiment.

- Clicks/taps: Configure “clicked element” metrics in LaunchDarkly.
  - Prefer stable selectors: `[data-testid]`, `[data-test]`, `[data-cy]`, or stable IDs/classes.
  - Map keys to the elements changed by the experiment (e.g., CTA buttons).

LD Experiments will attribute page/click events to exposures when the flag variation is evaluated on the page.

## Custom events via SDK

If you need additional signals:

- Use the injector’s client directly or a small helper to send custom events:

```js
// inside your app code after injector init
client.track('webexp_custom_event', { key: 'value' });
```

- Naming: prefix with `webexp_` and keep keys lowercase with underscores.
- Avoid double counting: do not send custom events for the same interactions already configured as LaunchDarkly metrics.

## Anonymous → identified user aliasing

- Recommended flow:
  1. Start visitors as anonymous contexts. The injector’s auto-ID will create a first‑party ID (respects DNT and consent).
  2. When a user logs in, re-identify by calling `client.identify` (or reinitializing with a user context) so future events tie to the identified user.
  3. Optionally record an alias event per LD guidance if moving from completely separate contexts.

See LaunchDarkly docs for the JS SDK identify/alias specifics.

## QA debug mode

- Injector `debug: true` prints:
  - Active flag and variation payload details (type/version/ops count).
  - Applied operation results and any errors from the patch engine.
  - Any `track` calls made via the injector.

Use the browser console to verify exposures and applied changes during QA.
