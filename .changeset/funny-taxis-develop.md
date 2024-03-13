---
'@seek/logger': patch
---

deps: Pin `fast-redact@3.3.0`

This aims to discourage adoption of `fast-redact@3.4.0` as it [mutates input data](https://github.com/davidmarkclements/fast-redact/pull/67#issuecomment-1991563646) when you:

1. Write application logs with `@seek/logger` or `pino`
2. Configure the `redact` option with wildcards
3. Use the logger in a slightly strange way, such as calling `.child()` with the same props more than once

```typescript
const logger = createLogger({ redact: { censor: '???', paths: ['props.*'] } });

const props = { name: 'PII' };

logger.child({ props });
logger.child({ props });

console.log({ props });
// { props: { name: '???' } }
```

If you suspect that your project meets these criteria,
consider reviewing your lock file to ensure that `fast-redact@3.4.0` is not installed before merging this upgrade or a subsequent lock file maintenance PR.
