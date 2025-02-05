---
'@seek/logger': minor
---

Add support for configuring custom log levels:

```ts
import createLogger from '@seek/logger';

const logger = createLogger({
  name: 'my-app',
  customLevels: {
    foo: 35,
  },
});

logger.foo('Bar');
```
