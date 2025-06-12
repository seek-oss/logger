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

In this pattern, any metadata passed after the message string is not captured by the logger.

**After (correct usage):**

```ts
logger.error({ error, metadata }, 'my message');
```

This ensures all metadata is properly captured and logged.

The change also enforces type checking for placeholder arguments:

**Before (no longer works):**

```ts
logger.error('my message with string: %s and number: %d', 99, 'string');
```

**After (correct usage):**

```ts
logger.error('my message with string: %s and number: %d', 'string', 99);
```

This prevents type mismatches between placeholders and their corresponding arguments.
