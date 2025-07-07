---
'@seek/logger': major
---

Apply `err` serializer to `error` key

This allows applications to opt in to migrating from `err` to `error`. The latter provides a better out-of-box experience in Datadog as a [standard attribute](https://docs.datadoghq.com/standard-attributes/?product=log&search=error).

If your application was already sending the `error` key, you may observe slightly different output. See [`pino-std-serializers`](https://github.com/pinojs/pino-std-serializers/tree/v7.0.0?tab=readme-ov-file#exportserrerror) for more information about the serializer.
