---
'@seek/logger': minor
---

Export `createLogger` as a named export

This improves forward compatibility with TypeScript & ESM. While the named export is recommended, there is no immediate need to migrate existing codebases, and we've left the default export in place.

**Migration:**

```diff
- import createLogger from '@seek/logger';
+ import { createLogger } from '@seek/logger';
```
