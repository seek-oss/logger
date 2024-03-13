# @seek/logger

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
