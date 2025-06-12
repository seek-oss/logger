---
'@seek/logger': major
---

Enforce stricter typing for logger methods

This is a **breaking change** to the types, improving type safety by enforcing stricter parameter typing on all logger methods.

Existing code that passes metadata after the message string will need to be updated. This pattern was previously silently ignoring the metadata, but now triggers a type error to prevent data loss.

**Before (no longer works):**

```ts
logger.error('my message', { err, metadata });
```

In this pattern, any metadata passed after the message string is not captured by the logger.

**After (correct usage):**

```ts
logger.error({ err, metadata }, 'my message');
```

This ensures all metadata is properly captured and logged.

The change also enforces type checking for placeholder arguments:

**Before (no longer works):**

```ts
logger.error(
  { err },
  'my message with string: %s and number: %d',
  99,
  'string',
);
```

**After (correct usage):**

```ts
logger.error(
  { err },
  'my message with string: %s and number: %d',
  'string',
  99,
);
```

This prevents type mismatches between placeholders and their corresponding arguments.
