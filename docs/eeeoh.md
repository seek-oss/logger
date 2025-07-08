# eeeoh

> [!IMPORTANT]
>
> The eeeoh integration is ready for user adoption and feedback.
>
> However, it is currently classified as an experimental feature to reflect the facts:
> it targets a platform that is still rapidly evolving,
> and is yet to go through an intensive feedback phase.
>
> Its design aims to be flexible and forward facing.
> We do not anticipate significant breaking changes at this time,
> and will do our best to minimise disruption while the feature stabilises.

This page contains usage guidance for SEEK's proprietary logging solution.

SEEKers can visit [Backstage] for more information.
These optional features are not relevant to applications that run outside of SEEK's standard workload hosting environments.

## Getting started

To opt in:

```typescript
// process.env.DD_ENV = 'production';
// process.env.DD_SERVICE = 'my-component-name';
// process.env.DD_VERSION = 'abcdefa.123';

import { createLogger } from '@seek/logger';

const logger = createLogger({
  eeeoh: { datadog: 'tin', fromEnvironment: true },
});
```

The `fromEnvironment` option assumes that you have the following environment variables set:

- `DD_ENV`
- `DD_SERVICE`
- `DD_VERSION` | `VERSION`

You can accomplish a similar effect by manually configuring the [base attributes](#base-attributes) like so:

```typescript
import { Eeeoh } from '@seek/logger';

// `Env` is like `process.env` but throws an error if the variable is not set.
// We recommend failing fast over silently continuing in a misconfigured state.
import { Env } from 'skuba-dive';

const base = {
  env: Env.oneOf(Eeeoh.envs)('DD_ENV'),
  service: Env.string('DD_SERVICE'),
  version: Env.string('DD_VERSION'),
} as const;

const logger = createLogger({
  base,
  eeeoh: { datadog: 'tin' },
});
```

Note that `@seek/logger` uses simplified syntax for its configuration options.
Logs are internally transformed to the output format expected by eeeoh:

```json
{
  "ddsource": "nodejs",
  "ddtags": "env:production,version:abcdefa.123",
  "eeeoh": {
    "logs": {
      "datadog": {
        "enabled": true,
        "tier": "tin"
      }
    }
  },
  "env": "production",
  "service": "my-component-name",
  "version": "abcdefa.123"
}
```

## Base attributes

eeeoh prescribes [Datadog unified service tagging] as a baseline.
Opting in mandates these attributes in the `base` configuration option:

```diff
import { createLogger } from '@seek/logger';
import { Env } from 'skuba-dive';

createLogger({
  base: {
-   environment: 'prod',
+   env: 'production',

-   app: 'my-app',
-   name: 'my-app',
+   service: 'my-component-name',

    version: Env.string('VERSION'),
  },
});
```

`env` is one of the following values for internal consistency:

- `development`
- `production`
- `sandbox`
- `test`

`service` is the name of the [component], or the service name override on a [deployment] of the component.

`version` is a unique identifier for the current deployment.
Incorporate the commit hash and build number;
see subsequent sections for implementation guidance.

`@seek/logger` currently auto-generates `ddsource` and `ddtags`.
Reach out if you have a need to set custom values for these attributes.

### Automat workload hosting

Components deployed to Automat workload hosting receive `DD_ENV`, `DD_SERVICE`, `DD_VERSION` environment variables at runtime.
Read the values `fromEnvironment` in your application code:

```typescript
// src/framework/logging.ts
const logger = createLogger({
  eeeoh: { datadog: 'tin', fromEnvironment: true },
});
```

`DD_SERVICE` is derived from the following attributes:

```yaml
# config/{environment}/{region}/{deployment}.yaml
kind: Deployment
spec:
  serviceName: my-service-name-override
```

```yaml
# catalog-info.yaml
kind: Component
metadata:
  name: my-component-name
```

### Gantry workload hosting

Components deployed to Gantry workload hosting receive a `VERSION` environment variable at runtime.

Pipe through `DD_ENV` and `DD_SERVICE` yourself:

```yaml
# Values file: .gantry/production.yml | values.yaml
env: production
serviceName: my-component-name
```

```yaml
# Resource file: gantry.yml | gantry.apply.yml | service.yaml
kind: Service
service: '{{values "serviceName"}}'
env:
  DD_ENV: '{{values "env"}}'
  DD_SERVICE: '{{values "serviceName"}}'
openTelemetry:
  useGantryServiceName: true
```

Then, read the values `fromEnvironment` in your application code:

```typescript
// src/framework/logging.ts
const logger = createLogger({
  eeeoh: { datadog: 'tin', fromEnvironment: true },
});
```

### AWS Lambda via AWS CDK

Components deployed to AWS need to derive their own `VERSION`.
If you're using Buildkite, we recommend defining the following in your pipeline:

```yaml
# .buildkite/pipeline.yml
env:
  VERSION: ${BUILDKITE_COMMIT:0:7}.${BUILDKITE_BUILD_NUMBER}
```

Then, pipe through `DD_ENV`, `DD_SERVICE`, and `DD_VERSION` via the [Datadog CDK Construct]:

```typescript
// infra/appStack.ts
import { DatadogLambda } from 'datadog-cdk-constructs-v2';
import { Env } from 'skuba-dive';

const worker = new aws_lambda_nodejs.NodejsFunction(this, 'worker', {
  // ...
});

const base = {
  env: 'production',
  service: 'my-component-name',
  version: Env.string('VERSION'),
} as const;

const datadog = new DatadogLambda(this, 'datadog', {
  // The construct sets these attributes as `DD_{KEY}` environment variables.
  ...base,
  // ...
});

datadog.addLambdaFunctions([worker]);
```

Finally, read the values `fromEnvironment` in your application code:

```typescript
// src/framework/logging.ts
const logger = createLogger({
  eeeoh: { datadog: 'tin', fromEnvironment: true },
});
```

### AWS Lambda via Serverless

Follow the [above CDK guidance](#aws-lambda-via-aws-cdk),
except to pipe through environment variables via the [Serverless plugin]:

```yaml
# serverless.yml
custom:
  datadog:
    env: production
    service: my-component-name
    version: ${env:VERSION}
```

## Event attributes

Some common attributes have recommended names.
These generally follow [Datadog standard attributes] for an improved out-of-box experience.

### `duration`

Use this key and nanosecond precision for improved compatibility with Datadog traces.

```diff
- logger.info({ latency }, 'I did a thing');
+ logger.info({ duration: spanInNs }, 'I did a thing');
```

### `error`

Use this key to capture error details in new code for improved compatibility with Datadog log management.

To include the error as the only additional attribute on the log:

```diff
- } catch (err) {
-   logger.error({ err }, 'Badness!')
+ } catch (error) {
+   logger.error(error, 'Badness!')
```

To include the error among other additional attributes on the log:

```diff
- } catch (err) {
-   logger.error({ err, id }, 'Badness!')
+ } catch (error) {
+   logger.error({ error, id }, 'Badness!')
```

Pass through the original error to the key.
Extracting specific properties is not recommended as you may drop valuable context such as the stack trace.

```diff
  } catch (error) {
-   logger.error({ error: error.message }, 'Badness!')
+   logger.error(error, 'Badness!')
```

`@seek/logger` automatically rewrites `err` to `error` when you opt in to eeeoh.
We may investigate codemods for existing code so we can remove this compatibility layer in a future major version.

### `x-request-id`

Use this key to include the correlating [RFC002] string identifier.

## Datadog log tiers

[Datadog tiering] allows applications to choose the appropriate feature set and retention period for their logs.

`@seek/logger` supports multiple approaches for configuring Datadog log tiers.

### Tier default

The simplest approach is to specify a static default tier:

```typescript
import { createLogger } from '@seek/logger';

const logger = createLogger({
  base,
  eeeoh: {
    datadog: 'tin',
  },
});

logger.info('A tin message');
logger.warn('A tin message');
logger.error('A tin message');
```

### Tier by level

To retain warnings for longer than informational logs,
you may specify level-based tiering:

```typescript
import { createLogger } from '@seek/logger';

const logger = createLogger({
  base,
  eeeoh: {
    datadog: [
      // Default
      'tin',
      {
        // All levels below warn will inherit `tin`
        warn: 'silver',
        // All levels above warn will inherit `silver`
      },
    ],
  },
});

logger.info('A tin message');
logger.warn('A silver message');
logger.error('A silver message');
```

### Tier override

Consider an application with logs where a `tin` default is generally fine.
However, it has a particular audit log that requires longer retention.

First, define the default:

```typescript
const logger = createLogger({
  base,
  eeeoh: { datadog: 'tin' },
});
```

Then, override the tier on a particular audit log:

```typescript
logger.info({ eeeoh: { datadog: 'tin-plus' } }, 'A silver message');
```

You may also selectively opt out of routing a particular log:

```typescript
logger.info({ eeeoh: { datadog: false } }, 'A message sent into the void');
```

## Multiple loggers

### By service

Some codebases may share logger code across multiple components.
However, each component requires a distinct `service` value.

We recommend varying `service` via environment variable:

```yaml
functions:
  FunctionA:
    environment:
      DD_SERVICE: component-a

  FunctionB:
    environment:
      DD_SERVICE: component-b
```

```typescript
import { Eeeoh } from '@seek/logger';
import { Env } from 'skuba-dive';

const base = {
  env: Env.oneOf(Eeeoh.envs)('DD_ENV'),
  service: Env.string('DD_SERVICE'), // 'component-a' | 'component-b'
  version: Env.string('DD_VERSION'),
} as const;
```

You can also share configuration options between loggers:

```typescript
const optionsForService = (service: string) =>
  ({
    base: {
      ...base,
      service,
    },
    eeeoh: { datadog: 'tin' },
  }) satisfies LoggerOptions;

export const aLogger = createLogger(optionsForService('component-a'));

export const bLogger = createLogger(optionsForService('component-b'));
```

### By tier

If your codebase makes widespread usage of multiple Datadog tiers,
you can create a separate logger per tier.

```typescript
export const tinLogger = createLogger({
  base,
  eeeoh: { datadog: 'tin' },
});

export const bronzeLogger = createLogger({
  base,
  eeeoh: { datadog: 'bronze' },
});
```

Or, you can accomplish a similar effect with [child loggers]:

```typescript
const noLogger = createLogger({
  base,
  eeeoh: { datadog: false },
});

export const tinLogger = noLogger.child({
  eeeoh: { datadog: 'tin' },
});

export const bronzeLogger = noLogger.child({
  eeeoh: { datadog: 'bronze' },
});
```

[Backstage]: https://backstage.myseek.xyz/docs/default/system/eeeoh
[child loggers]: https://getpino.io/#/docs/child-loggers
[component]: https://backstage.myseek.xyz/docs/default/component/automat-docs/v1-pre/concept-maps/automat/concepts/component/
[Datadog CDK Construct]: https://docs.datadoghq.com/serverless/libraries_integrations/cdk/#configuration
[Datadog standard attributes]: https://docs.datadoghq.com/standard-attributes/?product=log
[Datadog tiering]: https://backstage.myseek.xyz/docs/default/system/eeeoh/datadog-tier/
[Datadog unified service tagging]: https://docs.datadoghq.com/getting_started/tagging/unified_service_tagging/
[deployment]: https://backstage.myseek.xyz/docs/default/component/automat-docs/v1-pre/concept-maps/automat/concepts/deployment/
[RFC002]: https://backstage.myseek.xyz/docs/default/component/rfcs/RFC002-RequestIds/
[Serverless plugin]: https://docs.datadoghq.com/serverless/libraries_integrations/plugin/#configuration-parameters
