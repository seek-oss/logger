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

| Key        | Replacement                                              |
| :--------- | :------------------------------------------------------- |
| `ddsource` | None; leave to `createLogger({ eeeoh })` to autogenerate |
| `ddtags`   | None; leave to `createLogger({ eeeoh })` to autogenerate |
| `eeeeoh`   | Set upfront via `createLogger({ eeeoh })`                |
| `eeoh`     | Set upfront via `createLogger({ eeeoh })`                |
| `env`      | Set upfront via `createLogger({ base: { env } })`        |
| `service`  | Set upfront via `createLogger({ base: { service } })`    |
| `version`  | Set upfront via `createLogger({ base: { version } })`    |

The following keys now have specific TypeScript types associated with them:

- `duration: number`
- `eeeoh: object`
- `latency: number`
- `x-request-id: string`

Reach out if these new type definitions pose problems for your application.
