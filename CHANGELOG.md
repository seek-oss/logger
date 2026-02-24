# @seek/logger

## 12.0.0

### Major Changes

- Require Node.js 22.14.0+ ([#283](https://github.com/seek-oss/logger/pull/283))

### Patch Changes

- **deps:** dtrim 1.13.3 ([#290](https://github.com/seek-oss/logger/pull/290))

  This prevents a runtime error when logging objects with strict this bindings

- **types:** Export `Eeeoh.Options` ([#274](https://github.com/seek-oss/logger/pull/274))

- Reduce bundle size ([#289](https://github.com/seek-oss/logger/pull/289))

## 11.3.0

### Minor Changes

- **deps:** Migrate `stdoutMock` test functionality from `fast-redact` to `@pinojs/redact` ([#263](https://github.com/seek-oss/logger/pull/263))

### Patch Changes

- **deps:** Pino 10 ([#262](https://github.com/seek-oss/logger/pull/262))

- **deps:** Sury 11.0.0-alpha.4 ([#258](https://github.com/seek-oss/logger/pull/258))

## 11.2.1

### Patch Changes

- **types:** Resolve `error TS2304: Cannot find name 'exports_d_exports'.` errors ([#245](https://github.com/seek-oss/logger/pull/245))

## 11.2.0

### Minor Changes

- **createLogger:** Redact request body in HTTP client errors ([#247](https://github.com/seek-oss/logger/pull/247))

  An HTTP request body _may_ contain sensitive information. While `@seek/logger` already avoids logging body content when it is supplied with a `req` or `res`, HTTP clients may include equivalent information in errors, creating another avenue for information exposure.

  `@seek/logger` now automatically redacts the following property paths under `err` or `error`:
  - `config.body`
  - `config.data`
  - `config.headers.user-email`
  - `response.config`

  If you currently rely on this incidental logging of request bodies for troubleshooting and you are confident that your request will never contain sensitive information, we recommend writing a separate log that includes the request body on a different property path. You can also reach out to discuss your use case.

## 11.1.1

### Patch Changes

- Improve compatibility with ESM/Bundlers ([#238](https://github.com/seek-oss/logger/pull/238))

- **deps:** Switch configuration parsing library from `pure-parse` to `sury` ([#237](https://github.com/seek-oss/logger/pull/237))

## 11.1.0

### Minor Changes

- **createLogger:** Include `"ddsource": "nodejs"` attribute by default ([#234](https://github.com/seek-oss/logger/pull/234))

  This applies when the [`eeeoh` integration](https://github.com/seek-oss/logger/blob/master/docs/eeeoh.md) is not active and improves the Datadog experience for workloads that rely on external routing configuration (e.g. via LogCentral).

### Patch Changes

- **eeeoh:** Omit `ddsource` and `ddtags` on `datadog: false` ([#234](https://github.com/seek-oss/logger/pull/234))

- **createLogger:** Avoid mutating `opts` argument ([#239](https://github.com/seek-oss/logger/pull/239))

- **types:** Make `logger.child()` bindings stricter ([#233](https://github.com/seek-oss/logger/pull/233))

## 11.0.0

This much-delayed release introduces an [**opt-in `eeeoh` integration**](https://github.com/seek-oss/logger/blob/master/docs/eeeoh.md) for SEEK's proprietary logging solution and Datadog observability practices. It supports standard `DD_` environment variables and [advanced log tiering behaviour](https://github.com/seek-oss/logger/blob/master/docs/eeeoh.md#datadog-log-tiers).

```typescript
// process.env.DD_ENV = 'production';
// process.env.DD_SERVICE = 'my-component-name';
// process.env.DD_VERSION = 'abcdefa.123';

const logger = createLogger({
  eeeoh: {
    datadog: 'tin',
    team: 'my-owner-name', // Optional
    use: 'environment',
  },
});

logger.info('Hello');
// {
//   "ddsource": "nodejs",
//   "ddtags": "env:production,team:my-owner-name,version:abcdefa.123",
//   "eeeoh": {
//     "logs": {
//       "datadog": {
//         "enabled": true,
//         "tier": "tin"
//       }
//     }
//   },
//   "env": "production",
//   "msg": "Hello",
//   "service": "my-component-name",
//   "version": "abcdefa.123"
// }
```

Our new [**Datadog logging guidance**](https://backstage.myseek.xyz/docs/default/component/sig-backend-tooling/guidance/logging/) on Backstage walks through recommendations to reduce gotchas and rework down the track.

While you don't need to upgrade overnight, we have tested the new version on multiple production components for several weeks, and more feedback will improve the Datadog experience for all 🙏

> [!WARNING]
>
> Propagating the `DD_ENV` environment variable to a workload container can unexpectedly change the `env` tag that [`hot-shots`](https://github.com/bdeitte/hot-shots) applies to custom metrics. If your Gantry service uses this package directly or alongside [`seek-datadog-custom-metrics`](https://github.com/seek-oss/datadog-custom-metrics) and [`seek-koala`](https://github.com/seek-oss/koala), heed our [Gantry logging guidance](https://backstage.myseek.xyz/docs/default/component/sig-backend-tooling/guidance/logging/gantry/#option-1-nodejs) to avoid a breaking change to custom metrics and dependent resources (dashboards, monitors, etc).

### Major Changes

- Restrict select log attributes ([#184](https://github.com/seek-oss/logger/pull/184))

  When specifying attributes in a child logger or log method:

  ```typescript
  logger.child({ env });
  //             ~~~

  logger.method({ env }, msg);
  //              ~~~
  ```

  The following keys are no longer recommended as they should be set upfront in `createLogger`:

  | Key        | Replacement                                                                                                     |
  | :--------- | :-------------------------------------------------------------------------------------------------------------- |
  | `ddsource` | [`eeeoh`](https://github.com/seek-oss/logger/blob/master/docs/eeeoh.md)                                         |
  | `ddtags`   | `eeeoh`                                                                                                         |
  | `eeeeoh`   | `eeeoh`                                                                                                         |
  | `eeoh`     | `eeeoh`                                                                                                         |
  | `env`      | [`eeeoh: { use: 'environment' }`](https://github.com/seek-oss/logger/blob/master/docs/eeeoh.md#use-environment) |
  | `service`  | `eeeoh: { use: 'environment' }`                                                                                 |
  | `version`  | `eeeoh: { use: 'environment' }`                                                                                 |

  The following keys now have specific TypeScript types associated with them:

  | Key            | Type     |
  | :------------- | :------- |
  | `duration`     | `number` |
  | `eeeoh`        | `object` |
  | `latency`      | `number` |
  | `x-request-id` | `string` |

  This change aims to drive alignment with [eeeoh](https://github.com/seek-oss/logger/blob/master/docs/eeeoh.md) & Datadog conventions for an improved out-of-box experience. Reach out if these new type definitions pose problems for your application.

  We also recommend reviewing our guidance on [logger types](https://github.com/seek-oss/logger/blob/master/docs/eeeoh.md) and reducing coupling to the `pino.Logger` type for forward compatibility.

- Apply `err` serializer to `error` key ([#184](https://github.com/seek-oss/logger/pull/184))

  This makes it easier to move between `logger({ err }, 'msg')` and `logger({ error }, 'msg')` . If your application was already sending the `error` key, you may observe slightly different output. See [`pino-std-serializers`](https://github.com/pinojs/pino-std-serializers/tree/v7.0.0?tab=readme-ov-file#exportserrerror) for more information about the serializer.

  The `error` key provides a better out-of-box experience in Datadog as a [standard attribute](https://docs.datadoghq.com/standard-attributes/?product=log&search=error). SEEK applications do not need to rewrite existing `err`s at this time; `@seek/logger` will automatically re-map `err` to `error` when you opt in to the [eeeoh integration](https://github.com/seek-oss/logger/blob/master/docs/eeeoh.md), and we may investigate a codemod or an equivalent bulk migration option in the future.

- Restrict manual `base.eeeoh` configuration ([#184](https://github.com/seek-oss/logger/pull/184))

  If you have an application that manually configures eeeoh routing like so:

  ```typescript
  createLogger({
    base: {
      ddsource: 'nodejs',
      ddtags: `version:${process.env.VERSION || 'missing'},env:${process.env.ENVIRONMENT || 'missing'}`,
      service: 'my-component-name',
      eeeoh: {
        logs: {
          datadog: {
            enabled: true,
            tier: 'tin',
          },
        },
      },
    },
  });
  ```

  `@seek/logger` will now treat this as a type error to encourage adoption and stronger typing of our [built-in eeeoh integration](https://github.com/seek-oss/logger/blob/master/docs/eeeoh.md). Take particular note of the [`use: 'environment'` prerequisites](https://github.com/seek-oss/logger/blob/master/docs/eeeoh.md#use-environment) before proceeding.

  ```typescript
  createLogger({
    eeeoh: { datadog: 'tin', use: 'environment' },
  });
  ```

  The built-in integration does not support configuring a Splunk destination; you can append a Splunk destination via your LogCentral strategy.

### Minor Changes

- **createDestination:** Remove `ddsource`, `eeeoh`, `env` and `service` with `mock: true` ([#218](https://github.com/seek-oss/logger/pull/218))

  These `mock` defaults can be overwritten; see our [documentation](https://github.com/seek-oss/logger/blob/master/docs/testing.md#createdestination) for more information.

- Export `createLogger` as a named export ([#189](https://github.com/seek-oss/logger/pull/189))

  This improves forward compatibility with TypeScript & ESM. While the named export is recommended, there is no immediate need to migrate existing codebases, and we've left the default export in place.

  **Migration:**

  ```diff
  - import createLogger from '@seek/logger';
  + import { createLogger } from '@seek/logger';
  ```

- Add eeeoh integration ([#184](https://github.com/seek-oss/logger/pull/184))

  See the [documentation](https://github.com/seek-oss/logger/blob/master/docs/eeeoh.md) for more information.

## 10.0.0

### Major Changes

- Enforce stricter typing for logger methods ([#182](https://github.com/seek-oss/logger/pull/182))

  This is a **breaking change** to the types, improving type safety by enforcing stricter parameter typing on all logger methods.

  Existing code that passes metadata after the message string will need to be updated. This pattern was previously silently ignoring the metadata, but now triggers a type error to prevent data loss.

  **Before (no longer works):**

  ```ts
  logger.error('my message', { err, metadata });
  ```

  In this pattern, any metadata passed after the message string is not captured by the logger.

  **After (correct usage):**

  ```ts
  logger.error({ err, metadata }, 'my message');
  ```

  This ensures all metadata is properly captured and logged.

- Drop support for Node.js 18.x ([#181](https://github.com/seek-oss/logger/pull/181))

  Node.js 18 reached EOL in April 2025. The minimum supported version is now Node.js 20.9.0.

### Patch Changes

- **createDestination:** Tweak returned `destination` type ([#177](https://github.com/seek-oss/logger/pull/177))

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
