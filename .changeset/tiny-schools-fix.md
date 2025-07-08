---
'@seek/logger': major
---

Restrict manual eeeoh configuration

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

`@seek/logger` will now treat this as a type error to encourage adoption and stronger typing of our [built-in eeeoh integration](https://github.com/seek-oss/logger/blob/master/docs/eeeoh.md). Take particular note of the [new guidance](https://github.com/seek-oss/logger/blob/master/docs/eeeoh.md#base-attributes) on deriving `base` attributes before proceeding.

```typescript
// `Env` is like `process.env` but throws an error if the variable is not set.
// We recommend failing fast over silently continuing in a misconfigured state.
import { Env } from 'skuba-dive';

createLogger({
  base: {
    env: Env.string('DD_ENV'),
    service: Env.string('DD_SERVICE'),
    version: Env.string('DD_VERSION'),
  },
  eeeoh: { datadog: 'tin' },
});
```

The built-in integration does not support dual-shipping to Datadog & Splunk. If you use this feature, you may temporarily ignore the type error:

```typescript
createLogger({
  // @ts-expect-error - temporarily support dual shipping to Datadog & Splunk
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
        splunk: {
          index: 'my-index-name',
          source: 'my-source-name',
          sourcetype: '_json',
        },
      },
    },
  },
});
```
