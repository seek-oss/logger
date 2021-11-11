# @seek/logger

[![GitHub Release](https://github.com/seek-oss/logger/workflows/Release/badge.svg?branch=master)](https://github.com/seek-oss/logger/actions?query=workflow%3ARelease)
[![GitHub Validate](https://github.com/seek-oss/logger/workflows/Validate/badge.svg?branch=master)](https://github.com/seek-oss/logger/actions?query=workflow%3AValidate)
[![Node.js version](https://img.shields.io/badge/node-%3E%3D%208-brightgreen)](https://nodejs.org/en/)
[![npm package](https://img.shields.io/npm/v/@seek/logger)](https://www.npmjs.com/package/@seek/logger)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)

**@seek/logger** is a JSON logger for Node.js applications.
It implements several SEEK customisations over [Pino], including:

- Human-readable `timestamp`s for Splunk compatibility
- Redaction of sensitive data
- Trimming deep objects to reduce cost and unintended disclosure

## Table of contents

- [Usage](#usage)
  - [Standardised fields](#standardised-fields)
  - [Typed fields](#typed-fields)
- [Features](#features)
  - [Redaction](#redaction)
  - [Trimming](#trimming)
  - [Pino customisation](#pino-customisation)
  - [Pretty printing](#pretty-printing)

## Usage

```typescript
import createLogger from '@seek/logger';

// Initialize the logger. By default, this will log to stdout.
const logger = createLogger({
  name: 'my-app',
});

// Write an informational (`level` 30) log with a `msg`.
logger.info('Something good happened');

// Create a child logger that automatically includes the `requestId` field.
const childLogger = logger.child({ requestId });

// Write an error (`level` 50) log with `err`, `msg` and `requestId`.
childLogger.error({ err }, 'Something bad happened');
```

### Standardised fields

**@seek/logger** bundles custom `req` and `res` serializers along with [Pino]'s standard set.
User-defined serializers will take precedence over predefined ones.

Use the following standardised logging fields to benefit from customised serialization:

- `err` for errors.

  The [Error] is serialized with its message, name, stack and additional properties.
  Notice that this is not possible with e.g. `JSON.stringify(new Error())`.

- `req` for HTTP requests.

  The request object is trimmed to a set of essential fields.

- `res` for HTTP responses.

  The response object is trimmed to a set of essential fields.

All other fields will be logged directly.

### Typed fields

You can type common sets of fields to enforce consistent logging across your application(s).
Compatibility should be maintained with the existing [serializer functions](src/serializers/index.ts).

```typescript
// Declare a TypeScript type for your log fields.
interface Fields {
  activity: string;
  err?: Error;
}

// Supply it as a type parameter for code completion and compile-time checking.
logger.trace<Fields>(
  {
    activity: 'Getting all the things',
  },
  'Request initiated',
);

logger.error<Fields>(
  {
    activity: 'Getting all the things',
    err,
  },
  'Request failed',
);
```

## Features

### Redaction

Bearer tokens are redacted regardless of their placement in the log object.

### Trimming

The following trimming rules apply to all logging data:

- All log structures deeper than 4 levels (default) will be omitted from output.
- All log structures (objects/arrays) with size bigger/longer than 64 will be trimmed.
- All strings that are longer than 512 will be trimmed.
- All buffers will be substituted with their string representations, eg. "Buffer(123)".

Avoid logging complex structures such as buffers, deeply nested objects and long arrays.
Trimming operations are not cheap and may lead to significant performance issues of your application.

While log depth is configurable via `loggerOptions.maxObjectDepth`, we strongly discourage a log depth that exceeds the default of 4 levels.
Consider flattening the log structure for performance, readability and cost savings.

### Pino customisation

**@seek/logger** uses [Pino] under the hood.
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
import createLogger from '@seek/logger';

const logger = createLogger({
  name: 'my-app',
  transport:
    process.env.ENVIRONMENT === 'local' ? { target: 'pino-pretty' } : undefined,
});
```

[error]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error
[pino]: https://github.com/pinojs/pino
[pino options]: https://github.com/pinojs/pino/blob/master/docs/api.md#options
[pino-pretty]: https://github.com/pinojs/pino-pretty
