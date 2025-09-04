# Supported Operations

This project supports the following DOM patch operations (validated via Zod and applied idempotently):

- setText (`textReplace`)
  - Replace textContent of matched elements.
- setHTML (`insertHTML`)
  - Insert sanitized HTML (DOMPurify with strict defaults). Event handlers and javascript: URLs are removed.
- setAttr (`attrSet`)
  - Set an attribute to a new value.
- setStyle (`styleSet`)
  - Set a CSS property on matched elements.
- addClass / removeClass / toggleClass (`classAdd` / `classRemove` / `classToggle`)
- removeNode (`remove`)
  - Remove matched elements.
- swapImage (`imgSwap`)
  - Update `src` and optionally `alt` for `<img>` elements.
- duplicateNode (`duplicate`)
  - Clone an element once and insert it after the original (idempotent via a marker attribute).
- moveBefore / moveAfter / appendTo
  - Reorder/append elements within safe containers.

## Idempotency

All operations are implemented to be safe to re-run on SPA navigations. Examples:
- `duplicate` adds a `data-webexp-duplicate` marker and does not duplicate again on reapply.
- `move*` checks current position and skips if already in place.

## Accessibility Guardrails

Moves are validated to avoid breaking common relationships:
- `<label for>` ↔ `<input id>`
- `aria-labelledby` relationships
- Prevent heading level gaps (e.g., moving an `h3` into a context without an `h2`).

Invalid moves are skipped with warnings; the engine returns error details for visibility.

## Selector Guidance

- Prefer stable selectors: data attributes (`data-testid`, `data-test`, `data-cy`), stable IDs, or semantic roles.
- Avoid position‑only selectors (`:nth-child`) when possible; editor surfaces stability warnings.

## Payload Size Limits

- Warn at ~15 KB (gzipped estimate), block at 20 KB.
- Keep operations minimal and selectors stable.
