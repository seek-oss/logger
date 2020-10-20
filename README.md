# @seek/logger

[![GitHub Release](https://github.com/seek-oss/logger/workflows/Release/badge.svg?branch=master)](https://github.com/seek-oss/logger/actions?query=workflow%3ARelease)
[![GitHub Validate](https://github.com/seek-oss/logger/workflows/Validate/badge.svg?branch=master)](https://github.com/seek-oss/logger/actions?query=workflow%3AValidate)
[![Node.js version](https://img.shields.io/badge/node-%3E%3D%208-brightgreen)](https://nodejs.org/en/)
[![npm package](https://img.shields.io/npm/v/@seek/logger)](https://www.npmjs.com/package/@seek/logger)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)

Standardized application Logging

This allows us consistently query request and response across all apps.

## Sample Usage

```typescript
import createLogger from '@seek/logger';

// Initialize - by default logs to Console Stream
const logger = createLogger({
  name: 'my-app',
});

// Import logged object interfaces from a shared module OR
// declare logged object interfaces
interface MessageContext {
  activity: string;
  err?: Error | { message: string };
  req?: {
    method: 'OPTIONS' | 'GET' | 'HEAD' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    url: string;
  };
}

// Specify the interface and benefit from enforced structure and code completion.
logger.trace<MessageContext>({
  activity: 'Getting all the things',
  req: { method: 'GET', url: 'https://example.com/things' },
});

logger.error<MessageContext>({
  activity: 'Getting all the things',
  req: { method: 'GET', url: 'https://example.com/things' },
  err: {
    message: 'Unexpected error getting things',
  },
});
```

If logger is used with an object as first argument, please use `req`, `res` and `err` to log request, response and error respectively.

`req` and `res` objects are trimmed to contain only essential logging data.

All other objects passed will be logged directly.

Bearer tokens are redacted regardless of their placement in the log object.

For suggestions on enforcing logged object structures for consistency, see [below](#enforcing-logged-object-structures).

The following trimming rules apply to all logging data:

- All log structures deeper than 4 levels (default) will be omitted from output.
- All log structures (objects/arrays) with size bigger/longer than 64 will be trimmed.
- All strings that are longer than 512 will be trimmed.
- All buffers will be substituted with their string representations, eg. "Buffer(123)".

Avoid logging complex structures such as buffers, deeply nested objects and long arrays.
Trimming operations are not cheap and may lead to significant performance issues of your application.

While log depth is configurable via `loggerOptions.maxObjectDepth`, we strongly discourage a log depth that exceeds the default of 4 levels.
Consider flattening the log structure for performance, readability and cost savings.

### Pino

**@seek/logger** uses Pino under the hood.
You can customise your logger by providing [Pino options] like so:

```javascript
import createLogger, { pino } from '@seek/logger';

const logger = createLogger(
  {
    name: 'my-app',
    ...myCustomPinoOptions,
  },
  myDestination,
);

const extremeLogger = createLogger({ name: 'my-app' }, pino.extreme());
```

Note: `createLogger` mutates the supplied destination in order to redact sensitive data.

### Pretty printing

**@seek/logger** supports Pino-compatible pretty printers.
For example, you can install **[pino-pretty]** as a `devDependency`:

```shell
yarn add --dev pino-pretty
```

Then selectively enable pretty printing when running your application locally:

```typescript
import createLogger from '@seek/logger-js';

const logger = createLogger({
  name: 'my-app',
  prettyPrint: process.env.ENVIRONMENT === 'local',
});
```

## Serializers

Library is utilizing standard pino serializers with custom `req` and `res` serialializers.
If other serializers with same keys are provided to the library, they will take precedence over predefined ones.

## Enforcing Logged Object Structures

If you would like to enforce the structure of objects being logged, define the interface to log and specify it as the generic type in the logger functions.
Compatibility should be maintained with the existing [`serializer functions`](src/serializers/index.ts).

[pino options]: https://github.com/pinojs/pino/blob/master/docs/api.md#options
[pino-pretty]: https://github.com/pinojs/pino-pretty
