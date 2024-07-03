---
'@seek/logger': patch
---

createDestination: Use `Record` type for `stdoutMock.calls` and `stdoutMock.onlyCall()`

This allows you to destructure a call in your test code without the TypeScript compiler complaining:

```typescript
const { level, ...rest } = stdoutMock.onlyCall();
```
