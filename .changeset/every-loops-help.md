---
'@seek/logger': major
---

Enforce stricter typing for logger methods

This is a **breaking change** that improves type safety by enforcing stricter parameter typing on all logger methods.

Existing code that passes metadata as part of an object after the message will need to be updated.

**Before (no longer works):**

```ts
logger.error('my message', { error, metadata });
```

In this pattern, the metadata within the object `{ error, metadata }` will be lost.

**After (correct usage):**

```ts
logger.error({ error, metadata }, 'my message');
```

This ensures all metadata is properly captured and logged.
