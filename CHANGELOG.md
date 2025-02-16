# @seek/logger

## 9.1.0

### Minor Changes

- Add support for configuring custom log levels: ([#164](https://github.com/seek-oss/logger/pull/164))

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

## 9.0.0

### Major Changes

- Apply trimming to serializers ([#143](https://github.com/seek-oss/logger/pull/143))

  Previously, [built-in serializers](https://github.com/seek-oss/logger/tree/54f16e17a9bb94261b9d2e4b77f04f55d5a3ab4c?tab=readme-ov-file#standardised-fields) and custom ones supplied via the [`serializers` option](https://github.com/pinojs/pino/blob/8aafa88139890b97aca0d32601cb5ffdd9bda1eb/docs/api.md#serializers-object) were not subject to [trimming](https://github.com/seek-oss/logger/tree/54f16e17a9bb94261b9d2e4b77f04f55d5a3ab4c?tab=readme-ov-file#trimming). This caused some emitted error logs to be extremely large.

  Now, trimming is applied across all serializers by default. If you rely on deeply nested `err` properties to troubleshoot your application, tune the `maxObjectDepth` configured on your logger.

## 8.1.1

### Patch Changes

- **createDestination:** Use `Record` type for `stdoutMock.calls` and `stdoutMock.onlyCall()` ([#137](https://github.com/seek-oss/logger/pull/137))

  This allows you to destructure a call in your test code without the TypeScript compiler complaining:

  ```typescript
  const { level, ...rest } = stdoutMock.onlyCall();
  ```

## 8.1.0

### Minor Changes

- **createDestination:** Implement logging integration testing ([#134](https://github.com/seek-oss/logger/pull/134))

  `@seek/logger` now bundles a convenient mechanism for recording logging calls, built on Pino's support for customisable destinations. See [docs/testing.md](https://github.com/seek-oss/logger/blob/master/docs/testing.md) for more information.

### Patch Changes

- **deps:** pino-std-serializers ^7.0.0 ([#130](https://github.com/seek-oss/logger/pull/130))

## 8.0.0

### Major Changes

- **deps:** pino 9 ([#128](https://github.com/seek-oss/logger/pull/128))

  Our minimum Node.js version is now 18.18.

## 7.0.0

### Major Changes

- Add default redact paths ([#123](https://github.com/seek-oss/logger/pull/123))

  `@seek/logger` now redacts a set of [built-in paths](https://github.com/seek-oss/logger/blob/master/src/redact/index.ts) by default.

  These default paths cannot be disabled, and are concatenated to custom redact paths provided via `redact: ['custom.path']` or `redact: { paths: ['custom.path'] }`.

## 6.2.2

### Patch Changes

- **deps:** fast-redact ^3.5.0 ([#119](https://github.com/seek-oss/logger/pull/119))

  The mutation proof of concept that led us to [pin v3.3.0](https://github.com/seek-oss/logger/releases/tag/v6.2.1) has been fixed in [fast-redact@3.4.1](https://github.com/davidmarkclements/fast-redact/releases/tag/v3.4.1):

  ```typescript
  const logger = createLogger({
    redact: { censor: '???', paths: ['props.*'] },
  });

  const props = { name: 'PII' };

  logger.child({ props });
  logger.child({ props });

  console.log({ props });
  // { props: { name: 'PII' } }
  ```

  The `TypeError` proof of concept reported in [#14](https://github.com/seek-oss/logger/issues/14) has been fixed in [fast-redact@3.5.0](https://github.com/davidmarkclements/fast-redact/releases/tag/v3.5.0).

## 6.2.1

### Patch Changes

- **deps:** Pin `fast-redact@3.3.0` ([#114](https://github.com/seek-oss/logger/pull/114))

  This aims to discourage adoption of `fast-redact@3.4.0` as it [mutates input data](https://github.com/davidmarkclements/fast-redact/pull/67#issuecomment-1991563646) when you:

  1. Write application logs with `@seek/logger` or `pino`
  2. Configure the `redact` option with wildcards
  3. Use the logger in a slightly strange way, such as calling `.child()` with the same props more than once

  ```typescript
  const logger = createLogger({
    redact: { censor: '???', paths: ['props.*'] },
  });

  const props = { name: 'PII' };

  logger.child({ props });
  logger.child({ props });

  console.log({ props });
  // { props: { name: '???' } }
  ```

  If you suspect that your project meets these criteria, consider reviewing your lock file to ensure that `fast-redact@3.4.0` is not installed before merging this upgrade or a subsequent lock file maintenance PR.

## 6.2.0

### Minor Changes

- Omit request headers ([#92](https://github.com/seek-oss/logger/pull/92))

  `@seek/logger` now omits the following properties from `headers` and `req.headers` by default:

  - `x-envoy-attempt-count`
  - `x-envoy-decorator-operation`
  - `x-envoy-expected-rq-timeout-ms`
  - `x-envoy-external-address`
  - `x-envoy-internal`
  - `x-envoy-peer-metadata`
  - `x-envoy-peer-metadata-id`
  - `x-envoy-upstream-service-time`

  To opt out of this behaviour, provide an empty list or your own list of omissible request headers to `omitHeaderNames`:

  ```diff
  const logger = createLogger({
    name: 'my-app',
  + omitHeaderNames: ['dnt', 'sec-fetch-dest'],
  });
  ```

  You can also extend the default list like so:

  ```diff
  - import createLogger from '@seek/logger';
  + import createLogger, { DEFAULT_OMIT_HEADER_NAMES } from '@seek/logger';

  const logger = createLogger({
    name: 'my-app',
  + omitHeaderNames: [...DEFAULT_OMIT_HEADER_NAMES, 'dnt', 'sec-fetch-dest']
  });
  ```
