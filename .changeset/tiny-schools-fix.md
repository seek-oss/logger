---
'@seek/logger': major
---

Restrict manual `base.eeeoh` configuration

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

`@seek/logger` will now treat this as a type error to encourage adoption and stronger typing of our [built-in eeeoh integration](https://github.com/seek-oss/logger/blob/master/docs/eeeoh.md). Take particular note of the [`fromEnvironment` prerequisites](https://github.com/seek-oss/logger/blob/master/docs/eeeoh.md#getting-started) and option to instead define [`base` attributes](https://github.com/seek-oss/logger/blob/master/docs/eeeoh.md#getting-started) before proceeding.

```typescript
createLogger({
  eeeoh: { datadog: 'tin', fromEnvironment: true },
});
```

The built-in integration does not support configuring a Splunk destination; you can append a Splunk destination via your LogCentral strategy.
