# Types

## Logger

```typescript
import { type Logger, createLogger, type pino } from '@seek/logger';

createLogger() satisfies Logger satisfies pino.Logger satisfies pino.BaseLogger;
```

`@seek/logger` includes several logger types.
Its core `Logger` type may change between versions,
which can be a hassle to coordinate if your application depends on packages that need to upgrade to the new version first.

While we try to maintain [type compatibility] with the `pino.Logger` type,
it's possible that we may need to diverge in a future major version.

```typescript
import { Logger, type pino } from '@seek/logger';

const logger = createLogger({
  eeeoh: {
    datadog: 'tin',
    use: 'environment',
  },
});

const warn = (logger: pino.Logger) => logger.warn('msg');

warn(logger);
//   ~~~~~~
// In a future major version, this may fail with a type error:
// Argument of type 'Logger<never>' is not assignable to parameter of type 'Logger'.
```

To minimise upkeep,
carefully consider what logger type you are coupling your code to,
and generally avoid use of the `pino.Logger` type.

### Package code

Use [structural subtyping][type compatibility] to define a more explicit package interface. This can improve compatibility across versions of `@seek/logger` and with other logging implementations.

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

### Application code

In application code that only makes use of basic logging methods, consider `pino.BaseLogger`:

```diff
import type { pino } from '@seek/logger';

- const basic = (logger: pino.Logger) => {
+ const basic = (logger: pino.BaseLogger) => {
  const error = new Error('Oops!');

  logger.warn(error, 'msg');
  logger.warn('msg');
};
```

In application code that makes use of advanced logger functionality, consider `Logger`:

```diff
- import type { pino } from '@seek/logger';
+ import type { Logger } from '@seek/logger';

- const advanced = (logger: pino.Logger<'asplode'>) => {
+ const advanced = (logger: Logger<'asplode'>) => {
  const childLogger = logger.child({ key: 'value' });

  childLogger.asplode('msg');
};
```

[type compatibility]: https://www.typescriptlang.org/docs/handbook/type-compatibility.html
