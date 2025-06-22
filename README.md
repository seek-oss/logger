# @seek/logger

[![Validate](https://github.com/seek-oss/logger/actions/workflows/validate.yml/badge.svg)](https://github.com/seek-oss/logger/actions/workflows/validate.yml)
[![Release](https://github.com/seek-oss/logger/actions/workflows/release.yml/badge.svg)](https://github.com/seek-oss/logger/actions/workflows/release.yml)
[![npm package](https://img.shields.io/npm/v/@seek/logger?labelColor=cb0000&color=5b5b5b)](https://www.npmjs.com/package/@seek/logger)
[![Node.js version](https://img.shields.io/node/v/@seek/logger?labelColor=5fa04e&color=5b5b5b)](https://www.npmjs.com/package/@seek/logger)

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
  - [Omitting Headers]
  - [Trimming](#trimming)
  - [Pino customisation](#pino-customisation)
  - [Pretty printing](#pretty-printing)

## Usage

```typescript
import createLogger, { createDestination } from '@seek/logger';

const { destination, stdoutMock } = createDestination({
  mock: config.environment === 'test',
});

// Initialize the logger.
// This will log to stdout if `createDestination` is not mocked.
const logger = createLogger(
  {
    name: 'my-app',
  },
  destination,
);

// Write an informational (`level` 30) log with a `msg`.
logger.info('Something good happened');

// Create a child logger that automatically includes the `requestId` field.
const childLogger = logger.child({ requestId });

// Write an error (`level` 50) log with `err`, `msg` and `requestId`.
childLogger.error({ err }, 'Something bad happened');

// Introspect mocked calls in your test environment.
// See the Testing section for more information.
stdoutMock.calls;
```

### Standardised fields

**@seek/logger** bundles custom `req`, `res` and `headers` serializers along with [Pino]'s standard set.
User-defined serializers will take precedence over predefined ones.

Use the following standardised logging fields to benefit from customised serialization:

- `err` for errors.

  The [Error] is serialized with its message, name, stack and additional properties.
  Notice that this is not possible with e.g. `JSON.stringify(new Error())`.

- `req` for HTTP requests.

  The request object is trimmed to a set of essential fields.  
  Certain headers are omitted by default; see [Omitting Headers] for details.

- `res` for HTTP responses.

  The response object is trimmed to a set of essential fields.

- `headers` for tracing headers.

  Certain headers are omitted by default; see [Omitting Headers] for details.

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

Some property paths are redacted by default. See `defaultRedact` in
[src/redact/index.ts](src/redact/index.ts) for the path list.

Additional property paths can be redacted using the `redact` logger option as per
[pino redaction].

Note that `pino` only supports either redaction or removal of the properties, not
redaction of some properties and removal of other properties.

If you would like to redact some properties and remove others, you are recommended to
configure `redact` with the list of paths to redact and provide a custom serializer to
omit specific properties from the logged object.

Custom serializers can be provided with the `serializers` logger option as described in
[pino serializers] and is the strategy used for omitting default headers.

### Omitting Headers

Specific headers defined in `DEFAULT_OMIT_HEADER_NAMES` are omitted from the following properties:

- `headers`
- `req.headers`

This behaviour can be configured with the `omitHeaderNames` option.

- Opt out by providing an empty list.
- Only omit specific headers by providing your own list.
- Extend the defaults by spreading the `DEFAULT_OMIT_HEADER_NAMES` list and appending your own list.

Example of extending the default header list:

```diff
-import createLogger from '@seek/logger';
+import createLogger, { DEFAULT_OMIT_HEADER_NAMES } from '@seek/logger';

const logger = createLogger({
  name: 'my-app',
+ omitHeaderNames: [...DEFAULT_OMIT_HEADER_NAMES, 'dnt' , 'sec-fetch-dest']
});
```

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

### Lambda Context

**@seek/logger** provides built-in support for capturing and including AWS Lambda context in your logs, ensuring consistent tracing and correlation across your serverless functions. Please note: this only works in AWS Lambda environments.

#### Basic Setup

To capture Lambda context in your logs:

```typescript
import createLogger, {
  createLambdaContextTracker,
  lambdaContextStorageProvider,
} from '@seek/logger';

// Create a context capture function
const withRequest = createLambdaContextTracker();

// Configure logger to include the context in all logs
const logger = createLogger({
  name: 'my-lambda-service',
  mixin: () => ({
    ...lambdaContextStorageProvider.getContext(),
  }),
});

// Lambda handler with automated context capture
export const handler = async (event, context) => {
  // Capture the Lambda context at the start of each invocation
  withRequest(event, context);

  // All logs will now automatically include the Lambda context
  logger.info({ event }, 'Lambda function invoked');
};
```

The captured context will be automatically included in all log entries during the Lambda invocation.

#### Custom Context Fields

You can customize what context information gets captured by providing a `requestMixin` function:

```typescript
const withRequest = createLambdaContextTracker({
  requestMixin: (event, context) => ({
    requestId: context.awsRequestId,
    functionName: context.functionName,
    eventSource: event.source,
  }),
});
```

This allows you to extract, transform, and include any relevant fields from both the Lambda event and context objects in your logs.

#### Advanced Context Management

For more complex usecases, you can update the context at any point during the Lambda invocation:

```typescript
import { lambdaContextStorageProvider } from '@seek/logger';

lambdaContextStorageProvider.updateContext({
  messageId: '12345
});
```

This approach is particularly useful for tracking state changes within a single Lambda invocation or when processing batched events where context needs to be updated between each item.

### Testing

See [docs/testing.md](docs/testing.md).

[error]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error
[Omitting Headers]: #omitting-headers
[pino]: https://github.com/pinojs/pino
[pino options]: https://github.com/pinojs/pino/blob/master/docs/api.md#options
[pino-pretty]: https://github.com/pinojs/pino-pretty
[pino redaction]: https://github.com/pinojs/pino/blob/master/docs/redaction.md
[pino serializers]: https://github.com/pinojs/pino/blob/master/docs/api.md#serializers-object
