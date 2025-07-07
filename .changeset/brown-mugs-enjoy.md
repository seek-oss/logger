---
'@seek/logger': major
---

Restrict select log attributes

The following bindings now fail type checking upon creating a child logger:

```typescript
logger.child({
  // bindings
});
```

- `ddsource`
- `ddtags`
- `env`
- `version`

The following fields now fail type checking upon composing a log:

```typescript
logger.method(
  {
    // fields
  },
  msg,
);
```

- `ddsource`
- `ddtags`
- `env`
- `service`
- `version`

The following keys now have specific TypeScript types associated with them:

- `duration: number`
- `eeeoh: object`
- `latency: number`
- `x-request-id: string`

Reach out if these new type definitions pose problems for your application.
