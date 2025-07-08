---
'@seek/logger': minor
---

Add eeeoh integration

This is an experimental feature that enables first-class support for SEEK's proprietary logging solution.

To opt in:

```typescript
import { createLogger } from '@seek/logger';

const base = {
  env: 'production',
  service: 'my-component-name',
  version: 'abcdefa.123',
} as const;

const logger = createLogger({
  base,
  eeeoh: { datadog: 'tin' },
});
```

See the [documentation](https://github.com/seek-oss/logger/blob/master/docs/eeeoh.md) for more information.
