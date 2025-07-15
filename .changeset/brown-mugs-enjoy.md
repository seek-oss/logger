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

The following keys now fail type checking as they should be set upfront in `createLogger`:

| Key        | Replacement                                                                                                     |
| :--------- | :-------------------------------------------------------------------------------------------------------------- |
| `ddsource` | [`eeeoh`](https://github.com/seek-oss/logger/blob/master/docs/eeeoh.md)                                         |
| `ddtags`   | `eeeoh`                                                                                                         |
| `eeeeoh`   | `eeeoh`                                                                                                         |
| `eeoh`     | `eeeoh`                                                                                                         |
| `env`      | [`eeeoh: { use: 'environment' }`](https://github.com/seek-oss/logger/blob/master/docs/eeeoh.md#getting-started) |
| `service`  | `eeeoh: { use: 'environment' }`                                                                                 |
| `version`  | `eeeoh: { use: 'environment' }`                                                                                 |

The following keys now have specific TypeScript types associated with them:

| Key            | Type     |
| :------------- | :------- |
| `duration`     | `number` |
| `eeeoh`        | `object` |
| `latency`      | `number` |
| `x-request-id` | `string` |

This change aims to drive alignment with [eeeoh](https://github.com/seek-oss/logger/blob/master/docs/eeeoh.md) & Datadog conventions for an improved out-of-box experience. Reach out if these new type definitions pose problems for your application.
