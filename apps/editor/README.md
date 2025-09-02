## Publish API usage

Client helper:

```ts
import { publishFlagVariation } from '@/lib/publishClient';

await publishFlagVariation({
  flagKey: 'webexp_hero_test',
  variationKey: 'variation-1',
  payload, // VariationInline
  expId: 'exp_hero_test',
  workspaceId: 'default'
});
```


