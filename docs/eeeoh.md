# eeeoh

eeeoh is SEEK's proprietary logging solution.

SEEKers can visit [Backstage](https://backstage.myseek.xyz/docs/default/system/eeeoh) for more information.
These features are not relevant to applications that run outside of SEEK's standard workload hosting environments.

## Getting started

To opt in:

```typescript
import createLogger from '@seek/logger';

const logger = createLogger({
  eeeoh: {
    datadog: 'zero',
  },
  service: 'my-deployment-service-name',
});
```

## Datadog log tiers

### Tier default

```typescript
import createLogger from '@seek/logger';

const logger = createLogger({
  eeeoh: {
    datadog: 'tin',
  },
  service: 'my-deployment-service-name',
});

logger.info('A tin message');
logger.warn('A tin message');
logger.error('A tin message');
```

### Tier by level

```typescript
import createLogger from '@seek/logger';

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
  },
  service: '',
});

logger.info('A tin message');
logger.warn('A silver message');
logger.error('A silver message');
```

### Tier override

```typescript
import createLogger from '@seek/logger';

const logger = createLogger({
  eeeoh: {
    datadog: 'tin',
  },
  service: '',
});

logger.info({ eeeoh: { datadog: 'silver' } }, 'A silver message');
```
