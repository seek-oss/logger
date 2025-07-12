---
'@seek/logger': major
---

Apply `err` serializer to `error` key

This makes it easier to move between `logger({ err }, 'msg')` and `logger({ error }, 'msg')` . If your application was already sending the `error` key, you may observe slightly different output. See [`pino-std-serializers`](https://github.com/pinojs/pino-std-serializers/tree/v7.0.0?tab=readme-ov-file#exportserrerror) for more information about the serializer.

The `error` key provides a better out-of-box experience in Datadog as a [standard attribute](https://docs.datadoghq.com/standard-attributes/?product=log&search=error). SEEK applications do not need to rewrite existing `err`s at this time; `@seek/logger` will automatically re-map `err` to `error` when you opt in to the [eeeoh integration](https://github.com/seek-oss/logger/blob/master/docs/eeeoh.md), and we may investigate a codemod or an equivalent bulk migration option in the future.
