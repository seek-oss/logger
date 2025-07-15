---
'@seek/logger': major
---

Enforce stricter typing on child loggers

This is a **breaking change** to our types that builds on [v10.0.0](https://github.com/seek-oss/logger/releases/v10.0.0) and propagates stricter parameter typing to child loggers. A consequence of this change is that the return type of `createLogger()` no longer satisfies `pino.Logger`.

```typescript
import { createLogger, type pino } from '@seek/logger';

const logger = createLogger({
  eeeoh: {
    datadog: 'tin',
    use: 'environment',
  },
});

const warn = (logger: pino.Logger) => logger.warn('msg');

warn(logger);
//   ~~~~~~
// Argument of type 'Logger<never>' is not assignable to parameter of type 'Logger'.
```

If you have an npm package that is currently coupled to `pino.Logger`, use [structural subtyping](https://www.typescriptlang.org/docs/handbook/type-compatibility.html) to define a more explicit package interface. This can improve compatibility across major versions of `@seek/logger` and with other logging implementations.

```diff
- import type { pino } from '@seek/logger';

+ type Logger = {
+   error: {
+     (msg: string): void;
+     (obj: unknown, msg: string): void;
+   };
+ };

- export const do = (logger: pino.Logger) => {
+ export const do = (logger: Logger) => {
    const error = new Error('Oops!');

    logger.warn(error, 'msg');
    logger.warn('msg');
  };
```

In application code that only makes use of basic logging methods, replace `pino.Logger` with the simpler `pino.BaseLogger`:

```diff
import type { pino } from '@seek/logger';

- const basic = (logger: pino.Logger) => {
+ const basic = (logger: pino.BaseLogger) => {
  const error = new Error('Oops!');

  logger.warn(error, 'msg');
  logger.warn('msg');
};
```

In application code that makes use of advanced logger functionality, replace `pino.Logger` with `Logger`:

```diff
- import type { pino } from '@seek/logger';
+ import type { Logger } from '@seek/logger';

- const advanced = (logger: pino.Logger<'asplode'>) => {
+ const advanced = (logger: Logger<'asplode'>) => {
  const childLogger = logger.child({ key: 'value' });

  childLogger.asplode('msg');
};
```
