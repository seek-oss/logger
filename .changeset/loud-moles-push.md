---
'@seek/logger': minor
---

Export `createLogger` as a named export for improved TypeScript compatibility

**Migration:**

```diff
- import createLogger from '@seek/logger';
+ import { createLogger } from '@seek/logger';
```

This change is required for our eventual migration to ESM
