# eeeoh

This page contains usage guidance for SEEK's proprietary logging solution.

SEEKers can view our [internal logging guidance] for more information.
These optional features are not relevant to applications that run outside of SEEK's standard workload hosting environments.

## Getting started

To opt in:

```typescript
import { createLogger } from '@seek/logger';

const logger = createLogger({
  eeeoh: {
    datadog: 'tin',
    team: 'my-owner-name', // Optional
    use: 'environment',
  },
});
```

### `use: 'environment'`

The `use: 'environment'` option is the recommended approach of sourcing application metadata from the workload hosting environment to annotate logs.

Automat v1+ workload hosting automatically adds base attributes to your logs through a telemetry agent.
You do not need to manually set `DD_` environment variables in this environment.

You may need to manually propagate environment variables for other workload hosting environments;
see our [internal logging guidance] for more details.
An error is thrown if an environment variable is set to an invalid value (e.g. an empty string),
as we recommend failing fast over silently continuing in a misconfigured state.

- `DD_ENV`
- `DD_SERVICE`
- `DD_VERSION` | `VERSION`

### `team`

The `team` option is optional and can be used to assign the [team] owner of the component or specific log.

### Output format

`@seek/logger` uses simplified syntax for its configuration options.
Logs are internally transformed to the output format expected by eeeoh:

```json
{
  "ddsource": "nodejs",
  "ddtags": "env:production,team:my-owner-name,version:abcdefa.123",
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

The recommended approach to satisfy this requirement is sourcing metadata from the workload hosting environment.

See our [internal logging guidance] for detailed guidance per workload hosting environment;
in some cases,
metadata is derived from `DD_` environment variables:

```typescript
// process.env.DD_ENV = 'production';
// process.env.DD_SERVICE = 'my-component-name';
// process.env.DD_VERSION = 'abcdefa.123';

import { createLogger } from '@seek/logger';

const logger = createLogger({
  eeeoh: { datadog: 'tin', team: 'my-owner-name', use: 'environment' },
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

`env` is typically one of the following values for internal consistency and forward compatibility with Automat workload hosting:

- `development` for pre-production deployment environments
- `production` for production deployment environments

`service` is the name of the [component], or the service name override on a [deployment] of the component.

`version` is a unique identifier for the current deployment.
Incorporate the commit hash and build number;
see subsequent sections for implementation guidance.

`@seek/logger` currently auto-generates `ddsource` and `ddtags`.
Reach out if you have a need to set custom values for these attributes.

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

### By team

If your component emits logs that correspond to different teams,
you can create a separate logger per team.

```typescript
export const teamALogger = createLogger({
  eeeoh: { datadog: 'tin', team: 'owner-a', use: 'environment' },
});

export const teamBLogger = createLogger({
  eeeoh: { datadog: 'tin', team: 'owner-b', use: 'environment' },
});
```

Or, you can accomplish a similar effect with [child loggers]:

```typescript
const noTeam = createLogger({
  eeeoh: { datadog: 'tin', use: 'environment' },
});

export const teamALogger = noTeam.child({
  eeeoh: { datadog: 'tin', team: 'owner-a' },
});

export const teamBLogger = noTeam.child({
  eeeoh: { datadog: 'tin', team: 'owner-b' },
});
```

Or, by individual log:

```typescript
logger.info(
  { eeeoh: { datadog: 'tin', team: 'owner-a' } },
  'A message for team A',
);

logger.info(
  { eeeoh: { datadog: 'tin', team: 'owner-b' } },
  'A message for team B',
);
```

[internal logging guidance]: https://backstage.myseek.xyz/docs/default/component/sig-backend-tooling/guidance/logging/
[child loggers]: https://getpino.io/#/docs/child-loggers
[component]: https://backstage.myseek.xyz/docs/default/component/automat-docs/v1-pre/concept-maps/automat/concepts/component/
[Datadog standard attributes]: https://docs.datadoghq.com/standard-attributes/?product=log
[Datadog tiering]: https://backstage.myseek.xyz/docs/default/system/eeeoh/datadog-tier/
[Datadog unified service tagging]: https://docs.datadoghq.com/getting_started/tagging/unified_service_tagging/
[deployment]: https://backstage.myseek.xyz/docs/default/component/automat-docs/v1-pre/concept-maps/automat/concepts/deployment/
[RFC002]: https://backstage.myseek.xyz/docs/default/component/rfcs/RFC002-RequestIds/
[team]: https://docs.datadoghq.com/getting_started/tagging/#overview
