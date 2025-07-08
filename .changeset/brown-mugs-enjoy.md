---
'@seek/logger': major
---

Restrict select log attributes

When specifying attributes in a child logger or log method:

```typescript
logger.child({ env });
//             ~~~

logger.method({ env }, msg);
//              ~~~
```

The following keys now fail type checking:

- `ddsource`
- `ddtags`
- `eeeeoh`
- `eeoh`
- `env`
- `service`
- `version`

The following keys now have specific TypeScript types associated with them:

- `duration: number`
- `eeeoh: object`
- `latency: number`
- `x-request-id: string`

Reach out if these new type definitions pose problems for your application.
