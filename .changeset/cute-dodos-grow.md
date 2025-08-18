---
'@seek/logger': minor
---

Include `"ddsource": "nodejs"` attribute by default

This applies when the [`eeeoh` integration](https://github.com/seek-oss/logger/blob/master/docs/eeeoh.md) is not active and improves the Datadog experience for workloads that rely on external routing configuration (e.g. via LogCentral).
