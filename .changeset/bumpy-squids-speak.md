---
'@seek/logger': major
---

This package is now authored as an ESM package. It is still published as a dual CJS/ESM package.

This release also drops the default export, so you will need to import `createLogger` as a named import:

```diff
- import createLogger from '@seek/logger';
+ import { createLogger } from '@seek/logger';
```

If you're using [skuba](https://github.com/seek-oss/skuba), upgrade to [`skuba@16.4.0`](https://github.com/seek-oss/skuba/releases/tag/skuba%4016.4.0) or newer first. [GitHub autofixes](https://seek-oss.github.io/skuba/docs/deep-dives/github.html#github-autofixes) or a manual `skuba format` will rewrite these imports for you.
