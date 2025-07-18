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
import { createLogger } from '@seek/logger';

const logger = createLogger({
  eeeoh: {
    datadog: 'tin',
    use: 'environment',
  },
});
```

The `use: 'environment'` option is the recommended approach of sourcing application metadata from the workload hosting environment to annotate logs.

Automat v1+ workload hosting automatically adds base attributes to your logs through a telemetry agent.
You do not need to manually set `DD_` environment variables in this environment.

You may need to manually propagate environment variables for other workload hosting environments;
see [environment setup](#environment-setup) for detailed guidance.
An error is thrown if an environment variable is set to an invalid value (e.g. an empty string),
as we recommend failing fast over silently continuing in a misconfigured state.

- `DD_ENV`
- `DD_SERVICE`
- `DD_VERSION` | `VERSION`

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

The recommended approach to satisfy this requirement is sourcing application metadata from the workload hosting environment.

See [environment setup](#environment-setup) for detailed guidance per workload hosting environment;
in some cases,
metadata is derived from `DD_` environment variables:

```typescript
// process.env.DD_ENV = 'production';
// process.env.DD_SERVICE = 'my-component-name';
// process.env.DD_VERSION = 'abcdefa.123';

import { createLogger } from '@seek/logger';

const logger = createLogger({
  eeeoh: { datadog: 'tin', use: 'environment' },
});
```

`base` attributes may be set manually in your application code as an escape hatch.
Reach out if you are contemplating this option,
as we would be keen to understand if we can cater for your use case in a different way.

```diff
  import { createLogger } from '@seek/logger';
  import { Env } from 'skuba-dive';

  createLogger({
    base: {
-     environment: 'prod',
+     env: 'production',

-     app: 'my-app',
-     name: 'my-app',
+     service: 'my-component-name',

      version: Env.string('VERSION'),
    },
+   eeeoh: { datadog: 'tin' },
  });
```

`env` is typically one of the following values for internal consistency and forward compatibility with [Automat workload hosting](#automat-workload-hosting):

- `development` for pre-production deployment environments
- `production` for production deployment environments

`service` is the name of the [component], or the service name override on a [deployment] of the component.

`version` is a unique identifier for the current deployment.
Incorporate the commit hash and build number;
see subsequent sections for implementation guidance.

`@seek/logger` currently auto-generates `ddsource` and `ddtags`.
Reach out if you have a need to set custom values for these attributes.

## Environment setup

### Automat workload hosting

Components deployed to Automat v1+ workload hosting have metadata added to their logs by telemetry agents outside of the application process.
Configure the logger to assume environment-based configuration:

```typescript
// src/framework/logging.ts
const logger = createLogger({
  eeeoh: { datadog: 'tin', use: 'environment' },
});
```

`service` is derived from the following attributes:

```yaml
# config/{environment}/{region}/{deployment}.yaml
kind: Deployment
spec:
  serviceName: my-service-name-override
# overrides:
#   - type: webservice
#     properties:
#       env:
#         - name: DD_ENV
#         - value: 'Do not manually set DD_ environment variables like this'
```

```yaml
# catalog-info.yaml
kind: Component
metadata:
  name: my-component-name
```

### Gantry workload hosting

Components deployed to Gantry workload hosting receive a `VERSION` environment variable at runtime.

Pipe through `DD_ENV` and `DD_SERVICE` yourself.

We recommend setting `DD_ENV` to one of the following values for internal consistency and forward compatibility with Automat workload hosting:

- `development` for pre-production deployment environments
- `production` for production deployment environments

This environment variable can diverge from your Gantry environment name for now.
For example, your Gantry service may be deployed into a `prod` Gantry environment with the environment variable `DD_ENV: production`.

```yaml
# Values file: .gantry/prod.yml | values.yaml
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

  # If you're using the Gantry environment name in your application code,
  # that's fine but use a different environment variable than `DD_ENV`
  GANTRY_ENVIRONMENT_NAME: '{{.Environment}}'

# If you're using OTel, set `datadogEnvironmentName` and `useGantryServiceName`
openTelemetry:
  datadogEnvironmentName: '{{values "env"}}'
  enabled: true
  useGantryServiceName: true
```

Then, configure the logger to read these environment variables:

```typescript
// src/framework/logging.ts
const logger = createLogger({
  eeeoh: { datadog: 'tin', use: 'environment' },
});
```

### AWS Lambda via AWS CDK

Components deployed to AWS Lambda need to derive their own `VERSION`.
If you're using Buildkite, we recommend defining the following in your pipeline:

```yaml
# .buildkite/pipeline.yml
env:
  VERSION: ${BUILDKITE_COMMIT:0:7}.${BUILDKITE_BUILD_NUMBER}
```

Then, pipe through `DD_ENV`, `DD_SERVICE`, and `DD_VERSION` via the [Datadog CDK Construct].

```typescript
// infra/appStack.ts
import { DatadogLambda } from 'datadog-cdk-constructs-v2';
import { Env } from 'skuba-dive';

// Updated by https://github.com/seek-oss/rynovate
const DATADOG_EXTENSION_LAYER_VERSION = 64;

const worker = new aws_lambda_nodejs.NodejsFunction(this, 'worker', {
  environment: {
    // If you rely on a separate environment concept in your application code,
    // that's fine but use a different environment variable than `DD_ENV`
    MY_ENVIRONMENT_NAME: 'prod',
  },
  // ...
});

const apiKeySecret = aws_secretsmanager.Secret.fromSecretPartialArn(
  this,
  'datadog-api-key-secret',
  config.datadogApiKeySecretArn,
);

const datadog = new DatadogLambda(this, 'datadog', {
  // The construct sets these attributes as `DD_{KEY}` environment variables
  env: 'production',
  service: 'my-component-name',
  version: Env.string('VERSION'),

  // https://docs.datadoghq.com/serverless/libraries_integrations/cdk/#configuration
  addLayers: false,
  apiKeySecret,
  enableDatadogLogs: false, // Do not ship to Datadog directly; we aggregate logs in eeeoh first
  extensionLayerVersion: DATADOG_EXTENSION_LAYER_VERSION,
  flushMetricsToLogs: false,
  // ...
});

datadog.addLambdaFunctions([worker]);
```

If you do not intend to use the Datadog Lambda Extension,
you can set the environment variables manually.

> [!NOTE]
> Manually setting `DD_` environment variables is not necessary if you have set `extensionLayerVersion` above.

```typescript
const worker = new aws_lambda_nodejs.NodejsFunction(this, 'worker', {
  environment: {
    DD_ENV: 'production', // 'development' | 'production'
    DD_SERVICE: 'my-component-name',
    DD_VERSION: Env.string('VERSION'),

    // If you rely on a separate environment concept in your application code,
    // that's fine but use a different environment variable than `DD_ENV`
    MY_ENVIRONMENT_NAME: 'prod',
  },
  // ...
});
```

Finally, configure the logger to read these environment variables:

```typescript
// src/framework/logging.ts
const logger = createLogger({
  eeeoh: { datadog: 'tin', use: 'environment' },
});
```

### AWS Lambda via Serverless

Follow the [above CDK guidance](#aws-lambda-via-aws-cdk),
except to pipe through environment variables via the [Serverless plugin].

```yaml
# serverless.yml
custom:
  datadog:
    # The plugin sets these attributes as `DD_{KEY}` environment variables
    env: production # development | production
    service: my-component-name # Also consider ${self:service}
    version: ${env:VERSION}

    # https://docs.datadoghq.com/serverless/libraries_integrations/plugin/#configuration-parameters
    addLayers: false
    apiKeySecretArn: TODO
    enabled: true
    enableDDLogs: false # Do not ship to Datadog directly; we aggregate logs in eeeoh first
    injectLogContext: false
```

If you do not intend to use the Datadog Lambda Extension,
you can set the environment variables manually.

> [!NOTE]
> Manually setting `DD_` environment variables is not necessary if you have set `enabled: true` above.

```yaml
functions:
  Function:
    # ...
    environment:
      DD_ENV: production # development | production
      DD_SERVICE: my-component-name # Also consider ${self:service}
      DD_VERSION: ${env:VERSION}

      # If you rely on a separate environment concept in your application code,
      # that's fine but use a different environment variable than `DD_ENV`
      MY_ENVIRONMENT_NAME: prod
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
  eeeoh: {
    datadog: 'tin',
    use: 'environment',
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
    use: 'environment',
  },
});

logger.info('A tin message');
logger.warn('A silver message');
logger.error('A silver message');
```

### Tier by environment

To configure a lower tier for non-production environments,
define your own mapping of environment to tier:

```typescript
import { Env } from 'skuba-dive';

import { type Eeeoh, createLogger } from '.';

type Env = (typeof envs)[number];

const envs = ['development', 'production'] as const satisfies Eeeoh.Env[];

const env = Env.oneOf(envs)('DD_ENV');

const configs = {
  production: { datadog: 'tin' },
  development: { datadog: 'zero' },
} satisfies Record<Env, { datadog: Eeeoh.DatadogConfig }>;

const { datadog } = configs[env];

createLogger({
  eeeoh: {
    datadog,
    use: 'environment',
  },
});
```

### Tier override

Consider an application with logs where a `tin` default is generally fine.
However, it has a particular audit log that requires longer retention.

First, define the default:

```typescript
const logger = createLogger({
  eeeoh: {
    datadog: 'tin',
    use: 'environment',
  },
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
createLogger({
  eeeoh: {
    datadog: 'tin',
    use: 'environment', // DD_SERVICE: 'component-a' | 'component-b'
  },
});
```

### By tier

If your codebase makes widespread usage of multiple Datadog tiers,
you can create a separate logger per tier.

```typescript
export const tinLogger = createLogger({
  eeeoh: { datadog: 'tin', use: 'environment' },
});

export const bronzeLogger = createLogger({
  eeeoh: { datadog: 'bronze', use: 'environment' },
});
```

Or, you can accomplish a similar effect with [child loggers]:

```typescript
const noLogger = createLogger({
  eeeoh: { datadog: false, use: 'environment' },
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
