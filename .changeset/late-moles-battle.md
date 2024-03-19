---
'@seek/logger': patch
---

deps: fast-redact ^3.5.0

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
