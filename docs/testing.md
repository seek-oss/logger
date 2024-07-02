# Testing

Testing the logging behaviour of your project may be useful to:

1. Check for regressions to log messages that have dependencies

   For example, a particular message may serve as an important audit log,
   and changing its format could break dashboards and reporting.

2. Visualise the overall logging output of a given section of code

   It can be hard to keep track of what logs are actually emitted in a request
   flow, between your own logic, third-party packages, and middleware. Having a
   holistic picture of the underlying logging calls may allow you to optimise
   the usability of your logs and reduce duplication.

## Manual mocks and spies

Previously, the de facto testing pattern was to set up mocks or spies manually:

```typescript
import createLogger from '@seek/logger';

export const logger = createLogger();
```

```typescript
import { logger } from './logging';

const infoSpy = jest.fn();
jest.spyOn(logger, 'info').mockImplementation(info);

afterEach(infoSpy.mockClear);

// ...

expect(infoSpy).toHaveBeenCalledTimes(1);
expect(infoSpy).toHaveBeenNthCalledWith(1, { id: '123' }, 'Something happened');
```

This had a few downsides:

1. It's a lot of manual fiddling to perform in each project.

2. It's difficult to get a complete picture of logging output.

   There are many logging levels and corresponding methods to account for,
   and it's tedious to mock features such as [`logger.child()`].

3. It doesn't cover internal processing logic within `@seek/logger` and Pino.

   For example, the `maxObjectDepth` logger option may reduce the effective
   effectiveness (ha) of a log message, but a `logger.info()` spy would not pick
   this up.

[`logger.child()`]: https://github.com/pinojs/pino/blob/v9.2.1/docs/child-loggers.md

## `createDestination`

`@seek/logger` now bundles a convenient mechanism for recording logging calls,
built on Pino's support for customisable [destinations].

[destinations]: https://github.com/pinojs/pino/blob/v9.2.1/docs/api.md#destination

In practice, this looks like the following:

```typescript
import createLogger, { createDestination } from '@seek/logger';

const { destination, stdoutMock } = createDestination({
  mock: config.environment === 'test',
});

export { stdoutMock };

export const logger = createLogger(
  {
    // ...
  },
  destination,
);
```

```typescript
import { stdoutMock } from './logging';

afterEach(stdoutMock.clear);

// ...

expect(stdoutMock.onlyCall()).toMatchObject({
  id: '123',
  level: 30,
  msg: 'Something happened',
});
```

Capturing all log properties can be noisy,
especially if you snapshot or assert against an entire log object.
To this end, `stdoutMock` redacts and removes some properties by default.

You can extend these defaults:

```typescript
createDestination({
  mock: {
    redact: [
      ...createDestination.defaults.mock.redact,
      'additionalPropertyToRedact',
    ],
    remove: [
      ...createDestination.defaults.mock.remove,
      'additionalPropertyToRemove',
    ],
  },
});
```

Or disable them:

```typescript
createDestination({
  mock: {
    redact: [],
    remove: [],
  },
});
```

### Migration notes

If you were previously manually mocking logging calls in your test environment,
you may have effectively disabled the logger by setting its level to `silent`.

This destination-based mechanism requires the logger to be enabled. Set its
minimum [`level`] to something low like `trace` or `debug`:

```diff
const environmentConfigs = {
  test: {
-   logLevel: 'silent',
+   logLevel: 'debug',
  },

  // ...
};
```

[`level`]: https://github.com/pinojs/pino/blob/v9.2.1/docs/api.md#logger-level
