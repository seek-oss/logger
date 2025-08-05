---
'@seek/logger': minor
---

Add eeeoh integration

This is an experimental feature that enables first-class support for SEEK's proprietary logging solution.

To opt in:

```typescript
// process.env.DD_ENV = 'production';
// process.env.DD_SERVICE = 'my-component-name';
// process.env.DD_VERSION = 'abcdefa.123';

const logger = createLogger({
  eeeoh: {
    datadog: 'tin',
    use: 'environment',
    team: 'my-owner-name', // Optional
  },
});
```

See the [documentation](https://github.com/seek-oss/logger/blob/master/docs/eeeoh.md) for more information.
