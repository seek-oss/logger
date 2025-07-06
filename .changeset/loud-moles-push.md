---
'@seek/logger': minor
---

Export `createLogger` as a named export

This improves forward compatibility with TypeScript & ESM. We've left the default export in place and there is no immediate need to migrate existing codebases.

**Migration:**

```diff
- import createLogger from '@seek/logger';
+ import { createLogger } from '@seek/logger';
```
