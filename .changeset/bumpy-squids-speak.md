---
'@seek/logger': major
---

This package is now authored as an ESM package. It is still published as a dual CJS/ESM package

This release also drops the default export, so you will need to import `createLogger` as a named import:

```diff
- import createLogger from '@seek/logger';
+ import { createLogger } from '@seek/logger';
```