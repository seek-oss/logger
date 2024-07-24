---
'@seek/logger': major
---

Apply trimming to serializers

Previously, [built-in serializers](https://github.com/seek-oss/logger/tree/54f16e17a9bb94261b9d2e4b77f04f55d5a3ab4c?tab=readme-ov-file#standardised-fields) and custom ones supplied via the [`serializers` option](https://github.com/pinojs/pino/blob/8aafa88139890b97aca0d32601cb5ffdd9bda1eb/docs/api.md#serializers-object) were not subject to [trimming](https://github.com/seek-oss/logger/tree/54f16e17a9bb94261b9d2e4b77f04f55d5a3ab4c?tab=readme-ov-file#trimming). This caused some emitted error logs to be extremely large.

Now, trimming is applied across all serializers by default. If you rely on deeply nested `err` properties to troubleshoot your application, tune the `maxObjectDepth` configured on your logger.
